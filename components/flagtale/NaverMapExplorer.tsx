/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Supercluster from "supercluster";
import { MAP_CATS, ftImage, type MapItem } from "@/lib/flagtale-types";
import { narrativeForPlace, narrativeJumpList, reasonsFor, STAGE_META, AUTH_META, type AreaNarrative } from "@/lib/narratives";
import { HotspotPanel, type HotspotJump } from "./HotspotPanel";

// 핫지역 큐레이션 내러티브 인포윈도우 HTML(폴리곤 클릭·핫지역 점프 공용).
function narrativeCardHTML(narr: AreaNarrative, admCd: string): string {
  const sm = STAGE_META[narr.stage];
  const top = reasonsFor(narr.name).slice(0, 2);
  const why = top.length ? `<div style="margin-top:7px;padding-top:7px;border-top:1px solid #eef0f4"><div style="font-size:9.5px;font-weight:800;color:#D4861E;margin-bottom:2px">💡 왜 떴나</div>${top.map((r) => `<div style="font-size:10.5px;color:#16223a;line-height:1.4">· ${r}</div>`).join("")}</div>` : "";
  return `<div style="max-width:240px;background:#fff;border-radius:12px;padding:11px 13px;font-family:Pretendard,system-ui,sans-serif;box-shadow:0 6px 22px rgba(0,0,0,.28);border:1.5px solid ${sm.color}55"><div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap"><span style="background:${sm.color};color:#fff;border-radius:999px;padding:2px 8px;font-size:10.5px;font-weight:800">${sm.emoji} ${sm.label}</span><span style="font-size:12px;font-weight:800;color:#0d2b5e">${narr.name}</span></div><div style="margin-top:7px;font-size:13px;font-weight:800;line-height:1.35;color:#16223a">“${narr.theme}”</div><div style="margin-top:6px;font-size:10.5px;color:#5b6b86;line-height:1.4">${AUTH_META[narr.authenticity].label} · ${narr.authNote}</div>${why}<a href="/place/${admCd}" style="display:inline-block;margin-top:8px;background:#0d2b5e;color:#fff;border-radius:999px;padding:5px 11px;font-size:11px;font-weight:800;text-decoration:none">이 동네 진단 →</a></div>`;
}
import { MapResultsPanel, sortItems } from "./MapResultsPanel";
import { markerPillHtml, clusterBadgeHtml, markerTier } from "./mapMarkers";
import { openState, nowParts, type NowT } from "@/lib/openNow";
import { readLists, pushToAccount, pullFromAccount, onAuthChange } from "@/lib/accountSync";
import FlagtaleMapExplorer from "./FlagtaleMapExplorer";
import { usePlan } from "@/lib/usePlan";
import { canUse } from "@/lib/tier";
import { ChoroLayerControl } from "./ChoroLayerControl";
import type { LayerId } from "@/lib/types";
import { readGame, onGameChange, clearRoute } from "@/lib/game";

const CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
// 신규 NCP Maps: oapi + ncpKeyId. (레거시 키면 openapi.map.naver.com + ncpClientId)
const NAVER_SRC = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${CLIENT_ID}&submodules=panorama`;

const matchQuery = (q: string) => {
  const s = q.trim().toLowerCase();
  return (it: MapItem) => !s || it.name.toLowerCase().includes(s) || it.region.toLowerCase().includes(s) || it.catLabel.toLowerCase().includes(s) || (it.sub ?? "").toLowerCase().includes(s);
};

function loadNaver(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("ssr"));
    if ((window as any).naver?.maps) return resolve((window as any).naver);
    const prev = document.getElementById("naver-maps-sdk") as HTMLScriptElement | null;
    if (prev) { prev.addEventListener("load", () => resolve((window as any).naver)); prev.addEventListener("error", () => reject(new Error("load"))); return; }
    const s = document.createElement("script");
    s.id = "naver-maps-sdk"; s.src = NAVER_SRC; s.async = true;
    s.onload = () => resolve((window as any).naver);
    s.onerror = () => reject(new Error("load"));
    document.head.appendChild(s);
  });
}

function bbox(map: any): [number, number, number, number] {
  const b = map.getBounds();
  const sw = b.getSW ? b.getSW() : b.getMin();
  const ne = b.getNE ? b.getNE() : b.getMax();
  const lng = (p: any) => (typeof p.lng === "function" ? p.lng() : p.x);
  const lat = (p: any) => (typeof p.lat === "function" ? p.lat() : p.y);
  return [lng(sw), lat(sw), lng(ne), lat(ne)];
}

export default function NaverMapExplorer({ items: propItems, title }: { items: MapItem[]; title?: string }) {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const naverRef = useRef<any>(null);
  const indexRef = useRef<Supercluster | null>(null);
  const markersRef = useRef<any[]>([]);
  const locRef = useRef<any>(null);
  const selRef = useRef<string | null>(null);
  const boundsRef = useRef<[number, number, number, number] | null>(null);
  const [engine, setEngine] = useState<"loading" | "naver" | "fallback">(CLIENT_ID ? "loading" : "fallback");
  const [selCats, setSelCats] = useState<string[]>([]); // 빈 배열 = 전체
  const [sort, setSort] = useState("rating");
  const [query, setQuery] = useState("");
  const [viewportOnly, setViewportOnly] = useState(true);
  const [priceBand, setPriceBand] = useState("all");
  const [minRating, setMinRating] = useState(0);
  const [openOnly, setOpenOnly] = useState(false);
  const [now, setNow] = useState<NowT | null>(null);
  const [boundsKey, setBoundsKey] = useState(0);
  const [selId, setSelId] = useState<string | null>(null);
  const [mapType, setMapType] = useState<"normal" | "sat">("normal");
  const [favs, setFavs] = useState<string[]>([]);
  const [favOnly, setFavOnly] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [recentOnly, setRecentOnly] = useState(false);
  const [road, setRoad] = useState<MapItem | null>(null);
  const [heat, setHeat] = useState(false);
  const [choroBusy, setChoroBusy] = useState(false);
  const [choroLayer, setChoroLayer] = useState<LayerId>("klai");
  const [choroSimple, setChoroSimple] = useState(false); // 3단계(상/중/하) 단순화
  const choroSimpleRef = useRef(false);
  const [hotspots, setHotspots] = useState(false); // 🔥 검증된 핫지역 디스커버리
  const { plan } = usePlan();
  const canChoro = canUse(plan, "choropleth"); // choropleth = Pro 이상
  const [upsell, setUpsell] = useState(false);
  const [routeIds, setRouteIds] = useState<string[]>([]);
  const routeRef = useRef<any[]>([]);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [hoverCard, setHoverCard] = useState<{ it: MapItem; x: number; y: number } | null>(null);
  const [choroHover, setChoroHover] = useState<{ name: string; label: string; color: string; x: number; y: number } | null>(null);
  const panoEl = useRef<HTMLDivElement>(null);
  const panoRef = useRef<any>(null);
  const heatRef = useRef<any[]>([]);
  const heatOnRef = useRef(false);
  const hotMarkersRef = useRef<any[]>([]); // 🔥 핫지역 마커
  const hotspotsRef = useRef(false);
  const choroGeoRef = useRef<any>(null);
  const choroColorsRef = useRef<Record<string, Record<string, { color: string; label: string }>>>({});
  const choroSiguRef = useRef<Record<string, Record<string, string>>>({}); // 레이어→시군구→평균색(저줌 블록)
  const choroLayerRef = useRef<string>("klai");
  const choroIWRef = useRef<any>(null);
  const choroTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverRef = useRef<string | null>(null);
  const leafRef = useRef<Map<string, { mk: any; it: MapItem }>>(new Map());
  const syncedRef = useRef(false);

  useEffect(() => {
    const { favs, recent } = readLists();
    setFavs(favs); setRecent(recent);
    const sync = () => pullFromAccount().then((m) => { if (m) { setFavs(m.favs); setRecent(m.recent); } syncedRef.current = true; });
    sync();
    return onAuthChange(sync);
  }, []);
  useEffect(() => { if (syncedRef.current) pushToAccount(favs, recent); }, [favs, recent]);
  useEffect(() => { const tick = () => setNow(nowParts(new Date())); tick(); const t = setInterval(tick, 60000); return () => clearInterval(t); }, []);
  function toggleFav(id: string) {
    setFavs((f) => { const n = f.includes(id) ? f.filter((x) => x !== id) : [...f, id]; try { localStorage.setItem("ft-favs", JSON.stringify(n)); } catch { /* noop */ } return n; });
  }
  function setUrlSel(id: string | null) {
    try { const u = new URL(window.location.href); if (id) u.searchParams.set("sel", id); else u.searchParams.delete("sel"); window.history.replaceState(null, "", u.toString()); } catch { /* noop */ }
  }
  function toggleCat(k: string) { if (k === "all") return setSelCats([]); setSelCats((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k])); }
  function resetFilters() { setSelCats([]); setFavOnly(false); setRecentOnly(false); setOpenOnly(false); setPriceBand("all"); setMinRating(0); setQuery(""); }

  const [community, setCommunity] = useState<MapItem[]>([]);
  const items = useMemo(() => (community.length ? [...propItems, ...community] : propItems), [propItems, community]);
  useEffect(() => { fetch("/api/spots").then((r) => (r.ok ? r.json() : null)).then((d) => { if (Array.isArray(d?.spots) && d.spots.length) setCommunity(d.spots as MapItem[]); }).catch(() => { /* noop */ }); }, []);
  const cats = useMemo(() => {
    const c: Record<string, number> = {};
    items.forEach((i) => (c[i.cat] = (c[i.cat] ?? 0) + 1));
    return MAP_CATS.filter((m) => c[m.key]).map((m) => ({ ...m, count: c[m.key] }));
  }, [items]);
  const regions = useMemo(() => [...new Set(items.map((i) => i.region))].sort((a, b) => a.localeCompare(b, "ko")), [items]);
  function flyRegion(r: string) {
    const naver = naverRef.current, map = mapRef.current;
    if (!naver || !map) return;
    const its = r === "__all__" ? items : items.filter((i) => i.region === r);
    if (!its.length) return;
    try {
      const b = new naver.maps.LatLngBounds(new naver.maps.LatLng(its[0].lat, its[0].lng), new naver.maps.LatLng(its[0].lat, its[0].lng));
      its.forEach((i) => b.extend(new naver.maps.LatLng(i.lat, i.lng)));
      map.fitBounds(b, { top: 80, right: 60, bottom: 60, left: 400 });
    } catch { /* noop */ }
  }
  const filtered = useMemo(() => {
    if (recentOnly) return recent.map((id) => items.find((i) => i.id === id)).filter(Boolean) as MapItem[]; // 최근순 유지
    let base = selCats.length ? items.filter((i) => selCats.includes(i.cat)) : items;
    if (favOnly) base = base.filter((i) => favs.includes(i.id));
    if (minRating > 0) base = base.filter((i) => (i.rating ?? 0) >= minRating);
    if (priceBand !== "all") base = base.filter((i) => {
      if (!i.price) return false;
      return priceBand === "u5" ? i.price < 50000 : priceBand === "5to10" ? i.price >= 50000 && i.price < 100000 : i.price >= 100000;
    });
    if (openOnly) base = base.filter((i) => openState(i.hours, now) === "open");
    return sortItems(base.filter(matchQuery(query)), sort);
  }, [items, selCats, sort, query, favOnly, favs, minRating, priceBand, openOnly, now, recentOnly, recent]);
  // 뷰포트 동기 목록(검색 중엔 전체) + 거리순(지도 중심 기준)
  const view = useMemo(() => {
    if (recentOnly) return filtered;
    let base = filtered;
    if (viewportOnly && !query.trim() && boundsRef.current) { const [w, s, e, n] = boundsRef.current; base = filtered.filter((it) => it.lng >= w && it.lng <= e && it.lat >= s && it.lat <= n); }
    if (sort === "dist" && boundsRef.current) { const [w, s, e, n] = boundsRef.current; return sortItems(base, "dist", [(w + e) / 2, (s + n) / 2]); }
    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, viewportOnly, query, boundsKey, recentOnly, sort]);
  const sel = useMemo(() => items.find((i) => i.id === selId) ?? null, [items, selId]);

  function buildIndex() {
    const index = new Supercluster({ radius: 64, maxZoom: 16 });
    index.load(filtered.map((it) => ({ type: "Feature" as const, properties: { item: it }, geometry: { type: "Point" as const, coordinates: [it.lng, it.lat] } })));
    indexRef.current = index;
  }

  const leafZ = (id: string) => (id === selRef.current ? 1000 : id === hoverRef.current ? 900 : 10);

  function render() {
    const map = mapRef.current, naver = naverRef.current, index = indexRef.current;
    if (!map || !naver || !index) return;
    try {
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      leafRef.current.clear();
      const z = Math.round(map.getZoom());
      const tier = markerTier(map.getZoom());
      const clusters = index.getClusters(bbox(map), z);
      for (const c of clusters) {
        const [lng, lat] = c.geometry.coordinates;
        const pos = new naver.maps.LatLng(lat, lng);
        if ((c.properties as any).cluster) {
          const count = (c.properties as any).point_count as number;
          const mk = new naver.maps.Marker({ position: pos, map, icon: { content: clusterBadgeHtml(count) }, zIndex: 5 });
          naver.maps.Event.addListener(mk, "click", () => {
            const ez = index.getClusterExpansionZoom((c.properties as any).cluster_id);
            map.morph(pos, Math.min(ez, 18));
          });
          markersRef.current.push(mk);
        } else {
          const it = (c.properties as any).item as MapItem;
          const sel = it.id === selRef.current, hov = it.id === hoverRef.current && !sel;
          const mk = new naver.maps.Marker({ position: pos, map, icon: { content: markerPillHtml(it, sel, tier, hov) }, zIndex: leafZ(it.id) });
          naver.maps.Event.addListener(mk, "click", () => selectItem(it.id));
          naver.maps.Event.addListener(mk, "mouseover", (e: any) => { setHover(it.id); const pe = e?.pointerEvent || e?.originalEvent; setHoverCard({ it, x: pe?.clientX ?? 0, y: pe?.clientY ?? 0 }); });
          naver.maps.Event.addListener(mk, "mouseout", () => { setHover(null); setHoverCard(null); });
          markersRef.current.push(mk);
          leafRef.current.set(it.id, { mk, it });
        }
      }
    } catch {
      setEngine("fallback");
    }
  }

  // 호버 동기화(마커 ↔ 목록) — 해당 마커 아이콘만 즉시 갱신(전체 리렌더 X)
  function setHover(id: string | null) {
    const prev = hoverRef.current;
    if (prev === id) return;
    hoverRef.current = id;
    setHoverId(id);
    const map = mapRef.current;
    const tier = map ? markerTier(map.getZoom()) : 1;
    [prev, id].forEach((x) => {
      if (!x) return;
      const e = leafRef.current.get(x);
      if (!e) return;
      const sel = x === selRef.current, hov = x === hoverRef.current && !sel;
      try { e.mk.setIcon({ content: markerPillHtml(e.it, sel, tier, hov) }); e.mk.setZIndex(leafZ(x)); } catch { /* noop */ }
    });
  }

  // 매력도 choropleth — 경계(1회) + 레이어 색 + 시군구 평균색(저줌 블록).
  async function ensureChoroLayer(layer: string) {
    if (!choroGeoRef.current) {
      try { const geo = await fetch("/api/geojson").then((r) => (r.ok ? r.json() : null)); if (!geo?.features) return false; choroGeoRef.current = geo; } catch { return false; }
    }
    if (!choroColorsRef.current[layer]) {
      try {
        const md = await fetch(`/api/mapdata?layer=${layer}`).then((r) => (r.ok ? r.json() : null));
        if (!md?.byPlace) return false;
        const cmap: Record<string, { color: string; label: string }> = {};
        for (const cd in md.byPlace) {
          const e = md.byPlace[cd]; const c = e?.c, l = e?.l;
          if (!c?.length) continue;
          const col = c[c.length - 1];
          cmap[cd] = { color: `rgb(${col[0]},${col[1]},${col[2]})`, label: l?.length ? l[l.length - 1] : "" };
        }
        choroColorsRef.current[layer] = cmap;
        // 시군구 평균색 (저줌 블록)
        const acc: Record<string, { r: number; g: number; b: number; n: number }> = {};
        for (const f of choroGeoRef.current.features) {
          const m = cmap[f.properties.admCd2]; const sg = f.properties.sigungu;
          if (!m || !sg) continue;
          const rgb = (m.color.match(/\d+/g) || ["0", "0", "0"]).map(Number);
          const a = (acc[sg] ??= { r: 0, g: 0, b: 0, n: 0 });
          a.r += rgb[0]; a.g += rgb[1]; a.b += rgb[2]; a.n++;
        }
        const sigu: Record<string, string> = {};
        for (const sg in acc) { const a = acc[sg]; sigu[sg] = `rgb(${Math.round(a.r / a.n)},${Math.round(a.g / a.n)},${Math.round(a.b / a.n)})`; }
        choroSiguRef.current[layer] = sigu;
      } catch { return false; }
    }
    return true;
  }

  // 줌 기반: 저줌=시군구 블록 / 고줌=동별+값라벨. 단순(3단계). 베이스 톤다운(흰 사각형).
  async function renderChoro() {
    const map = mapRef.current, naver = naverRef.current;
    if (!map || !naver) return;
    heatRef.current.forEach((o) => { try { o.setMap(null); } catch { /* noop */ } });
    heatRef.current = [];
    if (!heatOnRef.current) { try { choroIWRef.current?.close(); } catch { /* noop */ } setChoroHover(null); return; }
    const layer = choroLayerRef.current;
    if (!choroGeoRef.current || !choroColorsRef.current[layer]) { setChoroBusy(true); const ok = await ensureChoroLayer(layer); setChoroBusy(false); if (!ok || !heatOnRef.current) return; }
    const geo = choroGeoRef.current, cmap = choroColorsRef.current[layer] || {}, sigu = choroSiguRef.current[layer] || {};
    let b: any;
    try { b = map.getBounds(); } catch { return; }
    const sw = b.getSW(), ne = b.getNE();
    const minLat = sw.lat(), maxLat = ne.lat(), minLng = sw.lng(), maxLng = ne.lng();
    const cLat = (minLat + maxLat) / 2, cLng = (minLng + maxLng) / 2;
    const zoom = map.getZoom();
    const lowZoom = zoom < 9.5;      // 시군구 블록
    const labelZoom = zoom >= 12.5;  // 값 라벨
    const simple = choroSimpleRef.current && ["klai", "d1", "d2", "d3", "d4"].includes(layer);
    const tier3 = (label: string) => { const v = parseFloat(label); return v >= 66 ? "#0F6E5C" : v >= 33 ? "#E2A33A" : "#A23A2A"; };

    // 베이스 톤다운 — 뷰포트에 흰 반투명(zIndex 0), choropleth는 위(zIndex 1)
    try { heatRef.current.push(new naver.maps.Rectangle({ map, bounds: b, fillColor: "#ffffff", fillOpacity: 0.5, strokeWeight: 0, zIndex: 0, clickable: false })); } catch { /* noop */ }

    const inView: { f: any; d: number }[] = [];
    for (const f of geo.features) {
      const p = f.properties;
      if (p.centroidLat < minLat || p.centroidLat > maxLat || p.centroidLng < minLng || p.centroidLng > maxLng) continue;
      if (!cmap[p.admCd2]) continue;
      inView.push({ f, d: (p.centroidLat - cLat) ** 2 + (p.centroidLng - cLng) ** 2 });
    }
    inView.sort((a, z) => a.d - z.d);
    for (const { f } of inView.slice(0, lowZoom ? 1000 : 700)) {
      const meta = cmap[f.properties.admCd2];
      const color = lowZoom ? (sigu[f.properties.sigungu] || meta.color) : (simple ? tier3(meta.label) : meta.color);
      const g = f.geometry;
      const polys: any[] = g.type === "MultiPolygon" ? g.coordinates : [g.coordinates];
      for (const poly of polys) {
        const paths = poly.map((ring: any[]) => ring.map((pt: number[]) => new naver.maps.LatLng(pt[1], pt[0])));
        try {
          const pg = new naver.maps.Polygon({ map, paths, fillColor: color, fillOpacity: 0.62, strokeColor: lowZoom ? "#ffffff" : color, strokeOpacity: lowZoom ? 0.55 : 1, strokeWeight: lowZoom ? 0.4 : 1, clickable: true, zIndex: 1 });
          naver.maps.Event.addListener(pg, "mouseover", (e: any) => { const pe = e?.pointerEvent || e?.originalEvent; setChoroHover({ name: lowZoom ? f.properties.sigungu : f.properties.name, label: meta.label, color, x: pe?.clientX ?? 0, y: pe?.clientY ?? 0 }); });
          naver.maps.Event.addListener(pg, "mouseout", () => setChoroHover(null));
          naver.maps.Event.addListener(pg, "click", (e: any) => {
            if (!choroIWRef.current) choroIWRef.current = new naver.maps.InfoWindow({ borderWidth: 0, backgroundColor: "transparent", disableAnchor: true, pixelOffset: new naver.maps.Point(0, -2) });
            const narr = narrativeForPlace(f.properties.admCd2); // 핫지역이면 실제 이야기 카드
            if (narr) {
              choroIWRef.current.setContent(narrativeCardHTML(narr, f.properties.admCd2));
            } else {
              choroIWRef.current.setContent(`<div style="background:#0d2b5e;color:#fff;border-radius:10px;padding:6px 11px;font:800 12px Pretendard,system-ui,sans-serif;white-space:nowrap;box-shadow:0 4px 14px rgba(0,0,0,.4)"><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${meta.color};margin-right:6px"></span>${f.properties.name} · ${meta.label}</div>`);
            }
            choroIWRef.current.open(map, e.coord);
          });
          heatRef.current.push(pg);
        } catch { /* noop */ }
      }
      // 값 라벨 (고줌·동별)
      if (labelZoom && !lowZoom) {
        const short = (meta.label.split(/[·\s]/)[0] || "").slice(0, 7);
        if (short) try { heatRef.current.push(new naver.maps.Marker({ position: new naver.maps.LatLng(f.properties.centroidLat, f.properties.centroidLng), map, zIndex: 5, clickable: false, icon: { content: `<div style="transform:translate(-50%,-50%);background:rgba(13,43,94,.82);color:#fff;border-radius:6px;padding:1px 5px;font:800 10px Pretendard,system-ui,sans-serif;white-space:nowrap">${short}</div>`, anchor: new naver.maps.Point(0, 0) } })); } catch { /* noop */ }
      }
    }
  }
  function scheduleChoro() { if (choroTimerRef.current) clearTimeout(choroTimerRef.current); choroTimerRef.current = setTimeout(() => { renderChoro(); }, 350); }

  function selectItem(id: string) {
    selRef.current = id;
    setSelId(id);
    setRecent((r) => { const n = [id, ...r.filter((x) => x !== id)].slice(0, 12); try { localStorage.setItem("ft-recent", JSON.stringify(n)); } catch { /* noop */ } return n; });
    setUrlSel(id);
    const it = items.find((x) => x.id === id);
    const naver = naverRef.current;
    if (it && mapRef.current && naver) mapRef.current.morph(new naver.maps.LatLng(it.lat, it.lng), Math.max(mapRef.current.getZoom(), 14));
    render();
  }

  function zoomBy(d: number) {
    const map = mapRef.current;
    if (!map) return;
    try { map.setZoom(Math.round(map.getZoom()) + d, true); } catch { /* noop */ }
  }
  // 핫지역으로 날아가 실제 이야기 인포윈도우를 띄움(디스커버리). 패널·마커는 유지(연속 탐색).
  function flyToHotspot(it: HotspotJump) {
    const map = mapRef.current, naver = naverRef.current;
    if (!map || !naver) return;
    const ll = new naver.maps.LatLng(it.coord[0], it.coord[1]);
    try { map.setCenter(ll); map.setZoom(14, true); } catch { /* noop */ }
    const narr = narrativeForPlace(it.admCd2);
    if (!narr) return;
    if (!choroIWRef.current) choroIWRef.current = new naver.maps.InfoWindow({ borderWidth: 0, backgroundColor: "transparent", disableAnchor: true, pixelOffset: new naver.maps.Point(0, -2) });
    choroIWRef.current.setContent(narrativeCardHTML(narr, it.admCd2));
    setTimeout(() => { try { choroIWRef.current.open(map, ll); } catch { /* noop */ } }, 450);
  }
  // 핫지역 마커 — 줌/뷰포트 기반 Supercluster 클러스터링(저줌서 서울 밀집 → 🔥N 묶음, 줌인 시 펼침).
  function renderHotMarkers() {
    const map = mapRef.current, naver = naverRef.current;
    if (!map || !naver) return;
    hotMarkersRef.current.forEach((m) => { try { m.setMap(null); } catch { /* noop */ } });
    hotMarkersRef.current = [];
    if (!hotspotsRef.current) return;
    const list = narrativeJumpList();
    const idx = new Supercluster({ radius: 46, maxZoom: 12 });
    idx.load(list.map((it) => ({ type: "Feature" as const, properties: { it }, geometry: { type: "Point" as const, coordinates: [it.coord[1], it.coord[0]] } })));
    let b: any;
    try { b = map.getBounds(); } catch { return; }
    const sw = b.getSW(), ne = b.getNE();
    const zoom = Math.round(map.getZoom());
    const clusters = idx.getClusters([sw.lng(), sw.lat(), ne.lng(), ne.lat()], zoom);
    for (const c of clusters) {
      const [lng, lat] = c.geometry.coordinates;
      const pos = new naver.maps.LatLng(lat, lng);
      if (c.properties.cluster) {
        const count = c.properties.point_count;
        const mk = new naver.maps.Marker({ position: pos, map, zIndex: 6, icon: { content: `<div style="transform:translate(-50%,-50%);height:30px;min-width:30px;display:grid;place-items:center;background:#0d2b5e;color:#fff;border:2px solid #fff;border-radius:999px;box-shadow:0 2px 10px rgba(0,0,0,.4);font:800 12px Pretendard,system-ui,sans-serif;padding:0 8px;cursor:pointer">🔥${count}</div>`, anchor: new naver.maps.Point(0, 0) } });
        naver.maps.Event.addListener(mk, "click", () => { let ez = zoom + 2; try { ez = Math.min(14, idx.getClusterExpansionZoom(c.properties.cluster_id)); } catch { /* noop */ } try { map.setCenter(pos); map.setZoom(ez, true); } catch { /* noop */ } });
        hotMarkersRef.current.push(mk);
      } else {
        const it = c.properties.it as HotspotJump;
        const sm = STAGE_META[it.stage];
        const mk = new naver.maps.Marker({ position: pos, map, zIndex: 6, title: it.name, icon: { content: `<div style="transform:translate(-50%,-50%);width:28px;height:28px;display:grid;place-items:center;background:#fff;border:2.5px solid ${sm.color};border-radius:50%;box-shadow:0 2px 9px rgba(0,0,0,.33);font-size:14px;cursor:pointer">${sm.emoji}</div>`, anchor: new naver.maps.Point(0, 0) } });
        naver.maps.Event.addListener(mk, "click", () => flyToHotspot(it));
        hotMarkersRef.current.push(mk);
      }
    }
  }
  function toggleType() {
    const naver = naverRef.current, map = mapRef.current;
    if (!naver || !map) return;
    const next = mapType === "normal" ? "sat" : "normal";
    setMapType(next);
    try { map.setMapTypeId(next === "sat" ? naver.maps.MapTypeId.SATELLITE : naver.maps.MapTypeId.NORMAL); } catch { /* noop */ }
  }
  function locate() {
    const naver = naverRef.current, map = mapRef.current;
    if (!naver || !map || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      map.morph(new naver.maps.LatLng(lat, lng), 14);
      try { locRef.current?.setMap(null); } catch { /* noop */ }
      locRef.current = new naver.maps.Marker({ position: new naver.maps.LatLng(lat, lng), map, icon: { content: `<div style="width:16px;height:16px;border-radius:50%;background:#1e5fa8;border:3px solid #fff;box-shadow:0 0 0 4px rgba(30,95,168,.3);transform:translate(-50%,-50%)"></div>` } });
    }, () => {}, { enableHighAccuracy: true, timeout: 8000 });
  }

  // SDK 로드 + 지도 초기화 (실패 시 maplibre 폴백)
  useEffect(() => {
    if (!CLIENT_ID) return;
    // ?map=lite → 네이버 우회 강제 대체지도(MapLibre). 저사양·네이버 장애 시 탈출구.
    try { if (new URLSearchParams(window.location.search).get("map") === "lite") { setEngine("fallback"); return; } } catch { /* noop */ }
    let alive = true;
    (window as any).navermap_authFailure = () => { if (alive) setEngine("fallback"); };
    const timer = setTimeout(() => { if (alive) setEngine((e) => (e === "loading" ? "fallback" : e)); }, 3500);
    loadNaver()
      .then((naver) => {
        if (!alive || !naver?.maps || !mapEl.current) { setEngine("fallback"); return; }
        naverRef.current = naver;
        try {
          const lats = items.map((i) => i.lat), lngs = items.map((i) => i.lng);
          const map = new naver.maps.Map(mapEl.current, {
            center: new naver.maps.LatLng((Math.min(...lats) + Math.max(...lats)) / 2, (Math.min(...lngs) + Math.max(...lngs)) / 2),
            zoom: 7, scaleControl: false, mapDataControl: false, logoControl: true,
            zoomControl: false, // 네이버 기본 컨트롤 끄고 커스텀 +/− 사용(레이아웃 정렬)
          });
          mapRef.current = map;
          const kick = () => { try { naver.maps.Event.trigger(map, "resize"); } catch { /* noop */ } };
          setTimeout(kick, 300); setTimeout(kick, 900);
          naver.maps.Event.once(map, "tilesloaded", () => {
            if (!alive) return;
            clearTimeout(timer);
            buildIndex();
            try {
              const bnds = new naver.maps.LatLngBounds(new naver.maps.LatLng(lats[0], lngs[0]), new naver.maps.LatLng(lats[0], lngs[0]));
              items.forEach((i) => bnds.extend(new naver.maps.LatLng(i.lat, i.lng)));
              map.fitBounds(bnds, { top: 70, right: 60, bottom: 60, left: 400 });
            } catch { /* keep */ }
            naver.maps.Event.addListener(map, "idle", () => {
              try { boundsRef.current = bbox(map); } catch { /* noop */ }
              setBoundsKey((k) => k + 1);
              render();
              if (heatOnRef.current) scheduleChoro();
              if (hotspotsRef.current) renderHotMarkers();
            });
            setEngine("naver");
            setTimeout(() => { kick(); try { boundsRef.current = bbox(map); } catch { /* noop */ } setBoundsKey((k) => k + 1); render(); }, 120);
          });
        } catch { setEngine("fallback"); }
      })
      .catch(() => { if (alive) setEngine("fallback"); });
    return () => { alive = false; clearTimeout(timer); markersRef.current.forEach((m) => m.setMap?.(null)); markersRef.current = []; mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 필터·정렬·검색 변화 → 인덱스 재구축 + 재렌더
  useEffect(() => {
    if (engine !== "naver") return;
    buildIndex();
    render();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, engine]);

  // 검색 → 결과 영역으로 지도 이동
  useEffect(() => {
    if (engine !== "naver" || !query.trim()) return;
    const naver = naverRef.current, map = mapRef.current;
    const matches = items.filter(matchQuery(query));
    if (!naver || !map || !matches.length) return;
    try {
      const b = new naver.maps.LatLngBounds(new naver.maps.LatLng(matches[0].lat, matches[0].lng), new naver.maps.LatLng(matches[0].lat, matches[0].lng));
      matches.forEach((m) => b.extend(new naver.maps.LatLng(m.lat, m.lng)));
      map.fitBounds(b, { top: 80, right: 70, bottom: 70, left: 410 });
    } catch { /* noop */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, engine]);

  // 거리뷰(파노라마)
  useEffect(() => {
    const naver = naverRef.current;
    if (!road || !naver?.maps?.Panorama || !panoEl.current) return;
    const pos = new naver.maps.LatLng(road.lat, road.lng);
    try {
      if (panoRef.current) panoRef.current.setPosition(pos);
      else panoRef.current = new naver.maps.Panorama(panoEl.current, { position: pos, pov: { pan: 0, tilt: 0, fov: 100 } });
    } catch { /* noop */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [road]);

  // 매력도 choropleth 토글
  useEffect(() => {
    heatOnRef.current = heat;
    if (engine === "naver") renderChoro();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heat, engine]);

  // 레이어 전환·단순화 토글 → 재색칠
  useEffect(() => {
    choroLayerRef.current = choroLayer;
    choroSimpleRef.current = choroSimple;
    if (engine === "naver" && heatOnRef.current) renderChoro();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [choroLayer, choroSimple]);

  // 🔥 핫지역 토글 → 마커 렌더(Supercluster). idle(줌/팬) 시에도 재클러스터(아래 init 리스너).
  useEffect(() => {
    hotspotsRef.current = hotspots;
    if (engine === "naver") renderHotMarkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotspots, engine]);

  // 루트빌더 — 게임 루트 동기화
  useEffect(() => { const s = () => setRouteIds(readGame().route); s(); return onGameChange(s); }, []);

  // 루트빌더 — 네이버 지도에 폴리라인 + 번호 마커
  useEffect(() => {
    if (engine !== "naver") return;
    const map = mapRef.current, naver = naverRef.current;
    if (!map || !naver) return;
    routeRef.current.forEach((o) => { try { o.setMap(null); } catch { /* noop */ } });
    routeRef.current = [];
    if (routeIds.length === 0) return;
    const byId = new Map(items.map((i) => [i.id, i]));
    const pts = routeIds.map((id) => byId.get(id)).filter(Boolean) as MapItem[];
    if (pts.length === 0) return;
    if (pts.length >= 2) {
      routeRef.current.push(new naver.maps.Polyline({ map, path: pts.map((p) => new naver.maps.LatLng(p.lat, p.lng)), strokeColor: "#1E5FA8", strokeWeight: 4, strokeOpacity: 0.85, zIndex: 190 }));
    }
    pts.forEach((p, i) => {
      routeRef.current.push(new naver.maps.Marker({ position: new naver.maps.LatLng(p.lat, p.lng), map, zIndex: 200, icon: { content: `<div style="width:24px;height:24px;display:flex;align-items:center;justify-content:center;background:#1E5FA8;color:#fff;border:2px solid #fff;border-radius:999px;font:800 12px Pretendard,system-ui,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.4)">${i + 1}</div>`, anchor: new naver.maps.Point(12, 12) } }));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeIds, items, engine]);

  // 공유 딥링크 ?sel= → 해당 콘텐츠 선택
  useEffect(() => {
    if (engine !== "naver") return;
    try {
      const id = new URLSearchParams(window.location.search).get("sel");
      if (id && items.some((i) => i.id === id)) setTimeout(() => selectItem(id), 250);
    } catch { /* noop */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine]);

  // 브라우저 뒤로/앞으로 → URL ?sel 동기화
  useEffect(() => {
    const onPop = () => { try { const id = new URLSearchParams(window.location.search).get("sel"); if (id && items.some((i) => i.id === id)) selectItem(id); else { selRef.current = null; setSelId(null); render(); } } catch { /* noop */ } };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (engine === "fallback")
    return (
      <>
        <FlagtaleMapExplorer items={items} title={title} />
        {CLIENT_ID && (
          <div className="pointer-events-none absolute left-1/2 top-[60px] z-[40] -translate-x-1/2 whitespace-nowrap rounded-full border border-amber/50 bg-card/95 px-3.5 py-1.5 text-[11.5px] font-bold text-muted shadow-lg backdrop-blur">
            ⚠️ 네이버 지도 일시 장애 — 대체 지도로 표시 중
          </div>
        )}
      </>
    );

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div ref={mapEl} className="h-full w-full bg-[#0d2b5e]" />
      {engine === "loading" && (
        <div className="absolute inset-0 z-30 grid place-items-center bg-card2">
          <div className="flex flex-col items-center gap-2 text-muted2">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-line border-t-blue-l" />
            <span className="text-[12px]">네이버 지도 로딩…</span>
          </div>
        </div>
      )}
      {engine === "naver" && (
        <div className="absolute right-2 top-[100px] z-[5] flex flex-col gap-1.5 md:top-16">
          {[
            { icon: mapType === "normal" ? "🛰" : "🗺", label: mapType === "normal" ? "위성" : "일반", on: mapType === "sat", locked: false, onClick: toggleType },
            { icon: "📍", label: "현위치", on: false, locked: false, onClick: locate },
            { icon: "🎨", label: "매력도", on: heat, locked: !canChoro, onClick: () => { if (canChoro) { setHeat((h) => !h); setHotspots(false); } else { setUpsell(true); setTimeout(() => setUpsell(false), 4500); } } },
            { icon: "🔥", label: "핫지역", on: hotspots, locked: false, onClick: () => { setHotspots((v) => !v); setHeat(false); } },
          ].map((c) => (
            <button key={c.label} onClick={c.onClick} aria-label={c.label} aria-pressed={c.on} title={c.locked ? "매력도 색칠(choropleth)은 Pro 전용" : c.label} className={`relative grid w-[46px] place-items-center gap-0.5 rounded-[13px] border-[1.5px] px-1 py-2 shadow-lg transition-colors ${c.on ? "border-ink bg-ink text-white" : "border-line bg-card text-ink hover:border-ink"}`}>
              {c.locked && <span className="absolute -right-1.5 -top-1.5 grid h-4 w-4 place-items-center rounded-full bg-amber text-[8px] shadow">🔒</span>}
              <span className="text-[15px] leading-none">{c.icon}</span>
              <span className="text-[9px] font-extrabold leading-none">{c.label}</span>
            </button>
          ))}
        </div>
      )}
      {/* 커스텀 줌 +/− (우측 하단, 데스크톱) — 네이버 기본 컨트롤 대체로 레이아웃 정렬 */}
      {engine === "naver" && (
        <div className="absolute bottom-3 right-2 z-[5] flex flex-col overflow-hidden rounded-[12px] border-[1.5px] border-line bg-card shadow-lg">
          <button onClick={() => zoomBy(1)} aria-label="확대" className="grid h-10 w-10 place-items-center text-[20px] font-bold leading-none text-ink transition-colors hover:bg-card2">+</button>
          <div className="h-px bg-line" />
          <button onClick={() => zoomBy(-1)} aria-label="축소" className="grid h-10 w-10 place-items-center text-[20px] font-bold leading-none text-ink transition-colors hover:bg-card2">−</button>
        </div>
      )}
      {engine === "naver" && hotspots && (
        <HotspotPanel onJump={flyToHotspot} onClose={() => setHotspots(false)} />
      )}
      {engine === "naver" && routeIds.length > 0 && (
        <div className="absolute left-1/2 top-[60px] z-[15] flex -translate-x-1/2 items-center gap-2 rounded-full border-[1.5px] border-line bg-card px-3.5 py-1.5 text-[12px] font-extrabold text-ink shadow-lg">
          <span>🚩 내 루트 <span className="text-blue-l">{routeIds.length}곳</span></span>
          <button onClick={() => clearRoute()} className="rounded-full bg-card2 px-2 py-0.5 text-[11px] font-bold text-muted2 hover:text-warn">지우기</button>
        </div>
      )}
      {upsell && (
        <div className="absolute right-2 top-[100px] z-[20] w-[210px] rounded-[14px] border-[1.5px] border-amber bg-card p-3 shadow-2xl md:top-16">
          <div className="text-[12px] font-extrabold text-ink">🔒 매력도 색칠은 Pro 전용</div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted2">행정동 매력도 choropleth·시그널·전략은 Pro 등급에서 열려요.</p>
          <a href="/pricing" className="btn-glow mt-2 inline-flex rounded-full bg-amber px-3 py-1.5 text-[11px] font-extrabold text-onaccent">⭐ Pro로 업그레이드 →</a>
        </div>
      )}
      {engine === "naver" && heat && (
        <>
          {choroBusy && (
            <div className="pointer-events-none absolute left-1/2 top-[100px] z-[7] flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-line bg-card/95 px-3 py-1 text-[11px] font-bold text-muted2 shadow-lg backdrop-blur md:top-16">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-line border-t-blue-l" /> 매력도 불러오는 중…
            </div>
          )}
          <ChoroLayerControl layer={choroLayer} onLayer={setChoroLayer} simple={choroSimple} onSimple={setChoroSimple} />
        </>
      )}
      <MapResultsPanel
        title={title} badge="네이버 지도" items={items} filtered={filtered} view={view} cats={cats}
        regions={regions} onRegion={flyRegion} selCats={selCats} onToggleCat={toggleCat} sort={sort} onSort={setSort}
        query={query} onQuery={setQuery} viewportOnly={viewportOnly} onViewportToggle={() => setViewportOnly((v) => !v)}
        priceBand={priceBand} onPriceBand={setPriceBand} minRating={minRating} onMinRating={setMinRating}
        now={now} openOnly={openOnly} onOpenToggle={() => setOpenOnly((v) => !v)} onReset={resetFilters}
        recentCount={recent.length} recentOnly={recentOnly} onRecentToggle={() => setRecentOnly((v) => !v)}
        favs={favs} onFav={toggleFav} favOnly={favOnly} onFavToggle={() => setFavOnly((v) => !v)} onRoadview={(it) => setRoad(it)}
        onSpotAdded={(s) => { setCommunity((c) => [...c.filter((x) => x.id !== s.id), s]); setTimeout(() => selectItem(s.id), 150); }}
        hoverId={hoverId} onHover={setHover}
        selId={selId} sel={sel} onSelect={selectItem} onClose={() => { selRef.current = null; setSelId(null); setUrlSel(null); render(); }}
      />
      {choroHover && (
        <div
          className="pointer-events-none fixed z-[80] -translate-x-1/2 -translate-y-[calc(100%_+_10px)] whitespace-nowrap rounded-[10px] bg-[#0d2b5e] px-2.5 py-1.5 text-[12px] font-extrabold text-white shadow-xl"
          style={{ left: choroHover.x, top: choroHover.y }}
        >
          <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm align-middle" style={{ background: choroHover.color }} />
          {choroHover.name} · {choroHover.label}
        </div>
      )}
      {hoverCard && hoverCard.it.id !== selId && (() => {
        const it = hoverCard.it;
        const os = openState(it.hours, now);
        const left = Math.max(8, Math.min(hoverCard.x - 112, (typeof window !== "undefined" ? window.innerWidth : 1440) - 232));
        const top = Math.max(8, hoverCard.y - 158);
        return (
          <div className="pointer-events-none fixed z-[80] w-[232px]" style={{ left, top }}>
            <div className="relative">
              <div className="overflow-hidden rounded-[16px] border-[1.5px] border-line bg-card shadow-2xl">
                {it.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ftImage(it.image)} alt="" className="h-[92px] w-full object-cover" />
                ) : (
                  <div className="grid h-[76px] w-full place-items-center text-[42px]" style={{ background: `linear-gradient(135deg, ${it.color}2e, ${it.color}0d)` }}>{it.emoji}</div>
                )}
                <div className="p-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-full px-1.5 py-0.5 text-[9.5px] font-extrabold" style={{ background: `${it.color}1f`, color: it.color }}>{it.emoji} {it.catLabel}</span>
                    {os && <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-extrabold ${os === "open" ? "bg-[#03c75a]/15 text-[#03a04a]" : "bg-card2 text-muted2"}`}>{os === "open" ? "🟢 영업중" : "영업종료"}</span>}
                    {it.id.startsWith("ugc-") && <span className="rounded-full bg-blue-l/15 px-1.5 py-0.5 text-[9px] font-extrabold text-blue-l">👥 사용자</span>}
                  </div>
                  <div className="mt-1 truncate text-[14.5px] font-black tracking-tight text-ink">{it.name}</div>
                  <div className="mt-0.5 flex items-center gap-2 text-[11.5px] font-bold text-muted2">
                    {it.rating ? <span className="text-[#f5a623]">★ <span className="text-ink">{Math.round(it.rating * 10) / 10}</span>{it.reviewCount ? ` (${it.reviewCount})` : ""}</span> : null}
                    {it.price ? <span className="text-ink">{it.price.toLocaleString()}원</span> : it.hours ? <span className="truncate">🕒 {it.hours}</span> : null}
                  </div>
                  <div className="mt-1 truncate text-[11px] font-semibold text-muted2">📍 {it.operator || it.region}</div>
                </div>
              </div>
              <div className="absolute -bottom-[6px] left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b-[1.5px] border-r-[1.5px] border-line bg-card" />
            </div>
          </div>
        );
      })()}
      {road && (
        <div className="absolute inset-0 z-[300] bg-black">
          <div ref={panoEl} className="h-full w-full" />
          <div className="absolute left-3 top-3 z-50 rounded-full bg-ink/85 px-3 py-1.5 text-[12px] font-extrabold text-white">🛣 {road.name} · 거리뷰</div>
          <button onClick={() => setRoad(null)} className="absolute right-3 top-3 z-50 rounded-full bg-card px-3.5 py-1.5 text-[12px] font-extrabold text-ink shadow-lg hover:opacity-90">✕ 닫기</button>
        </div>
      )}
    </div>
  );
}
