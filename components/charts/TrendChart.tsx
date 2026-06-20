"use client";

import {
  Area,
  AreaChart,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { PlaceScore } from "@/lib/types";

// KLAI 추세 + 모멘텀 (시계열)
export function TrendChart({ series, height = 220 }: { series: PlaceScore[]; height?: number }) {
  const data = series.map((s) => ({
    period: s.period.replace("20", "'"),
    klai: s.klai,
    momentum: s.momentum,
  }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 8, right: 10, bottom: 0, left: -18 }}>
        <defs>
          <linearGradient id="klaiFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4B9CD3" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#4B9CD3" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="period" tick={{ fill: "var(--muted2)", fontSize: 10 }} stroke="var(--line)" />
        <YAxis domain={[0, 100]} tick={{ fill: "var(--muted2)", fontSize: 10 }} stroke="var(--line)" width={36} />
        <Tooltip
          contentStyle={{
            background: "var(--navy)",
            border: "1px solid var(--line)",
            borderRadius: 10,
            fontSize: 12,
          }}
          labelStyle={{ color: "var(--muted)" }}
        />
        <Area type="monotone" dataKey="klai" name="KLAI" stroke="#4B9CD3" strokeWidth={2.5} fill="url(#klaiFill)" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// 모멘텀 막대 시계열 (작은 보조 차트)
export function MomentumTrend({ series, height = 110 }: { series: PlaceScore[]; height?: number }) {
  const data = series.map((s) => ({ period: s.period.replace("20", "'"), momentum: s.momentum }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 6, right: 10, bottom: 0, left: -18 }}>
        <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="period" tick={{ fill: "var(--muted2)", fontSize: 9 }} stroke="var(--line)" />
        <YAxis domain={[-10, 10]} tick={{ fill: "var(--muted2)", fontSize: 9 }} stroke="var(--line)" width={28} />
        <ReferenceLine y={0} stroke="var(--line)" />
        <Tooltip
          contentStyle={{ background: "var(--navy)", border: "1px solid var(--line)", borderRadius: 10, fontSize: 12 }}
          labelStyle={{ color: "var(--muted)" }}
        />
        <Area type="monotone" dataKey="momentum" name="모멘텀" stroke="#D4861E" strokeWidth={2} fill="#D4861E" fillOpacity={0.15} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
