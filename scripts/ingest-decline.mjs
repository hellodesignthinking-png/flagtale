// 발전가능성(국토부 도시재생 쇠퇴진단 등급) — data.go.kr 1611000/DceDgnssGradeService/getGradeSigngu.
//   시군구별 핵심 지표 등급(1~10, 높을수록 양호) 합성 → data/potential.json. 동단위 broadcast.
//   지표: 인구순이동·인구변화율·재정자립도·총사업체수증감(인구·경제·재정 균형). 2021년.
// 사용: DATA_GO_KR_KEY=... npm run ingest:decline   (키는 env로만, 활용신청 승인 필요)
// ⚠ 응답은 body 에 단건. signguCd=행안부 5자리(admCd2[:5]). data.go.kr 레이트리밋 → 백오프·resumable.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, "data");
const log = (m) => console.log(`[potential] ${m}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  for (const line of fs.readFileSync(path.join(ROOT, ".env.local"), "utf-8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch { /* 없음 */ }
const KEY = process.env.DATA_GO_KR_KEY;
if (!KEY) { console.error("DATA_GO_KR_KEY 없음."); process.exit(1); }
const ek = encodeURIComponent(KEY);
const B = "http://apis.data.go.kr/1611000/DceDgnssGradeService/getGradeSigngu";
const YEAR = process.env.DECLINE_YEAR || "2021";
// 핵심 지표(등급 1~10, 높을수록 양호) — 인구·경제·재정 균형 합성
// 3부문(인구·경제·물리) 종합 — 등급 1~10 모두 높을수록 양호(방향 일관). 활성화/잠재력 별도 서비스 미발견 → 쇠퇴진단 전부문으로 대체.
const INDICATORS = [
  ["인구변화", "GRADE00003"],   // 인구사회
  ["재정자립", "GRADE00021"],   // 산업경제
  ["사업체증감", "GRADE00027"], // 산업경제
  ["지가변동", "GRADE00023"],   // 자산
  ["공가율", "GRADE00035"],     // 물리환경(낮은 공가=양호)
  ["접도율", "GRADE00041"],     // 물리환경(접근성)
];

async function grade(signguCd, gradeCd) {
  for (let a = 0; a < 3; a++) {
    try {
      const r = await fetch(`${B}?serviceKey=${ek}&type=json&numOfRows=1&pageNo=1&signguCd=${signguCd}&gradeCd=${gradeCd}&year=${YEAR}`, { signal: AbortSignal.timeout(12000) });
      const t = await r.text();
      let j; try { j = JSON.parse(t); } catch { if (a < 2) { await sleep(800 * (a + 1)); continue; } return { err: t.slice(0, 60) }; }
      const b = j.body;
      if (b && b.value != null) return { value: Number(b.value) };
      return { value: null, rc: j.header?.resultCode };
    } catch (e) { if (a < 2) { await sleep(800 * (a + 1)); continue; } return { err: e.message }; }
  }
}

async function main() {
  // 행안부 시군구(admCd2[:5]) + 동 목록
  const scores = Object.keys(JSON.parse(fs.readFileSync(path.join(DATA, "scores.json"), "utf-8")).byPlace);
  const sigOf = {}; const sigSet = new Set();
  for (const cd of scores) { const s = cd.slice(0, 5); sigOf[cd] = s; sigSet.add(s); }
  const sigs = [...sigSet];
  log(`시군구 ${sigs.length}곳 × 지표 ${INDICATORS.length} (year ${YEAR}) 수집`);

  // resumable
  let bySig = {};
  try { bySig = JSON.parse(fs.readFileSync(path.join(DATA, "potential.raw.json"), "utf-8")); } catch { /* 신규 */ }

  let ok = 0, consec = 0, diag = true;
  for (let i = 0; i < sigs.length; i++) {
    const sg = sigs[i];
    if (bySig[sg]) continue;
    const vals = {};
    let any = false;
    for (const [name, g] of INDICATORS) {
      const r = await grade(sg, g);
      if (diag) { log(`진단(${sg} ${name}): ${JSON.stringify(r)}`); diag = false; }
      if (r.value != null) { vals[name] = r.value; any = true; consec = 0; }
      else consec++;
      await sleep(130);
    }
    if (any) { bySig[sg] = vals; ok++; }
    if (consec >= 30) { fs.writeFileSync(path.join(DATA, "potential.raw.json"), JSON.stringify(bySig)); log(`연속 실패 ${consec} — 90초 대기(레이트리밋)…`); await sleep(90000); consec = 0; }
    if ((i + 1) % 20 === 0) { fs.writeFileSync(path.join(DATA, "potential.raw.json"), JSON.stringify(bySig)); log(`진행 ${i + 1}/${sigs.length} (성공 ${ok})`); }
  }
  fs.writeFileSync(path.join(DATA, "potential.raw.json"), JSON.stringify(bySig));
  log(`시군구 수집 완료: ${Object.keys(bySig).length}곳`);

  // 동별 broadcast + 합성 등급(평균 1~10)
  const byPlace = {};
  let matched = 0;
  for (const cd of scores) {
    const v = bySig[sigOf[cd]];
    if (!v) continue;
    const arr = Object.values(v).filter((x) => Number.isFinite(x));
    if (!arr.length) continue;
    const g = Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10;
    byPlace[cd] = { grade: g, indicators: v };
    matched++;
  }
  fs.writeFileSync(path.join(DATA, "potential.json"), JSON.stringify({
    source: "국토부 도시재생 쇠퇴진단 등급(시군구) data.go.kr 1611000",
    fetchedAt: new Date().toISOString().slice(0, 10),
    year: YEAR,
    note: "등급 1~10(높을수록 양호). 인구순이동·인구변화·재정자립·사업체증감 평균 = 발전가능성 등급.",
    byPlace,
  }));
  log(`완료 → data/potential.json (${matched}동, 시군구 단위)`);
  if (matched) {
    const ip = path.join(DATA, ".ingested.json");
    let prev = []; try { prev = JSON.parse(fs.readFileSync(ip, "utf-8")); } catch { /* 없음 */ }
    fs.writeFileSync(ip, JSON.stringify([...new Set([...prev, "potential"])]));
    log(".ingested 에 'potential' 표시.");
  }
}
main().catch((e) => console.error("[potential] 실패:", e.message));
