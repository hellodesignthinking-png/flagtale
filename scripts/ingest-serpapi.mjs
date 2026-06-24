// 구글 트렌드 국가별 검색 관심 수집 — SerpApi(google_trends, GEO_MAP_0/region=COUNTRY).
// 해외(글로벌)·국내 방문 관심 신호를 data/google-interest.json에 저장.
// 사용: SERPAPI_KEY=... node scripts/ingest-serpapi.mjs   (키는 env로만, 코드/커밋 금지)
// 해외 검색 포착을 위해 로마자 질의(q) 사용. byName 키는 내러티브명(한글)으로 connector와 일치.
import fs from "node:fs";
import path from "node:path";

const KEY = process.env.SERPAPI_KEY;
if (!KEY) { console.error("SERPAPI_KEY 환경변수가 필요합니다. (예: SERPAPI_KEY=xxxx node scripts/ingest-serpapi.mjs)"); process.exit(1); }

// 내러티브명(키) → 구글 트렌드 질의(로마자=해외 검색 포착). 필요시 확장.
const REGIONS = [
  ["성수동", "Seongsu Seoul"], ["익선동", "Ikseon-dong"], ["연남동", "Yeonnam-dong"], ["망원동", "Mangwon-dong"],
  ["한남동", "Hannam-dong"], ["을지로 (힙지로)", "Euljiro"], ["가로수길", "Garosu-gil"], ["서촌", "Seochon Seoul"],
  ["북촌 한옥마을", "Bukchon Hanok Village"], ["전주 한옥마을", "Jeonju Hanok Village"], ["해방촌", "Haebangchon"],
  ["부산 감천문화마을", "Gamcheon Culture Village"], ["부산 영도", "Yeongdo Busan"], ["부산 전포", "Jeonpo cafe street"],
  ["제주 월정리", "Woljeongri beach"], ["제주 한림", "Hyeopjae beach"], ["경주 황리단길", "Hwangnidan-gil"],
  ["여수", "Yeosu"], ["속초", "Sokcho"], ["강릉 명주동", "Gangneung"], ["통영 동피랑", "Dongpirang"],
];

const FILE = path.join(process.cwd(), "data", "google-interest.json");
let prev = {};
try { prev = JSON.parse(fs.readFileSync(FILE, "utf-8")).byName ?? {}; } catch { /* none */ }

const out = { ...prev };
for (const [name, q] of REGIONS) {
  const url = `https://serpapi.com/search.json?engine=google_trends&data_type=GEO_MAP_0&region=COUNTRY&hl=en&q=${encodeURIComponent(q)}&api_key=${KEY}`;
  try {
    const r = await fetch(url);
    if (!r.ok) { console.warn(`✗ ${name} (${q}): HTTP ${r.status}`); continue; }
    const j = await r.json();
    const rows = (j.interest_by_region ?? []).map((x) => ({ name: x.location, value: x.extracted_value ?? 0 })).filter((x) => x.value > 0);
    if (!rows.length) { console.warn(`✗ ${name} (${q}): no data`); continue; }
    rows.sort((a, b) => b.value - a.value);
    const kr = rows.find((c) => /korea/i.test(c.name));
    const domestic = kr?.value ?? 0;
    const foreignTop = rows.filter((c) => !/korea/i.test(c.name)).slice(0, 5);
    const total = rows.reduce((s, c) => s + c.value, 0) || 1;
    const foreignShare = Math.round((foreignTop.reduce((s, c) => s + c.value, 0) / total) * 100);
    out[name] = { domestic, foreignShare, countries: rows.slice(0, 8), foreignTop };
    console.log(`✓ ${name} (${q}): 국내 ${domestic} · 해외비중 ${foreignShare}% · ${foreignTop.map((c) => c.name).join(",")}`);
  } catch (e) { console.warn(`✗ ${name} (${q}): ${e.message}`); }
}

fs.writeFileSync(FILE, JSON.stringify({ source: "serpapi google_trends · GEO_MAP_0 · region=COUNTRY", fetchedAt: new Date().toISOString().slice(0, 10), note: "구글 국가별 검색 관심(해외·국내). SerpApi 수집.", byName: out }, null, 2) + "\n");
console.log(`\n저장: ${FILE} (${Object.keys(out).length}개 지역)`);
