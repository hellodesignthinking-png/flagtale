import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { Button, Panel, Pill, SectionHead } from "@/components/ui";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { ProfileEditor } from "@/components/auth/ProfileEditor";
import { PlanSwitcher } from "@/components/account/PlanSwitcher";
import { GameSummary } from "@/components/account/GameSummary";
import { getUser } from "@/lib/supabase/server";
import { isSupabaseEnabled } from "@/lib/config";
import { normalizePlan, FREE_MODE } from "@/lib/tier";

export const metadata: Metadata = { title: "계정" };
export const dynamic = "force-dynamic"; // 세션 쿠키 기반 사용자 조회

interface Purchase { paymentId?: string; plan?: string | null; credits?: number | null; admCd2?: string | null; at?: string }

export default async function AccountPage() {
  const user = await getUser();
  const loggedIn = !!user;
  const email = user?.email ?? (isSupabaseEnabled ? "—" : "demo@flagtale.app");
  const joined = user?.created_at ? user.created_at.slice(0, 10) : "2026-06-19";
  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const credits = Number(meta.ft_credits) || 0;
  const plan = typeof meta.ft_plan === "string" ? meta.ft_plan : "free";
  const planLabel = plan === "pro" ? "Pro" : plan === "free" ? "Free" : plan;
  const purchases = (Array.isArray(meta.ft_purchases) ? meta.ft_purchases : []) as Purchase[];
  const name = (typeof meta.ft_name === "string" && meta.ft_name) || (email.includes("@") ? email.split("@")[0] : "");
  const favsN = Array.isArray(meta.ft_favs) ? meta.ft_favs.length : 0;
  const recentN = Array.isArray(meta.ft_recent) ? meta.ft_recent.length : 0;
  const cap = Math.max(5, credits);

  if (isSupabaseEnabled && !loggedIn) {
    return (
      <PageShell width="narrow">
        <div className="mb-6">
          <span className="klai-eyebrow">Account</span>
          <h1 className="mt-1 font-display text-[clamp(28px,4vw,38px)] font-black leading-[1.06] tracking-[-0.03em]">내 계정</h1>
        </div>
        <Panel>
          <div className="py-6 text-center">
            <div className="text-3xl">🔐</div>
            <p className="mt-2 text-[14px] text-muted">로그인이 필요합니다.</p>
            <div className="mt-4"><Button href="/auth" variant="primary">로그인 · 회원가입 →</Button></div>
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
          <h1 className="mt-1 font-display text-[clamp(28px,4vw,38px)] font-black leading-[1.06] tracking-[-0.03em]">{name ? `${name} 님` : "내 계정"}</h1>
          <p className="mt-1 text-[13px] text-muted">{loggedIn ? "Supabase Auth 로그인됨 · 기기 간 동기화" : "데모 계정 · Supabase 키 연동 시 실제 회원 활성화"}</p>
        </div>
        {loggedIn ? <LogoutButton /> : <Button href="/auth" variant="primary">로그인 →</Button>}
      </div>

      {/* 플랜 히어로 — 실데이터(user_metadata) */}
      <div className="mb-5 overflow-hidden rounded-[24px] border-[1.5px] border-line bg-gradient-to-br from-blue/10 via-card2/40 to-amber/10 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-[16px] text-2xl" style={{ background: "color-mix(in srgb, var(--blue-l) 16%, transparent)", border: "1px solid color-mix(in srgb, var(--blue-l) 45%, transparent)" }}>🗺️</span>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted2">현재 플랜</div>
              <div className="font-display text-2xl font-black tracking-[-0.03em] text-ink">{planLabel}</div>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <div className="text-center">
              <div className="text-[11px] text-muted2">크레딧</div>
              <div className="text-2xl font-black tabular-nums text-amber">{credits}</div>
            </div>
            <div className="text-center">
              <div className="text-[11px] text-muted2">구독</div>
              <div className="text-lg font-black text-muted">{plan !== "free" ? planLabel : "없음"}</div>
            </div>
            <Button href="/pricing" variant="amber">{plan !== "free" ? "관리 →" : "업그레이드 →"}</Button>
          </div>
        </div>
        <div className="mt-4 border-t border-line/60 pt-3">
          <div className="mb-1 flex items-center justify-between text-[11px] text-muted2">
            <span>크레딧 잔량</span><span>{credits} / {cap}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-navy2/60">
            <div className="h-full rounded-full" style={{ width: `${cap ? Math.min(100, (credits / cap) * 100) : 0}%`, background: "var(--amber)" }} />
          </div>
        </div>
      </div>

      {isSupabaseEnabled && !FREE_MODE && <div className="mt-4"><PlanSwitcher current={normalizePlan(plan)} /></div>}

      <div className="mt-4"><GameSummary /></div>

      {/* 내 활동 (계정 동기화) */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        <Link href="/map-tale" className="lift rounded-2xl border-[1.5px] border-line bg-card2/50 p-4 text-center">
          <div className="font-display text-2xl font-black tabular-nums text-[#e11d48]">{favsN}</div>
          <div className="mt-1 text-[12px] font-bold text-muted2">♥ 즐겨찾기</div>
        </Link>
        <Link href="/map-tale" className="lift rounded-2xl border-[1.5px] border-line bg-card2/50 p-4 text-center">
          <div className="font-display text-2xl font-black tabular-nums text-blue-l">{recentN}</div>
          <div className="mt-1 text-[12px] font-bold text-muted2">🕘 최근 본</div>
        </Link>
        <Link href="/diagnose" className="lift rounded-2xl border-[1.5px] border-line bg-card2/50 p-4 text-center">
          <div className="font-display text-2xl font-black tabular-nums text-grade-b">{purchases.length}</div>
          <div className="mt-1 text-[12px] font-bold text-muted2">🧾 구매</div>
        </Link>
      </div>

      <Panel className="mb-5">
        <SectionHead title="프로필" />
        <div className="space-y-2 text-[13px]">
          {loggedIn && (
            <div className="rounded-xl border-[1.5px] border-line bg-card2 px-3 py-2.5">
              <div className="mb-1.5 text-[11px] font-bold text-muted2">표시 이름</div>
              <ProfileEditor initial={name} />
            </div>
          )}
          <Row label="이메일" value={email} />
          <Row label="가입" value={joined} />
          <Row label="권한" value={<Pill tone={plan !== "free" ? "amber" : "muted"}>{planLabel}</Pill>} />
        </div>
      </Panel>

      <Panel>
        <SectionHead title="구매 내역" desc={purchases.length ? `${purchases.length}건` : undefined} />
        {purchases.length === 0 ? (
          <div className="rounded-xl border-[1.5px] border-line bg-card2 px-3 py-6 text-center text-[13px] text-muted2">
            구매 내역이 없습니다. <Link href="/diagnose" className="text-blue-l hover:underline">지번 진단</Link>으로 시작하세요.
          </div>
        ) : (
          <div className="space-y-1.5">
            {[...purchases].reverse().map((pc, i) => (
              <div key={pc.paymentId ?? i} className="flex items-center gap-3 rounded-xl border-[1.5px] border-line bg-card2 px-3 py-2.5 text-[13px]">
                <span className="text-[16px]">{pc.plan ? "⭐" : "🧾"}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-ink">{pc.plan ? `${pc.plan} 구독` : pc.credits ? `크레딧 ${pc.credits} 적립` : "지번 진단"}</div>
                  <div className="truncate text-[11px] text-muted2">{pc.at ? pc.at.slice(0, 10) : ""}{pc.admCd2 ? ` · ${pc.admCd2}` : ""}</div>
                </div>
                {pc.admCd2 ? <Link href={`/place/${pc.admCd2}`} className="shrink-0 text-[12px] font-bold text-blue-l hover:underline">보기 →</Link> : null}
              </div>
            ))}
          </div>
        )}
      </Panel>
    </PageShell>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-xl border-[1.5px] border-line bg-card2 px-3 py-2.5">
      <span className="text-muted2">{label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </div>
  );
}
