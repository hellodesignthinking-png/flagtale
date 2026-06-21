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
  // 12개 동시 호출(서버리스 타임아웃 내 완료). 개별 실패는 graceful null.
  const res = await Promise.all(TRENDING_LOCALS.map((l) => naverInterest(l.apiQuery).then((r) => [l.name, r] as const).catch(() => [l.name, null] as const)));
  for (const [name, r] of res) {
    if (!r) continue;
    const t = r.searchTrend;
    const now = t.length ? t[t.length - 1].ratio : 0;
    const prev = t.length >= 13 ? t[t.length - 13].ratio : t.length ? t[0].ratio : now;
    out[name] = { newsTotal: r.newsTotal, trendNow: now, trendDelta: Math.round(now - prev), sentiment: r.sentiment, headlines: r.headlines.slice(0, 2) };
  }
  // 전부 실패면 throw → unstable_cache가 빈 결과를 캐시하지 않게(6h 오염 방지)
  if (Object.keys(out).length === 0) throw new Error("trending-live: empty");
  return out;
}

export const getTrendingLive = unstable_cache(fetchAll, ["trending-locals-live-v3"], { revalidate: 21600 });
