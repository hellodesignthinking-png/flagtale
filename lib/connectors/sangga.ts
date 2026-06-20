// 골목상권 실측 — 소상공인진흥공단 상가(상권)정보 API (data.go.kr B553077/sdsc2).
// 좌표 주변 사각영역의 실제 점포를 받아 업종 분포·다양성·음식카페/프랜차이즈 비율 계산.
// 활용신청 승인 반영 전엔 403 → null (UI는 '반영 대기'). 반영되면 자동 작동.
import "server-only";

const KEY = process.env.DATA_GO_KR_KEY;
const ENDPOINT = "https://apis.data.go.kr/B553077/api/open/sdsc2/storeListInRectangle";

export interface SanggaStats {
  total: number; // 점포 수 (catchment 내)
  byLarge: { name: string; count: number }[]; // 업종 대분류 분포
  topMid: { name: string; count: number }[]; // 중분류 TOP6
  diversity: number; // 업종 다양성 0~100 (정규화 Shannon)
  foodCafeRatio: number; // 음식·카페·주점 비율 %
  chainRatio: number; // 지점명 보유(프랜차이즈 근사) 비율 %
  radiusM: number;
}

interface Store {
  indsLclsNm?: string;
  indsMclsNm?: string;
  brchNm?: string;
}

const cache = new Map<string, { at: number; data: SanggaStats | null }>();
const TTL = 1000 * 60 * 60 * 12;

export async function sanggaStats(lng: number, lat: number, half = 0.005): Promise<SanggaStats | null> {
  if (!KEY || !Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  const ck = `${lng.toFixed(4)},${lat.toFixed(4)}`;
  const hit = cache.get(ck);
  if (hit && Date.now() - hit.at < TTL) return hit.data;

  const minx = lng - half, maxx = lng + half, miny = lat - half, maxy = lat + half;
  const items: Store[] = [];
  try {
    for (let page = 1; page <= 2; page++) {
      const url =
        `${ENDPOINT}?serviceKey=${encodeURIComponent(KEY)}&pageNo=${page}&numOfRows=1000` +
        `&minx=${minx}&miny=${miny}&maxx=${maxx}&maxy=${maxy}&type=json`;
      const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(7000) });
      if (!res.ok) {
        cache.set(ck, { at: Date.now(), data: null }); // 403(반영 대기) 등
        return null;
      }
      const j = await res.json();
      const body = j?.body ?? j?.response?.body;
      const its: Store[] = body?.items ?? [];
      items.push(...its);
      if (its.length < 1000) break;
    }
  } catch {
    return null;
  }
  if (!items.length) {
    cache.set(ck, { at: Date.now(), data: null });
    return null;
  }

  const large: Record<string, number> = {};
  const mid: Record<string, number> = {};
  let food = 0, chain = 0;
  for (const it of items) {
    const L = it.indsLclsNm || "기타";
    large[L] = (large[L] || 0) + 1;
    const M = it.indsMclsNm || "기타";
    mid[M] = (mid[M] || 0) + 1;
    if (/음식|커피|카페|주점|제과|음료/.test(`${it.indsLclsNm || ""}${it.indsMclsNm || ""}`)) food++;
    if (it.brchNm && String(it.brchNm).trim()) chain++;
  }
  const total = items.length;
  const counts = Object.values(mid);
  const H = -counts.reduce((s, c) => {
    const p = c / total;
    return s + p * Math.log(p);
  }, 0);
  const Hmax = Math.log(counts.length || 1);
  const diversity = Hmax ? Math.round((H / Hmax) * 1000) / 10 : 0;

  const data: SanggaStats = {
    total,
    byLarge: Object.entries(large).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count })),
    topMid: Object.entries(mid).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, count]) => ({ name, count })),
    diversity,
    foodCafeRatio: Math.round((food / total) * 1000) / 10,
    chainRatio: Math.round((chain / total) * 1000) / 10,
    radiusM: Math.round(half * 111000),
  };
  cache.set(ck, { at: Date.now(), data });
  return data;
}
