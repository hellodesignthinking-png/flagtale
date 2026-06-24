// 네이버 DataLab 검색어트렌드 — 지역 관심도 월별 추이(실데이터). "시세 추이" 스타일 차트용.
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get("q");
  const id = process.env.NAVER_CLIENT_ID, secret = process.env.NAVER_CLIENT_SECRET;
  if (!q) return Response.json({ error: "q required" }, { status: 400 });
  if (!id || !secret) return Response.json({ disabled: true, series: [] });
  const now = new Date();
  const endDate = now.toISOString().slice(0, 10);
  const start = new Date(now); start.setMonth(start.getMonth() - 23); start.setDate(1);
  const startDate = start.toISOString().slice(0, 10);
  try {
    const r = await fetch("https://openapi.naver.com/v1/datalab/search", {
      method: "POST",
      headers: { "X-Naver-Client-Id": id, "X-Naver-Client-Secret": secret, "Content-Type": "application/json" },
      body: JSON.stringify({ startDate, endDate, timeUnit: "month", keywordGroups: [{ groupName: q, keywords: [q] }] }),
      cache: "no-store",
    });
    if (!r.ok) return Response.json({ disabled: true, series: [], status: r.status });
    const d = await r.json();
    const series = (d.results?.[0]?.data || []).map((p: { period: string; ratio: number }) => ({ period: p.period.slice(0, 7), ratio: Math.round(p.ratio) }));
    return Response.json({ series }, { headers: { "cache-control": "public, max-age=3600, s-maxage=86400" } });
  } catch {
    return Response.json({ disabled: true, series: [] });
  }
}
