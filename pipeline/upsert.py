"""Supabase upsert — 점수·진단·인구·조달을 DB 에 반영 (service-role REST).

키 없으면 dry-run(건수만 출력). PostgREST upsert 사용.
"""
from __future__ import annotations
from . import common as c


def _upsert(table: str, rows: list[dict], on_conflict: str):
    if not rows:
        return
    if not (c.SUPABASE_URL and c.SUPABASE_SERVICE_ROLE):
        c.log(f"upsert[{table}]: DRY-RUN {len(rows)}행 (SUPABASE 키 없음)")
        return
    import requests
    url = f"{c.SUPABASE_URL}/rest/v1/{table}?on_conflict={on_conflict}"
    headers = {
        "apikey": c.SUPABASE_SERVICE_ROLE,
        "Authorization": f"Bearer {c.SUPABASE_SERVICE_ROLE}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",
    }
    # 청크 단위 업서트
    for i in range(0, len(rows), 500):
        chunk = rows[i:i + 500]
        r = requests.post(url, json=chunk, headers=headers, timeout=60)
        r.raise_for_status()
    c.log(f"upsert[{table}]: {len(rows)}행 반영")


def scores(rows):       _upsert("PlaceScore", rows, "admCd2,period")
def diagnoses(rows):    _upsert("PlaceDiagnosis", rows, "admCd2,period")
def demographics(rows): _upsert("Demographic", rows, "admCd2,year")
def procurement(rows):  _upsert("Procurement", rows, "id")
def places(rows):       _upsert("Place", rows, "admCd2")
