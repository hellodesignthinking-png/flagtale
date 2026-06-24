# AGENTS.md — Flagtale 코딩 에이전트 하네스

> 이 파일은 **목차(map)** 다 — 백과사전이 아니다. 깊은 내용은 `docs/`가 진실의 원천(system of record).
> 모든 규칙은 *실제로 무언가 잘못된 경험*에서 나왔다(OpenAI harness-engineering 원칙). 새 함정을 만나면 여기/`docs/golden-principles.md`에 한 줄 추가하라.

## 0. 한 줄 정체성
**Flagtale** = 가장 로컬다운 여행 플랫폼(소비자: 발견·경험·플래그맵·허브) + **Flagtale Lab** = 그 데이터 분석 부문(매력도 지도·리포트·지번 진단). 하나의 Next.js 앱, 하나의 careet 라이트 디자인. 프로덕션: https://flatalelocal.vercel.app

## 1. 작업 전 필수 — 검증 루프
```bash
npm run verify     # tsc --noEmit && next build  ← 커밋/배포 전 반드시 통과
npm run dev        # 로컬 (localhost:3000)
```
- **UI 변경은 눈으로 검증하라.** 인앱 프리뷰 탭은 백그라운드 스로틀로 **WebGL·dynamic 청크가 안 뜬다** → 헤드리스(`docs/deploy-and-verify.md`) 또는 DOM 조회로 검증. ([[golden-principles]] #PREVIEW)
- 배포: `npx vercel --prod --yes --archive=tgz` — **`--archive=tgz` 필수**. ([[deploy-and-verify]])

## 2. 골든 프린시플 (어기면 깨진 경험 있음 — 전체: `docs/golden-principles.md`)
1. **시크릿은 서버 전용** — `.env.local`(gitignore). 브라우저 노출은 `NEXT_PUBLIC_*`만.
2. **가짜 데이터 금지** — 샘플/큐레이션은 `샘플/잠정(Provisional)` 배지 필수. 검색 링크는 실제만, 기사 날조 금지.
3. **`unstable_cache` + `no-store` fetch = prod서 조용히 빈 `{}`** → 커넥터 인메모리 캐시 + 라우트 CDN `s-maxage`로 대체. ([[golden-principles]] #CACHE)
4. **지도/WebGL(maplibre·deck.gl·Naver)은 브라우저 전용** → `dynamic(ssr:false)` + `DEFAULT_MAP_STYLE`에 `FALLBACK_MAP_STYLE` 폴백. HTML 마커는 GPU 없어도 위치되지만 베이스맵 타일은 GPU 필요.
5. **careet 디자인 토큰** — `app/globals.css`의 `.theme-light`. 라임 `--amber #d9f21e`는 **채움 전용**, 텍스트 강조는 `--blue-l #4d7c0f`. 보더 1.5px `--line #ececE6`, ink `#131316`. ([[design-system]])
6. **브랜드**: 마스트헤드=**Flagtale**(상위). **KLAI는 브랜드 아님** — 매력도 점수 지표명. 리포트=Flagtale Weekly/Annual.
7. **PDF는 서버(Playwright)만** — 웹진 HTML에 `window.print()`·인쇄 버튼 금지.
8. **표준 키 `adm_cd2`**(행안부 10자리). 통계청 8자리·PNU 매핑 유지.
9. **목업 우선** — 점수·진단은 `data/*.json` 시드(결정론). 실데이터는 커넥터로 점증.
10. **git 락 재발**(디스크 불안정) → 커밋 전 `rm -f .git/index.lock`. 0바이트·널 파일 스캔으로 손상 점검.

## 3. 디렉터리 지도
- `app/` — App Router 라우트(소비자: `/discover`·`/map-tale`·`/hub`; Lab: `/map`·`/reports`·`/diagnose`·`/place/[admCd]`·`/methodology`·`/data`·`/brand`·`/dashboard`). `api/` 라우트 핸들러.
- `components/` — `landing/`(랜딩·3D맵·신호), `flagtale/`(소비자·콘텐츠맵), `map/`(Lab 전국지도 MapExplorer), `charts/`, `report/`, `analysis/`, `methodology/`.
- `lib/` — `data.ts`(시드 로더), `flagtale.ts`/`flagtale-types.ts`(소비자 데이터), `signals.ts`/`signalGen.ts`(신호 동조), `narratives.ts`(핫지역 서사), `scoring.ts`/`diagnosis*`, `connectors/`(네이버 등 실데이터), `constants.ts`(맵 스타일·레이어).
- `data/` — 시드 JSON(`scores`·`diagnoses`·`districts.geojson`·`flagtale/*`·`festivals`).
- `docs/` — **진실의 원천**(아래) + 기획서·시스템맵·빌드스펙.

## 4. docs/ (진실의 원천)
- [architecture.md](docs/architecture.md) — 라우트·데이터 흐름·맵 컴포넌트 3종·Flagtale↔Lab 통합.
- [golden-principles.md](docs/golden-principles.md) — 함정 전체 목록(근거 포함).
- [deploy-and-verify.md](docs/deploy-and-verify.md) — Vercel 배포 + 헤드리스 검증법(프리뷰 스로틀 우회).
- [design-system.md](docs/design-system.md) — careet 토큰·컴포넌트.
- [data-and-content.md](docs/data-and-content.md) — 시드·커넥터·실데이터 연동 상태.
- 빌드 스펙: [CLAUDE.md](CLAUDE.md) (전체 제품 사양). 기획서: `docs/K-로컬매력도지수_기획서.md`.

## 5. 미연동(키 필요 — 추가 시 활성)
- **네이버 지도 타일**: NCP Maps `ncpClientId`(도메인 등록) → `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID`. 없으면 maplibre 폴백. ([[deploy-and-verify]])
- Supabase(인증·DB)·PortOne(결제)·Resend(메일)·YouTube — 키 추가 시 활성. 현재 데모/시드.
