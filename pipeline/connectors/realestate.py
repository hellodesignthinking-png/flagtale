"""D2-5·D2-6·D3-5 부동산 — 한국부동산원 R-ONE(임대동향·공실·수익률·거래현황) + 국토부 RTMS(실거래).

핵심(기획서 §3.3): 가격은 단조 가점 금지(로그+포화/역U), 거래량·공실은 '시장 활성도'로 분리.
반환: [{admCd2, period, key, value, source}]  (롱포맷 IndicatorRaw)
  key 예: assetValue, rentBurden, vacancyRate, txVolume, vacancyDays, permits → marketVitality 분류
해상도: 임대동향=상권/시도 → 동 매핑 테이블 필요. 실거래·공시지가=필지 → 동 집계.
"""
from __future__ import annotations
from .. import common as c


def fetch(periods: list[str] | None = None) -> list[dict]:
    if c.MOCK or not (c.RONE_KEY or c.RTMS_KEY):
        c.log("realestate: MOCK (scores.json 의 시장활성도/예산 신호 재사용)")
        scores = c.read_seed("scores.json")
        rows = []
        for adm, series in scores["byPlace"].items():
            for s in series:
                rows.append({c.ADM_KEY: adm, "period": s["period"], "key": "marketVitality",
                             "value": {"active": 1, "stable": 0, "shrinking": -1}[s["marketVitality"]],
                             "source": "mock"})
        return rows

    c.log("realestate: R-ONE + RTMS")
    # TODO: R-ONE 임대동향(공실률·임대가격지수·수익률) + 부동산거래현황(거래량) + RTMS(실거래)
    #       → 상권/필지 → adm_cd2 매핑 → 활발/정체/위축 분류기. (기획서 §3.3-D)
    return []
