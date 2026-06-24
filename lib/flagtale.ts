// Flagtale 소비자 플랫폼 데이터 로더(서버 전용 — fs). 원본 SQLite 시드에서 덤프한 실데이터(data/flagtale/*.json).
// 타입·헬퍼는 lib/flagtale-types.ts(클라이언트 공용)에서 re-export 한다.
// 백엔드(주문·결제·인증·어드민)는 후속 단계에서 Next API + DB(Turso/Supabase)로 이전 예정.
import fs from "node:fs";
import path from "node:path";
import type { Creator, Tour, Stay, FlagPass, Spot, Basecamp, Festival, MapItem } from "./flagtale-types";
import { REGION_CENTROID, catMeta, spotCat } from "./flagtale-types";

export * from "./flagtale-types";

const DIR = path.join(process.cwd(), "data", "flagtale");
function read<T>(f: string): T {
  return JSON.parse(fs.readFileSync(path.join(DIR, f), "utf-8")) as T;
}

export const loadCreators = () => read<Creator[]>("creators.json");
export const loadTours = () => read<Tour[]>("tours.json");
export const loadStays = () => read<Stay[]>("stays.json");
export const loadFlagPasses = () => read<FlagPass[]>("flag_pass_products.json");
export const loadSpots = () => read<Spot[]>("spots.json");
export const loadBasecamps = () => read<Basecamp[]>("basecamps.json");
export const loadFestivals = () => read<Festival[]>("festivals.json");
export const creatorById = (id: number) => loadCreators().find((c) => c.id === id) ?? null;

/** 네이버지도형 익스플로러용 통합 콘텐츠 포인트(투어·숙박·축제·스팟·거점) */
export function buildMapItems(): MapItem[] {
  const out: MapItem[] = [];
  for (const s of loadSpots()) {
    if (!s.lat || !s.lng) continue;
    const c = spotCat(s.category);
    const m = catMeta(c);
    out.push({ id: `spot-${s.id}`, kind: "spot", cat: c, catLabel: m.label, name: s.name, lat: s.lat, lng: s.lng, region: s.region, emoji: m.emoji, color: m.color, sub: `${m.label}${s.crew ? ` · ${s.crew}` : ""}`, rating: s.rating || undefined, reviewCount: s.review_count || undefined, address: s.address, image: s.image ?? undefined, hours: s.hours, priceRange: s.price_range, crew: s.crew, phone: s.phone, naverUrl: s.naver_url, tags: [m.label, s.region, ...(s.crew ? [s.crew] : [])] });
  }
  for (const s of loadStays()) {
    if (!s.lat || !s.lng) continue;
    out.push({ id: `stay-${s.id}`, kind: "stay", cat: "stay", catLabel: "숙박", name: s.title, lat: s.lat, lng: s.lng, region: s.region, emoji: "🏠", color: "#16a34a", sub: `${s.stay_type ?? "스테이"} · 호스트 ${s.host_name}`, detail: s.description, rating: s.rating, reviewCount: s.review_count || undefined, price: s.price_per_night, image: s.image, address: s.address, crew: s.host_name, tags: [s.stay_type ?? "스테이", s.region, `최대 ${s.max_guests}인`] });
  }
  const jitter: Record<string, number> = {};
  for (const t of loadTours()) {
    const ctr = REGION_CENTROID[t.region];
    if (!ctr) continue;
    const n = (jitter[t.region] = (jitter[t.region] ?? 0) + 1);
    const off = (n - 1) * 0.035;
    out.push({ id: `tour-${t.id}`, kind: "tour", cat: "tour", catLabel: "투어", name: t.title, lat: ctr[1] + off, lng: ctr[0] + off, region: t.region, emoji: "🎫", color: "#D4861E", sub: `${t.region} · ${t.duration}`, detail: t.description, rating: t.rating, reviewCount: t.like_count || undefined, price: t.price, image: t.image, hours: t.schedule, tags: [t.region, t.duration, `정원 ${t.max_seats}명`] });
  }
  for (const f of loadFestivals()) {
    out.push({ id: `fest-${f.id}`, kind: "festival", cat: "festival", catLabel: "축제", name: f.name, lat: f.lat, lng: f.lng, region: `${f.sido} ${f.region}`, emoji: "🎉", color: "#e11d48", sub: `${f.region} · ${f.month}`, detail: f.blurb, period: f.month, tags: [f.sido, f.region, f.month] });
  }
  for (const b of loadBasecamps()) {
    if (!b.lat || !b.lng) continue;
    out.push({ id: `bc-${b.id}`, kind: "basecamp", cat: "basecamp", catLabel: "거점", name: b.name, lat: b.lat, lng: b.lng, region: b.region, emoji: "🚩", color: "#4d7c0f", sub: "secondwind 거점", detail: b.description, address: b.address, image: b.image ?? undefined, tags: [b.region, "secondwind", "러닝·로컬 커뮤니티"] });
  }
  return out;
}
