"use client";

import dynamic from "next/dynamic";
import type { Hero3DPoint } from "./LandingHero3DMap";

// maplibre/deck.gl 은 브라우저 전용 → SSR 비활성 동적 로드.
const Map = dynamic(() => import("./LandingHero3DMap"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center bg-navy/40">
      <div className="flex flex-col items-center gap-2 text-muted2">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-line border-t-blue-l" />
        <span className="text-[12px]">3D 지도 로딩…</span>
      </div>
    </div>
  ),
});

export function LandingHero3DMapMount({ points, onPick }: { points: Hero3DPoint[]; onPick?: (p: Hero3DPoint) => void }) {
  return <Map points={points} onPick={onPick} />;
}
