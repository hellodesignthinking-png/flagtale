import type { Grade, LayerId, MarketVitality, NarrativeStage } from "./types";

// ── 등급 색 (ZeroSite 발산 스케일, 빌드 스펙 §6.2) ───────────
export const GRADE_HEX: Record<Grade, string> = {
  S: "#0F6E5C",
  A: "#1E7A8C",
  B: "#3E9AA8",
  C: "#E2A33A",
  D: "#D2691E",
  E: "#A23A2A",
};
export const GRADE_RGB: Record<Grade, [number, number, number]> = {
  S: [15, 110, 92],
  A: [30, 122, 140],
  B: [62, 154, 168],
  C: [226, 163, 58],
  D: [210, 105, 30],
  E: [162, 58, 42],
};
export const GRADE_RANGE: Record<Grade, string> = {
  S: "85–100",
  A: "70–84",
  B: "55–69",
  C: "40–54",
  D: "25–39",
  E: "0–24",
};
export const GRADE_LABEL: Record<Grade, string> = {
  S: "전국 최상위 매력",
  A: "강한 매력 · 안정",
  B: "양호 · 부분 보완",
  C: "주의 · 활성화 권장",
  D: "위험 · 쇠퇴 진행",
  E: "고위험 · 소멸 단계",
};

// ── 시장 활성도 ──────────────────────────────────────────────
export const MARKET_HEX: Record<MarketVitality, string> = {
  active: "#3E9AA8",
  stable: "#5b7596",
  shrinking: "#FF7A3D",
};
export const MARKET_RGB: Record<MarketVitality, [number, number, number]> = {
  active: [62, 154, 168],
  stable: [91, 117, 150],
  shrinking: [255, 122, 61],
};
export const MARKET_LABEL: Record<MarketVitality, string> = {
  active: "활발",
  stable: "정체",
  shrinking: "위축(거래절벽)",
};

// ── 내러티브 단계 ────────────────────────────────────────────
export const NARRATIVE_HEX: Record<NarrativeStage, string> = {
  formation: "#1E7A8C",
  spread: "#3E9AA8",
  peak: "#E2A33A",
  decline: "#A23A2A",
};
export const NARRATIVE_RGB: Record<NarrativeStage, [number, number, number]> = {
  formation: [30, 122, 140],
  spread: [62, 154, 168],
  peak: [226, 163, 58],
  decline: [162, 58, 42],
};
export const NARRATIVE_LABEL: Record<NarrativeStage, string> = {
  formation: "형성",
  spread: "확산",
  peak: "절정",
  decline: "쇠퇴",
};

// 모멘텀 발산 (상승 청록 / 하락 주황)
export const MOMENTUM_UP_RGB: [number, number, number] = [47, 180, 160];
export const MOMENTUM_DOWN_RGB: [number, number, number] = [255, 122, 61];

export const WARN_HEX = "#FF7A3D";

// ── 레이어 정의 (빌드 스펙 §6.2 — 단일 선택) ─────────────────
export interface LayerDef {
  id: LayerId;
  label: string;
  desc: string;
  kind: "grade" | "diverging" | "alert" | "categorical-market" | "categorical-narrative" | "categorical-axis" | "sequential";
  group: "종합" | "매력 4축" | "변화·동학" | "위기 신호" | "공공 투입" | "플래그테일";
  real?: boolean; // 실데이터 여부 (지도 레이어 기준)
}

// 4축 강점 색 — 우세 매력축 식별용 (D1 인구·D2 경제·D3 공간·D4 인식)
export const AXIS_RGB: Record<"d1" | "d2" | "d3" | "d4", [number, number, number]> = {
  d1: [75, 156, 211], // 인구·지속성 — 블루
  d2: [24, 226, 74], // 경제·상권 — 그린
  d3: [139, 110, 246], // 공간·물리 — 바이올렛
  d4: [226, 138, 58], // 인식·감성 — 앰버
};
export const AXIS_LABEL: Record<"d1" | "d2" | "d3" | "d4", string> = {
  d1: "인구·지속성",
  d2: "경제·상권",
  d3: "공간·물리",
  d4: "인식·감성",
};

export const LAYERS: LayerDef[] = [
  { id: "klai", label: "종합 KLAI", desc: "4축 합성 매력도 · 등급 발산", kind: "grade", group: "종합" },
  { id: "axis4", label: "4축 강점", desc: "우세 매력축 — 높이=종합, 색=1위 축", kind: "categorical-axis", group: "종합" },
  { id: "d1", label: "D1 인구·지속성", desc: "재생산력·유입·연령균형 (20%)", kind: "grade", group: "매력 4축" },
  { id: "d2", label: "D2 경제·상권", desc: "창업·다양성·매출·공실 (30%)", kind: "grade", group: "매력 4축" },
  { id: "d3", label: "D3 공간·물리", desc: "용도혼합·보행·노후·자산 (20%)", kind: "grade", group: "매력 4축" },
  { id: "d4", label: "D4 인식·감성", desc: "감성×인기×확산 (30%)", kind: "grade", group: "매력 4축" },
  { id: "building", label: "🏘 용도혼합(실측)", desc: "주택종류 다양성(단독·아파트·연립·다세대) · 통계청 인구주택총조사 실데이터(동)", kind: "sequential", group: "매력 4축", real: true },
  { id: "popchange", label: "인구 변화", desc: "증가=청록 · 감소=주황 · 시군구 단위 KOSIS 실데이터", kind: "diverging", group: "변화·동학", real: true },
  { id: "momentum", label: "모멘텀", desc: "상승=청록 · 하락=주황 (분기 변화율)", kind: "diverging", group: "변화·동학" },
  { id: "gentri", label: "젠트리 경보", desc: "경보 동에 주황 펄스 외곽선", kind: "alert", group: "위기 신호" },
  { id: "market", label: "시장 활성도", desc: "활발 / 정체 / 위축(거래절벽)", kind: "categorical-market", group: "위기 신호" },
  { id: "narrative", label: "내러티브", desc: "형성·확산·절정·쇠퇴 + 부정서사", kind: "categorical-narrative", group: "위기 신호" },
  { id: "vacant", label: "🏚 빈집 비율", desc: "미거주 주택(빈집) 비율 · 통계청 인구주택총조사 실데이터(시군구)", kind: "sequential", group: "위기 신호", real: true },
  { id: "budget", label: "공공예산 유입", desc: "나라장터 공고예산 유입 강도 (억/년)", kind: "sequential", group: "공공 투입" },
  { id: "vitality", label: "플래그테일 활력", desc: "등록 공급 + 검색 수요(인스타) 밀도 · 네트워크 효과", kind: "sequential", group: "플래그테일", real: true },
  { id: "authgap", label: "진정성 갭", desc: "과열(검색≫등록)=빨강 · 미발견(등록≫검색)=초록", kind: "diverging", group: "플래그테일", real: true },
  { id: "commerce", label: "🏪 상권 실측", desc: "동별 등록 상가 밀도 · 소상공인 상가정보(data.go.kr) 실데이터", kind: "sequential", group: "플래그테일", real: true },
];

// 공공예산 유입 색 스케일 상한 (억/년) — 정규화 기준
export const BUDGET_MAX = 110;

export const LAYER_BY_ID: Record<LayerId, LayerDef> = Object.fromEntries(
  LAYERS.map((l) => [l.id, l])
) as Record<LayerId, LayerDef>;

// ── 권역 줌 프리셋 (전국) ────────────────────────────────────
export const REGION_PRESETS: { id: string; label: string; bounds: [number, number, number, number] }[] = [
  { id: "all", label: "전국", bounds: [125.0, 33.0, 131.0, 38.7] },
  { id: "capital", label: "수도권", bounds: [126.4, 36.8, 127.6, 38.3] },
  { id: "chungcheong", label: "충청", bounds: [126.0, 36.0, 128.1, 37.2] },
  { id: "yeongnam", label: "영남", bounds: [127.5, 34.5, 129.6, 37.0] },
  { id: "honam", label: "호남", bounds: [125.8, 34.2, 127.6, 36.2] },
  { id: "gangwon", label: "강원", bounds: [127.4, 37.0, 129.4, 38.6] },
  { id: "jeju", label: "제주", bounds: [126.1, 33.1, 127.0, 33.6] },
];

export const DEFAULT_MAP_STYLE =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL ||
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

// 네트워크 없이도 항상 렌더되는 오프라인 폴백 스타일 (외부 베이스맵 로드 실패 시)
export const FALLBACK_MAP_STYLE = {
  version: 8 as const,
  sources: {},
  layers: [
    {
      id: "bg",
      type: "background" as const,
      paint: { "background-color": "#0b1b30" },
    },
  ],
  glyphs: undefined,
};

// 전국 초기 뷰 (대한민국 전체)
export const INITIAL_VIEW = {
  longitude: 127.8,
  latitude: 36.3,
  zoom: 6.4,
  pitch: 0,
  bearing: 0,
};

// 시네마틱 카메라 투어 경유지 (전국 → 권역 → 전국)
export const TOUR_STOPS: {
  label: string;
  lng: number;
  lat: number;
  zoom: number;
  pitch: number;
  bearing: number;
}[] = [
  { label: "대한민국 전국", lng: 127.8, lat: 36.3, zoom: 6.3, pitch: 50, bearing: 0 },
  { label: "수도권 · 서울", lng: 126.99, lat: 37.53, zoom: 9.4, pitch: 58, bearing: -22 },
  { label: "영남 · 부산", lng: 129.04, lat: 35.16, zoom: 9.4, pitch: 58, bearing: 28 },
  { label: "호남 · 광주", lng: 126.86, lat: 35.17, zoom: 9.3, pitch: 56, bearing: -16 },
  { label: "강원 · 춘천", lng: 127.73, lat: 37.86, zoom: 8.9, pitch: 56, bearing: 18 },
  { label: "제주", lng: 126.55, lat: 33.4, zoom: 9.5, pitch: 56, bearing: 0 },
  { label: "다시 전국", lng: 127.8, lat: 36.3, zoom: 6.3, pitch: 50, bearing: 0 },
];

// 트래젝토리 라벨
export const TRAJECTORY_LABEL: Record<string, string> = {
  rising: "상승",
  stable: "안정",
  declining: "쇠퇴",
  gentrifying: "젠트리 진행",
};
