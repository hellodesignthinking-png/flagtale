import { NextResponse } from "next/server";
import { getTrendingLive } from "@/lib/trendingLive";

// 네이버 호출 → 서울 리전(해외 리전선 한국 API 간헐 차단)
export const preferredRegion = "icn1";
export const revalidate = 21600;
export const maxDuration = 30;

export async function GET(req: Request) {
  // 임시 진단: ?debug=1 → 키 존재·네이버 직접호출 결과(비밀 미노출)
  if (new URL(req.url).searchParams.get("debug") === "1") {
    const { naverInterest } = await import("@/lib/connectors/naver");
    let sample: unknown = null;
    let err: string | null = null;
    try {
      sample = await naverInterest("성수동");
    } catch (e) {
      err = String(e);
    }
    const s = sample as { newsTotal?: number; searchTrend?: unknown[] } | null;
    return NextResponse.json({
      hasId: !!process.env.NAVER_CLIENT_ID,
      hasSecret: !!process.env.NAVER_CLIENT_SECRET,
      idLen: (process.env.NAVER_CLIENT_ID || "").length,
      sampleNull: s === null,
      sampleNews: s?.newsTotal ?? null,
      sampleTrendPts: s?.searchTrend?.length ?? null,
      err,
    });
  }
  try {
    const live = await getTrendingLive();
    return NextResponse.json(live, { headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400" } });
  } catch {
    return NextResponse.json({}, { status: 200 });
  }
}
