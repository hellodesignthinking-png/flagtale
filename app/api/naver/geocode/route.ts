// NCP 지오코딩 프록시 — 주소 → 좌표(+도로명/지번). 콘텐츠 등록·정밀화용. 시크릿 서버 전용.
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const query = new URL(req.url).searchParams.get("query");
  const id = process.env.NAVER_NCP_KEY_ID, secret = process.env.NAVER_NCP_KEY_SECRET;
  if (!query) return Response.json({ error: "query required" }, { status: 400 });
  if (!id || !secret) return Response.json({ disabled: true, addresses: [] });
  try {
    const r = await fetch(`https://maps.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(query)}`, {
      headers: { "X-NCP-APIGW-API-KEY-ID": id, "X-NCP-APIGW-API-KEY": secret },
      cache: "no-store",
    });
    if (!r.ok) return Response.json({ disabled: true, addresses: [], status: r.status });
    const d = await r.json();
    const addresses = (d.addresses || []).map((a: Record<string, string>) => ({
      road: a.roadAddress, jibun: a.jibunAddress, lat: Number(a.y), lng: Number(a.x),
    }));
    return Response.json({ addresses }, { headers: { "cache-control": "public, max-age=86400, s-maxage=604800" } });
  } catch {
    return Response.json({ disabled: true, addresses: [] });
  }
}
