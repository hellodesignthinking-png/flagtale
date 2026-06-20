import { NextRequest, NextResponse } from "next/server";
import { loadDistricts, loadScores } from "@/lib/data";
import { colorForLayer, displayForLayer, elevationForLayer, isPulseAlert } from "@/lib/scoring";
import type { LayerId } from "@/lib/types";

// 전국(수천 동) 지도용 압축 페이로드. 레이어별로 동×전기간 색·라벨·경보만 반환.
// scores.json 전체(11MB+)를 클라이언트로 보내지 않기 위함. 레이어별 모듈 캐시.
const cache = new Map<string, unknown>();

export function GET(req: NextRequest) {
  const layer = (req.nextUrl.searchParams.get("layer") || "klai") as LayerId;
  if (cache.has(layer)) return NextResponse.json(cache.get(layer));

  const scores = loadScores();
  const periods = scores.periods;
  const districts = loadDistricts();

  // byPlace[admCd2] = { c: [[r,g,b,a]×기간], l: [label×기간], e: [높이0~100×기간], a: [0/1×기간] }
  const byPlace: Record<string, { c: number[][]; l: string[]; e: number[]; a?: number[] }> = {};
  const alertLayer = layer === "gentri" || layer === "narrative";

  for (const f of districts.features) {
    const cd = f.properties.admCd2;
    const series = scores.byPlace[cd];
    if (!series || series.length === 0) continue;
    const c: number[][] = [];
    const l: string[] = [];
    const e: number[] = [];
    const a: number[] = [];
    for (let t = 0; t < periods.length; t++) {
      const s = series[t] ?? series[series.length - 1];
      c.push(colorForLayer(layer, s));
      l.push(displayForLayer(layer, s));
      e.push(Math.round(elevationForLayer(layer, s)));
      if (alertLayer) a.push(isPulseAlert(layer, s) ? 1 : 0);
    }
    byPlace[cd] = alertLayer ? { c, l, e, a } : { c, l, e };
  }

  const payload = { layer, periods, last: scores.last, byPlace };
  cache.set(layer, payload);
  return NextResponse.json(payload);
}
