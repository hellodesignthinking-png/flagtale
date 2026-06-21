// 뜨는 로컬 동네의 네이버 실시간 지표(검색 트렌드·기사량·헤드라인). 서버 전용·6h 캐시.
import "server-only";
import { unstable_cache } from "next/cache";
import { naverNews, naverTrendBatch } from "./connectors/naver";
import { TRENDING_LOCALS } from "./trendingLocals";

export interface LocalLive {
  newsTotal: number;
  trendNow: number; // 최근월 상대 검색량(0~100)
  trendDelta: number; // 1년 전 대비 변화(+면 검색 증가=뜨는 중)
  sentiment: number; // -100~+100
  headlines: { title: string; date: string; link: string; tone: 1 | 0 | -1 }[];
}

async function fetchAll(): Promise<Record<string, LocalLive>> {
  const out: Record<string, LocalLive> = {};
  // 뉴스 단독 12개 병렬(고한도·버스트 안전) + 데이터랩 트렌드 배치(3요청) — 동시 실행
  const [newsRes, trends] = await Promise.all([
    Promise.all(TRENDING_LOCALS.map((l) => naverNews(l.apiQuery).then((r) => [l.name, l.apiQuery, r] as const).catch(() => [l.name, l.apiQuery, null] as const))),
    naverTrendBatch(TRENDING_LOCALS.map((l) => l.apiQuery)),
  ]);
  for (const [name, q, r] of newsRes) {
    const tr = trends[q];
    if (!r && !tr) continue;
    out[name] = {
      newsTotal: r?.newsTotal ?? 0,
      sentiment: r?.sentiment ?? 0,
      headlines: r?.headlines ?? [],
      trendNow: tr?.now ?? 0,
      trendDelta: tr?.delta ?? 0,
    };
  }
  // 전부 실패면 throw → unstable_cache가 빈 결과를 캐시하지 않게(6h 오염 방지)
  if (Object.keys(out).length === 0) throw new Error("trending-live: empty");
  return out;
}

export const getTrendingLive = unstable_cache(fetchAll, ["trending-locals-live-v4"], { revalidate: 21600 });
