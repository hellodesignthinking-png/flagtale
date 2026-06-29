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
