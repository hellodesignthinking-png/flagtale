import { NextRequest, NextResponse } from "next/server";
import { loadReports } from "@/lib/data";

// 스펙 §13: GET /api/reports?kind=&period= → Report[]
export function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const kind = sp.get("kind");
  let reports = loadReports();
  if (kind) reports = reports.filter((r) => r.kind === kind);
  reports = [...reports].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
  return NextResponse.json(reports.map(({ blocks, ...meta }) => meta));
}
