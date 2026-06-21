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

function esc(s: string): string {
  return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
}

// 앵커 점포 팝업 HTML — 상세(업종·주소·거리·버즈·네이버 링크)
function anchorPopupHTML(s: AnchorStore, rank: number): string {
  const naver = `https://search.naver.com/search.naver?query=${encodeURIComponent(s.name)}`;
  return (
    `<div style="font:700 12.5px system-ui;color:#15181d;margin-bottom:1px">${esc(s.name)} <span style="color:#00a330">#${rank}</span></div>` +
    (s.category ? `<div style="font:11px system-ui;color:#5b6470">${esc(s.category)}</div>` : "") +
    (s.address ? `<div style="font:11px system-ui;color:#5b6470">${esc(s.address)}</div>` : "") +
    `<div style="font:11px system-ui;color:#0f6e5c;margin-top:3px">블로그 회자도 ${s.blogBuzz.toLocaleString()}건${s.distanceM != null ? ` · 진단지점 ${s.distanceM}m` : ""}</div>` +
    `<a href="${naver}" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin-top:5px;font:600 11px system-ui;color:#1f74c4;text-decoration:none">네이버에서 보기 →</a>`
  );
}

// 진단 지점 + 앵커 점포(버즈) + 문화 인프라(종류별 색) 핀 미니 지도.
// selected/onSelect로 리스트↔지도 핀을 양방향 연동(단일 출처 = selected).
export function DiagnoseMap({
  stores,
  center,
  venues = [],
  selected = null,
  onSelect,
}: {
  stores: AnchorStore[];
  center: [number, number];
  venues?: Venue[];
  selected?: number | null;
  onSelect?: (i: number | null) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const anchorsRef = useRef<{ i: number; el: HTMLDivElement; popup: maplibregl.Popup; lng: number; lat: number }[]>([]);
  const selectedRef = useRef<number | null>(selected);
  selectedRef.current = selected;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // selected → 팝업 열기 + 핀 강조 + 패닝 (단일 출처). 리스트 클릭·핀 클릭 모두 이 경로로 수렴.
  function syncSelected() {
    const map = mapRef.current;
    if (!map) return;
    const sel = selectedRef.current;
    for (const a of anchorsRef.current) {
      const on = a.i === sel;
      // ⚠ transform은 maplibre가 핀 위치 지정에 쓰므로 건드리지 않는다(덮으면 핀이 어긋남).
      //    강조는 box-shadow 글로우 + 배경/테두리로만.
      a.el.style.boxShadow = on ? "0 0 0 4px rgba(0,230,70,.55), 0 2px 7px rgba(0,0,0,.5)" : "0 1px 4px rgba(0,0,0,.4)";
      a.el.style.background = on ? "#00e646" : "#00c43a";
      a.el.style.borderColor = on ? "#eafff0" : "#fff";
      a.el.style.zIndex = on ? "20" : "1";
      if (on && !a.popup.isOpen()) a.popup.setLngLat([a.lng, a.lat]).addTo(map);
      else if (!on && a.popup.isOpen()) a.popup.remove();
    }
    if (sel != null) {
      const a = anchorsRef.current.find((x) => x.i === sel);
      if (a) map.easeTo({ center: [a.lng, a.lat], duration: 350 });
    }
  }

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
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
    const apts = stores.filter((s) => Number.isFinite(s.lng) && Number.isFinite(s.lat));
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
              `<div style="font:600 12px system-ui;color:#15181d">${esc(v.name)}</div><div style="font:11px system-ui;color:${color}">${
                VENUE_LABEL[v.kind] ?? ""
              } · ${v.publicOp ? "공공" : "민간"}${v.distanceM != null ? ` · ${v.distanceM}m` : ""}</div>`
            )
          )
          .addTo(map);
      });

      // 앵커 점포 — 순위 핀. 리스트와 동일한 '원본 인덱스(i)'를 써서 선택 연동.
      // 팝업은 marker.setPopup이 아니라 selected 상태가 직접 제어(단일 출처, 토글 충돌 방지).
      anchorsRef.current = [];
      stores.forEach((s, i) => {
        if (!Number.isFinite(s.lng) || !Number.isFinite(s.lat)) return;
        const el = document.createElement("div");
        el.style.cssText =
          "width:22px;height:22px;border-radius:50%;background:#00c43a;color:#06210d;font:700 11px/22px system-ui;text-align:center;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4);cursor:pointer;transition:box-shadow .15s,background .15s";
        el.textContent = String(i + 1);
        const popup = new maplibregl.Popup({ offset: 16, closeButton: true, maxWidth: "260px" }).setHTML(anchorPopupHTML(s, i + 1));
        popup.on("close", () => {
          if (selectedRef.current === i) onSelectRef.current?.(null); // 팝업 X로 닫으면 선택 해제
        });
        new maplibregl.Marker({ element: el }).setLngLat([s.lng as number, s.lat as number]).addTo(map);
        el.addEventListener("click", (ev) => {
          ev.stopPropagation();
          onSelectRef.current?.(selectedRef.current === i ? null : i); // 핀 클릭 = 토글(리스트와 동일)
        });
        anchorsRef.current.push({ i, el, popup, lng: s.lng as number, lat: s.lat as number });
      });

      const all = [...apts, ...vpts];
      if (all.length) {
        const b = new maplibregl.LngLatBounds();
        all.forEach((s) => b.extend([s.lng as number, s.lat as number]));
        b.extend(center);
        map.fitBounds(b, { padding: 48, maxZoom: 15.5, duration: 0 });
      }
      syncSelected(); // 초기 선택 반영
    };
    map.on("load", addPins);

    return () => {
      map.remove();
      mapRef.current = null;
      anchorsRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    syncSelected();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  return <div ref={ref} className="h-[280px] w-full overflow-hidden rounded-xl border border-line" />;
}
