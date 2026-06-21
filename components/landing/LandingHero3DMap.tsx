"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { ColumnLayer } from "@deck.gl/layers";
import { AmbientLight, DirectionalLight, LightingEffect } from "@deck.gl/core";
import { DEFAULT_MAP_STYLE, FALLBACK_MAP_STYLE } from "@/lib/constants";

// 실제 다크 베이스맵 위에 활성(상승)·위기(하락) 동네만 3D 컬럼으로. 기둥 높이=KLAI, 색=상승/하락.
export interface Hero3DPoint {
  name: string;
  sigungu?: string;
  lng: number;
  lat: number;
  klai: number;
  momentum: number;
  kind: "riser" | "faller";
  reason?: string;
}

const LIGHTING = new LightingEffect({
  ambient: new AmbientLight({ color: [255, 255, 255], intensity: 1.1 }),
  sun: new DirectionalLight({ color: [255, 255, 255], intensity: 1.05, direction: [-1, -3, -1] }),
});

const ELEV = 240;

export default function LandingHero3DMap({ points }: { points: Hero3DPoint[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<{ x: number; y: number; p: Hero3DPoint } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || points.length === 0) return;
    const lngs = points.map((p) => p.lng);
    const lats = points.map((p) => p.lat);
    const center: [number, number] = [(Math.min(...lngs) + Math.max(...lngs)) / 2, (Math.min(...lats) + Math.max(...lats)) / 2];

    const map = new maplibregl.Map({
      container: el,
      style: DEFAULT_MAP_STYLE,
      center,
      zoom: 7.4,
      pitch: 52,
      bearing: -17,
      attributionControl: false,
      interactive: true,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: true, visualizePitch: true }), "bottom-right");

    let fellBack = false;
    map.on("error", () => {
      if (fellBack) return;
      fellBack = true;
      try {
        map.setStyle(FALLBACK_MAP_STYLE as maplibregl.StyleSpecification);
      } catch {
        /* noop */
      }
    });

    const overlay = new MapboxOverlay({ interleaved: true, effects: [LIGHTING], layers: [] });
    map.addControl(overlay);

    const build = () => {
      overlay.setProps({
        layers: [
          new ColumnLayer<Hero3DPoint>({
            id: "klai-cols",
            data: points,
            diskResolution: 10,
            radius: 1400,
            radiusUnits: "meters",
            extruded: true,
            pickable: true,
            elevationScale: ELEV,
            getPosition: (d) => [d.lng, d.lat],
            getElevation: (d) => d.klai,
            getFillColor: (d) => (d.kind === "riser" ? [34, 197, 94, 235] : [244, 63, 94, 235]),
            getLineColor: [255, 255, 255, 50],
            stroked: true,
            lineWidthMinPixels: 1,
            material: { ambient: 0.6, diffuse: 0.7, shininess: 32, specularColor: [60, 70, 95] },
            onHover: (info) => setTip(info.object ? { x: info.x, y: info.y, p: info.object as Hero3DPoint } : null),
          }),
        ],
      });
    };

    map.on("load", () => {
      map.resize();
      try {
        const b = new maplibregl.LngLatBounds();
        points.forEach((p) => b.extend([p.lng, p.lat]));
        map.fitBounds(b, { padding: 80, maxZoom: 9, duration: 0, pitch: 52, bearing: -17 });
      } catch {
        /* keep initial view */
      }
      build();
    });
    const t = setTimeout(() => map.resize(), 350);

    return () => {
      clearTimeout(t);
      map.remove();
    };
  }, [points]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div ref={ref} className="h-full w-full" />
      {tip && (
        <div
          className="pointer-events-none absolute z-20 min-w-[140px] -translate-x-1/2 -translate-y-full rounded-xl bg-[#0D2B5E] px-3 py-2 shadow-xl ring-1 ring-white/10"
          style={{ left: tip.x, top: tip.y - 14 }}
        >
          <div className="text-[13px] font-extrabold text-white">{tip.p.name}</div>
          <div className="text-[11px] text-[#cdd8ec]">
            KLAI {tip.p.klai} · 모멘텀 {tip.p.momentum >= 0 ? "+" : ""}
            {tip.p.momentum}
          </div>
          {tip.p.reason && (
            <div className="text-[11px] font-bold" style={{ color: tip.p.kind === "riser" ? "#34d399" : "#fb7185" }}>
              {tip.p.reason}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
