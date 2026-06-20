"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

// 네이버 검색 관심도(월별 상대값 0~100) — 실데이터
export function NaverInterestChart({
  data,
  height = 170,
}: {
  data: { period: string; ratio: number }[];
  height?: number;
}) {
  const rows = data.map((d) => ({ m: `'${d.period.slice(2)}`, ratio: d.ratio }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <defs>
          <linearGradient id="naverFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--green)" stopOpacity={0.4} />
            <stop offset="100%" stopColor="var(--green)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="m" tick={{ fill: "var(--muted2)", fontSize: 9 }} stroke="var(--line)" interval={5} />
        <YAxis domain={[0, 100]} tick={{ fill: "var(--muted2)", fontSize: 9 }} stroke="var(--line)" width={30} />
        <Tooltip
          contentStyle={{ background: "var(--navy)", border: "1px solid var(--line)", borderRadius: 10, fontSize: 12 }}
          labelStyle={{ color: "var(--muted)" }}
        />
        <Area type="monotone" dataKey="ratio" name="검색 관심도" stroke="var(--green)" strokeWidth={2} fill="url(#naverFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
