"""점수 합성 — 기획서 §4 (정규화 → Sub→Dimension → 종합 → 모멘텀 → 젠트리 G).

입력: 커넥터 롱포맷 지표.  출력: PlaceScore upsert 행.
실데이터에서는 같은 비교군(시도) 내 Min-Max, 역방향 반전, 쏠림 로그, D4 곱셈을 적용.
"""
from __future__ import annotations
import math
from . import common as c

WEIGHTS = {"d1": 0.20, "d2": 0.30, "d3": 0.20, "d4": 0.30}
THETA_G = 1.45  # 젠트리 경보 임계


def grade_of(k: float) -> str:
    return ("S" if k >= 85 else "A" if k >= 70 else "B" if k >= 55
            else "C" if k >= 40 else "D" if k >= 25 else "E")


def minmax(values: list[float], reverse: bool = False, log: bool = False) -> list[float]:
    xs = [math.log1p(v) if log else v for v in values]
    lo, hi = min(xs), max(xs)
    span = (hi - lo) or 1.0
    out = [(x - lo) / span * 100 for x in xs]
    return [100 - o for o in out] if reverse else out


def compose(d1: float, d2: float, d3: float, d4: float, momentum: float, gentri_g: float) -> dict:
    base = WEIGHTS["d1"] * d1 + WEIGHTS["d2"] * d2 + WEIGHTS["d3"] * d3 + WEIGHTS["d4"] * d4
    klai = base + momentum
    flag = gentri_g > THETA_G
    if flag:  # 과열 모멘텀 상한 + 소폭 감점 (Step 5)
        momentum = min(momentum, 5.5)
        klai = base + momentum - min(max((gentri_g - THETA_G) * 1.6, 0), 4)
    klai = max(0.0, min(100.0, klai))
    return {"klai": round(klai, 1), "grade": grade_of(klai),
            "momentum": round(momentum, 1), "gentriFlag": flag}


def build(mock: bool = True) -> list[dict]:
    """MOCK: 시드 scores.json 을 그대로 upsert 행으로 반환(파이프라인 흐름 시연)."""
    if mock or c.MOCK:
        scores = c.read_seed("scores.json")
        rows = []
        for adm, series in scores["byPlace"].items():
            for s in series:
                rows.append({c.ADM_KEY: adm, **s})
        c.log(f"scoring: MOCK {len(rows)} 점수행")
        return rows
    # TODO: 커넥터 지표 → 정규화 → compose → 행
    return []
