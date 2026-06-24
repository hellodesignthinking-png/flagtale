import { buildMapItems } from "./flagtale";
import { loadDistricts } from "./data";

// 지역 공급 밀도 — 플래그테일에 등록된 공간·프로그램(매장·스테이·투어·축제·거점)을 행정동에 매핑.
// 철학: 동네에 등록이 늘수록 그 지역의 매력도가 올라간다(네트워크 효과). 등록 수 + 관심(리뷰) → 매력도 가산.
export interface Supply {
  count: number;
  kinds: Record<string, number>; // 종류별 개수(매장/스테이/투어/축제/거점)
  reviews: number; // 등록 콘텐츠 총 리뷰·관심(수요·검색 프록시)
  items: { name: string; kind: string; rating?: number }[];
}

const KIND_LABEL: Record<string, string> = { spot: "매장", stay: "스테이", tour: "투어", festival: "축제", basecamp: "거점" };

let _byAdm: Map<string, Supply> | null = null;
function build(): Map<string, Supply> {
  if (_byAdm) return _byAdm;
  const feats = loadDistricts().features.map((f) => ({ cd: f.properties.admCd2, lat: f.properties.centroidLat, lng: f.properties.centroidLng }));
  const m = new Map<string, Supply>();
  const tours: { lat: number; lng: number; name: string; rating?: number; reviewCount?: number }[] = [];
  const addTo = (cd: string, kind: string, it: { name: string; rating?: number; reviewCount?: number }) => {
    const s = m.get(cd) ?? { count: 0, kinds: {}, reviews: 0, items: [] };
    s.count++;
    s.kinds[kind] = (s.kinds[kind] ?? 0) + 1;
    s.reviews += it.reviewCount ?? 0;
    if (s.items.length < 16) s.items.push({ name: it.name, kind: KIND_LABEL[kind] ?? kind, rating: it.rating });
    m.set(cd, s);
  };
  for (const it of buildMapItems()) {
    if (!it.lat || !it.lng) continue;
    // 투어는 실좌표가 없고 시(예:"서울") 중심좌표라 → 별도로 모아 지역 허브에 가산(아래).
    if (it.kind === "tour") { tours.push({ lat: it.lat, lng: it.lng, name: it.name, rating: it.rating, reviewCount: it.reviewCount }); continue; }
    let best = "";
    let bd = Infinity;
    for (const f of feats) {
      const d = (f.lat - it.lat) ** 2 + (f.lng - it.lng) ** 2;
      if (d < bd) { bd = d; best = f.cd; }
    }
    if (best) addTo(best, it.kind, it);
  }
  // 투어 = 지역단위 프로그램. 권역 좌표 → 가장 가까운 '콘텐츠 보유 동(지역 허브)'에 가산해 허브를 강화(빈 동 오귀속 방지).
  const hubs = [...m.keys()].map((cd) => { const f = feats.find((x) => x.cd === cd)!; return { cd, lat: f.lat, lng: f.lng }; });
  for (const t of tours) {
    let best = "";
    let bd = Infinity;
    for (const h of hubs) {
      const d = (h.lat - t.lat) ** 2 + (h.lng - t.lng) ** 2;
      if (d < bd) { bd = d; best = h.cd; }
    }
    if (best) addTo(best, "tour", t); // 콘텐츠 동이 전혀 없으면 드롭(blanket 금지)
  }
  return (_byAdm = m);
}

/** 행정동(adm_cd2)에 등록된 플래그테일 공급(공간·프로그램). 없으면 null. */
export function supplyFor(admCd2?: string | null): Supply | null {
  return admCd2 ? build().get(admCd2) ?? null : null;
}

/** 등록 콘텐츠 밀도·관심 → 매력도 가산점(0~10). 등록이 늘수록↑(로그·캡). */
export function supplyBoost(admCd2?: string | null): number {
  const s = supplyFor(admCd2);
  if (!s || s.count === 0) return 0;
  const eng = s.reviews > 0 ? Math.min(2.5, Math.log10(s.reviews + 1)) : 0;
  return Math.round(Math.min(10, s.count * 1.5 + eng) * 10) / 10;
}

/** 종류별 개수를 보기 좋게: "매장 5 · 스테이 2 · 투어 1" */
export function supplyBreakdown(s: Supply): string {
  return Object.entries(s.kinds)
    .map(([k, n]) => `${KIND_LABEL[k] ?? k} ${n}`)
    .join(" · ");
}
