import {
  AXIS_LABEL,
  AXIS_RGB,
  BUDGET_MAX,
  GRADE_RGB,
  MARKET_RGB,
  MARKET_LABEL,
  MOMENTUM_DOWN_RGB,
  MOMENTUM_UP_RGB,
  NARRATIVE_RGB,
  NARRATIVE_LABEL,
} from "./constants";
import type { Grade, LayerId, PlaceScore } from "./types";

// 우세 매력축 — d1~d4 중 최고 점수 축
export function dominantAxis(s: PlaceScore): "d1" | "d2" | "d3" | "d4" {
  const ax: ("d1" | "d2" | "d3" | "d4")[] = ["d1", "d2", "d3", "d4"];
  return ax.reduce((best, k) => (s[k] > s[best] ? k : best), "d1");
}

export function gradeOf(k: number): Grade {
  if (k >= 85) return "S";
  if (k >= 70) return "A";
  if (k >= 55) return "B";
  if (k >= 40) return "C";
  if (k >= 25) return "D";
  return "E";
}

const SLATE: [number, number, number] = [91, 117, 150];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function mix(
  c1: [number, number, number],
  c2: [number, number, number],
  t: number
): [number, number, number] {
  return [
    Math.round(lerp(c1[0], c2[0], t)),
    Math.round(lerp(c1[1], c2[1], t)),
    Math.round(lerp(c1[2], c2[2], t)),
  ];
}

/** 레이어+점수 → deck.gl fill 색 [r,g,b,a] (a 0–255) */
export function colorForLayer(
  layer: LayerId,
  s: PlaceScore,
  opts: { selected?: boolean; dimmed?: boolean } = {}
): [number, number, number, number] {
  let rgb: [number, number, number];
  let alpha = 205;

  switch (layer) {
    case "klai":
    case "d1":
    case "d2":
    case "d3":
    case "d4": {
      const v = (s as unknown as Record<string, number>)[layer];
      rgb = GRADE_RGB[gradeOf(v)];
      break;
    }
    case "axis4": {
      // 우세 축 색 — 종합이 낮으면 채도↓(슬레이트 혼합)
      const ax = dominantAxis(s);
      rgb = mix(SLATE, AXIS_RGB[ax], 0.35 + Math.min(s.klai / 100, 1) * 0.65);
      break;
    }
    case "momentum": {
      const t = Math.min(Math.abs(s.momentum) / 8, 1);
      const base = s.momentum >= 0 ? MOMENTUM_UP_RGB : MOMENTUM_DOWN_RGB;
      rgb = mix(SLATE, base, 0.25 + t * 0.75);
      break;
    }
    case "gentri": {
      // 회색 베이스 — 경보는 외곽 펄스로 별도 표시
      const t = Math.min(s.gentriG / 3, 1);
      rgb = mix([46, 69, 107], [120, 90, 70], t * 0.6);
      alpha = s.gentriFlag ? 220 : 150;
      break;
    }
    case "market": {
      rgb = MARKET_RGB[s.marketVitality];
      break;
    }
    case "narrative": {
      rgb = s.negativeNarrative ? [196, 64, 48] : NARRATIVE_RGB[s.narrativeStage];
      break;
    }
    case "popchange": {
      const t = Math.min(Math.abs(s.popChangeRate) / 3, 1);
      const base = s.popChangeRate >= 0 ? MOMENTUM_UP_RGB : MOMENTUM_DOWN_RGB;
      rgb = mix(SLATE, base, 0.2 + t * 0.8);
      break;
    }
    case "budget": {
      const t = Math.min(s.budgetInflow / BUDGET_MAX, 1);
      // 낮음=네이비 슬레이트 → 높음=골드
      rgb = mix([40, 60, 95], [232, 168, 58], Math.pow(t, 0.75));
      alpha = 150 + Math.round(t * 90);
      break;
    }
    case "vitality": {
      // 플래그테일 등록 공급 + 검색 수요 밀도(0~16) → 네이비 → 앰버. 등록 없으면 베이스.
      const v = (s as unknown as Record<string, number>).vitalityBoost ?? 0;
      const t = Math.min(v / 12, 1);
      rgb = mix([40, 60, 95], [240, 150, 40], Math.pow(t, 0.7));
      alpha = v > 0 ? 150 + Math.round(t * 95) : 110;
      break;
    }
    case "authgap": {
      // 진정성 갭(발산) — 과열(검색≫등록, gap>0)=빨강 · 미발견(등록≫검색, gap<0)=초록. 신호 없으면 베이스.
      const r = s as unknown as Record<string, number>;
      if (!r.authSignal) { rgb = [44, 58, 86]; alpha = 90; break; }
      const g = r.authGap;
      if (g >= 0) { const t = Math.min(g / 0.8, 1); rgb = mix([88, 98, 112], [214, 68, 52], 0.25 + t * 0.75); }
      else { const t = Math.min(-g / 0.8, 1); rgb = mix([88, 98, 112], [36, 168, 108], 0.25 + t * 0.75); }
      alpha = 215;
      break;
    }
    case "commerce": {
      // 상권 실측 — 동별 등록 상가수(밀도) → 네이비 → 그린(D2). 데이터 없으면 베이스.
      const n = (s as unknown as Record<string, number>).commerceStores ?? 0;
      if (n <= 0) { rgb = [44, 58, 86]; alpha = 90; break; }
      const t = Math.min(Math.log(n + 1) / Math.log(3000), 1);
      rgb = mix([40, 60, 95], [24, 180, 96], Math.pow(t, 0.7));
      alpha = 150 + Math.round(t * 95);
      break;
    }
    case "vacant": {
      // 빈집비율 실측 — 높을수록 위기(청록 → 빨강). 데이터 없으면(-1) 베이스.
      const r = (s as unknown as Record<string, number>).vacantRatio ?? -1;
      if (r < 0) { rgb = [44, 58, 86]; alpha = 90; break; }
      const t = Math.min(r / 15, 1); // 전국 ~8%
      rgb = mix([46, 78, 96], [200, 64, 48], Math.pow(t, 0.8));
      alpha = 150 + Math.round(t * 95);
      break;
    }
    default:
      rgb = SLATE;
  }

  if (opts.dimmed) alpha = Math.round(alpha * 0.35);
  if (opts.selected) alpha = 255;
  return [rgb[0], rgb[1], rgb[2], alpha];
}

/** 3D 익스트루전 높이값 (0~100) — 데이터가 지도에서 솟아오르는 크기 */
export function elevationForLayer(layer: LayerId, s: PlaceScore): number {
  const clamp01 = (v: number) => Math.max(0, Math.min(100, v));
  switch (layer) {
    case "klai":
    case "d1":
    case "d2":
    case "d3":
    case "d4":
      return clamp01((s as unknown as Record<string, number>)[layer]);
    case "axis4":
      return clamp01(s.klai); // 높이=종합, 색=우세축
    case "momentum":
      return clamp01(((s.momentum + 10) / 20) * 100);
    case "gentri":
      return clamp01((s.gentriG / 3.2) * 100);
    case "market":
      return s.marketVitality === "active" ? 85 : s.marketVitality === "stable" ? 50 : 25;
    case "narrative":
      return s.negativeNarrative
        ? 92
        : s.narrativeStage === "peak"
        ? 88
        : s.narrativeStage === "spread"
        ? 68
        : s.narrativeStage === "formation"
        ? 48
        : 30;
    case "popchange":
      return clamp01(((s.popChangeRate + 3) / 6) * 100);
    case "budget":
      return clamp01((s.budgetInflow / 110) * 100);
    case "vitality":
      return clamp01((((s as unknown as Record<string, number>).vitalityBoost ?? 0) / 12) * 100);
    case "authgap":
      return clamp01((Math.abs((s as unknown as Record<string, number>).authGap ?? 0) / 0.8) * 100);
    case "commerce": {
      const n = (s as unknown as Record<string, number>).commerceStores ?? 0;
      return n > 0 ? clamp01((Math.log(n + 1) / Math.log(3000)) * 100) : 0;
    }
    case "vacant": {
      const r = (s as unknown as Record<string, number>).vacantRatio ?? -1;
      return r < 0 ? 0 : clamp01((r / 20) * 100);
    }
    default:
      return clamp01(s.klai);
  }
}

/** 레이어별 외곽 펄스 경보 여부 (젠트리 경보 동) */
export function isPulseAlert(layer: LayerId, s: PlaceScore): boolean {
  if (layer === "gentri") return s.gentriFlag;
  if (layer === "narrative") return s.negativeNarrative;
  return false;
}

/** 호버 툴팁/범례용 표시 문자열 */
export function displayForLayer(layer: LayerId, s: PlaceScore): string {
  switch (layer) {
    case "klai":
      return `${s.klai} · ${s.grade}등급`;
    case "axis4": {
      const ax = dominantAxis(s);
      return `강점: ${AXIS_LABEL[ax]} (${s[ax]}) · 종합 ${s.klai}`;
    }
    case "d1":
      return `${s.d1}`;
    case "d2":
      return `${s.d2}`;
    case "d3":
      return `${s.d3}`;
    case "d4":
      return `${s.d4}`;
    case "momentum":
      return `${s.momentum > 0 ? "+" : ""}${s.momentum}`;
    case "gentri":
      return s.gentriFlag
        ? `⚠ ${s.gentriStage}단계 (G ${s.gentriG})`
        : `정상 (G ${s.gentriG})`;
    case "market":
      return MARKET_LABEL[s.marketVitality];
    case "narrative":
      return s.negativeNarrative
        ? `부정서사 · ${NARRATIVE_LABEL[s.narrativeStage]}`
        : NARRATIVE_LABEL[s.narrativeStage];
    case "popchange":
      return `${s.popChangeRate > 0 ? "+" : ""}${s.popChangeRate}%/년 · 인구 ${s.population.toLocaleString()}`;
    case "budget":
      return `${s.budgetInflow}억/년 유입`;
    case "vitality": {
      const v = (s as unknown as Record<string, number>).vitalityBoost ?? 0;
      return v > 0 ? `활력 +${v} · 등록·검색 밀도` : "플래그테일 등록 없음";
    }
    case "authgap": {
      const r = s as unknown as Record<string, number>;
      if (!r.authSignal) return "신호 없음";
      if (r.authGap >= 0.3) return `과열·거품 +${r.authGap}`;
      if (r.authGap <= -0.3) return `미발견 강세 ${r.authGap}`;
      return `균형 (갭 ${r.authGap > 0 ? "+" : ""}${r.authGap})`;
    }
    case "commerce": {
      const r = s as unknown as Record<string, number>;
      const n = r.commerceStores ?? 0;
      return n > 0 ? `${n.toLocaleString()} 상가 · 다양성 ${Math.round((r.commerceDiv ?? 0) * 100)}` : "상권 데이터 없음";
    }
    case "vacant": {
      const r = s as unknown as Record<string, number>;
      const v = r.vacantRatio ?? -1;
      return v < 0 ? "빈집 데이터 없음" : `빈집 ${v}%${r.vacantCount ? ` · ${r.vacantCount.toLocaleString()}호` : ""}`;
    }
    default:
      return `${s.klai}`;
  }
}

export function pickScore(series: PlaceScore[], period: string): PlaceScore {
  return series.find((s) => s.period === period) ?? series[series.length - 1];
}

// 12 Sub-Dimension 라벨 (기획서 §3.2)
export const SUB_DIMS: { axis: "d1" | "d2" | "d3" | "d4"; label: string }[] = [
  { axis: "d1", label: "인구 재생산력" },
  { axis: "d1", label: "순유입" },
  { axis: "d1", label: "연령 균형" },
  { axis: "d2", label: "창업·생존" },
  { axis: "d2", label: "업종 다양성" },
  { axis: "d2", label: "매출 성장" },
  { axis: "d2", label: "점포밀도·공실" },
  { axis: "d2", label: "임대 경제성" },
  { axis: "d2", label: "시장 활성도" },
  { axis: "d3", label: "용도 혼합" },
  { axis: "d3", label: "보행·접촉" },
  { axis: "d3", label: "건물 노후·다양성" },
  { axis: "d3", label: "접근성" },
  { axis: "d3", label: "자산가치" },
  { axis: "d4", label: "감성(매력)" },
  { axis: "d4", label: "언급량·인기" },
  { axis: "d4", label: "미디어·확산" },
];

// 축 점수 + 결정론적 지터로 12(+) Sub 값을 파생 (시드에 Sub 미저장 → 표현용 근사)
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

export function deriveSubs(admCd2: string, s: PlaceScore) {
  return SUB_DIMS.map((d, i) => {
    const base = (s as unknown as Record<string, number>)[d.axis];
    const jitter = (hash(admCd2 + ":" + i) - 0.5) * 24;
    return { ...d, value: Math.max(2, Math.min(99, Math.round(base + jitter))) };
  });
}
