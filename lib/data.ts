import fs from "node:fs";
import path from "node:path";
import { BOUNDARY_SOURCE } from "./config";
import type {
  DemographicsFile,
  DemographicYear,
  Diagnosis,
  DistrictCollection,
  DistrictProps,
  PlaceScore,
  ProcurementFile,
  ProcurementPlace,
  Report,
  ScoresFile,
  SignalSeries,
  SignalsFile,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");

function readJson<T>(file: string): T {
  const raw = fs.readFileSync(path.join(DATA_DIR, file), "utf-8");
  return JSON.parse(raw) as T;
}

// 모듈 스코프 캐시 (시드는 빌드 타임에 고정)
let _districts: DistrictCollection | null = null;
let _scores: ScoresFile | null = null;
let _diagnoses: Record<string, Diagnosis> | null = null;
let _reports: Report[] | null = null;
let _demographics: DemographicsFile | null = null;
let _procurement: ProcurementFile | null = null;
let _signals: SignalsFile | null = null;

export function loadDistricts(): DistrictCollection {
  if (_districts) return _districts;
  // 실경계 모드: data/boundaries/admdong.simplified.geojson 있으면 사용, 없으면 샘플 폴백
  if (BOUNDARY_SOURCE === "real") {
    const realPath = path.join(DATA_DIR, "boundaries", "admdong.simplified.geojson");
    if (fs.existsSync(realPath)) {
      return (_districts = JSON.parse(fs.readFileSync(realPath, "utf-8")) as DistrictCollection);
    }
    console.warn(
      "[boundaries] NEXT_PUBLIC_BOUNDARY_SOURCE=real 이지만 실경계 파일이 없어 샘플로 폴백합니다. `node scripts/fetch-boundaries.mjs` 실행 필요."
    );
  }
  return (_districts = readJson<DistrictCollection>("districts.geojson"));
}

/** 실데이터로 인제스트된 소스 id 집합 (scripts/ingest 가 data/.ingested.json 기록) */
export function ingestedSources(): Set<string> {
  const p = path.join(DATA_DIR, ".ingested.json");
  if (!fs.existsSync(p)) return new Set(["boundary"]); // 경계는 항상 실제
  try {
    const ids = JSON.parse(fs.readFileSync(p, "utf-8")) as string[];
    return new Set(["boundary", ...ids]);
  } catch {
    return new Set(["boundary"]);
  }
}

/** 현재 경계 소스 메타 (UI 배지용) */
export function boundaryMeta() {
  const realPath = path.join(DATA_DIR, "boundaries", "admdong.simplified.geojson");
  const realAvailable = fs.existsSync(realPath);
  return {
    source: BOUNDARY_SOURCE === "real" && realAvailable ? "real" : "sample",
    realAvailable,
  };
}
export function loadScores(): ScoresFile {
  return (_scores ??= readJson<ScoresFile>("scores.json"));
}
export function loadDiagnoses(): Record<string, Diagnosis> {
  return (_diagnoses ??= readJson<Record<string, Diagnosis>>("diagnoses.json"));
}
export function loadReports(): Report[] {
  return (_reports ??= readJson<Report[]>("reports.json"));
}
export function loadDemographics(): DemographicsFile {
  return (_demographics ??= readJson<DemographicsFile>("demographics.json"));
}

/** 인구 데이터 출처/해상도 메타 — 있으면 인구·세대수 = 실데이터(KOSIS). 없으면 예시. */
export function populationMeta() {
  return loadDemographics().popMeta ?? null;
}

/** 인구 데이터 출처/해상도 메타 — 있으면 인구·세대수 = 실데이터(KOSIS). 없으면 예시. */
export function loadProcurement(): ProcurementFile {
  return (_procurement ??= readJson<ProcurementFile>("procurement.json"));
}
export function loadSignals(): SignalsFile {
  return (_signals ??= readJson<SignalsFile>("signals.json"));
}

export function listPlaces(): DistrictProps[] {
  return loadDistricts().features.map((f) => f.properties);
}

export interface PlaceBundle {
  props: DistrictProps;
  series: PlaceScore[];
  latest: PlaceScore;
  diagnosis: Diagnosis | null;
  demographics: DemographicYear[];
  procurement: ProcurementPlace | null;
  signals: SignalSeries | null;
}

export function getPlace(admCd2: string): PlaceBundle | null {
  const feature = loadDistricts().features.find(
    (f) => f.properties.admCd2 === admCd2
  );
  if (!feature) return null;
  const series = loadScores().byPlace[admCd2] ?? [];
  return {
    props: feature.properties,
    series,
    latest: series[series.length - 1],
    diagnosis: loadDiagnoses()[admCd2] ?? null,
    demographics: loadDemographics().byPlace[admCd2] ?? [],
    procurement: loadProcurement().byPlace[admCd2] ?? null,
    signals: loadSignals().byPlace[admCd2] ?? null,
  };
}

export function getReport(slug: string): Report | null {
  return loadReports().find((r) => r.slug === slug) ?? null;
}

const avgOf = (a: number[]) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);

// 전국 인구 지수(기준연도=100) 캐시
let _natPopIndex: { years: number[]; index: number[]; youth: number; elderly: number } | null = null;
function nationalPopIndex() {
  if (_natPopIndex) return _natPopIndex;
  const demo = loadDemographics();
  const years = demo.years;
  const sums = years.map(() => 0);
  let n = 0;
  const youths: number[] = [];
  const elders: number[] = [];
  for (const cd in demo.byPlace) {
    const a = demo.byPlace[cd];
    if (!a?.length) continue;
    const base = a[0].totalPop || 1;
    a.forEach((d, i) => (sums[i] += (d.totalPop / base) * 100));
    youths.push(a[a.length - 1].youthRatio);
    elders.push(a[a.length - 1].elderlyRatio);
    n++;
  }
  _natPopIndex = {
    years,
    index: sums.map((s) => Math.round((s / n) * 10) / 10),
    youth: Math.round(avgOf(youths) * 10) / 10,
    elderly: Math.round(avgOf(elders) * 10) / 10,
  };
  return _natPopIndex;
}

export interface RegionComparison {
  years: number[];
  sidoName: string;
  region: number[]; // 인구 지수(기준연도=100)
  sidoAvg: number[];
  nationalAvg: number[];
  regionPop: number[];
  youth: { region: number; sido: number; national: number };
  elderly: { region: number; sido: number; national: number };
}

// 도시(시도) 평균·전국 평균 대비 이 동의 인구 변화 — "기본 데이터 대비 얼마나 변했나"
export function getRegionComparison(admCd2: string): RegionComparison | null {
  const demo = loadDemographics();
  const arr = demo.byPlace[admCd2];
  if (!arr?.length) return null;
  const feature = loadDistricts().features.find((f) => f.properties.admCd2 === admCd2);
  const sido = feature?.properties.sido ?? "";
  const years = demo.years;
  const base = arr[0].totalPop || 1;
  const region = arr.map((d) => Math.round((d.totalPop / base) * 1000) / 10);

  const sidoDongs = loadDistricts().features
    .filter((f) => f.properties.sido === sido)
    .map((f) => f.properties.admCd2);
  const sums = years.map(() => 0);
  let n = 0;
  const sidoYouth: number[] = [];
  const sidoElder: number[] = [];
  for (const cd of sidoDongs) {
    const a = demo.byPlace[cd];
    if (!a?.length) continue;
    const b = a[0].totalPop || 1;
    a.forEach((d, i) => (sums[i] += (d.totalPop / b) * 100));
    sidoYouth.push(a[a.length - 1].youthRatio);
    sidoElder.push(a[a.length - 1].elderlyRatio);
    n++;
  }
  const sidoAvg = sums.map((s) => Math.round((s / (n || 1)) * 10) / 10);
  const nat = nationalPopIndex();
  const last = arr[arr.length - 1];

  return {
    years,
    sidoName: sido,
    region,
    sidoAvg,
    nationalAvg: nat.index,
    regionPop: arr.map((d) => d.totalPop),
    youth: { region: last.youthRatio, sido: Math.round(avgOf(sidoYouth) * 10) / 10, national: nat.youth },
    elderly: { region: last.elderlyRatio, sido: Math.round(avgOf(sidoElder) * 10) / 10, national: nat.elderly },
  };
}

// 같은 유형(typology) 동들의 최신 분기 축 평균 — 레이더 비교군
export function getPeerAvg(typology: string): { d1: number; d2: number; d3: number; d4: number } {
  const scores = loadScores();
  const peers = loadDistricts().features.filter((f) => f.properties.typology === typology);
  const acc = { d1: 0, d2: 0, d3: 0, d4: 0 };
  let n = 0;
  for (const f of peers) {
    const s = scores.byPlace[f.properties.admCd2]?.at(-1);
    if (!s) continue;
    acc.d1 += s.d1;
    acc.d2 += s.d2;
    acc.d3 += s.d3;
    acc.d4 += s.d4;
    n++;
  }
  if (n === 0) return { d1: 50, d2: 50, d3: 50, d4: 50 };
  return {
    d1: Math.round(acc.d1 / n),
    d2: Math.round(acc.d2 / n),
    d3: Math.round(acc.d3 / n),
    d4: Math.round(acc.d4 / n),
  };
}

/** 주소/지번/동명 → 동 매핑 (목업 지오코딩). 동명·자치구 부분일치. */
export function geocodeToPlace(query: string): DistrictProps | null {
  const q = query.trim();
  if (!q) return null;
  const places = listPlaces();
  // 동명 정확/부분 일치 우선
  const exact = places.find((p) => p.name === q || p.name === q + "동");
  if (exact) return exact;
  const partial = places.find(
    (p) => p.name.includes(q) || q.includes(p.name.replace("동", ""))
  );
  if (partial) return partial;
  // 지번 형태(숫자 포함)면 결정론적으로 한 동에 매핑 (데모)
  const digits = q.replace(/\D/g, "");
  if (digits) {
    const idx = parseInt(digits.slice(-3) || "0", 10) % places.length;
    return places[idx];
  }
  return null;
}
