// 네이버 개발자 지역검색(Local Search) 프록시 — 매장 카테고리·전화·주소·플레이스 링크.
// 키(NAVER_SEARCH_CLIENT_ID/SECRET, developers.naver.com)가 없으면 disabled로 응답(UI는 폴백).
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

const strip = (s: string) => (s || "").replace(/<[^>]+>/g, "").trim();

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get("q");
  const id = process.env.NAVER_SEARCH_CLIENT_ID || process.env.NAVER_CLIENT_ID;
  const secret = process.env.NAVER_SEARCH_CLIENT_SECRET || process.env.NAVER_CLIENT_SECRET;
  if (!q) return Response.json({ error: "q required" }, { status: 400 });
  if (!id || !secret) return Response.json({ disabled: true, items: [] });
  try {
    const r = await fetch(`https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(q)}&display=1&sort=random`, {
      headers: { "X-Naver-Client-Id": id, "X-Naver-Client-Secret": secret },
      cache: "no-store",
    });
    if (!r.ok) return Response.json({ disabled: true, items: [], status: r.status });
    const d = await r.json();
    const items = (d.items || []).map((it: Record<string, string>) => ({
      title: strip(it.title), category: it.category, telephone: it.telephone,
      address: it.address, roadAddress: it.roadAddress, link: it.link,
      mapx: it.mapx, mapy: it.mapy,
    }));
    return Response.json({ items }, { headers: { "cache-control": "public, max-age=3600, s-maxage=86400" } });
  } catch {
    return Response.json({ disabled: true, items: [] });
  }
}
