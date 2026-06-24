import type { Metadata } from "next";
import { buildMapItems } from "@/lib/flagtale";
import { FlagtaleMapMount } from "@/components/flagtale/FlagtaleMapMount";

export const metadata: Metadata = { title: "플래그맵 · 디지털 플래그 맵" };

export default function MapTalePage() {
  const mapItems = buildMapItems();

  return (
    <div className="theme-light relative h-screen overflow-hidden bg-navy pt-14 text-ink">
      <h1 className="sr-only">디지털 플래그맵 — 전국 로컬 콘텐츠(투어·숙박·축제·카페·맛집·책방·갤러리·공방·바·브루어리·상점·거점) 지도</h1>
      <section className="relative z-10 h-[calc(100vh_-_3.5rem)] w-full">
        <FlagtaleMapMount items={mapItems} title={`🚩 플래그맵 · ${mapItems.length}곳`} />
      </section>
    </div>
  );
}
