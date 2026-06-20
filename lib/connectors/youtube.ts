// 유튜브 컨텐츠 신호 — YouTube Data API v3 search.list 로 동네 관련 영상 탐색.
//   · 영상 수(추정) = 콘텐츠 생산 활발도
//   · 제목+설명 톤 분류 → 긍정/부정
//   ⚠ YOUTUBE_API_KEY 필요(Google Cloud Console · YouTube Data API v3, 무료 일 10,000유닛).
//     키 없으면 graceful null → /data 페이지에 '키 필요'로 표시.
import "server-only";
import { aggregateTones, cleanText, type ToneAgg } from "@/lib/sentiment";

const KEY = process.env.YOUTUBE_API_KEY;

export interface YoutubeBuzz {
  query: string;
  videoTotal: number; // 검색 결과 영상 수(추정)
  agg: ToneAgg; // 제목·설명 긍정/부정
  topVideos: { title: string; channel: string; date: string; videoId?: string; tone: 1 | 0 | -1 }[];
}

const cache = new Map<string, { at: number; data: YoutubeBuzz | null }>();
const TTL = 1000 * 60 * 60 * 12;

export async function youtubeBuzz(query: string): Promise<YoutubeBuzz | null> {
  const q = query.trim();
  if (!KEY || !q) return null;
  const hit = cache.get(q);
  if (hit && Date.now() - hit.at < TTL) return hit.data;

  const url =
    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=25` +
    `&regionCode=KR&relevanceLanguage=ko&order=relevance&q=${encodeURIComponent(q + " 맛집 동네")}&key=${KEY}`;
  const j = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(6000) })
    .then((r) => r.json())
    .catch(() => null);

  if (!j?.items) {
    cache.set(q, { at: Date.now(), data: null });
    return null;
  }

  const items = (j.items as { id?: { videoId?: string }; snippet?: { title?: string; description?: string; channelTitle?: string; publishedAt?: string } }[]).map((it) => ({
    title: cleanText(it.snippet?.title ?? ""),
    text: cleanText(it.snippet?.title ?? "") + " " + cleanText(it.snippet?.description ?? ""),
    channel: it.snippet?.channelTitle ?? "",
    date: (it.snippet?.publishedAt ?? "").slice(0, 10),
    videoId: it.id?.videoId,
  }));
  const { agg, tones } = aggregateTones(items.map((i) => i.text));
  const topVideos = items.slice(0, 6).map((i, k) => ({ title: i.title, channel: i.channel, date: i.date, videoId: i.videoId, tone: tones[k] }));

  const data: YoutubeBuzz = {
    query: q,
    videoTotal: Number(j.pageInfo?.totalResults ?? items.length),
    agg,
    topVideos,
  };
  cache.set(q, { at: Date.now(), data });
  return data;
}
