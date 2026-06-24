# 아키텍처

## 스택
Next.js 14.2 (App Router) · TypeScript · Tailwind(CSS 변수 토큰) · maplibre-gl + deck.gl(지도) · Recharts(차트) · Pretendard + Poppins. 배포 Vercel(icn1).

## 통합 구조 — 한 앱, 두 세계
- **Flagtale (소비자)**: `/discover`(발견+경험 통합: 크리에이터·투어·패스·스테이 + 콘텐츠맵), `/map-tale`(전체화면 콘텐츠 지도), `/hub`(secondwind 시너지).
- **Flagtale Lab (데이터)**: `/`(랜딩: 3D 라이브맵·뜨는 동네·신호), `/map`(전국 매력도 choropleth), `/reports`, `/diagnose`(유료 지번 진단), `/place/[admCd]`(동 리포트), `/methodology`(Place OS 통합 방법론), `/data`, `/brand`, `/dashboard`.
- 공유 크롬: `components/site-header.tsx`(통합 내비: 발견·경험/플래그맵/허브/매력도 Lab/리포트/진단), `components/page-shell.tsx`(PageShell + SiteFooter). 마스트헤드=**Flagtale**.

## 데이터 흐름
- **시드(목업 우선)**: `data/*.json` → `lib/data.ts` 로더(모듈 캐시). 점수=`scores.json`, 진단=`diagnoses.json`, 경계=`districts.geojson`(또는 `boundaries/admdong.simplified.geojson` 실경계).
- **소비자 데이터**: `data/flagtale/*.json`(원본 SQLite 시드 덤프) → `lib/flagtale.ts`(서버 로더) + `lib/flagtale-types.ts`(클라 공용 타입·`MAP_CATS`·`buildMapItems`). 축제=`festivals.json`.
- **신호 동조**: `lib/signalGen.ts`(동별 아키타입·점화시점으로 검색·기사·인구·매물·임대료 시계열 생성) + `lib/signals.ts`(`analyzeSignals` 동조도·선행성). 전국 평균=`nationalSignalAverage()`(lib/data.ts).
- **실데이터 커넥터**: `lib/connectors/*`(네이버 검색·기사·트렌드). 라우트: `/api/trending-locals`, `/api/local-detail`, `/api/diagnose` 등(icn1, CDN s-maxage). `unstable_cache` 금지(golden #CACHE).
- **서사**: `lib/narratives.ts`(핫지역 큐레이션 — 라이프사이클 단계 매핑). `/methodology`의 NarrativeShowcase.

## 지도 컴포넌트 3종 (혼동 주의)
| 용도 | 컴포넌트 | 엔진 |
|---|---|---|
| Lab 전국 매력도 | `components/map/MapExplorer` (+ MapMount) | maplibre + deck.gl GeoJsonLayer(choropleth) + 레이어/시간슬라이더. Flagtale 콘텐츠 포인트 레이어 토글 포함 |
| 랜딩 3D 히어로 | `components/landing/LandingHero3DMap` (+ Mount) | maplibre + deck.gl ColumnLayer(기둥=KLAI) |
| 소비자 콘텐츠 | `components/flagtale/FlagtaleMapExplorer` (+ Mount) | maplibre + HTML 라벨 마커(fin.land식) + 상단 필터바 + 좌측 패널 |
- 셋 다 `dynamic(ssr:false)` + `DEFAULT_MAP_STYLE`/`FALLBACK_MAP_STYLE`(`lib/constants.ts`).

## 진단 엔진 (lib)
`scoring.ts`(4축 합성·등급·색), `diagnosis*`(젠트리 단계·소멸 원인·전략), `weekly.ts`(Flagtale Weekly 생성), `pdf/template.ts`(서버 PDF). 전 산출물 `provisional` 플래그.

## 후속(키 필요)
백엔드(주문·결제·인증·어드민)는 현재 시드. Supabase(인증·DB, SQLite→Postgres/Turso 이전 권고)·PortOne(결제)·NCP Maps(네이버 타일) 키 추가 시 활성. flagtale 원본(Express+SQLite)의 18테이블·67엔드포인트는 `/Users/TaiNa0/Desktop/flagtale` 참조.
