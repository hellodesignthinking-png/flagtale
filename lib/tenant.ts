// 업종 다양성 처방 (Tenant Matching) — 모듈 D.
// "이 골목에 어떤 업종이 들어와야 다양성이 유지되고 카페 도배(공멸)를 막는가."
//   · 소진공 업종 대분류 분포(sangga.byLarge) vs 건강한 골목 참조 비중 → 부족 업종 gap
//   · 음식·카페 과다 여부 + 추천 Top3 + 기대 다양성 개선
import type { SanggaStats } from "@/lib/connectors/sangga";

// 활력 골목의 참조 비중(대분류 %) — 음식 일변도가 아닌 다양·콘텐츠형.
const TARGET: Record<string, number> = {
  음식: 28,
  소매: 20,
  "예술·스포츠": 11,
  교육: 9,
  보건의료: 8,
  숙박: 5,
};
const WHY: Record<string, string> = {
  "예술·스포츠": "갤러리·공방·스튜디오 — 문화 앵커, 체류시간↑",
  교육: "공방·클래스·작업실 — 로컬크리에이터 유입 기반",
  소매: "편집숍·로컬브랜드 — 카페 일변도 탈피, 객단가↑",
  보건의료: "웰니스·생활밀착 — 주민 재방문·정주",
  숙박: "스테이·게스트하우스 — 외부 체류·유입",
};

export interface TenantRx {
  foodCafeRatio: number;
  overConcentrated: boolean; // 음식·카페 과다(>45%) = 공멸 위험
  diversity: number;
  topCategory: string; // 현재 최다 대분류
  gaps: { name: string; share: number; target: number; gap: number; why: string }[]; // 추천 업종 Top3
  expectedDiversityGain: number; // 부족 업종 보강 시 기대 다양성 개선폭(추정)
  note: string;
}

export function prescribeTenants(sangga: SanggaStats | null): TenantRx | null {
  if (!sangga || !sangga.byLarge?.length) return null;
  const total = sangga.byLarge.reduce((s, b) => s + b.count, 0) || 1;
  const shares = Object.fromEntries(sangga.byLarge.map((b) => [b.name, (b.count / total) * 100]));
  const topCategory = sangga.byLarge[0]?.name ?? "";

  const gaps = Object.entries(TARGET)
    .map(([name, target]) => {
      const share = Math.round((shares[name] ?? 0) * 10) / 10;
      return { name, share, target, gap: Math.round((target - share) * 10) / 10, why: WHY[name] ?? "" };
    })
    .filter((g) => g.gap > 3 && g.why) // 의미있는 부족 + 처방 가능 카테고리만
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 3);

  const overConcentrated = sangga.foodCafeRatio > 45;
  // 기대 다양성 개선 — 부족분 절반을 채운다고 가정한 근사(상한 +12)
  const expectedDiversityGain = Math.min(12, Math.round(gaps.reduce((s, g) => s + g.gap, 0) * 0.25));

  const note = overConcentrated
    ? `음식·카페 ${sangga.foodCafeRatio}%로 과집중 — 카페 도배(공멸) 위험. 아래 업종 보강으로 다양성·체류를 회복.`
    : gaps.length
      ? `다양성 ${sangga.diversity}/100. 아래 업종이 부족 — 보강 시 앵커력·다양성 개선.`
      : `업종 구성 비교적 균형(다양성 ${sangga.diversity}). 현 다양성 유지 권장.`;

  return { foodCafeRatio: sangga.foodCafeRatio, overConcentrated, diversity: sangga.diversity, topCategory, gaps, expectedDiversityGain, note };
}
