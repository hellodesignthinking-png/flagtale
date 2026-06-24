"use client";

import dynamic from "next/dynamic";
import type { MapItem } from "@/lib/flagtale-types";

// 브라우저 전용 → SSR 비활성. NaverMapExplorer(네이버 지도) → 키 없거나 인증실패 시 maplibre 폴백.
const Map = dynamic(() => import("./NaverMapExplorer"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center bg-card2">
      <div className="flex flex-col items-center gap-2 text-muted2">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-line border-t-blue-l" />
        <span className="text-[12px]">콘텐츠 지도 로딩…</span>
      </div>
    </div>
  ),
});

export function FlagtaleMapMount({ items, title }: { items: MapItem[]; title?: string }) {
  return <Map items={items} title={title} />;
}
