// 핫지역 인스타그램 해시태그 버즈 인제스트 — Apify(apify/instagram-scraper) run-sync → data/instagram.json
// 사용: node scripts/ingest-instagram.mjs   (APIFY_TOKEN을 .env.local 또는 env에 설정)
// 비파괴 병합: 이번에 못 받은 지역은 기존 값 유지.
import fs from "node:fs";
import path from "node:path";

// .env.local 간이 로드
try {
  for (const l of fs.readFileSync(".env.local", "utf-8").split("\n")) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch { /* no .env.local */ }

const TOKEN = process.env.APIFY_TOKEN;
if (!TOKEN) {
  console.error("[ig] APIFY_TOKEN 없음 — .env.local 또는 환경변수에 설정하세요. (apify.com → Settings → Integrations → API token)");
  process.exit(1);
}

// 핫지역 내러티브명 → 인스타 해시태그 (lib/narratives.ts의 name과 일치, 필요 시 추가)
const TAGS = {
  성수동: "성수동", 문래동: "문래동", 연남동: "연남동", 연희동: "연희동", 망원동: "망원동",
  익선동: "익선동", 한남동: "한남동", 경리단길: "경리단길", 서촌: "서촌", 가로수길: "가로수길",
  "북촌 한옥마을": "북촌한옥마을", 해방촌: "해방촌", "전주 한옥마을": "전주한옥마을", "경주 황리단길": "황리단길",
  "양양 (죽도·인구)": "죽도해변", "공주 제민천": "제민천", "수원 행궁동": "행궁동", "광주 동명동": "동명동",
  "대전 소제동": "소제동", "부산 영도": "흰여울문화마을", "목포 (괜찮아마을)": "괜찮아마을", "인천 개항로": "개항로",
  신당동: "신당동", "광주 양림동": "양림동", "군산 원도심": "군산여행", "부산 전포": "전포카페거리",
  "강릉 명주동": "명주동", 성북동: "성북동", "울산 장생포": "장생포", "포항 구룡포": "구룡포",
  "대구 김광석길": "김광석길", "제주 월정리": "월정리", "청주 수암골": "수암골", "부산 감천문화마을": "감천문화마을",
  "인천 송도": "송도", 속초: "속초여행", 춘천: "춘천여행", 여수: "여수밤바다", 송리단길: "송리단길",
  용리단길: "용리단길", "제주 한림": "협재", "세종 나성동": "나성동", "을지로 (힙지로)": "을지로",
  "통영 동피랑": "동피랑", "창원 진해": "진해군항제", "충주 관아골": "충주여행",
};
const names = Object.keys(TAGS);
const directUrls = names.map((n) => `https://www.instagram.com/explore/tags/${encodeURIComponent(TAGS[n])}/`);
const tagToName = Object.fromEntries(names.map((n) => [TAGS[n], n]));

console.log(`[ig] ${names.length}개 핫지역 해시태그 수집 중…`);
const res = await fetch(`https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=${TOKEN}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ directUrls, resultsType: "details", resultsLimit: 1 }),
});
if (!res.ok) {
  console.error(`[ig] Apify 호출 실패: ${res.status} ${await res.text().catch(() => "")}`);
  process.exit(1);
}
const items = await res.json();

// 기존 데이터 로드(비파괴 병합)
const FILE = path.join("data", "instagram.json");
let prev = {};
try { prev = JSON.parse(fs.readFileSync(FILE, "utf-8")).byName ?? {}; } catch { /* none */ }

const byName = { ...prev };
let updated = 0;
for (const it of Array.isArray(items) ? items : []) {
  const tag = decodeURIComponent(it.name || "");
  const name = tagToName[tag];
  if (name && Number(it.postsCount) > 0) {
    byName[name] = { tag, postsCount: Number(it.postsCount) };
    updated++;
  }
}

const out = {
  source: "apify/instagram-scraper",
  fetchedAt: new Date().toISOString().slice(0, 10),
  note: "핫지역 인스타그램 해시태그 게시물 수(공개) — Apify 수집·잠정. node scripts/ingest-instagram.mjs로 갱신.",
  byName,
};
fs.writeFileSync(FILE, JSON.stringify(out, null, 2) + "\n");
console.log(`[ig] 완료: ${updated}개 갱신 / 총 ${Object.keys(byName).length}개 → ${FILE}`);
