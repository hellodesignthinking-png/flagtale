import { NextRequest, NextResponse } from "next/server";
import { getPlace, geocodeToPlace, cultureFor, commerceFor, buildingFor, potentialFor, nabisForSido, specialStreetFor } from "@/lib/data";
import { geocodeToDistrict } from "@/lib/geocode";
import { programsFor } from "@/lib/programs";
import { cultureImpact } from "@/lib/cultureImpact";
import { localVenues } from "@/lib/connectors/venues";
import { searchName } from "@/lib/corrected";

export const dynamic = "force-dynamic";

// 문화영향평가(문화기본법 §5④) — 행정동 실데이터로 6개 지표 근사 + 대안.
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const admCd = sp.get("admCd");
  const address = (sp.get("address") || "").trim();

  let place = admCd ? getPlace(admCd)?.props ?? null : null;
  if (!place && address) {
    const geo = await geocodeToDistrict(address).catch(() => null);
    place = geo?.props ?? geocodeToPlace(address);
  }
  if (!place) {
    return NextResponse.json({ error: "geocode_failed", message: "주소·지번·동명을 행정동에 매핑하지 못했습니다." }, { status: 422 });
  }

  // 문화시설(갤러리·도서관·공연장·책방·공원) — 문화접근권·표현권·Cultural Vitality Presence
  const venues = await localVenues(searchName(place.name), { lng: place.centroidLng, lat: place.centroidLat }, 1500).catch(() => null);

  const ci = cultureImpact({
    culture: cultureFor(place.admCd2),
    commerce: commerceFor(place.admCd2),
    building: buildingFor(place.admCd2),
    programs: programsFor(place.admCd2),
    potential: potentialFor(place.admCd2),
    nabis: nabisForSido(place.sido), // 시도 공식 지수(발전·혁신·창조잠재력)
    specialStreet: specialStreetFor(place.admCd2), // 동 특화거리
    venues: venues ? { cultureScore: venues.cultureScore, total: venues.total, byKind: venues.byKind } : null,
    sido: place.sido,
  });

  return NextResponse.json({
    place: { admCd2: place.admCd2, name: place.name, sido: place.sido, sigungu: place.sigungu },
    cultureImpact: ci,
  });
}
