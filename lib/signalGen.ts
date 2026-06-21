// 신호 시계열(검색·기사·인구·매물·임대료)을 동네 점수에서 결정론적으로 생성.
// 동마다 '유형(아키타입)'과 '점화 시점'이 달라 선행→후행 순서·연도·패턴이 지역별로 다르게 나온다.
// (기존 signals.json은 상승 동을 모두 '서사 선행 2020' 한 모양으로 찍어 모든 지역이 똑같아 보였음)
import type { PlaceScore, SignalKey, SignalSeries } from "./types";
import { SIGNAL_META } from "./signals";

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
// 결정론적 의사난수(빌드 일관성 — Math.random 미사용)
const rng = (seed: number) => {
  const x = Math.sin(seed) * 43758.5453;
  return x - Math.floor(x);
};
const clamp = (v: number, a = 0, b = 100) => Math.max(a, Math.min(b, v));

type Arche = "narrative" | "capital" | "broad" | "decline" | "flat";

// 신호별 점화 위상(onset 대비 +지연). 누가 먼저 움직이는지를 결정.
const PHASE: Record<"narrative" | "capital" | "broad", Record<SignalKey, number>> = {
  narrative: { search: 0, news: 0.5, population: 2, listings: 2.3, rent: 3.2 }, // 서사(검색·기사) 선행 → 임대료 후행
  capital: { search: 2.4, news: 2.8, population: 1.2, listings: 0.4, rent: 0 }, // 자본(임대료·매물) 선행 → 서사 후행
  broad: { population: 0, search: 0.4, news: 0.6, listings: 0.9, rent: 1.2 }, // 수요(인구) 선행 동반상승
};

export function archetypeOf(s: PlaceScore): Arche {
  if (s.momentum <= -3 || s.marketVitality === "shrinking") return "decline";
  if (s.momentum >= 3 && s.d3 >= s.d4 + 6) return "capital"; // 공간·부동산 축이 서사 축보다 앞서며 상승 = 자본 선행(거품 위험)
  if (s.momentum >= 4 && s.d4 >= s.d2) return "narrative";
  if (s.momentum >= 4) return "broad";
  return "flat";
}

export function buildSignalSeries(s: PlaceScore, cd: string): SignalSeries {
  const N = 11; // 2016~2026
  const h = hash(cd);
  const arche = archetypeOf(s);
  // 점화 중심 — 동마다 + 성숙도(젠트리·모멘텀)로 달라짐 → 연도 분산
  const onset = clamp(3 + (h % 4) - Math.floor(s.gentriStage / 2) - (s.momentum > 7 ? 1 : 0), 1.5, 6.5);
  const peak = clamp(s.klai + (h % 12) - 6, 48, 96);
  const logistic = (t: number, c: number, base: number, top: number, k = 0.95) => base + (top - base) / (1 + Math.exp(-k * (t - c)));

  const out = {} as SignalSeries;
  for (const m of SIGNAL_META) {
    const arr: number[] = [];
    for (let t = 0; t < N; t++) {
      const noise = rng(h + t * 13 + m.key.length * 101) * 6 - 3;
      let v: number;
      if (arche === "flat") {
        v = 47 + (rng(h + t * 7) * 12 - 6);
      } else if (arche === "decline") {
        if (m.role === "narrative") {
          v = logistic(t, onset + 4.5, 40, 58, 1.0); // 늦게 오는 부정 버즈(작게)
        } else {
          v = peak - logistic(t, onset + 1.5, 0, peak - 26, 0.95); // 정점 후 가파른 하락
        }
      } else {
        const ph = PHASE[arche][m.key];
        v = logistic(t, onset + ph, 30, peak, 0.95);
      }
      arr.push(clamp(Math.round(v + noise)));
    }
    out[m.key] = arr;
  }
  return out;
}
