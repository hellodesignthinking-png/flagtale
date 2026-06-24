// ─────────────────────────────────────────────────────────────
// 실데이터 인제스트 — .env.local 의 키로 실제 소스에서 받아 data/ 에 기록.
//   node scripts/ingest.mjs            (또는 npm run ingest)
//
//  · 키가 있는 소스만 실데이터로 전환하고 data/.ingested.json 에 표시.
//  · 키가 없으면 건너뛰고 '미연동' 으로 남긴다(이유는 /data 페이지에 표시).
//  · 한국 공공데이터 키는 사용자 본인 계정으로만 발급 → 이 스크립트가 대신 못 받음.
//
//  발급처:
//   KOSIS_API_KEY            https://kosis.kr/openapi  (인구)
//   G2B_API_KEY (serviceKey) https://data.go.kr        (나라장터 공공조달)
//   NAVER_CLIENT_ID/SECRET   https://developers.naver.com/apps (검색량)
//   BIGKINDS_API_KEY         https://bigkinds.or.kr    (기사량)
//   LOCALDATA_API_KEY        https://localdata.go.kr   (상권)
//   RONE_API_KEY             https://reb.or.kr/r-one   (임대료)
//   RTMS_API_KEY (serviceKey) https://data.go.kr       (실거래·매물)
// ─────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, "data");

// .env.local 수동 파싱 (Node 는 자동 로드 안 함)
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

const log = (m) => console.log(`[ingest] ${m}`);
const ingested = [];

// ── 인구 (통계청 KOSIS) ──────────────────────────────────────
async function population() {
  const key = process.env.KOSIS_API_KEY;
  if (!key) return log("인구: KOSIS_API_KEY 없음 → 미연동 (kosis.kr/openapi 에서 발급)");
  log("인구: KOSIS 조회…");
  // 통계표/분류코드는 KOSIS 콘솔에서 발급받아 채운다(주민등록 행정동 인구).
  const url =
    `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${key}` +
    `&format=json&jsonVD=Y&orgId=101&tblId=${process.env.KOSIS_TBL_ID ?? "DT_1B040A3"}` +
    `&prdSe=Y&newEstPrdCnt=11&objL1=ALL&itmId=ALL`;
  try {
    const res = await fetch(url);
    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      return log(`인구: 응답 비정상/0행 — tblId·분류코드 확인 필요(KOSIS_TBL_ID). 미연동 유지.`);
    }
    // rows[*].C1 = 지역코드, PRD_DE = 연도, DT = 값 → 행정동(adm_cd2) 매핑·청년/고령 산출 필요
    // 매핑 테이블이 준비되면 demographics.json 으로 기록. (현재 안전 미기록)
    log(`인구: ${rows.length}행 수신. adm_cd2 매핑 구현 후 demographics.json 기록 (현재 검증 단계).`);
    // 매핑 완료 시: writeJson("demographics.json", mapped); ingested.push("population");
  } catch (e) {
    log(`인구: 조회 실패 ${e.message}`);
  }
}

// ── 공공조달 (조달청 나라장터) ────────────────────────────────
async function procurement() {
  const key = process.env.G2B_API_KEY;
  if (!key) return log("조달: G2B_API_KEY(serviceKey) 없음 → 미연동 (data.go.kr 에서 발급)");
  log("조달: 나라장터 입찰공고 조회…");
  const y = new Date().getFullYear ? null : null; // (날짜는 인자로) — 연도 루프는 구현 시 추가
  const url =
    `https://apis.data.go.kr/1230000/BidPublicInfoService05/getBidPblancListInfoServc` +
    `?serviceKey=${encodeURIComponent(key)}&pageNo=1&numOfRows=100&type=json&inqryDiv=1`;
  void y;
  try {
    const res = await fetch(url);
    const j = await res.json();
    const items = j?.response?.body?.items ?? [];
    log(`조달: ${items.length ?? 0}건 수신. 기관주소→adm_cd2 지오코딩 후 procurement.json 기록(구현 단계).`);
  } catch (e) {
    log(`조달: 조회 실패 ${e.message}`);
  }
}

// ── 나머지 (검색·기사·상권·임대료·실거래) ────────────────────
function others() {
  const checks = [
    ["검색량", "NAVER_CLIENT_ID", "developers.naver.com"],
    ["기사량", "BIGKINDS_API_KEY", "bigkinds.or.kr"],
    ["상권", "LOCALDATA_API_KEY", "localdata.go.kr"],
    ["임대료", "RONE_API_KEY", "reb.or.kr/r-one"],
    ["실거래·매물", "RTMS_API_KEY", "data.go.kr"],
  ];
  for (const [name, env, where] of checks) {
    log(process.env[env] ? `${name}: ${env} 설정됨 → pipeline/ 커넥터로 연동` : `${name}: ${env} 없음 → 미연동 (${where})`);
  }
}

async function main() {
  loadEnv();
  log("실데이터 인제스트 시작 (경계는 이미 실제).");
  await population();
  await procurement();
  others();
  // 기존 .ingested 와 병합(비파괴) — build-population 등이 먼저 기록한 소스(population)를 덮어쓰지 않음
  let prev = [];
  try { prev = JSON.parse(fs.readFileSync(path.join(DATA, ".ingested.json"), "utf-8")); } catch { /* 없음 */ }
  const merged = [...new Set(["boundary", ...prev, ...ingested])];
  fs.writeFileSync(path.join(DATA, ".ingested.json"), JSON.stringify(merged));
  log(`완료. 실연동: ${merged.join(", ")}. 나머지는 /data 페이지에 미연동 이유 표시.`);
  log("키를 채운 뒤 다시 실행하면 해당 소스가 실데이터로 전환됩니다.");
}
main();
