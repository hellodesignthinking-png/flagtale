import { Resend } from "resend";
import type { Report } from "@/lib/types";

/** Resend 이메일 — 주간 리포트 발송 (스펙 §10.1). 키 없으면 목업. */
export function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export async function sendWeeklyReport(report: Report, recipients: string[]) {
  const resend = getResend();
  const from = process.env.RESEND_FROM ?? "KLAI <noreply@klai.local>";
  const html = `
    <div style="font-family:Pretendard,system-ui,sans-serif;background:#0b1b30;color:#eaf1fa;padding:24px;border-radius:12px">
      <div style="color:#d4861e;font-weight:700;letter-spacing:.1em;font-size:12px">FLAGTALE WEEKLY</div>
      <h1 style="margin:6px 0;font-size:22px">${report.title}</h1>
      <p style="color:#92a8c6;font-size:14px">${report.summary}</p>
      <a href="https://klai.local/reports/${report.slug}" style="display:inline-block;margin-top:12px;background:#d4861e;color:#ffffff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:700">웹진 열람 →</a>
    </div>`;

  if (!resend) {
    return { ok: true, mock: true, would_send_to: recipients.length, slug: report.slug };
  }
  const { data, error } = await resend.emails.send({
    from,
    to: recipients,
    subject: `[KLAI] ${report.title}`,
    html,
  });
  if (error) return { ok: false, error: String(error) };
  return { ok: true, id: data?.id };
}
