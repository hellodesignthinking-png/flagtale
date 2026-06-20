"""오케스트레이터 — 인제스천 → 점수 → 진단 → upsert (빌드 스펙 §8·§9, Phase 5).

  python -m pipeline.run                # MOCK (시드 흐름 시연, DRY-RUN upsert)
  PIPELINE_MOCK=0 python -m pipeline.run # 실데이터 (각 API 키 필요)

스케줄: .github/workflows/data-refresh.yml (월/분기), weekly-report.yml (주간).
"""
from __future__ import annotations
from . import common as c, scoring, diagnosis, upsert
from .connectors import population, procurement, realestate, commerce_social, boundary


def main():
    c.log(f"start (MOCK={c.MOCK})")

    # 1) 인제스천 (행정동 집계)
    demo = population.fetch()
    proc = procurement.fetch()
    _ = realestate.fetch()
    _ = commerce_social.fetch_commerce()
    _ = commerce_social.fetch_social()
    _ = commerce_social.fetch_news()
    places = boundary.fetch()

    # 2) 점수 합성 + 3) 진단
    score_rows = scoring.build(mock=c.MOCK)
    diag_rows = diagnosis.build(mock=c.MOCK)

    # 4) 저장 (Supabase service-role, 키 없으면 DRY-RUN)
    upsert.places([{c.ADM_KEY: p[c.ADM_KEY], "name": p["name"]} for p in places])
    upsert.demographics(demo)
    upsert.procurement(proc["records"])
    upsert.scores(score_rows)
    upsert.diagnoses(diag_rows)

    c.log(f"done — 점수 {len(score_rows)} · 진단 {len(diag_rows)} · 인구 {len(demo)} · 조달 {len(proc['records'])}")
    c.log("실데이터 전환: PIPELINE_MOCK=0 + 각 OpenAPI 키 + SUPABASE_SERVICE_ROLE_KEY")


if __name__ == "__main__":
    main()
