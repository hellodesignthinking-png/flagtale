"""공공조달 흐름 — 조달청 나라장터 OpenAPI (입찰공고 + 수의계약).

실데이터: 공공데이터포털 '나라장터 입찰공고정보'·'낙찰정보' / 조달청 계약현황.
  - 입찰공고:  https://apis.data.go.kr/1230000/BidPublicInfoService...
  - 수의계약:  계약현황 서비스(수의계약 구분)
지역 매핑: 공고기관/수요기관 주소 → 행정동(adm_cd2) 지오코딩 후 집계.
반환:
  annual:  [{admCd2, year, bid, sole, total, count, byCategory}]   (만원)
  records: [{admCd2, year, type, category, title, amount, agency}]
"""
from __future__ import annotations
from .. import common as c

G2B_BID_URL = "https://apis.data.go.kr/1230000/BidPublicInfoService05/getBidPblancListInfoServc"
CATEGORIES = ["행사·축제", "문화·관광", "도시재생·시설", "복지·돌봄", "용역·연구", "환경·안전"]


def fetch(years: list[int] | None = None) -> dict:
    if c.MOCK or not c.G2B_KEY:
        c.log("procurement: MOCK (data/procurement.json)")
        proc = c.read_seed("procurement.json")
        annual, records = [], []
        for adm, p in proc["byPlace"].items():
            for a in p["annual"]:
                annual.append({c.ADM_KEY: adm, **a})
            for rec in p["records"]:
                records.append({c.ADM_KEY: adm, **rec})
        return {"annual": annual, "records": records, "categories": proc["categories"]}

    c.log("procurement: 나라장터 OpenAPI")
    records = _fetch_bids(years or list(range(2016, 2027)))
    annual = _aggregate(records)
    return {"annual": annual, "records": records, "categories": CATEGORIES}


def _fetch_bids(years: list[int]) -> list[dict]:
    import requests

    out: list[dict] = []
    for y in years:
        params = {
            "serviceKey": c.G2B_KEY,
            "pageNo": 1, "numOfRows": 999, "type": "json",
            "inqryDiv": 1,
            "inqryBgnDt": f"{y}0101", "inqryEndDt": f"{y}1231",
            # "ntceInsttCd"/"dminsttCd" 로 지역 기관 필터
        }
        try:
            r = requests.get(G2B_BID_URL, params=params, timeout=30)
            r.raise_for_status()
            items = r.json().get("response", {}).get("body", {}).get("items", [])
        except Exception as e:  # noqa: BLE001
            c.log(f"  {y} 조회 실패: {e}")
            items = []
        for it in items:
            out.append(_map_item(it, y))
    return out


def _map_item(it: dict, year: int) -> dict:
    # TODO: 기관주소 → adm_cd2 지오코딩, 사업명 → category 분류(키워드/분류기)
    title = it.get("bidNtceNm", "")
    return {
        c.ADM_KEY: "",  # 지오코딩 결과로 채움
        "year": year,
        "type": "bid",
        "category": _classify(title),
        "title": title,
        "amount": int(float(it.get("presmptPrce", 0)) / 10000),  # 원→만원
        "agency": it.get("dminsttNm", ""),
    }


def _classify(title: str) -> str:
    kw = {
        "행사·축제": ["축제", "행사", "페스티벌", "한마당"],
        "도시재생·시설": ["도시재생", "정비", "공사", "조성", "주차장", "리모델링"],
        "복지·돌봄": ["돌봄", "경로", "복지", "급식"],
        "용역·연구": ["용역", "연구", "계획", "조사"],
        "문화·관광": ["관광", "문화", "경관", "벽화"],
        "환경·안전": ["CCTV", "방범", "하천", "환경", "안전"],
    }
    for cat, words in kw.items():
        if any(w in title for w in words):
            return cat
    return "용역·연구"


def _aggregate(records: list[dict]) -> list[dict]:
    agg: dict[tuple, dict] = {}
    for r in records:
        k = (r[c.ADM_KEY], r["year"])
        a = agg.setdefault(k, {c.ADM_KEY: r[c.ADM_KEY], "year": r["year"], "bid": 0, "sole": 0,
                              "total": 0, "count": 0, "byCategory": {c2: 0 for c2 in CATEGORIES}})
        amt = r["amount"]
        a["bid" if r["type"] == "bid" else "sole"] += amt
        a["total"] += amt
        a["count"] += 1
        a["byCategory"][r["category"]] = a["byCategory"].get(r["category"], 0) + amt
    return list(agg.values())
