// 지역 종합 신호 — '동네 이름'만이 아니라, 그 지역에 등록된 매장·공간들의
// 뉴스·기사·블로그를 '지역 한정'으로 수집·집계. 동/지역 진단의 핵심 방법론.
//   · 입력: anchorStores 등으로 모은 지역 내 점포·공간 목록
//   · 각 공간을 "{공간명} {동}"으로 질의(타지역 동명 점포 혼입 방지) → 블로그(소셜)·뉴스(기사) 수 + 톤
//   · 집계: 공간별 버즈/기사/톤 + 통합 긍부정 + 대표 기사·게시물
// 브랜드 진단(단일 매장)은 storebuzz 사용. 이건 동/지역 전용. 서버 전용.
import "server-only";
import { naverJson } from "@/lib/connectors/naverFetch";
import { aggregateTones, cleanText, type ToneAgg } from "@/lib/sentiment";

const ID = process.env.NAVER_CLIENT_ID;
const SEC = process.env.NAVER_CLIENT_SECRET;
const H = { "X-Naver-Client-Id": ID ?? "", "X-Naver-Client-Secret": SEC ?? "" };

export interface RegionPlaceSig {
  name: string;
  category: string;
  buzz: number; // 지역 한정 블로그 글수(소셜 회자)
  news: number; // 지역 한정 기사수
  tone: 1 | 0 | -1; // 대표 톤
}
export interface RegionBuzz {
  scope: string; // 집계 범위 설명
  placeCount: number;
  totalBuzz: number; // 공간 블로그 합
  totalNews: number; // 공간 기사 합
  agg: ToneAgg; // 공간 표본 통합 긍/부정
  places: RegionPlaceSig[]; // 공간별(버즈순)
  articles: { title: string; link: string; place: string; tone: 1 | 0 | -1 }[]; // 대표 기사
  posts: { title: string; link: string; place: string; tone: 1 | 0 | -1 }[]; // 대표 소셜
}

const cache = new Map<string, { at: number; data: RegionBuzz | null }>();
const TTL = 1000 * 60 * 60 * 6;

type Item = { title?: string; description?: string; link?: string; originallink?: string };
const search = (kind: "blog" | "news", q: string) =>
  naverJson(`https://openapi.naver.com/v1/search/${kind}.json?query=${encodeURIComponent(q)}&display=3&sort=sim`, H) as Promise<{
    total?: number;
    items?: Item[];
  } | null>;

// places: 지역 내 공간 목록(anchorStores 결과 등). region: 지역 한정어(동명, 예: '성산동').
export async function regionPlacesBuzz(
  places: { name: string; category: string }[],
  region: string,
  limit = 6
): Promise<RegionBuzz | null> {
  const reg = region.trim();
  if (!ID || !SEC || !places.length || !reg) return null;
  const top = places.slice(0, limit);
  const ck = `${reg}|${top.map((p) => p.name).join(",")}`;
  const hit = cache.get(ck);
  if (hit && Date.now() - hit.at < TTL) return hit.data;

  const toItems = (j: { items?: Item[] } | null) =>
    (j?.items ?? []).map((it) => ({
      title: cleanText(it.title ?? ""),
      link: it.originallink || it.link || "",
      text: cleanText(it.title ?? "") + " " + cleanText(it.description ?? ""),
    }));

  const results = await Promise.all(
    top.map(async (p) => {
      const q = `${p.name} ${reg}`; // 지역 한정 — "{공간명} {동}"
      const [bj, nj] = await Promise.all([search("blog", q), search("news", q)]);
      const bItems = toItems(bj);
      const nItems = toItems(nj);
      const { tones } = aggregateTones([...bItems, ...nItems].map((i) => i.text));
      const sent: number = tones.reduce((s: number, t: number) => s + t, 0);
      return {
        name: p.name,
        category: p.category,
        buzz: Number(bj?.total ?? 0),
        news: Number(nj?.total ?? 0),
        tone: (sent > 0 ? 1 : sent < 0 ? -1 : 0) as 1 | 0 | -1,
        bItems,
        nItems,
        tones,
      };
    })
  );

  // 통합 표본·대표 기사/게시물
  const allTexts: string[] = [];
  const articles: RegionBuzz["articles"] = [];
  const posts: RegionBuzz["posts"] = [];
  for (const r of results) {
    r.bItems.forEach((it, i) => {
      allTexts.push(it.text);
      if (it.title) posts.push({ title: it.title, link: it.link, place: r.name, tone: r.tones[i] });
    });
    r.nItems.forEach((it, i) => {
      allTexts.push(it.text);
      if (it.title) articles.push({ title: it.title, link: it.link, place: r.name, tone: r.tones[r.bItems.length + i] });
    });
  }
  if (!allTexts.length) {
    cache.set(ck, { at: Date.now(), data: null });
    return null;
  }
  const agg = aggregateTones(allTexts).agg;
  const sigPlaces = results
    .map((r) => ({ name: r.name, category: r.category, buzz: r.buzz, news: r.news, tone: r.tone }))
    .sort((a, b) => b.buzz - a.buzz);

  const data: RegionBuzz = {
    scope: `${reg} 일대 등록 매장·공간 ${results.length}곳 종합`,
    placeCount: results.length,
    totalBuzz: sigPlaces.reduce((s, p) => s + p.buzz, 0),
    totalNews: sigPlaces.reduce((s, p) => s + p.news, 0),
    agg,
    places: sigPlaces,
    articles: articles.sort((a, b) => Math.abs(b.tone) - Math.abs(a.tone)).slice(0, 6),
    posts: posts.sort((a, b) => Math.abs(b.tone) - Math.abs(a.tone)).slice(0, 6),
  };
  cache.set(ck, { at: Date.now(), data });
  return data;
}
