# 배포 & 검증

## 배포 (Vercel)
```bash
npm run verify                              # tsc + build (반드시 선행)
rm -f .git/index.lock 2>/dev/null          # 디스크 불안정 대비
npx vercel --prod --yes --archive=tgz      # --archive=tgz 필수
```
- 출력의 `Aliased: https://flatalelocal.vercel.app` + `readyState: READY` 확인.
- **배포는 로컬 파일 기준**(--archive=tgz)이라 git 커밋과 별개. 커밋은 사용자가 요청할 때만.
- alias 전파에 시간차 있음 → 25~60s 대기 후 prod 검증(아래).

## 프로덕션 빠른 검증 (curl)
SSR HTML 마커로 확인(클라 렌더 컴포넌트는 HTML에 없음에 유의):
```bash
H=$(curl -s -L https://flatalelocal.vercel.app/ -H 'Cache-Control: no-cache')
echo "$H" | grep -o "Flagtale<span"   # 브랜드 등 마커 grep
```

## 시각 검증 — 인앱 프리뷰 한계 & 헤드리스 우회
**인앱 프리뷰 탭은 백그라운드 스로틀**로 maplibre/WebGL/dynamic 청크가 "로딩…"에서 멈춘다(코드 버그 아님 — `golden-principles.md #PREVIEW`). 지도·차트는 아래 헤드리스로 실검증한다.

### 헤드리스 크로미움 (검증 전용 — 끝나면 정리)
ms-playwright 캐시에 크로미움이 있다(`~/Library/Caches/ms-playwright/chromium_headless_shell-1208`). 버전 불일치는 `executablePath` 직접 지정으로 우회:
```bash
npm i -D playwright-core@1.49.1        # 검증 후 npm un playwright-core
```
```js
// verify.mjs (프로젝트 루트에서 실행 — node_modules 해석)
import { chromium } from "playwright-core";
const EXEC = "/Users/TaiNa0/Library/Caches/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-mac-arm64/chrome-headless-shell";
const b = await chromium.launch({ headless: true, executablePath: EXEC });
const p = await b.newPage({ viewport: { width: 1366, height: 820 } });
await p.goto("https://flatalelocal.vercel.app/map-tale", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(8000);
console.log(await p.evaluate(() => ({
  markers: document.querySelectorAll(".maplibregl-marker").length,
  loading: /로딩…/.test(document.body.textContent || ""),
})));
await p.screenshot({ path: "/tmp/shot.png" });   // Read 툴로 이미지 확인
await b.close();
```
- **주의**: 헤드리스엔 GPU가 없어 **WebGL 베이스맵 타일이 흰색**으로 나온다(마커·DOM·패널은 정상 렌더). 다크 지도+핀의 실제 페인트는 사용자 실브라우저에서 확인(라이브 Lab 맵과 동일 엔진이라 정상).
- DOM 카운트(`.maplibregl-marker`, 패널 텍스트)와 클릭 상호작용으로 기능을 검증하고, 패널·리스트·상세는 스크린샷으로 확인.
- 끝나면 `rm verify.mjs && npm un playwright-core` 로 정리(레포에 남기지 말 것).

## 네이버 지도 타일 활성화 (미연동)
실제 네이버 지도 타일을 쓰려면 NCP Maps 클라이언트 ID가 필요(현재 maplibre 폴백):
1. console.ncloud.com → AI·NAVER API / Maps → Application 등록 → **Web 서비스 URL에 `https://flatalelocal.vercel.app` 등록**.
2. 발급된 **Client ID**를 Vercel env `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID`에 추가(+ `.env.local`).
3. 키 존재 시 `FlagtaleMapMount`가 Naver Maps v3로 전환(없으면 maplibre 폴백).
- env `NAVER_CLIENT_ID/SECRET`은 **검색 API(Developers)** 용 — Maps와 별개(혼동 금지).
