// 서울 생활인구 — 행정동·시간대별 유동(체류)인구 = 상권 활력의 직접 지표.
// API가 코드 필터를 안 받음 → 최근 1일치(전 행정동×24시간) 1회 적재, 코드=admCd2[0:8]로 조회.
import "server-only";

const SK = process.env.SEOUL_OPENDATA_KEY;
const BASE = "http://openapi.seoul.go.kr:8088";

let _byCode: Map<string, number[]> | null = null; // code(8) → [24시간 생활인구]
let _date = "";
let _loading: Promise<void> | null = null;

async function pickDate(): Promise<string> {
  const r = await fetch(`${BASE}/${SK}/json/SPOP_LOCAL_RESD_DONG/1/1/`, { cache: "no-store", signal: AbortSignal.timeout(4000) });
  const j = await r.json().catch(() => null);
  return j?.SPOP_LOCAL_RESD_DONG?.row?.[0]?.STDR_DE_ID ?? "";
}

async function page(p: number, date: string) {
  const start = (p - 1) * 1000 + 1;
  const url = `${BASE}/${SK}/json/SPOP_LOCAL_RESD_DONG/${start}/${start + 999}/${date}`;
  const r = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(4000) });
  const j = await r.json().catch(() => null);
  return (j?.SPOP_LOCAL_RESD_DONG?.row ?? []) as { ADSTRD_CODE_SE: string; TMZON_PD_SE: string; TOT_LVPOP_CO: string }[];
}

async function loadOnce() {
  if (_byCode) return;
  if (_loading) return _loading;
  _loading = (async () => {
    const date = await pickDate();
    const m = new Map<string, number[]>();
    if (date) {
      _date = date;
      // 전 행정동 24시간 ≈ 425동×24 ≈ 10,200행 ≈ 11p. 6개씩 병렬.
      for (let base = 1; base <= 13; base += 6) {
        const batch = await Promise.all(Array.from({ length: 6 }, (_, i) => page(base + i, date).catch(() => [])));
        let any = false;
        for (const rows of batch) {
          if (rows.length) any = true;
          for (const x of rows) {
            const code = String(x.ADSTRD_CODE_SE);
            const h = Number(x.TMZON_PD_SE);
            const arr = m.get(code) ?? new Array(24).fill(0);
            if (h >= 0 && h < 24) arr[h] = Number(x.TOT_LVPOP_CO) || 0;
            m.set(code, arr);
          }
        }
        if (!any) break;
      }
    }
    _byCode = m;
  })();
  return _loading;
}

export interface LivingPop {
  date: string;
  hourly: number[]; // 24시간 생활인구
  dayAvg: number; // 주간 10~17시 평균
  nightAvg: number; // 야간 19~05시 평균
  peakHour: number; // 최대 시간대
  dayNightRatio: number; // 주간/야간
  type: "주간상권" | "야간상권" | "균형"; // 활력 유형
}

export async function livingPop(admCd2: string, sido: string): Promise<LivingPop | null> {
  if (!SK || sido !== "서울특별시" || !admCd2) return null;
  try {
    await loadOnce();
  } catch {
    return null;
  }
  const hourly = _byCode?.get(admCd2.slice(0, 8));
  if (!hourly || hourly.every((v) => v === 0)) return null;
  const mean = (hs: number[]) => (hs.length ? hs.reduce((s, h) => s + hourly[h], 0) / hs.length : 0);
  const dayAvg = mean([10, 11, 12, 13, 14, 15, 16, 17]);
  const nightAvg = mean([19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5]);
  const peakHour = hourly.indexOf(Math.max(...hourly));
  const ratio = nightAvg ? dayAvg / nightAvg : 1;
  const type = ratio > 1.25 ? "주간상권" : ratio < 0.85 ? "야간상권" : "균형";
  return {
    date: _date,
    hourly: hourly.map((v) => Math.round(v)),
    dayAvg: Math.round(dayAvg),
    nightAvg: Math.round(nightAvg),
    peakHour,
    dayNightRatio: Math.round(ratio * 100) / 100,
    type,
  };
}
