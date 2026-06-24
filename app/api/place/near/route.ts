import { NextRequest, NextResponse } from "next/server";
import { loadDistricts, getPlace, getPeerAvg, nationalSignalAverage, loadScores } from "@/lib/data";
import { supplyFor, supplyBoost } from "@/lib/supply";
import { gradeOf } from "@/lib/scoring";
import { narrativeForPlace } from "@/lib/narratives";
import { instagramFor, buzzBoost } from "@/lib/connectors/instagram";

// 좌표 → 가장 가까운 행정동(중심좌표 기준) → 매력도 번들. 플래그맵 스팟의 '매력도 분석' 탭용.
export function GET(req: NextRequest) {
  const lat = parseFloat(req.nextUrl.searchParams.get("lat") || "");
  const lng = parseFloat(req.nextUrl.searchParams.get("lng") || "");
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const feats = loadDistricts().features;
  const cos = Math.cos((lat * Math.PI) / 180); // 경도 보정
  let bestCd: string | null = null, bestD = Infinity;
  for (const f of feats) {
    const p = f.properties;
    if (typeof p.centroidLat !== "number" || typeof p.centroidLng !== "number") continue;
    const dLat = p.centroidLat - lat, dLng = (p.centroidLng - lng) * cos;
    const d = dLat * dLat + dLng * dLng;
    if (d < bestD) { bestD = d; bestCd = p.admCd2; }
  }
  if (!bestCd) return NextResponse.json({ error: "no_district" }, { status: 404 });
  const bundle = getPlace(bestCd);
  if (!bundle?.latest) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const matchedKm = Math.round(Math.sqrt(bestD) * 111 * 10) / 10;
  const peerAvg = getPeerAvg(bundle.props.typology ?? "");      // 또래(유형) 평균 4축
  const periods = loadScores().periods;                          // 시그널 차트 기간축
  const avgSignals = nationalSignalAverage();                    // 전국 평균 시그널(비교 오버레이)
  // 공급(등록 콘텐츠) + 수요(인스타 검색량) 가산 — /place와 동일하게 매력도에 반영
  const sBoost = supplyBoost(bestCd);
  const narr = narrativeForPlace(bestCd);
  const bBoost = buzzBoost(narr ? instagramFor(narr.name)?.postsCount : null);
  const total = Math.round((sBoost + bBoost) * 10) / 10;
  const latest = total ? { ...bundle.latest, klai: Math.min(100, Math.round((bundle.latest.klai + total) * 10) / 10), grade: gradeOf(bundle.latest.klai + total) } : bundle.latest;
  return NextResponse.json({ ...bundle, latest, supply: supplyFor(bestCd), supplyBoost: sBoost, buzzBoost: bBoost, matchedKm, peerAvg, periods, avgSignals }, { headers: { "cache-control": "public, max-age=60, s-maxage=300" } });
}
