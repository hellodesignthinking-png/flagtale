// 서울 우리마을가게 추정매출 — rent-to-revenue의 '분모(매출)'.
// API가 행정동 코드 필터를 안 받아서, 최신 분기 전체를 1회 적재(행정동명 인덱스) 후 캐시.
import "server-only";

const SK = process.env.SEOUL_OPENDATA_KEY;
const BASE = "http://openapi.seoul.go.kr:8088";
const LATEST_Q = "20261"; // 2026 1분기 (데이터 최신)

type DongAgg = { amt: number; cnt: number; induty: Record<string, number> };
let _byDong: Map<string, DongAgg> | null = null;
let _loading: Promise<void> | null = null;

async function page(p: number) {
  const start = (p - 1) * 1000 + 1;
  const url = `${BASE}/${SK}/json/VwsmAdstrdSelngW/${start}/${start + 999}/${LATEST_Q}`;
  const r = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(4000) });
  const j = await r.json().catch(() => null);
  return (j?.VwsmAdstrdSelngW?.row ?? []) as { ADSTRD_CD_NM: string; SVC_INDUTY_CD_NM: string; THSMON_SELNG_AMT: number; THSMON_SELNG_CO: number }[];
}

async function loadOnce() {
  if (_byDong) return;
  if (_loading) return _loading;
  _loading = (async () => {
    const m = new Map<string, DongAgg>();
    // 최신 분기 전 행정동(~440동×업종 ≈ 31p). 8개씩 병렬 배치.
    for (let base = 1; base <= 33; base += 8) {
      const batch = await Promise.all(
        Array.from({ length: 8 }, (_, i) => page(base + i).catch(() => []))
      );
      let any = false;
      for (const rows of batch) {
        if (rows.length) any = true;
        for (const x of rows) {
          const nm = x.ADSTRD_CD_NM;
          const amt = Number(x.THSMON_SELNG_AMT) || 0;
          const e = m.get(nm) ?? { amt: 0, cnt: 0, induty: {} };
          e.amt += amt;
          e.cnt += Number(x.THSMON_SELNG_CO) || 0;
          e.induty[x.SVC_INDUTY_CD_NM] = (e.induty[x.SVC_INDUTY_CD_NM] || 0) + amt;
          m.set(nm, e);
        }
      }
      if (!any) break;
    }
    _byDong = m;
  })();
  return _loading;
}

export interface SeoulSales {
  region: string;
  quarter: string;
  monthlyAmtEok: number; // 당월 추정 총매출(억)
  monthlyCnt: number; // 당월 매출건수
  topInduty: { name: string; eok: number; pct: number }[];
}

export async function seoulSales(name: string, sido: string): Promise<SeoulSales | null> {
  if (!SK || sido !== "서울특별시" || !name) return null;
  try {
    await loadOnce();
  } catch {
    return null;
  }
  const e = _byDong?.get(name);
  if (!e || !e.amt) return null;
  const topInduty = Object.entries(e.induty)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([nm, amt]) => ({ name: nm, eok: Math.round(amt / 1e8), pct: Math.round((amt / e.amt) * 100) }));
  return {
    region: name,
    quarter: `${LATEST_Q.slice(0, 4)} ${LATEST_Q.slice(4)}분기`,
    monthlyAmtEok: Math.round(e.amt / 1e8),
    monthlyCnt: e.cnt,
    topInduty,
  };
}
