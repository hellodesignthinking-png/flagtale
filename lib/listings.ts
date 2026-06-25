// 호스트 자가 등록·관리 데이터 레이어.
// 지금: 브라우저(localStorage) 저장 데모 — 각 호스트가 직접 등록·수정·삭제(로그인 불필요, 본인 브라우저 한정).
// 활성화: Supabase(listings 테이블 + RLS owner) 도입 시 이 레이어만 fetch로 교체하면 서버 영속·공유·지도 반영.
// (스펙 §5 ParcelMap/§11 권한 모델과 연결 — 등록 콘텐츠는 동네 공급 밀도→매력도에 기여)

export type ListingKind = "spot" | "stay" | "tour";

export interface Listing {
  id: string;
  kind: ListingKind;
  name: string; // 스팟명 / 스테이 제목 / 투어·워크숍 제목
  region: string; // 예: "서울 마포구" · "강릉"
  host?: string; // 운영자·호스트명
  address?: string;
  lat?: number; // 주소 지오코딩 좌표(/api/geocode)
  lng?: number;
  description?: string;
  image?: string; // 이미지 URL(선택)
  // 스팟
  category?: string;
  // 스테이
  stayType?: string;
  pricePerNight?: number;
  maxGuests?: number;
  // 투어·워크숍
  tourType?: string; // "투어" | "워크숍"
  price?: number;
  maxSeats?: number;
  schedule?: string;
  duration?: string;
  createdAt: number;
  updatedAt: number;
}

export const KIND_META: Record<ListingKind, { emoji: string; label: string; who: string; color: string }> = {
  spot: { emoji: "🏪", label: "매장·지점·공간", who: "일반 사용자 · 매장 운영자 · 지역 활동가", color: "#D4861E" },
  stay: { emoji: "🏠", label: "로컬 스테이", who: "숙박 운영자", color: "#16a34a" },
  tour: { emoji: "🎫", label: "투어·워크숍", who: "투어·워크숍 진행자", color: "#1E5FA8" },
};

export const SPOT_CATEGORIES = ["카페", "맛집", "책방", "바", "공방·클래스", "갤러리", "베이커리", "편집숍", "거점·커뮤니티 공간", "기타"];
export const STAY_TYPES = ["게스트하우스", "한옥 스테이", "펜션", "독채", "호텔", "기타"];
export const TOUR_TYPES = ["투어", "워크숍"];

const KEY = "ft_listings_v1";

export function getMyListings(): Listing[] {
  if (typeof window === "undefined") return [];
  try {
    const arr = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(arr) ? (arr as Listing[]) : [];
  } catch {
    return [];
  }
}

function saveAll(ls: Listing[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(ls));
}

/** 신규 추가 또는 기존 수정(id 일치 시). */
export function upsertListing(l: Listing): void {
  const ls = getMyListings();
  const i = ls.findIndex((x) => x.id === l.id);
  if (i >= 0) ls[i] = l;
  else ls.unshift(l);
  saveAll(ls);
}

export function deleteListing(id: string): void {
  saveAll(getMyListings().filter((x) => x.id !== id));
}

export function newListingId(): string {
  return `l_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}
