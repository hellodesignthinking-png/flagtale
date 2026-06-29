import { NextRequest, NextResponse } from "next/server";
import { commerceFor, vacantFor, loadDistricts, loadScores } from "@/lib/data";
import { colorForLayer, displayForLayer, elevationForLayer, isPulseAlert, gradeOf } from "@/lib/scoring";
import { narrativeForPlace, STAGE_META } from "@/lib/narratives";
import { supplyBoost, authenticityGap } from "@/lib/supply";
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
    // 공급(등록 콘텐츠)+수요(인스타 검색량) 가산 — 종합(klai)엔 점수 보정, 활력(vitality)엔 단독 표시.
    let boost = 0;
    let authG: { gap: number; signal: number } | null = null;
    if (layer === "klai" || layer === "vitality") {
      const nb = narrativeForPlace(cd);
      boost = Math.round((supplyBoost(cd) + buzzBoost(nb ? instagramFor(nb.name)?.postsCount : null)) * 10) / 10;
    } else if (layer === "authgap") {
      // 진정성 갭(발산) — 검색 수요 vs 등록 공급. 현재 상태 진단이라 기간 불변.
      const nb = narrativeForPlace(cd);
      const g = authenticityGap(supplyBoost(cd), buzzBoost(nb ? instagramFor(nb.name)?.postsCount : null));
      authG = { gap: g.gap, signal: g.verdict === "none" ? 0 : 1 };
    }
    // 상권 실측(data.go.kr) — 동별 1회 조회, 기간 불변 주입
    const cm = layer === "commerce" ? commerceFor(cd) : null;
    // 빈집 실측(KOSIS, 시군구) — 기간 불변 주입
    const vac = layer === "vacant" ? vacantFor(cd) : null;
    const N = periods.length;
    for (let t = 0; t < periods.length; t++) {
      const s0 = series[t] ?? series[series.length - 1];
      let s = s0;
      if (boost) {
        // 네트워크 효과는 시간에 따라 누적 → 과거일수록 약하게(완만한 가속 램프). 최신=full.
        const pb = N > 1 ? Math.round(boost * (0.1 + 0.9 * Math.pow(t / (N - 1), 1.4)) * 10) / 10 : boost;
        if (layer === "klai") s = { ...s0, klai: Math.min(100, Math.round((s0.klai + pb) * 10) / 10), grade: gradeOf(s0.klai + pb) };
        else if (layer === "vitality") s = { ...s0, vitalityBoost: pb } as typeof s0;
      } else if (layer === "vitality") {
        s = { ...s0, vitalityBoost: 0 } as typeof s0;
      } else if (layer === "authgap") {
        s = { ...s0, authGap: authG!.gap, authSignal: authG!.signal } as typeof s0;
      } else if (layer === "commerce") {
        s = { ...s0, commerceStores: cm?.stores ?? 0, commerceDiv: cm?.diversity ?? 0 } as typeof s0;
      } else if (layer === "vacant") {
        s = { ...s0, vacantRatio: vac?.ratio ?? -1, vacantCount: vac?.count ?? 0 } as typeof s0;
      }
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
