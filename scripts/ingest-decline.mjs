// 발전가능성 — 국토부 도시재생 쇠퇴진단 등급(읍면동) (data.go.kr 1611000/DceDgnssGradeService).
//   읍면동별 쇠퇴 등급(인구사회·산업경제·물리환경 3부문) → data/decline.json. 동단위 발전가능성/쇠퇴 신호.
// 사용: DATA_GO_KR_KEY=... node scripts/ingest-decline.mjs   (키는 env로만)
// ⚠ 활용신청 승인 직후 키 활성화 전파 지연 → 403이면 자동 재시도(최대 ~1시간).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, "data");
const log = (m) => console.log(`[decline] ${m}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  for (const line of fs.readFileSync(path.join(ROOT, ".env.local"), "utf-8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch { /* 없음 */ }
const KEY = process.env.DATA_GO_KR_KEY;
if (!KEY) { console.error("DATA_GO_KR_KEY 없음."); process.exit(1); }

const B = "http://apis.data.go.kr/1611000/DceDgnssGradeService/";
const ek = encodeURIComponent(KEY);

// 승인 전파 대기 — getGradeEmd(읍면동) 200 될 때까지 재시도
async function waitActive() {
  for (let i = 0; i < 30; i++) {
    try {
      const r = await fetch(`${B}getGradeEmd?serviceKey=${ek}&type=json&numOfRows=1&pageNo=1`);
      const t = await r.text();
      if (r.status === 200 && /resultCode/.test(t) && !/Forbidden|등록되지|SERVICE_KEY/.test(t)) { log(`활성화 확인(${i + 1}회차)`); return true; }
      log(`대기 ${i + 1}/30 — HTTP ${r.status} (전파 중)…`);
    } catch (e) { log(`대기 ${i + 1} — ${e.message}`); }
    await sleep(120000); // 2분
  }
  return false;
}

function pickField(obj, res) { for (const k of Object.keys(obj)) if (res.test(k)) return k; return null; }

async function main() {
  log("쇠퇴진단 등급(읍면동) 활성화 대기…");
  if (!(await waitActive())) { log("1시간 내 활성화 안 됨 — 나중에 재실행."); process.exit(1); }

  // 전체 읍면동 등급 수신 (numOfRows 크게)
  let allItems = [];
  for (let page = 1; page <= 40; page++) {
    const r = await fetch(`${B}getGradeEmd?serviceKey=${ek}&type=json&numOfRows=1000&pageNo=${page}`);
    const t = await r.text();
    let j; try { j = JSON.parse(t); } catch { log(`page${page} 비JSON: ${t.slice(0, 120)}`); break; }
    const body = (j.response ?? j).body ?? {};
    let items = body.items?.item ?? body.items ?? [];
    if (!Array.isArray(items)) items = items ? [items] : [];
    if (page === 1) { log(`구조: total=${body.totalCount} · 필드=${Object.keys(items[0] || {}).join(",")}`); fs.writeFileSync(path.join(DATA, "decline.raw.json"), JSON.stringify(items.slice(0, 5), null, 2)); }
    allItems.push(...items);
    if (items.length < 1000) break;
    await sleep(120);
  }
  log(`총 ${allItems.length}행 수신`);
  if (!allItems.length) { log("0행 — getGradeEmd 가 시군구코드 필요할 수 있음. decline.raw.json 확인."); process.exit(1); }

  // 필드 자동 식별: 행정동/읍면동 코드 + 등급
  const s0 = allItems[0];
  const codeF = pickField(s0, /emd.*[Cc]d|emdong|admCd|행정|법정|stdgCd|adstrd/) || pickField(s0, /[Cc]d$|code/i);
  const gradeF = pickField(s0, /grade|등급|gradeCd|tot.*grade|grd/i);
  const yearF = pickField(s0, /year|년도|yr|stdrYear/i);
  log(`식별: code=${codeF} grade=${gradeF} year=${yearF}`);
  if (!codeF || !gradeF) { log("코드/등급 필드 미식별 — decline.raw.json 보고 수동 매핑 필요."); process.exit(1); }

  // 최신 연도만, 코드별 등급
  const byCode = {};
  for (const it of allItems) {
    const code = String(it[codeF] || "");
    const grade = Number(it[gradeF]);
    if (!code || !Number.isFinite(grade)) continue;
    const y = yearF ? Number(it[yearF]) : 0;
    if (!byCode[code] || y >= byCode[code].y) byCode[code] = { grade, y };
  }
  log(`코드 ${Object.keys(byCode).length}개`);

  // 크로스워크: 쇠퇴진단 코드 ↔ 우리 admCd2/admCd. 경계 geojson 으로 시도.
  const geo = JSON.parse(fs.readFileSync(path.join(DATA, "boundaries", "admdong.simplified.geojson"), "utf-8"));
  const byPlace = {};
  let matched = 0;
  for (const f of geo.features) {
    const p = f.properties;
    // 코드 후보: admCd2(10) · admCd(통계청 8) · admCd2[:8]
    const cands = [String(p.admCd2), String(p.admCd), String(p.admCd2).slice(0, 8)];
    for (const c of cands) { if (byCode[c]) { byPlace[p.admCd2] = { grade: byCode[c].grade }; matched++; break; } }
  }
  log(`동 매칭: ${matched}/${geo.features.length}`);
  fs.writeFileSync(path.join(DATA, "decline.json"), JSON.stringify({
    source: "국토부 도시재생 쇠퇴진단 등급(읍면동) data.go.kr 1611000",
    fetchedAt: new Date().toISOString().slice(0, 10),
    note: "등급↑=쇠퇴 심함(1~10 추정). 발전가능성/위기 신호.",
    byPlace,
  }));
  log(`완료 → data/decline.json (${matched}동)`);
  if (matched) {
    const ip = path.join(DATA, ".ingested.json");
    let prev = []; try { prev = JSON.parse(fs.readFileSync(ip, "utf-8")); } catch { /* 없음 */ }
    fs.writeFileSync(ip, JSON.stringify([...new Set([...prev, "decline"])]));
    log(".ingested 에 'decline' 표시.");
  } else {
    log("매칭 0 — decline.raw.json 의 코드 형식 확인 후 크로스워크 보정 필요.");
  }
}
main().catch((e) => console.error("[decline] 실패:", e.message));
