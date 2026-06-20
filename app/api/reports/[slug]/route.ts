import { NextRequest, NextResponse } from "next/server";
import { getReport } from "@/lib/data";

// 스펙 §13: GET /api/reports/[slug] → {report, pdfUrl?(entitled)}
export function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const report = getReport(params.slug);
  if (!report) return NextResponse.json({ error: "not_found" }, { status: 404 });
  // 서버 PDF는 Phase 3 Playwright 렌더로 생성(현재 목업). 권한자에 한해 pdfUrl 노출.
  return NextResponse.json({ report, pdfUrl: null });
}
