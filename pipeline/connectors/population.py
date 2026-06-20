"""D1 인구·지속성 — 통계청 KOSIS 주민등록인구 + 한국고용정보원 소멸위험.

실데이터: KOSIS OpenAPI (https://kosis.kr/openapi) 주민등록 인구/세대, 국내인구이동.
반환: [{admCd2, year, totalPop, households, youthRatio, elderlyRatio, netMigration, changeRate}]
"""
from __future__ import annotations
from .. import common as c


KOSIS_URL = "https://kosis.kr/openapi/Param/statisticsParameterData.do"


def fetch(years: list[int] | None = None) -> list[dict]:
    if c.MOCK or not c.KOSIS_KEY:
        c.log("population: MOCK (data/demographics.json)")
        demo = c.read_seed("demographics.json")
        rows = []
        for adm, arr in demo["byPlace"].items():
            for d in arr:
                rows.append({c.ADM_KEY: adm, **d})
        return rows

    # 실데이터 경로 (예시 — 통계표 ID/분류코드는 KOSIS 콘솔에서 발급)
    import requests

    c.log("population: KOSIS OpenAPI")
    params = {
        "method": "getList",
        "apiKey": c.KOSIS_KEY,
        "format": "json",
        "jsonVErsion": "v2_1",
        "orgId": "101",            # 통계청
        "tblId": "DT_1B040A3",     # 주민등록인구(행정동) — 실제 tblId 로 교체
        # "objL1": "행정동코드들...", "prdSe": "Y", "startPrdDe": ..., "endPrdDe": ...
    }
    r = requests.get(KOSIS_URL, params=params, timeout=30)
    r.raise_for_status()
    raw = r.json()
    # TODO: KOSIS 응답 → adm_cd2 매핑 + 청년(20~39)/고령(65+) 비율 산출 + 순이동 결합
    return _normalize_kosis(raw)


def _normalize_kosis(raw) -> list[dict]:
    rows: list[dict] = []
    # raw 의 행을 행정동·연도로 피벗해 비율·순이동을 계산 (구현 시 채움)
    return rows
