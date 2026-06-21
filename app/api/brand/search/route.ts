import { NextRequest, NextResponse } from "next/server";
import { searchBrands } from "@/lib/brand";
import { pointToDistrict } from "@/lib/geocode";

// 한국 정부 API는 아니지만 네이버 호출 — 안정성 위해 서울 리전 고정(다른 라우트와 일관)
export const preferredRegion = "icn1";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/brand/search?q=성수동 어니언 → 매장 후보(로컬 우선) + 각 매장의 소속 행정동
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (!q) return NextResponse.json({ error: "empty_query" }, { status: 400 });
  const cands = await searchBrands(q).catch(() => null);
  if (!cands || !cands.length) {
    return NextResponse.json({ error: "not_found", message: "네이버에서 매장을 찾지 못했습니다. 더 구체적으로(지역명+상호) 입력해 보세요." }, { status: 404 });
  }
  // 각 후보의 소속 행정동(좌표→PIP) 부착 — 진단 가능 여부 표시용
  const withDong = cands.map((c) => {
    const props = pointToDistrict(c.lng, c.lat);
    return { ...c, admCd2: props?.admCd2 ?? null, dongName: props?.name ?? null, sigungu: props?.sigungu ?? null };
  });
  return NextResponse.json({ candidates: withDong });
}
