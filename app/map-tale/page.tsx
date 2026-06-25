import type { Metadata } from "next";
import Link from "next/link";
import { buildMapItems } from "@/lib/flagtale";
import { FlagtaleMapMount } from "@/components/flagtale/FlagtaleMapMount";

export const metadata: Metadata = { title: "플래그맵 · 로컬 콘텐츠 지도(투어·매장·스테이)" };

export default function MapTalePage() {
  const mapItems = buildMapItems();

  return (
    <div className="theme-light relative h-screen overflow-hidden bg-navy pt-14 text-ink">
      <h1 className="sr-only">디지털 플래그맵 — 전국 로컬 콘텐츠(투어·숙박·축제·카페·맛집·책방·갤러리·공방·바·브루어리·상점·거점) 지도</h1>
      {/* 이중 지도 역할 안내 — 이건 '콘텐츠' 지도, 매력도 '데이터' 지도는 /map */}
      <Link
        href="/map"
        className="fixed left-1/2 top-[60px] z-30 hidden -translate-x-1/2 whitespace-nowrap rounded-full border-[1.5px] border-line bg-card/95 px-3.5 py-1.5 text-[12px] font-extrabold text-ink shadow-lg backdrop-blur transition-colors hover:border-ink sm:inline-flex"
      >
        🚩 콘텐츠 플래그맵 · <span className="font-bold text-muted2">매력도 데이터 지도 →</span>
      </Link>
      <section className="relative z-10 h-[calc(100vh_-_3.5rem)] w-full">
        <FlagtaleMapMount items={mapItems} title={`🚩 플래그맵 · ${mapItems.length}곳`} />
      </section>
    </div>
  );
}
