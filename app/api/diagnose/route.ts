import { NextRequest, NextResponse } from "next/server";
import { geocodeToPlace, getPlace, getPeerAvg, getRegionComparison, populationMeta } from "@/lib/data";
import { geocodeToDistrict } from "@/lib/geocode";
import { naverInterest } from "@/lib/connectors/naver";
import { anchorStores } from "@/lib/connectors/anchor";
import { sanggaStats } from "@/lib/connectors/sangga";
import { rebForPlace } from "@/lib/connectors/reb";
import { seoulSales } from "@/lib/connectors/seoulsales";
import { livingPop } from "@/lib/connectors/livingpop";
import { cultureInfo } from "@/lib/connectors/culture";
import { localVenues } from "@/lib/connectors/venues";
import { socialBuzz } from "@/lib/connectors/social";
import { youtubeBuzz } from "@/lib/connectors/youtube";
import { computeCorrected, searchName } from "@/lib/corrected";
import { attributeDrivers } from "@/lib/driver";
import { computeSustainability } from "@/lib/sustainability";
import { prescribeTenants } from "@/lib/tenant";
import { diffusionFor } from "@/lib/diffusion";

// 스펙 §13: POST /api/diagnose {address|pnu} → (auth+credit) {trajectory, risks, strategy, reportId}
// VWorld 실지오코딩(주소→좌표→행정동) → 동 매핑 → 진단. demoPaid 플래그로 권한(페이월) 시뮬레이션.
export async function POST(req: NextRequest) {
  let body: { admCd?: string; address?: string; pnu?: string; demoPaid?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    /* empty */
  }
  // admCd가 오면 그 행정동을 직접 사용 (동명 지오코딩의 모호성 방지: 당산1동→사천 오매핑 등)
  const query = body.admCd || body.address || body.pnu || "";
  let geo: Awaited<ReturnType<typeof geocodeToDistrict>> = null;
  let place = body.admCd ? getPlace(body.admCd)?.props ?? null : null;
  if (!place) {
    // 1) VWorld 실지오코딩(좌표→행정동), 2) 실패 시 동명 매칭 폴백
    geo = await geocodeToDistrict(body.address || body.pnu || "");
    place = geo?.props ?? geocodeToPlace(body.address || body.pnu || "");
  }
  if (!place) {
    return NextResponse.json(
      { error: "geocode_failed", message: "주소/지번을 동에 매핑하지 못했습니다." },
      { status: 422 }
    );
  }
  const bundle = getPlace(place.admCd2)!;
  const entitled = !!body.demoPaid;
  const peer = getPeerAvg(bundle.props.typology);

  // 좌표 — 골목상권·앵커 반경 검색 기준점(실지오코딩 좌표 우선, 없으면 동 중심)
  const sLng = geo?.point.lng ?? bundle.props.centroidLng;
  const sLat = geo?.point.lat ?? bundle.props.centroidLat;
  const sname = searchName(bundle.props.name);

  // 외부 커넥터 병렬 호출 — 순차 await 시 도달 불가한 서울 API 타임아웃(각 7~8s)이
  // 누적돼 콜드 17s+. 병렬이면 가장 느린 커넥터(~8s)로 수렴. 각자 graceful null.
  const [naver, sangga, anchor, reb, sales, living, culture, venues, social, youtube] = await Promise.all([
    naverInterest(sname).catch(() => null), // D4·모멘텀(검색·기사)
    sanggaStats(sLng, sLat).catch(() => null), // 소진공 점포 업종·다양성
    anchorStores(sname, { lng: sLng, lat: sLat }, 1000).catch(() => null), // 반경 1km 앵커 버즈
    rebForPlace(bundle.props).catch(() => null), // 부동산원 임대지수·공실
    seoulSales(bundle.props.name, bundle.props.sido).catch(() => null), // 우리마을가게 매출(서울)
    livingPop(bundle.props.admCd2, bundle.props.sido).catch(() => null), // 생활인구 시간대(서울)
    cultureInfo(bundle.props.sido, bundle.props.sigungu).catch(() => null), // 문화 공연·전시·축제
    localVenues(sname, { lng: sLng, lat: sLat }, 1200).catch(() => null), // 갤러리·도서관·책방·공연장·체육관·공원
    socialBuzz(sname).catch(() => null), // 소셜 등록수(블로그·카페) + 긍부정
    youtubeBuzz(sname).catch(() => null), // 유튜브 영상 + 긍부정 (YOUTUBE_API_KEY 필요)
  ]);

  // 실측 보정(네이버 D4·모멘텀)·동인 분해는 위 결과에 의존 → 병렬 후 계산
  const corrected = computeCorrected(bundle.latest, naver, peer);
  const drivers = attributeDrivers({ latest: bundle.latest, corrected, sangga, reb });
  // 매력 × 지속가능성 2축 — 상생지수·4분면·대형화·수익성 가위 (모듈 B/C)
  const sustainability = computeSustainability({ latest: bundle.latest, corrected, sangga, reb, social });
  const tenantRx = prescribeTenants(sangga); // 업종 처방(부족 업종 추천) — 모듈 D
  const diffusion = diffusionFor(place.admCd2); // 확산 경로(다음 확장 후보 동) — 모듈 A

  return NextResponse.json({
    query,
    geocoded: geo ? { matched: geo.point.matched, lng: geo.point.lng, lat: geo.point.lat, source: "VWorld" } : null,
    place: bundle.props,
    latest: bundle.latest,
    series: bundle.series,
    diagnosis: bundle.diagnosis,
    signals: bundle.signals,
    demographics: bundle.demographics, // 2016~2026 인구(실데이터)
    procurement: bundle.procurement, // 2016~2026 공공예산
    peer, // 유형 평균 (레이더 비교군)
    comparison: getRegionComparison(place.admCd2), // 도시·전국 대비
    popReal: !!populationMeta(), // 인구 실데이터 여부
    corrected, // 실측 보정 점수(네이버 D4·모멘텀, KOSIS D1, 비교군 D2·D3) — null이면 네이버 미수신
    naver: naver
      ? { searchTrend: naver.searchTrend, newsTotal: naver.newsTotal, sentiment: naver.sentiment, pos: naver.pos, neg: naver.neg, neut: naver.neut, query: naver.query }
      : null,
    sangga, // 골목상권 실측(소진공 점포 업종·다양성) — null이면 승인 반영 대기/없음
    reb, // 부동산원 임대가격지수·공실률(상권 단위) — null이면 매칭/미수신
    sales, // 서울 우리마을가게 추정매출(rent-to-revenue 분모) — 서울만
    living, // 서울 생활인구 시간대 패턴(주간/야간 활력) — 서울만
    culture, // 지역 문화 활력(공연·전시·축제) — 반영 대기 시 null
    anchor, // 앵커 점포(블로그 버즈 상위) — 지역 활성화 견인 점포
    venues, // 지역 문화 인프라(갤러리·도서관·책방·공연장·체육관·공원, 공공/민간) — 강점 자산
    social, // 소셜 등록수(블로그·카페) + 긍정/부정
    youtube, // 유튜브 영상 + 긍정/부정 (키 없으면 null)
    drivers, // 활성화 동인 분해(로컬크리에이터/공공지원/자본)
    sustainability, // 매력×지속가능성 2축(상생지수·4분면·대형화·수익성 가위)
    tenantRx, // 업종 처방(부족 업종 추천 Top3) — 모듈 D
    diffusion, // 확산 경로(인접 핫동 + 다음 확장 후보 동) — 모듈 A
    periods: bundle.series.map((s) => s.period),
    entitled,
    reportId: `parcel_${place.admCd2}_${bundle.latest.period}`,
    provisional: true,
  });
}
