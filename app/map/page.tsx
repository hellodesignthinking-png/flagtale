import { loadDistricts, loadScores } from "@/lib/data";
import { MapMount } from "@/components/map/MapMount";
import type { MapHighlights } from "@/components/map/MapExplorer";

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

  const highlights: MapHighlights = {
    count: rows.length,
    hotspots,
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

  return <MapMount highlights={highlights} />;
}
