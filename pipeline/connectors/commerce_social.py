"""D2 경제·상권 + D4 인식·감성 커넥터.

commerce: LOCALDATA(지방행정인허가) 창업·폐업, 소진공 상권정보 → 다양성(Shannon)·생존율.
social:   네이버 데이터랩 검색량, 썸트렌드/리뷰 감성 → 긍정비율×버즈 (야놀자식 곱셈).
news:     BIG KINDS 뉴스 + belocal 미디어 아카이브 → 미디어·확산, 내러티브 토픽.
반환: [{admCd2, period, key, value, source}]
"""
from __future__ import annotations
from .. import common as c


def fetch_commerce(periods=None) -> list[dict]:
    if c.MOCK or not c.LOCALDATA_KEY:
        c.log("commerce: MOCK (scores.json d2)")
        return _mock_axis("d2", "commerce")
    c.log("commerce: LOCALDATA + 소진공")
    # TODO: 인허가 신규/폐업 → 생존율·폐업률, 업종 분포 → Shannon 다양성·Herfindahl·LQ
    return []


def fetch_social(periods=None) -> list[dict]:
    if c.MOCK or not (c.NAVER_ID and c.NAVER_SECRET):
        c.log("social: MOCK (scores.json d4)")
        return _mock_axis("d4", "social")
    c.log("social: 네이버 데이터랩 + 감성분석")
    # TODO: 긍정비율(4-1) × [버즈비율(4-2)+확산(4-3)]  (기획서 §4 Step2)
    return []


def fetch_news(periods=None) -> list[dict]:
    if c.MOCK or not c.BIGKINDS_KEY:
        c.log("news: MOCK")
        return []
    c.log("news: BIGKINDS + belocal 아카이브")
    # TODO: 기사 수·논조 + 토픽모델(내러티브 주제) + 진정성 갭
    return []


def _mock_axis(axis: str, source: str) -> list[dict]:
    scores = c.read_seed("scores.json")
    rows = []
    for adm, series in scores["byPlace"].items():
        for s in series:
            rows.append({c.ADM_KEY: adm, "period": s["period"], "key": axis, "value": s[axis], "source": source})
    return rows
