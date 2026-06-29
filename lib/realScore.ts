// 실측 매력도 — 샘플 KLAI와 별개로, 수집된 실데이터만으로 계산하는 합성 점수.
//   D2r 상권(소진공: 밀도+업종다양성) · D3r 공간(KOSIS: 주택 용도혼합) · D1r 인구(KOSIS: 변화율)
//   - 빈집비율(KOSIS)로 감점. 실측 축 2개 미만이면 null(합성 보류 → 지도/카드 미표시).
// 아키텍처 step6(축별 실측 합성)의 lite 버전 — 외부 데이터 추가 없이 기존 실데이터 결합.
import "server-only";
import { commerceFor, buildingFor, vacantFor, cultureFor } from "./data";
import { policyBoost } from "./programs";
import type { PlaceScore } from "./types";

export interface RealComposite {
  score: number;        // 실측 매력도 0~100 (정책 가산 포함)
  coverage: number;     // 실측 축 수 (2~4)
  d1r: number | null;   // 인구 지속성(실)
  d2r: number | null;   // 상권(실)
  d3r: number | null;   // 공간 용도혼합(실)
  d4c: number | null;   // 문화 활력(실 — 공연·전시·축제)
  policy: number;       // 정책 사업 지정 가산(청년마을·문화도시 등, 0~8)
  vacantPenalty: number; // 빈집 감점 계수(0~1)
}

export function realComposite(admCd2: string, score: PlaceScore): RealComposite | null {
  const cm = commerceFor(admCd2);
  const bld = buildingFor(admCd2);
  const vac = vacantFor(admCd2);

  // D2r — 상권 밀도(log 정규화) + 업종 다양성(Shannon 0~1)
  let d2r: number | null = null;
  if (cm && cm.stores > 0) {
    const dens = Math.min(Math.log(cm.stores + 1) / Math.log(3000), 1);
    d2r = Math.round(50 * dens + 50 * (cm.diversity ?? 0));
  }
  // D3r — 주택 용도혼합(0~1 → 0~100)
  const d3r = bld && bld.typeMix != null ? Math.round(bld.typeMix * 100) : null;
  // D1r — 인구 변화율(실, KOSIS 시군구) → 보합 50 기준 ±
  const d1r = Number.isFinite(score.popChangeRate)
    ? Math.max(0, Math.min(100, Math.round(50 + score.popChangeRate * 12)))
    : null;
  // D4c — 문화 활력(공연·전시·축제 수, 시군구) → log 정규화 0~100
  const cul = cultureFor(admCd2);
  const d4c = cul && cul.events > 0 ? Math.min(100, Math.round((Math.log(cul.events + 1) / Math.log(400)) * 100)) : null;

  const parts = [d1r, d2r, d3r, d4c].filter((v): v is number => v != null);
  if (parts.length < 2) return null; // 실측 신호 부족 → 합성 보류

  // 빈집 감점 — 빈집비율 높을수록 매력 차감(최대 약 -25%)
  const vacantPenalty = vac && vac.ratio != null ? 1 - Math.min(vac.ratio, 20) / 80 : 1;
  // 정책 사업 지정 가산 — 청년마을·문화도시 등(정부 투자·활력 신호)
  const policy = policyBoost(admCd2);
  const base = parts.reduce((a, b) => a + b, 0) / parts.length;
  return {
    score: Math.max(0, Math.min(100, Math.round(base * vacantPenalty + policy))),
    coverage: parts.length,
    d1r, d2r, d3r, d4c,
    policy,
    vacantPenalty: Math.round(vacantPenalty * 100) / 100,
  };
}
