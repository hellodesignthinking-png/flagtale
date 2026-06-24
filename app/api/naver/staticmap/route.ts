// NCP 정적지도 프록시 — 시크릿은 서버에서만 헤더로. 미구독/오류 시 502(브라우저 img는 onError로 숨김).
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const lat = sp.get("lat"), lng = sp.get("lng");
  const w = sp.get("w") || "344", h = sp.get("h") || "168", level = sp.get("level") || "16";
  const id = process.env.NAVER_NCP_KEY_ID, secret = process.env.NAVER_NCP_KEY_SECRET;
  if (!lat || !lng) return new Response(null, { status: 400 });
  if (!id || !secret) return new Response(null, { status: 404 });
  const url = `https://maps.apigw.ntruss.com/map-static/v2/raster?w=${w}&h=${h}&center=${lng},${lat}&level=${level}&scale=2&markers=${encodeURIComponent(`type:d|size:mid|pos:${lng} ${lat}`)}`;
  try {
    const r = await fetch(url, { headers: { "X-NCP-APIGW-API-KEY-ID": id, "X-NCP-APIGW-API-KEY": secret }, cache: "no-store" });
    const ct = r.headers.get("content-type") || "";
    if (!r.ok || !ct.startsWith("image")) return new Response(null, { status: 502 });
    return new Response(await r.arrayBuffer(), { status: 200, headers: { "content-type": ct, "cache-control": "public, max-age=86400, s-maxage=604800" } });
  } catch {
    return new Response(null, { status: 502 });
  }
}
