// 현장 리포트 (Human Sensor Network) — 모듈 E. belocal 크리에이터·상인의 현장 관측.
// 데이터로 못 잡는 것(객층·회전율·분위기·뜨는 가게)을 사람이 보강 → D4·내러티브 ground-truth.
// Supabase `field_reports` 테이블에 저장(키 있을 때). 없으면 데모 접수(비영속).

export interface FieldReport {
  id?: string;
  admCd2: string;
  placeName: string;
  // 체크리스트 (외부 문서: 객층·회전율·신규·폐업·분위기·뜨는 가게)
  crowd: "young" | "family" | "tourist" | "mixed" | "office"; // 객층
  turnover: "high" | "mid" | "low"; // 회전율
  vibe: "hot" | "rising" | "calm" | "declining"; // 분위기
  newShops: number; // 최근 신규 개업 체감(0~)
  closedShops: number; // 최근 폐업 체감(0~)
  hotShop?: string; // 요즘 뜨는 가게 한 줄
  note?: string; // 자유 메모
  contributor?: string; // 기여자(이메일/닉)
  createdAt?: string;
}

export const CROWD_OPTS = [
  { v: "young", label: "청년·20-30대" },
  { v: "family", label: "가족·주민" },
  { v: "tourist", label: "관광·외부" },
  { v: "office", label: "직장인" },
  { v: "mixed", label: "혼합" },
] as const;
export const TURNOVER_OPTS = [
  { v: "high", label: "높음(붐빔)" },
  { v: "mid", label: "보통" },
  { v: "low", label: "낮음(한산)" },
] as const;
export const VIBE_OPTS = [
  { v: "hot", label: "🔥 핫함", color: "var(--warn)" },
  { v: "rising", label: "📈 뜨는 중", color: "var(--green)" },
  { v: "calm", label: "● 평온", color: "var(--muted2)" },
  { v: "declining", label: "📉 식는 중", color: "var(--amber)" },
] as const;

// 데모 표본 — Supabase 미연동 시 UI 예시(개념). 실제 기여 시 이 자리에 실데이터.
export const DEMO_REPORTS: FieldReport[] = [
  { admCd2: "1120067000", placeName: "성수동", crowd: "young", turnover: "high", vibe: "hot", newShops: 4, closedShops: 1, hotShop: "대림창고 옆 신규 베이커리", contributor: "belocal_크리에이터", createdAt: "2026-06-19" },
  { admCd2: "1156055000", placeName: "당산1동", crowd: "office", turnover: "mid", vibe: "rising", newShops: 2, closedShops: 1, hotShop: "영등포 생각공장 카페거리", contributor: "로컬상인", createdAt: "2026-06-18" },
  { admCd2: "1144066000", placeName: "서교동", crowd: "young", turnover: "high", vibe: "rising", newShops: 3, closedShops: 2, hotShop: "연남 경계 와인바", contributor: "belocal_크리에이터", createdAt: "2026-06-17" },
];

// 현장 점수 — 분위기/회전율로 '체감 활력' 0~100 (D4·내러티브 보정용)
export function fieldVitality(r: Pick<FieldReport, "vibe" | "turnover" | "newShops" | "closedShops">): number {
  const vibe = r.vibe === "hot" ? 90 : r.vibe === "rising" ? 72 : r.vibe === "calm" ? 50 : 28;
  const turn = r.turnover === "high" ? 85 : r.turnover === "mid" ? 55 : 30;
  const churn = Math.max(0, Math.min(20, (r.newShops - r.closedShops) * 5));
  return Math.round(Math.max(0, Math.min(100, vibe * 0.5 + turn * 0.4 + churn)));
}
