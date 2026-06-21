"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { GeoJsonLayer, PolygonLayer, ScatterplotLayer } from "@deck.gl/layers";
import { AmbientLight, DirectionalLight, LightingEffect, type Layer } from "@deck.gl/core";
import "maplibre-gl/dist/maplibre-gl.css";

// 이 배율 이상 확대하면 세부(지번·필지·로컬상점) 모드
const DETAIL_ZOOM = 13.0; // 골목·필지 드릴다운 진입 줌 (낮출수록 일찍 세분)

interface DetailData {
  parcels: { id: string; g: number; v: number; polygon: number[][] }[];
  pois: { lng: number; lat: number; name: string; cat: string; label: string; metric: number; color: number[] }[];
  tooWide?: boolean;
}

// 성장지수(0~100) → 색 (어두운 슬레이트 → 밝은 청록 성장)
function growthColor(g: number): [number, number, number, number] {
  const t = Math.max(0, Math.min(1, g / 100));
  const lerp = (a: number, b: number) => Math.round(a + (b - a) * t);
  return [lerp(40, 18), lerp(58, 180), lerp(92, 130), 210];
}

import type { DistrictFeature, DistrictProps, LayerId } from "@/lib/types";
import { DEFAULT_MAP_STYLE, FALLBACK_MAP_STYLE, INITIAL_VIEW, REGION_PRESETS, TOUR_STOPS } from "@/lib/constants";
import { useMapStore } from "@/lib/store";

import { LayerControl } from "./LayerControl";
import { Legend } from "./Legend";
import { TimeSlider } from "./TimeSlider";
import { SearchBox } from "./SearchBox";
import { PlacePanel } from "./PlacePanel";
import { ProvisionalBadge } from "@/components/ui";

export interface MapHighlights {
  riser?: { admCd2: string; name: string; sigungu?: string; klai: number; grade: string; momentum: number };
  gentri?: { admCd2: string; name: string; sigungu?: string; klai: number; grade: string; stage: number };
  decline?: { admCd2: string; name: string; sigungu?: string; klai: number; grade: string; momentum: number };
  hotspots?: { admCd2: string; name: string; sigungu?: string; lng: number; lat: number; momentum: number; klai: number; grade: string }[];
  count?: number;
}

interface HoverInfo {
  x: number;
  y: number;
  name: string;
  sub: string;
  label: string;
  color: string;
}

// 레이어별 압축 페이로드 (서버 /api/mapdata)
interface MapData {
  layer: LayerId;
  periods: string[];
  last: string;
  byPlace: Record<string, { c: number[][]; l: string[]; e: number[]; a?: number[] }>;
}

const GRAY: [number, number, number, number] = [60, 75, 100, 110];

// 네온 변환 — 채도·명도 부스트 (야간 테마)
function neonize(c: [number, number, number, number]): [number, number, number, number] {
  const lift = (v: number) => Math.min(255, Math.round(v * 1.32 + 28));
  return [lift(c[0]), lift(c[1]), lift(c[2]), 255];
}

// 3D 조명 — 솟아오른 데이터에 입체 음영
const LIGHTING = new LightingEffect({
  ambient: new AmbientLight({ color: [255, 255, 255], intensity: 1.5 }),
  sun: new DirectionalLight({ color: [255, 250, 240], intensity: 1.0, direction: [-1, -3, -1] }),
  sky: new DirectionalLight({ color: [180, 205, 255], intensity: 0.55, direction: [1, 1, -1] }),
});

export function MapExplorer({ highlights }: { highlights: MapHighlights }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const overlayRef = useRef<MapboxOverlay | null>(null);
  const dataCache = useRef<Map<LayerId, MapData>>(new Map());

  const [mapReady, setMapReady] = useState(false);
  const [features, setFeatures] = useState<DistrictFeature[]>([]);
  const [places, setPlaces] = useState<DistrictProps[]>([]);
  const [data, setData] = useState<MapData | null>(null);
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const [pulse, setPulse] = useState(0);
  const [introOpen, setIntroOpen] = useState(true);
  const [is3D, setIs3D] = useState(true);
  const [zoom, setZoom] = useState(INITIAL_VIEW.zoom);
  const [neon, setNeon] = useState(false);
  const [tourLabel, setTourLabel] = useState<string | null>(null);
  const tourRef = useRef({ cancel: false });
  const [detail, setDetail] = useState<DetailData | null>(null);
  const [poiHover, setPoiHover] = useState<{ x: number; y: number; name: string; label: string; metric: number; color: number[] } | null>(null);
  // 지번 단위 — 확대 후 클릭 시 VWorld 역지오코딩으로 실제 필지 정보
  const [parcel, setParcel] = useState<{
    x: number;
    y: number;
    loading?: boolean;
    data?: { jibun: string; road: string; pnu: string; bjdong: string; admName: string; admCd: string };
  } | null>(null);
  const detailTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { layer, periodIndex, periods, selected, hovered, setPeriods, select, setHovered } = useMapStore();

  // 줌이 깊어질수록 높이 스케일을 줄여 화면상 막대 높이를 ~일정하게 유지
  const elevationScale = useMemo(() => 1100 * Math.pow(2, INITIAL_VIEW.zoom - zoom), [zoom]);

  // ── 1) 경계 GeoJSON 1회 로드 (전국 ~수천 동) ──────────────
  useEffect(() => {
    let alive = true;
    // 실패 시(서버 재시작·일시 끊김) 재시도 — 비면 지도가 안 그려지므로 더 끈질기게
    const load = (attempt = 0) => {
      fetch("/api/geojson")
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        .then((gj: { features: DistrictFeature[] }) => {
          if (!alive) return;
          setFeatures(gj.features);
          setPlaces(gj.features.map((f) => f.properties));
        })
        .catch(() => {
          if (alive && attempt < 6) setTimeout(() => load(attempt + 1), 1200);
        });
    };
    load();
    return () => {
      alive = false;
    };
  }, []);

  // ── 2) 레이어별 색·라벨 로드 (클라 캐시) ──────────────────
  useEffect(() => {
    const cached = dataCache.current.get(layer);
    if (cached) {
      setData(cached);
      return;
    }
    let alive = true;
    // 실패 시(서버 재시작·일시 네트워크 끊김) 조용히 재시도 — uncaught rejection 방지
    const load = (attempt = 0) => {
      fetch(`/api/mapdata?layer=${layer}`)
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        .then((d: MapData) => {
          if (!alive) return;
          dataCache.current.set(layer, d);
          setData(d);
        })
        .catch(() => {
          if (alive && attempt < 4) setTimeout(() => load(attempt + 1), 1200);
        });
    };
    load();
    return () => {
      alive = false;
    };
  }, [layer]);

  // 기간 축 초기화
  useEffect(() => {
    if (data?.periods?.length) setPeriods(data.periods);
  }, [data?.periods, setPeriods]);

  const period = periods[periodIndex];

  // ── 지도 + deck 오버레이 1회 생성 ──────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: DEFAULT_MAP_STYLE,
      center: [INITIAL_VIEW.longitude, INITIAL_VIEW.latitude],
      zoom: INITIAL_VIEW.zoom,
      pitch: 48, // 3D 기본 틸트 — 데이터가 솟아오르게
      maxPitch: 85,
      attributionControl: false,
    });
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "bottom-right");
    // interleaved: 지도 캔버스에 합쳐 렌더 → 지도가 모든 마우스 조작을 직접 받음(자유 회전·확대축소)
    const overlay = new MapboxOverlay({ interleaved: true, layers: [], effects: [LIGHTING] });
    map.addControl(overlay);
    mapRef.current = map;
    overlayRef.current = overlay;

    // 마우스 조작 — 표준 3D 지도 방식 (모두 마우스로):
    //  · 드래그 = 이동(pan)              · 우클릭/Ctrl+드래그 = 회전(z축)+기울이기(x축)
    //  · 휠 = 확대·축소                   · 두손가락 = 회전/줌/기울이기
    map.scrollZoom.enable();
    map.doubleClickZoom.enable();
    map.keyboard.enable();
    map.dragPan.enable(); // 드래그 = 이동(클릭한 상태로 이동)
    map.dragRotate.enable(); // 우클릭/Ctrl+드래그 = 회전 + 기울이기(pitchWithRotate)
    map.touchZoomRotate.enable();
    map.touchZoomRotate.enableRotation();
    map.touchPitch.enable();
    map.getCanvasContainer().style.cursor = "grab";

    map.on("zoomend", () => setZoom(map.getZoom()));
    // 사용자가 이동/회전을 시작하면 진행 중인 투어 중단
    const stopTour = () => {
      tourRef.current.cancel = true;
      setTourLabel(null);
    };
    map.on("dragstart", stopTour);
    map.on("rotatestart", stopTour);

    // 지번 단위 — 확대(>=DETAIL_ZOOM) 후 클릭 시 클릭 지점의 실제 지번 역지오코딩
    map.on("click", async (e) => {
      if (map.getZoom() < DETAIL_ZOOM) return; // 더 세부적으로: 확대했을 때만 지번
      const { lng, lat } = e.lngLat;
      const x = e.point.x,
        y = e.point.y;
      setParcel({ x, y, loading: true });
      try {
        const r = await fetch(`/api/reverse?lng=${lng.toFixed(6)}&lat=${lat.toFixed(6)}`);
        if (!r.ok) return setParcel(null);
        const data = await r.json();
        setParcel({ x, y, data });
      } catch {
        setParcel(null);
      }
    });
    map.on("movestart", () => setParcel(null)); // 이동/확대 시 팝업 정리

    // 줌인 시 세부(지번·상점) 데이터 로드 (디바운스)
    const fetchDetail = () => {
      if (detailTimer.current) clearTimeout(detailTimer.current);
      detailTimer.current = setTimeout(async () => {
        const z = map.getZoom();
        if (z < DETAIL_ZOOM) {
          setDetail(null);
          return;
        }
        const b = map.getBounds();
        const bbox = `${b.getWest().toFixed(5)},${b.getSouth().toFixed(5)},${b.getEast().toFixed(5)},${b.getNorth().toFixed(5)}`;
        try {
          const r = await fetch(`/api/detail?bbox=${bbox}`);
          const d = (await r.json()) as DetailData;
          setDetail(d.tooWide ? null : d);
        } catch {
          /* noop */
        }
      }, 220);
    };
    map.on("moveend", fetchDetail);

    let swapped = false;
    map.on("error", (e) => {
      const msg = String(e?.error?.message ?? "");
      if (!swapped && /style|fetch|load|network|http/i.test(msg)) {
        swapped = true;
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          map.setStyle(FALLBACK_MAP_STYLE as any);
        } catch {
          /* noop */
        }
      }
    });
    setMapReady(true);
    map.on("load", () => setMapReady(true));
    map.on("idle", () => setMapReady(true));

    return () => {
      map.remove();
      mapRef.current = null;
      overlayRef.current = null;
    };
  }, []);

  // 펄스 (경보 레이어)
  const alertActive = layer === "gentri" || layer === "narrative";
  useEffect(() => {
    if (!alertActive) return;
    const id = setInterval(() => setPulse((p) => (p + 1) % 2), 280);
    return () => clearInterval(id);
  }, [alertActive]);

  // ── deck 레이어 빌드 ───────────────────────────────────────
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay || !mapReady || features.length === 0 || !data) return;
    const t = periodIndex;
    const byPlace = data.byPlace;
    const detailActive = !!(detail && detail.parcels.length);

    const colorOf = (cd: string): [number, number, number, number] => {
      const e = byPlace[cd];
      let base = (e?.c?.[t] ?? GRAY) as [number, number, number, number];
      if (neon) base = neonize(base);
      if (selected === cd) return [base[0], base[1], base[2], detailActive ? 120 : 255];
      if (selected && selected !== cd) return [base[0], base[1], base[2], Math.round(base[3] * 0.32)];
      // 세부 모드: 행정동은 옅은 베이스로 낮춤
      if (detailActive) return [base[0], base[1], base[2], 60];
      return base;
    };

    const elevOf = (cd: string) => byPlace[cd]?.e?.[t] ?? 0;

    const fill = new GeoJsonLayer({
      id: "klai-fill",
      data: features,
      pickable: true,
      autoHighlight: true,
      highlightColor: neon ? [255, 255, 255, 90] : [255, 255, 255, 70],
      stroked: !is3D || neon || detailActive,
      filled: true,
      extruded: is3D && !detailActive,
      getElevation: (f) => elevOf((f as DistrictFeature).properties.admCd2),
      elevationScale: is3D ? elevationScale : 0,
      // 네온은 무광(언릿) 플랫 발광, 일반은 입체 음영
      material: neon ? false : { ambient: 0.55, diffuse: 0.65, shininess: 24, specularColor: [50, 62, 88] },
      getFillColor: (f) => colorOf((f as DistrictFeature).properties.admCd2),
      getLineColor: (f) => {
        const cd = (f as DistrictFeature).properties.admCd2;
        if (selected === cd) return [234, 241, 250, 255];
        if (neon) {
          const c = colorOf(cd);
          return [Math.min(255, c[0] + 40), Math.min(255, c[1] + 60), Math.min(255, c[2] + 80), 150];
        }
        return [11, 27, 48, 120];
      },
      getLineWidth: (f) => (selected === (f as DistrictFeature).properties.admCd2 ? 2.4 : 0.4),
      lineWidthUnits: "pixels",
      lineWidthMinPixels: 0.3,
      transitions: { getFillColor: { duration: 550 }, getElevation: { duration: 700 } },
      updateTriggers: {
        getFillColor: [layer, t, selected, pulse, data, neon],
        getElevation: [layer, t, data, is3D],
        getLineColor: [selected, neon, layer, t],
        getLineWidth: [selected],
      },
      onHover: (info) => {
        const obj = info.object as DistrictFeature | undefined;
        if (obj && info.x != null) {
          const e = byPlace[obj.properties.admCd2];
          const c = e?.c?.[t] ?? GRAY;
          setHover({
            x: info.x,
            y: info.y,
            name: obj.properties.name,
            sub: `${obj.properties.sido} ${obj.properties.sigungu} · ${obj.properties.typology}`,
            label: e?.l?.[t] ?? "—",
            color: `rgb(${c[0]},${c[1]},${c[2]})`,
          });
          setHovered(obj.properties.admCd2);
        } else {
          setHover(null);
          setHovered(null);
        }
      },
      onClick: (info) => {
        const obj = info.object as DistrictFeature | undefined;
        if (!obj) return;
        // 지번 세부 줌에서는 동 패널 대신 지번 팝업(map click 핸들러)이 담당
        if ((mapRef.current?.getZoom() ?? 0) >= DETAIL_ZOOM) return;
        select(obj.properties.admCd2);
        setIntroOpen(false);
      },
    });

    const layers: Layer[] = [];

    // 네온 바닥 글로우 — 기둥 아래 발광 풋프린트
    if (neon && is3D) {
      layers.push(
        new GeoJsonLayer({
          id: "neon-floor",
          data: features,
          pickable: false,
          stroked: false,
          filled: true,
          extruded: false,
          getFillColor: (f) => {
            const cc = colorOf((f as DistrictFeature).properties.admCd2);
            return [cc[0], cc[1], cc[2], 120];
          },
          updateTriggers: { getFillColor: [layer, t, data, neon, selected] },
        })
      );
    }

    layers.push(fill);

    // 호버 솟구침 강조 — 올린 동만 더 높고 밝게
    if (is3D && hovered) {
      const hf = features.find((f) => f.properties.admCd2 === hovered);
      const baseE = byPlace[hovered]?.e?.[t] ?? 0;
      if (hf && baseE > 0) {
        layers.push(
          new GeoJsonLayer({
            id: "hover-raise",
            data: [hf],
            pickable: false,
            stroked: false,
            filled: true,
            extruded: true,
            getElevation: baseE + 38,
            elevationScale,
            material: neon ? false : { ambient: 0.75, diffuse: 0.5, shininess: 40, specularColor: [120, 140, 180] },
            getFillColor: () => {
              const cc = colorOf(hovered);
              return [Math.min(255, cc[0] + 70), Math.min(255, cc[1] + 70), Math.min(255, cc[2] + 70), 255];
            },
            transitions: { getElevation: { duration: 240 } },
            updateTriggers: { getElevation: [hovered, t, baseE], getFillColor: [hovered, neon, t] },
          })
        );
      }
    }

    if (alertActive) {
      const flagged = features.filter((f) => byPlace[f.properties.admCd2]?.a?.[t] === 1);
      const alpha = pulse ? 235 : 90;
      layers.push(
        new GeoJsonLayer({
          id: "klai-alert-ring",
          data: flagged,
          pickable: false,
          stroked: true,
          filled: false,
          getLineColor: [255, 122, 61, alpha],
          getLineWidth: 2.4,
          lineWidthUnits: "pixels",
          lineWidthMinPixels: 1.6,
          updateTriggers: { getLineColor: [pulse, layer, t], data: [data, t] },
        })
      );
    }

    // ── 세부 모드 (줌인): 지번·필지 격자 + 로컬 상점 포인트 ──
    if (detailActive && detail) {
      layers.push(
        new PolygonLayer({
          id: "detail-parcels",
          data: detail.parcels,
          pickable: true,
          stroked: true,
          filled: true,
          extruded: is3D,
          getPolygon: (d) => (d as { polygon: number[][] }).polygon,
          getElevation: (d) => (d as { g: number }).g,
          elevationScale: is3D ? elevationScale * 0.5 : 0,
          getFillColor: (d) => {
            const c = growthColor((d as { g: number }).g);
            return neon ? neonize(c) : c;
          },
          getLineColor: [11, 27, 48, 90],
          getLineWidth: 1,
          lineWidthUnits: "pixels",
          material: neon ? false : { ambient: 0.6, diffuse: 0.6 },
          transitions: { getElevation: { duration: 400 } },
          updateTriggers: { getFillColor: [neon], getElevation: [detail] },
          onHover: (info) => {
            const o = info.object as { g: number; v: number } | undefined;
            if (o && info.x != null) {
              setPoiHover({ x: info.x, y: info.y, name: "필지·블록", label: `성장지수 ${o.g} · 활력 ${o.v}`, metric: o.g, color: [...growthColor(o.g)].slice(0, 3) });
            } else setPoiHover((p) => (p && p.name === "필지·블록" ? null : p));
          },
        })
      );
      layers.push(
        new ScatterplotLayer({
          id: "detail-pois",
          data: detail.pois,
          pickable: true,
          stroked: true,
          filled: true,
          radiusUnits: "pixels",
          radiusMinPixels: 3,
          radiusMaxPixels: 16,
          getPosition: (d) => [(d as { lng: number }).lng, (d as { lat: number }).lat, is3D ? (d as { metric: number }).metric * elevationScale * 0.5 + 30 : 0],
          getRadius: (d) => 3 + ((d as { metric: number }).metric / 100) * 9,
          getFillColor: (d) => {
            const c = (d as { color: number[] }).color as [number, number, number];
            return neon ? [Math.min(255, c[0] + 50), Math.min(255, c[1] + 50), Math.min(255, c[2] + 50), 255] : [c[0], c[1], c[2], 230];
          },
          getLineColor: [255, 255, 255, 200],
          lineWidthMinPixels: 1,
          updateTriggers: { getFillColor: [neon], getPosition: [is3D, elevationScale] },
          onHover: (info) => {
            const o = info.object as { name: string; label: string; metric: number; color: number[] } | undefined;
            if (o && info.x != null) {
              setPoiHover({ x: info.x, y: info.y, name: o.name, label: `${o.label} · 활력 ${o.metric}`, metric: o.metric, color: o.color });
            } else setPoiHover((p) => (p && p.name !== "필지·블록" ? null : p));
          },
        })
      );
    }

    overlay.setProps({ layers, effects: neon ? [] : [LIGHTING] });
  }, [layer, periodIndex, selected, hovered, pulse, mapReady, alertActive, features, data, is3D, neon, elevationScale, detail, select, setHovered]);

  // 3D 토글 → 지도 틸트 전환 (투어 중엔 투어가 카메라 제어)
  useEffect(() => {
    if (tourLabel == null) mapRef.current?.easeTo({ pitch: is3D ? 48 : 0, duration: 600 });
  }, [is3D, tourLabel]);



  // 시네마틱 권역 투어
  const runTour = async () => {
    const map = mapRef.current;
    if (!map) return;
    if (tourLabel !== null) {
      tourRef.current.cancel = true;
      setTourLabel(null);
      return;
    }
    setIntroOpen(false);
    select(null);
    tourRef.current = { cancel: false };
    for (const s of TOUR_STOPS) {
      if (tourRef.current.cancel) break;
      setTourLabel(s.label);
      await new Promise<void>((res) => {
        map.flyTo({ center: [s.lng, s.lat], zoom: s.zoom, pitch: s.pitch, bearing: s.bearing, duration: 3400, essential: true });
        const done = () => {
          map.off("moveend", done);
          res();
        };
        map.on("moveend", done);
      });
      if (tourRef.current.cancel) break;
      // 자동 오빗 — 경유지에서 천천히 회전
      await new Promise<void>((res) => {
        map.easeTo({ bearing: s.bearing + 48, duration: 2800, essential: true });
        const done = () => {
          map.off("moveend", done);
          res();
        };
        map.on("moveend", done);
      });
    }
    tourRef.current.cancel = true;
    setTourLabel(null);
  };

  // 핫스팟 투어 — 급등(모멘텀 상위) 동만 순회
  const runHotspotTour = async () => {
    const map = mapRef.current;
    const spots = highlights.hotspots ?? [];
    if (!map || spots.length === 0) return;
    if (tourLabel !== null) {
      tourRef.current.cancel = true;
      setTourLabel(null);
      return;
    }
    setIntroOpen(false);
    select(null);
    tourRef.current = { cancel: false };
    for (let i = 0; i < spots.length; i++) {
      const sp = spots[i];
      if (tourRef.current.cancel) break;
      setTourLabel(`🔥 ${sp.name} · 모멘텀 +${sp.momentum}`);
      const bearing = (i * 40) % 360 - 180;
      await new Promise<void>((res) => {
        map.flyTo({ center: [sp.lng, sp.lat], zoom: 11.8, pitch: 60, bearing, duration: 2800, essential: true });
        const done = () => {
          map.off("moveend", done);
          res();
        };
        map.on("moveend", done);
      });
      if (tourRef.current.cancel) break;
      await new Promise<void>((res) => {
        map.easeTo({ bearing: bearing + 50, duration: 2200, essential: true });
        const done = () => {
          map.off("moveend", done);
          res();
        };
        map.on("moveend", done);
      });
    }
    tourRef.current.cancel = true;
    setTourLabel(null);
  };

  // ── 지역/검색 이동 ─────────────────────────────────────────
  const fitBounds = (b: [number, number, number, number]) => {
    mapRef.current?.fitBounds(
      [
        [b[0], b[1]],
        [b[2], b[3]],
      ],
      { padding: 40, duration: 800 }
    );
  };
  const goToPlace = (admCd2: string) => {
    const f = features.find((x) => x.properties.admCd2 === admCd2);
    if (!f) return;
    mapRef.current?.flyTo({
      center: [f.properties.centroidLng, f.properties.centroidLat],
      zoom: 12.5,
      duration: 1100,
    });
    select(admCd2);
    setIntroOpen(false);
  };

  // 장소·역·랜드마크 검색 → 그 좌표로 이동 + 포함 행정동 선택(데이터가 그 지점 중심으로)
  const goToPlaceSearch = async (query: string): Promise<boolean> => {
    try {
      const r = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      if (!r.ok) return false;
      const g = (await r.json()) as { admCd2: string; lng: number; lat: number };
      if (!Number.isFinite(g.lng) || !Number.isFinite(g.lat)) return false;
      mapRef.current?.flyTo({ center: [g.lng, g.lat], zoom: 14.5, duration: 1400, essential: true });
      setIntroOpen(false);
      if (g.admCd2) select(g.admCd2);
      return true;
    } catch {
      return false;
    }
  };

  const loadingData = features.length === 0 || !data;

  return (
    <div className="relative h-[calc(100vh_-_3.5rem)] w-full overflow-hidden bg-navy">
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />

      {loadingData && (
        <div className="pointer-events-none absolute left-1/2 top-4 z-20 -translate-x-1/2">
          <div className="klai-panel flex items-center gap-2 px-3 py-1.5 text-[12px] text-muted">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-line border-t-blue-l" />
            전국 행정동 로딩 중…
          </div>
        </div>
      )}

      {/* 좌상단: 레이어 컨트롤 */}
      <div className="absolute left-3 top-3 z-10 hidden sm:block">
        <LayerControl />
      </div>

      {/* 우상단: 검색 + 권역 프리셋 */}
      <div className="absolute right-3 top-3 z-10 flex flex-col items-end gap-2">
        <SearchBox places={places} onSelect={goToPlace} onSearchPlace={goToPlaceSearch} />
        <div className="klai-panel flex max-w-[260px] flex-wrap justify-end gap-1 p-1.5">
          {REGION_PRESETS.map((r) => (
            <button
              key={r.id}
              onClick={() => fitBounds(r.bounds)}
              className="rounded-md px-2.5 py-1 text-[11.5px] font-medium text-muted hover:bg-card2 hover:text-ink"
            >
              {r.label}
            </button>
          ))}
        </div>
        {/* 2D / 3D · 네온 · 투어 */}
        <div className="flex items-center gap-2">
          <div className="klai-panel flex items-center gap-0.5 p-1">
            {([
              ["2D", false],
              ["3D", true],
            ] as const).map(([lbl, v]) => (
              <button
                key={lbl}
                onClick={() => setIs3D(v)}
                className={`rounded-md px-3 py-1 text-[12px] font-bold transition-colors ${
                  is3D === v ? "bg-blue text-white" : "text-muted hover:text-ink"
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
          <button
            onClick={() => setNeon((n) => !n)}
            title="야간/네온 테마"
            className={`klai-panel px-3 py-1.5 text-[12px] font-bold transition-colors ${
              neon ? "text-[#3df0ff]" : "text-muted hover:text-ink"
            }`}
            style={neon ? { boxShadow: "0 0 0 1px rgba(61,240,255,.5), 0 0 18px -4px rgba(61,240,255,.6)" } : undefined}
          >
            ⚡ 네온
          </button>
          <button
            onClick={runTour}
            title="권역 시네마틱 투어 (자동 회전)"
            className={`klai-panel px-3 py-1.5 text-[12px] font-bold transition-colors ${
              tourLabel !== null ? "text-amber" : "text-muted hover:text-ink"
            }`}
          >
            {tourLabel !== null ? "■ 정지" : "🎬 투어"}
          </button>
          <button
            onClick={runHotspotTour}
            title="급등 핫스팟 투어 (모멘텀 상위 동)"
            className="klai-panel px-3 py-1.5 text-[12px] font-bold text-muted transition-colors hover:text-warn"
          >
            🔥 핫스팟
          </button>
        </div>
      </div>

      {/* 좌하단: 범례 */}
      <div className="absolute bottom-3 left-3 z-10 hidden sm:block">
        <div className="klai-panel max-w-[260px] p-3">
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-amber">범례</div>
          <Legend layer={layer} />
        </div>
      </div>

      {/* 하단중앙: 타임 슬라이더 */}
      <div className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2">
        <TimeSlider />
      </div>

      {/* 호버 3D 카드 — 기둥 위 말풍선 */}
      {hover && (
        <div
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-[calc(100%_+_14px)]"
          style={{ left: hover.x, top: hover.y }}
        >
          <div
            className="min-w-[140px] overflow-hidden rounded-xl border bg-navy/95 shadow-2xl backdrop-blur"
            style={{ borderColor: hover.color }}
          >
            <div className="h-1" style={{ background: hover.color }} />
            <div className="px-3 py-2">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: hover.color }} />
                <span className="text-[13px] font-extrabold text-ink">{hover.name}</span>
              </div>
              <div className="mt-0.5 text-[10.5px] text-muted2">{hover.sub}</div>
              <div className="mt-1 text-[13px] font-bold" style={{ color: hover.color }}>
                {hover.label}
              </div>
            </div>
          </div>
          {/* 말풍선 꼬리 */}
          <div
            className="mx-auto h-2 w-2 -translate-y-1 rotate-45 border-b border-r"
            style={{ background: "rgba(11,27,48,.95)", borderColor: hover.color }}
          />
        </div>
      )}

      {/* 세부(지번·상점) 호버 툴팁 */}
      {poiHover && (
        <div
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-[calc(100%_+_12px)]"
          style={{ left: poiHover.x, top: poiHover.y }}
        >
          <div
            className="rounded-lg border bg-navy/95 px-2.5 py-1.5 shadow-xl backdrop-blur"
            style={{ borderColor: `rgb(${poiHover.color[0]},${poiHover.color[1]},${poiHover.color[2]})` }}
          >
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: `rgb(${poiHover.color[0]},${poiHover.color[1]},${poiHover.color[2]})` }} />
              <span className="text-[12.5px] font-bold text-ink">{poiHover.name}</span>
            </div>
            <div className="mt-0.5 text-[11px] text-muted">{poiHover.label}</div>
          </div>
        </div>
      )}

      {/* 지번 단위 — 클릭 지점 실제 필지 (VWorld 역지오코딩) */}
      {parcel && (
        <div
          className="absolute z-30 -translate-x-1/2 -translate-y-[calc(100%_+_14px)]"
          style={{ left: parcel.x, top: parcel.y }}
        >
          <div className="w-[230px] rounded-xl border bg-navy/95 p-3 shadow-2xl backdrop-blur" style={{ borderColor: "var(--green)" }}>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: "var(--green)" }}>
                지번 · 필지
              </span>
              <button onClick={() => setParcel(null)} className="text-[14px] leading-none text-muted2 hover:text-ink">
                ×
              </button>
            </div>
            {parcel.loading ? (
              <div className="py-1 text-[12px] text-muted">지번 조회 중…</div>
            ) : parcel.data ? (
              <div className="space-y-1">
                <div className="text-[13px] font-bold text-ink">{parcel.data.jibun || "지번 정보 없음"}</div>
                {parcel.data.road && <div className="text-[11px] text-muted">{parcel.data.road}</div>}
                <div className="mt-1.5 flex flex-wrap gap-1 border-t border-line pt-1.5 text-[10px] text-muted2">
                  {parcel.data.bjdong && <span className="rounded bg-card2 px-1.5 py-0.5">법정동 {parcel.data.bjdong}</span>}
                  {parcel.data.admName && <span className="rounded bg-card2 px-1.5 py-0.5">행정동 {parcel.data.admName}</span>}
                  {parcel.data.pnu && <span className="rounded bg-card2 px-1.5 py-0.5">PNU {parcel.data.pnu}</span>}
                </div>
                <div className="text-[9.5px] text-muted2">실데이터 · VWorld 역지오코딩</div>
              </div>
            ) : (
              <div className="py-1 text-[12px] text-muted">지번을 찾지 못했습니다.</div>
            )}
          </div>
          <div className="mx-auto h-2 w-2 -translate-y-1 rotate-45 border-b border-r" style={{ background: "rgba(11,27,48,.95)", borderColor: "var(--green)" }} />
        </div>
      )}

      {/* 세부 모드 인디케이터 */}
      {detail && detail.parcels.length > 0 && (
        <div className="pointer-events-none absolute bottom-24 left-3 z-10 sm:bottom-20">
          <div className="klai-panel px-3 py-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber">지번·필지 세부 모드</div>
            <div className="mt-1 flex flex-wrap gap-x-2.5 gap-y-1 text-[10.5px] text-muted">
              <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded" style={{ background: "rgb(18,180,130)" }} />성장 高</span>
              <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded" style={{ background: "rgb(40,58,92)" }} />성장 低</span>
              <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "#D4861E" }} />로컬 상점·마을</span>
            </div>
            <div className="mt-1 text-[9.5px]" style={{ color: "var(--green)" }}>👆 클릭 = 클릭 지점의 실제 지번(VWorld)</div>
            <div className="text-[9.5px] text-muted2">필지 격자·상점은 개념 · 실필지 폴리곤은 VWorld 데이터API 승인 시</div>
          </div>
        </div>
      )}

      {/* 투어 캡션 */}
      {tourLabel !== null && (
        <div className="pointer-events-none absolute left-1/2 top-20 z-20 -translate-x-1/2">
          <div className="klai-panel animate-fade-in px-5 py-2 text-center">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber">Cinematic Tour</div>
            <div className="text-[17px] font-black text-ink">{tourLabel}</div>
          </div>
        </div>
      )}

      {/* 우측 드로어: PlacePanel */}
      {selected && (
        <div className="absolute right-0 top-0 z-30 h-full">
          <PlacePanel admCd2={selected} onClose={() => select(null)} />
        </div>
      )}

      {/* 인트로 히어로 */}
      {introOpen && !selected && (
        <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center p-4">
          <div className="klai-panel pointer-events-auto max-w-lg animate-fade-in p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div className="klai-eyebrow">K-Local Attractiveness Index</div>
              <ProvisionalBadge />
            </div>
            <h1 className="mt-3 text-2xl font-black leading-tight sm:text-3xl">
              전국 동네의 매력을 <span className="text-blue-l">점수로</span>,
              <br />그 변화의 <span className="text-blue-l">이유를</span> 진단한다
            </h1>
            <p className="mt-3 text-[13.5px] leading-relaxed text-muted">
              전국 <b className="text-ink">{highlights.count?.toLocaleString() ?? "3,500+"}개 행정동</b>을 인구·상권·공간·인식 4축으로
              색칠하고, <b className="text-ink">시간 재생</b>으로 변화를 보여준다. 인구 흐름·공공예산까지.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <KpiMini label="상승 모멘텀" tone="blue" name={highlights.riser?.name} sub={highlights.riser?.sigungu} value={`+${highlights.riser?.momentum}`} />
              <KpiMini label="젠트리 경보" tone="warn" name={highlights.gentri?.name} sub={highlights.gentri?.sigungu} value={`${highlights.gentri?.stage}단계`} />
              <KpiMini label="소멸 진입" tone="amber" name={highlights.decline?.name} sub={highlights.decline?.sigungu} value={`${highlights.decline?.momentum}`} />
            </div>
            <div className="mt-5 flex items-center gap-2">
              <button
                onClick={() => setIntroOpen(false)}
                className="rounded-lg bg-blue px-4 py-2 text-sm font-bold text-white hover:bg-[#65a30d]"
              >
                지도 탐색 시작 →
              </button>
              <span className="text-[11px] text-muted2">동 클릭 → 진단 패널</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-line pt-3 text-[11px] text-muted2">
              <span>🖱️ 드래그 = 이동</span>
              <span>우클릭·Ctrl+드래그 = 360° 회전·기울이기</span>
              <span>휠 = 확대·축소</span>
              <span>동 클릭 = 진단 패널</span>
            </div>
          </div>
        </div>
      )}

      {!introOpen && (
        <button
          onClick={() => setIntroOpen(true)}
          className="klai-panel absolute left-3 top-3 z-10 px-3 py-1.5 text-[12px] font-semibold text-muted hover:text-ink sm:hidden"
        >
          ℹ︎ 정보
        </button>
      )}
    </div>
  );
}

function KpiMini({
  label,
  name,
  sub,
  value,
  tone,
}: {
  label: string;
  name?: string;
  sub?: string;
  value?: string;
  tone: "blue" | "warn" | "amber";
}) {
  const color = tone === "warn" ? "var(--warn)" : tone === "amber" ? "var(--amber)" : "var(--blue-l)";
  return (
    <div className="rounded-lg border border-line bg-card2 p-2">
      <div className="text-[15px] font-extrabold tabular-nums" style={{ color }}>
        {value ?? "—"}
      </div>
      <div className="truncate text-[11px] font-semibold text-ink">{name ?? "—"}</div>
      <div className="truncate text-[9.5px] text-muted2">{sub ? `${sub} · ${label}` : label}</div>
    </div>
  );
}
