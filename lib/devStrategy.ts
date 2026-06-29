// 데이터 기반 진단 결론·전략·대안 — 실데이터(실측 매력도·발전가능성·빈집·상권·건축물·문화·정책)로
// 규칙 기반 처방 생성. 샘플 점수가 아니라 실제 수집 데이터의 값으로 결론·전략·대안을 도출.
import "server-only";

export interface DevStrategy {
  conclusion: string;          // 데이터 종합 결론(한 문단)
  stage: string;               // 구간 라벨(성장·안정·전환·집중지원)
  strategies: { title: string; detail: string; basis: string }[]; // 전략 + 근거 데이터
  alternatives: string[];      // 지역 대안(콘텐츠/개발 아이디어)
}

interface Args {
  name: string;
  realScore: { score: number; coverage: number } | null;
  potential: { grade: number; indicators: Record<string, number> } | null;
  vacant: { ratio: number | null; est?: number | null } | null;
  commerceReal: { stores: number; diversity: number; topCategories: [string, number][] } | null;
  building: { typeMix: number | null; oldRatio: number | null } | null;
  cultureReal: { events: number } | null;
  programs: { label: string }[];
  authGap: { verdict: string } | null;
}

export function devStrategy(a: Args): DevStrategy {
  const real = a.realScore?.score ?? null;
  const pot = a.potential?.grade ?? null;
  const vac = a.vacant?.ratio ?? null;
  const div = a.commerceReal ? Math.round(a.commerceReal.diversity * 100) : null;
  const mix = a.building?.typeMix != null ? Math.round(a.building.typeMix * 100) : null;
  const old = a.building?.oldRatio ?? null;
  const cul = a.cultureReal?.events ?? null;

  const strategies: DevStrategy["strategies"] = [];
  const alternatives: string[] = [];

  // 구간 판정(실측 매력도 + 발전가능성)
  let stage = "데이터 부족";
  if (real != null) {
    if (real >= 65 && (pot == null || pot >= 5)) stage = "성장·안정 구간";
    else if (real >= 50) stage = "관리·도약 구간";
    else stage = "전환·집중지원 구간";
  }

  // ── 전략 규칙(실데이터 값 기반) ──
  if (vac != null && vac >= 12) {
    strategies.push({ title: "빈집 활용·정비 우선", detail: "빈집은행·리모델링·임대전환으로 공실을 자산화하고, 새뜰마을·도시재생 사업을 신청해 정비 재원을 확보하세요.", basis: `빈집비율 ${vac}% (전국 ~8%↑)` });
    alternatives.push("빈집 리모델링 → 청년주택·창업공간·공유오피스 전환");
  }
  if (pot != null && pot <= 4) {
    strategies.push({ title: "정부 집중지원 유치", detail: "쇠퇴진단 등급이 낮아 도시재생·지방소멸대응기금·새뜰마을 등 국가 투자 우선순위 대상입니다. 사업 공모에 적극 응모하세요.", basis: `발전가능성 ${pot}/10` });
    alternatives.push("지방소멸대응기금·도시재생 뉴딜 공모 신청");
  } else if (pot != null && pot >= 7) {
    strategies.push({ title: "성장 관리·상생", detail: "발전 여건이 양호합니다. 임대료 급등·내몰림(젠트리)을 상생협약·공공임대상가로 관리하며 성장을 지속하세요.", basis: `발전가능성 ${pot}/10` });
  }
  if (div != null && div < 60) {
    strategies.push({ title: "업종 다각화", detail: "업종이 편중돼 외부 충격에 취약합니다. 부족 업종(문화·생활서비스·체험)을 유치해 상권 회복력을 높이세요.", basis: `업종 다양성 ${div}/100` });
    alternatives.push("부족 업종 매칭 — 로컬 편집숍·체험공방·서점·갤러리 유치");
  }
  if (mix != null && mix < 50) {
    strategies.push({ title: "용도 복합 개발", detail: "주거·상업·문화가 분리돼 활력이 낮습니다. 복합용도(주거+상업+문화) 개발·리모델링으로 24시간 활력을 만드세요.", basis: `용도혼합 ${mix}/100` });
  }
  if (old != null && old >= 55) {
    strategies.push({ title: "노후 정비·재생", detail: "노후 건축물 비중이 높습니다. 전면 철거보다 점진적 재생(가로주택·소규모정비)으로 맥락을 보전하며 개선하세요.", basis: `노후(30년+) ${old}%` });
    alternatives.push("가로주택정비·소규모재건축 + 근대건축 자산화(레트로 상권)");
  }
  if (cul != null && cul < 120) {
    strategies.push({ title: "문화 콘텐츠 유치", detail: "문화행사가 적어 방문 수요가 약합니다. 정기 축제·전시·로컬 콘텐츠를 유치해 체류·재방문을 늘리세요.", basis: `문화행사 ${cul}건` });
    alternatives.push("로컬 축제·플리마켓·전시 정례화로 방문 동기 창출");
  } else if (cul != null && cul >= 300) {
    strategies.push({ title: "문화 자산 연계", detail: "문화 행사가 풍부합니다. 상권·숙박·투어와 연계 패키지를 만들어 문화 방문객을 지역 소비로 전환하세요.", basis: `문화행사 ${cul}건` });
  }
  if (a.authGap?.verdict === "hype") {
    strategies.push({ title: "과열·거품 관리", detail: "검색 관심이 실체를 앞섭니다. 임대 안정·고유 점포 보전으로 역티핑(급랭)을 예방하세요.", basis: "진정성 갭: 과열" });
    alternatives.push("상생협약·공공임대상가로 임대료 안정");
  } else if (a.authGap?.verdict === "hidden") {
    strategies.push({ title: "미발견 강점 노출", detail: "실제 공급·자산 대비 인지도가 낮습니다. 콘텐츠·미디어·SNS로 노출을 강화해 수요를 끌어올리세요.", basis: "진정성 갭: 미발견" });
    alternatives.push("로컬 크리에이터·미디어 협업으로 인지도 제고");
  }
  if (a.programs.length) {
    strategies.push({ title: "기존 정부사업 연계 확대", detail: `${a.programs.map((p) => p.label).join("·")} 지정 지역입니다. 기 지정 사업과 연계해 후속·확대 사업으로 효과를 키우세요.`, basis: "정부 지역활성화 지정" });
  }

  // ── 결론 ──
  const bits: string[] = [];
  if (real != null) bits.push(`실측 매력도 ${real}/100(실${a.realScore?.coverage ?? 0}축)`);
  if (pot != null) bits.push(`발전가능성 ${pot}/10`);
  if (vac != null) bits.push(`빈집 ${vac}%`);
  const head = `${a.name}은(는) ${bits.join(" · ")} 기준 ${stage}입니다.`;
  const tail = stage === "성장·안정 구간"
    ? " 실데이터상 여건이 양호하니, 젠트리·과열 관리로 성장을 지속하는 것이 핵심입니다."
    : stage === "전환·집중지원 구간"
    ? " 빈집·쇠퇴 신호가 있어 정부 집중지원 유치 + 빈집 활용 + 업종/용도 다각화가 전환의 지렛대입니다."
    : " 회복 여력이 있으니 부족한 축(상권 다양성·문화·용도혼합)을 집중 보강하면 도약 가능합니다.";
  const conclusion = head + tail + (strategies.length ? ` 아래 ${strategies.length}개 전략은 모두 실제 수집 데이터에 근거합니다.` : "");

  return { conclusion, stage, strategies, alternatives };
}

// ── 내러티브 지속성 — 젠트리 0~5 사이클을 '그대로 밟는' 쇠퇴형 vs 홍대·성수처럼 '계속 갱신되는' 지속형 ──
// 핵심: 사이클 5(쇠퇴)로 가느냐는 '규모·다양성·문화앵커·확산생활권·발전기반'이 가른다.
// 이 요인이 많으면 자본이 들어와도 획일화로 붕괴하지 않고 지속(홍대=대학·다양성·연남/상수 확산).
export interface NarrativeDurability {
  mode: "지속형" | "전환점" | "쇠퇴 사이클 위험";
  score: number;
  total: number;
  factors: { factor: string; has: boolean; detail: string }[];
  why: string;
  alternatives: string[];
}
export function narrativeDurability(a: {
  commerceReal: { stores: number; diversity: number } | null;
  cultureReal: { events: number } | null;
  potential: { grade: number } | null;
  diffusionRole?: string;
  diffusionCount?: number;
  authGapVerdict?: string;
}): NarrativeDurability {
  const stores = a.commerceReal?.stores ?? 0;
  const div = a.commerceReal ? Math.round(a.commerceReal.diversity * 100) : 0;
  const cul = a.cultureReal?.events ?? 0;
  const pot = a.potential?.grade ?? 0;
  const spread = a.diffusionRole === "source" || (a.diffusionCount ?? 0) >= 2;

  const factors = [
    { factor: "상권 규모(획일화 저항)", has: stores >= 1500, detail: `${stores.toLocaleString()}개 상가` },
    { factor: "업종 다양성(회복력)", has: div >= 70, detail: `다양성 ${div}/100` },
    { factor: "문화 앵커(지속 유인)", has: cul >= 200, detail: `문화행사 ${cul}건` },
    { factor: "확산 생활권(압력 분산)", has: spread, detail: spread ? "인접 동 확산 원천/연계" : "단일 생활권" },
    { factor: "발전 기반", has: pot >= 6, detail: pot ? `발전 ${pot}/10` : "데이터 부족" },
  ];
  const score = factors.filter((f) => f.has).length;

  let mode: NarrativeDurability["mode"];
  let why: string;
  let alternatives: string[];
  if (score >= 4) {
    mode = "지속형";
    why = "규모·다양성·문화앵커·확산이 받쳐 사이클 5단계(쇠퇴)로 가지 않고 계속 갱신되는 구조입니다(홍대·성수형). 대형 자본·프랜차이즈가 들어와도 넓은 면적과 업종 다양성, 인접 동으로의 확산이 압력을 흡수해 획일화 붕괴를 막습니다. 다만 임대료 급등은 상시 관리 대상입니다.";
    alternatives = ["상생협약·공공임대상가로 임대료 안정 — 지속의 최대 변수", "인접 동 연계(확산)로 수요·임대 압력 분산", "고유 문화 앵커·독립 점포 보전(획일화 방지)"];
  } else if (score >= 2) {
    mode = "전환점";
    why = "일부 지속 요인은 있으나 다양성 또는 확산·문화 앵커가 약해, 자본 진입 이후 사이클대로 쇠퇴할 수도 / 지속형으로 도약할 수도 있는 분기점입니다. 부족한 요인의 보강 여부가 5단계 쇠퇴와 지속을 가릅니다.";
    alternatives = ["부족 요인(다양성·문화·확산) 집중 보강 — 지속/쇠퇴의 갈림길", "임대료 급등 선제 관리(상한·상생협약)", "독립 점포·로컬 콘텐츠로 고유성 강화"];
  } else {
    mode = "쇠퇴 사이클 위험";
    why = "규모·다양성·문화 앵커가 약해, 자본 진입 → 임대료 급등 → 초기 상점·원주민 내몰림 → 획일화 → 공실의 0~5단계 사이클을 그대로 밟을 위험이 큽니다. 짧은 호황 뒤 쇠퇴로 직행하기 쉬운 구조입니다.";
    alternatives = ["전면 자본화 전에 업종 다양성·문화 앵커 먼저 구축", "임대료 상한·상생협약을 호황 초기에 선제 도입", "인접 생활권 연계·확산 기반 마련으로 단일 의존 탈피"];
  }
  if (a.authGapVerdict === "hype" && mode !== "지속형") why += " 현재 검색·관심이 실체를 앞서(과열) 사이클 가속 위험이 더 큽니다.";
  return { mode, score, total: factors.length, factors, why, alternatives };
}
