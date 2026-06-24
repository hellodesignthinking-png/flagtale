// 사용자 등급(티어) 모델 — Free(지도·요약) / Pro(시그널·전략·choropleth) / 기관(대시보드·API).
// 저장값은 user_metadata.ft_plan. 다양한 표기를 normalizePlan으로 정규화.
export type Plan = "free" | "pro" | "org";

export const PLAN_RANK: Record<Plan, number> = { free: 0, pro: 1, org: 2 };
export const PLAN_LABEL: Record<Plan, string> = { free: "Free", pro: "Pro", org: "기관" };
export const PLAN_EMOJI: Record<Plan, string> = { free: "🆓", pro: "⭐", org: "🏛️" };

// 기능 → 최소 요구 등급
export type Feature = "map" | "summary" | "signals" | "strategy" | "choropleth" | "dashboard" | "api";
export const FEATURE_MIN: Record<Feature, Plan> = {
  map: "free",
  summary: "free",
  signals: "pro",
  strategy: "pro",
  choropleth: "pro",
  dashboard: "org",
  api: "org",
};

export function normalizePlan(raw?: string | null): Plan {
  const v = (raw ?? "").toString().trim().toLowerCase();
  if (["pro", "개인", "소상공인", "personal"].includes(v)) return "pro";
  if (["org", "기관", "institution", "enterprise", "b2b", "b2g", "agency"].includes(v)) return "org";
  return "free";
}

// 무료 공개 모드 — true면 전 기능 개방(등급 게이팅 무시). 추후 유료 전환 시 false로.
export const FREE_MODE = true;

export function canUse(plan: Plan, f: Feature): boolean {
  if (FREE_MODE) return true;
  return PLAN_RANK[plan] >= PLAN_RANK[FEATURE_MIN[f]];
}
export function minPlanFor(f: Feature): Plan {
  return FEATURE_MIN[f];
}
