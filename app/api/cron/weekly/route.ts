import { NextRequest, NextResponse } from "next/server";
import { computeWeekly, isoWeekOf } from "@/lib/weekly";
import { sendWeeklyReport } from "@/lib/email/resend";

export const dynamic = "force-dynamic";

// 스펙 §13: GET /api/cron/weekly → Flagtale Weekly 발행 (보호된 cron, 매주 월요일 vercel.json crons)
// 현재 ISO 주차 리포트를 데이터에서 '자동 생성'해 발행. Resend 키 있으면 발송, 없으면 목업.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET || "dev-cron-secret-change-me";
  const auth = req.headers.get("authorization");
  const qs = req.nextUrl.searchParams.get("secret");
  const ok = auth === `Bearer ${secret}` || qs === secret;
  if (!ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  // 이번 주차 리포트 자동 생성
  const { year, week } = isoWeekOf(new Date());
  const weekly = computeWeekly(year, week);

  // 구독자 목록은 실서비스에서 Supabase 에서 조회. 여기선 데모 수신자(WEEKLY_RECIPIENTS).
  const recipients = (process.env.WEEKLY_RECIPIENTS ?? "").split(",").filter(Boolean);
  const sent = await sendWeeklyReport(weekly, recipients);

  return NextResponse.json({
    ok: true,
    generated: weekly.slug,
    period: weekly.period,
    publishedAt: weekly.publishedAt,
    email: sent,
    message: sent.mock
      ? `${weekly.period} 주간 리포트 자동 발행(목업). RESEND_API_KEY 설정 시 실제 발송됩니다.`
      : `${weekly.period} 주간 리포트 발송 완료.`,
  });
}
