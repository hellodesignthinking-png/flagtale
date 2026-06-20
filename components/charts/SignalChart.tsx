"use client";

import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { SIGNAL_META } from "@/lib/signals";
import type { SignalSeries } from "@/lib/types";

// 검색·기사·인구·임대료·매물 겹친 다선 + 동조도(co-movement) 음영
export function SignalChart({
  signals,
  periods,
  comovement,
  height = 300,
}: {
  signals: SignalSeries;
  periods: string[];
  comovement: number[];
  height?: number;
}) {
  const data = periods.map((p, t) => {
    const row: Record<string, number | string> = { period: p.replace("20", "'"), 동조도: comovement[t] };
    for (const m of SIGNAL_META) row[m.label] = signals[m.key][t];
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <defs>
          <linearGradient id="comov" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D4861E" stopOpacity={0.22} />
            <stop offset="100%" stopColor="#D4861E" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="period" tick={{ fill: "var(--muted2)", fontSize: 10 }} stroke="var(--line)" />
        <YAxis domain={[0, 100]} tick={{ fill: "var(--muted2)", fontSize: 10 }} stroke="var(--line)" width={32} />
        <Tooltip
          contentStyle={{ background: "var(--navy)", border: "1px solid var(--line)", borderRadius: 10, fontSize: 12 }}
          labelStyle={{ color: "var(--muted)" }}
        />
        <Legend wrapperStyle={{ fontSize: 11, color: "var(--muted)" }} />
        <Area type="monotone" dataKey="동조도" stroke="#D4861E" strokeOpacity={0.5} strokeWidth={1} fill="url(#comov)" />
        {SIGNAL_META.map((m) => (
          <Line
            key={m.key}
            type="monotone"
            dataKey={m.label}
            stroke={m.color}
            strokeWidth={m.role === "narrative" ? 2.6 : 2}
            strokeDasharray={m.role === "capital" ? "5 3" : undefined}
            dot={false}
          />
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
