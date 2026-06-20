# KLAI 데이터 파이프라인 (Phase 5)

공공데이터(구조축) + 소셜·언론(인식축) + 자체자산을 **행정동(adm_cd2)** 으로 집계해 점수·진단을 산출하고 Supabase 에 upsert 한다. 기획서 §6·§8, 빌드 스펙 §9.

## 빠른 실행

```bash
pip install -r pipeline/requirements.txt

# 목업 흐름 시연 (시드 JSON → DRY-RUN upsert) — 키 불필요
python -m pipeline.run

# 실데이터 (각 OpenAPI 키 + Supabase service-role 필요)
PIPELINE_MOCK=0 \
KOSIS_API_KEY=... G2B_API_KEY=... RONE_API_KEY=... RTMS_API_KEY=... \
LOCALDATA_API_KEY=... BIGKINDS_API_KEY=... NAVER_CLIENT_ID=... NAVER_CLIENT_SECRET=... \
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
python -m pipeline.run
```

## 구조

```
pipeline/
├─ common.py            # 설정·키·MOCK·시드 로더
├─ connectors/
│  ├─ population.py     # 통계청 KOSIS 주민등록·이동 → D1 (인구 장기이력)
│  ├─ procurement.py    # 조달청 나라장터 입찰·수의계약 → 공공예산 흐름
│  ├─ realestate.py     # 부동산원 R-ONE(공실·수익률·거래) + RTMS → D2-5/D2-6/D3-5
│  ├─ commerce_social.py# LOCALDATA·소진공(D2) · 네이버·BIGKINDS(D4)
│  └─ boundary.py       # admdongkor/SGIS 경계 → PostGIS geom
├─ scoring.py           # 정규화 → 합성 → 모멘텀 → 젠트리 G (기획서 §4)
├─ diagnosis.py         # SHAP·Granger·DiD·Moran's I·토픽모델 (기획서 §5)
├─ upsert.py            # Supabase PostREST 업서트 (service-role)
└─ run.py               # 오케스트레이터
```

## 소스 ↔ 산출 (스펙 §9)

| 커넥터 | 소스 | 산출 |
|---|---|---|
| population | KOSIS, 고용정보원 소멸위험 | D1 · 인구 장기이력 |
| procurement | 조달청 나라장터(입찰·수의계약) | 공공예산 유입 흐름 · DiD 정책 ROI 입력 |
| realestate | 부동산원 R-ONE, 국토부 RTMS | D2-5·D2-6 시장활성도(거래·공실), D3-5 자산가치 |
| commerce_social | LOCALDATA·소진공 / 네이버·BIGKINDS | D2 다양성·생존, D4 감성×버즈×확산 |
| boundary | vuski/admdongkor·SGIS | Place.geom (PostGIS) |

## 진단 (diagnosis.py)

- **SHAP** 기여요인 Top3 · **Granger** 선행성(젠트리 체인) · **DiD** 공공예산 투입 순효과(§5.7)
- **Moran's I** 젠트리 풍선효과 · **토픽모델** 내러티브 주제·진정성 갭
- 백테스트: 성수·연남·가로수길 등 알려진 사례로 단계·궤적 역검증

## 스케줄

`.github/workflows/data-refresh.yml`(데이터 갱신) · `weekly-report.yml`(주간 리포트 발행) — GitHub Actions cron. Supabase cron 으로도 대체 가능.
