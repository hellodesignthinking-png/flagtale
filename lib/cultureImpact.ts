// 문화영향평가(Cultural Impact Assessment) — 문화기본법 제5조4항 평가지표를 플랫폼 실데이터로 근사.
//   문화기본권(문화향유·표현참여) / 문화정체성(국가유산·공동체) / 문화발전(문화다양성·창의성)
// 각 지표를 0~100으로 추정 + 신뢰도(높음/중간/근사) + 대안 제시(제도의 목적=대안 제시).
import "server-only";
import type { NabisSido, SpecialStreetPlace } from "@/lib/data";

export interface CIIndicator {
  key: string;
  area: "문화기본권" | "문화정체성" | "문화발전";
  label: string;
  score: number | null;
  confidence: "높음" | "중간" | "근사";
  basis: string;
}
export interface CultureImpact {
  total: number | null;
  grade: "우수" | "양호" | "보통" | "취약";
  indicators: CIIndicator[];
  alternatives: string[];
  coverage: number; // 데이터로 산출된 지표 수
  // 시도 공식 지수(NABIS 산업연구원) — 동별 broadcast 컨텍스트
  regional: { sido: string; develop: number | null; innovate: number | null; creative: number | null; year: string | null } | null;
  // 지역특화거리(동) — 문화·표현 앵커
  streets: { count: number; totalStores: number; names: string[] } | null;
}

export function cultureImpact(d: {
  culture: { events: number; topRealms: { name: string; count: number }[] } | null;
  commerce: { stores: number; diversity: number } | null;
  building: { oldRatio: number | null } | null;
  programs: { label: string }[];
  potential: { grade: number } | null;
  nabis?: NabisSido | null; // 시도 공식 지수
  specialStreet?: SpecialStreetPlace | null; // 동 특화거리
  sido?: string;
}): CultureImpact {
  const events = d.culture?.events ?? null;
  const realms = d.culture?.topRealms?.length ?? 0;
  const div = d.commerce ? Math.round(d.commerce.diversity * 100) : null;
  const old = d.building?.oldRatio ?? null;
  const progN = d.programs.length;
  const streetCount = d.specialStreet?.count ?? 0;
  const cre = d.nabis?.creative ?? null; // NABIS 창조잠재력(시도, 0~1)
  const cap = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

  const ind: CIIndicator[] = [
    {
      key: "hyangyu", area: "문화기본권", label: "문화향유 — 문화시설·프로그램 접근",
      score: events != null ? cap(events / 5) : null, confidence: "높음",
      basis: events != null ? `공연·전시·축제 ${events.toLocaleString()}건(시군구)` : "문화행사 데이터 없음",
    },
    {
      key: "pyohyeon", area: "문화기본권", label: "표현·참여 — 주체적 표현·참여 기회",
      score: events != null || streetCount ? cap(realms * 14 + (progN ? 16 : 0) + Math.min(streetCount * 9, 27)) : null, confidence: "중간",
      basis: `문화 분야 ${realms}종${progN ? ` + 정책사업 ${progN}` : ""}${streetCount ? ` + 특화거리 ${streetCount}` : ""}`,
    },
    {
      key: "yusan", area: "문화정체성", label: "국가유산 — 역사·근대 자산(근사)",
      score: old != null ? cap(old * 1.2) : null, confidence: "근사",
      basis: old != null ? `노후건축물 ${old}%(역사·근대 자산 잠재 — 직접 유산데이터 미연동)` : "건축 데이터 없음",
    },
    {
      key: "gongdong", area: "문화정체성", label: "공동체 — 지역정체성·소통",
      score: div != null ? cap(div * 0.6 + progN * 14) : progN ? 55 : null, confidence: "중간",
      basis: `자생 상권 다양성${div != null ? ` ${div}` : ""}${progN ? ` + 공동체 사업 ${progN}` : ""}`,
    },
    {
      key: "damyang", area: "문화발전", label: "문화다양성 — 획일화 방지",
      score: div, confidence: "높음",
      basis: div != null ? `업종 다양성 ${div}/100(소진공 상권)` : "상권 데이터 없음",
    },
    {
      key: "changui", area: "문화발전", label: "창의성 — 창의인재·혁신 기반",
      score: cre != null
        ? cap(cre * 100 * 0.55 + (progN * 18 + (div != null ? div * 0.4 : 0)) * 0.45)
        : (div != null || progN ? cap(progN * 18 + (div != null ? div * 0.4 : 0)) : null),
      confidence: cre != null ? "높음" : "중간",
      basis: cre != null
        ? `NABIS 창조잠재력 ${cre}(시도·공식) + 정책사업 ${progN}${div != null ? `·다양성 ${div}` : ""}`
        : `창의기반 사업(청년마을·문화도시) ${progN}${div != null ? ` + 다양성 ${div}` : ""}`,
    },
  ];

  const vals = ind.map((i) => i.score).filter((s): s is number => s != null);
  const total = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  const grade: CultureImpact["grade"] = total == null ? "보통" : total >= 70 ? "우수" : total >= 55 ? "양호" : total >= 40 ? "보통" : "취약";

  // 대안 제시 — 취약 지표 기반(제도의 목적)
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
