import { NextRequest, NextResponse } from "next/server";
import { reverseGeocode } from "@/lib/geocode";

// VWorld 역지오코딩은 한국 리전에서만 안정 → 서울(icn1) 고정
export const preferredRegion = "icn1";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 좌표 → 실제 지번(필지). 지도에서 지번 단위 세부 클릭 시 호출.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lng = Number(searchParams.get("lng"));
  const lat = Number(searchParams.get("lat"));
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
    return NextResponse.json({ error: "bad_point" }, { status: 400 });
  }
  const hit = await reverseGeocode(lng, lat);
  if (!hit) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(hit);
}
