// 실제 지오코딩 — VWorld 주소/지번 → 좌표 → point-in-polygon → 실제 행정동(adm_cd2).
// 키 없거나 매칭 실패 시 호출부가 기존 이름 매칭(geocodeToPlace)으로 폴백.
import "server-only";
import { loadDistricts } from "@/lib/data";
import { naverJson } from "@/lib/connectors/naverFetch";
import type { DistrictProps } from "@/lib/types";

const VWORLD_KEY = process.env.VWORLD_KEY;
const NAVER_ID = process.env.NAVER_CLIENT_ID;
const NAVER_SEC = process.env.NAVER_CLIENT_SECRET;

export interface GeoHit {
  lng: number;
  lat: number;
  matched: string; // 정제된 주소 또는 장소명
  kind: "road" | "parcel" | "place"; // place = 역·랜드마크·POI(네이버 지역검색)
}

// 네이버 지역검색 — 역·랜드마크·상호 등 POI 이름 → 좌표 (VWorld가 못 잡는 유명 장소).
//   예: "강남역", "홍대입구", "롯데월드타워", "성수동 카페거리"
export async function geocodePlace(query: string): Promise<GeoHit | null> {
  const q = query.trim();
  if (!NAVER_ID || !NAVER_SEC || !q) return null;
  const H = { "X-Naver-Client-Id": NAVER_ID, "X-Naver-Client-Secret": NAVER_SEC };
  const j = (await naverJson(`https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(q)}&display=1&sort=random`, H)) as {
    items?: { title?: string; mapx?: string; mapy?: string; roadAddress?: string; address?: string }[];
  } | null;
  const it = j?.items?.[0];
  if (!it?.mapx || !it?.mapy) return null;
  return {
    lng: Number(it.mapx) / 1e7, // 네이버 좌표 = WGS84 × 10^7
    lat: Number(it.mapy) / 1e7,
    matched: String(it.title ?? q).replace(/<[^>]+>/g, "") + (it.roadAddress ? ` · ${it.roadAddress}` : ""),
    kind: "place",
  };
}

// VWorld 지오코더 — 도로명 우선, 실패 시 지번
export async function geocodeAddress(query: string): Promise<GeoHit | null> {
  const q = query.trim();
  if (!VWORLD_KEY || !q) return null;
  for (const kind of ["road", "parcel"] as const) {
    const url =
      `https://api.vworld.kr/req/address?service=address&request=getcoord&version=2.0` +
      `&crs=epsg:4326&address=${encodeURIComponent(q)}&format=json&type=${kind}&key=${VWORLD_KEY}`;
    try {
      const res = await fetch(url, { cache: "no-store" });
      const j = await res.json();
      const p = j?.response?.result?.point;
      if (j?.response?.status === "OK" && p) {
        return {
          lng: Number(p.x),
          lat: Number(p.y),
          matched: j.response.refined?.text ?? q,
          kind,
        };
      }
    } catch {
      /* 다음 타입 시도 */
    }
  }
  return null;
}

// ── point-in-polygon (ray casting) ──────────────────────────
type Ring = number[][];
function inRing(lng: number, lat: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
// Polygon = [outerRing, ...holes]
function inPolygon(lng: number, lat: number, rings: Ring[]): boolean {
  if (!rings.length || !inRing(lng, lat, rings[0])) return false;
  for (let h = 1; h < rings.length; h++) if (inRing(lng, lat, rings[h])) return false; // 구멍
  return true;
}

// bbox 인덱스 (1회 계산 캐시)
type Indexed = { props: DistrictProps; rings: Ring[]; bbox: [number, number, number, number] };
let _idx: Indexed[] | null = null;
function index(): Indexed[] {
  if (_idx) return _idx;
  _idx = loadDistricts().features.map((f) => {
    // 데이터는 단일 Polygon
    const rings = f.geometry.coordinates as unknown as Ring[];
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [x, y] of rings[0]) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    return { props: f.properties, rings, bbox: [minX, minY, maxX, maxY] };
  });
  return _idx;
}

// 좌표 → 행정동 (bbox 프리필터 후 PIP)
export function pointToDistrict(lng: number, lat: number): DistrictProps | null {
  for (const it of index()) {
    const [minX, minY, maxX, maxY] = it.bbox;
    if (lng < minX || lng > maxX || lat < minY || lat > maxY) continue;
    if (inPolygon(lng, lat, it.rings)) return it.props;
  }
  return null;
}

// 주소/지번/장소 → 실제 행정동 + 좌표.
//   1) VWorld 주소·지번 지오코딩  2) 실패 시 네이버 지역검색(역·랜드마크·POI)
//   → 좌표 point-in-polygon으로 행정동 확정. point는 검색한 '그 장소'의 좌표 →
//     반경 데이터(상권·앵커·문화인프라)가 그 지점 중심으로 나온다.
export async function geocodeToDistrict(
  query: string
): Promise<{ props: DistrictProps; point: GeoHit } | null> {
  let point = await geocodeAddress(query); // 주소/지번
  if (!point) point = await geocodePlace(query); // 역·랜드마크·POI
  if (!point) return null;
  const props = pointToDistrict(point.lng, point.lat);
  if (!props) return null;
  return { props, point };
}

// ── 역지오코딩: 좌표 → 실제 지번(필지) ──────────────────────
export interface ReverseHit {
  jibun: string; // 지번 주소 (법정동 + 번지)
  road: string; // 도로명 주소
  pnu: string; // 필지 식별 (법정동코드 + 지번)
  bjdong: string; // 법정동
  admName: string; // 소속 행정동
  admCd: string; // 행정동 코드(adm_cd2)
}

export async function reverseGeocode(lng: number, lat: number): Promise<ReverseHit | null> {
  if (!VWORLD_KEY || !Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  const url =
    `https://api.vworld.kr/req/address?service=address&request=getAddress&version=2.0` +
    `&crs=epsg:4326&point=${lng},${lat}&format=json&type=both&key=${VWORLD_KEY}`;
  try {
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(4500) });
    const j = await res.json();
    if (j?.response?.status !== "OK") return null;
    type R = { type: string; text: string; structure?: Record<string, string> };
    const arr: R[] = j.response.result ?? [];
    const parcel = arr.find((r) => r.type === "parcel");
    const road = arr.find((r) => r.type === "road");
    const s = parcel?.structure ?? road?.structure ?? {};
    return {
      jibun: parcel?.text ?? "",
      road: road?.text ?? "",
      pnu: s.level4LC ? `${s.level4LC}${s.level5 ? " · " + s.level5 : ""}` : "",
      bjdong: s.level4L ?? "",
      admName: s.level4A ?? "",
      admCd: s.level4AC ?? "",
    };
  } catch {
    return null;
  }
}
