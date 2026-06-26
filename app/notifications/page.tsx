import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { NotificationsClient } from "@/components/board/NotificationsClient";

export const metadata: Metadata = { title: "알림 — 내 글 활동" };

export default function NotificationsPage() {
  return (
    <PageShell width="narrow">
      <div className="mb-5">
        <span className="klai-eyebrow">🔔 알림 · Notifications</span>
        <h1 className="mt-1.5 font-display text-[clamp(24px,4vw,32px)] font-black tracking-[-0.03em] text-ink">알림</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">내 게시판 글에 달린 댓글을 모아 봅니다.</p>
      </div>
      <NotificationsClient />
    </PageShell>
  );
}
