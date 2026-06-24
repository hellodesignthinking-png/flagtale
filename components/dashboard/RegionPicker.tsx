"use client";

import Link from "next/link";
import { useState } from "react";

// 관할 시군구 선택 — 검색형 컴팩트(이전: ~150칩 그리드가 화면 과점)
export function RegionPicker({ regions, active }: { regions: string[]; active: string }) {
  const [q, setQ] = useState("");
  const shown = q ? regions.filter((r) => r.includes(q)) : regions;
  const chip = (label: string, href: string, on: boolean) => (
    <Link key={href} href={href} className={`shrink-0 rounded-full px-3 py-1.5 text-[12.5px] font-bold transition-colors ${on ? "btn-glow bg-amber text-onaccent" : "border-[1.5px] border-line bg-card text-muted hover:border-ink hover:text-ink"}`}>{label}</Link>
  );
  return (
    <div className="w-full sm:max-w-[440px]">
      <div className="mb-2 flex items-center gap-2 rounded-full border-[1.5px] border-line bg-card px-3 py-2">
        <span className="text-[13px] text-muted2">🔍</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="관할 지역 검색" placeholder={`관할 검색 · 시군구 ${regions.length}곳`} className="min-w-0 flex-1 bg-transparent text-[13px] font-semibold text-ink placeholder:text-muted2 focus:outline-none" />
        {q ? <button onClick={() => setQ("")} className="text-[12px] text-muted2 hover:text-ink">✕</button> : null}
      </div>
      <div className="flex max-h-[92px] flex-wrap gap-1.5 overflow-y-auto pr-1">
        {chip("전체", "/dashboard", !active)}
        {shown.map((r) => chip(r, `/dashboard?region=${encodeURIComponent(r)}`, active === r))}
        {shown.length === 0 && <span className="px-2 py-1.5 text-[12px] text-muted2">검색 결과 없음</span>}
      </div>
    </div>
  );
}
