// Flagtale Weekly — 주간 웹진 자동 생성 엔진 (스펙 §10.1).
// 정적 데이터(scores·signals·demographics)에서 ISO 주차별로 '결정론적'으로 리포트를 계산한다.
// → 매주 새 리포트가 자동 존재(서버리스 읽기전용 FS에 쓰기 불필요). 실데이터 도입 시 실제 주간 변화 반영.
// 연구자 톤: 전국 변화·검색·인구를 종합해 "어떤 동네가 왜 뜨고/지는지"를 서술.
import "server-only";
import { loadScores, loadDistricts, loadSignals, loadDemographics } from "@/lib/data";
import type { Grade, PlaceScore, Report } from "@/lib/types";

export interface WeeklyRiser {
  admCd2: string;
  name: string;
  sigungu: string;
  klai: number;
  grade: Grade;
  momentum: number;
  reason: string; // 연구자 한 줄 — 왜 뜨/지는가
}
export interface WeeklyNational {
  totalDongs: number;
  avgKlai: number;
  risingCount: number;
  decliningCount: number;
  searchTrendPct: number; // 전국 검색 관심도 추세(%)
  popChangePct: number; // 전국 인구 변화 평균(%)
  gentriCount: number;
  cliffCount: number;
  topTypology: string; // 상승 주도 유형
}
export interface WeeklyBlocks {
  overview: string; // 전국 요약(연구자 서술)
  national: WeeklyNational;
  risers: WeeklyRiser[];
  fallers: WeeklyRiser[];
  gentriAlerts: { admCd2: string; name: string; sigungu: string; stage: number; g: number; reason: string }[];
  cliffs: { admCd2: string; name: string; sigungu: string; klai: number; reason: string }[];
  narrativesHot: string[];
  narrativesCold: string[];
  spotlight: { admCd2: string; name: string; sigungu: string; klai: number; grade: Grade; momentum: number; writeup: string };
  methodologyNote: string;
}

// ── ISO 주차 ────────────────────────────────────────────────
export function isoWeekOf(d: Date): { year: number; week: number } {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7; // Mon=0
  date.setUTCDate(date.getUTCDate() - dayNum + 3); // 해당 주 목요일
  const firstThu = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const firstDayNum = (firstThu.getUTCDay() + 6) % 7;
  firstThu.setUTCDate(firstThu.getUTCDate() - firstDayNum + 3);
  const week = 1 + Math.round((date.getTime() - firstThu.getTime()) / (7 * 864e5));
  return { year: date.getUTCFullYear(), week };
}
// 해당 ISO 주차의 월요일 날짜(YYYY-MM-DD)
function mondayOfIsoWeek(year: number, week: number): string {
  const simple = new Date(Date.UTC(year, 0, 4 + (week - 1) * 7));
  const dayNum = (simple.getUTCDay() + 6) % 7;
  simple.setUTCDate(simple.getUTCDate() - dayNum);
  return simple.toISOString().slice(0, 10);
}
export function weekSlug(year: number, week: number): string {
  return `flagtale-weekly-${year}-w${week}`;
}
export function weekPeriod(year: number, week: number): string {
  return `${year}-W${String(week).padStart(2, "0")}`;
}
// slug → {year, week} (없으면 null)
export function parseWeekSlug(slug: string): { year: number; week: number } | null {
  const m = slug.match(/flagtale-weekly-(\d{4})-w(\d{1,2})/);
  if (!m) return null;
  return { year: Number(m[1]), week: Number(m[2]) };
}
// 최근 n개 ISO 주차(현재 주 포함, 과거로) — 기준일 주입 가능(서버 now)
export function recentWeeks(n: number, now: Date): { year: number; week: number }[] {
  const out: { year: number; week: number }[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getTime() - i * 7 * 864e5);
    out.push(isoWeekOf(d));
  }
  return out;
}

// 결정론적 시드 (iso 문자열 해시) — 주마다 다른 동을 조명하되 재현 가능
function seedFrom(iso: string): number {
  let h = 2166136261;
  for (let i = 0; i < iso.length; i++) {
    h ^= iso.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 100000;
}

type NatBase = {
  rows: { p: PlaceScore; name: string; sigungu: string; typology: string; admCd2: string }[];
  national: Omit<WeeklyNational, "topTypology"> & { topTypology: string };
};
let _natBase: NatBase | null = null;

// 전국 베이스(주차 무관) 1회 계산 캐시 — 최신 기간 스냅샷
function nationalBase(): NatBase {
  if (_natBase) return _natBase;
  const scores = loadScores();
  const districts = loadDistricts();
  const signals = loadSignals();
  const propByCd = new Map(districts.features.map((f) => [f.properties.admCd2, f.properties]));

  const rows: NatBase["rows"] = [];
  for (const [admCd2, series] of Object.entries(scores.byPlace)) {
    if (!series.length) continue;
    const p = series[series.length - 1];
    const props = propByCd.get(admCd2);
    if (!props) continue;
    rows.push({ p, name: props.name, sigungu: props.sigungu, typology: props.typology || "주거", admCd2 });
  }

  const n = rows.length || 1;
  const avgKlai = Math.round((rows.reduce((s, r) => s + r.p.klai, 0) / n) * 10) / 10;
  const risingCount = rows.filter((r) => r.p.momentum > 1).length;
  const decliningCount = rows.filter((r) => r.p.momentum < -1).length;
  const gentriCount = rows.filter((r) => r.p.gentriFlag || r.p.gentriStage >= 3).length;
  const cliffCount = rows.filter((r) => r.p.marketVitality === "shrinking").length;
  const popChangePct = Math.round((rows.reduce((s, r) => s + (r.p.popChangeRate || 0), 0) / n) * 100) / 100;

  // 전국 검색 추세(%) — signals.search 마지막값 대비 직전값
  let sNow = 0,
    sPrev = 0,
    sc = 0;
  for (const ser of Object.values(signals.byPlace)) {
    const arr = ser.search;
    if (arr && arr.length >= 2) {
      sNow += arr[arr.length - 1];
      sPrev += arr[arr.length - 2];
      sc++;
    }
  }
  const searchTrendPct = sc && sPrev ? Math.round(((sNow - sPrev) / sPrev) * 1000) / 10 : 0;

  // 상승 주도 유형 — 상위 모멘텀 동의 최빈 유형
  const topMom = [...rows].sort((a, b) => b.p.momentum - a.p.momentum).slice(0, 80);
  const typCount = new Map<string, number>();
  for (const r of topMom) typCount.set(r.typology, (typCount.get(r.typology) || 0) + 1);
  const topTypology = [...typCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "원도심";

  _natBase = {
    rows,
    national: { totalDongs: rows.length, avgKlai, risingCount, decliningCount, searchTrendPct, popChangePct, gentriCount, cliffCount, topTypology },
  };
  return _natBase;
}

// 상승 사유 — 점수 프로필에서 연구자 한 줄 도출
function riserReason(p: PlaceScore): string {
  const dims: [string, number][] = [["D1 인구·지속성", p.d1], ["D2 경제·상권", p.d2], ["D3 공간·물리", p.d3], ["D4 인식·감성", p.d4]];
  const top = dims.sort((a, b) => b[1] - a[1])[0][0];
  if (p.d4 >= p.d1 && p.d4 >= p.d2 && p.d4 >= p.d3) return `검색·미디어 관심이 끌어올린 상승 — ${top} 우위, 자생적 버즈가 선행`;
  if (p.d2 >= p.d1 && p.d2 >= p.d3) return `상권·창업 활기 — ${top}, 신규 유입·업종 다양성 확대`;
  if (p.budgetInflow >= 20) return `공공투자 유입(${Math.round(p.budgetInflow)}억) 동반 — 도시재생·앵커시설 효과`;
  if (p.gentriStage <= 1) return `초기 상권 형성기 — 저평가 구간에서 관심 점화(젠트리 ${p.gentriStage}단계)`;
  if ((p.popChangeRate || 0) > 0) return `인구 순유입 — ${top}, 정주 기반 개선`;
  return `전 축 고른 개선 — KLAI ${p.klai}, 모멘텀 +${p.momentum}`;
}
// 하락 사유
function fallerReason(p: PlaceScore): string {
  if (p.negativeNarrative) return `부정 서사 확산 — '예전 같지 않다' 역티핑, 진정성갭 ${p.authenticityGap}`;
  if (p.gentriStage >= 4) return `젠트리 후기 내몰림 — ${p.gentriStage}단계, 고유 점포·원주민 이탈`;
  if (p.marketVitality === "shrinking") return `거래절벽·시장 위축 — 거래량 둔화·공실 확대`;
  if ((p.popChangeRate || 0) < 0) return `인구 유출 — D1 약화(${p.d1}), 소멸위험 가속`;
  if (p.d4 < 45) return `관심도 하락 — 검색·미디어 둔화(D4 ${p.d4})`;
  return `전반적 모멘텀 둔화 — KLAI ${p.klai}, 모멘텀 ${p.momentum}`;
}

// 주차별 회전 선택 — 상위 풀에서 시드 오프셋으로 6개(주마다 다른 조명, 모두 실제 상/하위)
function pickWindow<T>(pool: T[], seed: number, count: number): T[] {
  if (pool.length <= count) return pool.slice(0, count);
  const start = seed % Math.max(1, pool.length - count);
  return pool.slice(start, start + count);
}

const _cache = new Map<string, Report>();

// 특정 ISO 주차의 주간 리포트 계산(캐시)
export function computeWeekly(year: number, week: number): Report {
  const period = weekPeriod(year, week);
  const slug = weekSlug(year, week);
  if (_cache.has(slug)) return _cache.get(slug)!;

  const { rows, national } = nationalBase();
  const seed = seedFrom(period);

  const risersPool = [...rows].filter((r) => r.p.momentum > 0).sort((a, b) => b.p.momentum - a.p.momentum).slice(0, 36);
  const fallersPool = [...rows].filter((r) => r.p.momentum < 0).sort((a, b) => a.p.momentum - b.p.momentum).slice(0, 36);

  const risers: WeeklyRiser[] = pickWindow(risersPool, seed, 6).map((r) => ({
    admCd2: r.admCd2, name: r.name, sigungu: r.sigungu, klai: r.p.klai, grade: r.p.grade, momentum: r.p.momentum, reason: riserReason(r.p),
  }));
  const fallers: WeeklyRiser[] = pickWindow(fallersPool, seed * 7 + 3, 6).map((r) => ({
    admCd2: r.admCd2, name: r.name, sigungu: r.sigungu, klai: r.p.klai, grade: r.p.grade, momentum: r.p.momentum, reason: fallerReason(r.p),
  }));

  const gentriPool = [...rows].filter((r) => r.p.gentriFlag || r.p.gentriStage >= 3).sort((a, b) => b.p.gentriG - a.p.gentriG);
  const gentriAlerts = pickWindow(gentriPool, seed * 3 + 1, 5).map((r) => ({
    admCd2: r.admCd2, name: r.name, sigungu: r.sigungu, stage: r.p.gentriStage, g: r.p.gentriG,
    reason: r.p.gentriStage >= 4 ? "임대료·브랜드 진입 급등 — 내몰림 임박" : "버즈·자본 유입 가속 — 점화 구간",
  }));
  const cliffPool = [...rows].filter((r) => r.p.marketVitality === "shrinking").sort((a, b) => a.p.klai - b.p.klai);
  const cliffs = pickWindow(cliffPool, seed * 5 + 2, 6).map((r) => ({
    admCd2: r.admCd2, name: r.name, sigungu: r.sigungu, klai: r.p.klai,
    reason: (r.p.popChangeRate || 0) < -0.5 ? "거래 위축 + 인구 유출 동반" : "거래량 둔화·공실 확대 — 가격 하락 선행 신호",
  }));

  // 스포트라이트 — 이번 주 risers 1위(서술형)
  const sp = risers[0] ?? { admCd2: rows[0].admCd2, name: rows[0].name, sigungu: rows[0].sigungu, klai: rows[0].p.klai, grade: rows[0].p.grade, momentum: rows[0].p.momentum, reason: "" };
  const writeup =
    `${sp.sigungu} ${sp.name}은 이번 주 전국 상위 모멘텀(+${sp.momentum})을 기록했다. ${sp.reason} ` +
    `검색·기사 등 서사 지표가 인구·상권에 선행하는 건강한 티핑 양상으로, 임대료가 이야기를 추월하지 않는 한 상승이 지속될 구조다. ` +
    `반대로 가격이 서사를 앞지르면 역티핑(급랭) 위험이 커진다. 상세 방향·위기·전략은 동 리포트에서 확인.`;

  // 내러티브 테마 — 유형 기반
  const narrativesHot = [`${national.topTypology} 재부상`, "로컬 크리에이터 상권", "공공투자 앵커 효과", "검색 선행 동네"];
  const narrativesCold = ["젠트리 후기 피로", "거래절벽 확산", "관광 과포화 부작용"];

  const dir = national.avgKlai >= 55 ? "완만한 상향" : "혼조";
  const overview =
    `이번 주(${period}) 전국 ${national.totalDongs.toLocaleString()}개 행정동을 분석한 결과, ` +
    `상승 ${national.risingCount.toLocaleString()}곳 · 하락 ${national.decliningCount.toLocaleString()}곳으로 전반은 ${dir} 흐름을 보였다. ` +
    `전국 평균 KLAI는 ${national.avgKlai}, 검색 관심도는 전주 대비 ${national.searchTrendPct >= 0 ? "+" : ""}${national.searchTrendPct}%, ` +
    `인구는 평균 ${national.popChangePct >= 0 ? "+" : ""}${national.popChangePct}% 변동했다. ` +
    `상승은 ${national.topTypology} 유형을 중심으로 검색·상권이 견인했고, 하락은 젠트리 후기 압력과 거래절벽(${national.cliffCount.toLocaleString()}곳)이 두드러졌다. ` +
    `젠트리 경보는 ${national.gentriCount.toLocaleString()}곳에서 감지됐다.`;

  const report: Report = {
    id: slug,
    kind: "weekly",
    title: `Flagtale Weekly · ${period} 전국 동네 변화 리포트`,
    slug,
    period,
    publishedAt: mondayOfIsoWeek(year, week),
    paywalled: false,
    provisional: true,
    summary: `${period} 전국 ${national.totalDongs.toLocaleString()}개 행정동 — 상승 ${national.risingCount}·하락 ${national.decliningCount}, 평균 KLAI ${national.avgKlai}. 성장·쇠퇴 동네와 그 이유를 연구자 관점으로 정리.`,
    blocks: {
      overview,
      national,
      risers,
      fallers,
      gentriAlerts,
      cliffs,
      narrativesHot,
      narrativesCold,
      spotlight: { admCd2: sp.admCd2, name: sp.name, sigungu: sp.sigungu, klai: sp.klai, grade: sp.grade, momentum: sp.momentum, writeup },
      methodologyNote: "KLAI 4축(인구·상권·공간·인식) 합성 + 모멘텀(축별 변화율 z-합). 검색·기사=네이버/BIG KINDS, 인구=KOSIS, 상권=소진공. 표본·잠정(Provisional) — 실데이터 확대 시 정밀화.",
    } as unknown as Record<string, unknown>,
  };
  _cache.set(slug, report);
  return report;
}

// 최근 n주 주간 리포트(목록용, 최신순)
export function listRecentWeeklies(n: number, now: Date): Report[] {
  return recentWeeks(n, now).map(({ year, week }) => computeWeekly(year, week));
}
