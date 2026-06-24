// Flagtale 공용 타입 + 헬퍼 — fs 의존 없음(클라이언트 컴포넌트에서 import 가능).
// 데이터 로더(fs)는 lib/flagtale.ts(서버 전용)에 있고, 이 모듈을 re-export 한다.

export function ftImage(p?: string | null): string {
  if (!p) return "/flagtale/placeholder.svg"; // 중립 플레이스홀더(이전: 사람 얼굴 폴백)
  // 원본 PNG(13MB)를 1024px JPEG(q66, ~4MB)로 최적화 — 저장된 .png 참조를 .jpg로 매핑.
  return "/flagtale/" + p.replace(/^images\//, "").replace(/^\/+/, "").replace(/\.png$/i, ".jpg");
}
export const round1 = (n: number) => Math.round((n ?? 0) * 10) / 10;
export const won = (n: number) => n.toLocaleString("ko-KR") + "원";

export interface Creator {
  id: number; name: string; nickname: string; region: string; specialty: string;
  description: string; image: string; cover_image: string;
  instagram: string | null; youtube: string | null; blog: string | null; naver_place: string | null;
  rating: number; review_count: number; is_active?: number;
}
export interface Tour {
  id: number; title: string; description: string; creator_id: number; region: string;
  lat?: number; lng?: number; // 실좌표(있으면 정확한 동 매핑, 없으면 region 중심+jitter)
  price: number; max_seats: number; booked_seats: number; schedule: string; duration: string;
  rating: number; like_count: number; image: string;
}
export interface Stay {
  id: number; title: string; description: string; host_name: string; region: string; address: string;
  lat: number; lng: number;
  price_per_night: number; max_guests: number; rating: number; review_count: number; image: string;
  badge_type: string | null; badge_label: string | null; stay_type: string | null;
}

/** 스팟 카테고리 → 이모지·라벨·색 (지도 마커·태그 공용) */
export const SPOT_CAT: Record<string, { emoji: string; label: string; color: string }> = {
  cafe: { emoji: "☕", label: "카페", color: "#D4861E" },
  food: { emoji: "🍽", label: "맛집", color: "#E2A33A" },
  bookstore: { emoji: "📚", label: "책방", color: "#1E5FA8" },
  bar: { emoji: "🍺", label: "바", color: "#8b6ef6" },
  gallery: { emoji: "🎨", label: "갤러리", color: "#3E9AA8" },
  workshop: { emoji: "🛠", label: "공방", color: "#0F6E5C" },
  shop: { emoji: "🛍", label: "상점", color: "#6366f1" },
  brewery: { emoji: "🍻", label: "브루어리", color: "#ca8a04" },
  stay: { emoji: "🏠", label: "스테이", color: "#16a34a" },
};

export interface Festival {
  id: number; name: string; region: string; sido: string; lat: number; lng: number; month: string; blurb: string;
}

/** 지역 중심좌표 — 좌표 없는 콘텐츠(투어 등)를 지도에 핀할 때 */
export const REGION_CENTROID: Record<string, [number, number]> = {
  서울: [126.99, 37.55], 강릉: [128.8961, 37.7519], 양양: [128.619, 38.0754],
  제주: [126.5312, 33.4996], 부산: [129.0756, 35.1796], 전주: [127.1306, 35.8242],
  경기: [127.05, 37.4], 인천: [126.7052, 37.4563], 충남: [126.8, 36.5], 강원: [128.2, 37.8],
};

/** 지도+왼쪽 리스트(네이버지도형) 통합 콘텐츠 포인트 */
export interface MapItem {
  id: string;
  kind: "spot" | "stay" | "basecamp" | "tour" | "festival";
  cat: string;        // 필터 카테고리 키: tour | stay | festival | food | culture | basecamp
  catLabel: string;   // 카테고리 라벨
  name: string;
  lat: number;
  lng: number;
  region: string;
  emoji: string;
  color: string;
  sub: string;        // 카드 보조 한 줄
  detail?: string;    // 추가 설명(투어·축제·스테이)
  rating?: number;
  reviewCount?: number;
  price?: number;
  period?: string;    // 축제 시기
  image?: string;     // 대표 썸네일(스테이·투어)
  images?: string[];  // 갤러리(다중 사진) — 있으면 캐러셀
  address?: string | null;
  hours?: string | null;       // 영업시간
  priceRange?: string | null;  // 가격대
  crew?: string | null;        // 운영 크루
  phone?: string | null;       // 전화
  naverUrl?: string | null;    // 네이버 플레이스 등록 URL
  tags?: string[];             // 키워드 태그
  // 사용자 등록 스팟(UGC) 운영 정보
  operator?: string | null;    // 운영 팀/회사
  homepage?: string | null;    // 운영사 홈페이지
  instagram?: string | null;   // 인스타그램
  youtube?: string | null;     // 유튜브
  blog?: string | null;        // 블로그
  addedBy?: string | null;     // 등록자(이메일)
  reports?: number;            // 신고 수
  updatedAt?: string;
}

/** 세분 카테고리 → 탭·색·이모지 메타 (네이버 부동산지도형 필터). 지역매장·축제·카페·책방 등 로컬 전부 */
export const MAP_CATS: { key: string; label: string; emoji: string; color: string }[] = [
  { key: "tour", label: "투어", emoji: "🎫", color: "#D4861E" },
  { key: "stay", label: "숙박", emoji: "🏠", color: "#16a34a" },
  { key: "festival", label: "축제", emoji: "🎉", color: "#e11d48" },
  { key: "cafe", label: "카페", emoji: "☕", color: "#D4861E" },
  { key: "food", label: "맛집", emoji: "🍽", color: "#E2A33A" },
  { key: "bookstore", label: "책방", emoji: "📚", color: "#1E5FA8" },
  { key: "gallery", label: "갤러리", emoji: "🎨", color: "#3E9AA8" },
  { key: "workshop", label: "공방", emoji: "🛠", color: "#0F6E5C" },
  { key: "bar", label: "바", emoji: "🍺", color: "#8b6ef6" },
  { key: "brewery", label: "브루어리", emoji: "🍻", color: "#ca8a04" },
  { key: "shop", label: "상점", emoji: "🛍", color: "#6366f1" },
  { key: "basecamp", label: "거점", emoji: "🚩", color: "#4d7c0f" },
];
export const catMeta = (key: string) => MAP_CATS.find((c) => c.key === key) ?? { key, label: key, emoji: "📍", color: "#888888" };

/** 스팟 카테고리 → 필터 키 (stay만 숙박으로, 그 외는 실제 카테고리 그대로) */
export const spotCat = (category: string): string => (category === "stay" ? "stay" : category);
export interface FlagPass {
  id: number; name: string; description: string; price: number; duration_days: number; discount_percent: number; benefits: string;
}
export interface Spot {
  id: number; name: string; lat: number; lng: number; address: string; category: string;
  crew: string | null; region: string; rating: number; review_count: number;
  phone: string | null; hours: string | null; price_range: string | null; naver_url: string | null; image: string | null;
}
export interface Basecamp {
  id: number; name: string; region: string; address: string; lat: number; lng: number; description: string; image: string | null;
}

/** 크리에이터 전문분야(콤마/슬래시 구분) → 태그 배열 */
export const specialtyTags = (s: string) => (s || "").split(/[/,·]/).map((x) => x.trim()).filter(Boolean);

/** 지역 필터 키 (Discover 태그클라우드용) */
export const CREATOR_REGIONS = ["전체", "서울", "강릉", "양양", "제주", "부산", "전주"];
