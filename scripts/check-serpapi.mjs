// SerpApi 키·응답 점검 — 키는 .env.local에서만 읽음(스크립트/커밋에 키 없음).
// 사용: node scripts/check-serpapi.mjs
import fs from "node:fs";
import path from "node:path";

const FILE = path.join(process.cwd(), ".env.local");
let raw = "";
try { raw = fs.readFileSync(FILE, "utf-8"); } catch { console.error("✗ .env.local 파일이 없습니다."); process.exit(1); }

// .env.local 안의 SERPAPI_KEY 줄 진단 (값은 노출하지 않고 길이·끝4자리만)
const keyLines = raw.split("\n").filter((l) => /^\s*SERPAPI_KEY\s*=/.test(l));
console.log(`.env.local의 SERPAPI_KEY 줄: ${keyLines.length}개`);
let key = "";
keyLines.forEach((l, i) => {
  const v = l.replace(/^\s*SERPAPI_KEY\s*=\s*/, "").replace(/^["']|["']$/g, "").trim();
  if (v) key = v; // 마지막 비어있지 않은 값이 이김(중복 줄 대비)
  console.log(`  [${i + 1}] 길이 ${v.length}${v.length ? ` (끝 …${v.slice(-4)})` : " (비어있음)"}`);
});

if (!key) { console.error("✗ 유효한 SERPAPI_KEY 값이 없습니다 — .env.local에 SERPAPI_KEY=<64자리 키> 한 줄만 두세요."); process.exit(1); }
if (key.length < 30) { console.error(`✗ 키가 너무 짧습니다(길이 ${key.length}). SerpApi 키는 보통 64자입니다 — placeholder가 들어간 듯합니다.`); process.exit(1); }
console.log(`→ 사용할 키: 길이 ${key.length}, 끝 …${key.slice(-4)}`);

// 1) 계정 상태
try {
  const acc = await fetch(`https://serpapi.com/account?api_key=${key}`).then((r) => r.json());
  if (acc.error) console.log(`✗ 계정 에러: ${acc.error}`);
  else console.log(`✓ 계정: 플랜 ${acc.plan_name ?? "?"} · 이번달 사용 ${acc.this_month_usage ?? "?"} · 남은 검색 ${acc.total_searches_left ?? acc.plan_searches_left ?? "?"}`);
} catch (e) { console.log(`✗ 계정 조회 실패: ${e.message}`); }

// 2) 테스트 트렌드 쿼리
try {
  const r = await fetch(`https://serpapi.com/search.json?engine=google_trends&data_type=GEO_MAP_0&region=COUNTRY&hl=en&q=${encodeURIComponent("Seongsu Seoul")}&api_key=${key}`);
  console.log(`트렌드 테스트 HTTP ${r.status}`);
  const j = await r.json();
  if (j.error) console.log(`✗ 트렌드 에러: ${j.error}`);
  else {
    const rows = j.interest_by_region ?? [];
    console.log(`interest_by_region 개수: ${rows.length}`);
    if (rows.length) console.log("상위 국가:", rows.slice(0, 6).map((x) => `${x.location}=${x.extracted_value}`).join(", "));
    else console.log("응답에 있는 키들:", Object.keys(j).slice(0, 14).join(", "));
  }
} catch (e) { console.log(`✗ 트렌드 호출 실패: ${e.message}`); }
