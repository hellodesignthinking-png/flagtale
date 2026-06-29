import { NextRequest, NextResponse } from "next/server";
import { buildMapItems } from "@/lib/flagtale";

export const dynamic = "force-dynamic";

// 자연어 → 지역/콘텐츠 추천. 규칙기반 파싱(출발지·거리·카테고리·키워드) + 지오/평점 랭킹.
// 예: "이번주말 서울에서 2시간 여행갈만한곳" → 서울 중심 ~160km 내 여행지 랭킹.

// 주요 출발지 좌표(시도·도시)
const ORIGINS: { names: string[]; lng: number; lat: number; label: string }[] = [
  { names: ["서울", "수도권"], lng: 126.98, lat: 37.55, label: "서울" },
  { names: ["인천"], lng: 126.71, lat: 37.46, label: "인천" },
  { names: ["수원", "경기"], lng: 127.03, lat: 37.27, label: "경기" },
  { names: ["춘천", "강원"], lng: 127.73, lat: 37.87, label: "강원" },
  { names: ["강릉"], lng: 128.88, lat: 37.75, label: "강릉" },
  { names: ["대전", "충청", "세종"], lng: 127.38, lat: 36.35, label: "대전·충청" },
  { names: ["청주", "충북"], lng: 127.49, lat: 36.64, label: "청주" },
  { names: ["전주", "전북"], lng: 127.15, lat: 35.82, label: "전주" },
  { names: ["광주", "전남", "호남"], lng: 126.85, lat: 35.16, label: "광주" },
  { names: ["대구", "경북"], lng: 128.6, lat: 35.87, label: "대구" },
  { names: ["부산", "경남"], lng: 129.08, lat: 35.18, label: "부산" },
  { names: ["울산"], lng: 129.31, lat: 35.54, label: "울산" },
  { names: ["제주"], lng: 126.53, lat: 33.5, label: "제주" },
  { names: ["경주"], lng: 129.22, lat: 35.84, label: "경주" },
  { names: ["여수"], lng: 127.66, lat: 34.76, label: "여수" },
];

// 카테고리 의도 키워드 → 매칭 kind/태그
const CAT_RULES: { kinds: string[]; kw: RegExp; label: string }[] = [
  { kinds: ["stay"], kw: /숙박|스테이|호텔|펜션|한옥|민박|묵을|1박|잘\s?곳/, label: "숙박" },
  { kinds: ["festival"], kw: /축제|페스티벌|행사|불꽃/, label: "축제" },
  { kinds: ["tour"], kw: /투어|체험|클래스|워크숍|프로그램/, label: "투어" },
  { kinds: ["spot"], kw: /카페|커피|디저트|브런치/, label: "카페" },
  { kinds: ["spot"], kw: /책방|서점|독립서점|북카페/, label: "책방" },
  { kinds: ["spot"], kw: /맛집|먹거리|음식|식당|밥|국밥|회|고기/, label: "맛집" },
  { kinds: ["spot"], kw: /갤러리|미술|전시|공방|예술/, label: "갤러리·공방" },
  { kinds: ["spot"], kw: /바|브루어리|맥주|와인|술/, label: "바·브루어리" },
];

function haversine(lng1: number, lat1: number, lng2: number, lat2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180, dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)));
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const query = String(body.query ?? "").trim();
  if (!query) return NextResponse.json({ error: "empty", message: "검색어를 입력하세요." }, { status: 400 });

  // 1) 출발지
  const origin = ORIGINS.find((o) => o.names.some((n) => query.includes(n))) ?? null;
  // 2) 거리(시간→km, 차로 ~80km/h)
  let radiusKm: number | null = null;
  const hm = query.match(/(\d+(?:\.\d+)?)\s*시간/);
  if (hm) radiusKm = Math.round(Number(hm[1]) * 80);
  else if (/근교|가까운|근처|인근/.test(query)) radiusKm = 70;
  else if (/당일|당일치기/.test(query)) radiusKm = 180;
  else if (/1박|주말여행|멀리|장거리/.test(query)) radiusKm = 320;
  // 3) 카테고리
  const matchedCats = CAT_RULES.filter((c) => c.kw.test(query));
  const wantKinds = new Set(matchedCats.flatMap((c) => c.kinds));
  const isTravel = /여행|놀러|갈만|나들이|가볼|구경|볼거리|명소|데이트|코스|여행지/.test(query);
  // 4) 자유 키워드(2글자+ 명사 후보) — 출발지·불용어 제거
  const stop = /^(이번|주말|에서|시간|여행|갈만한곳|곳|추천|근처|근교|가까운|당일|코스|어디|할만한|좋은|있는|정도|정말|진짜)$/;
  const keywords = query.replace(/[^가-힣a-zA-Z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length >= 2 && !stop.test(w) && !ORIGINS.some((o) => o.names.includes(w)));

  const items = buildMapItems();
  const scored = items
    .map((it) => {
      let score = 0;
      const dist = origin && it.lat && it.lng ? haversine(origin.lng, origin.lat, it.lng, it.lat) : null;
      // 거리 필터/가점
      if (origin && radiusKm != null && dist != null) {
        if (dist > radiusKm * 1.25) return null; // 반경 초과 제외(25% 여유)
        score += Math.max(0, 28 - (dist / radiusKm) * 28); // 가까울수록↑
      } else if (origin && dist != null) {
        score += Math.max(0, 20 - dist / 30);
      }
      // 카테고리 매칭
      if (wantKinds.size) { if (wantKinds.has(it.kind)) score += 34; else if (!isTravel) return null; }
      if (isTravel && (it.kind === "tour" || it.kind === "stay" || it.kind === "festival" || it.kind === "basecamp")) score += 16;
      // 키워드 매칭(이름·지역·태그·라벨)
      const hay = `${it.name} ${it.region} ${(it.tags ?? []).join(" ")} ${it.catLabel} ${it.sub ?? ""}`;
      let kwHit = 0;
      for (const kw of keywords) if (hay.includes(kw)) { score += 22; kwHit++; }
      // 평점
      score += (it.rating ?? 0) * 2;
      // 출발지/거리/카테고리/키워드 중 아무것도 안 걸리면 약하게(전국 노이즈 방지)
      if (!origin && !wantKinds.size && !kwHit && !isTravel) return null;
      return { it, score, dist, kwHit };
    })
    .filter((x): x is { it: ReturnType<typeof buildMapItems>[number]; score: number; dist: number | null; kwHit: number } => x != null)
    .sort((a, b) => b.score - a.score)
    .slice(0, 14);

  const recommendations = scored.map(({ it, dist }) => ({
    id: it.id, name: it.name, region: it.region, kind: it.kind, catLabel: it.catLabel,
    emoji: it.emoji, color: it.color, lat: it.lat, lng: it.lng, rating: it.rating, image: it.image, sub: it.sub,
    distanceKm: dist,
    reason: [origin && dist != null ? `${origin.label}에서 ${dist}km` : null, it.catLabel, it.rating ? `⭐${it.rating}` : null].filter(Boolean).join(" · "),
  }));

  const summary = recommendations.length
    ? `${origin ? `${origin.label} 기준 ` : ""}${radiusKm ? `~${radiusKm}km · ` : ""}${matchedCats.map((c) => c.label).join("·") || (isTravel ? "여행지" : "관련")} ${recommendations.length}곳 추천`
    : "조건에 맞는 곳을 찾지 못했어요. 지역·카테고리를 바꿔보세요.";

  return NextResponse.json({
    query,
    parsed: { origin: origin?.label ?? null, radiusKm, cats: matchedCats.map((c) => c.label), keywords },
    summary,
    recommendations,
  });
}
