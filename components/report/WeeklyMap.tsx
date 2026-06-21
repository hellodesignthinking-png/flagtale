"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { DEFAULT_MAP_STYLE, FALLBACK_MAP_STYLE } from "@/lib/constants";

export interface WeeklyMapPoint {
  admCd2: string;
  name: string;
  sigungu: string;
  klai: number;
  momentum: number;
  reason?: string;
  lng: number;
  lat: number;
  kind: "riser" | "faller" | "spotlight";
}

const PIN: Record<WeeklyMapPoint["kind"], { bg: string; label: string }> = {
  riser: { bg: "#1f9d57", label: "▲" },
  faller: { bg: "#d2691e", label: "▼" },
  spotlight: { bg: "#D4861E", label: "★" },
};

function esc(s: string): string {
  return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
}

// 전국 지도 — 이주의 성장(▲)·쇠퇴(▼)·스포트라이트(★) 동네 핀. 클릭 시 팝업(사유+진단 링크).
export function WeeklyMap({ points }: { points: WeeklyMapPoint[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const pts = points.filter((p) => Number.isFinite(p.lng) && Number.isFinite(p.lat));
    const map = new maplibregl.Map({
      container: ref.current,
      style: DEFAULT_MAP_STYLE,
      center: [127.8, 36.3], // 대한민국 중심
      zoom: 5.6,
      attributionControl: false,
    });
    mapRef.current = map;
    let swapped = false;
    map.on("error", (e) => {
      const m = String(e?.error?.message ?? "");
      if (!swapped && /style|fetch|load|network|http/i.test(m)) {
        swapped = true;
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          map.setStyle(FALLBACK_MAP_STYLE as any);
        } catch {
          /* noop */
        }
      }
    });

    const addPins = () => {
      // 스포트라이트를 마지막에(위로) 그리도록 정렬
      const ordered = [...pts].sort((a, b) => (a.kind === "spotlight" ? 1 : 0) - (b.kind === "spotlight" ? 1 : 0));
      ordered.forEach((p) => {
        const st = PIN[p.kind];
        const big = p.kind === "spotlight";
        const sz = big ? 28 : 20;
        const el = document.createElement("div");
        el.style.cssText = `width:${sz}px;height:${sz}px;border-radius:50%;background:${st.bg};color:#fff;font:700 ${big ? 14 : 11}px/${sz}px system-ui;text-align:center;border:2px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.5);cursor:pointer`;
        el.textContent = st.label;
        new maplibregl.Marker({ element: el })
          .setLngLat([p.lng, p.lat])
          .setPopup(
            new maplibregl.Popup({ offset: 14, closeButton: true, maxWidth: "240px" }).setHTML(
              `<div style="font:700 12.5px system-ui;color:#15181d">${esc(p.name)} <span style="color:#5b6470;font-weight:400">${esc(p.sigungu)}</span></div>` +
                `<div style="font:11px system-ui;color:${st.bg};margin-top:1px">KLAI ${p.klai} · 모멘텀 ${p.momentum > 0 ? "+" : ""}${p.momentum}</div>` +
                (p.reason ? `<div style="font:11px system-ui;color:#5b6470;margin-top:2px">${esc(p.reason)}</div>` : "") +
                `<a href="/diagnose?admCd=${p.admCd2}" style="display:inline-block;margin-top:5px;font:600 11px system-ui;color:#1f74c4;text-decoration:none">진단 리포트 →</a>`
            )
          )
          .addTo(map);
      });
      if (pts.length) {
        const b = new maplibregl.LngLatBounds();
        pts.forEach((p) => b.extend([p.lng, p.lat]));
        map.fitBounds(b, { padding: 56, maxZoom: 9.5, duration: 0 });
      }
    };
    map.on("load", addPins);

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={ref} className="h-[360px] w-full overflow-hidden rounded-xl border border-line" />;
}
