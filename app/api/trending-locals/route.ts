import { NextResponse } from "next/server";
import { getTrendingLive } from "@/lib/trendingLive";

// 네이버 호출 → 서울 리전(해외 리전선 한국 API 간헐 차단)
export const preferredRegion = "icn1";
export const revalidate = 21600;
export const maxDuration = 30;

export async function GET() {
  try {
    const live = await getTrendingLive();
    return NextResponse.json(live, { headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400" } });
  } catch {
    return NextResponse.json({}, { status: 200 });
  }
}
