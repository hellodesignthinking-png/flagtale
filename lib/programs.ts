// 정부 지역활성화 사업 지정 매칭 — 청년마을·문화도시 등(data/programs.json).
//   지정 시군구 = 정책 투자·활력 신호 → 실측 매력도 가산 + /place 배지.
import "server-only";
import fs from "node:fs";
import path from "node:path";
import { loadDistricts } from "./data";

interface ProgramDef { label: string; agency: string; desc: string; regions: string[] }
interface ProgramsFile { programs: Record<string, ProgramDef> }

let _programs: ProgramsFile | null | undefined;
function load(): ProgramsFile | null {
  if (_programs !== undefined) return _programs;
  try {
    return (_programs = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "programs.json"), "utf-8")) as ProgramsFile);
  } catch {
    return (_programs = null);
  }
}

// admCd2 → "sido sigungu" 문자열(토큰 매칭용)
let _region: Record<string, string> | null = null;
function regionOf(admCd2: string): string {
  if (!_region) {
    _region = {};
    for (const f of loadDistricts().features) { const p = f.properties; _region[p.admCd2] = `${p.sido} ${p.sigungu}`; }
  }
  return _region[admCd2] ?? "";
}

export interface ProgramHit { key: string; label: string; agency: string; desc: string }

/** 이 동의 시군구를 지정한 정부 사업(청년마을·문화도시 등). 토큰 전부 포함 매칭(부산 동구 등 모호성 방지). */
export function programsFor(admCd2: string): ProgramHit[] {
  const pf = load();
  if (!pf) return [];
  const region = regionOf(admCd2);
  if (!region) return [];
  const hits: ProgramHit[] = [];
  for (const [key, def] of Object.entries(pf.programs)) {
    const matched = def.regions.some((r) => r.split(" ").every((tok) => region.includes(tok)));
    if (matched) hits.push({ key, label: def.label, agency: def.agency, desc: def.desc });
  }
  return hits;
}

/** 정책 사업 지정 가산점 — 지정 사업 수 × 4, 최대 +8 (실측 매력도 보정) */
export function policyBoost(admCd2: string): number {
  return Math.min(programsFor(admCd2).length * 4, 8);
}
