import { NextRequest, NextResponse } from "next/server";
import { getReport } from "@/lib/data";
import { computeWeekly, parseWeekSlug } from "@/lib/weekly";

// 스펙 §13: GET /api/reports/[slug] → {report, pdfUrl?(entitled)}
export function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const wk = parseWeekSlug(params.slug);
  const report = wk ? computeWeekly(wk.year, wk.week) : getReport(params.slug);
  if (!report) return NextResponse.json({ error: "not_found" }, { status: 404 });
  // 서버 PDF는 Phase 3 Playwright 렌더로 생성(현재 목업). 권한자에 한해 pdfUrl 노출.
  return NextResponse.json({ report, pdfUrl: null });
}
