# KLAI Platform — 동네 매력도 지도 · 진단 · 리포트

**K-Local Attractiveness Index (KLAI)** 플랫폼. 한국의 **행정동 단위 매력도**를 실제 지도 위 choropleth로 보여주고(레이어·시간 슬라이더), 그 변화의 *이유(방향·위기·전략)* 를 진단해 **리포트로 발행**하며, 사용자가 **지번/지역을 입력하면 유료 진단 리포트**를 받는 SaaS.

> 방법론 근거: [`docs/K-로컬매력도지수_기획서.md`](docs/K-로컬매력도지수_기획서.md) · 빌드 스펙: [`CLAUDE.md`](CLAUDE.md) · 시각 레퍼런스: [`docs/KLAI_시스템맵.html`](docs/KLAI_시스템맵.html)

---

## 빠른 시작

```bash
npm install
npm run seed     # 샘플 행정동·점수·진단·리포트 데이터 생성 (data/*.json)
npm run dev      # http://localhost:3000
```

`npm run seed` 는 이미 실행되어 `data/` 에 결과가 들어 있습니다. 데이터를 바꾸려면 `seed/generate.mjs` 수정 후 다시 실행하세요.

### 전국 커버리지 (3,554 행정동)
실제 전국 행정동 경계(vuski/admdongkor)를 내려받아 `data/boundaries/admdong.simplified.geojson` 에 두면, 시드가 **전국 3,554동**으로 데이터를 생성하고 지도가 전국을 덮습니다. 이미 적용되어 있으며, 다시 받으려면:
```bash
node scripts/fetch-boundaries.mjs        # 전국(34MB→2MB 간소화) · 시도 필터: --sido=경기도
npm run seed                             # 실경계가 있으면 자동으로 전국 모드
```
경계 파일이 없으면 자동으로 48개 가상 샘플(안양 인근)로 폴백합니다. 지도는 점수 전체(11MB)를 받지 않고 **레이어별 압축 색·라벨**(`/api/mapdata`)만 가져옵니다.

> **데이터윤리(§15)**: 전국 점수는 실데이터 전까지 **샘플·잠정(개념검증)** 입니다. 실재 동명에 붙은 등급은 Phase 5 파이프라인이 지역별 실데이터로 대체합니다.

### 데이터 상태 (솔직한 고지) & 실연동 — `/data`

| 데이터 | 상태 | 실연동 방법 |
|---|---|---|
| **행정동 경계** | ✅ **실제** (vuski/admdongkor) | 키 불필요 |
| 인구·점수·신호·임대료·매물·조달 | ⚠ **예시(합성)** | 아래 키 → `npm run ingest` |

전 화면의 `예시 데이터 · 출처 ↗` 배지를 누르면 **`/data` 투명 패널**로 이동해, 지표별 **실제 출처·필요 키·미연동 이유**를 확인할 수 있습니다.

**실데이터 연동 (한국 공공데이터 키는 본인 계정으로만 발급):**

```bash
cp .env.example .env.local     # 아래 키 중 보유한 것만 채움
npm run ingest                 # 키 있는 소스만 실데이터로 기록(가짜 덮어씀) + data/.ingested.json
```

| 지표 | 키 (env) | 발급처 |
|---|---|---|
| 인구(10년) | `KOSIS_API_KEY` | https://kosis.kr/openapi |
| 검색량 | `NAVER_CLIENT_ID`·`NAVER_CLIENT_SECRET` | https://developers.naver.com/apps |
| 기사량 | `BIGKINDS_API_KEY` | https://bigkinds.or.kr |
| 상권·창업 | `LOCALDATA_API_KEY` | https://localdata.go.kr |
| 임대료·공실 | `RONE_API_KEY` | https://reb.or.kr/r-one |
| 매물·실거래 | `RTMS_API_KEY`(serviceKey) | https://data.go.kr |
| 공공조달 | `G2B_API_KEY`(serviceKey) | https://data.go.kr |

### 도시 평균 대비 (기준선)
동 리포트(`/place`)에 **이 동 vs 시도 평균 vs 전국 평균** 인구 변화 지수(기준연도=100) 그래프를 넣어, *기본 데이터(평균) 대비 이 동이 얼마나 변했는지*를 보여줍니다. 실데이터 연동 시 통계청 시도·전국 평균으로 자동 대체.

### 지도 베이스맵 (선택)
기본은 CARTO 다크매터(네트워크 가능 시 자동) → 오프라인이면 인라인 다크 스타일로 자동 폴백합니다. 다른 스타일을 쓰려면:
```bash
cp .env.example .env.local
# NEXT_PUBLIC_MAP_STYLE_URL 에 원하는 MapLibre 스타일 JSON URL
```

---

## 무엇이 동작하나 (목업 우선 MVP)

빌드 스펙의 **목업 우선(Mock-first)** 원칙대로, 외부 서비스(Supabase·결제·Python 파이프라인) **없이** 시드된 샘플 데이터로 전 화면·로직이 동작합니다. 모든 화면에 `샘플·잠정(Provisional)` 배지가 붙습니다.

| 라우트 | 내용 | 상태 |
|---|---|---|
| `/` | **인터랙티브 3D 지도(HERO)** — **전국 3,554개 실제 행정동**이 데이터 값만큼 **3D 기둥으로 솟아오름**(deck.gl 익스트루전+조명+48° 틸트, 2D/3D 토글). **⚡네온 야간 테마**(발광+**바닥 글로우**), **🎬시네마틱 권역 투어**(전국→서울→부산→광주→춘천→제주, **경유지 자동 오빗 회전**), **🔥핫스팟 투어**(모멘텀 급등 동만 순회), 기둥 **호버 3D 말풍선 카드+솟구침 강조**, 시간 재생 시 높이 애니메이션, **11개 레이어**, 실명 검색, **줌인 시 지번·필지 세부 모드**(행정동 → 필지 성장 격자 + 로컬 상점·마을 포인트로 LOD 전환) | ✅ |
| `/place/[admCd]` | **동 리포트** — 4축 레이더(비교군), 12 Sub, 추세, **신호 동조 분석(검색·기사·인구·임대료·매물 겹친 그래프 + "왜 함께 올랐나" 선행성 진단 + 방향·전략·검증법)**, **지역 흐름(인구 장기추세·순이동·나라장터 공고예산·조달 기록표)**, 진단 요약, 상세는 페이월 블러 | ✅ |
| `/diagnose` | **유료 지번 진단** — 방향·위기·전략 3단, 무료 미리보기 + 결제(목업) 후 열람 | ✅ |
| `/reports`, `/reports/[slug]` | **리포트 아카이브 + 뷰어** — Flagtale Weekly · KLAI Annual (웹진 HTML, 인쇄버튼 없음) | ✅ |
| `/dashboard` | **기관 대시보드** — 경보 인박스, 관할 랭킹, **공공예산 유입 흐름(입찰/수의 상위 행정동)**, 권역 필터, 정책 도구 | ✅ |
| `/pricing` `/auth` `/account` | 티어·과금 · 로그인(목업) · 계정 | ✅ |

### API (스펙 §13)
`GET /api/places?period=&layer=` · `GET /api/place/[admCd]` · `GET /api/scores` · `GET /api/geojson` · `GET /api/reports?kind=` · `GET /api/reports/[slug]` · `POST /api/diagnose` · `POST /api/checkout` · `GET /api/cron/weekly`(CRON_SECRET 보호) · `GET /api/dashboard/alerts?region=`

---

## 기술 스택

- **Next.js 14** (App Router) · TypeScript · Tailwind (ZeroSite 디자인 토큰)
- 지도: **MapLibre GL JS** + **deck.gl** `GeoJsonLayer` (choropleth · 레이어 전환 · 색 전이 애니메이션)
- 상태: **Zustand** (지도 레이어·기간·선택 동) · 차트: **Recharts** + SVG 포팅(인과루프·내러티브 곡선·발산)
- 데이터: 시드 생성기(`seed/generate.mjs`, d3-delaunay Voronoi)가 `data/*.json` 생성 → API 라우트가 서빙

---

## 산식 (앱측 결정론 근사 · 기획서 §3~§5)

```
KLAI_base = 0.20·D1 + 0.30·D2 + 0.20·D3 + 0.30·D4
KLAI      = clamp(KLAI_base + 모멘텀 M, 0, 100)
젠트리 경보 G > θ → 모멘텀 상한(cap) + 소폭 감점 + 경보 플래그
등급: S 85+ · A 70 · B 55 · C 40 · D 25 · E 0
```
부동산은 단조 가점하지 않음(역U·포화), 시장 활성도(거래량·공실)를 가격과 분리해 봄.

### 신호 동조 분석 (왜 함께 올랐나)

검색량·기사량·인구·임대료·매물 5개 신호를 한 그래프에 겹쳐 보여주고, **무엇이 먼저 움직였나(lead-lag)** 로 동반 상승의 이유를 가른다 (`lib/signals.ts`).

- **서사 선행**(검색·기사 먼저 → 인구·매물 → 임대료 마지막) = **건강한 티핑포인트** (이야기가 사람을 끌어들여 상업 형성, Gladwell·기획서 §5.6)
- **자본 선행**(임대료·매물 먼저) = **추출형 거품** 위험 (서사 없이 자본만, 가치 환류 안 됨)
- 출력: 동조도(co-movement) 곡선 + 선행 순서 + **이유** + **로컬 방향·전략** + **확인법 4종 체크리스트**(선행성 Granger·진정성 갭·가격↔유동성 발산(가로수길)·가치 환류)
- `/place/[admCd]` 와 `/diagnose` 에 노출. 실데이터: 네이버 데이터랩(검색)·BIGKINDS(기사)·KOSIS(인구)·R-ONE(임대료)·RTMS/거래현황(매물)로 치환.

### 지역 흐름 데이터 (인구 · 공공예산)

장기 시계열로 "지역의 흐름"을 보여준다 — 매력도 점수만이 아니라 그 **토대(인구)** 와 **정책 개입(공공예산)** 의 흐름.

- **인구 (2015~2026 연간)**: 총인구·세대수·청년(20~39)/고령(65+) 비율·순이동(유입/유출)·증감률. `data/demographics.json`
- **나라장터 공공조달 (2016~2026 연간)**: **입찰 공고**(행사·축제 등) vs **수의계약**, 분야별(행사·축제/문화·관광/도시재생·시설/복지·돌봄/용역·연구/환경·안전) 공고예산, 대표 조달 기록. `data/procurement.json`
- 분기 점수에도 `population·popChangeRate·budgetInflow` 를 부착해 **지도 레이어(인구 변화·공공예산 유입)** 와 시간 슬라이더에 연동.
- 해석: 공공예산 유입은 **정책 개입 신호** — 소멸 진행 동에 도시재생·소멸대응 예산이 집중되는 패턴을 가시화하고, 투입 전후 KLAI 변화를 **DiD**로 추정하면 정책 ROI를 읽을 수 있다(기획서 §5.7). 실데이터 전환 시 통계청 주민등록·조달청 나라장터 OpenAPI로 치환.

---

## 데이터 윤리 가드레일 (스펙 §15 준수)

- ✅ **실제 동 낙인 방지** — 시드는 안양 인근 좌표 위 **가상 행정동명**(새빛시) 사용. 실재 동을 가짜 등급으로 표기하지 않음.
- ✅ **샘플·잠정 배지** 전 화면 노출. 진단은 "원인 *후보*"로 표기.
- ⛔ **웹진/리포트 HTML에 클라이언트 PDF·인쇄 버튼 없음** — PDF는 서버(Playwright) 전용(현재 목업).
- ✅ 공개 등급은 거칠게(처방 중심), 정밀 진단은 결제·기관 권한 뒤로.

---

## 다음 단계 (실데이터 전환)

**연동 스캐폴딩 완료** — 아래 통합 코드가 모두 들어 있고, **환경변수(키)를 채우면 해당 기능만 자동으로 켜진다**(`lib/config.ts` 단일 판별). 키가 없으면 지금처럼 목업으로 동작.

| 영역 | 현재(키 없음) | 키 주입 시 자동 활성 | 코드 |
|---|---|---|---|
| 인증 | 목업 로그인 | Supabase Auth(이메일 매직링크 + 카카오) · 미들웨어 라우트 보호 | `lib/supabase/*`, `middleware.ts`, `components/auth/AuthForm.tsx` |
| 결제 | 목업 세션 | PortOne v2 결제 + **웹훅 서버검증**(재조회) → 크레딧/구독 | `lib/payments/portone.ts`, `app/api/checkout`, `app/api/payments/webhook` |
| PDF | 화면 리포트 | Playwright 서버 렌더(`/api/*/pdf`) | `lib/pdf/*` |
| 이메일 | 목업 | Resend 주간 발송(Vercel Cron `/api/cron/weekly`) | `lib/email/resend.ts`, `vercel.json` |
| DB | 시드 JSON | Supabase/PostGIS (Prisma 스키마 + 마이그레이션) | `prisma/schema.prisma`, `supabase/migrations/*` |
| 데이터 | `seed/generate.mjs` | Python 파이프라인 → Supabase upsert | `pipeline/` (KOSIS·나라장터·R-ONE·LOCALDATA·BIGKINDS) |
| 진단 | 결정론적 근사 | SHAP·Granger·**DiD(정책 ROI)**·토픽모델 | `pipeline/diagnosis.py` |
| 경계 | Voronoi 가상 | vuski/admdongkor 실경계(mapshaper) | `scripts/fetch-boundaries.mjs`, `lib/data.ts` |

### 활성화 가이드

```bash
cp .env.example .env.local          # 보유한 키만 채우면 그 기능만 켜짐

# 1) 인증·DB:   NEXT_PUBLIC_SUPABASE_URL / ..._ANON_KEY / SUPABASE_SERVICE_ROLE_KEY / DATABASE_URL
npx prisma generate && npx prisma migrate dev      # 테이블 생성
psql "$DATABASE_URL" -f supabase/migrations/0001_postgis_and_geom.sql  # PostGIS·함수

# 2) 결제:     PORTONE_API_SECRET / PORTONE_STORE_ID / PORTONE_CHANNEL_KEY  (웹훅 URL: /api/payments/webhook)
# 3) 이메일:   RESEND_API_KEY / RESEND_FROM / WEEKLY_RECIPIENTS   (Vercel Cron 이 주간 실행)
# 4) PDF:      npm i -D playwright && npx playwright install chromium  →  ENABLE_PDF=1
# 5) 실경계:   node scripts/fetch-boundaries.mjs --sido=경기도  →  NEXT_PUBLIC_BOUNDARY_SOURCE=real
# 6) 파이프라인: pip install -r pipeline/requirements.txt
#               PIPELINE_MOCK=0 + 각 OpenAPI 키 + SUPABASE_SERVICE_ROLE_KEY  →  python -m pipeline.run
```

> ⚠ **데이터윤리(§15)**: 실경계(`real`)로 바꿀 때 실재 동에 샘플 점수가 붙으면 낙인이 되므로, 실데이터(점수)를 함께 확보했을 때만 사용하거나 '개념검증' 배지를 유지할 것.

---

## 프로젝트 구조

```
app/            # 라우트 (지도·동리포트·진단·리포트·대시보드·가격·인증) + api/ (+ payments/webhook, */pdf)
components/     # map/ · charts/ · report/ · diagnose/ · auth/ · ui
lib/            # data·scoring·constants·store·types · config(피처플래그)
                #  + supabase/ · payments/(portone) · pdf/(playwright) · email/(resend)
middleware.ts   # 인증 활성 시 /dashboard·/account 보호 (목업이면 통과)
seed/           # generate.mjs — 결정론적 시드 생성기
scripts/        # fetch-boundaries.mjs — 실 행정동 경계 다운로드·간소화
data/           # districts.geojson · scores · diagnoses · reports · demographics · procurement
prisma/         # schema.prisma (앱 모델, §5)
supabase/       # migrations/ — PostGIS·함수 SQL
pipeline/       # Python: connectors/ · scoring · diagnosis · upsert · run (Phase 5)
.github/        # workflows/ — 데이터 갱신 cron
vercel.json     # 주간 리포트 Vercel Cron
docs/           # 기획서 · 시스템맵
```
```bash
npm run build      # 프로덕션 빌드 (dev 서버 중지 후 실행 — .next 공유 주의)
npm run typecheck  # 타입 검사
python -m pipeline.run   # 데이터 파이프라인 (목업; PIPELINE_MOCK=0 으로 실데이터)
```
