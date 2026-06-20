// 실데이터 API 라이브 진단 — 각 소스가 지금 실제로 응답하는지 확인.
//   node scripts/test-apis.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
for (const f of [".env.local", ".env"]) {
  const p = path.join(ROOT, f);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, "utf-8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const E = process.env;
const out = [];
const timeout = (ms) => AbortSignal.timeout(ms);

async function test(name, key, fn) {
  if (!key) return out.push([name, "NO_KEY", "키 없음"]);
  try {
    const r = await fn();
    out.push([name, r.ok ? "OK" : "FAIL", r.msg]);
  } catch (e) {
    out.push([name, "ERROR", e.name === "TimeoutError" ? "timeout" : e.message.slice(0, 60)]);
  }
}

await test("KOSIS 인구", E.KOSIS_API_KEY, async () => {
  const u = `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${E.KOSIS_API_KEY}&format=json&jsonVD=Y&orgId=101&tblId=DT_1B040A3&prdSe=Y&newEstPrdCnt=1&objL1=11&itmId=T20`;
  const j = await (await fetch(u, { signal: timeout(12000) })).json();
  const n = Array.isArray(j) ? j.length : 0;
  return { ok: n > 0, msg: n > 0 ? `${n}행, 예: ${j[0]?.C1_NM ?? ""} ${j[0]?.DT ?? ""}` : `0행/오류 ${JSON.stringify(j).slice(0, 70)}` };
});

await test("네이버 검색트렌드", E.NAVER_CLIENT_ID, async () => {
  const r = await fetch("https://openapi.naver.com/v1/datalab/search", {
    method: "POST",
    headers: { "X-Naver-Client-Id": E.NAVER_CLIENT_ID, "X-Naver-Client-Secret": E.NAVER_CLIENT_SECRET, "Content-Type": "application/json" },
    body: JSON.stringify({ startDate: "2025-01-01", endDate: "2025-03-01", timeUnit: "month", keywordGroups: [{ groupName: "성수동", keywords: ["성수동"] }] }),
    signal: timeout(12000),
  });
  const j = await r.json();
  return { ok: !!j?.results, msg: j?.results ? `트렌드 ${j.results[0]?.data?.length}개월` : `${j?.errorMessage ?? JSON.stringify(j).slice(0, 60)}` };
});

await test("네이버 뉴스", E.NAVER_CLIENT_ID, async () => {
  const r = await fetch("https://openapi.naver.com/v1/search/news.json?query=성수동&display=1", {
    headers: { "X-Naver-Client-Id": E.NAVER_CLIENT_ID, "X-Naver-Client-Secret": E.NAVER_CLIENT_SECRET },
    signal: timeout(12000),
  });
  const j = await r.json();
  return { ok: j?.total != null, msg: j?.total != null ? `기사 ${j.total.toLocaleString()}건` : JSON.stringify(j).slice(0, 60) };
});

await test("VWorld 지오코딩", E.VWORLD_KEY, async () => {
  const u = `https://api.vworld.kr/req/address?service=address&request=getcoord&version=2.0&crs=epsg:4326&type=road&key=${E.VWORLD_KEY}&address=${encodeURIComponent("서울특별시 성동구 성수이로 66")}`;
  const j = await (await fetch(u, { signal: timeout(12000) })).json();
  const st = j?.response?.status;
  return { ok: st === "OK", msg: st === "OK" ? `좌표 ${j.response.result.point.x},${j.response.result.point.y}` : `status=${st} ${j?.response?.error?.text ?? ""}` };
});

await test("부동산원 R-ONE 임대", E.RONE_API_KEY, async () => {
  const u = `https://www.reb.or.kr/r-one/openapi/SttsApiTblData.do?KEY=${E.RONE_API_KEY}&Type=json&STATBL_ID=TT246323134644307&DTACYCLE_CD=QY&pIndex=1&pSize=1`;
  const j = await (await fetch(u, { signal: timeout(15000) })).json();
  const rows = j?.SttsApiTblData?.[1]?.row ?? j?.SttsApiTblData?.row;
  const head = j?.SttsApiTblData?.[0]?.head ?? j?.RESULT;
  return { ok: !!rows, msg: rows ? `수신 OK (예: ${rows[0]?.DTA_VAL ?? ""})` : `head=${JSON.stringify(head).slice(0, 70)}` };
});

await test("소진공 상가(data.go.kr)", E.DATA_GO_KR_KEY, async () => {
  const u = `https://apis.data.go.kr/B553077/api/open/sdsc2/storeListInRadius?serviceKey=${encodeURIComponent(E.DATA_GO_KR_KEY)}&radius=500&cx=127.0557&cy=37.5447&type=json&numOfRows=1&pageNo=1`;
  const j = await (await fetch(u, { signal: timeout(15000) })).json();
  const tc = j?.body?.totalCount ?? j?.response?.body?.totalCount;
  const hdr = j?.header?.resultMsg ?? j?.response?.header?.resultMsg ?? j?.cmmMsgHeader?.returnAuthMsg;
  return { ok: tc != null && tc !== undefined, msg: tc != null ? `반경 점포 ${tc}개` : `msg=${hdr ?? JSON.stringify(j).slice(0, 70)}` };
});

await test("나라장터 G2B(data.go.kr)", E.G2B_API_KEY, async () => {
  const u = `https://apis.data.go.kr/1230000/ad/BidPublicInfoService/getBidPblancListInfoServcPPSSrch?serviceKey=${encodeURIComponent(E.G2B_API_KEY)}&pageNo=1&numOfRows=1&type=json&inqryDiv=1&inqryBgnDt=202601010000&inqryEndDt=202601312359`;
  const j = await (await fetch(u, { signal: timeout(15000) })).json();
  const tc = j?.response?.body?.totalCount;
  const hdr = j?.response?.header?.resultMsg ?? j?.cmmMsgHeader?.returnAuthMsg ?? j?.cmmMsgHeader?.errMsg;
  return { ok: tc != null, msg: tc != null ? `공고 ${tc}건` : `msg=${hdr ?? JSON.stringify(j).slice(0, 80)}` };
});

await test("문화정보원(data.go.kr)", E.DATA_GO_KR_KEY, async () => {
  // 실제 커넥터와 동일 엔드포인트: /cultureinfo/area2, sido 짧게, PageNo 대문자
  const u = `https://apis.data.go.kr/B553457/cultureinfo/area2?serviceKey=${encodeURIComponent(E.DATA_GO_KR_KEY)}&numOfRows=5&PageNo=1&sido=서울&gugun=성동구&sortStdr=1`;
  const r = await fetch(u, { signal: timeout(15000) });
  const t = await r.text();
  const total = t.match(/<totalCount>(\d+)<\/totalCount>/)?.[1];
  const ok = (/<item>/.test(t) || total != null) && !/SERVICE_KEY_IS_NOT_REGISTERED|등록되지|NOT_FOUND/.test(t);
  return { ok, msg: ok ? `행사 ${total ?? "수신"} OK` : t.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 70) };
});

await test("서울 열린데이터(생활인구)", E.SEOUL_OPENDATA_KEY, async () => {
  const u = `http://openapi.seoul.go.kr:8088/${E.SEOUL_OPENDATA_KEY}/json/SPOP_LOCAL_RESD_DONG/1/1/20260101`;
  const r = await fetch(u, { signal: timeout(12000) });
  const j = await r.json();
  const code = j?.SPOP_LOCAL_RESD_DONG?.RESULT?.CODE ?? j?.RESULT?.CODE;
  return { ok: !!j?.SPOP_LOCAL_RESD_DONG?.row, msg: j?.SPOP_LOCAL_RESD_DONG?.row ? "행 수신 OK" : `code=${code ?? "무응답"}` };
});

console.log("\n┌─ 실데이터 API 라이브 진단 ──────────────────────────");
for (const [name, status, msg] of out) {
  const icon = status === "OK" ? "✅" : status === "NO_KEY" ? "🔑" : "❌";
  console.log(`│ ${icon} ${name.padEnd(22)} [${status}] ${msg}`);
}
console.log("└──────────────────────────────────────────────────\n");
