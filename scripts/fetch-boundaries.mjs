// ─────────────────────────────────────────────────────────────
// 실제 행정동 경계(vuski/admdongkor) 다운로드 + 간소화 어댑터 스크립트
//
//  사용:  node scripts/fetch-boundaries.mjs --sido=경기도 --pct=8
//         node scripts/fetch-boundaries.mjs --sido=서울특별시
//
//  · vuski/admdongkor 의 전국 행정동 GeoJSON 을 받아
//  · (선택) 시도 필터 → mapshaper 로 간소화 →
//  · KLAI 스키마(DistrictProps)로 properties 매핑 →
//  · data/boundaries/admdong.simplified.geojson 으로 저장.
//
//  이후 .env.local 에 NEXT_PUBLIC_BOUNDARY_SOURCE=real 설정 시 지도가 실경계를 사용.
//  ⚠ 데이터윤리(스펙 §15): 실경계 + 샘플 점수를 함께 쓰면 실재 동에 가짜 등급이
//     붙으므로, 실경계는 실데이터(Phase 5) 확보 후 사용하거나 '개념검증' 배지를 유지.
//
//  요구사항: 네트워크, npx(mapshaper 자동 설치). 무거우므로(전국 수십 MB) 사용자가 직접 실행.
// ─────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "data", "boundaries");
const TMP = path.join(OUT_DIR, "_raw.geojson");
const OUT = path.join(OUT_DIR, "admdong.simplified.geojson");

// 최신 스냅샷(필요 시 ver 디렉터리 갱신)
const SRC =
  process.env.ADMDONG_URL ||
  "https://raw.githubusercontent.com/vuski/admdongkor/master/ver20250401/HangJeongDong_ver20250401.geojson";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);
const sidoFilter = args.sido || null; // 예: "경기도"
const pct = Number(args.pct || 8); // 간소화 유지율(%)

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log(`⬇  다운로드: ${SRC}`);
  const res = await fetch(SRC);
  if (!res.ok) throw new Error(`다운로드 실패: HTTP ${res.status}`);
  const raw = await res.text();
  fs.writeFileSync(TMP, raw);
  console.log(`   저장 ${(raw.length / 1e6).toFixed(1)} MB → ${TMP}`);

  // mapshaper: (시도 필터) + 간소화 + GeoJSON 출력
  const filterExpr = sidoFilter
    ? ["-filter", `sidonm === '${sidoFilter}' || sido === '${sidoFilter}'`]
    : [];
  const mapshaperArgs = [
    "-y", "mapshaper", TMP,
    ...filterExpr,
    "-simplify", `${pct}%`, "keep-shapes",
    "-o", "format=geojson", "precision=0.000001", OUT,
  ];
  console.log(`⚙  간소화(npx mapshaper, ${pct}%${sidoFilter ? `, 시도=${sidoFilter}` : ""})…`);
  const r = spawnSync("npx", mapshaperArgs, { stdio: "inherit", cwd: ROOT });
  if (r.status !== 0) throw new Error("mapshaper 실행 실패 (npx/네트워크 확인)");

  // properties 매핑 → KLAI DistrictProps
  const gj = JSON.parse(fs.readFileSync(OUT, "utf-8"));
  gj.features = gj.features.map((f) => {
    const p = f.properties || {};
    const admCd2 = String(p.adm_cd2 || p.adm_cd || p.ADM_CD || "");
    const name = String(p.adm_nm || p.ADM_NM || "").split(" ").pop() || admCd2;
    const c = centroid(f.geometry);
    return {
      type: "Feature",
      properties: {
        admCd2,
        admCd: String(p.adm_cd || ""),
        name,
        sido: String(p.sidonm || p.sido || ""),
        sigungu: String(p.sggnm || p.sgg || ""),
        typology: "", // 실데이터(Phase 5) 군집 분류로 채움
        centroidLng: c[0],
        centroidLat: c[1],
      },
      geometry: f.geometry,
    };
  });
  fs.writeFileSync(OUT, JSON.stringify(gj));
  fs.rmSync(TMP, { force: true });

  console.log(`✓ ${gj.features.length} 행정동 → ${path.relative(ROOT, OUT)}`);
  console.log(`  활성화: .env.local 에  NEXT_PUBLIC_BOUNDARY_SOURCE=real`);
  console.log(`  ⚠ 실경계는 실데이터(점수) 확보 후 사용 권장 (데이터윤리 §15)`);
}

function centroid(geom) {
  // 대략적 중심(첫 폴리곤 외곽 평균) — 라벨·검색용
  let ring;
  if (geom.type === "Polygon") ring = geom.coordinates[0];
  else if (geom.type === "MultiPolygon") ring = geom.coordinates[0][0];
  else return [127, 37.5];
  let x = 0, y = 0;
  for (const [lng, lat] of ring) {
    x += lng;
    y += lat;
  }
  return [Math.round((x / ring.length) * 1e6) / 1e6, Math.round((y / ring.length) * 1e6) / 1e6];
}

main().catch((e) => {
  console.error("✗", e.message);
  console.error("  (네트워크/Node18+ fetch/npx 필요. 기본 샘플 경계는 그대로 동작합니다.)");
  process.exit(1);
});
