// 전국지역특화거리 표준데이터(공공데이터포털 15017322) → data/specialstreet.json
//   각 거리(위경도) → 행정동(districts.geojson PIP) 귀속. 동별 특화거리 수·점포수·대표 거리.
//   문화·상권 거리 = 지역 매력/표현 앵커. data.go.kr 활용신청 승인 필요(DATA_GO_KR_KEY).
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
// .env.local 로드(키는 파일에서만)
for (const line of fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
}
const KEY = process.env.DATA_GO_KR_KEY || process.env.G2B_API_KEY;
if (!KEY) { console.error("DATA_GO_KR_KEY 없음"); process.exit(1); }

// ── 거리 유형 추정(이름) ──
function streetType(nm) {
  const s = String(nm);
  if (/맛|먹거리|음식|먹자|food|미식|국밥|삼겹|곱창|회|커피|카페|빵|디저트/i.test(s)) return "음식";
  if (/문화|예술|아트|art|공방|갤러|벽화|책|문학|공연|골목/i.test(s)) return "문화";
  if (/패션|의류|쇼핑|상점|시장|상가|로데오/i.test(s)) return "상업";
  if (/한방|약|의료|건강/i.test(s)) return "특화";
  if (/관광|테마|거리|길/i.test(s)) return "관광";
  return "특화";
}

// ── PIP (ray-casting) + bbox 프리필터 ──
function ringHas(lng, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
    if (((yi > lat) !== (yj > lat)) && (lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}
function inFeature(lng, lat, f) {
  const g = f.geometry;
  const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
  for (const poly of polys) {
    if (ringHas(lng, lat, poly[0])) {
      let hole = false;
      for (let k = 1; k < poly.length; k++) if (ringHas(lng, lat, poly[k])) hole = true;
      if (!hole) return true;
    }
  }
  return false;
}

function bboxOf(f) {
  let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
  const g = f.geometry;
  const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
  for (const poly of polys) for (const [x, y] of poly[0]) {
    if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
  return [minX, minY, maxX, maxY];
}

async function fetchAll() {
  const out = [];
  for (let page = 1; page <= 5; page++) {
    const url = `https://api.data.go.kr/openapi/tn_pubr_public_area_spcliz_stret_api?serviceKey=${encodeURIComponent(KEY)}&pageNo=${page}&numOfRows=500&type=json`;
    const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
    const j = await r.json();
    const items = j?.response?.body?.items ?? [];
    const arr = Array.isArray(items) ? items : items?.item ?? [];
    out.push(...arr);
    const total = Number(j?.response?.body?.totalCount ?? 0);
    if (out.length >= total || !arr.length) break;
  }
  return out;
}

async function main() {
  console.log("[특화거리] 수집 중…");
  const streets = await fetchAll();
  console.log(`[특화거리] ${streets.length}개 거리`);

  const geo = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "districts.geojson"), "utf8"));
  const feats = geo.features.map((f) => ({ admCd2: f.properties.admCd2, bbox: bboxOf(f), f }));

  const byPlace = {};
  let mapped = 0, nocoord = 0;
  for (const s of streets) {
    const lng = Number(s.longitude), lat = Number(s.latitude);
    if (!Number.isFinite(lng) || !Number.isFinite(lat) || lng === 0 || lat === 0) { nocoord++; continue; }
    let hit = null;
    for (const ft of feats) {
      const [a, b, c, d] = ft.bbox;
      if (lng < a || lng > c || lat < b || lat > d) continue;
      if (inFeature(lng, lat, ft.f)) { hit = ft.admCd2; break; }
    }
    if (!hit) { nocoord++; continue; }
    mapped++;
    const e = (byPlace[hit] ??= { streets: [], count: 0, totalStores: 0 });
    e.streets.push({ name: String(s.stretNm || "").trim(), stores: Number(s.storNumber) || 0, year: String(s.appnYear || "").trim(), type: streetType(s.stretNm) });
    e.count++;
    e.totalStores += Number(s.storNumber) || 0;
  }

  const data = { source: "공공데이터포털 전국지역특화거리표준데이터(15017322)", total: streets.length, mapped, byPlace };
  fs.writeFileSync(path.join(ROOT, "data", "specialstreet.json"), JSON.stringify(data));
  console.log(`[특화거리] 동 매핑 ${mapped} · 미매핑/무좌표 ${nocoord} · 동수 ${Object.keys(byPlace).length}`);
  // 샘플
  const sample = Object.entries(byPlace).slice(0, 5);
  for (const [cd, e] of sample) console.log(`  ${cd}: ${e.streets.map((x) => x.name).join(", ")}`);
}
main();
