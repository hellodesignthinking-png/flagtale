"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Supercluster from "supercluster";
import { DEFAULT_MAP_STYLE, FALLBACK_MAP_STYLE } from "@/lib/constants";
import { MAP_CATS, type MapItem } from "@/lib/flagtale-types";
import { MapResultsPanel, sortItems } from "./MapResultsPanel";

const LABEL_ZOOM = 8.6;
// 위성 지도 타입(ESRI World Imagery 래스터)
const SAT_STYLE = {
  version: 8 as const,
  sources: { sat: { type: "raster" as const, tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"], tileSize: 256, attribution: "Esri" } },
  layers: [{ id: "sat", type: "raster" as const, source: "sat" }],
};

function leafPill(it: MapItem, selected: boolean, showName: boolean) {
  const outer = document.createElement("button");
  outer.type = "button";
  outer.setAttribute("aria-label", it.name);
  outer.style.cssText = "background:none;border:none;padding:0;cursor:pointer;";
  const named = showName || selected;
  const pill = document.createElement("div");
  pill.style.cssText = `display:flex;align-items:center;gap:5px;white-space:nowrap;border-radius:999px;transition:transform .12s;background:${selected ? it.color : "#fff"};border:${selected ? "2.5px solid #fff" : `2px solid ${it.color}`};padding:${named ? "3px 9px 3px 6px" : "4px"};box-shadow:${selected ? `0 0 0 4px ${it.color}55,0 4px 12px rgba(0,0,0,.45)` : "0 2px 9px rgba(0,0,0,.38)"};`;
  pill.innerHTML = `<span style="font-size:13px;line-height:1">${it.emoji}</span>${named ? `<span style="font-size:11px;font-weight:800;max-width:120px;overflow:hidden;text-overflow:ellipsis;color:${selected ? "#fff" : "#131316"}">${it.name}</span>` : ""}`;
  outer.appendChild(pill);
  outer.onmouseenter = () => { if (!selected) pill.style.transform = "scale(1.08)"; };
  outer.onmouseleave = () => { pill.style.transform = "scale(1)"; };
  return outer;
}

function clusterBadge(count: number) {
  const el = document.createElement("button");
  el.type = "button";
  const size = count < 10 ? 38 : count < 30 ? 46 : 54;
  el.style.cssText = `display:grid;place-items:center;width:${size}px;height:${size}px;border-radius:50%;background:#131316;border:3px solid #fff;color:#fff;font-family:Pretendard,system-ui;font-weight:900;font-size:${count < 30 ? 14 : 15}px;box-shadow:0 4px 14px rgba(0,0,0,.5);cursor:pointer;`;
  el.textContent = String(count);
  return el;
}

export default function FlagtaleMapExplorer({ items, title }: { items: MapItem[]; title?: string }) {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const indexRef = useRef<Supercluster | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const locRef = useRef<maplibregl.Marker | null>(null);
  const selRef = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  const [selCats, setSelCats] = useState<string[]>([]);
  const toggleCat = (k: string) => { if (k === "all") return setSelCats([]); setSelCats((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k])); };
  const [sort, setSort] = useState("rating");
  const [selId, setSelId] = useState<string | null>(null);
  const [mapType, setMapType] = useState<"dark" | "sat">("dark");

  const cats = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((i) => (counts[i.cat] = (counts[i.cat] ?? 0) + 1));
    return MAP_CATS.filter((c) => counts[c.key]).map((c) => ({ ...c, count: counts[c.key] }));
  }, [items]);
  const filtered = useMemo(() => sortItems(selCats.length ? items.filter((i) => selCats.includes(i.cat)) : items, sort), [items, selCats, sort]);
  const sel = useMemo(() => items.find((i) => i.id === selId) ?? null, [items, selId]);

  function render() {
    const map = mapRef.current;
    const index = indexRef.current;
    if (!map || !index) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    const z = Math.round(map.getZoom());
    const b = map.getBounds();
    const showName = map.getZoom() >= LABEL_ZOOM;
    const clusters = index.getClusters([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()], z);
    for (const c of clusters) {
      const [lng, lat] = c.geometry.coordinates;
      if ((c.properties as any).cluster) {
        const count = (c.properties as any).point_count as number;
        const el = clusterBadge(count);
        el.onclick = (e) => {
          e.stopPropagation();
          const ez = index.getClusterExpansionZoom((c.properties as any).cluster_id);
          map.flyTo({ center: [lng, lat], zoom: Math.min(ez, 16), duration: 500 });
        };
        markersRef.current.push(new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map));
      } else {
        const it = (c.properties as any).item as MapItem;
        const el = leafPill(it, it.id === selRef.current, showName);
        el.onclick = (e) => { e.stopPropagation(); selectItem(it.id); };
        markersRef.current.push(new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map));
      }
    }
  }

  function selectItem(id: string) {
    selRef.current = id;
    setSelId(id);
    const it = items.find((x) => x.id === id);
    if (it && mapRef.current) mapRef.current.flyTo({ center: [it.lng, it.lat], zoom: Math.max(mapRef.current.getZoom(), 13), duration: 600, padding: { left: 380, top: 0, right: 0, bottom: 0 } });
    render();
  }

  function locate() {
    if (!navigator.geolocation || !mapRef.current) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const map = mapRef.current!;
        map.flyTo({ center: [lng, lat], zoom: 14, duration: 700 });
        locRef.current?.remove();
        const dot = document.createElement("div");
        dot.style.cssText = "width:16px;height:16px;border-radius:50%;background:#1e5fa8;border:3px solid #fff;box-shadow:0 0 0 4px rgba(30,95,168,.3),0 2px 6px rgba(0,0,0,.4);";
        locRef.current = new maplibregl.Marker({ element: dot }).setLngLat([lng, lat]).addTo(map);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  // 지도 1회 초기화
  useEffect(() => {
    const el = mapEl.current;
    if (!el || items.length === 0) return;
    const lngs = items.map((i) => i.lng);
    const lats = items.map((i) => i.lat);
    const map = new maplibregl.Map({ container: el, style: DEFAULT_MAP_STYLE, center: [(Math.min(...lngs) + Math.max(...lngs)) / 2, (Math.min(...lats) + Math.max(...lats)) / 2], zoom: 6, attributionControl: false });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    let fell = false;
    map.on("error", () => { if (fell) return; fell = true; try { map.setStyle(FALLBACK_MAP_STYLE as maplibregl.StyleSpecification); } catch { /* noop */ } });
    map.on("load", () => {
      map.resize();
      try { const bb = new maplibregl.LngLatBounds(); items.forEach((p) => bb.extend([p.lng, p.lat])); map.fitBounds(bb, { padding: { top: 70, bottom: 60, left: 400, right: 60 }, maxZoom: 12, duration: 0 }); } catch { /* keep */ }
      setReady(true);
      render();
    });
    map.on("moveend", render);
    const t = setTimeout(() => map.resize(), 350);
    return () => { clearTimeout(t); markersRef.current.forEach((m) => m.remove()); markersRef.current = []; map.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  // 클러스터 인덱스 (필터·정렬 변화 시 재구축)
  useEffect(() => {
    if (!ready) return;
    const index = new Supercluster({ radius: 64, maxZoom: 14 });
    index.load(filtered.map((it) => ({ type: "Feature" as const, properties: { item: it }, geometry: { type: "Point" as const, coordinates: [it.lng, it.lat] } })));
    indexRef.current = index;
    render();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, ready]);

  // 지도 타입 토글
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    try { map.setStyle(mapType === "sat" ? (SAT_STYLE as maplibregl.StyleSpecification) : DEFAULT_MAP_STYLE); } catch { /* noop */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapType]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div ref={mapEl} className="h-full w-full" />

      {/* 지도 컨트롤: 지도타입 · 현재위치 (네이버부동산식) */}
      <div className="absolute right-2 top-[92px] z-10 flex flex-col gap-1.5 md:top-14">
        <button onClick={() => setMapType((t) => (t === "dark" ? "sat" : "dark"))} title="지도 타입" className="grid h-9 w-9 place-items-center rounded-[10px] border-[1.5px] border-line bg-card text-[15px] shadow-lg hover:border-ink">{mapType === "dark" ? "🛰" : "🗺"}</button>
        <button onClick={locate} title="현재 위치" className="grid h-9 w-9 place-items-center rounded-[10px] border-[1.5px] border-line bg-card text-[15px] shadow-lg hover:border-ink">📍</button>
      </div>

      <MapResultsPanel
        title={title} badge="지도" items={items} filtered={filtered} cats={cats}
        selCats={selCats} onToggleCat={toggleCat} sort={sort} onSort={setSort}
        selId={selId} sel={sel} onSelect={selectItem} onClose={() => { selRef.current = null; setSelId(null); render(); }}
      />
    </div>
  );
}
