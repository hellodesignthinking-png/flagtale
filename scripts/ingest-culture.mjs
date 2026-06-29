// 지역 문화 활력 bulk — 한국문화정보원 '한눈에보는문화정보'(공연·전시·축제, data.go.kr B553457).
//   시군구별 행사 수 → data/culture.json(동별 broadcast). 로컬100(문체부 매력 명소 큐레이션)의 데이터 기반 대용.
// 사용: DATA_GO_KR_KEY=... npm run ingest:culture   (키는 env로만)
// ⚠ data.go.kr 공용 키 → 상권(ingest:commerce)과 동시 실행 시 레이트리밋 경합. 상권 완료 후 실행 권장.
// ⚠ area2 의 gugun 필터가 느슨해 광역/시도 수준일 수 있음 → '시군구 단위·문화행사' 라벨로 정직 표기.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, "data");
const log = (m) => console.log(`[culture] ${m}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  for (const line of fs.readFileSync(path.join(ROOT, ".env.local"), "utf-8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch { /* 없음 */ }
const KEY = process.env.DATA_GO_KR_KEY;
if (!KEY) { console.error("DATA_GO_KR_KEY 없음. .env.local 추가 후 재실행."); process.exit(1); }

const BASE = "https://apis.data.go.kr/B553457/cultureinfo/area2";
const tag = (b, n) => { const m = b.match(new RegExp(`<${n}>([\\s\\S]*?)</${n}>`)); return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : ""; };

// 동별 시군구(통계청 admCd2[:5] 아님 — 이름 매칭). boundary 에서 (sido, sigungu) 추출.
const geo = JSON.parse(fs.readFileSync(path.join(DATA, "boundaries", "admdong.simplified.geojson"), "utf-8"));
const dongRegion = {}; // admCd2 → "sido|sigungu"
const regionSet = new Map(); // "sido|sigungu" → {sido, sigungu}
for (const f of geo.features) {
  const p = f.properties;
  const key = `${p.sido}|${p.sigungu}`;
  dongRegion[p.admCd2] = key;
  if (!regionSet.has(key)) regionSet.set(key, { sido: p.sido, sigungu: p.sigungu });
}
const regions = [...regionSet.values()];
log(`시군구 ${regions.length}곳 문화행사 수집 시작 (data.go.kr)`);

// 기존 결과 로드(resumable)
let byRegion = {};
try { byRegion = JSON.parse(fs.readFileSync(path.join(DATA, "culture.raw.json"), "utf-8")).byRegion ?? {}; } catch { /* 신규 */ }

let ok = 0, fail = 0, diag = true;
for (let i = 0; i < regions.length; i++) {
  const { sido, sigungu } = regions[i];
  const key = `${sido}|${sigungu}`;
  if (byRegion[key]) continue; // resumable
  const sidoShort = sido.replace(/특별시|광역시|특별자치시|특별자치도|도$/, "");
  const url = `${BASE}?serviceKey=${encodeURIComponent(KEY)}&numOfRows=100&PageNo=1&sido=${encodeURIComponent(sidoShort)}&gugun=${encodeURIComponent(sigungu)}&sortStdr=1`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    const xml = await res.text();
    if (diag) { log(`진단(${sigungu}): HTTP ${res.status} · item=${xml.includes("<item")} · ${(xml.match(/<totalCount>(\d+)/) || [])[1] ?? "?"}건`); diag = false; }
    if (!xml.includes("<item")) { fail++; if (fail <= 2) log(`⚠ ${sigungu} 빈응답/403 (활용신청 확인)`); await sleep(150); continue; }
    const total = Number((xml.match(/<totalCount>(\d+)<\/totalCount>/) || [])[1] || 0);
    const blocks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
    const rc = {};
    for (const b of blocks) { const r = tag(b, "realmName") || "기타"; rc[r] = (rc[r] || 0) + 1; }
    const topRealms = Object.entries(rc).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name, count]) => ({ name, count }));
    byRegion[key] = { total: total || blocks.length, topRealms };
    ok++;
  } catch (e) { fail++; if (fail <= 3) log(`요청 실패(${sigungu}): ${e.message}`); }
  if ((i + 1) % 30 === 0) { fs.writeFileSync(path.join(DATA, "culture.raw.json"), JSON.stringify({ byRegion })); log(`진행 ${i + 1}/${regions.length} (성공 ${ok}, 실패 ${fail})`); }
  await sleep(140);
}

// 동별 broadcast → culture.json
const byPlace = {};
let matched = 0;
for (const cd of Object.keys(JSON.parse(fs.readFileSync(path.join(DATA, "scores.json"), "utf-8")).byPlace)) {
  const r = byRegion[dongRegion[cd]];
  if (r && r.total != null) { byPlace[cd] = { events: r.total, topRealms: r.topRealms }; matched++; }
}
fs.writeFileSync(path.join(DATA, "culture.json"), JSON.stringify({
  source: "한국문화정보원 한눈에보는문화정보(공연·전시·축제) data.go.kr B553457",
  fetchedAt: new Date().toISOString().slice(0, 10),
  resolution: "sigungu",
  byPlace,
}));
fs.writeFileSync(path.join(DATA, "culture.raw.json"), JSON.stringify({ byRegion }));
log(`완료 · 시군구 성공 ${ok}/${regions.length} · 동 매칭 ${matched} → data/culture.json`);

if (matched) {
  const ip = path.join(DATA, ".ingested.json");
  let prev = []; try { prev = JSON.parse(fs.readFileSync(ip, "utf-8")); } catch { /* 없음 */ }
  fs.writeFileSync(ip, JSON.stringify([...new Set([...prev, "culture"])]));
  log("data/.ingested.json 에 'culture' 표시.");
}
