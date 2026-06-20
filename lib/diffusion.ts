// 확산 경로 예측 (Spatial Diffusion) — 모듈 A. ★예측 상품의 핵심.
// 상권은 고정되지 않고 흐른다: 성수 → 뚝섬·서울숲 → 송정동, 연남 → 연희·망원.
//   · 인접 동(같은 시도 + 중심 2.8km 이내) 그래프에서
//   · '확산 원천'(고모멘텀 인접 핫동)과 '다음 확장 후보'(저평가·잠재·태동 + 핫동 인접) 산출.
//   ⚠ 인접 동 점수는 지도용 '샘플' — 실확산 예측은 실데이터 bulk 인제스트 후 정밀화(현재 메커니즘 시연).
import { loadDistricts, loadScores } from "@/lib/data";

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
function distM(lng1: number, lat1: number, lng2: number, lat2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export interface DiffusionNode {
  admCd2: string;
  name: string;
  sigungu: string;
  klai: number;
  momentum: number;
  gentriStage: number;
  distM: number;
}
export interface DiffusionResult {
  selfMomentum: number;
  selfRole: "source" | "candidate" | "stable"; // 이 동의 역할: 확산 원천 / 확장 후보 / 정체
  sources: DiffusionNode[]; // 인접 핫 동(이 동 주변에서 뜨는 곳 = 확산 압력)
  candidates: (DiffusionNode & { readiness: number })[]; // 다음 확장 후보 동 Top N
  note: string;
}

export function diffusionFor(admCd2: string): DiffusionResult | null {
  const feats = loadDistricts().features;
  const self = feats.find((f) => f.properties.admCd2 === admCd2);
  if (!self) return null;
  const byPlace = loadScores().byPlace;
  const selfScore = byPlace[admCd2]?.at(-1);
  const { centroidLng: slng, centroidLat: slat, sido } = self.properties;

  const neighbors: DiffusionNode[] = [];
  for (const f of feats) {
    const p = f.properties;
    if (p.admCd2 === admCd2 || p.sido !== sido) continue; // 같은 시도(인접 근사)
    const d = distM(slng, slat, p.centroidLng, p.centroidLat);
    if (d > 2800) continue; // 중심 2.8km 이내 = 도보·1정거장권 근사
    const sc = byPlace[p.admCd2]?.at(-1);
    if (!sc) continue;
    neighbors.push({ admCd2: p.admCd2, name: p.name, sigungu: p.sigungu, klai: sc.klai, momentum: sc.momentum, gentriStage: sc.gentriStage, distM: Math.round(d) });
  }

  // 확산 원천 — 인접 동 중 모멘텀 높은(상승) 핫플
  const sources = neighbors.filter((n) => n.momentum >= 3).sort((a, b) => b.momentum - a.momentum).slice(0, 4);
  const hotNear = sources.length > 0 || (selfScore?.momentum ?? 0) >= 3;

  // 다음 확장 후보 — 저평가(KLAI<58) + 잠재/태동(젠트리 0~1) + 모멘텀·근접·핫동인접
  const candidates = neighbors
    .filter((n) => n.klai < 58 && n.gentriStage <= 1)
    .map((n) => {
      const cheap = clamp(58 - n.klai, 0, 40); // 저평가 여지
      const ready = n.gentriStage === 1 ? 16 : 6; // 태동 > 잠재
      const mom = clamp(n.momentum * 3, -10, 18);
      const prox = clamp(20 - n.distM / 150, 0, 20);
      const readiness = Math.round(clamp(cheap * 0.7 + ready + mom + prox + (hotNear ? 10 : 0), 0, 100));
      return { ...n, readiness };
    })
    .sort((a, b) => b.readiness - a.readiness)
    .slice(0, 5);

  const sm = selfScore?.momentum ?? 0;
  const selfRole: DiffusionResult["selfRole"] =
    sm >= 4 ? "source" : selfScore && selfScore.klai < 58 && selfScore.gentriStage <= 1 && (sm > 0 || sources.length > 0) ? "candidate" : "stable";

  const note =
    selfRole === "source"
      ? `이 동(모멘텀 ${sm > 0 ? "+" : ""}${sm})이 확산 원천 — 인근 ${candidates.length}곳으로 활력이 번질 가능성.`
      : selfRole === "candidate"
        ? `이 동은 인접 핫플(${sources[0]?.name ?? "주변"})의 확산 수혜 후보 — 저평가·잠재 요건 보유.`
        : sources.length
          ? `이 동은 정체이나 인접 ${sources[0].name}(모멘텀 +${sources[0].momentum})이 상승 — 확산 파급 주시.`
          : `인접권에 뚜렷한 확산 원천 없음 — 자체 점화 필요.`;

  return { selfMomentum: sm, selfRole, sources, candidates, note };
}
