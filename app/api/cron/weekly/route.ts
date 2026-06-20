import { NextRequest, NextResponse } from "next/server";
import { loadReports } from "@/lib/data";
import { sendWeeklyReport } from "@/lib/email/resend";

// 스펙 §13: GET /api/cron/weekly → Flagtale Weekly 발행 (보호된 cron)
// 키 있으면 Resend 로 발송, 없으면 목업. (PDF 는 /api/reports/[slug]/pdf 서버 렌더)
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET || "dev-cron-secret-change-me";
  const auth = req.headers.get("authorization");
  const qs = req.nextUrl.searchParams.get("secret");
  const ok = auth === `Bearer ${secret}` || qs === secret;
  if (!ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const latestWeekly = loadReports()
    .filter((r) => r.kind === "weekly")
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))[0];

  if (!latestWeekly) return NextResponse.json({ ok: false, error: "no_report" });

  // 구독자 목록은 실서비스에서 Supabase 에서 조회. 여기선 데모 수신자.
  const recipients = (process.env.WEEKLY_RECIPIENTS ?? "").split(",").filter(Boolean);
  const sent = await sendWeeklyReport(latestWeekly, recipients);

  return NextResponse.json({
    ok: true,
    generated: latestWeekly.slug,
    email: sent,
    message: sent.mock
      ? "주간 리포트 발행(목업). RESEND_API_KEY 설정 시 실제 발송됩니다."
      : "주간 리포트 발송 완료.",
  });
}
