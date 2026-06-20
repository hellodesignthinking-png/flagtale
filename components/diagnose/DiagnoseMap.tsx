"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { DEFAULT_MAP_STYLE, FALLBACK_MAP_STYLE } from "@/lib/constants";
import type { AnchorStore } from "@/lib/connectors/anchor";
import type { Venue } from "@/lib/connectors/venues";

const VENUE_COLOR: Record<string, string> = {
  gallery: "#8b6ef6",
  library: "#4b9cd3",
  bookstore: "#1e7a8c",
  theater: "#d4861e",
  gym: "#0f6e5c",
  park: "#34a853",
};
const VENUE_LABEL: Record<string, string> = {
  gallery: "갤러리·미술관",
  library: "도서관",
  bookstore: "책방·서점",
  theater: "공연장·극장",
  gym: "체육·체육관",
  park: "공원·녹지",
};

// 진단 지점 + 앵커 점포(버즈) + 문화 인프라(종류별 색) 핀 미니 지도
export function DiagnoseMap({ stores, center, venues = [] }: { stores: AnchorStore[]; center: [number, number]; venues?: Venue[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const pts = stores.filter((s) => Number.isFinite(s.lng) && Number.isFinite(s.lat));
    const map = new maplibregl.Map({
      container: ref.current,
      style: DEFAULT_MAP_STYLE,
      center,
      zoom: 14.5,
      attributionControl: false,
    });
    mapRef.current = map;
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

    const vpts = venues.filter((v) => Number.isFinite(v.lng) && Number.isFinite(v.lat));
    const addPins = () => {
      // 진단 지점
      new maplibregl.Marker({ color: "#1f74c4" }).setLngLat(center).addTo(map);

      // 문화 인프라 — 종류별 색 핀 (공공은 흰 외곽링↑)
      vpts.forEach((v) => {
        const color = VENUE_COLOR[v.kind] ?? "#888";
        const el = document.createElement("div");
        el.style.cssText = `width:14px;height:14px;border-radius:50%;background:${color};border:2px solid ${
          v.publicOp ? "#fff" : "rgba(255,255,255,.55)"
        };box-shadow:0 1px 3px rgba(0,0,0,.45);cursor:pointer`;
        new maplibregl.Marker({ element: el })
          .setLngLat([v.lng as number, v.lat as number])
          .setPopup(
            new maplibregl.Popup({ offset: 12, closeButton: false }).setHTML(
              `<div style="font:600 12px system-ui;color:#15181d">${v.name}</div><div style="font:11px system-ui;color:${color}">${
                VENUE_LABEL[v.kind] ?? ""
              } · ${v.publicOp ? "공공" : "민간"}${v.distanceM != null ? ` · ${v.distanceM}m` : ""}</div>`
            )
          )
          .addTo(map);
      });

      // 앵커 점포 — 순위 핀
      pts.forEach((s, i) => {
        const el = document.createElement("div");
        el.style.cssText =
          "width:22px;height:22px;border-radius:50%;background:#00c43a;color:#06210d;font:700 11px/22px system-ui;text-align:center;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4);cursor:pointer";
        el.textContent = String(i + 1);
        new maplibregl.Marker({ element: el })
          .setLngLat([s.lng as number, s.lat as number])
          .setPopup(
            new maplibregl.Popup({ offset: 16, closeButton: false }).setHTML(
              `<div style="font:600 12px system-ui;color:#15181d">${s.name}</div><div style="font:11px system-ui;color:#5b6470">블로그 ${s.blogBuzz.toLocaleString()}건</div>`
            )
          )
          .addTo(map);
      });

      const all = [...pts, ...vpts];
      if (all.length) {
        const b = new maplibregl.LngLatBounds();
        all.forEach((s) => b.extend([s.lng as number, s.lat as number]));
        b.extend(center);
        map.fitBounds(b, { padding: 48, maxZoom: 15.5, duration: 0 });
      }
    };
    map.on("load", addPins);

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={ref} className="h-[280px] w-full overflow-hidden rounded-xl border border-line" />;
}
