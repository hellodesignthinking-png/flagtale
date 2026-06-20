// 부동산원(R-ONE) 상업용 임대동향 — 임대가격지수(상권 2013~) + 공실률(권역 2022~), 분기.
// 상권/권역 단위라 행정동과 1:1이 아님 → 이름 부분일치(상권) → 시도 평균 순으로 매칭.
import "server-only";

const KEY = process.env.RONE_API_KEY;
const BASE = "https://www.reb.or.kr/r-one/openapi/SttsApiTblData.do";
// 소규모 상가(골목상권에 가장 근접)
const TBL_RENT = "TT246323134644307"; // 임대가격지수 시계열_소규모 상가 (2015~)
const TBL_VAC = "A_2024_00255"; // 공실률(2022~)_소규모 상가

interface Row {
  CLS_NM: string;
  CLS_FULLNM: string;
  DTA_VAL: number;
  WRTTIME_IDTFR_ID: string;
}
type RegionMap = Map<string, { period: string; value: number }[]>; // CLS_NM → 시계열

let _rent: RegionMap | null = null;
let _vac: RegionMap | null = null;
let _fetchedAt = 0;

async function fetchPage(statblId: string, pIndex: number): Promise<{ rows: Row[]; total: number }> {
  // R-ONE 제한: 1회 최대 1,000건
  const url = `${BASE}?KEY=${KEY}&STATBL_ID=${statblId}&DTACYCLE_CD=QY&Type=json&pIndex=${pIndex}&pSize=1000`;
  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(9000) });
  const j = await res.json();
  const arr = j?.SttsApiTblData;
  if (!Array.isArray(arr)) return { rows: [], total: 0 };
  return {
    rows: (arr.find((x: { row?: Row[] }) => x.row)?.row ?? []) as Row[],
    total: (arr.find((x: { head?: { list_total_count?: number }[] }) => x.head)?.head?.[0]?.list_total_count ?? 0) as number,
  };
}

async function fetchTable(statblId: string): Promise<Row[]> {
  const first = await fetchPage(statblId, 1);
  const pages = Math.min(Math.ceil(first.total / 1000), 12); // 최대 12000건
  if (pages <= 1) return first.rows;
  const rest = await Promise.all(Array.from({ length: pages - 1 }, (_, i) => fetchPage(statblId, i + 2)));
  return [first.rows, ...rest.map((r) => r.rows)].flat();
}

// 상권명(CLS_NM) → 시도 (CLS_FULLNM "서울>도심" 의 앞부분). 매칭을 같은 시도로 제약.
const _sidoOf = new Map<string, string>();

function toMap(rows: Row[]): RegionMap {
  const m: RegionMap = new Map();
  for (const r of rows) {
    if (r.DTA_VAL == null) continue;
    const arr = m.get(r.CLS_NM) ?? [];
    arr.push({ period: r.WRTTIME_IDTFR_ID, value: Math.round(Number(r.DTA_VAL) * 10) / 10 });
    m.set(r.CLS_NM, arr);
    if (!_sidoOf.has(r.CLS_NM) && r.CLS_FULLNM) _sidoOf.set(r.CLS_NM, r.CLS_FULLNM.split(">")[0]);
  }
  for (const arr of m.values()) arr.sort((a, b) => a.period.localeCompare(b.period));
  return m;
}

async function load() {
  if (_rent && _vac && Date.now() - _fetchedAt < 1000 * 60 * 60 * 12) return;
  const [rent, vac] = await Promise.all([fetchTable(TBL_RENT), fetchTable(TBL_VAC)]);
  if (rent.length) _rent = toMap(rent);
  if (vac.length) _vac = toMap(vac);
  _fetchedAt = Date.now();
}

// 지역명 정규화 (성수2가1동→성수, 신사동→신사, 강남구→강남)
function base(s: string): string {
  return s.replace(/(\d+가)?\d*동$/, "").replace(/(구|시|군)$/, "").trim();
}

function matchRegion(map: RegionMap, name: string, sigungu: string, sido: string) {
  const sidoShort = sido.replace(/특별시|광역시|특별자치시|특별자치도|도$/, "").trim();
  // 같은 시도의 상권만 후보 (부산 중앙동→제천중앙 같은 타지역 오매칭 방지)
  const keys = [...map.keys()].filter((k) => {
    const ks = _sidoOf.get(k);
    return !ks || ks.includes(sidoShort) || sidoShort.includes(ks);
  });
  const bn = base(name), bs = base(sigungu);
  // 1) 상권명이 동/시군구 키워드를 포함하거나 그 반대 (성수·신사·강남대로 등)
  let hit = keys.find((k) => bn.length >= 2 && (k.includes(bn) || bn.includes(k)));
  if (hit) return { region: hit, level: "상권" as const };
  hit = keys.find((k) => bs.length >= 2 && (k.includes(bs) || bs.includes(k)));
  if (hit) return { region: hit, level: "상권권역" as const };
  // 2) 시도 평균 (해당 시도 상권을 못 찾으면 시도/전국 폴백)
  return { region: sidoShort, level: "시도평균" as const };
}

export interface RebForPlace {
  rent: { region: string; level: string; series: { period: string; value: number }[]; latest: number; chgFrom2016: number } | null;
  vacancy: { region: string; level: string; latest: number; series: { period: string; value: number }[] } | null;
}

export async function rebForPlace(props: { name: string; sigungu: string; sido: string }): Promise<RebForPlace | null> {
  if (!KEY) return null;
  try {
    await load();
  } catch {
    return null;
  }
  if (!_rent && !_vac) return null;

  const out: RebForPlace = { rent: null, vacancy: null };

  if (_rent) {
    const m = matchRegion(_rent, props.name, props.sigungu, props.sido);
    let series = _rent.get(m.region);
    let level = m.level as string;
    if (!series && m.level === "시도평균") {
      // 시도 평균: 해당 시도 상권 전부 평균 (CLS_FULLNM 기준은 없으니 전국 폴백)
      series = _rent.get("전국");
      level = "전국";
    }
    if (series && series.length) {
      const latest = series[series.length - 1].value;
      const y2016 = series.find((s) => s.period.startsWith("2016"))?.value ?? series[0].value;
      out.rent = { region: m.region, level, series, latest, chgFrom2016: Math.round((latest - y2016) * 10) / 10 };
    }
  }
  if (_vac) {
    const m = matchRegion(_vac, props.name, props.sigungu, props.sido);
    let series = _vac.get(m.region);
    let level = m.level as string;
    if (!series) {
      series = _vac.get("전국");
      level = "전국";
    }
    if (series && series.length) {
      out.vacancy = { region: m.region, level, latest: series[series.length - 1].value, series };
    }
  }
  return out.rent || out.vacancy ? out : null;
}
