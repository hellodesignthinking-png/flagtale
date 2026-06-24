# Golden Principles — 함정과 규칙 (근거 포함)

> OpenAI harness-engineering 원칙: **모든 규칙은 실제로 무언가 잘못된 경험에서 나온다.** 새 함정을 만나면 근거와 함께 한 줄 추가하라.

## 데이터 · 캐시
- **#CACHE — `unstable_cache`가 `no-store` fetch를 감싸면 prod서 조용히 빈 `{}`를 반환한다.**
  - 증상: 로컬·단건은 정상, prod서만 0건(응답이 비정상적으로 빠름). 디버그 우회(캐시 미적용) 시 정상.
  - 해결: `unstable_cache` 제거 → 커넥터 모듈 스코프 인메모리 Map 캐시 + 라우트 핸들러 `s-maxage` CDN 캐시. (`lib/connectors/*`, `app/api/*/route.ts`)
- **목업 우선** — 점수·진단은 `data/*.json` 시드(결정론, `Math.random` 금지 — 빌드 일관성). `lib/signalGen.ts`는 `Math.sin` 기반 의사난수.
- **가짜 데이터 금지** — 큐레이션/샘플은 `샘플/잠정(Provisional)` 배지. 검색은 실제 링크만(`map.naver.com/v5/search/...`), 기사·후기 날조 금지. (`components/landing/TrendingLocals`, `data/flagtale/festivals.json`)
- **표준 키 `adm_cd2`**(행안부 10자리). 통계청 `adm_cd`(8자리)·법정동 PNU 매핑 유지.

## 지도 · WebGL
- **#PREVIEW — 인앱 프리뷰 탭(백그라운드)은 rAF·WebGL·dynamic 청크를 스로틀**해 maplibre/recharts/dynamic이 "로딩…"에서 멈춘다. 코드 버그 아님.
  - 검증: 헤드리스 크로미움(`docs/deploy-and-verify.md`) 또는 `preview_eval` DOM 조회. 스크린샷만 믿지 말 것.
- 지도(maplibre·deck.gl·Naver)는 **브라우저 전용** → `dynamic(() => import(...), { ssr:false })`. (`*Mount.tsx` 패턴)
- 베이스맵: `DEFAULT_MAP_STYLE`(CartoDB dark, 키 불필요) + 실패 시 `map.on("error")` → `FALLBACK_MAP_STYLE`(오프라인 다크 배경). HTML 마커는 GPU 없어도 위치되지만 타일은 GPU 필요(헤드리스서 흰 화면).
- 맵 컴포넌트 3종: Lab 전국 choropleth=`components/map/MapExplorer`(deck.gl GeoJsonLayer), 랜딩 3D=`components/landing/LandingHero3DMap`(ColumnLayer), 소비자 콘텐츠=`components/flagtale/FlagtaleMapExplorer`(네이버지도형 마커+패널).

## CSS · 레이아웃
- **#CALC — Tailwind 임의값 `h-[calc(100vh-3.5rem)]`는 무효** → `-`/`+` 양옆에 공백 필요한데 임의값은 공백을 `_`로 써야 함: `h-[calc(100vh_-_3.5rem)]`. 잘못 쓰면 `height: calc(100vh-3.5rem)`(무효 CSS) → 무시 → 높이 0. **증상**: absolute inset-0 자식만 있는 섹션이 0px → 지도/콘텐츠가 흰 화면(자산은 다 로드됨). 풀스크린 맵이 안 보이면 이걸 의심.
- 풀스크린 지도 컨테이너: 섹션 `relative` + 명시 높이, 맵 컴포넌트 루트 `absolute inset-0`(% 높이 체인보다 견고).
- **#NAVERMAP — 네이버 지도 SDK는 컨테이너 div에 `position:relative`를 강제 주입** → 컨테이너가 `absolute inset-0`이면 `inset`(top/bottom) 높이가 무효화돼 **높이 0으로 붕괴 → 흰 화면**. 지도 div는 `h-full w-full`(명시 높이)로 둘 것(부모는 `absolute inset-0`로 높이 확보). 증상: 콘솔 에러 0·타일 로드됨·루트는 높이 있는데 지도만 안 보임.
- **Naver/maplibre 지도는 init 시 컨테이너 크기를 캐시** — 컨테이너가 늦게 커지면 타일/마커가 0크기 기준 배치. init 후 `naver.maps.Event.trigger(map,"resize")` / `map.resize()` 호출.
- 스크립트: 신규 NCP 키 = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=<ID>`. 401 = 도메인 미등록(콘솔 Web URL에 정확한 origin 추가). Client ID만 노출(NEXT_PUBLIC), Secret은 JS 지도에 불필요.
- **거리뷰(파노라마)는 `&submodules=panorama` 필요** → `naver.maps.Panorama(el,{position,pov})`. 파노라마는 **이미지 타일이라 GPU 없이(헤드리스) 렌더됨**(WebGL 타일맵과 다름). 좌표에 커버리지 없으면 인접 도로로 스냅.
- **헤드리스 검증 시 마커/배지 HTML은 인라인 style 문자열 셀렉터(`[style*="..."]`)가 안 잡힐 수 있음**(브라우저가 `border-radius:50%`→`border-radius: 50%` 재직렬화). 화면 스크린샷으로 최종 확인.

## 디자인 · 브랜드
- **careet 토큰**(`app/globals.css` `.theme-light`): 라임 `--amber #d9f21e`=**채움 전용**(큰 라임 텍스트 가독성 나쁨), 텍스트 강조=`--blue-l #4d7c0f`. `--on-accent #1c2b02`, ink `#131316`, line 1.5px `#ececE6`, card2 `#f5f6f0`. 폰트 Pretendard(본문)+Poppins(디스플레이/숫자 `font-display`). 다크는 `:root`(/map 등).
- **브랜드**: Flagtale(상위 플랫폼) / Flagtale Lab(데이터 랩). **KLAI = 매력도 점수 지표명, 브랜드 아님.** 리포트=Flagtale Weekly / Flagtale Annual.
- **PDF는 서버(Playwright)만.** 웹진/리포트 HTML에 `.pdf-bar`·`window.print()`·인쇄 버튼 금지.
- 등급 발산 스케일 6단계(낙인·시세표화 방지). 부동산은 역U·포화(단조 가점 금지).

## 배포 · 운영
- **배포: `npx vercel --prod --yes --archive=tgz` — `--archive=tgz` 필수**(없으면 실패/누락).
- **alias 전파 대기** — 배포 직후 prod가 stale일 수 있음. 25~60s 대기 후 검증.
- **git 락 재발**(디스크 불안정) → 커밋 전 `rm -f .git/index.lock`. 파일 손상 이력 → 0바이트·널 스캔, 트랜스크립트/git/seed로 복구.
- **시크릿 서버 전용** `.env.local`. `NEXT_PUBLIC_*`만 브라우저. 결제는 서버 검증/웹훅 필수.
- macOS 코드서명 정책으로 `better-sqlite3` 네이티브 바인딩 로드 차단 → SQLite는 `sqlite3` CLI 사용.

## Next.js 14 주의
- 이 프로젝트는 **Next 14.2** — `searchParams`는 동기(Next 16 `await searchParams` 권고는 비적용). 훅이 권하는 next/font·cache-components 마이그레이션은 별도 합의 전 적용 금지.
