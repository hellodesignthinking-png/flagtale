import { NextRequest, NextResponse } from "next/server";
import { geocodeToPlace, getPlace, getPeerAvg, getRegionComparison, nationalSignalAverage, populationMeta, vacantFor, commerceFor, buildingFor, cultureFor, potentialFor } from "@/lib/data";
import { realComposite } from "@/lib/realScore";
import { programsFor } from "@/lib/programs";
import { devStrategy } from "@/lib/devStrategy";
import { geocodeToDistrict, pointToDistrict } from "@/lib/geocode";
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
import { regionPlacesBuzz } from "@/lib/connectors/regionBuzz";
import { computeCorrected, searchName } from "@/lib/corrected";
import { attributeDrivers } from "@/lib/driver";
import { computeSustainability } from "@/lib/sustainability";
import { prescribeTenants } from "@/lib/tenant";
import { diffusionFor } from "@/lib/diffusion";
import { buildBrandReport } from "@/lib/brandReport";
import { storeBuzz, areaCore } from "@/lib/connectors/storebuzz";
import { supplyFor, supplyBoost, authenticityGap } from "@/lib/supply";
import { narrativeForPlace } from "@/lib/narratives";
import { instagramFor, buzzBoost } from "@/lib/connectors/instagram";

// 한국 정부 API(VWorld 지오코딩·KOSIS 등)는 한국 IP에서만 안정. Vercel 기본 리전 iad1(미국)이면
// VWorld가 실패 → 좌표 매핑 불가 → 엉뚱한 동. 서울 리전(icn1)으로 고정해 정확한 행정동 매핑 보장.
export const preferredRegion = "icn1";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 스펙 §13: POST /api/diagnose {address|pnu} → (auth+credit) {trajectory, risks, strategy, reportId}
// VWorld 실지오코딩(주소→좌표→행정동) → 동 매핑 → 진단. demoPaid 플래그로 권한(페이월) 시뮬레이션.
export async function POST(req: NextRequest) {
  let body: { admCd?: string; address?: string; pnu?: string; demoPaid?: boolean; lng?: number; lat?: number; label?: string; category?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* empty */
  }
  // admCd가 오면 그 행정동을 직접 사용 (동명 지오코딩의 모호성 방지: 당산1동→사천 오매핑 등)
  const query = body.label || body.admCd || body.address || body.pnu || "";
  let geo: Awaited<ReturnType<typeof geocodeToDistrict>> = null;
  let place = body.admCd ? getPlace(body.admCd)?.props ?? null : null;
  // 브랜드 진단: 매장 좌표(lng,lat)가 오면 그 지점 중심으로 진단(좌표→행정동, 반경 데이터가 매장 중심으로).
  if (!place && Number.isFinite(body.lng) && Number.isFinite(body.lat)) {
    const props = pointToDistrict(body.lng as number, body.lat as number);
    if (props) {
      place = props;
      geo = { props, point: { lng: body.lng as number, lat: body.lat as number, matched: body.label ?? "", kind: "place" } };
    }
  }
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

  // 플래그테일 공급(등록 콘텐츠 밀도) + 진정성 갭(검색 수요 vs 등록 공급) — 위기·전략에 반영
  const nb = narrativeForPlace(place.admCd2);
  const sBoost = supplyBoost(place.admCd2);
  const bBoost = buzzBoost(nb ? instagramFor(nb.name)?.postsCount : null);
  const authGap = authenticityGap(sBoost, bBoost);
  const supply = supplyFor(place.admCd2);

  // 좌표 — 골목상권·앵커 반경 검색 기준점(실지오코딩 좌표 우선, 없으면 동 중심)
  const sLng = geo?.point.lng ?? bundle.props.centroidLng;
  const sLat = geo?.point.lat ?? bundle.props.centroidLat;
  const sname = searchName(bundle.props.name);
  // 소셜·유튜브 지역 한정 — 동명이지역(제주 성산일출봉·창원 성산구 등) 오염 방지.
  // 질의에 시군구를 붙이고(마포구 성산동), 결과는 시군구/시도 코어로 후필터.
  const sgCore = (bundle.props.sigungu || "").replace(/(특별자치시|특별자치도|광역시|특별시)$/, "").replace(/(시|군|구)$/, "").trim();
  const sdCore = (bundle.props.sido || "").replace(/(특별자치도|특별자치시|특별시|광역시|도)$/, "").trim();
  const regionQ = [bundle.props.sigungu, sname].filter(Boolean).join(" ").trim() || sname;
  const keepTerms = [sgCore, sdCore].filter((s) => s && s.length >= 2);

  // 외부 커넥터 병렬 호출 — 순차 await 시 도달 불가한 서울 API 타임아웃(각 7~8s)이
  // 누적돼 콜드 17s+. 병렬이면 가장 느린 커넥터(~8s)로 수렴. 각자 graceful null.
  const storeName = body.label ?? ""; // 브랜드 진단이면 매장명 — 매장 신호도 같은 병렬 배치로(타임아웃 방지)
  const storeArea = storeName ? areaCore(bundle.props.name) : ""; // 지역 핵심(망원1동→망원) — 매장 스코프용
  const storeQuery = storeName && storeArea && !storeName.includes(storeArea) ? `${storeName} ${storeArea}` : storeName;
  const [naver, sangga, anchor, reb, sales, living, culture, venues, social, youtube, storeBuzzData, storeInterest] = await Promise.all([
    naverInterest(sname).catch(() => null), // D4·모멘텀(검색·기사)
    sanggaStats(sLng, sLat).catch(() => null), // 소진공 점포 업종·다양성
    anchorStores(sname, { lng: sLng, lat: sLat }, 1000).catch(() => null), // 반경 1km 앵커 버즈
    rebForPlace(bundle.props).catch(() => null), // 부동산원 임대지수·공실
    seoulSales(bundle.props.name, bundle.props.sido).catch(() => null), // 우리마을가게 매출(서울)
    livingPop(bundle.props.admCd2, bundle.props.sido).catch(() => null), // 생활인구 시간대(서울)
    cultureInfo(bundle.props.sido, bundle.props.sigungu).catch(() => null), // 문화 공연·전시·축제
    localVenues(sname, { lng: sLng, lat: sLat }, 1200).catch(() => null), // 갤러리·도서관·책방·공연장·체육관·공원
    socialBuzz(regionQ, keepTerms).catch(() => null), // 소셜 등록수(블로그·카페) + 긍부정 — 지역 한정
    youtubeBuzz(regionQ, keepTerms).catch(() => null), // 유튜브 영상 + 긍부정 — 지역 한정 (YOUTUBE_API_KEY 필요)
    storeName ? storeBuzz(storeName, storeArea).catch(() => null) : Promise.resolve(null), // 매장 스코프 버즈(관련도 필터)
    storeName ? naverInterest(storeQuery).catch(() => null) : Promise.resolve(null), // 매장명+지역 검색 관심도
  ]);

  // 지역 종합 신호 — 동/지역 진단이면 그 지역에 등록된 공간들(앵커 점포)의 뉴스·소셜을 '지역 한정'으로 집계.
  // 동네 이름만이 아니라 그 안의 매장·공간 단위로 검토해야 제대로 된 지역 조사. (브랜드 진단은 단일 매장이므로 생략)
  const regionBuzz = !storeName && anchor && anchor.length
    ? await regionPlacesBuzz(anchor.map((a) => ({ name: a.name, category: a.category })), sname).catch(() => null)
    : null;

  // 실측 보정(네이버 D4·모멘텀)·동인 분해는 위 결과에 의존 → 병렬 후 계산
  const corrected = computeCorrected(bundle.latest, naver, peer);
  const drivers = attributeDrivers({ latest: bundle.latest, corrected, sangga, reb });
  // 매력 × 지속가능성 2축 — 상생지수·4분면·대형화·수익성 가위 (모듈 B/C)
  const sustainability = computeSustainability({ latest: bundle.latest, corrected, sangga, reb, social });
  const tenantRx = prescribeTenants(sangga); // 업종 처방(부족 업종 추천) — 모듈 D
  const diffusion = diffusionFor(place.admCd2); // 확산 경로(다음 확장 후보 동) — 모듈 A

  // 브랜드(매장) 진단 — 매장명(label)이 오면 그 매장 자체의 신호·경쟁력·성장·위기 분석
  const brand = body.label
    ? buildBrandReport({
        name: body.label,
        category: body.category ?? "",
        storeBuzz: storeBuzzData,
        storeSearchTrend: storeInterest?.searchTrend ?? null,
        anchor,
        sangga,
        reb,
        latest: bundle.latest,
        gentriStage: bundle.diagnosis?.gentriStage ?? bundle.latest.gentriStage,
      })
    : null;

  return NextResponse.json({
    query,
    geocoded: geo ? { matched: geo.point.matched, lng: geo.point.lng, lat: geo.point.lat, source: "VWorld" } : null,
    place: bundle.props,
    latest: bundle.latest,
    series: bundle.series,
    diagnosis: bundle.diagnosis,
    signals: bundle.signals,
    avgSignals: nationalSignalAverage(), // 전국 평균 신호(비교 기준선)
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
    regionBuzz, // 지역 등록 공간(매장)들의 뉴스·소셜 지역한정 집계 — 동/지역 진단 핵심

    drivers, // 활성화 동인 분해(로컬크리에이터/공공지원/자본)
    sustainability, // 매력×지속가능성 2축(상생지수·4분면·대형화·수익성 가위)
    tenantRx, // 업종 처방(부족 업종 추천 Top3) — 모듈 D
    diffusion, // 확산 경로(인접 핫동 + 다음 확장 후보 동) — 모듈 A
    brand, // 브랜드 진단(매장 신호·경쟁력·임대료·성장·위기) — label 있을 때만
    supply, // 플래그테일 등록 공급(매장·스테이·투어·축제·거점) 밀도
    supplyBoost: sBoost, // 공급 가산점(0~10)
    buzzBoost: bBoost, // 검색 수요(인스타 버즈) 가산점(0~6)
    authGap, // 진정성 갭(검색 수요 vs 등록 공급) — 과열/미발견/균형
    vacant: vacantFor(place.admCd2), // 빈집비율(시군구)·동 추정 빈집호수 — 소멸·공실 실신호(KOSIS)
    // ── 추가 실데이터(bulk 인제스트) — /place 와 동일 소스로 진단 리포트에 반영 ──
    commerceReal: commerceFor(place.admCd2), // 상권 실측(소진공 상가수·업종 다양성)
    building: buildingFor(place.admCd2), // 건축물(용도혼합·노후·밀도, KOSIS 인구주택총조사)
    cultureReal: cultureFor(place.admCd2), // 문화 활력(공연·전시·축제 수, 시군구)
    potential: potentialFor(place.admCd2), // 발전가능성(국토부 쇠퇴진단 3부문 등급)
    realScore: realComposite(place.admCd2, bundle.latest), // 실측 매력도(실데이터 합성)
    programs: programsFor(place.admCd2), // 정부 지역활성화 사업 지정(청년마을·문화도시)
    // 데이터 기반 결론·전략·대안 — 위 실데이터 값으로 규칙 처방 생성
    devStrategy: devStrategy({
      name: bundle.props.name,
      realScore: realComposite(place.admCd2, bundle.latest),
      potential: potentialFor(place.admCd2),
      vacant: vacantFor(place.admCd2),
      commerceReal: commerceFor(place.admCd2),
      building: buildingFor(place.admCd2),
      cultureReal: cultureFor(place.admCd2),
      programs: programsFor(place.admCd2),
      authGap,
    }),
    periods: bundle.series.map((s) => s.period),
    entitled,
    reportId: `parcel_${place.admCd2}_${bundle.latest.period}`,
    provisional: true,
  });
}
