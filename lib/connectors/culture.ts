// 지역 문화 활력 — 한국문화정보원 '한눈에보는문화정보' (공연·전시·축제·행사).
// /area2 (지역별) — 시도+시군구로 매칭. 활용신청 반영 전엔 403 → null('반영 대기').
import "server-only";

const KEY = process.env.DATA_GO_KR_KEY;
const BASE = "https://apis.data.go.kr/B553457/cultureinfo";

export interface CultureEvent {
  title: string;
  realm: string; // 분야 (전시/공연/축제…)
  place: string;
  period: string;
  lng?: number;
  lat?: number;
}
export interface CultureInfo {
  total: number;
  region: string;
  byRealm: { name: string; count: number }[]; // 분야 분포
  events: CultureEvent[]; // 대표 행사
}

function tag(block: string, name: string): string {
  const m = block.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : "";
}

const cache = new Map<string, { at: number; data: CultureInfo | null }>();
const TTL = 1000 * 60 * 60 * 12;

export async function cultureInfo(sido: string, gugun: string): Promise<CultureInfo | null> {
  if (!KEY || !sido) return null;
  const ck = `${sido}|${gugun}`;
  const hit = cache.get(ck);
  if (hit && Date.now() - hit.at < TTL) return hit.data;

  const sidoShort = sido.replace(/특별시|광역시|특별자치시|특별자치도|도$/, "");
  const url =
    `${BASE}/area2?serviceKey=${encodeURIComponent(KEY)}&numOfRows=80&PageNo=1` +
    `&sido=${encodeURIComponent(sidoShort)}&gugun=${encodeURIComponent(gugun)}&sortStdr=1`;
  try {
    const r = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!r.ok) {
      cache.set(ck, { at: Date.now(), data: null });
      return null;
    }
    const xml = await r.text();
    if (!xml.includes("<item")) {
      cache.set(ck, { at: Date.now(), data: null }); // 403/빈응답
      return null;
    }
    const totalM = xml.match(/<totalCount>(\d+)<\/totalCount>/);
    const total = totalM ? Number(totalM[1]) : 0;
    const blocks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
    const realm = (b: string) => tag(b, "realmName") || tag(b, "realm") || "기타";
    const events: CultureEvent[] = blocks.slice(0, 8).map((b) => ({
      title: tag(b, "title"),
      realm: realm(b),
      place: tag(b, "place"),
      period: [tag(b, "startDate"), tag(b, "endDate")].filter(Boolean).join("~"),
      lng: Number(tag(b, "gpsX")) || undefined,
      lat: Number(tag(b, "gpsY")) || undefined,
    }));
    const rc: Record<string, number> = {};
    for (const b of blocks) rc[realm(b)] = (rc[realm(b)] || 0) + 1;
    const byRealm = Object.entries(rc).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
    const data: CultureInfo = { total: total || blocks.length, region: gugun || sidoShort, byRealm, events };
    cache.set(ck, { at: Date.now(), data });
    return data;
  } catch {
    return null;
  }
}
