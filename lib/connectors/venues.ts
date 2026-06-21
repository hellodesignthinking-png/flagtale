// 지역 문화·생활 인프라 — 갤러리·도서관·책방·공연장·체육관 (공공/민간 모두 강점).
//   · 네이버 지역검색(local)으로 종류별 시설 탐색 (네이버는 공공·민간 모두 인덱싱)
//   · 이름 휴리스틱으로 공공(구립/시립/국립…) vs 민간/재단 분류
//   · 진단 지점 반경 내 시설 → 동네 '문화 인프라 강도' 산출
import "server-only";
import { naverJson } from "@/lib/connectors/naverFetch";

const ID = process.env.NAVER_CLIENT_ID;
const SEC = process.env.NAVER_CLIENT_SECRET;
const H = { "X-Naver-Client-Id": ID ?? "", "X-Naver-Client-Secret": SEC ?? "" };

export type VenueKind = "gallery" | "library" | "bookstore" | "theater" | "gym" | "park";

export interface Venue {
  name: string;
  kind: VenueKind;
  category: string;
  lng?: number;
  lat?: number;
  address?: string;
  distanceM?: number;
  publicOp: boolean; // 공공 운영 추정
}

export interface VenuesResult {
  venues: Venue[];
  byKind: { kind: VenueKind; label: string; color: string; count: number; publicCount: number }[];
  total: number;
  publicCount: number;
  privateCount: number;
  within500: number;
  cultureScore: number; // 0~100 문화 인프라 강도
}

export const VENUE_KINDS: { kind: VenueKind; label: string; color: string; queries: string[] }[] = [
  { kind: "gallery", label: "갤러리·미술관", color: "#8b6ef6", queries: ["갤러리", "미술관"] },
  { kind: "library", label: "도서관", color: "#4b9cd3", queries: ["도서관"] },
  { kind: "bookstore", label: "책방·서점", color: "#1e7a8c", queries: ["책방", "독립서점"] },
  { kind: "theater", label: "공연장·극장", color: "#d4861e", queries: ["공연장", "극장"] },
  { kind: "gym", label: "체육관·체육시설", color: "#0f6e5c", queries: ["체육관", "스포츠센터"] },
  { kind: "park", label: "공원·녹지", color: "#34a853", queries: ["공원", "근린공원"] },
];

// 공공 운영 추정 키워드
const PUBLIC_RE =
  /국립|시립|구립|도립|군립|공립|공공|문화재단|예술의전당|세종문화|진흥원|복지관|주민센터|행정복지|구민|시민|군민|동주민|체육회|생활체육|국민체육|마을/;
// 공원류 — 대부분 공공 인프라
const PARK_PUBLIC_RE = /공원|수목원|숲|체육공원|문화공원|생태공원|어린이공원|근린공원|도시공원|호수공원|국가정원|올림픽|월드컵/;

const cache = new Map<string, { at: number; data: VenuesResult | null }>();
const TTL = 1000 * 60 * 60 * 12;

function distM(lng1: number, lat1: number, lng2: number, lat2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// 공용 스로틀(naverJson) 경유 — 진단 시 anchor·social·naverInterest와 동시 호출되므로
// 직접 fetch면 429(레이트리밋)로 간헐 실패. throttle(동시3·429재시도)로 안정화.
async function search(query: string) {
  return naverJson(`https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}&display=5&sort=comment`, H, 4500);
}

// area=동명, center=진단 좌표(반경 필터), radiusM=최대 거리(기본 1.2km)
export async function localVenues(
  area: string,
  center?: { lng: number; lat: number },
  radiusM = 1200
): Promise<VenuesResult | null> {
  if (!ID || !SEC || !area.trim()) return null;
  const ck = `${area}|${center ? `${center.lng.toFixed(4)},${center.lat.toFixed(4)}|${radiusM}` : ""}`;
  const hit = cache.get(ck);
  if (hit && Date.now() - hit.at < TTL) return hit.data;

  // 종류×질의 평탄화 후 병렬 검색
  const tasks = VENUE_KINDS.flatMap((k) => k.queries.map((q) => ({ kind: k.kind, q: `${area} ${q}` })));
  const results = await Promise.all(tasks.map((t) => search(t.q)));

  const seen = new Set<string>();
  const cand: Venue[] = [];
  results.forEach((rj, i) => {
    const kind = tasks[i].kind;
    const items = (rj as { items?: { title: string; category?: string; mapx?: string; mapy?: string; roadAddress?: string; address?: string }[] } | null)?.items ?? [];
    for (const it of items) {
      const name = String(it.title).replace(/<[^>]+>/g, "").trim();
      if (!name || seen.has(name)) continue;
      const lng = it.mapx ? Number(it.mapx) / 1e7 : undefined;
      const lat = it.mapy ? Number(it.mapy) / 1e7 : undefined;
      const addr = it.roadAddress || it.address || "";
      const distance = center && lng != null && lat != null ? Math.round(distM(center.lng, center.lat, lng, lat)) : undefined;
      if (center && distance == null) continue; // 좌표 없어 거리판단 불가 → 제외
      seen.add(name);
      cand.push({
        name,
        kind,
        category: it.category ?? "",
        lng,
        lat,
        address: addr,
        distanceM: distance,
        publicOp:
          PUBLIC_RE.test(name) ||
          PUBLIC_RE.test(it.category ?? "") ||
          (kind === "park" && PARK_PUBLIC_RE.test(name)), // 공원은 대부분 공공 녹지
      });
    }
  });

  // 반경 내 우선. 저밀도 지역(반경 내 0개)이면 인근 최대 3배 반경 최근접으로 폴백 — 소도시도 인프라가 보이도록.
  let venues: Venue[];
  if (center) {
    const within = cand.filter((v) => (v.distanceM ?? 9e9) <= radiusM);
    venues = within.length ? within : cand.filter((v) => (v.distanceM ?? 9e9) <= radiusM * 3);
  } else {
    venues = cand;
  }

  if (!venues.length) {
    cache.set(ck, { at: Date.now(), data: null });
    return null;
  }

  venues.sort((a, b) => (a.distanceM ?? 9e9) - (b.distanceM ?? 9e9));
  const byKind = VENUE_KINDS.map((k) => {
    const list = venues.filter((v) => v.kind === k.kind);
    return { kind: k.kind, label: k.label, color: k.color, count: list.length, publicCount: list.filter((v) => v.publicOp).length };
  });
  const total = venues.length;
  const publicCount = venues.filter((v) => v.publicOp).length;
  const within500 = venues.filter((v) => (v.distanceM ?? 9e9) <= 500).length;
  const distinctKinds = byKind.filter((k) => k.count > 0).length;
  // 문화 인프라 강도: 밀도 + 종류 다양성 + 근접
  const cultureScore = Math.max(0, Math.min(100, Math.round(total * 3.5 + distinctKinds * 7 + within500 * 2)));

  const data: VenuesResult = {
    venues: venues.slice(0, 24),
    byKind,
    total,
    publicCount,
    privateCount: total - publicCount,
    within500,
    cultureScore,
  };
  cache.set(ck, { at: Date.now(), data });
  return data;
}
