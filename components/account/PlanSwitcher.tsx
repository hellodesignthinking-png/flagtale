"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PLAN_LABEL, PLAN_EMOJI, type Plan } from "@/lib/tier";

const PLANS: Plan[] = ["free", "pro", "org"];
const UNLOCKS: Record<Plan, string> = {
  free: "지도 · 동 요약",
  pro: "+ 시그널 · 전략 · choropleth",
  org: "+ 대시보드 · API",
};

// 데모용 등급 전환 — 결제(PortOne) 연동 전까지 등급별 화면을 바로 확인. ft_plan(user_metadata) 갱신.
export function PlanSwitcher({ current }: { current: Plan }) {
  const [plan, setPlan] = useState<Plan>(current);
  const [busy, setBusy] = useState(false);
  async function set(p: Plan) {
    const s = createClient();
    if (!s || p === plan) return;
    setBusy(true);
    const { error } = await s.auth.updateUser({ data: { ft_plan: p } });
    if (!error) { setPlan(p); setTimeout(() => location.reload(), 450); } else setBusy(false);
  }
  return (
    <div className="rounded-[16px] border-[1.5px] border-dashed border-amber/60 bg-amber/[0.06] p-4">
      <div className="flex items-center gap-2">
        <span className="text-[12.5px] font-extrabold text-ink">🧪 데모 · 등급 전환</span>
        <span className="rounded-full bg-amber/20 px-2 py-0.5 text-[10px] font-bold text-blue-l">결제 연동 시 자동</span>
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-muted2">실결제(PortOne) 전까지 데모로 등급별 화면(시그널·choropleth·대시보드·API)을 바로 확인하세요.</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {PLANS.map((p) => (
          <button key={p} onClick={() => set(p)} disabled={busy} className={`rounded-[12px] px-2 py-2.5 text-center transition-colors disabled:opacity-60 ${plan === p ? "bg-ink text-white" : "border-[1.5px] border-line bg-card text-ink hover:border-ink"}`}>
            <div className="text-[14px] font-black">{PLAN_EMOJI[p]} {PLAN_LABEL[p]}</div>
            <div className={`mt-0.5 text-[9.5px] font-semibold leading-tight ${plan === p ? "text-white/80" : "text-muted2"}`}>{UNLOCKS[p]}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
