import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { Button, Panel, Pill, SectionHead } from "@/components/ui";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { getUser } from "@/lib/supabase/server";
import { isSupabaseEnabled } from "@/lib/config";

export const metadata: Metadata = { title: "계정" };
export const dynamic = "force-dynamic"; // 세션 쿠키 기반 사용자 조회

export default async function AccountPage() {
  const user = await getUser(); // Supabase 키 있을 때만 실제 사용자
  const loggedIn = !!user;
  const email = user?.email ?? (isSupabaseEnabled ? "—" : "demo@klai.local");
  const joined = user?.created_at ? user.created_at.slice(0, 10) : "2026-06-19";

  // Supabase 연동됐는데 비로그인 → 로그인/회원가입 유도
  if (isSupabaseEnabled && !loggedIn) {
    return (
      <PageShell width="narrow">
        <div className="mb-6">
          <span className="klai-eyebrow">Account</span>
          <h1 className="mt-1 text-3xl font-black">내 계정</h1>
        </div>
        <Panel>
          <div className="py-6 text-center">
            <div className="text-3xl">🔐</div>
            <p className="mt-2 text-[14px] text-muted">로그인이 필요합니다.</p>
            <div className="mt-4">
              <Button href="/auth" variant="primary">로그인 · 회원가입 →</Button>
            </div>
          </div>
        </Panel>
      </PageShell>
    );
  }

  return (
    <PageShell width="narrow">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <span className="klai-eyebrow">Account</span>
          <h1 className="mt-1 text-3xl font-black">내 계정</h1>
          <p className="mt-1 text-[13px] text-muted">
            {loggedIn ? "Supabase Auth 로그인됨" : "데모 계정 · Supabase 키 연동 시 실제 회원 활성화"}
          </p>
        </div>
        {loggedIn ? <LogoutButton /> : <Button href="/auth" variant="primary">로그인 →</Button>}
      </div>

      {/* 플랜 히어로 */}
      <div className="mb-5 overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-blue/10 via-card2/40 to-amber/10 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="grid h-12 w-12 place-items-center rounded-xl text-2xl"
              style={{ background: "color-mix(in srgb, var(--blue-l) 16%, transparent)", border: "1px solid color-mix(in srgb, var(--blue-l) 45%, transparent)" }}
            >
              🗺️
            </span>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted2">현재 플랜</div>
              <div className="text-2xl font-black text-ink">Free</div>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <div className="text-center">
              <div className="text-[11px] text-muted2">크레딧</div>
              <div className="text-2xl font-black tabular-nums text-amber">0</div>
            </div>
            <div className="text-center">
              <div className="text-[11px] text-muted2">구독</div>
              <div className="text-lg font-black text-muted">없음</div>
            </div>
            <Button href="/pricing" variant="amber">
              업그레이드 →
            </Button>
          </div>
        </div>
        <div className="mt-4 border-t border-line/60 pt-3">
          <div className="mb-1 flex items-center justify-between text-[11px] text-muted2">
            <span>크레딧 잔량</span>
            <span>0 / 5</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-navy2/60">
            <div className="h-full rounded-full" style={{ width: "0%", background: "var(--amber)" }} />
          </div>
        </div>
      </div>

      <Panel className="mb-5">
        <SectionHead title="프로필" />
        <div className="space-y-2 text-[13px]">
          <Row label="이메일" value={email} />
          <Row label="가입" value={joined} />
          <Row label="권한" value={<Pill tone="muted">free</Pill>} />
        </div>
      </Panel>

      <Panel>
        <SectionHead title="구매 내역" desc="ReportPurchase" />
        <div className="rounded-lg border border-line bg-card2 px-3 py-6 text-center text-[13px] text-muted2">
          구매 내역이 없습니다. <Link href="/diagnose" className="text-blue-l hover:underline">지번 진단</Link>으로 시작하세요.
        </div>
      </Panel>
    </PageShell>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-line bg-card2 px-3 py-2.5">
      <span className="text-muted2">{label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </div>
  );
}
