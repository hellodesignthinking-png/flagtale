// ─────────────────────────────────────────────────────────────
// KOSIS 인구 커넥터 — 실데이터로 demographics.json · scores.json 갱신.
//
//   node scripts/build-population.mjs          # DRY-RUN: 수신·매칭·검증만 출력(파일 안 건드림)
//   node scripts/build-population.mjs --write   # 실제 기록
//
//  소스(통계청 KOSIS, orgId=101):
//   · DT_1B040A3  행정구역(시군구)별 성별 인구수  → 총인구(T20)  2015~2025
//   · DT_1B040B3  행정구역(시군구)별 주민등록세대수 → 세대수(T1)
//
//  크로스워크: 우리 adm_cd2(10자리) 앞 5자리 == KOSIS C1(시군구 5자리).
//  ⚠ 해상도: KOSIS 이 표는 '시군구' 단위 → 동별로는 소속 시군구 값을 공유(브로드캐스트).
//     화면에는 '시군구 단위'로 명시 라벨. 청년/고령·순이동은 이 표에 없어 기존 추정값 유지(추정 라벨).
// ─────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, "data");
const WRITE = process.argv.includes("--write");
const log = (m) => console.log(`[pop] ${m}`);

function loadEnv() {
  for (const f of [".env.local", ".env"]) {
    const p = path.join(ROOT, f);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, "utf-8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

async function kosis(tblId, itmId) {
  const key = process.env.KOSIS_API_KEY;
  const url =
    `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${key}` +
    `&format=json&jsonVD=Y&orgId=101&tblId=${tblId}&prdSe=Y&newEstPrdCnt=11&objL1=ALL&itmId=${itmId}`;
  const rows = await (await fetch(url)).json();
  if (!Array.isArray(rows)) throw new Error(`${tblId}: ${JSON.stringify(rows).slice(0, 120)}`);
  return rows;
}

async function main() {
  loadEnv();
  if (!process.env.KOSIS_API_KEY) return log("KOSIS_API_KEY 없음 — 중단.");

  log("KOSIS 총인구(DT_1B040A3·T20) 수신…");
  const popRows = await kosis("DT_1B040A3", "T20");
  log("KOSIS 세대수(DT_1B040B3·T1) 수신…");
  const hhRows = await kosis("DT_1B040B3", "T1");

  // 시군구(5자리)만 추출: sig5 → { year → value }
  const popBySig = {}; // 총인구
  const hhBySig = {}; // 세대수
  const collect = (rows, dst) => {
    for (const r of rows) {
      const c1 = String(r.C1);
      if (c1.length !== 5) continue; // 시군구만 (전국 '00'·시도 2자리 제외)
      const y = Number(r.PRD_DE);
      const v = Number(r.DT);
      if (!Number.isFinite(v)) continue;
      (dst[c1] ??= {})[y] = v;
    }
  };
  collect(popRows, popBySig);
  collect(hhRows, hhBySig);

  const years = [...new Set(popRows.map((r) => Number(r.PRD_DE)))].sort((a, b) => a - b);
  const sigCodes = Object.keys(popBySig);
  log(`시군구 수신: 인구 ${sigCodes.length}곳 · 세대 ${Object.keys(hhBySig).length}곳 · 연도 ${years[0]}~${years[years.length - 1]}`);

  // ── 검증: 전국 합 vs KOSIS '00' 전국값 (마지막 연도) ──
  const lastY = years[years.length - 1];
  const sumSig = sigCodes.reduce((s, c) => s + (popBySig[c][lastY] || 0), 0);
  const natRow = popRows.find((r) => String(r.C1) === "00" && Number(r.PRD_DE) === lastY);
  const nat = natRow ? Number(natRow.DT) : 0;
  log(`검증 ${lastY}: 시군구합=${sumSig.toLocaleString()} vs 전국=${nat.toLocaleString()} (차이 ${nat ? (((sumSig - nat) / nat) * 100).toFixed(2) : "?"}%)`);
  // 스팟체크
  for (const [code, name] of [["11680", "강남구"], ["11110", "종로구"], ["26110", "부산 중구"]]) {
    const v = popBySig[code]?.[lastY];
    log(`  스팟 ${name}(${code}) ${lastY}: ${v ? v.toLocaleString() + "명" : "없음"}`);
  }

  // ── 크로스워크: 동 adm_cd2 → 소속 시군구 ──
  const districts = JSON.parse(fs.readFileSync(path.join(DATA, "districts.geojson"), "utf-8"));
  const dongs = districts.features.map((f) => f.properties);
  let matched = 0;
  const unmatched = new Set();
  for (const d of dongs) {
    const sig5 = String(d.admCd2).slice(0, 5);
    if (popBySig[sig5]) matched++;
    else unmatched.add(sig5);
  }
  log(`동 매칭: ${matched}/${dongs.length} (${((matched / dongs.length) * 100).toFixed(1)}%) · 미매칭 시군구코드 ${unmatched.size}개`);
  if (unmatched.size) log(`  미매칭 예: ${[...unmatched].slice(0, 10).join(", ")}`);

  if (!WRITE) {
    log("DRY-RUN 종료. 이상 없으면 --write 로 실제 기록.");
    return;
  }

  // ── demographics.json 재작성 ──
  const demo = JSON.parse(fs.readFileSync(path.join(DATA, "demographics.json"), "utf-8"));
  const oldYears = demo.years;
  let popWritten = 0;
  for (const d of dongs) {
    const cd = d.admCd2;
    const sig5 = String(cd).slice(0, 5);
    const sig = popBySig[sig5];
    const hh = hhBySig[sig5];
    if (!sig) continue; // 미매칭은 기존(추정) 유지
    const prev = demo.byPlace[cd] ?? [];
    const prevByYear = Object.fromEntries(prev.map((p) => [p.year, p]));
    demo.byPlace[cd] = years.map((y, i) => {
      const totalPop = sig[y] ?? sig[lastY];
      const py = sig[years[i - 1]] ?? totalPop;
      const changeRate = py ? Math.round(((totalPop - py) / py) * 1000) / 10 : 0;
      const old = prevByYear[y] ?? prev[Math.min(i, prev.length - 1)] ?? {};
      return {
        year: y,
        totalPop, // ✅ 실데이터(시군구)
        households: hh?.[y] ?? hh?.[lastY] ?? old.households ?? 0, // ✅ 실데이터(시군구)
        youthRatio: old.youthRatio ?? 0, // 추정 유지
        elderlyRatio: old.elderlyRatio ?? 0, // 추정 유지
        netMigration: old.netMigration ?? 0, // 추정 유지
        changeRate, // ✅ 실데이터 파생
      };
    });
    popWritten++;
  }
  demo.years = years;
  demo.popMeta = {
    source: "통계청 KOSIS",
    tables: ["DT_1B040A3 총인구", "DT_1B040B3 세대수"],
    resolution: "sigungu", // 시군구 단위 (동별 공유)
    real: ["totalPop", "households", "changeRate"],
    estimated: ["youthRatio", "elderlyRatio", "netMigration"],
    years: [years[0], years[years.length - 1]],
    fetchedFor: lastY,
  };

  // ── scores.json: period(분기) population·popChangeRate 실데이터로 ──
  const scores = JSON.parse(fs.readFileSync(path.join(DATA, "scores.json"), "utf-8"));
  const yearOf = (period) => Number(period.slice(0, 4));
  let scoreWritten = 0;
  for (const cd in scores.byPlace) {
    const sig5 = String(cd).slice(0, 5);
    const sig = popBySig[sig5];
    if (!sig) continue;
    for (const s of scores.byPlace[cd]) {
      const y = Math.min(yearOf(s.period), lastY); // KOSIS 최신=lastY (2026 분기는 lastY 사용)
      const pop = sig[y] ?? sig[lastY];
      const py = sig[y - 1] ?? pop;
      s.population = pop;
      s.popChangeRate = py ? Math.round(((pop - py) / py) * 1000) / 10 : 0;
    }
    scoreWritten++;
  }

  fs.writeFileSync(path.join(DATA, "demographics.json"), JSON.stringify(demo));
  fs.writeFileSync(path.join(DATA, "scores.json"), JSON.stringify(scores));
  // .ingested 에 population 추가
  const ingPath = path.join(DATA, ".ingested.json");
  const ing = new Set(fs.existsSync(ingPath) ? JSON.parse(fs.readFileSync(ingPath, "utf-8")) : ["boundary"]);
  ing.add("population");
  fs.writeFileSync(ingPath, JSON.stringify([...ing]));

  log(`기록 완료: demographics ${popWritten}동 · scores ${scoreWritten}동 · years ${years[0]}~${years[years.length - 1]}`);
  log("인구·세대수=실데이터(시군구) / 청년·고령·순이동=추정 유지. .ingested 에 population 추가.");
}
main().catch((e) => console.error("[pop] 실패:", e.message));
