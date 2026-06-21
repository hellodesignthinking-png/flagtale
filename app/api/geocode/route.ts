import { NextRequest, NextResponse } from "next/server";
import { geocodeToDistrict } from "@/lib/geocode";

// VWorld 등 한국 정부 API는 한국 리전에서만 안정 → 서울(icn1) 고정 (iad1이면 지오코딩 실패)
export const preferredRegion = "icn1";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/geocode?q=강남역  → 장소/역/주소를 좌표+행정동으로 해석(맵 검색용).
//   VWorld(주소·지번) → 네이버 지역검색(역·랜드마크·POI) 순으로 시도.
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (!q) return NextResponse.json({ error: "empty_query" }, { status: 400 });
  const hit = await geocodeToDistrict(q).catch(() => null);
  if (!hit) {
    return NextResponse.json({ error: "not_found", message: "장소를 좌표로 해석하지 못했습니다." }, { status: 404 });
  }
  return NextResponse.json({
    admCd2: hit.props.admCd2,
    name: hit.props.name,
    sido: hit.props.sido,
    sigungu: hit.props.sigungu,
    lng: hit.point.lng,
    lat: hit.point.lat,
    matched: hit.point.matched,
    kind: hit.point.kind,
  });
}
