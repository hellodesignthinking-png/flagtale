import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { Button, Panel, Pill, SectionHead, Stat } from "@/components/ui";

export const metadata: Metadata = { title: "계정" };

export default function AccountPage() {
  return (
    <PageShell width="narrow">
      <div className="mb-6">
        <span className="klai-eyebrow">Account</span>
        <h1 className="mt-1 text-3xl font-black">내 계정</h1>
        <p className="mt-1 text-[13px] text-muted">목업 데모 계정 · 실서비스는 Supabase Auth 연동</p>
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
        {/* 크레딧 사용 게이지 (데모) */}
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
          <Row label="이메일" value="demo@klai.local" />
          <Row label="가입" value="2026-06-19" />
          <Row label="권한" value={<Pill tone="muted">free</Pill>} />
        </div>
      </Panel>

      <Panel>
        <SectionHead title="구매 내역" desc="ReportPurchase" />
        <div className="rounded-lg border border-line bg-card2 px-3 py-6 text-center text-[13px] text-muted2">
          구매 내역이 없습니다. <a href="/diagnose" className="text-blue-l hover:underline">지번 진단</a>으로 시작하세요.
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
