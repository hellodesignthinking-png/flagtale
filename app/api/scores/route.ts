import { NextResponse } from "next/server";
import { loadScores } from "@/lib/data";

// 전체 점수 시계열 (지도 시간 슬라이더 애니메이션용 일괄 로드)
export function GET() {
  return NextResponse.json(loadScores());
}
