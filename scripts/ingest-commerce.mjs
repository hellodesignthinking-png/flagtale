// 상권(상가업소) 실데이터 수집 — 소상공인시장진흥공단 상가(상권)정보 OpenAPI
//   data.go.kr  B553077  /api/open/sdsc2/storeListInDong  (divId=adongCd&key=<행정동코드 10자리>)
// 산출: data/commerce.json { byPlace: { admCd2: { stores, sampled, diversity, topCategories } } }
//   stores=동별 등록 상가수(totalCount), diversity=업종 대분류 Shannon(0~1), topCategories=상위 업종.
// 사용: DATA_GO_KR_KEY=... npm run ingest:commerce         (키는 env로만 — 코드/커밋 금지)
//   범위 한정:  COMMERCE_PREFIX=11,41 ...  (시도/시군구 코드 접두 — 미설정 시 전국 3554동)
//   강제 재수집: FORCE=1
// resumable: data/commerce.json 에 이미 있는 동은 건너뜀(중단 후 재실행 가능). data.go.kr 개발계정 ~1만건/일.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, "data");

// .env.local 로드(마지막 값이 이김 — 중복 줄 대비). 키를 셸 기록에 노출하지 않음.
try {
  const seen = new Set();
  for (const line of fs.readFileSync(path.join(ROOT, ".env.local"), "utf-8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && (!process.env[m[1]] || seen.has(m[1]))) { process.env[m[1]] = m[2].replace(/^["']|["']$/g, ""); seen.add(m[1]); }
  }
} catch { /* .env.local 없음 — 인라인 env 사용 */ }

const KEY = process.env.DATA_GO_KR_KEY;
if (!KEY) {
  console.error("DATA_GO_KR_KEY 없음. .env.local 에 DATA_GO_KR_KEY=<공공데이터포털 일반인증키(Decoding)> 추가 후 `npm run ingest:commerce`.");
  console.error("발급: data.go.kr → '소상공인시장진흥공단_상가(상권)정보' (15012005) 활용신청 → 일반 인증키(Decoding) 사용.");
  process.exit(1);
}

const BASE = "https://apis.data.go.kr/B553077/api/open/sdsc2/storeListInDong";
const OUT = path.join(DATA, "commerce.json");
const log = (m) => console.log(`[commerce] ${m}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 대상 동 코드(앱이 쓰는 scores.json 의 행정동) + 선택적 접두 스코프
const allCodes = Object.keys(JSON.parse(fs.readFileSync(path.join(DATA, "scores.json"), "utf-8")).byPlace);
const prefixes = (process.env.COMMERCE_PREFIX || "").split(",").map((s) => s.trim()).filter(Boolean);
const codes = prefixes.length ? allCodes.filter((c) => prefixes.some((p) => c.startsWith(p))) : allCodes;

// 기존 결과 로드(resumable)
let out = { source: "data.go.kr B553077 sdsc2 storeListInDong", fetchedAt: new Date().toISOString().slice(0, 10), byPlace: {} };
if (!process.env.FORCE) { try { out = JSON.parse(fs.readFileSync(OUT, "utf-8")); out.byPlace ??= {}; } catch { /* 신규 */ } }

const todo = codes.filter((c) => !out.byPlace[c]);
log(`대상 ${codes.length}동 (스코프:${prefixes.join(",") || "전국"}) · 미수집 ${todo.length}동 수집 시작`);
if (!todo.length) { log("이미 모두 수집됨. (FORCE=1 로 강제 재수집)"); process.exit(0); }

// data.go.kr 응답 정규화 — JSON/XML(오류)·items 형태(배열/{item}/단건) 모두 처리
function parseBody(text) {
  let j;
  try { j = JSON.parse(text); }
  catch { // 키·할당량 오류는 XML 로 옴
    const code = text.match(/<returnReasonCode>(\d+)<\/returnReasonCode>/)?.[1];
    const msg = text.match(/<returnAuthMsg>([^<]+)<\/returnAuthMsg>/)?.[1] || text.match(/<errMsg>([^<]+)<\/errMsg>/)?.[1];
    return { error: `XML 오류 (코드 ${code ?? "?"}: ${msg ?? text.slice(0, 120)})` };
  }
  const root = j.response ?? j;
  const rc = root.header?.resultCode ?? root.cmmMsgHeader?.returnReasonCode;
  if (rc === "03") return { total: 0, items: [] };       // NODATA_ERROR = 등록 상가 없음(유효한 빈 동)
  if (rc && rc !== "00") return { error: `resultCode=${rc} ${root.header?.resultMsg ?? ""}`.trim() };
  const body = root.body ?? {};
  let items = body.items ?? [];
  if (items && items.item) items = items.item;          // {items:{item:[...]}}
  if (!Array.isArray(items)) items = items ? [items] : []; // 단건
  return { total: Number(body.totalCount ?? items.length), items };
}

// 업종 대분류 분포 → 정규화 Shannon(0~1)
function diversity(counts) {
  const vals = Object.values(counts); const n = vals.reduce((a, b) => a + b, 0);
  if (n <= 1 || vals.length <= 1) return 0;
  const H = -vals.reduce((s, v) => { const p = v / n; return s + (p > 0 ? p * Math.log(p) : 0); }, 0);
  return Math.min(1, H / Math.log(10)); // 대분류 최대 10개 기준
}

let ok = 0, fail = 0, diag = true, consec = 0; // consec=연속 실패(IP 레이트리밋 감지)
for (let i = 0; i < todo.length; i++) {
  const code = todo[i];
  // 상권 API adongCd = 행정동코드 8자리 (= 앱 adm_cd2 앞 8자리; 끝 "00" 제외). 검증: 사직동 1111053000→11110530→2388점포.
  const url = `${BASE}?serviceKey=${encodeURIComponent(KEY)}&divId=adongCd&key=${code.slice(0, 8)}&numOfRows=1000&pageNo=1&type=json`;
  let done = false;
  for (let attempt = 0; attempt < 3 && !done; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      const text = await res.text();
      const r = parseBody(text);
      if (diag) { log(`진단(${code}): HTTP ${res.status} · ${r.error ? "오류=" + r.error : `total=${r.total}, sample=${r.items.length}`}`); diag = false; }
      if (r.error) {
        fail++; consec++;
        if (/SERVICE_KEY|등록되지|허용되지|LIMITED|30|22/.test(r.error) && fail <= 2) log(`⚠ 키/할당량 의심 — ${r.error} (DATA_GO_KR_KEY·활용신청 확인)`);
        done = true; break;
      }
      const cat = {};
      for (const it of r.items) { const k = it.indsLclsNm || it.indsLclsCd || "기타"; cat[k] = (cat[k] || 0) + 1; }
      out.byPlace[code] = {
        stores: r.total,
        sampled: r.items.length,
        diversity: Math.round(diversity(cat) * 100) / 100,
        topCategories: Object.entries(cat).sort((a, b) => b[1] - a[1]).slice(0, 5),
      };
      ok++; consec = 0; done = true;
    } catch (e) {
      if (attempt < 2) { await sleep(800 * (attempt + 1)); continue; } // 네트워크 실패 → 백오프 후 재시도
      fail++; consec++; if (fail <= 3) log(`요청 실패(${code}): ${e.message}`);
    }
  }
  // 연속 실패 누적(IP 레이트리밋 의심) → 90초 대기 후 회복 시도 (resumable 이라 진행분 보존)
  if (consec >= 25) { fs.writeFileSync(OUT, JSON.stringify(out)); log(`연속 실패 ${consec} — 90초 대기(레이트리밋 회복)…`); await sleep(90000); consec = 0; }
  if ((i + 1) % 50 === 0) { fs.writeFileSync(OUT, JSON.stringify(out)); log(`진행 ${i + 1}/${todo.length} (성공 ${ok}, 실패 ${fail})`); }
  await sleep(140); // API 예의 + 할당량 분산
}

out.fetchedAt = new Date().toISOString().slice(0, 10);
fs.writeFileSync(OUT, JSON.stringify(out));
log(`완료 · 성공 ${ok}동, 실패 ${fail}동 → ${path.relative(ROOT, OUT)}`);

// .ingested.json 에 commerce 기록(비파괴 병합) — 성공분이 있을 때만
if (Object.keys(out.byPlace).length) {
  const ip = path.join(DATA, ".ingested.json");
  let prev = []; try { prev = JSON.parse(fs.readFileSync(ip, "utf-8")); } catch { /* 없음 */ }
  fs.writeFileSync(ip, JSON.stringify([...new Set([...prev, "commerce"])]));
  log("data/.ingested.json 에 'commerce' 표시 → /data 에서 '실연동'.");
}
