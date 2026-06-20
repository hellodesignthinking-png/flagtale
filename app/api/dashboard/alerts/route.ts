import { NextRequest, NextResponse } from "next/server";
import { listPlaces, loadDiagnoses, loadScores } from "@/lib/data";

// 스펙 §13: GET /api/dashboard/alerts?region= → Alert[] (기관)
// 진단의 risks 를 동별 경보로 펼친다. region=sigungu 필터.
export function GET(req: NextRequest) {
  const region = req.nextUrl.searchParams.get("region");
  const places = listPlaces();
  const diags = loadDiagnoses();
  const scores = loadScores();

  const alerts = places.flatMap((p) => {
    if (region && p.sigungu !== region) return [];
    const d = diags[p.admCd2];
    if (!d) return [];
    const period = scores.byPlace[p.admCd2]?.at(-1)?.period ?? d.period;
    return d.risks.map((r) => ({
      admCd2: p.admCd2,
      name: p.name,
      sigungu: p.sigungu,
      typology: p.typology,
      type: r.type,
      severity: r.severity,
      message: `${r.title} — ${r.detail}`,
      period,
    }));
  });

  const order = { high: 0, mid: 1, low: 2 } as const;
  alerts.sort((a, b) => order[a.severity] - order[b.severity]);

  return NextResponse.json({ region: region ?? "전체", count: alerts.length, alerts });
}
