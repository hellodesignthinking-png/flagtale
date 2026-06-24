import { NextRequest, NextResponse } from "next/server";
import { loadDistricts, loadScores } from "@/lib/data";
import { colorForLayer, displayForLayer, elevationForLayer, isPulseAlert, gradeOf } from "@/lib/scoring";
import { narrativeForPlace, STAGE_META } from "@/lib/narratives";
import { supplyBoost } from "@/lib/supply";
import { instagramFor, buzzBoost } from "@/lib/connectors/instagram";
import type { LayerId } from "@/lib/types";

// hex(#RRGGBB) → [r,g,b,a]. 핫지역 큐레이션 5단계 색을 지도 narrative 레이어에 적용.
const hexRgb = (h: string): number[] => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255]; };

// 전국(수천 동) 지도용 압축 페이로드. 레이어별로 동×전기간 색·라벨·경보만 반환.
// scores.json 전체(11MB+)를 클라이언트로 보내지 않기 위함. 레이어별 모듈 캐시.
const cache = new Map<string, unknown>();
const CACHE = "public, max-age=600, s-maxage=86400, stale-while-revalidate=604800"; // 배포별 정적 → CDN 장기 캐시

export function GET(req: NextRequest) {
  const layer = (req.nextUrl.searchParams.get("layer") || "klai") as LayerId;
  if (cache.has(layer)) return NextResponse.json(cache.get(layer), { headers: { "cache-control": CACHE } });

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
    // narrative 레이어 + 핫지역이면 큐레이션 5단계(검증)로 색·라벨 고정 → 쇼케이스/패널과 일관
    const narr = layer === "narrative" ? narrativeForPlace(cd) : null;
    const narrColor = narr ? hexRgb(STAGE_META[narr.stage].color) : null;
    const narrLabel = narr ? `${STAGE_META[narr.stage].emoji} ${STAGE_META[narr.stage].short} · ${narr.name}` : null;
    const narrAlert = narr ? (narr.stage === "gentri" || narr.stage === "decline" ? 1 : 0) : null;
    // 종합(klai) 레이어엔 공급(등록 콘텐츠)+수요(인스타 검색량) 가산을 반영 → /place·패널과 일관.
    let boost = 0;
    if (layer === "klai") {
      const nb = narrativeForPlace(cd);
      boost = Math.round((supplyBoost(cd) + buzzBoost(nb ? instagramFor(nb.name)?.postsCount : null)) * 10) / 10;
    }
    for (let t = 0; t < periods.length; t++) {
      const s0 = series[t] ?? series[series.length - 1];
      const s = boost ? { ...s0, klai: Math.min(100, Math.round((s0.klai + boost) * 10) / 10), grade: gradeOf(s0.klai + boost) } : s0;
      c.push(narrColor ?? colorForLayer(layer, s));
      l.push(narrLabel ?? displayForLayer(layer, s));
      e.push(Math.round(elevationForLayer(layer, s)));
      if (alertLayer) a.push(narrAlert ?? (isPulseAlert(layer, s) ? 1 : 0));
    }
    byPlace[cd] = alertLayer ? { c, l, e, a } : { c, l, e };
  }

  const payload = { layer, periods, last: scores.last, byPlace };
  cache.set(layer, payload);
  return NextResponse.json(payload, { headers: { "cache-control": CACHE } });
}
