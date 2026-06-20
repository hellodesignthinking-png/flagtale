"""KLAI 파이프라인 공통 — 설정·경로·목업 플래그 (빌드 스펙 §8·§9)."""
from __future__ import annotations
import os
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
DATA = ROOT / "data"

# 키 없으면 MOCK=True → 시드 JSON 을 읽어 그대로 흐름을 시연(전 단계 동작 확인용)
MOCK = os.environ.get("PIPELINE_MOCK", "1") == "1"

# 외부 API 키 (없으면 MOCK 권장)
KOSIS_KEY = os.environ.get("KOSIS_API_KEY", "")
LOCALDATA_KEY = os.environ.get("LOCALDATA_API_KEY", "")
RONE_KEY = os.environ.get("RONE_API_KEY", "")          # 한국부동산원 R-ONE
RTMS_KEY = os.environ.get("RTMS_API_KEY", "")          # 국토부 실거래가
G2B_KEY = os.environ.get("G2B_API_KEY", "")            # 나라장터/조달청 OpenAPI
BIGKINDS_KEY = os.environ.get("BIGKINDS_API_KEY", "")
NAVER_ID = os.environ.get("NAVER_CLIENT_ID", "")
NAVER_SECRET = os.environ.get("NAVER_CLIENT_SECRET", "")

# Supabase upsert
SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

# 표준 키 (스펙 §15): adm_cd2 행안부 10자리
ADM_KEY = "admCd2"


def read_seed(name: str):
    with open(DATA / name, encoding="utf-8") as f:
        return json.load(f)


def log(msg: str):
    print(f"[klai-pipeline] {msg}")
