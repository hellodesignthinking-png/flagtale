import { NextResponse } from "next/server";
import { loadDistricts } from "@/lib/data";

// 행정동 경계 GeoJSON (지도 클라이언트 기본 로드)
export function GET() {
  return NextResponse.json(loadDistricts());
}
