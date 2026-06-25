"use client";

import { useEffect, useRef, useState } from "react";

// 세부 페이지 하단용 단일 위치 미니 지도. NEXT_PUBLIC_NAVER_MAP_CLIENT_ID 있으면 네이버 지도, 없으면 폴백(좌표+외부링크).
const CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
const NAVER_SRC = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${CLIENT_ID}`;

function loadNaver(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("ssr"));
    if ((window as any).naver?.maps) return resolve((window as any).naver);
    const prev = document.getElementById("naver-maps-sdk") as HTMLScriptElement | null;
    if (prev) {
      prev.addEventListener("load", () => resolve((window as any).naver));
      prev.addEventListener("error", () => reject(new Error("load")));
      return;
    }
    const s = document.createElement("script");
    s.id = "naver-maps-sdk";
    s.src = NAVER_SRC;
    s.async = true;
    s.onload = () => resolve((window as any).naver);
    s.onerror = () => reject(new Error("load"));
    document.head.appendChild(s);
  });
}

export function NaverMiniMap({
  lat,
  lng,
  name,
  emoji = "📍",
  zoom = 15,
  query,
  markers,
  className = "h-64 w-full",
}: {
  lat?: number | null;
  lng?: number | null;
  name?: string;
  emoji?: string;
  zoom?: number;
  query?: string; // 폴백/외부 링크 검색어(주소·이름)
  markers?: { lat: number; lng: number; emoji?: string; name?: string }[]; // 다중 마커(크루 팀 등)
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const pts = markers && markers.length ? markers : typeof lat === "number" && typeof lng === "number" && !!lat && !!lng ? [{ lat: lat as number, lng: lng as number, emoji, name }] : [];
  const markersKey = pts.map((p) => `${p.lat},${p.lng}`).join("|");
  const [failed, setFailed] = useState(!CLIENT_ID || pts.length === 0);
  const naverUrl = `https://map.naver.com/p/search/${encodeURIComponent(query || name || (pts[0] ? `${pts[0].lat},${pts[0].lng}` : ""))}`;

  useEffect(() => {
    if (!CLIENT_ID || pts.length === 0 || !ref.current) {
      setFailed(true);
      return;
    }
    let cancelled = false;
    loadNaver()
      .then((naver) => {
        if (cancelled || !ref.current) return;
        const map = new naver.maps.Map(ref.current, { center: new naver.maps.LatLng(pts[0].lat, pts[0].lng), zoom, scrollWheel: false });
        const bounds = pts.length > 1 ? new naver.maps.LatLngBounds() : null;
        for (const p of pts) {
          const pos = new naver.maps.LatLng(p.lat, p.lng);
          new naver.maps.Marker({ position: pos, map, icon: { content: `<div style="transform:translate(-50%,-100%);font-size:26px;line-height:1;filter:drop-shadow(0 2px 5px rgba(0,0,0,.45))">${p.emoji ?? emoji}</div>`, anchor: new naver.maps.Point(0, 0) } });
          if (bounds) bounds.extend(pos);
        }
        if (bounds) map.fitBounds(bounds);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markersKey, emoji, zoom]);

  if (failed) {
    return (
      <div className={`flex flex-col items-center justify-center gap-2 rounded-[18px] border-[1.5px] border-line bg-card2 ${className}`}>
        <div className="text-[30px]">🗺</div>
        <div className="px-4 text-center text-[12.5px] text-muted">{name ? `${name} 위치` : "위치"}</div>
        <a href={naverUrl} target="_blank" rel="noopener noreferrer" className="rounded-full border-[1.5px] border-line bg-card px-3.5 py-1.5 text-[12px] font-extrabold text-blue-l transition-colors hover:border-ink">
          네이버 지도에서 열기 →
        </a>
        {!CLIENT_ID && <div className="text-[10.5px] text-muted2">지도 키 활성 시 인라인 지도 표시</div>}
      </div>
    );
  }
  return (
    <div className="relative">
      <div ref={ref} className={`overflow-hidden rounded-[18px] border-[1.5px] border-line ${className}`} />
      <a href={naverUrl} target="_blank" rel="noopener noreferrer" className="absolute bottom-2.5 right-2.5 z-10 rounded-full border border-line bg-card/95 px-2.5 py-1 text-[11px] font-extrabold text-ink shadow backdrop-blur transition-colors hover:border-ink">
        네이버 지도 →
      </a>
    </div>
  );
}
