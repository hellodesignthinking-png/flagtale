"use client";

import dynamic from "next/dynamic";
import type { MapHighlights } from "./MapExplorer";

// maplibre-gl / deck.gl 은 브라우저 전용 → SSR 비활성. 데이터는 클라이언트가 직접 fetch.
const MapExplorer = dynamic(() => import("./MapExplorer").then((m) => m.MapExplorer), {
  ssr: false,
  loading: () => (
    <div className="grid h-[calc(100vh_-_3.5rem)] place-items-center bg-navy">
      <div className="flex flex-col items-center gap-3 text-muted2">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-blue-l" />
        <span className="text-[13px]">지도 로딩 중…</span>
      </div>
    </div>
  ),
});

export function MapMount(props: { highlights: MapHighlights }) {
  return <MapExplorer {...props} />;
}
