# Flagtale 실데이터·실결제 활성 런북

> **요약**: 코드는 전부 "키만 넣으면 켜지는" 턴키 상태입니다. 보안상 키는 **회원님이 직접** Vercel 환경변수 / GitHub Action 시크릿 / `.env.local`에 넣어야 합니다(저는 자격증명을 입력하지 않습니다). 아래 순서대로 하면 됩니다.
>
> 키가 없으면 각 기능은 **자동으로 샘플/목업**으로 동작합니다(앱은 절대 깨지지 않음). 키를 넣은 소스만 실데이터로 전환됩니다.

---

## 0. 키를 어디에 넣나 (3곳)

| 위치 | 무엇을 위해 | 예 |
|---|---|---|
| **Vercel 프로젝트 환경변수** | 배포된 앱의 **런타임** 기능 | `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID`, `NAVER_CLIENT_ID/SECRET`, `KAKAO_REST_API_KEY`, `SUPABASE_*`, `PORTONE_*`, `RESEND_API_KEY` |
| **`.env.local`** (로컬) | 수동 인제스트(`npm run ingest`) | `KOSIS_API_KEY`, `DATA_GO_KR_KEY`, `RONE_API_KEY`, `SEOUL_OPENDATA_KEY` 등 |
| **GitHub Action 시크릿** | **월간 자동 데이터 갱신** | `.env.local`과 동일한 인제스트 키 + `VERCEL_TOKEN` |

> Vercel: 프로젝트 → Settings → Environment Variables. 추가 후 **재배포** 필요.
> GitHub: 저장소 → Settings → Secrets and variables → Actions.

---

## 1. 실데이터 — 점수·인구·상권 (빌드타임 인제스트)

앱은 `data/*.json`을 읽습니다. `npm run ingest`가 키로 실데이터를 받아 `data/`에 기록 → 커밋/배포하면 반영됩니다. (현재 `data/.ingested.json` = `boundary`, `population`만 실데이터)

**순서**
1. 키를 `.env.local`에 추가 (필요한 소스만):
   - `KOSIS_API_KEY` — 인구·소멸위험 (통계청, 무료) → D1
   - `DATA_GO_KR_KEY` — 소진공 상가·문화정보원 (data.go.kr 공공데이터, 무료) → D2
   - `RONE_API_KEY` — 부동산원 임대·공실 (R-ONE) → D2·D3 시장활성도
   - `SEOUL_OPENDATA_KEY` — 서울 생활인구 (열린데이터광장)
   - `G2B_API_KEY` — 나라장터 조달 → 공공투입
   - `VWORLD_KEY` — 지오코딩(주소→좌표)
2. **키 진단**: `npm run check-apis` → 소스별 ✓/✗ 표 출력 (키가 실제로 동작하는지 라이브 확인)
3. **인제스트**: `npm run ingest` → 동작하는 키의 소스만 `data/*.json` 갱신 + `.ingested.json`에 표시 (비파괴 병합)
4. `git add data && git commit && 배포` — 또는 아래 자동화에 맡김

**자동화(권장)**: `.github/workflows/data-refresh.yml`가 월 1회(+수동 트리거) 인제스트→커밋→배포. GitHub Action 시크릿에 위 키 + `VERCEL_TOKEN`을 넣으면 무인 갱신됩니다.

---

## 2. 실데이터 — 런타임 커넥터 (검색트렌드·뉴스·소셜·영상)

`lib/connectors/*`는 요청 시 라이브로 받아 캐시합니다. **Vercel 환경변수**에 키를 넣으면 즉시 활성(없으면 샘플):
- `NAVER_CLIENT_ID` / `NAVER_CLIENT_SECRET` — 네이버 검색트렌드·뉴스 (D4 인식·내러티브)
- `NAVER_NCP_KEY_ID` / `NAVER_NCP_KEY_SECRET` — NCP 데이터랩 등
- `KAKAO_REST_API_KEY` — 지오코딩 폴백
- `YOUTUBE_API_KEY` — 크리에이터 영상 지표
- `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` — 지도(이미 설정됨)

---

## 3. 고급 파이프라인 — 점수·진단 정밀화 (Python → Supabase)

`pipeline/`은 스펙 §8의 정밀 산출(SHAP 기여요인·Granger·토픽모델·백테스트)을 Supabase(PlaceScore)로 upsert합니다.
```bash
pip install -r pipeline/requirements.txt
PIPELINE_MOCK=0 DATABASE_URL=... python -m pipeline.run   # 실데이터 (각 커넥터 키 필요)
python -m pipeline.run                                    # MOCK (시드 흐름 시연, DRY-RUN)
```
> 참고: 배포된 앱은 현재 `data/*.json`(fs)을 읽습니다. Python 파이프라인은 **DB 경로**(고급/대시보드용)이고, 앱 표시 데이터는 §1 인제스트가 채웁니다.

---

## 4. Supabase — 로그인·게임동기화·영토·크레딧

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`를 Vercel에 넣으면 활성:
- 네이버/이메일 로그인, 게임상태 계정 동기화(`ft_game`), 영토전(`/api/territory`), 크레딧(`ft_credits`)
- 없으면: 게스트 모드(localStorage)로 동작

---

## 5. 실결제 — PortOne (서버 준비됨 · 클라 1단계 남음)

**현재 상태**: 서버 검증(`/api/payments/webhook` → PortOne 재조회), 결제 세션(`/api/checkout`), 진단 PDF 크레딧 게이팅(`diagnoseEntitlement`/`chargeDiagnoseCredit`)은 **완성**. `FREE_MODE=true`(lib/tier.ts)인 동안은 전면 무료 — 유료 전환 시 `false`로.

**회원님이 해야 할 것** (코드 아님 — 비즈니스/자격증명):
1. PortOne 가입 + 사업자/PG 계약(카드사 등) + 채널 생성
2. Vercel 환경변수: `PORTONE_API_SECRET`, `PORTONE_STORE_ID`, `PORTONE_CHANNEL_KEY`
3. `lib/tier.ts`의 `FREE_MODE = false`로 변경(유료화 시점)

**남은 코드 1단계** (브라우저 결제창 — 실키·실계정으로 테스트해야 해서 미배포):
```bash
npm i @portone/browser-sdk
```
`/api/checkout`이 이미 **금액·orderName·currency·payMethod·customData를 서버에서 결정해 반환**합니다(클라가 금액 위조 불가 — 스펙 §15). 클라는 그대로 패스스루:
```tsx
// 결제 버튼 onClick
import * as PortOne from "@portone/browser-sdk/v2";
const s = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: "pro", userId }) }).then(r => r.json());
if (s.mock) return alert("결제 미설정(키 필요)");
const res = await PortOne.requestPayment({
  storeId: s.storeId, channelKey: s.channelKey, paymentId: s.paymentId,
  orderName: s.orderName, totalAmount: s.totalAmount,
  currency: s.currency, payMethod: s.payMethod, customData: s.customData,
});
if (res.code != null) return alert("결제 실패: " + res.message);
// 성공 → /api/payments/webhook 이 PortOne 재조회로 검증 후 크레딧/구독 반영
```
> ⚠️ 테스트 시 확인할 것: ① v2 SDK 버전에 따라 `currency`가 `"KRW"` vs `"CURRENCY_KRW"`, `payMethod` enum(`"EASY_PAY"`/`"CARD"`)이 맞는지 — 안 맞으면 `app/api/checkout/route.ts`의 반환값만 수정. ② 웹훅 URL을 PortOne 콘솔에 등록(`/api/payments/webhook`). 결제 코드는 실키 없이 테스트 불가(오류=실제 돈) → PortOne 계정·키 준비되면 이 1단계를 함께 테스트하는 게 안전합니다.

---

## 5.5 인스타그램 버즈 — Apify (구현됨, 시드 데이터 포함)

핫지역 인스타그램 해시태그 게시물 수를 **Apify**(`apify/instagram-scraper`)로 수집해 `data/instagram.json`에 저장 → 동 리포트(/place)의 핫지역에 **"📸 인스타그램 #태그 · N만 게시물"** 카드로 노출(태그 링크 + `Apify 수집·잠정` 배지). 13개 핫지역은 **이미 시드**돼 있음(성수동 226만·문래동 2,699만 등).

**갱신/확장**:
1. [apify.com](https://apify.com) 가입 → Settings → Integrations → **API token** → `.env.local`에 `APIFY_TOKEN=...`
2. `node scripts/ingest-instagram.mjs` (또는 `npm run ingest:ig`) → 핫지역 태그를 run-sync로 재수집 → `data/instagram.json` 비파괴 갱신
3. 지역 추가: `scripts/ingest-instagram.mjs`의 `TAGS`(내러티브명→해시태그)에 추가
> ⚠️ 인스타 해시태그 카운트는 집계 특성상 과대/편차가 있어 **"잠정" 라벨 + 태그 링크(검증 가능)**로 노출. 정밀 버즈는 기간 필터·관련태그(`related`)·게시물 샘플로 고도화 가능.

## 6. 기타

- **주간 리포트 이메일**: `RESEND_API_KEY` + `RESEND_FROM` (+ `WEEKLY_RECIPIENTS` 또는 Supabase 구독자) → `/api/cron/weekly`(헤더 `CRON_SECRET`)
- **서버 PDF**: `ENABLE_PDF=1` + `npm i -D playwright && npx playwright install chromium` → 진단/리포트 PDF 서버 생성

---

## 빠른 체크리스트
- [ ] `npm run check-apis` — 가진 키 라이브 진단
- [ ] `.env.local`에 인제스트 키 → `npm run ingest` → 커밋/배포 (또는 GitHub Action 시크릿)
- [ ] Vercel env: NAVER·KAKAO·YOUTUBE(런타임), SUPABASE(로그인), PORTONE(결제), RESEND(메일)
- [ ] 유료화 시: `FREE_MODE=false` + PortOne 결제창 클라 1단계
