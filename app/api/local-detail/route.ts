import { NextResponse } from "next/server";
import { naverNews, naverTrendBatch } from "@/lib/connectors/naver";
import { socialBuzz } from "@/lib/connectors/social";
import { youtubeBuzz } from "@/lib/connectors/youtube";

// 동네 클릭 시 온디맨드 멀티플랫폼 상세. 네이버 뉴스+블로그+카페+검색트렌드(실연동) + 유튜브(키 발급 시).
export const preferredRegion = "icn1";
export const maxDuration = 30;

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ error: "q required" }, { status: 400 });
  const [news, social, youtube, trend] = await Promise.all([
    naverNews(q).catch(() => null),
    socialBuzz(q).catch(() => null),
    youtubeBuzz(q).catch(() => null),
    naverTrendBatch([q]).then((m) => m[q] ?? null).catch(() => null),
  ]);
  return NextResponse.json(
    { news, social, youtube, trend, youtubeEnabled: !!process.env.YOUTUBE_API_KEY },
    { headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400" } }
  );
}
