import { NextRequest, NextResponse } from "next/server";
import { getPlace } from "@/lib/data";

// 스펙 §13: GET /api/place/[admCd] → {props, series, latest, diagnosisSummary}
export function GET(
  _req: NextRequest,
  { params }: { params: { admCd: string } }
) {
  const bundle = getPlace(params.admCd);
  if (!bundle) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json(bundle);
}
