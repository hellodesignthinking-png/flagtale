import type { Metadata } from "next";
import Link from "next/link";
import { loadDistricts, loadScores } from "@/lib/data";
import { loadSpots, loadStays, loadBasecamps, SPOT_CAT } from "@/lib/flagtale";
import { MapMount } from "@/components/map/MapMount";
import type { MapHighlights } from "@/components/map/MapExplorer";

export const metadata: Metadata = {
  title: "매력도 지도 — 전국 행정동 3D 지도",
  description: "전국 행정동 매력도(KLAI)를 색·높이로 3D 지도에. 종합·4축·모멘텀·젠트리·시장활성도·내러티브·공공예산 레이어 + 시간 재생.",
};

const hexRgb = (h: string): [number, number, number] => {
  const n = parseInt(h.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

// 전국 매력도 지도(HERO). 경계·점수는 클라이언트가 /api/geojson · /api/mapdata 로 로드.
export default function MapPage() {
  const districts = loadDistricts();
  const scores = loadScores();

  const rows = districts.features
    .map((f) => {
      const series = scores.byPlace[f.properties.admCd2] ?? [];
      return { p: f.properties, s: series[series.length - 1] };
    })
    .filter((r) => r.s);

  const byMomentumDesc = [...rows].sort((a, b) => b.s.momentum - a.s.momentum);
  const riserRow = byMomentumDesc[0];
  const declineRow = byMomentumDesc[byMomentumDesc.length - 1];
  const gentriRow = [...rows].filter((r) => r.s.gentriFlag).sort((a, b) => b.s.gentriStage - a.s.gentriStage)[0];

  const hotspots = byMomentumDesc.slice(0, 8).map((r) => ({
    admCd2: r.p.admCd2,
    name: r.p.name,
    sigungu: r.p.sigungu,
    lng: r.p.centroidLng,
    lat: r.p.centroidLat,
    momentum: r.s.momentum,
    klai: r.s.klai,
    grade: r.s.grade,
  }));

  // Flagtale 로컬 콘텐츠(발견·플래그맵의 스팟·스테이·거점)를 전국지도 위에 포인트로
  const localPois = [
    ...loadSpots().filter((s) => s.lat && s.lng).map((s) => ({ name: s.name, lat: s.lat, lng: s.lng, color: hexRgb(SPOT_CAT[s.category]?.color ?? "#888888"), kind: "spot", sub: `${SPOT_CAT[s.category]?.label ?? s.category} · ${s.region}` })),
    ...loadStays().filter((s) => s.lat && s.lng).map((s) => ({ name: s.title, lat: s.lat, lng: s.lng, color: [22, 163, 74] as [number, number, number], kind: "stay", sub: `스테이 · ${s.region}` })),
    ...loadBasecamps().filter((b) => b.lat && b.lng).map((b) => ({ name: b.name, lat: b.lat, lng: b.lng, color: [217, 242, 30] as [number, number, number], kind: "basecamp", sub: `거점 · ${b.region}` })),
  ];

  const highlights: MapHighlights = {
    count: rows.length,
    hotspots,
    localPois,
    riser: riserRow && {
      admCd2: riserRow.p.admCd2, name: riserRow.p.name, sigungu: riserRow.p.sigungu,
      klai: riserRow.s.klai, grade: riserRow.s.grade, momentum: riserRow.s.momentum,
    },
    gentri: gentriRow && {
      admCd2: gentriRow.p.admCd2, name: gentriRow.p.name, sigungu: gentriRow.p.sigungu,
      klai: gentriRow.s.klai, grade: gentriRow.s.grade, stage: gentriRow.s.gentriStage,
    },
    decline: declineRow && {
      admCd2: declineRow.p.admCd2, name: declineRow.p.name, sigungu: declineRow.p.sigungu,
      klai: declineRow.s.klai, grade: declineRow.s.grade, momentum: declineRow.s.momentum,
    },
  };

  return (
    <>
      {/* 이중 지도 역할 안내 — 이건 매력도 '데이터' 3D 지도, 콘텐츠 지도는 /map-tale */}
      <Link
        href="/map-tale"
        className="fixed left-1/2 top-[60px] z-30 hidden -translate-x-1/2 whitespace-nowrap rounded-full border-[1.5px] border-line bg-card/95 px-3.5 py-1.5 text-[12px] font-extrabold text-ink shadow-lg backdrop-blur transition-colors hover:border-ink sm:inline-flex"
      >
        📊 매력도 데이터 지도 · <span className="font-bold text-muted2">콘텐츠 플래그맵 →</span>
      </Link>
      <MapMount highlights={highlights} />
    </>
  );
}
