"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { ColumnLayer, TextLayer } from "@deck.gl/layers";
import { AmbientLight, DirectionalLight, LightingEffect } from "@deck.gl/core";
import { DEFAULT_MAP_STYLE, FALLBACK_MAP_STYLE } from "@/lib/constants";

// 실제 다크 베이스맵 위, 활성(상승)·위기(하락) 동네만 3D 컬럼. 라벨·필터·자동회전 + 동 상세 그래픽 패널.
export interface Hero3DPoint {
  cd: string;
  name: string;
  sigungu?: string;
  lng: number;
  lat: number;
  klai: number;
  grade: string;
  momentum: number;
  reason?: string;
  d1: number;
  d2: number;
  d3: number;
  d4: number;
  gentriStage: number;
  marketVitality: string;
  kind: "riser" | "faller";
}

const LIGHTING = new LightingEffect({
  ambient: new AmbientLight({ color: [255, 255, 255], intensity: 1.15 }),
  sun: new DirectionalLight({ color: [255, 255, 255], intensity: 1.0, direction: [-1, -3, -1] }),
});
const ELEV = 240;
const RISE: [number, number, number] = [34, 197, 94];
const FALL: [number, number, number] = [244, 63, 94];
const VIT: Record<string, string> = { active: "활발", stable: "안정", shrinking: "위축" };
const GRADE_C: Record<string, string> = { S: "#0F6E5C", A: "#1E7A8C", B: "#3E9AA8", C: "#E2A33A", D: "#D2691E", E: "#A23A2A" };

type Filter = "all" | "rise" | "fall";

export default function LandingHero3DMap({ points }: { points: Hero3DPoint[] }) {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const overlayRef = useRef<MapboxOverlay | null>(null);
  const draggingRef = useRef(false);
  const autoRef = useRef(true);
  const rafRef = useRef(0);
  const [ready, setReady] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [auto, setAuto] = useState(true);
  const [labels, setLabels] = useState(true);
  const [selected, setSelected] = useState<Hero3DPoint | null>(points[0] ?? null);
  const [tip, setTip] = useState<{ x: number; y: number; p: Hero3DPoint } | null>(null);
  const selRef = useRef<Hero3DPoint | null>(points[0] ?? null);

  // 지도 초기화 (1회)
  useEffect(() => {
    const el = mapEl.current;
    if (!el || points.length === 0) return;
    const lngs = points.map((p) => p.lng);
    const lats = points.map((p) => p.lat);
    const map = new maplibregl.Map({
      container: el,
      style: DEFAULT_MAP_STYLE,
      center: [(Math.min(...lngs) + Math.max(...lngs)) / 2, (Math.min(...lats) + Math.max(...lats)) / 2],
      zoom: 7.2,
      pitch: 54,
      bearing: -18,
      attributionControl: false,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: true, visualizePitch: true }), "bottom-right");
    let fell = false;
    map.on("error", () => {
      if (fell) return;
      fell = true;
      try {
        map.setStyle(FALLBACK_MAP_STYLE as maplibregl.StyleSpecification);
      } catch {
        /* noop */
      }
    });
    const overlay = new MapboxOverlay({ interleaved: true, effects: [LIGHTING], layers: [] });
    overlayRef.current = overlay;
    map.addControl(overlay);
    map.on("dragstart", () => (draggingRef.current = true));
    map.on("dragend", () => (draggingRef.current = false));
    map.on("load", () => {
      map.resize();
      try {
        const b = new maplibregl.LngLatBounds();
        points.forEach((p) => b.extend([p.lng, p.lat]));
        map.fitBounds(b, { padding: 110, maxZoom: 8.8, duration: 0, pitch: 54, bearing: -18 });
      } catch {
        /* keep view */
      }
      setReady(true);
    });
    const t = setTimeout(() => map.resize(), 350);
    return () => {
      clearTimeout(t);
      cancelAnimationFrame(rafRef.current);
      map.remove();
      mapRef.current = null;
    };
  }, [points]);

  // 레이어(필터·선택·라벨 변화 시 갱신)
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay || !ready) return;
    const shown = points.filter((p) => (filter === "all" ? true : filter === "rise" ? p.kind === "riser" : p.kind === "faller"));
    const selCd = selected?.cd;
    overlay.setProps({
      layers: [
        new ColumnLayer<Hero3DPoint>({
          id: "klai-cols",
          data: shown,
          diskResolution: 12,
          radius: 1350,
          radiusUnits: "meters",
          extruded: true,
          pickable: true,
          elevationScale: ELEV,
          getPosition: (d) => [d.lng, d.lat],
          getElevation: (d) => d.klai,
          getFillColor: (d) => {
            const c = d.kind === "riser" ? RISE : FALL;
            return d.cd === selCd ? [255, 255, 255, 255] : [...c, 232];
          },
          getLineColor: (d) => (d.cd === selCd ? [255, 255, 255, 255] : [255, 255, 255, 55]),
          stroked: true,
          lineWidthMinPixels: 1,
          material: { ambient: 0.6, diffuse: 0.7, shininess: 32, specularColor: [60, 70, 95] },
          onHover: (info) => setTip(info.object ? { x: info.x, y: info.y, p: info.object as Hero3DPoint } : null),
          onClick: (info) => {
            if (info.object) {
              selRef.current = info.object as Hero3DPoint;
              setSelected(info.object as Hero3DPoint);
            }
          },
          updateTriggers: { getFillColor: [selCd], getLineColor: [selCd] },
        }),
        ...(labels
          ? [
              new TextLayer<Hero3DPoint>({
                id: "klai-labels",
                data: shown,
                characterSet: "auto",
                fontFamily: "Pretendard, system-ui, sans-serif",
                fontWeight: 700,
                getPosition: (d) => [d.lng, d.lat, d.klai * ELEV + 900],
                getText: (d) => d.name,
                getSize: 13,
                getColor: [255, 255, 255, 240],
                getPixelOffset: [0, -8],
                background: true,
                getBackgroundColor: [13, 43, 94, 205],
                backgroundPadding: [5, 2, 5, 2],
                getBorderColor: [255, 255, 255, 40],
                getBorderWidth: 1,
                fontSettings: { sdf: false },
              }),
            ]
          : []),
      ],
    });
  }, [ready, filter, labels, selected, points]);

  // 자동 회전 (rAF, 드래그 중 일시정지)
  useEffect(() => {
    autoRef.current = auto;
    cancelAnimationFrame(rafRef.current);
    if (!auto) return;
    const spin = () => {
      const map = mapRef.current;
      if (map && autoRef.current && !draggingRef.current) {
        map.setBearing(map.getBearing() + 0.12);
      }
      rafRef.current = requestAnimationFrame(spin);
    };
    rafRef.current = requestAnimationFrame(spin);
    return () => cancelAnimationFrame(rafRef.current);
  }, [auto]);

  const btn = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-[12px] font-bold transition ${active ? "bg-amber text-onaccent" : "bg-[#0D2B5E]/80 text-white/80 hover:text-white"}`;

  return (
    <div className="relative h-full w-full overflow-hidden bg-navy">
      <div ref={mapEl} className="h-full w-full" />

      {/* 타이틀 (좌상단) */}
      <div className="pointer-events-none absolute left-4 top-4 z-10 max-w-[60%] sm:left-6 sm:top-6">
        <span className="klai-eyebrow !text-[#9be15d]">3D Live Map · 활성 · 위기</span>
        <h2 className="mt-1 text-[1.5rem] font-extrabold leading-tight tracking-tight text-white drop-shadow sm:text-[2.1rem]">
          지금 <span className="text-[#bef264]">움직이는</span> 동네만,<br className="hidden sm:block" /> 지도 위 3D로
        </h2>
        <p className="mt-1 text-[12.5px] text-white/70">기둥 = KLAI · 🟢 상승 / 🔴 하락 · 드래그·휠로 탐색</p>
      </div>

      {/* 컨트롤 (우상단): 필터 + 라벨 + 자동회전 */}
      <div className="absolute right-3 top-4 z-10 flex flex-wrap items-center justify-end gap-1.5 sm:right-6 sm:top-6">
        {(["all", "rise", "fall"] as Filter[]).map((f) => (
          <button key={f} type="button" onClick={() => setFilter(f)} className={btn(filter === f)}>
            {f === "all" ? "전체" : f === "rise" ? "📈 상승" : "📉 하락"}
          </button>
        ))}
        <button type="button" onClick={() => setLabels((v) => !v)} className={btn(labels)}>🏷 라벨</button>
        <button type="button" onClick={() => setAuto((v) => !v)} className={btn(auto)}>↻ 자동회전</button>
        <Link href="/map" className="rounded-full bg-amber px-3 py-1.5 text-[12px] font-extrabold text-onaccent">전체 지도 →</Link>
      </div>

      {/* 호버 툴팁 */}
      {tip && (
        <div className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-lg bg-[#0D2B5E] px-2.5 py-1.5 text-white shadow-xl ring-1 ring-white/10" style={{ left: tip.x, top: tip.y - 12 }}>
          <div className="text-[12px] font-extrabold">{tip.p.name}</div>
          <div className="text-[10.5px] text-[#cdd8ec]">KLAI {tip.p.klai} · 모멘텀 {tip.p.momentum >= 0 ? "+" : ""}{tip.p.momentum}</div>
        </div>
      )}

      {/* 동 상세 그래픽 패널 (우측, 클릭/기본 선택) */}
      {selected && (
        <div className="absolute bottom-3 right-3 z-20 w-[min(92vw,300px)] rounded-2xl border border-white/10 bg-[#0D2B5E]/95 p-4 shadow-2xl backdrop-blur-sm sm:bottom-6 sm:right-6">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-white/60">{selected.sigungu ?? "전국"}</div>
              <div className="truncate text-[17px] font-extrabold text-white">{selected.name}</div>
            </div>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[15px] font-black text-white" style={{ background: GRADE_C[selected.grade] ?? "#888" }}>{selected.grade}</span>
          </div>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-[2rem] font-black leading-none tabular-nums text-white">{selected.klai}</span>
            <span className="pb-1 text-[12px] font-bold" style={{ color: selected.kind === "riser" ? "#86efac" : "#fda4af" }}>
              {selected.kind === "riser" ? "▲" : "▼"} 모멘텀 {selected.momentum >= 0 ? "+" : ""}{selected.momentum}
            </span>
          </div>
          {/* 4축 막대 그래프 */}
          <div className="mt-3 space-y-1.5">
            {([["인구·지속", selected.d1], ["경제·상권", selected.d2], ["공간·물리", selected.d3], ["인식·감성", selected.d4]] as [string, number][]).map(([k, v]) => (
              <div key={k} className="flex items-center gap-2">
                <span className="w-12 shrink-0 text-[10.5px] text-white/60">{k}</span>
                <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/12">
                  <div className="absolute inset-y-0 left-0 rounded-full bg-[#9be15d]" style={{ width: `${Math.max(0, Math.min(100, v))}%` }} />
                </div>
                <span className="w-6 shrink-0 text-right text-[10.5px] font-bold tabular-nums text-white/85">{Math.round(v)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10.5px] font-bold text-white/85">젠트리 {selected.gentriStage}단계</span>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10.5px] font-bold text-white/85">시장 {VIT[selected.marketVitality] ?? "—"}</span>
            {selected.reason && <span className="rounded-full px-2 py-0.5 text-[10.5px] font-bold" style={{ background: "rgba(155,225,93,.18)", color: "#bef264" }}>{selected.reason}</span>}
          </div>
          <Link href={`/diagnose?admCd=${selected.cd}`} className="btn-glow mt-3 block rounded-full bg-amber py-2 text-center text-[13px] font-extrabold text-onaccent">이 동네 지번 진단 →</Link>
        </div>
      )}

      {/* 범례 (좌하단) */}
      <div className="pointer-events-none absolute bottom-3 left-4 z-10 flex items-center gap-3 rounded-full bg-[#0D2B5E]/80 px-3 py-1.5 text-[11px] font-bold text-white/85 sm:left-6">
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: "rgb(34,197,94)" }} /> 상승</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: "rgb(244,63,94)" }} /> 하락</span>
        <span className="text-white/55">기둥 높이 = KLAI</span>
      </div>
    </div>
  );
}
