// 문화영향평가(Cultural Impact Assessment) — 학술 프레임워크 3종을 행정동 실데이터로 구현.
//  ① 문화체육관광부·한국문화관광연구원 공식 체계: 3대 영역 · 6개 지표 · 12개 고려사항(2016~)
//  ② UNESCO Culture|2030 Indicators: 4차원(환경·번영·지식·포용) 22지표
//  ③ Cultural Vitality Index(Urban Institute): Presence·Participation·Support 3영역
// 각 '고려사항'(12개)을 0~100으로 추정 + 근거 데이터·산출식·신뢰도. 영역→지표→고려사항 위계.
import "server-only";
import type { NabisSido, SpecialStreetPlace } from "@/lib/data";

export interface CIInput { label: string; value: string; source: string }
export interface CISub {
  key: string;
  label: string;          // 고려사항명
  score: number | null;
  confidence: "높음" | "중간" | "근사";
  inputs: CIInput[];
  formula: string;
}
export interface CIIndicator {
  key: string;
  area: "문화기본권" | "문화정체성" | "문화발전";
  label: string;
  concept: string;        // 핵심개념(공식 정의)
  score: number | null;   // 2개 고려사항 평균
  subs: CISub[];
  interpret: string;
}
export interface CultureImpact {
  total: number | null;
  grade: "우수" | "양호" | "보통" | "취약";
  coverage: number;
  indicators: CIIndicator[];
  // Cultural Vitality(Urban Institute) — 교차 3영역
  vitality: { presence: number | null; participation: number | null; support: number | null };
  venues: { total: number; cultureScore: number; byKind: { label: string; count: number }[] } | null;
  regional: { sido: string; develop: number | null; innovate: number | null; creative: number | null; year: string | null } | null;
  streets: { count: number; totalStores: number; names: string[] } | null;
  alternatives: string[];
  frameworks: { name: string; scope: string; url: string }[];
}

type VenuesIn = { cultureScore: number; total: number; byKind: { kind: string; label: string; count: number; publicCount: number }[] } | null;

export function cultureImpact(d: {
  culture: { events: number; topRealms: { name: string; count: number }[] } | null;
  commerce: { stores: number; diversity: number } | null;
  building: { oldRatio: number | null } | null;
  programs: { label: string }[];
  potential: { grade: number } | null;
  nabis?: NabisSido | null;
  specialStreet?: SpecialStreetPlace | null;
  venues?: VenuesIn;
  sido?: string;
}): CultureImpact {
  const cap = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
  const r = (n: number) => Math.round(n);
  const avg = (xs: (number | null)[]) => { const v = xs.filter((x): x is number => x != null); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null; };

  const events = d.culture?.events ?? null;
  const realms = d.culture?.topRealms?.length ?? 0;
  const realmNames = (d.culture?.topRealms ?? []).map((x) => x.name).slice(0, 4).join("·");
  const div = d.commerce ? Math.round(d.commerce.diversity * 100) : null;
  const stores = d.commerce?.stores ?? null;
  const old = d.building?.oldRatio ?? null;
  const progN = d.programs.length;
  const progLabels = d.programs.map((p) => p.label).join("·");
  const streetN = d.specialStreet?.count ?? 0;
  const cre = d.nabis?.creative ?? null;
  const inn = d.nabis?.innovate ?? null;
  const dev = d.nabis?.develop ?? null;

  // 문화시설(venues)
  const vk = (k: string) => d.venues?.byKind.find((x) => x.kind === k)?.count ?? 0;
  const vcScore = d.venues?.cultureScore ?? null;
  const galleryN = vk("gallery"), theaterN = vk("theater"), bookN = vk("bookstore"), libN = vk("library"), parkN = vk("park");
  const expressN = galleryN + theaterN + bookN;          // 창작·표현 공간
  const publicN = d.venues?.byKind.reduce((s, x) => s + x.publicCount, 0) ?? 0;
  const culFacN = galleryN + theaterN + bookN + libN;     // 문화 기반시설

  const src = { cul: "한국문화정보원(시군구)", com: "소상공인 상권정보", bld: "통계청 인구주택총조사", ven: "네이버 지역검색(문화시설)", prog: "행안부·문체부 사업", nabis: "NABIS 산업연구원 2023", street: "공공데이터포털 표준데이터" };

  // ───────── 12 고려사항 ─────────
  // 1. 문화향유 ─ 문화향유권 + 문화접근권
  const s_hyangyukwon = events != null ? cap(events / 5) : null;
  const s_jeopgun = vcScore;
  // 2. 표현·참여 ─ 문화표현권 + 정책참여권
  const s_pyohyeon = expressN || streetN ? cap(expressN * 9 + Math.min(streetN * 9, 27)) : (events != null ? cap(realms * 12) : null);
  const s_chamyeo = progN || vcScore != null ? cap(progN * 28 + (publicN ? 18 : 0)) : null;
  // 3. 국가유산 ─ 국가유산보호 + 국가유산향유
  const s_yusanbo = old != null ? cap(old * 1.2) : null;
  const s_yusanhyang = d.venues ? cap(galleryN * 16 + libN * 6) : null;
  // 4. 공동체 ─ 지역공동체 + 사회통합
  const s_gongdong = div != null ? cap(div * 0.65 + (publicN ? 14 : 0)) : (progN ? 52 : null);
  const s_tonghap = d.venues || progN ? cap(publicN * 9 + parkN * 6 + progN * 16) : null;
  // 5. 문화다양성 ─ 다양성 권리 + 획일화 방지
  const s_damyangkwon = div != null ? cap(div * 0.7 + realms * 8) : null;
  const s_hoeilbang = div; // 업종 다양성↑ = 획일화·독점↓
  // 6. 창의성 ─ 창의성발전 + 미래지향성
  const s_changbal = cre != null ? cap(cre * 100 * 0.6 + progN * 18 * 0.4) : (div != null || progN ? cap(progN * 18 + div! * 0.3) : null);
  const s_mirae = inn != null ? cap(inn * 100 * 0.55 + (dev != null ? dev * 8 : 0) * 0.45) : (cre != null ? cap(cre * 100 * 0.5) : null);

  const mk = (key: string, label: string, score: number | null, confidence: CISub["confidence"], inputs: CIInput[], formula: string): CISub => ({ key, label, score, confidence, inputs, formula });

  const indicators: CIIndicator[] = [
    {
      key: "hyangyu", area: "문화기본권", label: "문화향유", concept: "문화생활을 누리고 향유할 권리에 미치는 영향",
      score: avg([s_hyangyukwon, s_jeopgun]),
      interpret: "주민이 문화를 누리고(향유권) 시설·프로그램에 접근(접근권)하는 기회.",
      subs: [
        mk("hyangyukwon", "문화향유권", s_hyangyukwon, "높음",
          [{ label: "공연·전시·축제 수", value: events != null ? `${events.toLocaleString()}건` : "—", source: src.cul }],
          events != null ? `min(100, 문화행사 ${events.toLocaleString()} ÷ 5) = ${s_hyangyukwon}` : "데이터 없음"),
        mk("jeopgun", "문화접근권", s_jeopgun, vcScore != null ? "높음" : "근사",
          [{ label: "문화 인프라 강도", value: vcScore != null ? `${vcScore}/100` : "—", source: src.ven }, { label: "문화기반시설", value: `${culFacN}개`, source: src.ven }],
          vcScore != null ? `문화 인프라 강도 지수 ${vcScore} (밀도·다양성·근접성)` : "시설 데이터 없음"),
      ],
    },
    {
      key: "pyohyeon", area: "문화기본권", label: "표현·참여", concept: "주체적·능동적 표현 기회와 참여 활동에 미치는 영향",
      score: avg([s_pyohyeon, s_chamyeo]),
      interpret: "예술인·주민의 표현 공간(표현권)과 정책·활동 참여(참여권).",
      subs: [
        mk("pyohyeonkwon", "문화표현권", s_pyohyeon, "중간",
          [{ label: "표현 공간(갤러리·공연장·책방)", value: `${expressN}개`, source: src.ven }, { label: "지역특화거리", value: `${streetN}개`, source: src.street }],
          `갤러리·공연장·책방 ${expressN}×9 + 특화거리 min(${streetN}×9,27) = ${s_pyohyeon}`),
        mk("chamyeokwon", "정책참여권", s_chamyeo, "중간",
          [{ label: "주민 참여형 사업", value: `${progN}건${progLabels ? ` (${progLabels})` : ""}`, source: src.prog }, { label: "공공 문화시설", value: `${publicN}개`, source: src.ven }],
          `참여사업 ${progN}×28${publicN ? " + 공공시설 18" : ""} = ${s_chamyeo}`),
      ],
    },
    {
      key: "yusan", area: "문화정체성", label: "국가유산", concept: "고유한 국가유산의 가치·향유 권리에 미치는 영향",
      score: avg([s_yusanbo, s_yusanhyang]),
      interpret: "⚠ 직접 국가유산 데이터 미연동 — 노후건축(역사 잠재)·박물관/미술관 시설로 근사.",
      subs: [
        mk("yusanbo", "국가유산 보호", s_yusanbo, "근사",
          [{ label: "노후건축물(30년+)", value: old != null ? `${old}%` : "—", source: src.bld }],
          old != null ? `노후건축물 ${old}% × 1.2 = ${s_yusanbo} (역사·근대 자산 잠재 근사)` : "데이터 없음"),
        mk("yusanhyang", "국가유산 향유권", s_yusanhyang, "근사",
          [{ label: "박물관·미술관·도서관", value: d.venues ? `갤러리/미술 ${galleryN} · 도서 ${libN}` : "—", source: src.ven }],
          d.venues ? `갤러리·미술관 ${galleryN}×16 + 도서관 ${libN}×6 = ${s_yusanhyang}` : "시설 데이터 없음"),
      ],
    },
    {
      key: "gongdong", area: "문화정체성", label: "공동체", concept: "지역 정체성·고유문화, 구성원 간 소통·교류·신뢰에 미치는 영향",
      score: avg([s_gongdong, s_tonghap]),
      interpret: "자생적 지역 기반(공동체)과 공공·소통 인프라(사회통합).",
      subs: [
        mk("jiyeok", "지역공동체", s_gongdong, "중간",
          [{ label: "자생 상권 다양성", value: div != null ? `${div}/100` : "—", source: src.com }, { label: "공공 문화시설", value: `${publicN}개`, source: src.ven }],
          div != null ? `상권다양성 ${div}×0.65${publicN ? " + 공공시설 14" : ""} = ${s_gongdong}` : "데이터 없음"),
        mk("tonghap", "사회통합", s_tonghap, "중간",
          [{ label: "공공·공원 공간", value: d.venues ? `공공 ${publicN} · 공원 ${parkN}` : "—", source: src.ven }, { label: "공동체 사업", value: `${progN}건`, source: src.prog }],
          d.venues || progN ? `공공시설 ${publicN}×9 + 공원 ${parkN}×6 + 사업 ${progN}×16 = ${s_tonghap}` : "데이터 없음"),
      ],
    },
    {
      key: "damyang", area: "문화발전", label: "문화다양성", concept: "소수자 표현 기회 보장·문화적 획일화/독점 방지에 미치는 영향",
      score: avg([s_damyangkwon, s_hoeilbang]),
      interpret: "장르·업종 다양성(권리)과 독점·획일화 방지.",
      subs: [
        mk("damyangkwon", "문화다양성 권리", s_damyangkwon, "높음",
          [{ label: "업종 다양성(Shannon)", value: div != null ? `${div}/100` : "—", source: src.com }, { label: "문화 분야", value: `${realms}종${realmNames ? ` (${realmNames})` : ""}`, source: src.cul }],
          div != null ? `업종다양성 ${div}×0.7 + 문화분야 ${realms}×8 = ${s_damyangkwon}` : "데이터 없음"),
        mk("hoeilbang", "획일화·독점 방지", s_hoeilbang, "높음",
          [{ label: "업종 다양성(독점 역지표)", value: div != null ? `${div}/100` : "—", source: src.com }, ...(stores != null ? [{ label: "등록 상가", value: `${stores.toLocaleString()}개`, source: src.com }] : [])],
          div != null ? `업종 다양성 ${div} = 높을수록 프랜차이즈 독점·획일화 위험 낮음` : "데이터 없음"),
      ],
    },
    {
      key: "changui", area: "문화발전", label: "창의성", concept: "창의성 발전·창의인재 유입, 혁신·지속가능 미래지향에 미치는 영향",
      score: avg([s_changbal, s_mirae]),
      interpret: "창의 토양(창의성발전)과 혁신·미래 잠재(미래지향성).",
      subs: [
        mk("changbal", "창의성 발전", s_changbal, cre != null ? "높음" : "중간",
          [...(cre != null ? [{ label: "창조잠재력지수", value: `${cre} (시도)`, source: src.nabis }] : []), { label: "창의기반 사업", value: `${progN}건`, source: src.prog }],
          cre != null ? `창조잠재력 ${cre}×100×0.6 + 정책 ${progN}×18×0.4 = ${s_changbal}` : `정책 ${progN}×18 + 다양성 보정 = ${s_changbal}`),
        mk("mirae", "미래지향성", s_mirae, inn != null ? "높음" : "근사",
          [...(inn != null ? [{ label: "지역혁신지수", value: `${inn} (시도)`, source: src.nabis }] : []), ...(dev != null ? [{ label: "지역발전지수", value: `${dev} (시도)`, source: src.nabis }] : [])],
          inn != null ? `혁신지수 ${inn}×100×0.55 + 발전 ${dev ?? 0}×8×0.45 = ${s_mirae}` : "혁신 데이터 없음"),
      ],
    },
  ];

  const sixScores = indicators.map((i) => i.score);
  const vals = sixScores.filter((s): s is number => s != null);
  const total = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  const grade: CultureImpact["grade"] = total == null ? "보통" : total >= 70 ? "우수" : total >= 55 ? "양호" : total >= 40 ? "보통" : "취약";

  // Cultural Vitality(Urban Institute) — 교차 3영역
  const presence = avg([vcScore, s_hyangyukwon, streetN ? cap(Math.min(streetN * 12, 100)) : null]);    // 존재(시설·행사·거리)
  const participation = avg([s_hyangyukwon, s_chamyeo, div != null ? cap(div * 0.8) : null]);            // 참여(향유·참여·상권활력)
  const support = avg([s_chamyeo, cre != null ? cap(cre * 100) : null, dev != null ? cap(dev * 12) : null]); // 지원(정책·창조·발전)

  // 대안 — 취약 고려사항 기반
  const alternatives: string[] = [];
  const lowSub = (k: string) => indicators.flatMap((i) => i.subs).find((s) => s.key === k);
  const isLow = (k: string) => { const s = lowSub(k); return s?.score != null && s.score < 50; };
  if (isLow("hyangyukwon")) alternatives.push("정기 공연·전시·축제 확충으로 문화향유권 보장(UNESCO 지식·포용 차원)");
  if (isLow("jeopgun")) alternatives.push("도서관·미술관·공연장 등 문화기반시설 확충·접근성 개선");
  if (isLow("pyohyeonkwon")) alternatives.push("주민·예술인 표현 공간(갤러리·책방·공연장·특화거리) 조성");
  if (isLow("chamyeokwon")) alternatives.push("청년마을·로컬크리에이터 등 주민 참여형 문화사업 유치");
  if (isLow("damyangkwon") || isLow("hoeilbang")) alternatives.push("업종·장르 다양성 유치 — 프랜차이즈 독점·문화 획일화 방지");
  if (isLow("changbal") || isLow("mirae")) alternatives.push("창의인재 유입·혁신 기반(문화도시·창업) 확대로 창조잠재력 제고");
  if (isLow("tonghap") || isLow("jiyeok")) alternatives.push("공공 문화공간·주민 공동체 프로그램으로 사회통합 강화");
  if (old != null && old >= 50) alternatives.push("높은 노후건축 → 근대건축·역사자산 보전·문화재생(국가유산 가치화)");
  if (!alternatives.length) alternatives.push("문화 기반이 양호 — 고유성 보전 + 임대·젠트리 관리로 지속가능성 확보");

  const regional = d.nabis
    ? { sido: d.sido ?? "", develop: d.nabis.develop, innovate: d.nabis.innovate, creative: d.nabis.creative, year: d.nabis.creYear ?? d.nabis.devYear }
    : null;
  const streets = d.specialStreet && d.specialStreet.count
    ? { count: d.specialStreet.count, totalStores: d.specialStreet.totalStores, names: d.specialStreet.streets.map((s) => s.name).slice(0, 6) }
    : null;
  const venuesOut = d.venues ? { total: d.venues.total, cultureScore: d.venues.cultureScore, byKind: d.venues.byKind.filter((k) => k.count > 0).map((k) => ({ label: k.label, count: k.count })) } : null;

  return {
    total, grade, coverage: vals.length, indicators,
    vitality: { presence, participation, support },
    venues: venuesOut, regional, streets, alternatives,
    frameworks: [
      { name: "문화영향평가(문체부·한국문화관광연구원)", scope: "3영역·6지표·12고려사항 — 「문화기본법」 §5④", url: "https://cupact.mcst.go.kr/intro/intro2.do" },
      { name: "UNESCO Culture|2030 Indicators", scope: "4차원(환경·번영·지식·포용) 22지표", url: "https://whc.unesco.org/en/culture2030indicators/" },
      { name: "Cultural Vitality Index(Urban Institute)", scope: "Presence·Participation·Support 3영역", url: "https://www.urban.org/research/publication/cultural-vitality-communities-interpretation-and-indicators" },
    ],
  };
}
