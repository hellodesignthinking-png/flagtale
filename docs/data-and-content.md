# 데이터 & 콘텐츠

## 시드 (목업 우선 · `data/`)
- `scores.json` — 동별 4축·KLAI·모멘텀·젠트리·시장활성도 시계열(2016~2026). `lib/data.ts loadScores`.
- `diagnoses.json` — 동별 진단(추세·젠트리·내러티브·전략). narrativeTheme은 generic 4종(핫지역 서사는 `lib/narratives.ts` 큐레이션).
- `districts.geojson` — 행정동 경계(간소화). 실경계는 `boundaries/admdong.simplified.geojson`(`NEXT_PUBLIC_BOUNDARY_SOURCE=real`).
- `demographics.json`(KOSIS 인구 실데이터)·`procurement.json`(샘플)·`reports.json`(Flagtale Weekly/Annual).
- **소비자** `data/flagtale/` — `creators`·`tours`·`stays`·`spots`·`basecamps`·`flag_pass_products`(원본 SQLite 시드 덤프) + `festivals.json`(실제 한국 지역축제 큐레이션). 이미지 `public/flagtale/`.

## 로더 (`lib/`)
- `data.ts` — 시드 로더(모듈 캐시) + `getPlace`·`nationalSignalAverage`·`getRegionComparison`·`getPeerAvg`.
- `flagtale.ts`(서버) — `loadCreators/Tours/Stays/Spots/Basecamps/FlagPasses/Festivals` + `buildMapItems()`(콘텐츠맵 통합 포인트). 타입·`MAP_CATS`·`SPOT_CAT`·`catMeta`·`REGION_CENTROID`는 `flagtale-types.ts`(클라 공용).
- `signalGen.ts` — 동 점수 → 신호 시계열(결정론, 아키타입별 선행순서 차별화). `signals.ts` — 동조도·선행성·패턴·검증.
- `narratives.ts` — 핫지역 16곳 서사(단계·이야기·궤적·진정성). 동명 매칭 `getAreaNarrative`.

## 실데이터 연동 상태
| 소스 | 상태 | 비고 |
|---|---|---|
| 행정동 경계(vuski) | 실데이터 | adm_cd2 |
| 인구·세대(KOSIS) | 실데이터 | 시군구·연. `demographics.json` |
| 네이버 검색·기사·트렌드 | 실데이터 | `lib/connectors/naver.ts`. `NAVER_CLIENT_ID/SECRET`(검색 API). 라우트 `/api/trending-locals`·`/api/local-detail` |
| 소진공 상권·부동산원 임대·문화·앵커·VWorld | 진단 온디맨드 | `/api/diagnose` |
| 공공예산·KLAI 4축 점수 | **샘플** | 배지 노출 |
| 축제·투어 좌표 | 큐레이션·지역중심(잠정) | `festivals.json`·`REGION_CENTROID` |

## 커넥터 주의 (golden #CACHE)
- `unstable_cache` + `no-store` fetch = prod서 조용히 빈 `{}` → 커넥터 모듈 스코프 Map 캐시 + 라우트 `s-maxage`로 대체.
- 네이버 트렌드는 5-group 배치(버스트 안전), 뉴스 12 병렬. 빈 결과면 throw(캐시 실패 회피).
- 키 테스트: `npm run check-apis` (env 주의 — 서버 전용).

## API 키 (`.env.local` — 서버 전용)
`NAVER_CLIENT_ID/SECRET`(검색), `NEXT_PUBLIC_MAP_STYLE_URL`(maplibre). 미설정: `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID`(네이버 타일), Supabase·PortOne·Resend·YouTube. 추가 시 해당 기능 활성.
