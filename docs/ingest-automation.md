# 실데이터 인제스트 자동화 (GitHub Actions)

월 1회(+수동) 실데이터를 받아 `data/*.json`을 갱신하고, 변경분이 있으면 커밋 후 Vercel에 재배포한다.
워크플로: [`.github/workflows/data-refresh.yml`](../.github/workflows/data-refresh.yml).

## 왜 GitHub Action인가 (Vercel Cron 아님)
매력도 데이터는 **정적 파일**(`data/scores.json`·`demographics.json` 등)이고 앱이 빌드/런타임에 이 파일을 읽는다.
Vercel 서버리스 함수는 **파일시스템이 읽기 전용**이라 이 파일들을 재생성·커밋할 수 없다.
따라서 "스크립트 실행 → 데이터 파일 갱신 → 커밋 → 재배포"는 **CI 러너(GitHub Action)**가 맡는다.

## 동작
1. `node scripts/build-population.mjs --write` — KOSIS 인구 → `demographics.json`·`scores.json` 실데이터 갱신 (검증된 경로)
2. `npm run ingest` — 키가 설정된 다른 소스 인제스트 + `.ingested.json` 갱신 (키 없으면 자동 스킵)
3. `data/` 변경분이 **있을 때만** 커밋·푸시
4. 변경 시에만 `vercel --prod` 프로덕션 배포

## 1회 설정 (활성화)
현재 이 레포에는 **git 리모트가 없다**. Action이 돌려면 GitHub에 올려야 한다.

```bash
# 1) GitHub 레포 생성 후 연결·푸시
git remote add origin https://github.com/<당신>/flatale_local.git
git push -u origin main
```

```
# 2) GitHub → 레포 → Settings → Secrets and variables → Actions 에 추가
KOSIS_API_KEY        # 필수(인구 실데이터) — kosis.kr/openapi
VERCEL_TOKEN         # 필수(배포) — vercel.com/account/tokens
# 선택(구현된 소스만 효과): G2B_API_KEY · RTMS_API_KEY · LOCALDATA_API_KEY ·
#                          RONE_API_KEY · BIGKINDS_API_KEY · NAVER_CLIENT_ID · NAVER_CLIENT_SECRET
```

> 프로젝트 식별자(`VERCEL_ORG_ID`·`VERCEL_PROJECT_ID`)는 워크플로에 이미 박혀 있어 토큰만 추가하면 된다.

## 실행
- **자동**: 매월 1일 03:00 KST
- **수동**: GitHub → Actions → "데이터 갱신…" → **Run workflow**

## IP 주의
- GitHub 러너는 **미국 IP**. **KOSIS·Naver·data.go.kr**는 미국에서도 동작 → 인제스트 OK.
- **VWorld 지오코딩만** 한국 IP 필요한데, 이는 *런타임* 진단용(`/api/geocode`)이라 인제스트 대상이 아니다. (런타임은 Vercel `icn1` 리전에서 처리 — `vercel.json`)

## 더 넓은 인제스트 (선택)
`pipeline/`(Python: 상권·매출·임대·소셜·SHAP/토픽 등 Phase 5)은 별도 파이프라인이다.
완성되면 워크플로에 `setup-python` + `python -m pipeline.run` 스텝을 추가하면 된다(키는 동일 Secrets 재사용).
현재 자동화는 검증된 Node 경로(KOSIS 인구) 중심이며, 커넥터가 구현되는 대로 자동으로 함께 갱신된다.
