import { buildMapItems } from "./flagtale";
import { loadDistricts } from "./data";
import { narrativeForPlace } from "./narratives";
import { instagramFor, buzzBoost } from "./connectors/instagram";

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
  const addTo = (cd: string, kind: string, it: { name: string; rating?: number; reviewCount?: number }) => {
    const s = m.get(cd) ?? { count: 0, kinds: {}, reviews: 0, items: [] };
    s.count++;
    s.kinds[kind] = (s.kinds[kind] ?? 0) + 1;
    s.reviews += it.reviewCount ?? 0;
    if (s.items.length < 16) s.items.push({ name: it.name, kind: KIND_LABEL[kind] ?? kind, rating: it.rating });
    m.set(cd, s);
  };
  // 투어 포함 모든 등록 콘텐츠는 실좌표 기반(tours.json에 lat/lng 부여) → 최근접 행정동에 정확히 매핑.
  for (const it of buildMapItems()) {
    if (!it.lat || !it.lng) continue;
    let best = "";
    let bd = Infinity;
    for (const f of feats) {
      const d = (f.lat - it.lat) ** 2 + (f.lng - it.lng) ** 2;
      if (d < bd) { bd = d; best = f.cd; }
    }
    if (best) addTo(best, it.kind, it);
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

// 진정성 갭(authenticity gap) — 스펙 §5: 서사(검색 수요) vs 실제 상권(등록 공급)의 괴리.
//  수요≫공급 = 과열·거품 신호 / 공급≫수요 = 미발견 강세 / 균형 = 건강.
export interface AuthGap {
  verdict: "hype" | "balanced" | "hidden" | "none";
  supplyN: number; // 0~1 (등록 공급 정규화)
  demandN: number; // 0~1 (검색 수요 정규화)
  gap: number; // demandN - supplyN (-1~+1)
  label: string; // 짧은 라벨: 과열 / 균형 / 미발견 / —
  headline: string;
  desc: string;
  tone: "warn" | "ok" | "info";
}

/** supplyBoost(0~10) + buzzBoost(0~6)로 진정성 갭 진단. 둘 다 0이면 none. */
export function authenticityGap(supplyBoost: number, buzzBoost: number): AuthGap {
  const supplyN = Math.round(Math.min(supplyBoost / 10, 1) * 100) / 100;
  const demandN = Math.round(Math.min(buzzBoost / 6, 1) * 100) / 100;
  if (supplyN === 0 && demandN === 0)
    return { verdict: "none", supplyN, demandN, gap: 0, label: "—", headline: "", desc: "", tone: "info" };
  const gap = Math.round((demandN - supplyN) * 100) / 100;
  if (gap >= 0.3)
    return { verdict: "hype", supplyN, demandN, gap, label: "과열", headline: "과열·거품 주의",
      desc: "검색 관심(수요)이 등록된 로컬 콘텐츠(공급)를 크게 앞섭니다. 서사가 실체보다 빠른 과열·투기 신호이거나, 아직 로컬 콘텐츠가 채워지지 않은 단계일 수 있습니다.", tone: "warn" };
  if (gap <= -0.3)
    return { verdict: "hidden", supplyN, demandN, gap, label: "미발견", headline: "미발견 강세",
      desc: "등록된 로컬 콘텐츠(공급)가 검색 관심(수요)보다 많습니다. 아직 덜 알려진 저평가 강세 지역으로, 노출·홍보 시 성장 여력이 큽니다.", tone: "ok" };
  return { verdict: "balanced", supplyN, demandN, gap, label: "균형", headline: "균형 성장",
    desc: "검색 관심과 등록 콘텐츠가 균형을 이룹니다. 서사와 실체가 함께 가는 건강한 동반 성장 구간입니다.", tone: "ok" };
}

// 전국 진정성 갭 무버 — 과열(수요≫공급)·미발견(공급≫수요) 상위. 주간/연간 리포트 공용. 메모이즈.
export interface GapMoverRow {
  admCd2: string;
  name: string;
  sigungu: string;
  demandN: number;
  supplyN: number;
  gap: number;
}
let _gapAll: { hype: GapMoverRow[]; hidden: GapMoverRow[] } | null = null;
export function gapMovers(limit = 6): { hype: GapMoverRow[]; hidden: GapMoverRow[] } {
  if (!_gapAll) {
    const hype: GapMoverRow[] = [];
    const hidden: GapMoverRow[] = [];
    for (const f of loadDistricts().features) {
      const cd = f.properties.admCd2;
      const nb = narrativeForPlace(cd);
      const g = authenticityGap(supplyBoost(cd), buzzBoost(nb ? instagramFor(nb.name)?.postsCount : null));
      if (g.verdict === "none") continue;
      const row: GapMoverRow = { admCd2: cd, name: f.properties.name, sigungu: f.properties.sigungu, demandN: g.demandN, supplyN: g.supplyN, gap: g.gap };
      if (g.verdict === "hype") hype.push(row);
      else if (g.verdict === "hidden") hidden.push(row);
    }
    hype.sort((a, b) => b.gap - a.gap);
    hidden.sort((a, b) => a.gap - b.gap);
    _gapAll = { hype, hidden };
  }
  return { hype: _gapAll.hype.slice(0, limit), hidden: _gapAll.hidden.slice(0, limit) };
}

/** 종류별 개수를 보기 좋게: "매장 5 · 스테이 2 · 투어 1" */
export function supplyBreakdown(s: Supply): string {
  return Object.entries(s.kinds)
    .map(([k, n]) => `${KIND_LABEL[k] ?? k} ${n}`)
    .join(" · ");
}
