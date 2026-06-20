"""진단 엔진 — 점수에서 인과로 (기획서 §5).

  · 기여요인 분해: SHAP (TreeExplainer) — Δ점수를 12 Sub 로 분해해 원인 Top3
  · 선행성: Granger 인과 — '독립업종 유입'이 '임대료 상승'에 선행하는지
  · 정책 ROI: DiD(이중차분) — 공공예산 투입 전후 KLAI 순효과  ← 공공조달 데이터 활용
  · 풍선효과: Moran's I 공간자기상관
  · 내러티브: 토픽모델(BERTopic/LDA) + 진정성 갭
  · 검증: 성수·연남·가로수길 백테스트

의존(실데이터): shap, scikit-learn, statsmodels, libpysal/esda, bertopic
MOCK: 시드 diagnoses.json 을 반환.
"""
from __future__ import annotations
from . import common as c


def build(mock: bool = True) -> list[dict]:
    if mock or c.MOCK:
        diags = c.read_seed("diagnoses.json")
        c.log(f"diagnosis: MOCK {len(diags)} 진단")
        return list(diags.values())
    rows = []
    # rows = shap_attribution(...) + gentri_radar(...) + decline_diagnosis(...) + narrative(...)
    return rows


# ── 실데이터 구현 자리 (skeleton) ────────────────────────────
def shap_attribution(model, X):
    """동별 Δ점수를 12 Sub 기여로 분해 → topFactors Top3."""
    # import shap; explainer = shap.TreeExplainer(model); sv = explainer.shap_values(X); ...
    raise NotImplementedError


def did_policy_roi(panel, treated_mask, event_period):
    """공공예산 투입(treated) 전후 KLAI 변화의 순효과(DiD). 기획서 §5.7."""
    # import statsmodels.formula.api as smf
    # smf.ols("klai ~ treated*post", data=panel).fit()  → 상호작용항 = 순효과
    raise NotImplementedError


def granger_lead_lag(x, y, maxlag=4):
    """X 변화가 Y 변화에 선행하는지 (젠트리 선행체인 검증)."""
    # from statsmodels.tsa.stattools import grangercausalitytests
    raise NotImplementedError


def narrative_topics(docs):
    """뉴스·리뷰 토픽모델 → 내러티브 주제·진정성 갭."""
    # from bertopic import BERTopic
    raise NotImplementedError
