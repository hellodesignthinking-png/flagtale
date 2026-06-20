"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { ProcurementAnnual } from "@/lib/types";

const CAT_COLOR: Record<string, string> = {
  "행사·축제": "#D4861E",
  "문화·관광": "#4B9CD3",
  "도시재생·시설": "#1E7A8C",
  "복지·돌봄": "#3E9AA8",
  "용역·연구": "var(--muted)",
  "환경·안전": "#0F6E5C",
};

// 연간 공공예산 흐름 — 입찰(공고) vs 수의계약 누적 막대 (억원). 그라데이션 채움.
export function BudgetFlow({ annual, height = 230 }: { annual: ProcurementAnnual[]; height?: number }) {
  const rows = annual.map((a) => ({
    year: `'${String(a.year).slice(2)}`,
    입찰: Math.round(a.bid / 1000) / 10,
    수의계약: Math.round(a.sole / 1000) / 10,
  }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows} margin={{ top: 8, right: 6, bottom: 0, left: -10 }}>
        <defs>
          <linearGradient id="bfBid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2f74c0" />
            <stop offset="100%" stopColor="#1E5FA8" />
          </linearGradient>
          <linearGradient id="bfSole" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e6a042" />
            <stop offset="100%" stopColor="#D4861E" />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="year" tick={{ fill: "var(--muted2)", fontSize: 10 }} stroke="var(--line)" />
        <YAxis tick={{ fill: "var(--muted2)", fontSize: 10 }} stroke="var(--line)" width={36} unit="억" />
        <Tooltip
          cursor={{ fill: "var(--muted2)", opacity: 0.08 }}
          contentStyle={{ background: "var(--navy)", border: "1px solid var(--line)", borderRadius: 10, fontSize: 12 }}
          labelStyle={{ color: "var(--muted)" }}
          formatter={(v: number) => [`${v}억`, ""]}
        />
        <Legend wrapperStyle={{ fontSize: 11, color: "var(--muted)" }} />
        <Bar dataKey="입찰" stackId="b" fill="url(#bfBid)" radius={[0, 0, 0, 0]} />
        <Bar dataKey="수의계약" stackId="b" fill="url(#bfSole)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// 최신 연도 카테고리별 공고예산 (억원) — 가로 막대. 그라데이션 채움.
export function BudgetCategoryBars({ annual }: { annual: ProcurementAnnual[] }) {
  const latest = annual[annual.length - 1];
  if (!latest) return null;
  const entries = Object.entries(latest.byCategory)
    .map(([cat, manwon]) => ({ cat, eok: Math.round(manwon / 1000) / 10 }))
    .sort((a, b) => b.eok - a.eok);
  const max = Math.max(...entries.map((e) => e.eok), 1);
  return (
    <div className="space-y-1.5">
      {entries.map((e) => {
        const c = CAT_COLOR[e.cat] ?? "#4B9CD3";
        return (
          <div key={e.cat} className="flex items-center gap-2">
            <span className="w-24 shrink-0 text-[11.5px] text-muted">{e.cat}</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-navy2/60">
              <div
                className="h-full rounded-full transition-[width] duration-700 ease-out"
                style={{ width: `${(e.eok / max) * 100}%`, background: `linear-gradient(90deg, ${c}99, ${c})`, boxShadow: `0 0 6px ${c}66` }}
              />
            </div>
            <span className="w-12 text-right text-[11.5px] font-semibold tabular-nums text-ink">{e.eok}억</span>
          </div>
        );
      })}
    </div>
  );
}
