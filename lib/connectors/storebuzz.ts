// 매장(브랜드) 전용 버즈 — '같은 단어'를 무차별로 긁지 않도록 매장명+지역으로 스코프하고,
// 표본을 '실제 그 매장 관련 글'만 남기도록 관련도 필터링한다. (예: '미들타운'이 미국 지명 글을 끌어오는 오염 방지)
import "server-only";
import { aggregateTones, cleanText } from "@/lib/sentiment";
import { naverJson } from "@/lib/connectors/naverFetch";

const ID = process.env.NAVER_CLIENT_ID;
const SEC = process.env.NAVER_CLIENT_SECRET;
const H = { "X-Naver-Client-Id": ID ?? "", "X-Naver-Client-Secret": SEC ?? "" };

export interface StoreBuzz {
  query: string; // 실제 검색 질의(매장명+지역)
  blogTotal: number; // 스코프 질의 블로그 총건(추정)
  cafeTotal: number;
  sampleN: number; // 검토 표본 수
  relevant: number; // 관련(매장 일치) 표본 수
  relevanceRatio: number; // 0~100 — 표본 중 매장 관련 비율
  reliable: boolean; // 관련 표본이 충분한가(신뢰)
  positiveRatio: number | null;
  pos: number;
  neg: number;
  recent: { title: string; channel: "blog" | "cafe"; date: string; link: string; tone: 1 | 0 | -1 }[];
}

// 매장명 핵심(고유) 토큰 — 일반어(카페/식당…)는 어디 있든 제외하고 가장 긴 고유 토큰.
//   "카페 미들타운"·"미들타운 카페" → "미들타운"(앞/뒤 무관), "어니언 성수" → "어니언"
const GENERIC_TOK = /^(카페|커피|식당|음식점|맛집|디저트|베이커리|빵집|레스토랑|다이닝|펍|바|비스트로|호프|포차|점|본점|지점|직영점|\d+호점)$/;
function coreToken(name: string): string {
  const tokens = name.split(/\s+/).filter((t) => t && !GENERIC_TOK.test(t));
  if (!tokens.length) return name.split(/\s+/)[0] || name;
  return tokens.sort((a, b) => b.length - a.length)[0]; // 가장 긴 토큰 = 보통 고유명
}
// 동명에서 지역 핵심(망원1동→망원, 성수2가3동→성수)
export function areaCore(dongName: string): string {
  return dongName.replace(/\d+\s*(가|동|읍|면|리)/g, "").replace(/(동|읍|면|가|리)$/, "").trim();
}

const REVIEW_RE = /카페|맛집|디저트|메뉴|방문|다녀|주문|사장|영업|오픈|웨이팅|존맛|내돈내산|후기|예약|브런치|커피|빵|케이크|분위기|인테리어|핫플|줄서|店|매장/;

async function search(kind: "blog" | "cafearticle", q: string) {
  // sort=sim(정확도순) — 관련 높은 글이 상위. 매장 버즈는 최신보다 관련도가 중요.
  return naverJson(`https://openapi.naver.com/v1/search/${kind}.json?query=${encodeURIComponent(q)}&display=30&sort=sim`, H) as Promise<{
    total?: number;
    items?: { title: string; description?: string; postdate?: string; link: string }[];
  } | null>;
}

const cache = new Map<string, { at: number; data: StoreBuzz | null }>();
const TTL = 1000 * 60 * 60 * 6;

// name=매장명, area=지역 핵심(동명에서). 질의=매장명(+지역, 중복 아니면).
export async function storeBuzz(name: string, area: string): Promise<StoreBuzz | null> {
  const nm = name.trim();
  if (!ID || !SEC || !nm) return null;
  const core = coreToken(nm);
  const ac = (area ?? "").trim();
  const q = ac && !nm.includes(ac) ? `${nm} ${ac}` : nm; // 스코프: 매장명 + 지역
  const ck = q;
  const hit = cache.get(ck);
  if (hit && Date.now() - hit.at < TTL) return hit.data;

  const [blogJ, cafeJ] = await Promise.all([search("blog", q), search("cafearticle", q)]);
  if (blogJ?.total == null && cafeJ?.total == null) {
    cache.set(ck, { at: Date.now(), data: null });
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
  const items = [...toItems(blogJ, "blog"), ...toItems(cafeJ, "cafe")];

  // 관련도: 매장 풀네임 포함 OR (핵심토큰 + (지역 OR 리뷰성 단어)) — '같은 단어' 무관 글 배제
  const isRelevant = (text: string) => {
    if (nm.length >= 4 && text.includes(nm)) return true; // 풀네임 일치(강한 관련)
    if (!text.includes(core)) return false;
    if (ac && text.includes(ac)) return true; // 핵심 + 지역
    return REVIEW_RE.test(text); // 핵심 + 리뷰성 맥락
  };
  const rel = items.filter((i) => isRelevant(i.text));
  const sampleN = items.length;
  const relevanceRatio = sampleN ? Math.round((rel.length / sampleN) * 100) : 0;
  const tones = aggregateTones(rel.map((i) => i.text));
  const tagged = rel.map((i, k) => ({ title: i.title, channel: i.channel, date: i.date, link: i.link, tone: tones.tones[k] as 1 | 0 | -1 }));
  const recent = [...tagged].sort((a, b) => Math.abs(b.tone) - Math.abs(a.tone)).slice(0, 8);

  const data: StoreBuzz = {
    query: q,
    blogTotal: Number(blogJ?.total ?? 0),
    cafeTotal: Number(cafeJ?.total ?? 0),
    sampleN,
    relevant: rel.length,
    relevanceRatio,
    reliable: rel.length >= 3 && relevanceRatio >= 25,
    positiveRatio: rel.length ? tones.agg.positiveRatio : null,
    pos: tones.agg.pos,
    neg: tones.agg.neg,
    recent,
  };
  cache.set(ck, { at: Date.now(), data });
  return data;
}
