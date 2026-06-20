// 소셜 네트워크 신호 — 네이버 블로그·카페 '등록수'(게시물 총량) + 긍정/부정 분류.
//   · 블로그 글 수 = 회자·관심의 누적 등록량
//   · 카페 글 수 = 커뮤니티 등록량
//   · 각 표본의 제목+본문 톤 분류 → 긍정/부정 비율
// 전국 일괄은 일일한도 초과 → place/diagnose 조회 시 온디맨드 + 6h 캐시. 서버 전용.
import "server-only";
import { aggregateTones, cleanText, type ToneAgg } from "@/lib/sentiment";
import { naverJson } from "@/lib/connectors/naverFetch";

const ID = process.env.NAVER_CLIENT_ID;
const SEC = process.env.NAVER_CLIENT_SECRET;
const H = { "X-Naver-Client-Id": ID ?? "", "X-Naver-Client-Secret": SEC ?? "" };

export interface SocialChannel {
  total: number; // 등록수(게시물 총량)
  agg: ToneAgg; // 표본 긍정/부정
}
export interface SocialBuzz {
  query: string;
  blog: SocialChannel; // 네이버 블로그
  cafe: SocialChannel; // 네이버 카페
  totalPosts: number; // 블로그+카페 등록수 합
  combined: ToneAgg; // 통합 긍정/부정
  recent: { title: string; channel: "blog" | "cafe"; date: string; link: string; tone: 1 | 0 | -1 }[];
}

const cache = new Map<string, { at: number; data: SocialBuzz | null }>();
const TTL = 1000 * 60 * 60 * 6;

async function searchNaver(kind: "blog" | "cafearticle", query: string) {
  // 공용 스로틀 경유(동시호출 제한 + 429 재시도) → 진단 병렬 부하에서도 안정
  return naverJson(`https://openapi.naver.com/v1/search/${kind}.json?query=${encodeURIComponent(query)}&display=30&sort=date`, H) as Promise<{
    total?: number;
    items?: { title: string; description?: string; postdate?: string; link: string }[];
  } | null>;
}

export async function socialBuzz(query: string): Promise<SocialBuzz | null> {
  const q = query.trim();
  if (!ID || !SEC || !q) return null;
  const hit = cache.get(q);
  if (hit && Date.now() - hit.at < TTL) return hit.data;

  const [blogJson, cafeJson] = await Promise.all([searchNaver("blog", q), searchNaver("cafearticle", q)]);
  if (blogJson?.total == null && cafeJson?.total == null) {
    cache.set(q, { at: Date.now(), data: null });
    return null;
  }

  const toItems = (j: { items?: { title: string; description?: string; postdate?: string; link: string }[] } | null, channel: "blog" | "cafe") =>
    ((j?.items ?? []) as { title: string; description?: string; postdate?: string; link: string }[]).map((it) => ({
      title: cleanText(it.title),
      text: cleanText(it.title) + " " + cleanText(it.description ?? ""),
      channel,
      date: it.postdate ? `${it.postdate.slice(0, 4)}-${it.postdate.slice(4, 6)}-${it.postdate.slice(6, 8)}` : "",
      link: it.link,
    }));

  const blogItems = toItems(blogJson, "blog");
  const cafeItems = toItems(cafeJson, "cafe");
  const blogTones = aggregateTones(blogItems.map((i) => i.text));
  const cafeTones = aggregateTones(cafeItems.map((i) => i.text));
  const allItems = [...blogItems, ...cafeItems];
  const combined = aggregateTones(allItems.map((i) => i.text));

  // 톤 태깅 + 최근 표본(긍/부 섞어 대표)
  const tagged = allItems.map((i, k) => ({
    title: i.title,
    channel: i.channel,
    date: i.date,
    link: i.link,
    tone: (k < blogItems.length ? blogTones.tones[k] : cafeTones.tones[k - blogItems.length]) as 1 | 0 | -1,
  }));
  // 긍정·부정 우선 노출(중립 뒤로), 최신순 유지
  const recent = [...tagged].sort((a, b) => Math.abs(b.tone) - Math.abs(a.tone)).slice(0, 8);

  const data: SocialBuzz = {
    query: q,
    blog: { total: Number(blogJson?.total ?? 0), agg: blogTones.agg },
    cafe: { total: Number(cafeJson?.total ?? 0), agg: cafeTones.agg },
    totalPosts: Number(blogJson?.total ?? 0) + Number(cafeJson?.total ?? 0),
    combined: combined.agg,
    recent,
  };
  cache.set(q, { at: Date.now(), data });
  return data;
}
