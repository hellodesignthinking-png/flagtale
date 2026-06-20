// 매력 × 지속가능성 2축 — 상생지수(Sustainability) + 4분면 + 대형화·수익성 가위 경보.
// "지금 매력적인 것"과 "그 매력이 오래갈 것"은 다른 축. 가로수길은 매력 高·지속 低로 무너졌다.
// 기존 실측 데이터(sangga·reb·latest·corrected·social)로 합성. 결정론 근사(Phase 1~4).
import type { PlaceScore } from "@/lib/types";
import type { SanggaStats } from "@/lib/connectors/sangga";
import type { RebForPlace } from "@/lib/connectors/reb";
import type { Corrected } from "@/lib/corrected";
import type { SocialBuzz } from "@/lib/connectors/social";

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

export type QuadrantKey = "grow" | "overheat" | "potential" | "decline";

export interface Sustainability {
  score: number; // 상생지수 0~100 (높을수록 매력이 오래 간다)
  attractiveness: number; // 매력 KLAI (보정 우선)
  factors: { label: string; value: number; available: boolean }[];
  franchise: { ratio: number; alert: boolean } | null; // 대형화 지수
  scissors: { rentChg: number; demandMom: number; diverging: boolean; note: string } | null; // 수익성 가위
  quadrant: { key: QuadrantKey; label: string; icon: string; advice: string };
  coverage: "측정" | "부분" | "추정"; // 실측 커버리지
}

function quadrant(x: number, y: number): Sustainability["quadrant"] {
  const hiX = x >= 55; // 매력(B등급 이상)
  const hiY = y >= 50; // 지속가능
  if (hiX && hiY) return { key: "grow", label: "지속 성장", icon: "⭐", advice: "고유 콘텐츠·임대 안정 유지 + 인접 확산 지원." };
  if (hiX && !hiY) return { key: "overheat", label: "과열·위태", icon: "⚠", advice: "겉은 매력적이나 지속성 취약(가로수길化 위험) — 상생협약·임대상한·다양성 보전 시급." };
  if (!hiX && hiY) return { key: "potential", label: "잠재·안정", icon: "🌱", advice: "저평가·안정 기반 — 앵커·콘텐츠 점화 투자 적기(문래 초기형)." };
  return { key: "decline", label: "쇠퇴·소멸", icon: "🔻", advice: "구조 개입 필요 — 정주여건·일자리·공공앵커로 바닥 다지기." };
}

export function computeSustainability(args: {
  latest: PlaceScore;
  corrected: Corrected | null;
  sangga: SanggaStats | null;
  reb: RebForPlace | null;
  social: SocialBuzz | null;
}): Sustainability {
  const { latest, corrected, sangga, reb, social } = args;

  const factors: Sustainability["factors"] = [];
  // 1) 독립성(역프랜차이즈) — 프랜차이즈 비중 높을수록 고유색 희석
  if (sangga) factors.push({ label: "독립성(역프랜차이즈)", value: clamp(100 - sangga.chainRatio * 1.6), available: true });
  // 2) 업종 다양성
  if (sangga) factors.push({ label: "업종 다양성", value: clamp(sangga.diversity), available: true });
  // 3) 공실 안정(역공실)
  if (reb?.vacancy) factors.push({ label: "공실 안정(역공실)", value: clamp(100 - reb.vacancy.latest * 6), available: true });
  // 4) 진정성(역서사괴리)
  factors.push({ label: "진정성(역괴리)", value: clamp(100 - latest.authenticityGap * 100), available: true });
  // 5) 시장 안정성 — 정체(stable)가 가장 지속적, 위축은 위험, 활발은 과열 소지
  const mv = latest.marketVitality === "stable" ? 82 : latest.marketVitality === "active" ? 60 : 22;
  factors.push({ label: "시장 안정성", value: mv, available: true });
  // 6) 소셜 긍정 지속 — 부정 서사 비중↓
  if (social) factors.push({ label: "소셜 긍정성", value: clamp(50 + social.combined.sentiment / 2), available: true });

  const score = Math.round(factors.reduce((s, f) => s + f.value, 0) / (factors.length || 1));
  const attractiveness = corrected?.klai ?? latest.klai;

  // 대형화 지수 — 프랜차이즈 비중 35% 초과 시 경보
  const franchise = sangga ? { ratio: Math.round(sangga.chainRatio * 10) / 10, alert: sangga.chainRatio > 35 } : null;

  // 수익성 가위 — 임대료 상승률 vs 수요 모멘텀(검색·버즈). 임대료↑ + 수요 정체/하락 → 발산(위험).
  let scissors: Sustainability["scissors"] = null;
  if (reb?.rent) {
    const rentChg = reb.rent.chgFrom2016; // % (2016 대비)
    const demandMom = corrected?.searchMomentum ?? latest.momentum * 8; // 수요 모멘텀 %
    const diverging = rentChg > 8 && demandMom < rentChg - 12; // 임대료가 수요를 크게 앞지름
    scissors = {
      rentChg: Math.round(rentChg * 10) / 10,
      demandMom: Math.round(demandMom * 10) / 10,
      diverging,
      note: diverging
        ? "임대료가 수요(검색·버즈)를 앞질러 발산 — 수익성 악화·공실 전조."
        : "임대료와 수요가 비교적 동행 — 발산 신호 없음.",
    };
  }

  const coverage = sangga && reb ? "측정" : sangga || reb ? "부분" : "추정";
  return { score, attractiveness, factors, franchise, scissors, quadrant: quadrant(attractiveness, score), coverage };
}
