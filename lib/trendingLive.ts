// 뜨는 로컬 동네의 네이버 실시간 지표(검색 트렌드·기사량·헤드라인). 서버 전용·6h 캐시.
import "server-only";
import { unstable_cache } from "next/cache";
import { naverInterest } from "./connectors/naver";
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
  // 동시 4개씩 배치 — 네이버 레이트리밋 회피
  for (let i = 0; i < TRENDING_LOCALS.length; i += 4) {
    const batch = TRENDING_LOCALS.slice(i, i + 4);
    const res = await Promise.all(batch.map((l) => naverInterest(l.apiQuery).catch(() => null)));
    res.forEach((r, j) => {
      if (!r) return;
      const t = r.searchTrend;
      const now = t.length ? t[t.length - 1].ratio : 0;
      const prev = t.length >= 13 ? t[t.length - 13].ratio : t.length ? t[0].ratio : now;
      out[batch[j].name] = {
        newsTotal: r.newsTotal,
        trendNow: now,
        trendDelta: Math.round(now - prev),
        sentiment: r.sentiment,
        headlines: r.headlines.slice(0, 2),
      };
    });
  }
  return out;
}

export const getTrendingLive = unstable_cache(fetchAll, ["trending-locals-live-v2"], { revalidate: 21600 });
