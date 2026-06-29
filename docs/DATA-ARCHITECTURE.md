# Flagtale 데이터 구조 재설계 — 샘플 → 실데이터 전환 (지표 ETL 모델)

> 목적: D1~D4 매력도 점수를 **행정동 3,554개 대량(bulk)으로 실측**으로 채우는 구조.
> 연구 근거(논문·국내 플랫폼·공공데이터)를 반영. 2026-06-29 작성.

---

## 1. 지금 구조의 한계 (왜 D3·D4가 샘플인가)

현재는 **두 모드가 분리**돼 있다:
- **온디맨드 실데이터**(`/diagnose`·`/place`): 네이버·소진공 상권 등 — 조회한 1개 동만 실시간. **3,554동 일괄 호출 시 레이트리밋**이라 지도엔 못 씀.
- **벌크 시드 샘플**(지도·점수): `scores.json` 난수 → 색은 나오지만 가짜.

→ **문제는 "API가 안 됨"이 아니라 "대량 수집 파이프라인 부재 + 레이트리밋"**. 해결책은 **배치 precompute**(아래 §3).

---

## 2. 핵심 원리 — 지표(Indicator) ETL + 축별 실측 합성

논문·플랫폼(SKT 지오비전, 나이스, 서울 골목상권)이 공통으로 쓰는 구조:

```
[원시 지표 수집(배치)] → data/indicators.json (롱포맷: dong·period·key·value·source)
        ↓ 정규화(비교군 Min-Max·역U·로그)
[축 합성] D1~D4 = 해당 축의 실측 지표 가중평균 (실측 없으면 유형평균 prior + provisional)
        ↓
[KLAI = .2·D1 + .3·D2 + .2·D3 + .3·D4] → scores.json (축별 provenance 플래그)
        ↓
지도/place = 합성 점수 (실측된 축은 진짜 색, 샘플 축은 배지)
```

**축별 provenance**: `{d1:"real", d2:"real", d3:"sample", d4:"partial"}` — 동마다 어느 축이 실측인지 노출. (스펙 §5 `IndicatorRaw` 롱포맷 + §8 2단계와 동일)

이러면 **한 지표씩 실측을 추가**할 때마다 해당 축이 자동으로 real로 승격 — "전부 한 번에"가 아니라 **점진적·정직한 전환**.

---

## 3. 레이트리밋 해결 — 배치 precompute (가장 중요)

| 기법 | 적용 | 효과 |
|---|---|---|
| **대용량 파일 1회 다운로드** | 건축물대장(세움터 open.eais.go.kr), BIG KINDS 뉴스(Excel ≤2만건) | API 스팸 없이 전국 일괄 |
| **일일한도 분산 배치** | 네이버 데이터랩·검색(일 한도) → 동을 N일에 나눠 nightly cron | 한도 내 전국 누적 |
| **resumable 인제스트** | 상권(`ingest:commerce` 이미 적용) | 중단·재개, 50동마다 저장 |
| **계층 해상도(tiered)** | 핫지역=실시간 갱신, 전국=주기 배치 | 비용·신선도 균형 |
| **CDN/모듈 캐시** | `mapdata` 레이어별 캐시(이미 적용) | 배포별 정적 |

→ 스케줄: GitHub Actions/Supabase cron (주간 갱신) + 수동 `npm run ingest:*`.

---

## 4. 축별 실측 소스 — 구체안 (논문·국내 데이터 매핑)

### D1 인구·지속성 (20%) — 🟢 일부 실측
- **인구·세대(KOSIS)** ✅ 완료(시군구). → **읍면동 인구·연령**: KOSIS `DT_1B04005N` 4만셀 제한 → 페이지네이션 배치.
- 순이동·소멸위험(고용정보원 소멸위험지수) 추가.

### D2 경제·상권 (30%) — 🟢 상권 실측 연결됨
- **상권(소진공 상가정보)** ✅ `ingest:commerce` (동별 상가수·업종 다양성=Shannon). 논문의 **POI 혼합도(Shannon/Simpson/Hill)** 와 동일 방식.
- **매출**: 서울 골목상권(golmok.seoul.go.kr, **오픈**)·BC카드 지역결제. (서울 먼저, 전국은 카드데이터랩)
- **창업/폐업·생존율**: LOCALDATA 인허가(개·폐업 일자) 배치.
- **임대/공실**: 부동산원 R-ONE ✅(상권단위, 동 매핑).

### D3 공간·물리 (20%) — 🔴 샘플 → 아래로 실측화
논문 표준 = **POI 혼합 + 가로망 + 접근성(2SFCA) + 스트리트뷰 시지각**.
- **건물 노후·용도혼합·밀도**: 건축물대장(건축HUB `15134735` API / **세움터 대용량 파일**) → 동별 평균 준공연도(노후), 주용도 분포(혼합 entropy), 연면적/대지(밀도). **법정동코드→adm_cd2 집계**.
- **자산가치**: 개별공시지가(data.go.kr) → **역U·포화**(스펙: 단조 가점 금지).
- **용도혼합**: 용도지역(국가공간정보포털 NSDI) entropy.
- **보행·접근성**: **2SFCA** — 지하철/버스 정류장 좌표(수도권 오픈) + 동 centroid → 대중교통 접근성. (보행환경은 다음)
- **(고급) 시각적 매력·안전**: **스트리트뷰 + 딥러닝(MIT Place Pulse/Streetscore 방식)** — 네이버/카카오 로드뷰 또는 Google Street View 이미지 → 사전학습 perception 모델(또는 멀티모달 LLM)로 안전·미관·활력 점수. 배치 추론 1회. = D3/D4 시지각 동시 기여.

### D4 인식·감성 (30%) — 🔴 샘플 → 아래로 실측화
- **뉴스·내러티브**: **BIG KINDS**(한국언론진흥재단) — 지역명 검색 → 기사량·논조·개체(지명) **Excel ≤2만건 일괄** + 토픽(내러티브 단계·진정성 갭). batch.
- **검색 관심**: 네이버 데이터랩(지역명 24개월 추세) — **일 한도 분산 배치**(동을 며칠에). 이미 on-demand 코드(`naver.ts`) 존재 → 배치 래퍼만.
- **소셜 버즈**: Apify 인스타 해시태그(핫지역 ✅) → 전국 확장. SerpApi 구글 글로벌 관심(해외 방문).
- **감성**: `lib/sentiment.ts` lexicon(있음) — 블로그·리뷰·뉴스 긍/부.

---

## 5. 데이터 모델 (추가)

```
data/
  indicators.json        # 롱포맷 [{admCd2, period, key, value, source, real}]  ← 신설(누적)
  commerce.json          # ✅ 상권 실측(이미 신설)
  building.json          # 건물 노후·용도·밀도 (D3)  ← 다음
  landprice.json         # 공시지가 (D3)
  sentiment.json         # 뉴스·검색·소셜 감성·버즈 (D4)  ← 다음
  .ingested.json         # 실연동된 소스 id 집합 (provenance 근거)
  scores.json            # 합성 점수 + 축별 provenance {d1,d2,d3,d4: real|partial|sample}
```

`lib/scoring.ts`에 **`composeScore(indicators, peerPrior)`** 추가: 실측 지표로 축 계산, 부족 시 유형평균 prior, 축별 real/sample 플래그 반환.

---

## 6. 단계별 로드맵 (각 = 상권 커넥터와 동일 난이도)

| 단계 | 작업 | 축 | 난이도 | 비고 |
|---|---|---|---|---|
| ✅ 0 | 상권 bulk(`ingest:commerce`) + 지도 레이어 | D2 | 완료 | adongCd=adm_cd2[:8] |
| 1 | **건축물대장 bulk** → 노후·용도혼합·밀도 | D3 | 중 | 세움터 대용량 파일, 법정동→adm_cd2 |
| 2 | **공시지가** → 자산(역U) | D3 | 중 | data.go.kr |
| 3 | **2SFCA 접근성**(역/정류장) | D3 | 중 | 좌표 오픈데이터 |
| 4 | **BIG KINDS 뉴스 bulk** → 기사·논조·토픽 | D4 | 중 | Excel ≤2만 batch |
| 5 | **데이터랩 검색 배치**(동 분산) | D4 | 중 | 일한도 분산 cron |
| 6 | **`composeScore`** — 실측 지표→D1~D4 합성, 축별 provenance | 전축 | 상 | 핵심 통합 |
| 7 | (고급) **스트리트뷰 딥러닝** 시지각 | D3·D4 | 상 | Place Pulse 방식, 배치 추론 |
| 8 | scoring **Python 파이프라인**(SHAP·토픽·백테스트) | 전축 | 상 | 스펙 Phase 5 |

→ 1~5는 각각 상권 커넥터(완료)와 같은 패턴 = 키 있음(`DATA_GO_KR_KEY`·BIG KINDS·네이버), 며칠 내 가능.
→ 6(composeScore)이 **"실데이터로만"을 향한 핵심** — 실측 지표가 모이면 축을 자동 승격.

---

## 7. 참고 (방법론 출처)
- 도시활력·POI 혼합도(Shannon/Simpson, 2SFCA): *Evaluating urban morphology on vitality (big geo-data)*; *Assessing urban vitality with POI reviews (Nature HSS Comm. 2025)*.
- 스트리트뷰 시지각: MIT **Place Pulse 2.0**(110,988장·56도시)·**Streetscore**(SVR); *Mapping human perception from street-view (deep learning)*.
- 국내 플랫폼: SKT 지오비전(유동인구 50m셀·카드매출), 나이스지니데이타, 서울 골목상권(오픈), 소진공 상권정보.
- 국내 데이터: 건축HUB(`data.go.kr/15134735`)·세움터(open.eais.go.kr 대용량)·BIG KINDS(bigkinds.or.kr)·국가공간정보포털(NSDI).
