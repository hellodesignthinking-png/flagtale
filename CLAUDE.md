# KLAI Platform — Claude Code 빌드 스펙 (프롬프트)
### 동네 매력도 지도 · 진단 리포트 · 유료 지번 진단

> 이 문서는 **Claude Code에 그대로 투입하는 빌드 지시서**다. 레포 루트에 `CLAUDE.md`(또는 `SPEC.md`)로 두고 작업한다.
> 방법론·산식·진단 로직의 **근거**는 별도 문서 `K-로컬매력도지수_기획서.md`(이하 **[기획서]**)에 있고, 시각 레퍼런스는 `KLAI_시스템맵.html`(이하 **[시스템맵]**)이다. 이 빌드 스펙은 *어떻게 구현할지*에 집중한다.

---

## 0. Claude Code에게 — 이 문서 사용법

1. **점진적으로 빌드한다.** §14의 Phase 0→5 순서를 따른다. 각 Phase 끝의 **수용 기준(Acceptance)** 을 통과해야 다음으로 간다.
2. **목업 우선(Mock-first).** 실데이터 파이프라인(Phase 5)은 무겁다. Phase 1~4는 시드된 **샘플 데이터**로 UI·로직을 완성한다. 화면에는 실데이터 전까지 `샘플/개념` 배지를 단다.
3. **단일 레포 + Python 파이프라인 디렉터리** 구조로 간다(§4).
4. 결정이 필요하면 이 문서의 **기본값(opinionated defaults)** 을 따른다. 임의로 스택을 바꾸지 않는다.
5. 산식이 모호하면 [기획서] §3(지수)·§4(산출)·§5(진단)을 참조한다. 구현 단계에선 **결정론적 근사**(예: 가중합·역U·임계)로 시작하고, SHAP/ML은 Phase 5로 미룬다.
6. **데이터 윤리 가드레일**(§15)을 절대 어기지 않는다.

---

## 1. 제품 한 줄 & 목표

**KLAI 플랫폼** = 한국의 **행정동 단위 매력도**를 지도 위에 색·다이어그램으로 보여주고, 그 변화의 *이유(방향·위기·전략)* 를 진단해 **리포트로 발행**하고, 사용자가 **지번/지역을 입력하면 유료 진단 리포트**를 받는 SaaS.

**핵심 산출물 3종**
- 🗺️ **인터랙티브 지도** — 실제 지도 위 행정동 choropleth가 **레이어 선택 + 시간 슬라이더**로 변해간다.
- 📰 **리포트 발행** — 연간 `KLAI Annual`(매력동네 100) + 주간 `Flagtale Weekly`(플래그테일).
- 🔎 **유료 지번 진단** — 지번/지역 입력 → **방향(Trajectory)·위기(Risk)·전략(Strategy)** 리포트(PDF).

**정의된 완료(Definition of Done, MVP)**: 비로그인 사용자가 지도에서 동을 탐색하고, 한 동의 무료 요약을 보고, 결제 후 임의 지번의 진단 PDF를 받을 수 있으며, 주간 Flagtale 리포트가 자동 생성되어 아카이브에 쌓인다.

---

## 2. 사용자 & 여정 (→ 라우트)

| 페르소나 | 핵심 행동 | 티어 | 라우트 |
|---|---|---|---|
| 시민·언론 | 지도 탐색, 동 요약, 주간 리포트 열람 | Free | `/`, `/place/[admCd]`, `/reports` |
| 소상공인·창업자 | 입지 후보 지번 진단(방향·위기·전략) | Pay-per / Pro | `/diagnose` |
| 지자체·중간지원조직 | 관할 모니터링·경보·정책 ROI | 기관 구독 | `/dashboard` |
| AMC·VC·프랜차이즈 | 출점·투자 스코어링, API | 기관 구독 | `/dashboard`, API |
| 내부(ZeroSite/belocal) | LH 입지 가산점, 사업자 지리축 | 내부 | API |

---

## 3. 기술 스택 (기본값 — 변경 금지)

**Frontend**
- Next.js 14 (App Router) · TypeScript · Tailwind · shadcn/ui
- 지도: **MapLibre GL JS** (다크 베이스맵) + **deck.gl** `GeoJsonLayer`(choropleth/레이어/시간 전이)
- 상태: **Zustand**(지도 레이어·기간·선택 동), **TanStack Query**(데이터 패칭)
- 차트: **Recharts** + **D3**(레이더, 인과 루프, 내러티브 곡선 — [시스템맵] 재현)

**Backend / Data**
- **Supabase**(PostgreSQL 15 + **PostGIS** + Auth + Storage) — 단일 백엔드
- ORM: **Prisma**(앱 모델) + **raw SQL**(PostGIS 공간 쿼리)
- 파이프라인: **Python**(pandas, geopandas, scikit-learn) — 인제스천·점수·진단 계산 후 Supabase upsert
- 스케줄: GitHub Actions cron(또는 Supabase cron) — 주간 리포트·데이터 갱신

**서비스**
- 인증: **Supabase Auth**(이메일 + 카카오 OAuth)
- 결제(KRW): **PortOne(구 아임포트) v2** — 카드·카카오페이·토스, 단건결제 + 정기구독
- 리포트 PDF: **Playwright(Chromium)** 서버 렌더링 (Taina의 `build_cards.py` 패턴 재사용)
- 이메일: **Resend**(주간 리포트 발송)
- 지오코딩: **Kakao Local API** 또는 **VWorld**(주소/지번→좌표, PNU)

**호스팅**: Vercel(Next.js) + Supabase(DB/Auth/Storage) + GitHub Actions(파이프라인). Vercel 커넥터 활용.

---

## 4. 레포 구조

```
klai/
├─ CLAUDE.md                  # 이 문서
├─ app/                       # Next.js App Router
│  ├─ (public)/page.tsx       # 지도 랜딩(hero)
│  ├─ place/[admCd]/page.tsx  # 동 리포트(무료 요약)
│  ├─ diagnose/page.tsx       # 유료 지번 진단
│  ├─ reports/                # 아카이브 + 뷰어
│  ├─ dashboard/              # 기관용
│  ├─ pricing/ account/ auth/
│  └─ api/                    # Route Handlers (§13)
├─ components/
│  ├─ map/                    # MapCanvas, LayerControl, TimeSlider, Legend, PlacePanel, SearchBox
│  ├─ charts/                 # ScoreRadar, MomentumArrow, CausalLoop, NarrativeCurve, VolumePriceDivergence
│  └─ report/                 # ReportRenderer, WeeklyTemplate, AnnualTemplate, ParcelTemplate
├─ lib/                       # supabase, prisma, scoring(앱측 근사), diagnosis, geocode, payments(portone)
├─ prisma/schema.prisma
├─ pipeline/                  # Python: connectors/ scoring/ diagnosis/ jobs/
├─ data/                      # admdong.geojson(간소화), seed/ (샘플 점수·진단)
└─ public/
```

---

## 5. 데이터 모델 (Prisma + PostGIS)

> 표준 키는 **`adm_cd2`(행안부 10자리 행정기관코드)**. 통계청 `adm_cd`(8자리)·법정동 PNU와 매핑 테이블을 둔다.

```prisma
model Place {
  admCd2      String   @id            // 행안부 10자리
  admCd       String?                 // 통계청 8자리
  name        String                  // 행정동명
  sido        String
  sigungu     String
  typology    String?                 // 원도심/신도시/관광/대학가/주거/산업/소멸농산어촌
  centroidLat Float
  centroidLng Float
  // geom(폴리곤)은 PostGIS 컬럼으로 별도 마이그레이션(geometry(MultiPolygon,4326))
  scores      PlaceScore[]
  diagnoses   PlaceDiagnosis[]
  alerts      Alert[]
}

model PlaceScore {
  id        String  @id @default(cuid())
  admCd2    String
  period    String                     // "2026Q2" 또는 "2026-05"
  klai      Float
  d1 Float  d2 Float  d3 Float  d4 Float
  momentum  Float                      // ±
  gentriG   Float                      // 젠트리 속도
  marketVitality String               // active | stable | shrinking(거래절벽)
  provisional Boolean @default(true)   // 잠정 점수 여부
  place     Place @relation(fields:[admCd2], references:[admCd2])
  @@unique([admCd2, period])
}

model PlaceDiagnosis {
  id        String @id @default(cuid())
  admCd2    String
  period    String
  topFactors      Json     // SHAP/근사 기여요인 Top3 [{key,impact}]
  trajectory      String   // rising | stable | declining | gentrifying
  gentriStage     Int      // 0~5
  gentriTransition Json    // {nextStage, prob, etaMonths}
  declineCauses   Json     // [{factor, role: trigger|amplifier|result}]
  leverage        String?  // 레버리지 처방
  narrativeTheme  String?  // 토픽모델 결과(지금 이 동의 이야기)
  authenticityGap Float?   // 서사 vs 실제 상권 괴리
  successPath     String?  // 적합 성공 경로
  risks           Json     // 위기 목록
  strategy        Json     // 전략 목록
  place     Place @relation(fields:[admCd2], references:[admCd2])
  @@unique([admCd2, period])
}

model IndicatorRaw {          // 투명성·재현용 원시 지표(롱포맷)
  id String @id @default(cuid())
  admCd2 String  period String  key String  value Float  source String
  @@index([admCd2, period])
}

model Alert {
  id String @id @default(cuid())
  admCd2 String  type String   // gentri | decline | transaction_cliff | negative_narrative
  severity String  message String  createdAt DateTime @default(now())
  place Place @relation(fields:[admCd2], references:[admCd2])
}

model Report {
  id String @id @default(cuid())
  kind String          // annual | weekly | parcel
  title String  slug String @unique  period String
  htmlPath String?  pdfPath String?
  paywalled Boolean @default(false)
  publishedAt DateTime?
}

model AppUser { id String @id  email String  plan String @default("free")  credits Int @default(0) ... }
model ReportPurchase { id String @id  userId String  reportId String?  admCd2 String?  pnu String?  paidAt DateTime }
model Subscription { id String @id  userId String  plan String  status String  portoneId String ... }
model ParcelMap { pnu String @id  address String  admCd2 String }   // 지번→동 매핑
```

---

## 6. 인터랙티브 지도 스펙 (HERO — 가장 중요)

랜딩(`/`)은 **전체화면 지도**다. [시스템맵]의 헥스 개념도를 **실제 행정동 폴리곤**으로 구현한다.

### 6.1 베이스 & 데이터
- 베이스맵: MapLibre 다크 스타일(ZeroSite 네이비 톤). 초기 뷰: 대한민국 전체 → 줌인 시 시군구 → 행정동.
- 경계: `data/admdong.geojson` (**vuski/admdongkor** 또는 SGIS 기반, WGS84). `mapshaper`로 **간소화**(웹 성능). 키=`adm_cd2`.
- deck.gl `GeoJsonLayer`로 폴리곤 채색. 줌 레벨에 따라 시도→시군구→행정동 단계 표시(detail-on-demand).

### 6.2 레이어 선택 (LayerControl) — 단일 선택
활성 레이어에 따라 채색 메트릭·색 스케일이 바뀐다:
1. **종합 KLAI**(기본) — 등급 발산 스케일
2. D1 인구·지속성 / 3. D2 경제·상권 / 4. D3 공간·물리 / 5. D4 인식·감성
6. **모멘텀** — 발산(상승=청록, 하락=주황)
7. **젠트리 경보** — 회색 베이스 + 경보 동에 **주황 펄스 외곽선**(채움 아님)
8. **시장 활성도** — 활발/정체/위축(거래절벽) 3색
9. **내러티브** — 단계(형성/확산/절정/쇠퇴) 색 + 부정서사 동 표시

색 스케일(ZeroSite): S `#0F6E5C` · A `#1E7A8C` · B `#3E9AA8` · C `#E2A33A` · D `#D2691E` · E `#A23A2A`.

### 6.3 시간 슬라이더 (TimeSlider) — "변화해간다"
- 기간 축(예: 2022Q1 … 2026Q2). **재생/일시정지** 버튼.
- 재생 시 deck.gl `transitions`로 채움색을 부드럽게 보간하며 기간을 스텝. 동들이 시간에 따라 색이 변하는 애니메이션.
- 모멘텀/젠트리 레이어에선 변화가 가장 드라마틱하게 보이도록.

### 6.4 인터랙션
- **Hover** → 툴팁(동명·값·등급).
- **Click** → 우측 `PlacePanel` 드로어: 점수·등급·모멘텀 화살표·4축 레이더·진단 요약·미니 시계열 + CTA `상세 진단 리포트(유료)`.
- **Search**(SearchBox) → 주소/지번/동명 입력 → 지오코딩 → 해당 동 fitBounds + 선택.
- Legend, 베이스맵 토글, 권역 줌 프리셋(수도권·영남·호남·강원·제주).

### 6.5 수용 기준
전국 행정동이 종합 KLAI로 채색되고, 레이어 전환·시간 재생·hover·click 패널·검색이 동작한다(샘플 데이터).

---

## 7. 화면/라우트 스펙

- **`/` 지도** — §6.
- **`/place/[admCd]` 동 리포트(무료 요약)** — 점수·등급·모멘텀, 4축 레이더, 진단 *요약*(젠트리 단계·추세·시장활성도), 최근 3년 추세. 상세(원인·전략)는 블러 + `유료 진단` CTA.
- **`/diagnose` 유료 지번 진단** — 주소/지번 입력 → 동 매핑 → 권한(크레딧/구독) 확인 → **방향/위기/전략** 리포트 생성·표시 + PDF 다운로드. 미결제 시 페이월(미리보기 일부 + 결제 모달).
- **`/reports` 아카이브** — `Flagtale Weekly` 리스트 + `KLAI Annual`. 카드 그리드, 기간 필터.
- **`/reports/[slug]` 뷰어** — 웹진형 HTML 렌더. 권한자에 한해 PDF 다운로드. **클라이언트 PDF/인쇄 버튼 금지**(§15).
- **`/dashboard`(기관)** — 관할 지도, 경보 인박스, 동 랭킹/추세, 정책 What-if, CSV/ API 키.
- **`/pricing` `/account` `/auth/*`**.

---

## 8. 점수·진단 엔진 (구현 노트)

> 산식 근거: [기획서] §3~§5. 구현은 **2단계**로.

**앱측 결정론 근사 (Phase 1~4, `lib/scoring.ts`·`lib/diagnosis.ts`)**
- 정규화: 비교군(같은 시도) 내 Min-Max, 역방향 지표 반전, 쏠림 지표 로그.
- 합성: `klai = .20*d1 + .30*d2 + .20*d3 + .30*d4`; D4는 `긍정비율 × (버즈+확산)`; 모멘텀 `M`은 축별 변화율 z-합.
- 부동산: 자산가치=로그+포화, 임대료=역U(rent-to-revenue), **시장활성도**=거래량/공실기간/인허가 → `active|stable|shrinking` 분류, 젠트리 `G`=가격·손바뀜·브랜드 합성 임계.
- 진단 룰: 젠트리 6단계(0~5)는 선행지표 조합 룰, 소멸 원인은 변수 역할 분류(트리거/증폭/결과), 내러티브는 토픽·진정성갭.

**파이프라인 정밀화 (Phase 5, Python)**
- SHAP 기여요인, Granger 선행성, DiD, Moran's I(풍선효과), 군집(유형·성공 DNA), 토픽모델(내러티브 주제), 사례 백테스트(성수·연남·가로수길).

전 산출물에 **`provisional` 플래그**와 데이터 커버리지를 노출한다.

---

## 9. 데이터 인제스천 (Python, Phase 5 — 목업 우선)

`pipeline/connectors/` 에 소스별 모듈. 모두 **행정동(adm_cd2)** 으로 집계.

| 모듈 | 소스 | 산출 |
|---|---|---|
| population | 통계청 KOSIS, 한국고용정보원 소멸위험 | D1 |
| commerce | LOCALDATA(인허가), 소진공 상권정보, 서울 우리마을가게 | D2 창업·폐업·다양성 |
| sales | 카드사/관광 데이터랩 | D2 매출 |
| realestate_price | 부동산공시가격 알리미, 국토부 실거래가(RTMS), 밸류맵 | D3-5 |
| realestate_rent | 한국부동산원 R-ONE 임대동향(임대료·공실·수익률) | D2-5 |
| realestate_liquidity | 부동산원 부동산거래현황(거래량), RTMS 건수, 세움터 인허가 | **D2-6 시장활성도** |
| social | 네이버 데이터랩, 썸트렌드/바이브, 블로그·리뷰 | D4 |
| news | BIG KINDS, belocal 미디어 아카이브 | D4 미디어·내러티브 |
| boundary | vuski/admdongkor · SGIS geojson | 지도/공간 |

해상도 주의: 임대동향=상권/시도 → 동 매핑 테이블 필요. 실거래·공시지가=필지 → 동 집계.

---

## 10. 리포트 발행 시스템

공통: `components/report/*` 템플릿(React→HTML) → Supabase Storage에 HTML 저장 → **Playwright로 PDF 렌더** 저장 → `Report` 레코드 생성. **웹진 HTML에는 `.pdf-bar`·`pdf-btn`·`window.print()` 등 클라이언트 인쇄/저장 버튼을 넣지 않는다**(PDF는 서버 생성). 디자인: ZeroSite 네이비/앰버.

### 10.1 Flagtale Weekly (플래그테일 주간 리포트)
- **자동 발행**(주 1회 cron `/api/cron/weekly`). 콘텐츠 블록:
  1. 이주의 **상승/하락 Top 동**(모멘텀)
  2. 신규 **젠트리 경보** · **거래절벽** 경보
  3. **뜨는/식는 내러티브**(주제 변동)
  4. 1개 동 **심층 스포트라이트**(방향·위기·전략 미리보기)
- 포맷: 반응형 웹진 HTML(ZeroSite Webzine 스타일) + 서버 PDF + Resend 이메일. (선택) `build_cards.py` 재사용해 1080×1350 IG 카드 생성.

### 10.2 KLAI Annual
- **연 1회**. `매력동네 100` 랭킹 + 전국 추세 + 유형별 분석 + 젠트리/소멸 지도. 장문 HTML + PDF. `/reports/[slug]` 뷰어.

### 10.3 유료 지번/지역 진단 (핵심 수익 모델)
- 트리거: `/diagnose` 입력 → 동 매핑 → 권한 확인 → 리포트 생성.
- **구조(필수 3섹션)**:
  - **방향(Trajectory)** — KLAI·등급·모멘텀, 유형, 시계열, 시장활성도(활발/위축), 내러티브 단계
  - **위기(Risk)** — 젠트리 단계·전이확률, 소멸 가속 원인, 거래절벽/공실·부정서사·진정성갭 경보
  - **전략(Strategy)** — 레버리지 처방, 적합 앵커·업종, What-if 권고, (옵션)ZeroSite LH 입지 적합성
- 출력: 화면 + PDF(Playwright). `ReportPurchase` 기록. 크레딧/구독 차감.

---

## 11. 인증 & 결제

**티어**
| 티어 | 권한 | 과금 |
|---|---|---|
| Free | 지도·동 요약·주간 웹 열람 | 0 |
| Pay-per (크레딧) | 지번 진단 1건 = N크레딧 | 단건 |
| Pro(개인·소상공인) | 무제한 진단·주간 PDF·알림 | 월 구독 |
| 기관(B2G/B2B) | 대시보드·API·애뉴얼·맞춤 | 협의 구독 |

- 인증: Supabase Auth(이메일+카카오). 미들웨어로 `/diagnose` 결과·PDF·`/dashboard` 보호.
- 결제: PortOne v2. `POST /api/checkout`(단건/구독) → 결제창 → **웹훅 `/api/payments/webhook`** 으로 크레딧/구독 반영(서버 검증 필수). 환불·영수증 처리.

---

## 12. 디자인 시스템 (ZeroSite)

- 색: navy `#0D2B5E`/`#162844`, blue `#1E5FA8`, amber `#D4861E`/`#D35400`. 등급 스케일 §6.2. 경보 `#FF7A3D`.
- 타이포: **Pretendard**. 디스플레이 800, 본문 400~600.
- 톤: 어두운 배경 + 절제된 앰버 포인트. 차트는 [시스템맵] 비주얼 재현(레이더·인과루프·내러티브 곡선·발산 그래프).
- shadcn/ui 컴포넌트 + Tailwind 토큰화(`globals.css` CSS 변수).

---

## 13. API 계약 (Route Handlers)

```
GET  /api/places?bbox=&period=&layer=        → GeoJSON FeatureCollection(value, grade)
GET  /api/place/[admCd]?period=              → {score, diagnosisSummary, series}
POST /api/diagnose  {address|pnu}            → (auth+credit) {trajectory, risks, strategy, reportId}
GET  /api/reports?kind=&period=              → Report[]
GET  /api/reports/[slug]                     → {html|url, pdfUrl?(entitled)}
POST /api/checkout  {plan|credits}           → PortOne 결제 세션
POST /api/payments/webhook                   → 결제 검증·반영
GET  /api/cron/weekly                        → Flagtale Weekly 생성(보호된 cron)
GET  /api/dashboard/alerts?region=           → Alert[]   (기관)
```

---

## 14. 빌드 단계 (Claude Code 실행 순서)

**Phase 0 — 스캐폴드**
Next.js+TS+Tailwind+shadcn, Supabase 연결, Prisma 스키마 + PostGIS 마이그레이션, 디자인 토큰, `data/admdong.geojson`(간소화) 로드, **시드 스크립트**(1개 도시 행정동 × 6개 기간 × 가짜 점수/진단).
✅ Acceptance: `pnpm dev`로 빈 셸 + 시드 데이터 조회 OK.

**Phase 1 — 지도 MVP**
MapCanvas(MapLibre+deck.gl), 종합 KLAI choropleth, LayerControl(레이어 채색 전환), hover 툴팁, click→PlacePanel, Legend. 단일 기간.
✅ 전국(또는 시드 도시) 채색 + 레이어 전환 + 클릭 패널.

**Phase 2 — 시간·레이어·검색**
TimeSlider + 재생 애니메이션(색 전이), 9개 레이어 전부, SearchBox(지오코딩→선택).
✅ 시간 재생 시 동 색이 변하고, 9레이어·검색 동작.

**Phase 3 — 동 리포트 & 리포트 발행**
`/place/[admCd]`(레이더·진단요약·시계열), `/reports` 아카이브, **Flagtale Weekly 템플릿 자동생성**(시드 데이터로) + PDF(Playwright), Annual 템플릿.
✅ 주간 리포트가 자동 생성되어 아카이브·뷰어에 표시(인쇄버튼 없음), PDF 생성.

**Phase 4 — 인증·결제·유료 진단**
Supabase Auth, PortOne 결제+웹훅, 크레딧/구독, `/diagnose`(방향·위기·전략 생성·게이팅·PDF), `/dashboard` 기본.
✅ 결제 후 임의 지번 진단 PDF 수령, 미결제는 페이월.

**Phase 5 — 실데이터 파이프라인**
Python 커넥터(§9), 점수·진단 계산(SHAP/토픽/백테스트), 스케줄 잡, 목업 → 실데이터 치환, `provisional` 해제 로직.
✅ 1개 시범 지자체 실데이터로 점수·진단·주간 리포트 산출.

---

## 15. 제약 · 가드레일 (Do / Don't)

- ✅ **목업 우선**, 실데이터 전까지 `샘플/잠정(Provisional)` 배지 필수.
- ⛔ **웹진/리포트 HTML에 클라이언트 PDF·인쇄 버튼 금지**(`.pdf-bar`, `pdf-btn`, `window.print()` 등). PDF는 **서버(Playwright)** 만.
- ✅ 표준 키 **`adm_cd2`**. 통계청 8자리·법정동 PNU 매핑 유지.
- ✅ **데이터 윤리**: 공개 등급은 거칠게(처방 중심), 정밀 진단은 결제·기관 권한 뒤로. 개별 점포·개인 식별 데이터는 **집계만**. 진단은 "원인 *후보*"로 표기, 신뢰구간·커버리지 노출. ("D등급" 낙인이 자기실현·투기 신호로 악용되지 않게.)
- ⛔ 부동산 가격을 **단조 가점하지 말 것**(역U·포화). 지수가 시세표가 되면 실패.
- ✅ GeoJSON은 **mapshaper 간소화** + 권역별 지연 로드(성능). 필요 시 벡터타일.
- ✅ 결제는 **서버 검증/웹훅** 필수, 클라이언트 신뢰 금지.
- ✅ 비밀키는 `.env.local`(아래) + 서버 전용. `NEXT_PUBLIC_*` 만 노출.

---

## 16. 환경변수 (`.env.example`)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=                      # Prisma (PostGIS 포함 Postgres)
NEXT_PUBLIC_MAP_STYLE_URL=         # MapLibre 다크 스타일
KAKAO_REST_API_KEY=                # 지오코딩(또는 VWORLD_KEY)
PORTONE_API_SECRET=  PORTONE_STORE_ID=
RESEND_API_KEY=
CRON_SECRET=                       # /api/cron/* 보호
```

---

## 부록. 빠른 시작(클로드코드 첫 메시지 예시)

> "이 레포의 `CLAUDE.md`(KLAI 빌드 스펙)를 읽고 **Phase 0**부터 시작해라. Next.js 14 + TS + Tailwind + shadcn 스캐폴드, Supabase·Prisma·PostGIS 설정, `data/admdong.geojson` 로드, 그리고 1개 도시(예: 안양시) 행정동에 대해 6개 기간의 **샘플 KLAI 점수·진단** 시드 스크립트를 만들어라. Phase 0 수용 기준을 통과하면 멈추고 보고해라."

---
*문서 끝 · KLAI Platform Build Spec v0.1 — methodology in [기획서], visuals in [시스템맵]*
