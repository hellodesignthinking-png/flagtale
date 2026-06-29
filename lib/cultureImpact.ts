// 문화영향평가(Cultural Impact Assessment) — 문화기본법 제5조4항 평가지표를 플랫폼 실데이터로 근사.
//   문화기본권(문화향유·표현참여) / 문화정체성(국가유산·공동체) / 문화발전(문화다양성·창의성)
// 각 지표: 0~100 추정 + 신뢰도 + 근거 데이터(inputs) + 산출식(formula) + 해석(interpret) — 연구보고서식 투명 공개.
import "server-only";
import type { NabisSido, SpecialStreetPlace } from "@/lib/data";

export interface CIInput { label: string; value: string; source: string }
export interface CIIndicator {
  key: string;
  area: "문화기본권" | "문화정체성" | "문화발전";
  label: string;
  score: number | null;
  confidence: "높음" | "중간" | "근사";
  basis: string;
  inputs: CIInput[];   // 근거 데이터(무엇을 썼나)
  formula: string;     // 산출식(실제 숫자로)
  interpret: string;   // 해석(어떻게 나왔나)
}
export interface CultureImpact {
  total: number | null;
  grade: "우수" | "양호" | "보통" | "취약";
  indicators: CIIndicator[];
  alternatives: string[];
  coverage: number;
  regional: { sido: string; develop: number | null; innovate: number | null; creative: number | null; year: string | null } | null;
  streets: { count: number; totalStores: number; names: string[] } | null;
}

export function cultureImpact(d: {
  culture: { events: number; topRealms: { name: string; count: number }[] } | null;
  commerce: { stores: number; diversity: number } | null;
  building: { oldRatio: number | null } | null;
  programs: { label: string }[];
  potential: { grade: number } | null;
  nabis?: NabisSido | null;
  specialStreet?: SpecialStreetPlace | null;
  sido?: string;
}): CultureImpact {
  const events = d.culture?.events ?? null;
  const realms = d.culture?.topRealms?.length ?? 0;
  const realmNames = (d.culture?.topRealms ?? []).map((r) => r.name).slice(0, 4).join("·");
  const div = d.commerce ? Math.round(d.commerce.diversity * 100) : null;
  const stores = d.commerce?.stores ?? null;
  const old = d.building?.oldRatio ?? null;
  const progN = d.programs.length;
  const progLabels = d.programs.map((p) => p.label).join("·");
  const streetCount = d.specialStreet?.count ?? 0;
  const cre = d.nabis?.creative ?? null;
  const cap = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
  const r = (n: number) => Math.round(n);
  const band = (s: number | null) =>
    s == null ? "데이터 부족" : s >= 70 ? "우수 — 전국 상위 수준" : s >= 55 ? "양호 — 평균 이상" : s >= 40 ? "보통 — 보강 권장" : "취약 — 집중 개선 필요";

  // ── 1. 문화향유 ──
  const hScore = events != null ? cap(events / 5) : null;
  // ── 2. 표현·참여 ──
  const pBase = realms * 14, pPol = progN ? 16 : 0, pSt = Math.min(streetCount * 9, 27);
  const pScore = events != null || streetCount ? cap(pBase + pPol + pSt) : null;
  // ── 3. 국가유산(근사) ──
  const yScore = old != null ? cap(old * 1.2) : null;
  // ── 4. 공동체 ──
  const gBase = div != null ? div * 0.6 : 0, gPol = progN * 14;
  const gScore = div != null ? cap(gBase + gPol) : progN ? 55 : null;
  // ── 5. 문화다양성 ──
  const dScore = div;
  // ── 6. 창의성 ──
  const cComp = cre != null ? cre * 100 * 0.55 : null;
  const cLocal = progN * 18 + (div != null ? div * 0.4 : 0);
  const cScore = cre != null ? cap((cComp as number) + cLocal * 0.45) : div != null || progN ? cap(cLocal) : null;

  const ind: CIIndicator[] = [
    {
      key: "hyangyu", area: "문화기본권", label: "문화향유 — 문화시설·프로그램 접근",
      score: hScore, confidence: "높음",
      basis: events != null ? `공연·전시·축제 ${events.toLocaleString()}건(시군구)` : "문화행사 데이터 없음",
      inputs: [{ label: "공연·전시·축제 수", value: events != null ? `${events.toLocaleString()}건` : "—", source: "한국문화정보원(시군구)" }],
      formula: events != null ? `min(100, 문화행사 ${events.toLocaleString()} ÷ 5) = ${hScore}` : "데이터 없음",
      interpret: hScore != null ? `${band(hScore)}. 행사가 많을수록 주민의 문화 접근·향유 기회가 큽니다(500건=100 기준).` : "문화행사 데이터 미연동.",
    },
    {
      key: "pyohyeon", area: "문화기본권", label: "표현·참여 — 주체적 표현·참여 기회",
      score: pScore, confidence: "중간",
      basis: `문화 분야 ${realms}종${progN ? ` + 정책사업 ${progN}` : ""}${streetCount ? ` + 특화거리 ${streetCount}` : ""}`,
      inputs: [
        { label: "문화 분야 다양성", value: `${realms}종${realmNames ? ` (${realmNames})` : ""}`, source: "한국문화정보원" },
        { label: "지역특화거리", value: `${streetCount}개`, source: "공공데이터포털 표준데이터" },
        ...(progN ? [{ label: "정책 참여 사업", value: `${progN}건`, source: "행안부·문체부" }] : []),
      ],
      formula: `문화분야 ${realms}×14=${pBase}${progN ? ` + 정책 16` : ""}${streetCount ? ` + 특화거리 min(${streetCount}×9,27)=${pSt}` : ""} = ${pScore}`,
      interpret: pScore != null ? `${band(pScore)}. 분야가 다양하고 특화거리·참여사업이 많을수록 주민·예술인의 표현·참여 통로가 넓습니다.` : "데이터 부족.",
    },
    {
      key: "yusan", area: "문화정체성", label: "국가유산 — 역사·근대 자산(근사)",
      score: yScore, confidence: "근사",
      basis: old != null ? `노후건축물 ${old}%(역사·근대 자산 잠재)` : "건축 데이터 없음",
      inputs: [{ label: "노후건축물(30년+) 비율", value: old != null ? `${old}%` : "—", source: "통계청 인구주택총조사" }],
      formula: old != null ? `노후건축물 ${old}% × 1.2 = ${yScore} (근사)` : "데이터 없음",
      interpret: "⚠ 직접 국가유산 데이터 미연동 → 노후건축 비중을 역사·근대 자산 '잠재'의 근사로 사용(높을수록 보전·재생 가치 잠재).",
    },
    {
      key: "gongdong", area: "문화정체성", label: "공동체 — 지역정체성·소통",
      score: gScore, confidence: "중간",
      basis: `자생 상권 다양성${div != null ? ` ${div}` : ""}${progN ? ` + 공동체 사업 ${progN}` : ""}`,
      inputs: [
        { label: "자생 상권 다양성", value: div != null ? `${div}/100` : "—", source: "소상공인 상권정보" },
        ...(progN ? [{ label: "공동체·문화 사업", value: `${progN}건${progLabels ? ` (${progLabels})` : ""}`, source: "행안부·문체부" }] : []),
      ],
      formula: div != null ? `상권다양성 ${div}×0.6=${r(gBase)}${progN ? ` + 사업 ${progN}×14=${gPol}` : ""} = ${gScore}` : progN ? "정책사업 기반 추정 55" : "데이터 없음",
      interpret: gScore != null ? `${band(gScore)}. 자생 상권과 공동체 사업이 강할수록 지역정체성·주민 소통 기반이 탄탄합니다.` : "데이터 부족.",
    },
    {
      key: "damyang", area: "문화발전", label: "문화다양성 — 획일화 방지",
      score: dScore, confidence: "높음",
      basis: div != null ? `업종 다양성 ${div}/100(소진공 상권)` : "상권 데이터 없음",
      inputs: [
        { label: "업종 다양성(Shannon)", value: div != null ? `${div}/100` : "—", source: "소상공인 상권정보" },
        ...(stores != null ? [{ label: "등록 상가 수", value: `${stores.toLocaleString()}개`, source: "소상공인 상권정보" }] : []),
      ],
      formula: div != null ? `업종 다양성 지수 ${div} (업종 분포의 Shannon 엔트로피 정규화)` : "데이터 없음",
      interpret: dScore != null ? `${band(dScore)}. 업종이 고를수록 문화적 획일화·프랜차이즈 독점 위험이 낮습니다.` : "상권 데이터 미연동.",
    },
    {
      key: "changui", area: "문화발전", label: "창의성 — 창의인재·혁신 기반",
      score: cScore, confidence: cre != null ? "높음" : "중간",
      basis: cre != null ? `NABIS 창조잠재력 ${cre}(시도·공식) + 정책 ${progN}·다양성 ${div ?? "—"}` : `창의기반 사업 ${progN} + 다양성 ${div ?? "—"}`,
      inputs: [
        ...(cre != null ? [{ label: "창조잠재력지수", value: `${cre} (시도)`, source: "NABIS 산업연구원 2023" }] : []),
        { label: "창의기반 사업", value: `${progN}건${progLabels ? ` (${progLabels})` : ""}`, source: "청년마을·문화도시" },
        { label: "업종 다양성", value: div != null ? `${div}/100` : "—", source: "소상공인 상권정보" },
      ],
      formula: cre != null
        ? `창조잠재력 ${cre}×100×0.55=${r(cComp as number)} + (정책 ${progN}×18 + 다양성 ${div ?? 0}×0.4)×0.45=${r(cLocal * 0.45)} = ${cScore}`
        : `정책 ${progN}×18 + 다양성 ${div ?? 0}×0.4 = ${cScore}`,
      interpret: cScore != null
        ? `${band(cScore)}. ${cre != null ? "시도 공식 창조잠재력지수를 핵심으로, " : ""}창의기반 정책사업·상권 다양성이 창의인재 유입·혁신 토양을 가늠합니다.`
        : "데이터 부족.",
    },
  ];

  const vals = ind.map((i) => i.score).filter((s): s is number => s != null);
  const total = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  const grade: CultureImpact["grade"] = total == null ? "보통" : total >= 70 ? "우수" : total >= 55 ? "양호" : total >= 40 ? "보통" : "취약";

  const alternatives: string[] = [];
  const low = (k: string) => { const x = ind.find((i) => i.key === k); return x?.score != null && x.score < 50; };
  if (low("hyangyu")) alternatives.push("문화시설·정기 프로그램(공연·전시·축제) 확충으로 문화향유권 보장");
  if (low("damyang")) alternatives.push("업종·장르 다양성 유치 — 문화적 획일화·독점 방지");
  if (low("changui")) alternatives.push("청년마을·로컬크리에이터·문화도시 등 창의기반 사업 유치");
  if (low("gongdong")) alternatives.push("주민 참여형 공동체 문화 프로그램·거점 조성");
  if (low("pyohyeon")) alternatives.push("주민·예술인 표현·참여 공간(공연장·갤러리·책방) 확충");
  if (old != null && old >= 50) alternatives.push("높은 노후건축 비중 → 근대건축·역사자산 보전·문화재생 활용");
  if (!alternatives.length) alternatives.push("현 문화 기반이 양호 — 고유성 보전 + 임대·젠트리 관리로 지속");

  const regional = d.nabis
    ? { sido: d.sido ?? "", develop: d.nabis.develop, innovate: d.nabis.innovate, creative: d.nabis.creative, year: d.nabis.creYear ?? d.nabis.devYear }
    : null;
  const streets = d.specialStreet && d.specialStreet.count
    ? { count: d.specialStreet.count, totalStores: d.specialStreet.totalStores, names: d.specialStreet.streets.map((s) => s.name).slice(0, 6) }
    : null;

  return { total, grade, indicators: ind, alternatives, coverage: vals.length, regional, streets };
}
