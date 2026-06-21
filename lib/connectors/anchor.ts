// 앵커 점포 — 지역의 대표 점포가 동네 버즈를 끄는가.
//   · 네이버 지역검색(local)으로 "{동네} 맛집/카페" 점포 목록(리뷰순)
//   · 각 점포의 네이버 블로그 글 수 = 회자도(버즈) 실측
//   ⚠ 네이버 지도 '좋아요·리뷰 수'는 공식 API 미제공 → 블로그 글 수로 대체.
import "server-only";
import { naverJson } from "@/lib/connectors/naverFetch";

const ID = process.env.NAVER_CLIENT_ID;
const SEC = process.env.NAVER_CLIENT_SECRET;
const H = { "X-Naver-Client-Id": ID ?? "", "X-Naver-Client-Secret": SEC ?? "" };

export interface AnchorStore {
  name: string;
  category: string;
  blogBuzz: number; // 블로그 글 수
  lng?: number;
  lat?: number;
  address?: string;
  distanceM?: number; // 진단 지점으로부터 거리(m)
}

const cache = new Map<string, { at: number; data: AnchorStore[] | null }>();
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

// area=동명(질의), center=진단 지점 좌표(있으면 반경 필터), radiusM=최대 거리(기본 1km)
export async function anchorStores(
  area: string,
  center?: { lng: number; lat: number },
  radiusM = 1000
): Promise<AnchorStore[] | null> {
  if (!ID || !SEC || !area.trim()) return null;
  const ck = `${area}|${center ? `${center.lng.toFixed(4)},${center.lat.toFixed(4)}|${radiusM}` : ""}`;
  const hit = cache.get(ck);
  if (hit && Date.now() - hit.at < TTL) return hit.data;

  // 1) 점포 목록 — 맛집·카페 (리뷰순)
  const lists = await Promise.all(
    [`${area} 맛집`, `${area} 카페`, `${area} 음식점`].map((q) =>
      naverJson(`https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(q)}&display=5&sort=comment`, H)
    )
  );
  const stores = new Map<string, { name: string; category: string; lng?: number; lat?: number; address?: string }>();
  for (const lj of lists) {
    for (const it of ((lj as { items?: { title: string; category?: string; mapx?: string; mapy?: string; roadAddress?: string }[] } | null)?.items ?? [])) {
      const nm = String(it.title).replace(/<[^>]+>/g, "").trim();
      if (nm && !stores.has(nm)) {
        // 네이버 mapx/mapy = WGS84 × 10^7
        const lng = it.mapx ? Number(it.mapx) / 1e7 : undefined;
        const lat = it.mapy ? Number(it.mapy) / 1e7 : undefined;
        stores.set(nm, { name: nm, category: it.category ?? "", lng, lat, address: it.roadAddress });
      }
    }
  }
  // 위치 기반: 진단 지점 반경(기본 1km) 내 점포 우선. 저밀도 지역(반경 내 0개)이면
  // 인근 최대 4배 반경(예: 4km)의 '최근접' 점포로 폴백 — 소도시·읍면도 대표 점포가 보이도록.
  let arr = [...stores.values()].map((s) => ({
    ...s,
    distanceM: center && s.lng != null && s.lat != null ? Math.round(distM(center.lng, center.lat, s.lng, s.lat)) : undefined,
  }));
  if (center) {
    const within = arr.filter((s) => s.distanceM != null && s.distanceM <= radiusM);
    if (within.length) arr = within;
    else arr = arr.filter((s) => s.distanceM != null && s.distanceM <= radiusM * 4).sort((a, b) => (a.distanceM as number) - (b.distanceM as number));
  }
  arr = arr.slice(0, 12);

  if (!arr.length) {
    cache.set(ck, { at: Date.now(), data: null });
    return null;
  }

  // 2) 점포별 블로그 버즈
  const buzz = await Promise.all(
    arr.map((s) =>
      naverJson(`https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(s.name)}&display=1`, H).then(
        (j) => Number((j as { total?: number } | null)?.total ?? 0)
      )
    )
  );
  const ranked = arr
    .map((s, i) => ({ ...s, blogBuzz: buzz[i] }))
    .sort((a, b) => b.blogBuzz - a.blogBuzz)
    .slice(0, 6);

  cache.set(ck, { at: Date.now(), data: ranked });
  return ranked;
}
