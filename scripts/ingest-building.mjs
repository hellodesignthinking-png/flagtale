// D3 공간·물리 — 건축물(주택) 실데이터. 통계청 인구주택총조사(KOSIS, 우리 키).
//   · 용도혼합(동단위): DT_1JU1501 읍면동 주택종류(단독/아파트/연립/다세대/비주거) → Shannon 다양성
//   · 밀도(동단위):    DT_1JU1501 T10 총주택수
//   · 노후도(시군구):  DT_1JU1521 노후기간(30년이상 비율)
// 사용: KOSIS_API_KEY=... npm run ingest:building   (키는 env로만)
// 크로스워크: 동 admCd(통계청 8자리)==C1(읍면동), admCd[:5]==C1(시군구). 행안부 admCd2 아님.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, "data");
const log = (m) => console.log(`[building] ${m}`);

try {
  for (const line of fs.readFileSync(path.join(ROOT, ".env.local"), "utf-8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch { /* 없음 */ }
const KEY = process.env.KOSIS_API_KEY;
if (!KEY) { console.error("KOSIS_API_KEY 없음. .env.local 에 추가 후 재실행."); process.exit(1); }

const api = (tbl, extra) =>
  `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${KEY}&format=json&jsonVD=Y&orgId=101&tblId=${tbl}&prdSe=Y&${extra}`;

// 주택종류 5분류 → 정규화 Shannon (용도혼합 0~1)
function mixDiversity(types) {
  const vals = Object.values(types).filter((v) => v > 0);
  const n = vals.reduce((a, b) => a + b, 0);
  if (n <= 0 || vals.length <= 1) return 0;
  const H = -vals.reduce((s, v) => { const p = v / n; return s + p * Math.log(p); }, 0);
  return Math.min(1, H / Math.log(5)); // 최대 5종
}

async function main() {
  // ① 읍면동 주택종류·총주택수 (DT_1JU1501, census 2020)
  log("KOSIS DT_1JU1501 (읍면동 주택종류·총주택수) 수신…");
  const hr = await (await fetch(api("DT_1JU1501", "startPrdDe=2020&endPrdDe=2020&objL1=ALL&itmId=ALL"))).json();
  if (!Array.isArray(hr)) { log(`DT_1JU1501 응답 비정상: ${JSON.stringify(hr).slice(0, 140)}`); process.exit(1); }
  const dong = {}; // C1(8자리) → {T10 총주택, 단독,아파트,연립,다세대,비주거}
  let censusY = null;
  for (const r of hr) {
    const c1 = String(r.C1); if (c1.length !== 8) continue;
    const v = Number(r.DT); if (!Number.isFinite(v)) continue;
    censusY = Number(r.PRD_DE);
    const d = (dong[c1] ??= { houses: 0, 단독: 0, 아파트: 0, 연립: 0, 다세대: 0, 비주거: 0 });
    if (r.ITM_ID === "T10") d.houses = v;
    else if (r.ITM_ID === "T20") d.단독 = v;       // 단독주택-계
    else if (r.ITM_ID === "T30") d.아파트 = v;
    else if (r.ITM_ID === "T40") d.연립 = v;
    else if (r.ITM_ID === "T50") d.다세대 = v;
    else if (r.ITM_ID === "T60") d.비주거 = v;
  }
  log(`읍면동 ${Object.keys(dong).length}동 (census ${censusY})`);

  // ② 노후도 (DT_1JU1521 노후기간, 시군구) — ITM=계, 노후기간 30년이상 비율
  const oldBySig = {}; // C1(5자리) → {old30, total}
  try {
    const or = await (await fetch(api("DT_1JU1521", "newEstPrdCnt=1&objL1=ALL&objL2=ALL&itmId=ALL"))).json();
    if (Array.isArray(or)) {
      for (const r of or) {
        const c1 = String(r.C1); if (c1.length !== 5) continue;
        if (r.ITM_NM !== "계") continue;                 // 주택종류 전체
        const v = Number(r.DT); if (!Number.isFinite(v)) continue;
        const period = `${r.C2_NM || ""}${r.C3_NM || ""}`; // 노후기간 라벨
        const s = (oldBySig[c1] ??= { old30: 0, total: 0 });
        s.total += v;
        if (period.includes("30년 이상")) s.old30 += v;
      }
      log(`노후 시군구 ${Object.keys(oldBySig).length}곳`);
    }
  } catch (e) { log(`노후 조회 실패(생략): ${e.message}`); }

  // 크로스워크
  const geo = JSON.parse(fs.readFileSync(path.join(DATA, "boundaries", "admdong.simplified.geojson"), "utf-8"));
  const fullByAdm = {}; for (const f of geo.features) { const p = f.properties; if (p.admCd) fullByAdm[p.admCd2] = String(p.admCd); }
  const scores = JSON.parse(fs.readFileSync(path.join(DATA, "scores.json"), "utf-8"));

  const byPlace = {};
  let matched = 0;
  for (const cd of Object.keys(scores.byPlace)) {
    const c8 = fullByAdm[cd]; if (!c8) continue;
    const d = dong[c8];
    const sg = oldBySig[c8.slice(0, 5)] || oldBySig[c8.slice(0, 4) + "0"];
    const oldRatio = sg && sg.total ? Math.round((sg.old30 / sg.total) * 1000) / 10 : null;
    if (!d && oldRatio == null) continue;
    const types = d ? { 단독: d.단독, 아파트: d.아파트, 연립: d.연립, 다세대: d.다세대, 비주거: d.비주거 } : null;
    byPlace[cd] = {
      houses: d ? d.houses : null,
      typeMix: types ? Math.round(mixDiversity(types) * 100) / 100 : null,
      types,
      oldRatio, // 30년이상 비율(%) — 시군구
      year: censusY,
    };
    matched++;
  }
  log(`동 매칭: ${matched}/${Object.keys(scores.byPlace).length}`);

  fs.writeFileSync(path.join(DATA, "building.json"), JSON.stringify({
    source: "통계청 KOSIS 인구주택총조사 주택종류(DT_1JU1501, 읍면동)+노후기간(DT_1JU1521, 시군구)",
    fetchedAt: new Date().toISOString().slice(0, 10),
    censusYear: censusY,
    byPlace,
  }));
  log(`완료 → data/building.json (${matched}동)`);

  const ip = path.join(DATA, ".ingested.json");
  let prev = []; try { prev = JSON.parse(fs.readFileSync(ip, "utf-8")); } catch { /* 없음 */ }
  fs.writeFileSync(ip, JSON.stringify([...new Set([...prev, "building"])]));
  log("data/.ingested.json 에 'building' 표시 → /data 실연동.");
}
main().catch((e) => console.error("[building] 실패:", e.message));
