"use client";

import Link from "next/link";
import { PLAN_EMOJI, PLAN_LABEL, FEATURE_MIN, type Feature } from "@/lib/tier";

// 등급 잠금 카드 — Free/Pro 사용자가 상위 기능을 만났을 때 업셀.
export function ProLock({ feature, title, desc }: { feature: Feature; title: string; desc: string }) {
  const need = FEATURE_MIN[feature];
  return (
    <div className="rounded-[14px] border-[1.5px] border-dashed border-line bg-card2/40 p-4 text-center">
      <div className="text-[22px] leading-none">🔒</div>
      <div className="mt-1.5 text-[12.5px] font-extrabold text-ink">{title}</div>
      <p className="mx-auto mt-1 max-w-[230px] text-[11px] leading-relaxed text-muted2">{desc}</p>
      <Link href="/pricing" className="btn-glow mt-2.5 inline-flex items-center gap-1 rounded-full bg-amber px-3.5 py-1.5 text-[11.5px] font-extrabold text-onaccent">
        {PLAN_EMOJI[need]} {PLAN_LABEL[need]}로 업그레이드 →
      </Link>
    </div>
  );
}
