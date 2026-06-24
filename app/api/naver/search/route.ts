// 네이버 지역검색 다중 결과 (좌표 포함) — 플래그테일 미등록 매장을 사용자가 스팟 등록할 때 사용.
import type { NextRequest } from "next/server";

export const runtime = "nodejs";
const strip = (s: string) => (s || "").replace(/<[^>]+>/g, "").trim();

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get("q");
  const id = process.env.NAVER_SEARCH_CLIENT_ID || process.env.NAVER_CLIENT_ID;
  const secret = process.env.NAVER_SEARCH_CLIENT_SECRET || process.env.NAVER_CLIENT_SECRET;
  if (!q || q.trim().length < 2) return Response.json({ items: [] });
  if (!id || !secret) return Response.json({ disabled: true, items: [] });
  try {
    const r = await fetch(`https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(q)}&display=5&sort=comment`, {
      headers: { "X-Naver-Client-Id": id, "X-Naver-Client-Secret": secret },
      cache: "no-store",
    });
    if (!r.ok) return Response.json({ disabled: true, items: [] });
    const d = await r.json();
    const items = (d.items || [])
      .map((it: Record<string, string>) => ({
        name: strip(it.title), category: it.category, telephone: it.telephone,
        address: it.roadAddress || it.address, link: it.link,
        lng: Number(it.mapx) / 1e7, lat: Number(it.mapy) / 1e7,
      }))
      .filter((x: { lat: number; lng: number }) => x.lat > 33 && x.lat < 39 && x.lng > 124 && x.lng < 132);
    return Response.json({ items }, { headers: { "cache-control": "public, max-age=600, s-maxage=3600" } });
  } catch {
    return Response.json({ disabled: true, items: [] });
  }
}
