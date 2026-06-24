import { NextResponse } from "next/server";
import { loadDistricts } from "@/lib/data";

// 행정동 경계 GeoJSON (지도 클라이언트 기본 로드). 배포별 정적 데이터 → CDN 장기 캐시(2.8MB).
const CACHE = "public, max-age=600, s-maxage=86400, stale-while-revalidate=604800";

export function GET() {
  return NextResponse.json(loadDistricts(), { headers: { "cache-control": CACHE } });
}
