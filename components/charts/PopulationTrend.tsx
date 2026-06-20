"use client";

import {
  ComposedChart,
  Area,
  Line,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import type { DemographicYear } from "@/lib/types";

// 인구 장기 추세 — 총인구(면적) + 청년/고령 비율(선)
export function PopulationTrend({ data, height = 240 }: { data: DemographicYear[]; height?: number }) {
  const rows = data.map((d) => ({
    year: `'${String(d.year).slice(2)}`,
    pop: d.totalPop,
    youth: d.youthRatio,
    elderly: d.elderlyRatio,
  }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={rows} margin={{ top: 8, right: 6, bottom: 0, left: -6 }}>
        <defs>
          <linearGradient id="popFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4B9CD3" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#4B9CD3" stopOpacity={0.03} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="year" tick={{ fill: "var(--muted2)", fontSize: 10 }} stroke="var(--line)" />
        <YAxis yAxisId="pop" tick={{ fill: "var(--muted2)", fontSize: 10 }} stroke="var(--line)" width={46} />
        <YAxis yAxisId="ratio" orientation="right" domain={[0, 50]} tick={{ fill: "var(--muted2)", fontSize: 10 }} stroke="var(--line)" width={30} unit="%" />
        <Tooltip
          contentStyle={{ background: "var(--navy)", border: "1px solid var(--line)", borderRadius: 10, fontSize: 12 }}
          labelStyle={{ color: "var(--muted)" }}
        />
        <Legend wrapperStyle={{ fontSize: 11, color: "var(--muted)" }} />
        <Area yAxisId="pop" type="monotone" dataKey="pop" name="총인구" stroke="#4B9CD3" strokeWidth={2.5} fill="url(#popFill)" />
        <Line yAxisId="ratio" type="monotone" dataKey="youth" name="청년 %" stroke="#0F6E5C" strokeWidth={2} dot={false} />
        <Line yAxisId="ratio" type="monotone" dataKey="elderly" name="고령 %" stroke="#D2691E" strokeWidth={2} dot={false} strokeDasharray="4 3" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// 순이동 막대 (장기) — 유입(+)/유출(-)
export function MigrationBars({ data, height = 120 }: { data: DemographicYear[]; height?: number }) {
  const rows = data.map((d) => ({ year: `'${String(d.year).slice(2)}`, net: d.netMigration }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={rows} margin={{ top: 6, right: 6, bottom: 0, left: -6 }}>
        <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="year" tick={{ fill: "var(--muted2)", fontSize: 9 }} stroke="var(--line)" />
        <YAxis tick={{ fill: "var(--muted2)", fontSize: 9 }} stroke="var(--line)" width={40} />
        <ReferenceLine y={0} stroke="var(--line)" />
        <Tooltip
          contentStyle={{ background: "var(--navy)", border: "1px solid var(--line)", borderRadius: 10, fontSize: 12 }}
          labelStyle={{ color: "var(--muted)" }}
        />
        <Bar dataKey="net" name="순이동" radius={[2, 2, 0, 0]}>
          {rows.map((r, i) => (
            <Cell key={i} fill={r.net >= 0 ? "#2FB4A0" : "#FF7A3D"} />
          ))}
        </Bar>
      </ComposedChart>
    </ResponsiveContainer>
  );
}
