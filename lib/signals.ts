import type { SignalKey, SignalSeries } from "./types";
import { formatPeriod } from "./utils";

// 신호 메타 — 역할(role)이 "이유"를 가른다: 서사(narrative)가 먼저면 건강, 자본(capital)이 먼저면 거품
export const SIGNAL_META: { key: SignalKey; label: string; color: string; role: "narrative" | "demand" | "market" | "capital" }[] = [
  { key: "search", label: "검색량", color: "#4B9CD3", role: "narrative" },
  { key: "news", label: "기사량", color: "#D4861E", role: "narrative" },
  { key: "population", label: "인구", color: "#0F6E5C", role: "demand" },
  { key: "listings", label: "매물·거래", color: "#3E9AA8", role: "market" },
  { key: "rent", label: "임대료", color: "#A23A2A", role: "capital" },
];
const ROLE = Object.fromEntries(SIGNAL_META.map((m) => [m.key, m.role])) as Record<SignalKey, string>;
const LABEL = Object.fromEntries(SIGNAL_META.map((m) => [m.key, m.label])) as Record<SignalKey, string>;

export type SignalPattern = "narrative_led" | "capital_led" | "broad_rise" | "decline" | "flat";

export interface VerifyItem {
  title: string;
  detail: string;
  status: "good" | "watch" | "bad" | "info";
}

export interface SignalAnalysis {
  comovement: number[];
  peakPeriod: string;
  peakValue: number;
  leadOrder: { key: SignalKey; label: string; at: string }[];
  leader: { key: SignalKey; label: string } | null;
  lagger: { key: SignalKey; label: string } | null;
  pattern: SignalPattern;
  patternLabel: string;
  reason: string;
  direction: string;
  strategy: string[];
  verify: VerifyItem[];
  trends: Record<SignalKey, number>;
}

const avg = (a: number[]) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);

function stat(arr: number[]) {
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  const mid = min + (max - min) * 0.55;
  let crossMid = Infinity;
  for (let t = 0; t < arr.length; t++) {
    if (arr[t] >= mid) {
      crossMid = t;
      break;
    }
  }
  let best = -Infinity;
  let onset = 0;
  for (let t = 1; t < arr.length; t++) {
    const d = arr[t] - arr[t - 1];
    if (d > best) {
      best = d;
      onset = t;
    }
  }
  const trend = avg(arr.slice(-3)) - avg(arr.slice(0, 3));
  return { min, max, crossMid, onset, trend };
}

export function analyzeSignals(
  s: SignalSeries,
  periods: string[],
  authenticityGap = 0.2
): SignalAnalysis {
  const keys = SIGNAL_META.map((m) => m.key);
  const st = Object.fromEntries(keys.map((k) => [k, stat(s[k])])) as Record<SignalKey, ReturnType<typeof stat>>;
  const trends = Object.fromEntries(keys.map((k) => [k, Math.round(st[k].trend)])) as Record<SignalKey, number>;

  // 동조도(co-movement): 각 기간에 '자기 고점대(상위 40%)'에 든 신호 비율
  const n = periods.length;
  const comovement: number[] = [];
  for (let t = 0; t < n; t++) {
    let c = 0;
    for (const k of keys) {
      const thr = st[k].min + (st[k].max - st[k].min) * 0.6;
      if (s[k][t] >= thr) c++;
    }
    comovement.push(Math.round((c / keys.length) * 100));
  }
  let peakIdx = 0;
  comovement.forEach((v, i) => {
    if (v >= comovement[peakIdx]) peakIdx = i;
  });

  // 선행성: 상승 신호만 대상으로 중간선 교차 시점 순 정렬
  const rising = keys.filter((k) => st[k].trend > 5);
  const leadOrder = rising
    .slice()
    .sort((a, b) => (st[a].crossMid - st[b].crossMid) || (st[a].onset - st[b].onset))
    .map((k) => ({ key: k, label: LABEL[k], at: Number.isFinite(st[k].crossMid) ? formatPeriod(periods[st[k].crossMid]) : "—" }));
  const leader = leadOrder[0] ? { key: leadOrder[0].key, label: leadOrder[0].label } : null;
  const lagger = leadOrder.length > 1 ? { key: leadOrder.at(-1)!.key, label: leadOrder.at(-1)!.label } : null;

  const overall = avg(keys.map((k) => st[k].trend));
  const riseCount = rising.length;

  // 패턴 분류
  let pattern: SignalPattern;
  if (overall > 6 && riseCount >= 3 && leader) {
    const lr = ROLE[leader.key];
    pattern = lr === "narrative" ? "narrative_led" : lr === "capital" ? "capital_led" : "broad_rise";
  } else if (overall < -6) {
    pattern = "decline";
  } else {
    pattern = "flat";
  }

  const leadLag =
    leader && lagger
      ? `${leader.label}이(가) 가장 먼저(${leadOrder[0].at}) → ${lagger.label}이(가) 가장 늦게(${leadOrder.at(-1)!.at}) 움직였다.`
      : "뚜렷한 선행 신호가 없다.";

  const PATTERN_LABEL: Record<SignalPattern, string> = {
    narrative_led: "서사 선행 — 건강한 티핑포인트",
    capital_led: "자본 선행 — 추출형 거품 위험",
    broad_rise: "동반 상승 — 선순환",
    decline: "동반 하락 — 역티핑·소멸",
    flat: "정체 — 잠재 단계",
  };

  const reason = ((): string => {
    switch (pattern) {
      case "narrative_led":
        return `${leadLag} 검색·기사(이야기)가 인구·매물·임대료에 **선행**했다 — 장소의 한 줄 정체성(서사)이 특정 부족(창작자→방문객)을 끌어들여 상업이 형성된 **건강한 티핑포인트**(Gladwell 소수의 법칙·고착성·맥락의 힘, 기획서 §5.6). "모든 데이터가 함께 오른" 이유는 **가격이 아니라 이야기**가 먼저였기 때문. 단, 임대료가 서사를 추월(맥락 붕괴)하면 역티핑으로 급랭한다.`;
      case "capital_led":
        return `${leadLag} 임대료·매물(자본)이 검색·기사(서사)보다 **먼저** 움직였다 — 이야기 없이 자본만 베팅한 **추출형 거품** 신호. 함께 오르긴 했으나 가치가 주민·소상공인에게 환류되지 않고(팝업 경제) 단기 임대 사각지대로 빠질 위험.`;
      case "broad_rise":
        return `${leadLag} 수요·공급·인식이 함께 강화되는 **선순환**. 다만 어느 고리가 먼저인지(서사 vs 자본) 선행성으로 건강성을 확정해야 한다.`;
      case "decline":
        return `인구·매물·임대료가 **동반 하락**하고 검색·기사는 늦게 부정 버즈로 반등 — "예전 같지 않다"는 서사가 임계를 넘는 **역티핑/소멸** 국면. 상권을 띄운 메커니즘이 그대로 무너뜨리는 중.`;
      default:
        return `신호가 전반적으로 **정체** — 아직 점화되지 않은 잠재 단계. 검색·기사 버즈를 일으킬 앵커(키스톤 업종)가 부재.`;
    }
  })();

  const direction = ((): string => {
    switch (pattern) {
      case "narrative_led":
        return "건강한 상승기 — 맥락(저임대)을 보전해 티핑을 지속시키되, 임대료 추월 시점을 선제 관리.";
      case "capital_led":
        return "거품 경계 — 자본 선행을 가시화하고 가치 환류 장치를 즉시 가동.";
      case "broad_rise":
        return "선순환 가속 — 다양성·진정성을 지키며 과열 진입 전 모니터링.";
      case "decline":
        return "쇠퇴 차단 — 구속조건(일자리·정주여건) 고리를 끊고 부정 서사 반전.";
      default:
        return "점화 실험 — 앵커 업종으로 0→1 전환을 시도.";
    }
  })();

  const strategy = ((): string[] => {
    switch (pattern) {
      case "narrative_led":
        return [
          "상생협약·공공임대상가로 **저임대 맥락 보전**(앵커 임차인 내몰림 방지)",
          "장소 고유 이야기 **고착성 강화** — 휘발성 팝업 의존 축소",
          "임대료가 검색·기사를 추월하는 분기를 **역티핑 조기경보**로 설정",
        ];
      case "capital_led":
        return [
          "단기임대(팝업) 비중·임차 안정성 추적 → **가치 환류** 장치(지역기여·상생기금)",
          "서사 없는 자본 유입에 **앵커 보전·공공기여** 조건 부여",
          "진정성 갭 확대 시 **수요 진위** 재검증(실거주·실창업 vs 투기)",
        ];
      case "broad_rise":
        return [
          "성공 DNA(앵커·다양성·진정성·보행성) **유지**",
          "선행지표(검색·기사) 추적으로 **과열 전 상생장치** 준비",
        ];
      case "decline":
        return [
          "레버리지 = **일자리·소득** 고리 집중 투입(인구는 결과, 경제가 원인)",
          "정주 인프라 거점 + 청년주택으로 **유출 고리 약화**",
          "부정 서사 반전 — 장소 자산 재발굴",
        ];
      default:
        return [
          "키스톤 앵커(로컬 F&B·문화·독립서점) **점화 실험**",
          "보행·용도혼합 개선으로 **창의 임차인 유입 환경** 조성",
        ];
    }
  })();

  // 확인 방법(검증) — 기획서 §5.1·§5.6·§3.3-D
  const rentTrend = st.rent.trend;
  const listingTrend = st.listings.trend;
  const divergence = rentTrend > 8 && listingTrend < 0;
  const verify: VerifyItem[] = [
    {
      title: "① 선행성(lead-lag) 검증",
      detail: leader
        ? `${leadLag} 서사(검색·기사)가 선행 → ${pattern === "narrative_led" ? "건강" : "추가 확인"}. Granger 인과로 정밀 검증.`
        : "상승 선행 신호 없음 — 정체/하락. 선행성 검증 보류.",
      status: pattern === "narrative_led" ? "good" : pattern === "capital_led" ? "bad" : "info",
    },
    {
      title: "② 진정성 갭",
      detail: `서사 vs 실제 상권 괴리 ${authenticityGap}. ${authenticityGap > 0.45 ? "프랜차이즈·팝업 과다 — 역티핑 선행 경보." : "정체성과 실상권이 비교적 정합."}`,
      status: authenticityGap > 0.45 ? "bad" : authenticityGap > 0.3 ? "watch" : "good",
    },
    {
      title: "③ 가격 ↔ 유동성 발산 (가로수길 룰)",
      detail: divergence
        ? `임대료↑(${rentTrend > 0 ? "+" : ""}${Math.round(rentTrend)}) 인데 매물·거래↓(${Math.round(listingTrend)}) — 가격보다 먼저 온 **쇠퇴 신호**.`
        : `임대료 추세 ${Math.round(rentTrend)} · 매물·거래 추세 ${Math.round(listingTrend)} — 발산 없음(아직 동행).`,
      status: divergence ? "bad" : "good",
    },
    {
      title: "④ 가치 환류 점검",
      detail: "이야기를 만든 주민·소상공인에게 가치가 돌아가는가 — 단기임대·브랜드 진입 비중, 임차 안정성 추적.",
      status: pattern === "capital_led" ? "watch" : "info",
    },
  ];

  return {
    comovement,
    peakPeriod: formatPeriod(periods[peakIdx]),
    peakValue: comovement[peakIdx],
    leadOrder,
    leader,
    lagger,
    pattern,
    patternLabel: PATTERN_LABEL[pattern],
    reason,
    direction,
    strategy,
    verify,
    trends,
  };
}
