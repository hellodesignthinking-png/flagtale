import { NextRequest, NextResponse } from "next/server";

// 줌인 시 세부(지번·필지·로컬상점) 데이터 — 뷰포트 bbox 기준 생성.
// 지리적으로 고정된 격자(셀) + 결정론적 값 → 패닝해도 일관(실제 필지처럼).
// ⚠ 샘플: 실데이터는 VWorld 연속지적도(필지) + LOCALDATA(상점) 키로 치환.

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hash2 = (x: number, y: number) => mulberry32((x * 73856093) ^ (y * 19349663))();

const POI_NAMES = ["로컬", "골목", "햇살", "모퉁이", "단골", "이웃", "온기", "마실", "터무니", "소소", "하루", "정담"];
const POI_CATS = [
  { key: "cafe", label: "카페", color: [212, 134, 30] },
  { key: "food", label: "음식점", color: [210, 105, 30] },
  { key: "retail", label: "소매", color: [62, 154, 168] },
  { key: "culture", label: "문화·여가", color: [15, 110, 92] },
  { key: "service", label: "생활서비스", color: [75, 156, 211] },
  { key: "village", label: "마을거점", color: [162, 58, 42] },
];

export function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const bbox = (sp.get("bbox") || "").split(",").map(Number);
  if (bbox.length !== 4 || bbox.some(Number.isNaN)) {
    return NextResponse.json({ error: "bad_bbox" }, { status: 400 });
  }
  let [minLng, minLat, maxLng, maxLat] = bbox;
  // 면적 과대(줌아웃)면 빈 응답 — 세부는 충분히 확대했을 때만
  if (maxLng - minLng > 0.13 || maxLat - minLat > 0.13) {
    return NextResponse.json({ parcels: [], pois: [], tooWide: true });
  }
  // 적응형 셀 — 확대할수록 더 잘게(골목·필지 단위). 줌과 무관하게 셀 수 일정.
  const span = Math.max(maxLng - minLng, maxLat - minLat);
  const CELL = Math.max(0.0005, Math.min(0.0014, span / 58)); // ≈ 45~150m
  const snap = (v: number) => Math.floor(v / CELL) * CELL;
  minLng = snap(minLng);
  minLat = snap(minLat);

  const parcels: { id: string; g: number; v: number; polygon: number[][] }[] = [];
  const pois: { lng: number; lat: number; name: string; cat: string; label: string; metric: number; color: number[] }[] = [];

  for (let lng = minLng; lng < maxLng; lng += CELL) {
    for (let lat = minLat; lat < maxLat; lat += CELL) {
      const ix = Math.round(lng / CELL);
      const iy = Math.round(lat / CELL);
      // 공간 군집: 거친 노이즈 + 세밀 노이즈
      const coarse = hash2(ix >> 2, iy >> 2);
      const fine = hash2(ix, iy);
      const g = Math.round((coarse * 0.62 + fine * 0.38) * 80 + 12); // 성장지수 12~92
      const v = Math.round((fine * 0.7 + coarse * 0.3) * 100); // 매출/활력 지수
      parcels.push({
        id: `${ix}_${iy}`,
        g,
        v,
        polygon: [
          [round6(lng), round6(lat)],
          [round6(lng + CELL), round6(lat)],
          [round6(lng + CELL), round6(lat + CELL)],
          [round6(lng), round6(lat + CELL)],
          [round6(lng), round6(lat)],
        ],
      });
      // 로컬 상점/마을 포인트 — 활력 높은 셀 위주로 배치
      const r = mulberry32((ix * 374761393) ^ (iy * 668265263));
      const nPoi = v > 62 ? (r() < 0.5 ? 2 : 1) : r() < 0.32 ? 1 : 0;
      for (let k = 0; k < nPoi; k++) {
        const ci = Math.floor(r() * POI_CATS.length);
        const cat = POI_CATS[ci];
        const nm = POI_NAMES[Math.floor(r() * POI_NAMES.length)];
        pois.push({
          lng: round6(lng + CELL * (0.2 + r() * 0.6)),
          lat: round6(lat + CELL * (0.2 + r() * 0.6)),
          name: `${nm}${cat.label === "마을거점" ? " 마을" : cat.label === "카페" ? " 카페" : ""}`,
          cat: cat.key,
          label: cat.label,
          metric: Math.round(40 + r() * 60),
          color: cat.color,
        });
      }
    }
  }

  // 과밀 방지 캡
  return NextResponse.json({
    parcels: parcels.slice(0, 3400),
    pois: pois.slice(0, 260),
    cell: CELL,
    note: "샘플 세부데이터 — 실데이터: VWorld 연속지적도(필지)·LOCALDATA(상점)",
  });
}

function round6(v: number) {
  return Math.round(v * 1e6) / 1e6;
}
