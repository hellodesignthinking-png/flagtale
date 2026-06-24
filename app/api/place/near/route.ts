import { NextRequest, NextResponse } from "next/server";
import { loadDistricts, getPlace, getPeerAvg, nationalSignalAverage, loadScores } from "@/lib/data";

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
  return NextResponse.json({ ...bundle, matchedKm, peerAvg, periods, avgSignals }, { headers: { "cache-control": "public, max-age=60, s-maxage=300" } });
}
