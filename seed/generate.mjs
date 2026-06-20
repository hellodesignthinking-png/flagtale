// ─────────────────────────────────────────────────────────────
// KLAI 시드 데이터 생성기 (빌드 스펙 Phase 0)
//
//  · Voronoi 기반 가상 행정동 폴리곤 (실제 동 낙인 방지 → 가상 동명 + 샘플 배지)
//  · 10개 분기(2024Q1~2026Q2) × 행정동 샘플 KLAI 점수·모멘텀·젠트리·시장활성도·내러티브
//  · 행정동별 진단(방향·위기·전략) + 발행 리포트(Flagtale Weekly · KLAI Annual)
//
//  결정론적(seeded). 산식 근거: [기획서] §3~§5 의 결정론적 근사.
//  실행:  npm run seed   →  data/*.json 생성
// ─────────────────────────────────────────────────────────────
import { Delaunay } from "d3-delaunay";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "data");

// ── 결정론적 PRNG (mulberry32) ───────────────────────────────
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rngGlobal = mulberry32(20260619);
const rand = (r, lo, hi) => lo + (hi - lo) * r();
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const round1 = (v) => Math.round(v * 10) / 10;

// ── 지리 범위 (안양 인근 좌표 · 데모용. 동명은 전부 가상) ──────
const BBOX = { minLng: 126.905, maxLng: 126.99, minLat: 37.372, maxLat: 37.432 };
const CITY = "새빛시"; // 가상 도시
const GU = ["한들구", "미르구", "새벌구"]; // 가상 자치구

// 가상 행정동명 풀 (순우리말 — 실재하지 않음)
const DONG_ROOTS = [
  "새벌", "한들", "미리내", "너울", "들꽃", "햇살", "별마루", "도담", "가람", "라온",
  "다온", "윤슬", "노을", "솔내", "바다실", "마루", "아라", "누리", "단비", "빛가람",
  "푸르내", "하늘", "온새미", "시나브", "그루", "미르", "여울", "벼리", "이든", "가온",
  "슬기", "토리", "보라", "초롱", "한울", "새암", "다래", "길벗", "나래", "봄빛",
  "가을", "겨우내", "소담", "예솔", "우리", "두레", "마중", "늘봄",
];

const TYPOLOGY = [
  "원도심", "신도시", "관광·핫플", "대학가", "주거안정", "산업의존", "소멸위기농산어촌",
];

// 2016 ~ 2026 연 단위 (시간 슬라이더 — 10년 변화). KOSIS 실인구(연)와 정합.
const PERIODS = (() => {
  const out = [];
  for (let y = 2016; y <= 2026; y++) out.push(`${y}`);
  return out;
})();
const LAST = PERIODS[PERIODS.length - 1];

// ── 등급 ─────────────────────────────────────────────────────
function gradeOf(k) {
  if (k >= 85) return "S";
  if (k >= 70) return "A";
  if (k >= 55) return "B";
  if (k >= 40) return "C";
  if (k >= 25) return "D";
  return "E";
}

// ── 1) Voronoi 행정동 폴리곤 생성 ────────────────────────────
const N = DONG_ROOTS.length;
const points = [];
for (let i = 0; i < N; i++) {
  points.push([
    rand(rngGlobal, BBOX.minLng, BBOX.maxLng),
    rand(rngGlobal, BBOX.minLat, BBOX.maxLat),
  ]);
}
const delaunay = Delaunay.from(points);
const voronoi = delaunay.voronoi([
  BBOX.minLng, BBOX.minLat, BBOX.maxLng, BBOX.maxLat,
]);

function polygonCentroid(ring) {
  let x = 0, y = 0, a = 0;
  for (let i = 0, n = ring.length - 1; i < n; i++) {
    const [x0, y0] = ring[i];
    const [x1, y1] = ring[i + 1];
    const cross = x0 * y1 - x1 * y0;
    a += cross;
    x += (x0 + x1) * cross;
    y += (y0 + y1) * cross;
  }
  a *= 0.5;
  if (Math.abs(a) < 1e-12) return ring[0];
  return [x / (6 * a), y / (6 * a)];
}

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// archetype·typology 배정 (권역 편향) — 수도권/광역시는 상승·젠트리 ↑, 비수도권은 쇠퇴 ↑
const METRO = new Set([
  "서울특별시", "부산광역시", "대구광역시", "인천광역시", "광주광역시",
  "대전광역시", "울산광역시", "세종특별자치시", "경기도",
]);
function assignArchetype(seed, metro) {
  const rA = mulberry32(seed)();
  if (metro) {
    if (rA < 0.3) return "rising";
    if (rA < 0.48) return "gentrifying";
    if (rA < 0.8) return "stable";
    return "declining";
  }
  if (rA < 0.16) return "rising";
  if (rA < 0.24) return "gentrifying";
  if (rA < 0.55) return "stable";
  return "declining";
}
function assignTypology(seed, archetype, metro) {
  const rT = mulberry32(seed ^ 0x9e3779b9)();
  if (archetype === "gentrifying") return rT < 0.6 ? "관광·핫플" : "원도심";
  if (archetype === "declining") return !metro && rT < 0.65 ? "소멸위기농산어촌" : "산업의존";
  if (archetype === "rising") return rT < 0.5 ? "대학가" : "신도시";
  return rT < 0.6 ? "주거안정" : "원도심";
}

const features = [];
const meta = []; // 점수 생성을 위한 메타

// ── 전국 모드: 실 행정동 경계가 있으면 그것으로 (3,554동) ──
const REAL_PATH = path.join(OUT, "boundaries", "admdong.simplified.geojson");
const NATIONWIDE = fs.existsSync(REAL_PATH);

if (NATIONWIDE) {
  const real = JSON.parse(fs.readFileSync(REAL_PATH, "utf-8"));
  real.features.forEach((f, i) => {
    const admCd2 = f.properties.admCd2;
    const metro = METRO.has(f.properties.sido);
    const seed = hashStr(admCd2);
    const archetype = assignArchetype(seed, metro);
    const typology = assignTypology(seed, archetype, metro);
    f.properties.typology = typology;
    features.push(f);
    meta.push({ admCd2, name: f.properties.name, sigungu: f.properties.sigungu, typology, archetype, i });
  });
} else {
  // ── 샘플 모드: Voronoi 가상 동 (오프라인 폴백) ──
  for (let i = 0; i < N; i++) {
    const cell = voronoi.cellPolygon(i);
    if (!cell) continue;
    const ring = cell.map(([lng, lat]) => [round6(lng), round6(lat)]);
    if (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1]) {
      ring.push(ring[0]);
    }
    const [clng, clat] = polygonCentroid(ring);
    const guIdx = Math.min(
      GU.length - 1,
      Math.floor(((points[i][0] - BBOX.minLng) / (BBOX.maxLng - BBOX.minLng)) * GU.length)
    );
    const admCd2 = "99" + String(110 + guIdx) + String(i + 1).padStart(3, "0") + "00";
    const admCd = "99" + String(110 + guIdx) + String(i + 1).padStart(2, "0").slice(0, 2) + "0";
    const name = DONG_ROOTS[i] + "동";
    const archetype = assignArchetype(1000 + i, true);
    const typology = assignTypology(2000 + i, archetype, true);
    features.push({
      type: "Feature",
      properties: {
        admCd2, admCd, name, sido: CITY, sigungu: GU[guIdx], typology,
        centroidLng: round6(clng), centroidLat: round6(clat),
      },
      geometry: { type: "Polygon", coordinates: [ring] },
    });
    meta.push({ admCd2, name, sigungu: GU[guIdx], typology, archetype, i });
  }
}

function round6(v) {
  return Math.round(v * 1e6) / 1e6;
}

// ── 1.5) 인구 장기 이력 + 나라장터 공공조달 흐름 ─────────────
// "가능한 과거 기록까지" — 인구는 2015~, 공공조달은 2016~ 연간.
const DEMO_YEARS = [];
for (let y = 2015; y <= 2026; y++) DEMO_YEARS.push(y);
const PROC_YEARS = [];
for (let y = 2016; y <= 2026; y++) PROC_YEARS.push(y);

// 인구 궤적: archetype 별 연 증감률 + 청년/고령 비율 추세
const POP_PROFILE = {
  rising: { growth: 0.016, youth0: 30, youthDrift: 0.4, eld0: 13, eldDrift: 0.5 },
  gentrifying: { growth: 0.012, youth0: 33, youthDrift: -0.6, eld0: 12, eldDrift: 0.4 },
  stable: { growth: 0.0, youth0: 24, youthDrift: -0.2, eld0: 17, eldDrift: 0.7 },
  declining: { growth: -0.022, youth0: 19, youthDrift: -0.7, eld0: 23, eldDrift: 1.3 },
};

const demographics = { years: DEMO_YEARS, byPlace: {} };
const popByYear = {}; // admCd2 → {year: {totalPop, changeRate}}
for (const m of meta) {
  const pp = POP_PROFILE[m.archetype];
  const rng = mulberry32(7000 + m.i);
  const base2026 = Math.round(rand(rng, 6500, 38000) / 100) * 100; // 2026 기준 인구
  // 2026에서 역산하여 과거 인구 복원
  const arr = [];
  popByYear[m.admCd2] = {};
  let prevPop = null;
  for (const y of DEMO_YEARS) {
    const yearsFrom2026 = y - 2026;
    const noise = 1 + rand(rng, -0.006, 0.006);
    const totalPop = Math.max(800, Math.round((base2026 * Math.pow(1 + pp.growth, yearsFrom2026) * noise) / 10) * 10);
    const idx = y - 2015;
    const youthRatio = round1(clamp(pp.youth0 + pp.youthDrift * idx + rand(rng, -0.6, 0.6), 6, 45));
    const elderlyRatio = round1(clamp(pp.eld0 + pp.eldDrift * idx + rand(rng, -0.6, 0.6), 6, 48));
    const hhSize = clamp(2.55 - idx * 0.03 + rand(rng, -0.04, 0.04), 1.7, 2.8);
    const households = Math.round(totalPop / hhSize / 10) * 10;
    const changeRate = prevPop ? round1(((totalPop - prevPop) / prevPop) * 100) : 0;
    const netMigration =
      Math.round((prevPop ? totalPop - prevPop : 0) * 0.6 + rand(rng, -120, 120));
    arr.push({ year: y, totalPop, households, youthRatio, elderlyRatio, netMigration, changeRate });
    popByYear[m.admCd2][y] = { totalPop, changeRate };
    prevPop = totalPop;
  }
  demographics.byPlace[m.admCd2] = arr;
}

// 나라장터 공공조달: 입찰 행사 + 수의계약, 카테고리별 공고예산 (만원)
const PROC_CATEGORIES = ["행사·축제", "문화·관광", "도시재생·시설", "복지·돌봄", "용역·연구", "환경·안전"];
// archetype 별 카테고리 가중(예산 배분 성향)
const PROC_MIX = {
  rising: [0.22, 0.16, 0.18, 0.12, 0.2, 0.12],
  gentrifying: [0.34, 0.24, 0.14, 0.07, 0.12, 0.09],
  stable: [0.12, 0.1, 0.2, 0.24, 0.12, 0.22],
  declining: [0.1, 0.12, 0.34, 0.22, 0.1, 0.12], // 도시재생·소멸대응 집중
};
const TITLE_POOL = {
  "행사·축제": ["가을 골목축제 운영 대행 용역", "주민 한마당 행사 무대·음향 설치", "로컬 페스티벌 기획·운영", "전통시장 활성화 행사", "청년 플리마켓 운영 용역"],
  "문화·관광": ["관광 안내체계 구축", "마을 경관·벽화 조성", "야간경관 조명 설치", "관광 콘텐츠 제작 용역"],
  "도시재생·시설": ["도시재생 뉴딜 거점시설 조성공사", "노후 보행환경 정비공사", "공영주차장 조성", "골목길 정비 및 보행로 개선", "소규모재생 앵커시설 리모델링"],
  "복지·돌봄": ["경로당 환경개선 사업", "지역아동센터 운영 위탁", "돌봄 통합지원 용역", "어르신 무료급식 지원"],
  "용역·연구": ["상권 활성화 기본계획 수립 용역", "생활인구·유동인구 분석 연구", "지역 소멸대응 전략 연구", "공공시설 타당성 조사"],
  "환경·안전": ["방범 CCTV 설치공사", "하천 환경정비", "미세먼지 저감 그린커튼", "보안등·가로등 정비"],
};
const AGENCIES = ["새빛시청", "새빛시 도시재생지원센터", "한국토지주택공사(LH)", "새빛문화재단", "새빛시 일자리경제과"];

const procurement = { years: PROC_YEARS, categories: PROC_CATEGORIES, byPlace: {} };
const budgetByYear = {}; // admCd2 → {year: total억}
for (const m of meta) {
  const rng = mulberry32(8500 + m.i);
  const mix = PROC_MIX[m.archetype];
  // 연 총예산(억) 기준선: 동 규모·유형별. declining 은 최근 도시재생 급증.
  const base = rand(rng, 8, 45);
  const annual = [];
  const records = [];
  budgetByYear[m.admCd2] = {};
  for (const y of PROC_YEARS) {
    const idx = y - 2016;
    let trend = 1 + idx * 0.05; // 완만한 증가
    if (m.archetype === "declining") trend = 1 + idx * 0.14; // 소멸대응·재생 예산 가속
    if (m.archetype === "gentrifying") trend = 1 + idx * 0.09;
    const total억 = Math.max(2, base * trend * (1 + rand(rng, -0.12, 0.12)));
    const total만 = Math.round((total억 * 10000) / 100) * 100;
    const soleRatio = clamp(0.28 + rand(rng, -0.08, 0.1), 0.15, 0.45);
    const sole만 = Math.round((total만 * soleRatio) / 100) * 100;
    const bid만 = total만 - sole만;
    const byCategory = {};
    PROC_CATEGORIES.forEach((c, ci) => {
      byCategory[c] = Math.round((total만 * mix[ci]) / 100) * 100;
    });
    const count = Math.round(rand(rng, 6, 22) * trend);
    annual.push({ year: y, bid: bid만, sole: sole만, total: total만, count, byCategory });
    budgetByYear[m.admCd2][y] = Math.round(total억);
  }
  // 대표 조달 기록 ~9건 (최근 가중)
  const nRec = 9;
  for (let r = 0; r < nRec; r++) {
    const y = PROC_YEARS[Math.min(PROC_YEARS.length - 1, Math.floor(PROC_YEARS.length * (0.4 + rand(rng, 0, 0.6))))];
    // 카테고리는 mix 가중 추출
    let acc = 0;
    const roll = rand(rng, 0, 1);
    let cat = PROC_CATEGORIES[0];
    for (let ci = 0; ci < PROC_CATEGORIES.length; ci++) {
      acc += mix[ci];
      if (roll <= acc) {
        cat = PROC_CATEGORIES[ci];
        break;
      }
    }
    const titles = TITLE_POOL[cat];
    const title = titles[Math.floor(rand(rng, 0, titles.length))];
    const type = rand(rng, 0, 1) < (cat === "용역·연구" || cat === "복지·돌봄" ? 0.5 : 0.28) ? "sole" : "bid";
    const big = cat === "도시재생·시설";
    const amount = Math.round(rand(rng, big ? 40000 : 2500, big ? 720000 : 42000) / 100) * 100;
    records.push({
      year: y,
      type,
      category: cat,
      title: `${m.name} ${title}`,
      amount,
      agency: AGENCIES[Math.floor(rand(rng, 0, AGENCIES.length))],
    });
  }
  records.sort((a, b) => b.year - a.year || b.amount - a.amount);
  procurement.byPlace[m.admCd2] = { annual, records };
}

// ── 2) 점수 시계열 생성 ──────────────────────────────────────
// archetype 별 시작 프로필 & 분기 드리프트
const PROFILE = {
  rising: { base: [50, 53, 51, 52], drift: [1.0, 1.4, 0.9, 1.8] },
  gentrifying: { base: [56, 61, 58, 63], drift: [-0.6, 2.1, 0.6, 2.5] },
  stable: { base: [52, 50, 52, 49], drift: [0.2, 0.1, 0.2, -0.1] },
  declining: { base: [41, 37, 45, 35], drift: [-1.3, -1.6, -0.9, -1.5] },
};
const WEIGHTS = [0.2, 0.3, 0.2, 0.3]; // KLAI_base = .20 d1 + .30 d2 + .20 d3 + .30 d4

const scoresByPlace = {};
for (const m of meta) {
  const prof = PROFILE[m.archetype];
  const rng = mulberry32(5000 + m.i);
  const offset = [
    rand(rng, -8, 8), rand(rng, -8, 8), rand(rng, -8, 8), rand(rng, -8, 8),
  ];
  const series = [];
  const dHist = []; // [d1,d2,d3,d4] per period
  const kHist = [];
  for (let t = 0; t < PERIODS.length; t++) {
    const d = [];
    for (let k = 0; k < 4; k++) {
      const v = prof.base[k] + offset[k] + prof.drift[k] * t + rand(rng, -2.4, 2.4);
      d.push(clamp(v, 4, 98));
    }
    dHist.push(d);

    // 모멘텀: 최근 2분기 KLAI_base 변화 + 노이즈
    const kbase = WEIGHTS.reduce((s, w, k) => s + w * d[k], 0);
    let momentum = 0;
    if (t >= 1) {
      const prevBase = kHist[t - 1].base;
      const ref = t >= 2 ? kHist[t - 2].base : prevBase;
      momentum = clamp((kbase - ref) * 1.3 + rand(rng, -1.2, 1.2), -10, 10);
    }

    // 젠트리피케이션 속도 G (z-합 근사)
    let gentriG;
    if (m.archetype === "gentrifying") {
      gentriG = clamp(0.4 + (t / (PERIODS.length - 1)) * 2.6 + rand(rng, -0.2, 0.2), 0, 3.2);
    } else if (m.archetype === "rising") {
      gentriG = clamp(0.2 + (t / (PERIODS.length - 1)) * 1.0 + rand(rng, -0.15, 0.2), 0, 3.2);
    } else if (m.archetype === "declining") {
      // 과거 과열 후 쇠퇴 → 잔존 G 낮음
      gentriG = clamp(0.6 - (t / (PERIODS.length - 1)) * 0.4 + rand(rng, -0.1, 0.2), 0, 3.2);
    } else {
      gentriG = clamp(0.3 + rand(rng, -0.2, 0.3), 0, 3.2);
    }
    const THETA = 1.45;
    const gentriFlag = gentriG > THETA;

    // 젠트리 단계 0~5
    let gentriStage;
    if (m.archetype === "gentrifying") {
      gentriStage = clamp(Math.round(1 + (t / (PERIODS.length - 1)) * 3.2), 0, 5);
    } else if (m.archetype === "declining") {
      gentriStage = t >= PERIODS.length - 3 ? 5 : 4; // 과잉임대료→공실 단계
      if (m.typology === "소멸위기농산어촌") gentriStage = 0; // 농산어촌은 젠트리 무관
    } else if (m.archetype === "rising") {
      gentriStage = clamp(Math.round((t / (PERIODS.length - 1)) * 1.4), 0, 5);
    } else {
      gentriStage = rand(rng, 0, 1) > 0.7 ? 1 : 0;
    }

    // 젠트리 경보 시 모멘텀 상한 + 소폭 감점 (Step 5)
    let klai = kbase + momentum;
    if (gentriFlag) {
      momentum = Math.min(momentum, 5.5); // M_cap
      klai = kbase + momentum - clamp((gentriG - THETA) * 1.6, 0, 4); // penalty(G)
    }
    klai = clamp(klai, 0, 100);

    // 시장 활성도 (거래량/공실/인허가 합성 → active|stable|shrinking)
    let marketVitality;
    if (m.archetype === "declining") marketVitality = t >= 3 ? "shrinking" : "stable";
    else if (m.archetype === "gentrifying") marketVitality = gentriStage >= 4 ? "shrinking" : "active";
    else if (m.archetype === "rising") marketVitality = "active";
    else marketVitality = rand(rng, 0, 1) > 0.7 ? "active" : "stable";

    // 내러티브 단계 (형성→확산→절정→쇠퇴)
    let narrativeStage, negativeNarrative = false;
    if (m.archetype === "gentrifying") {
      const f = t / (PERIODS.length - 1);
      narrativeStage = f < 0.3 ? "spread" : f < 0.7 ? "peak" : "decline";
      negativeNarrative = gentriStage >= 4;
    } else if (m.archetype === "rising") {
      narrativeStage = t / (PERIODS.length - 1) < 0.5 ? "formation" : "spread";
    } else if (m.archetype === "declining") {
      narrativeStage = "decline";
      negativeNarrative = t >= PERIODS.length - 2;
    } else {
      narrativeStage = "formation";
    }

    // 진정성 갭 (서사 vs 실제 상권)
    const authenticityGap =
      m.archetype === "gentrifying"
        ? round1(clamp(0.2 + (t / (PERIODS.length - 1)) * 0.55 + rand(rng, -0.05, 0.05), 0, 1))
        : round1(clamp(0.15 + rand(rng, -0.08, 0.12), 0, 1));

    // 인구·공공예산 (해당 연도 연간값 부착 → 지도 레이어·슬라이더 연동)
    const year = parseInt(PERIODS[t].slice(0, 4), 10);
    const popInfo = popByYear[m.admCd2]?.[year] ?? { totalPop: 0, changeRate: 0 };
    const budgetInflow = budgetByYear[m.admCd2]?.[year] ?? 0; // 억원/년

    kHist.push({ base: kbase });
    series.push({
      period: PERIODS[t],
      klai: round1(klai),
      grade: gradeOf(klai),
      d1: round1(d[0]),
      d2: round1(d[1]),
      d3: round1(d[2]),
      d4: round1(d[3]),
      momentum: round1(momentum),
      gentriG: round1(gentriG),
      gentriStage,
      gentriFlag,
      marketVitality,
      narrativeStage,
      negativeNarrative,
      authenticityGap,
      population: popInfo.totalPop,
      popChangeRate: popInfo.changeRate,
      budgetInflow,
      provisional: true,
    });
  }
  scoresByPlace[m.admCd2] = series;
}

// ── 2.6) 지역 신호 (검색량·기사량·인구·임대료·매물) ───────────
// archetype 별 lead-lag 구조 — "무엇이 먼저 움직였나"가 이유를 가른다.
//   gentrifying: 검색→기사→인구→매물→임대료 (서사 선행, 건강한 티핑)
//   declining:   인구·매물·임대료 동반 하락 + 검색·기사 늦은 부정 버즈
const SIGNAL_KEYS = ["search", "news", "population", "rent", "listings"];
const SIGNAL_PROFILE = {
  gentrifying: {
    search: { c: 2.4, s: 1.4, lo: 24, hi: 93 },
    news: { c: 3.6, s: 1.3, lo: 20, hi: 87 },
    population: { c: 4.7, s: 1.0, lo: 36, hi: 75 },
    rent: { c: 6.3, s: 1.0, lo: 30, hi: 91 },
    listings: { c: 4.1, s: 1.2, lo: 30, hi: 85 },
  },
  rising: {
    search: { c: 3.3, s: 0.9, lo: 38, hi: 75 },
    news: { c: 3.8, s: 0.9, lo: 34, hi: 70 },
    population: { c: 4.2, s: 0.8, lo: 42, hi: 73 },
    rent: { c: 4.9, s: 0.8, lo: 38, hi: 69 },
    listings: { c: 4.0, s: 0.9, lo: 40, hi: 74 },
  },
  stable: {
    search: { c: 5, s: 0.2, lo: 46, hi: 55 },
    news: { c: 5, s: 0.2, lo: 44, hi: 54 },
    population: { c: 5, s: 0.15, lo: 47, hi: 53 },
    rent: { c: 5, s: 0.2, lo: 46, hi: 56 },
    listings: { c: 5, s: 0.2, lo: 45, hi: 55 },
  },
  declining: {
    search: { c: 7.2, s: 1.0, lo: 22, hi: 46 }, // 늦은 부정 버즈 반등
    news: { c: 7.6, s: 1.1, lo: 20, hi: 50 },
    population: { c: 4.0, s: 0.9, lo: 64, hi: 26 }, // 하락 (hi<lo)
    rent: { c: 5.0, s: 0.7, lo: 54, hi: 32 }, // 약세(하방경직 천천히)
    listings: { c: 5.0, s: 0.9, lo: 60, hi: 24 }, // 거래 위축
  },
};
function logistic(t, p, rng) {
  const v = p.lo + (p.hi - p.lo) / (1 + Math.exp(-p.s * (t - p.c)));
  return clamp(Math.round(v + rand(rng, -4, 4)), 2, 99);
}
const signals = { periods: PERIODS, keys: SIGNAL_KEYS, byPlace: {} };
for (const m of meta) {
  const prof = SIGNAL_PROFILE[m.archetype];
  const rng = mulberry32(11000 + m.i);
  const obj = {};
  for (const k of SIGNAL_KEYS) obj[k] = PERIODS.map((_, t) => logistic(t, prof[k], rng));
  signals.byPlace[m.admCd2] = obj;
}

// ── 3) 진단 생성 (최신 분기 기준) ────────────────────────────
const SUB_LABELS = {
  d1: ["인구 재생산력", "순유입", "연령 균형"],
  d2: ["창업·생존", "업종 다양성", "매출 성장", "점포밀도·공실", "임대 경제성", "시장 활성도"],
  d3: ["용도 혼합", "보행·접촉", "건물 노후·다양성", "접근성", "자산가치"],
  d4: ["감성(매력)", "언급량·인기", "미디어·확산"],
};
const AXIS_NAME = { d1: "인구·지속성", d2: "경제·상권", d3: "공간·물리", d4: "인식·감성" };

function topFactorsFor(latest, archetype, rng) {
  // 축별 기여 근사: 가중치 × (점수-50) → 부호 있는 기여
  const axes = ["d1", "d2", "d3", "d4"];
  const w = { d1: 0.2, d2: 0.3, d3: 0.2, d4: 0.3 };
  const contrib = axes.map((ax) => {
    const subs = SUB_LABELS[ax];
    const sub = subs[Math.floor(rand(rng, 0, subs.length))];
    return {
      key: `${AXIS_NAME[ax]} · ${sub}`,
      impact: round1(w[ax] * (latest[ax] - 50) + rand(rng, -3, 3)),
    };
  });
  contrib.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
  return contrib.slice(0, 3);
}

const GENTRI_STAGE_NAME = [
  "0 잠재", "1 태동", "2 점화", "3 과열", "4 내몰림", "5 쇠퇴",
];

const diagnoses = {};
for (const m of meta) {
  const series = scoresByPlace[m.admCd2];
  const latest = series[series.length - 1];
  const rng = mulberry32(9000 + m.i);

  let trajectory;
  if (m.archetype === "gentrifying") trajectory = "gentrifying";
  else if (m.archetype === "rising") trajectory = "rising";
  else if (m.archetype === "declining") trajectory = "declining";
  else trajectory = "stable";

  // 젠트리 전이확률·예상시점
  const nextStage = Math.min(5, latest.gentriStage + 1);
  const gentriTransition = {
    nextStage,
    nextStageName: GENTRI_STAGE_NAME[nextStage],
    prob: round1(
      clamp(
        (latest.gentriFlag ? 0.55 : 0.25) + latest.gentriG * 0.08 + rand(rng, -0.05, 0.05),
        0.05,
        0.92
      )
    ),
    etaMonths: Math.round(rand(rng, 6, 18)),
  };

  // 소멸 원인 (트리거/증폭/결과)
  const declineCauses =
    trajectory === "declining"
      ? [
          { factor: "일자리·소득 부재 (청년 유출)", role: "trigger" },
          { factor: "정주 인프라(의료·교육·상점) 공백", role: "amplifier" },
          { factor: "인구 감소 → 추가 폐업", role: "result" },
        ]
      : [];

  // 위기 목록
  const risks = [];
  if (latest.gentriFlag)
    risks.push({
      type: "gentri",
      severity: latest.gentriStage >= 4 ? "high" : "mid",
      title: `젠트리피케이션 ${GENTRI_STAGE_NAME[latest.gentriStage]} 감지`,
      detail: `임대료·손바뀜·브랜드 진입 급증. 다음 단계(${gentriTransition.nextStageName}) 전이확률 ${Math.round(gentriTransition.prob * 100)}% · 예상 ${gentriTransition.etaMonths}개월.`,
    });
  if (latest.marketVitality === "shrinking")
    risks.push({
      type: "transaction_cliff",
      severity: "high",
      title: "거래 절벽 · 공실 급증",
      detail: "임대료는 하방경직으로 버티나 거래량·공실 기간 지표가 위축. 가격 하락에 선행하는 쇠퇴 신호.",
    });
  if (latest.negativeNarrative)
    risks.push({
      type: "negative_narrative",
      severity: "mid",
      title: "부정 서사 임계 접근 (역 티핑포인트)",
      detail: `진정성 갭 ${latest.authenticityGap} — "예전 같지 않다" 서사 확산. 상권을 띄운 이야기가 무너뜨리는 국면.`,
    });
  if (trajectory === "declining")
    risks.push({
      type: "decline",
      severity: "high",
      title: "소멸 악순환 진입",
      detail: "청년·여성 유출 → 정주여건 악화 → 추가 유출 루프 가동.",
    });

  // 전략 목록 (유형·궤적별 처방)
  const strategy = [];
  if (trajectory === "gentrifying") {
    strategy.push({ title: "상생협약·임대료 안정", detail: "1~2단계 개입 창에서 앵커 임차인 보전·공공임대상가 확보로 맥락(저임대) 유지." });
    strategy.push({ title: "장소 고유 이야기 육성", detail: "고착성 높은 한 줄 정체성 강화 — 휘발성 팝업 의존도 축소로 진정성 갭 완화." });
  } else if (trajectory === "declining") {
    strategy.push({ title: "레버리지 = 일자리 고리 절단", detail: "악순환에서 가장 센 구속조건(소득·일자리)에 집중 투입 — 인구는 결과, 경제가 원인." });
    strategy.push({ title: "정주 인프라 거점화", detail: "의료·생활서비스 거점 + 청년주택으로 유출 고리 약화." });
  } else if (trajectory === "rising") {
    strategy.push({ title: "성공 DNA 강화", detail: "앵커·다양성·진정성·보행성 선순환 가속 — 신규창업 유입 다양성 보전." });
    strategy.push({ title: "선제 젠트리 모니터링", detail: "버즈·임대료 선행지표 추적으로 과열 진입 전 상생 장치 준비." });
  } else {
    strategy.push({ title: "앵커 시설 점화", detail: "잠재(0단계) → 태동 전환을 위한 키스톤 업종(로컬 F&B·문화) 유치 실험." });
    strategy.push({ title: "보행·용도혼합 개선", detail: "Jacobs 활력 조건(짧은 블록·노후/신축 혼합) 보강." });
  }
  if (m.typology === "관광·핫플")
    strategy.push({ title: "(ZeroSite) LH 입지 가산", detail: "동네 매력·모멘텀을 LH 매입임대 입지 적합성에 가산점으로 환류." });

  diagnoses[m.admCd2] = {
    admCd2: m.admCd2,
    period: LAST,
    trajectory,
    topFactors: topFactorsFor(latest, m.archetype, rng),
    gentriStage: latest.gentriStage,
    gentriStageName: GENTRI_STAGE_NAME[latest.gentriStage],
    gentriTransition,
    declineCauses,
    leverage:
      trajectory === "declining"
        ? "일자리·소득 고리 (구속조건)"
        : trajectory === "gentrifying"
        ? "임대료 안정 (맥락 보전)"
        : trajectory === "rising"
        ? "다양성 보전 (선순환 유지)"
        : "앵커 점화 (0→1 전환)",
    narrativeTheme:
      m.typology === "관광·핫플"
        ? "골목 감성 · 재생 공간의 힙"
        : m.typology === "대학가"
        ? "청년 창업 · 실험적 로컬"
        : m.typology === "소멸위기농산어촌"
        ? "정주 위기 · 빈집 증가"
        : "생활 밀착 · 조용한 안정",
    authenticityGap: latest.authenticityGap,
    successPath:
      trajectory === "rising" || trajectory === "stable"
        ? `${m.typology}형 성공 경로 적합도 ${Math.round(rand(rng, 55, 88))}%`
        : null,
    risks,
    strategy,
    provisional: true,
  };
}

// ── 4) 발행 리포트 생성 (데이터 기반) ────────────────────────
const placesWithLatest = meta.map((m) => {
  const series = scoresByPlace[m.admCd2];
  return { ...m, latest: series[series.length - 1], prev: series[series.length - 2] };
});

function nameByCd(admCd2) {
  return features.find((f) => f.properties.admCd2 === admCd2)?.properties.name ?? admCd2;
}

const risers = [...placesWithLatest]
  .sort((a, b) => b.latest.momentum - a.latest.momentum)
  .slice(0, 5)
  .map((p) => ({ admCd2: p.admCd2, name: p.name, sigungu: p.sigungu, klai: p.latest.klai, grade: p.latest.grade, momentum: p.latest.momentum }));
const fallers = [...placesWithLatest]
  .sort((a, b) => a.latest.momentum - b.latest.momentum)
  .slice(0, 5)
  .map((p) => ({ admCd2: p.admCd2, name: p.name, sigungu: p.sigungu, klai: p.latest.klai, grade: p.latest.grade, momentum: p.latest.momentum }));
const gentriAll = placesWithLatest.filter((p) => p.latest.gentriFlag);
const cliffAll = placesWithLatest.filter((p) => p.latest.marketVitality === "shrinking");
const gentriCount = gentriAll.length;
const cliffCount = cliffAll.length;
// 전국 규모 → 리포트에는 상위만 노출 (count 는 전체)
const gentriAlerts = [...gentriAll]
  .sort((a, b) => b.latest.gentriStage - a.latest.gentriStage || b.latest.gentriG - a.latest.gentriG)
  .slice(0, 12)
  .map((p) => ({ admCd2: p.admCd2, name: p.name, sigungu: p.sigungu, stage: p.latest.gentriStage, g: p.latest.gentriG }));
const cliffs = [...cliffAll]
  .sort((a, b) => a.latest.klai - b.latest.klai)
  .slice(0, 12)
  .map((p) => ({ admCd2: p.admCd2, name: p.name, sigungu: p.sigungu, klai: p.latest.klai }));
const spotlightP = risers[0];

const reports = [];

// 4-1) Flagtale Weekly × 3
const WEEKS = [
  { slug: "flagtale-weekly-2026-w24", period: "2026-W24", publishedAt: "2026-06-15" },
  { slug: "flagtale-weekly-2026-w23", period: "2026-W23", publishedAt: "2026-06-08" },
  { slug: "flagtale-weekly-2026-w22", period: "2026-W22", publishedAt: "2026-06-01" },
];
WEEKS.forEach((w, idx) => {
  const shift = (arr) => arr.map((x, i) => (idx === 0 ? x : { ...x, momentum: x.momentum != null ? round1(x.momentum - idx * 0.6 + (i % 2 ? 0.3 : -0.2)) : x.momentum }));
  reports.push({
    id: `rep_${w.slug}`,
    kind: "weekly",
    title: `Flagtale Weekly · ${w.period}`,
    slug: w.slug,
    period: w.period,
    publishedAt: w.publishedAt,
    paywalled: false,
    provisional: true,
    summary: `이주의 상승 ${risers[0].name}(+${risers[0].momentum}) · 신규 젠트리 경보 ${gentriAlerts.length}곳 · 거래절벽 ${cliffs.length}곳. 심층 스포트라이트: ${spotlightP.name}.`,
    blocks: {
      risers: shift(risers),
      fallers: shift(fallers),
      gentriAlerts,
      cliffs,
      narrativesHot: placesWithLatest.filter((p) => p.latest.narrativeStage === "spread").slice(0, 3).map((p) => p.name),
      narrativesCold: placesWithLatest.filter((p) => p.latest.negativeNarrative).slice(0, 3).map((p) => p.name),
      spotlight: {
        admCd2: spotlightP.admCd2,
        name: spotlightP.name,
        klai: spotlightP.klai,
        grade: spotlightP.grade,
        momentum: spotlightP.momentum,
      },
    },
  });
});

// 4-2) KLAI Annual × 1 (매력동네 100) — 전국 상위 100
const annualRanking = [...placesWithLatest]
  .sort((a, b) => b.latest.klai - a.latest.klai)
  .slice(0, 100)
  .map((p, rank) => ({
    rank: rank + 1,
    admCd2: p.admCd2,
    name: p.name,
    sigungu: p.sigungu,
    typology: p.typology,
    klai: p.latest.klai,
    grade: p.latest.grade,
    momentum: p.latest.momentum,
  }));
const typologyBreakdown = {};
for (const p of placesWithLatest) {
  typologyBreakdown[p.typology] = typologyBreakdown[p.typology] || { count: 0, klaiSum: 0 };
  typologyBreakdown[p.typology].count++;
  typologyBreakdown[p.typology].klaiSum += p.latest.klai;
}
const typologyStats = Object.entries(typologyBreakdown).map(([k, v]) => ({
  typology: k,
  count: v.count,
  avgKlai: round1(v.klaiSum / v.count),
}));

reports.push({
  id: "rep_klai-annual-2026",
  kind: "annual",
  title: "KLAI Annual 2026 · 매력동네 100",
  slug: "klai-annual-2026",
  period: "2026",
  publishedAt: "2026-06-01",
  paywalled: false,
  provisional: true,
  summary: `${CITY} 전 행정동 ${placesWithLatest.length}곳 매력도 랭킹. 평균 KLAI ${round1(placesWithLatest.reduce((s, p) => s + p.latest.klai, 0) / placesWithLatest.length)}점. 젠트리 경보 ${gentriAlerts.length}곳 · 소멸위기 진입 ${placesWithLatest.filter((p) => diagnoses[p.admCd2].trajectory === "declining").length}곳.`,
  blocks: {
    ranking: annualRanking,
    typologyStats,
    avgKlai: round1(placesWithLatest.reduce((s, p) => s + p.latest.klai, 0) / placesWithLatest.length),
    gentriCount: gentriAlerts.length,
    declineCount: placesWithLatest.filter((p) => diagnoses[p.admCd2].trajectory === "declining").length,
  },
});

// ── 5) 파일 쓰기 ─────────────────────────────────────────────
fs.mkdirSync(OUT, { recursive: true });

const geojson = { type: "FeatureCollection", features };
fs.writeFileSync(path.join(OUT, "districts.geojson"), JSON.stringify(geojson));
fs.writeFileSync(
  path.join(OUT, "scores.json"),
  JSON.stringify({ periods: PERIODS, last: LAST, byPlace: scoresByPlace })
);
fs.writeFileSync(path.join(OUT, "diagnoses.json"), JSON.stringify(diagnoses));
fs.writeFileSync(path.join(OUT, "reports.json"), JSON.stringify(reports));
fs.writeFileSync(path.join(OUT, "demographics.json"), JSON.stringify(demographics));
fs.writeFileSync(path.join(OUT, "procurement.json"), JSON.stringify(procurement));
fs.writeFileSync(path.join(OUT, "signals.json"), JSON.stringify(signals));

console.log(`✓ districts.geojson  — ${features.length} 행정동`);
console.log(`✓ scores.json        — ${features.length} × ${PERIODS.length} 분기 (+인구·예산)`);
console.log(`✓ diagnoses.json     — ${Object.keys(diagnoses).length} 진단`);
console.log(`✓ reports.json       — ${reports.length} 리포트 (weekly ${WEEKS.length} + annual 1)`);
console.log(`✓ demographics.json  — ${features.length} × ${DEMO_YEARS.length}년 인구 (${DEMO_YEARS[0]}~${DEMO_YEARS.at(-1)})`);
console.log(`✓ procurement.json   — ${features.length} × ${PROC_YEARS.length}년 나라장터 공공조달 (${PROC_YEARS[0]}~${PROC_YEARS.at(-1)})`);
console.log(`✓ signals.json       — ${features.length} × 5신호(검색·기사·인구·임대료·매물) × ${PERIODS.length}분기`);
console.log(`  도시: ${CITY} · 자치구 ${GU.join("/")} · 기간 ${PERIODS[0]}~${LAST}`);
