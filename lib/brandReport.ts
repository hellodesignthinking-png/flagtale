// 브랜드(매장) 진단 — 그 매장 자체의 경쟁력·성장·위기를 분석.
// 매장 신호(블로그·카페·검색·감성) + 동네 대비 경쟁력 + 임대료 + 성장전략 + 위기(재개발 포함).
import "server-only";
import type { StoreBuzz } from "@/lib/connectors/storebuzz";
import type { AnchorStore } from "@/lib/connectors/anchor";
import type { SanggaStats } from "@/lib/connectors/sangga";
import type { RebForPlace } from "@/lib/connectors/reb";
import type { PlaceScore } from "@/lib/types";

export interface BrandRisk {
  severity: "high" | "mid" | "low" | "check";
  title: string;
  detail: string;
}
export interface BrandReport {
  name: string;
  category: string;
  signals: {
    blogPosts: number;
    cafePosts: number;
    totalPosts: number;
    searchNow: number | null; // 최근 검색 관심도(0~100)
    searchDelta: number | null; // 검색 추세 %(기간 시작 대비)
    positiveRatio: number | null;
    pos: number;
    neg: number;
    relevanceRatio: number | null; // 표본 중 '실제 이 매장' 관련 비율
    reliable: boolean; // 관련 표본이 충분한가
    query: string; // 실제 검색 질의(매장명+지역)
    recent: { title: string; channel: string; tone: number; link: string }[];
    note: string;
  };
  competitiveness: {
    storeBuzz: number;
    neighborAvg: number | null;
    buzzVsNeighbor: number | null; // 동네 평균 대비 배수
    neighborRank: number | null; // 동네 버즈 추정 순위
    neighborN: number;
    foodCafeShare: number | null;
    franchiseShare: number | null;
    level: "strong" | "mid" | "weak";
    verdict: string;
  };
  rent: { index: number | null; chgFrom2016: number | null; vacancy: number | null; trend: string } | null;
  growth: { title: string; detail: string }[];
  risks: BrandRisk[];
}

export interface BrandReportInput {
  name: string;
  category: string;
  storeBuzz: StoreBuzz | null;
  storeSearchTrend: { period: string; ratio: number }[] | null;
  anchor: AnchorStore[] | null;
  sangga: SanggaStats | null;
  reb: RebForPlace | null;
  latest: PlaceScore;
  gentriStage: number;
}

export function buildBrandReport(inp: BrandReportInput): BrandReport {
  const { name, category, storeBuzz: sb, storeSearchTrend, anchor, sangga, reb, latest, gentriStage } = inp;

  // ── 매장 신호 (스코프 검색 + 관련도 필터된 값) ──
  const blogPosts = sb?.blogTotal ?? 0;
  const cafePosts = sb?.cafeTotal ?? 0;
  const totalPosts = blogPosts + cafePosts;
  const positiveRatio = sb?.positiveRatio ?? null;
  const pos = sb?.pos ?? 0;
  const neg = sb?.neg ?? 0;
  const relevanceRatio = sb?.relevanceRatio ?? null;
  const reliable = sb?.reliable ?? false;
  const recent = (sb?.recent ?? []).map((r) => ({ title: r.title, channel: r.channel, tone: r.tone, link: r.link }));
  const tr = storeSearchTrend ?? [];
  const searchNow = tr.length ? tr[tr.length - 1].ratio : null;
  const searchDelta = tr.length >= 2 && tr[0].ratio > 0 ? Math.round(((tr[tr.length - 1].ratio - tr[0].ratio) / tr[0].ratio) * 1000) / 10 : null;

  // ── 경쟁력: 동네 앵커 대비 버즈 ──
  const buzzList = (anchor ?? []).map((a) => a.blogBuzz).filter((b) => b > 0);
  const neighborAvg = buzzList.length ? Math.round(buzzList.reduce((s, b) => s + b, 0) / buzzList.length) : null;
  const storeBuzz = blogPosts;
  const buzzVsNeighbor = neighborAvg && neighborAvg > 0 ? Math.round((storeBuzz / neighborAvg) * 100) / 100 : null;
  const neighborRank = anchor && anchor.length ? anchor.filter((a) => a.blogBuzz > storeBuzz).length + 1 : null;
  const foodCafeShare = sangga ? Math.round(sangga.foodCafeRatio) : null;
  const franchiseShare = sangga ? Math.round(sangga.chainRatio) : null;

  let level: "strong" | "mid" | "weak" = "mid";
  if (buzzVsNeighbor != null) {
    if (buzzVsNeighbor >= 1.2 && (positiveRatio ?? 50) >= 50) level = "strong";
    else if (buzzVsNeighbor < 0.5 || (positiveRatio ?? 50) < 40) level = "weak";
  } else if ((positiveRatio ?? 50) < 40) level = "weak";
  const verdict =
    level === "strong"
      ? `동네 평균보다 회자도가 높고(×${buzzVsNeighbor ?? "—"}) 평판도 우호적 — 지역의 버즈를 끄는 앵커형 매장.`
      : level === "weak"
        ? `동네 대비 회자도·평판이 약함 — 고유 콘텐츠·서사로 인지도를 끌어올릴 여지.`
        : `동네 평균 수준의 인지도 — 시그니처·차별화로 상위 그룹 진입 가능.`;

  // ── 임대료 ──
  const rent: BrandReport["rent"] = reb?.rent
    ? {
        index: reb.rent.latest ?? null,
        chgFrom2016: reb.rent.chgFrom2016 ?? null,
        vacancy: reb.vacancy?.latest ?? null,
        trend: (reb.rent.chgFrom2016 ?? 0) >= 5 ? "상승 압력 — 비용 부담 확대" : (reb.vacancy?.latest ?? 0) >= 8 ? "공실 확대 — 수요 약화" : "비교적 안정",
      }
    : null;

  // ── 성장 전략(매장 맞춤) ──
  const growth: { title: string; detail: string }[] = [];
  if ((searchDelta ?? 0) < 0 || (buzzVsNeighbor ?? 1) < 1)
    growth.push({ title: "고유 서사 강화", detail: "한 줄 정체성·시그니처 메뉴/경험을 명확히 해 검색·재방문을 유도. 휘발성 트렌드보다 ‘고착성(다시 오게 만드는 이유)’에 투자." });
  if ((franchiseShare ?? 0) >= 12)
    growth.push({ title: "차별화 포지셔닝", detail: `주변 프랜차이즈 비중 ${franchiseShare}% — 획일화된 상권에서 독립 브랜드의 개성(로컬 재료·동네 협업)으로 대비 효과를 키울 것.` });
  if ((searchDelta ?? 0) > 0 && (buzzVsNeighbor ?? 0) >= 1)
    growth.push({ title: "모멘텀 활용", detail: "검색·회자도가 상승 국면 — 콜라보·팝업·한정판으로 유입을 확장하고 SNS 콘텐츠로 도달을 극대화." });
  if ((rent?.chgFrom2016 ?? 0) >= 5)
    growth.push({ title: "임대 안정 확보", detail: "임대료 상승 구간 — 장기계약·상생협약으로 비용 리스크를 선제 차단(젠트리 후기 내몰림 방지)." });
  if ((positiveRatio ?? 60) < 50)
    growth.push({ title: "평판 관리", detail: "부정 표본 비중이 높음 — 대기·가격·응대 등 불만 원인을 점검하고 리뷰 응대로 신뢰를 회복." });
  if (!growth.length)
    growth.push({ title: "현 강점 유지·확장", detail: "인지도·평판이 양호 — 시그니처를 축으로 카테고리 확장·2호점/굿즈 등 브랜드화 단계로 발전 가능." });

  // ── 위기 ──
  const risks: BrandRisk[] = [];
  if ((rent?.chgFrom2016 ?? 0) >= 8) risks.push({ severity: "high", title: "임대료 급등 — 비용 압박", detail: `상권 임대가격지수 2016 대비 +${rent?.chgFrom2016}. 매출 성장률이 이를 못 따라가면 수익성 가위(rent-to-revenue) 악화.` });
  else if ((rent?.chgFrom2016 ?? 0) >= 5) risks.push({ severity: "mid", title: "임대료 상승 압력", detail: `임대가격지수 2016 대비 +${rent?.chgFrom2016}. 계약 갱신 시 비용 상승 대비 필요.` });
  if (gentriStage >= 4) risks.push({ severity: "high", title: "젠트리 후기 — 내몰림", detail: `젠트리 ${gentriStage}단계. 자본·프랜차이즈 진입으로 임대료가 급등, 초기 상점이 밀려나는 국면.` });
  else if (gentriStage >= 3) risks.push({ severity: "mid", title: "젠트리 과열 진입", detail: `젠트리 ${gentriStage}단계. 미디어 버즈·외부 자본 유입이 빨라지는 변곡점.` });
  if ((positiveRatio ?? 60) < 45) risks.push({ severity: "mid", title: "부정 평판 확산", detail: `최근 표본 긍정비율 ${positiveRatio ?? "—"}% — ‘예전 같지 않다’류 서사가 늘면 재방문·신규 유입이 함께 둔화.` });
  if ((searchDelta ?? 0) <= -20) risks.push({ severity: "mid", title: "관심도 하락", detail: `검색 관심도가 기간 대비 ${searchDelta}% — 인지도 둔화. 신규 콘텐츠·이슈로 반등 모멘텀 필요.` });
  // 재개발·정비사업 — 입지의 최대 비가역 리스크(자동 지정조회는 별도 포털, 확인 권장)
  risks.push({
    severity: "check",
    title: "재개발·정비사업(모아타운/재건축) 리스크",
    detail:
      "이 지역이 모아타운·재개발·재건축 정비구역으로 지정되면 2~3년 내 철거·이전이 강제될 수 있습니다 — 매장 입지의 ‘최대 비가역 리스크’. 지정 여부는 정비사업 정보몽땅·서울 모아타운·국토부 정비사업에서 지번으로 확인하고, 현장 정보는 ‘현장 리포트’로 보강하세요.",
  });

  return {
    name,
    category,
    signals: {
      blogPosts,
      cafePosts,
      totalPosts,
      searchNow,
      searchDelta,
      positiveRatio,
      pos,
      neg,
      relevanceRatio,
      reliable,
      query: sb?.query ?? name,
      recent,
      note: reliable
        ? "‘매장명+지역’으로 스코프 검색해 그 매장 관련 글만 집계. 네이버 공식 별점·방문자 리뷰 수는 API 미제공 → 블로그·카페 언급·감성으로 평판 추정."
        : "이 매장명은 일반어와 겹쳐 관련 글이 적게 잡혔습니다(언급량은 참고용). 정확한 평판은 ‘네이버에서 보기’로 확인하세요. 공식 별점·리뷰 수는 API 미제공.",
    },
    competitiveness: {
      storeBuzz,
      neighborAvg,
      buzzVsNeighbor,
      neighborRank,
      neighborN: anchor?.length ?? 0,
      foodCafeShare,
      franchiseShare,
      level,
      verdict,
    },
    rent,
    growth,
    risks,
  };
}
