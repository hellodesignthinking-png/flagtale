import { NextResponse } from "next/server";
import { loadScores } from "@/lib/data";

// 전체 점수 시계열 (지도 시간 슬라이더 애니메이션용 일괄 로드)
// 12.7MB 정적 페이로드 → CDN 장기 캐시 필수(무캐시 시 매 요청 대용량 전송).
export function GET() {
  return NextResponse.json(loadScores(), {
    headers: { "cache-control": "public, max-age=600, s-maxage=86400, stale-while-revalidate=604800" },
  });
}
