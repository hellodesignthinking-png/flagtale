"""행정동 경계/공간 — vuski/admdongkor · SGIS GeoJSON.

웹 성능 위해 mapshaper 간소화는 JS 스크립트(scripts/fetch-boundaries.mjs)에서 처리.
여기서는 Place 테이블의 geom(PostGIS) upsert 용 폴리곤을 준비한다.
"""
from __future__ import annotations
from .. import common as c


def fetch() -> list[dict]:
    # 간소화 경계가 있으면 사용, 없으면 샘플 districts.geojson
    real = c.DATA / "boundaries" / "admdong.simplified.geojson"
    path = real if real.exists() else (c.DATA / "districts.geojson")
    c.log(f"boundary: {path.name}")
    import json
    with open(path, encoding="utf-8") as f:
        gj = json.load(f)
    return [
        {c.ADM_KEY: ft["properties"].get("admCd2", ""),
         "name": ft["properties"].get("name", ""),
         "geometry": ft["geometry"]}
        for ft in gj["features"]
    ]
