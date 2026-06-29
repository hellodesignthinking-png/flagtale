// 빈집 실데이터 — 통계청 KOSIS 인구주택총조사 '미거주주택(빈집)비율' (DT_1YL202005, orgId 101)
//   동별 빈집비율(%)·빈집 수(호) → data/vacant.json. D3 공실·소멸 진단 신호.
// 사용: KOSIS_API_KEY=... node scripts/ingest-vacant.mjs   (키는 env로만)
// ⚠ 해상도: 이 표는 '시군구' 단위 → 동은 소속 시군구 값 공유(브로드캐스트), UI에 '시군구·KOSIS' 라벨.
// ⚠ 크로스워크: 이 표 C1 = 통계청 시군구코드 → 동의 admCd(통계청 8자리) 앞 5자리와 매칭
//    (행안부 admCd2[:5] 아님! 종로구 통계청=11010, 행안부=11110). 경계 geojson 의 admCd 사용.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, "data");
const log = (m) => console.log(`[vacant] ${m}`);

try {
  for (const line of fs.readFileSync(path.join(ROOT, ".env.local"), "utf-8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch { /* .env.local 없음 */ }

const KEY = process.env.KOSIS_API_KEY;
if (!KEY) { console.error("KOSIS_API_KEY 없음. .env.local 에 추가 후 재실행."); process.exit(1); }

const TBL = process.env.VACANT_TBL_ID || "DT_1YL202005"; // 미거주주택(빈집)비율(시도/시/군/구)

async function main() {
  log(`KOSIS ${TBL} (빈집비율·빈집수) 수신…`);
  const url =
    `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${KEY}` +
    `&format=json&jsonVD=Y&orgId=101&tblId=${TBL}&prdSe=Y&newEstPrdCnt=3&objL1=ALL&itmId=ALL`;
  const rows = await (await fetch(url)).json();
  if (!Array.isArray(rows)) { log(`응답 비정상: ${JSON.stringify(rows).slice(0, 160)}`); process.exit(1); }

  // 시군구(5자리 C1) → { ratio:{year:%}, count:{year:호} } — UNIT_NM 으로 비율/수 구분
  const bySig = {};
  for (const r of rows) {
    const c1 = String(r.C1);
    if (c1.length !== 5) continue; // 시군구만 (전국 00·시도 2자리 제외)
    const y = Number(r.PRD_DE);
    const v = Number(r.DT);
    if (!Number.isFinite(v)) continue;
    const slot = (bySig[c1] ??= { ratio: {}, count: {} });
    // T10=빈집비율(%) · T20=빈집수(호, A) · T30=전체주택(호, B) — ITM_ID 로 정확히 구분
    if (r.ITM_ID === "T10") slot.ratio[y] = v;
    else if (r.ITM_ID === "T20") slot.count[y] = v;
  }
  const years = [...new Set(rows.map((r) => Number(r.PRD_DE)))].filter(Number.isFinite).sort((a, b) => a - b);
  const lastY = years[years.length - 1];
  log(`시군구 ${Object.keys(bySig).length}곳 · 연도 ${years.join(",")} · 전국 빈집비율 ${rows.find((r) => r.C1 === "00" && Number(r.PRD_DE) === lastY)?.DT}%`);

  // 읍면동 총주택수(census) — DT_1JU1501 T10, C1=통계청 읍면동 8자리. 동별 '추정 빈집호수'(동주택수×시군구율) 산출용.
  const housesByC1 = {}; let censusY = null;
  try {
    // 읍면동(8자리 C1)은 census연도(끝자리 0/5)에만 존재 → 2020·2025 범위로 조회 후 8자리 최신연도 사용
    const hu = `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${KEY}&format=json&jsonVD=Y&orgId=101&tblId=DT_1JU1501&prdSe=Y&startPrdDe=2020&endPrdDe=2025&objL1=ALL&itmId=T10`;
    const hrows = await (await fetch(hu)).json();
    if (Array.isArray(hrows)) {
      for (const r of hrows) { if (String(r.C1).length === 8 && Number.isFinite(Number(r.DT))) { housesByC1[String(r.C1)] = Number(r.DT); censusY = Number(r.PRD_DE); } }
      log(`읍면동 총주택수 ${Object.keys(housesByC1).length}동 (census ${censusY})`);
    }
  } catch (e) { log(`총주택수 조회 실패(추정 호수 생략): ${e.message}`); }

  // 크로스워크: 동 admCd2 → admCd(통계청 8자리)[:5] → 시군구 C1
  const geo = JSON.parse(fs.readFileSync(path.join(DATA, "boundaries", "admdong.simplified.geojson"), "utf-8"));
  const admCdMap = {}; // admCd2 → admCd[:5] (시군구)
  const admCdFull = {}; // admCd2 → admCd 전체 8자리 (읍면동, 총주택수 매칭용)
  for (const f of geo.features) { const p = f.properties; if (p.admCd) { admCdMap[p.admCd2] = String(p.admCd).slice(0, 5); admCdFull[p.admCd2] = String(p.admCd); } }

  const scores = JSON.parse(fs.readFileSync(path.join(DATA, "scores.json"), "utf-8"));
  const byPlace = {};
  let matched = 0;
  for (const cd of Object.keys(scores.byPlace)) {
    const sig5 = admCdMap[cd];
    // 통합시 구(예 수원 장안 41111)는 census 가 '시'(41110) 단위 → [:4]+"0" 폴백
    let v = sig5 && (bySig[sig5] || bySig[sig5.slice(0, 4) + "0"]);
    if (!v) continue;
    const ratio = v.ratio[lastY] ?? v.ratio[years.find((y) => v.ratio[y] != null)];
    const count = v.count[lastY] ?? v.count[years.find((y) => v.count[y] != null)];
    if (ratio == null && count == null) continue;
    const houses = housesByC1[admCdFull[cd]] ?? null; // 동 총주택수(census, 동단위 실측)
    const est = houses != null && ratio != null ? Math.round((houses * ratio) / 100) : null; // 동 추정 빈집호수
    byPlace[cd] = { ratio: ratio ?? null, count: count ?? null, houses, est, year: lastY };
    matched++;
  }
  log(`동 매칭: ${matched}/${Object.keys(scores.byPlace).length}`);

  const out = {
    source: "통계청 KOSIS 빈집비율(DT_1YL202005, 시군구) + 읍면동 총주택수(DT_1JU1501)",
    fetchedAt: new Date().toISOString().slice(0, 10),
    resolution: "sigungu", // 비율=시군구(동 공유) · 총주택수·추정호수=읍면동 census
    year: lastY,
    censusYear: censusY,
    byPlace,
  };
  fs.writeFileSync(path.join(DATA, "vacant.json"), JSON.stringify(out));
  log(`완료 → data/vacant.json (${matched}동, ${lastY}년 기준)`);

  // .ingested 비파괴 병합
  const ip = path.join(DATA, ".ingested.json");
  let prev = []; try { prev = JSON.parse(fs.readFileSync(ip, "utf-8")); } catch { /* 없음 */ }
  fs.writeFileSync(ip, JSON.stringify([...new Set([...prev, "vacant"])]));
  log("data/.ingested.json 에 'vacant' 표시 → /data 실연동.");
}
main().catch((e) => console.error("[vacant] 실패:", e.message));
