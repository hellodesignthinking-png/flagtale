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
  ReferenceLine,
} from "recharts";
import type { RegionComparison } from "@/lib/data";

// 도시(시도) 평균·전국 평균 대비 이 동의 인구 변화 (기준연도=100 지수)
export function CityCompare({ cmp, height = 260 }: { cmp: RegionComparison; height?: number }) {
  const data = cmp.years.map((y, i) => ({
    year: `'${String(y).slice(2)}`,
    [`이 동`]: cmp.region[i],
    [`${cmp.sidoName} 평균`]: cmp.sidoAvg[i],
    "전국 평균": cmp.nationalAvg[i],
  }));
  const last = cmp.years.length - 1;
  const gapSido = Math.round((cmp.region[last] - cmp.sidoAvg[last]) * 10) / 10;

  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
          <defs>
            <linearGradient id="ccRegion" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4B9CD3" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#4B9CD3" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="year" tick={{ fill: "var(--muted2)", fontSize: 10 }} stroke="var(--line)" />
          <YAxis tick={{ fill: "var(--muted2)", fontSize: 10 }} stroke="var(--line)" width={34} domain={["dataMin - 4", "dataMax + 4"]} />
          <ReferenceLine y={100} stroke="var(--line)" strokeDasharray="4 4" label={{ value: "기준=100", fill: "var(--muted2)", fontSize: 9, position: "insideTopLeft" }} />
          <Tooltip
            contentStyle={{ background: "var(--navy)", border: "1px solid var(--line)", borderRadius: 10, fontSize: 12 }}
            labelStyle={{ color: "var(--muted)" }}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: "var(--muted)" }} />
          <Area
            type="monotone"
            dataKey="이 동"
            stroke="#5aa6db"
            strokeWidth={2.8}
            fill="url(#ccRegion)"
            dot={false}
            activeDot={{ r: 5, strokeWidth: 0 }}
            style={{ filter: "drop-shadow(0 1px 4px rgba(75,156,211,0.4))" }}
          />
          <Line type="monotone" dataKey={`${cmp.sidoName} 평균`} stroke="#D4861E" strokeWidth={2} strokeDasharray="5 3" dot={false} />
          <Line type="monotone" dataKey="전국 평균" stroke="var(--muted2)" strokeWidth={1.6} strokeDasharray="2 3" dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
      <p className="mt-1.5 text-center text-[12px] text-muted">
        {cmp.years[0]}년 인구를 100으로 둔 지수 ·{" "}
        <b className={gapSido >= 0 ? "text-grade-b" : "text-warn"}>
          {cmp.sidoName} 평균 대비 {gapSido >= 0 ? "+" : ""}{gapSido}p
        </b>{" "}
        ({gapSido >= 0 ? "더 선방" : "더 감소"})
      </p>
    </div>
  );
}

// 청년/고령 비율 — 이 동 vs 시도 vs 전국 (현재). 그라데이션 막대.
export function RatioCompare({ cmp }: { cmp: RegionComparison }) {
  const rows = [
    { label: "청년(20~39%)", v: cmp.youth },
    { label: "고령(65%+)", v: cmp.elderly },
  ];
  return (
    <div className="space-y-3">
      {rows.map((r) => {
        const max = Math.max(r.v.region, r.v.sido, r.v.national, 1);
        const bars = [
          { name: "이 동", val: r.v.region, color: "#4B9CD3" },
          { name: `${cmp.sidoName} 평균`, val: r.v.sido, color: "#D4861E" },
          { name: "전국 평균", val: r.v.national, color: "var(--muted2)" },
        ];
        return (
          <div key={r.label}>
            <div className="mb-1 text-[12px] font-semibold text-ink">{r.label}</div>
            <div className="space-y-1">
              {bars.map((b) => (
                <div key={b.name} className="flex items-center gap-2">
                  <span className="w-20 shrink-0 text-[11px] text-muted2">{b.name}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-navy2/60">
                    <div
                      className="h-full rounded-full transition-[width] duration-700 ease-out"
                      style={{
                        width: `${(b.val / max) * 100}%`,
                        background: `linear-gradient(90deg, ${b.color}99, ${b.color})`,
                      }}
                    />
                  </div>
                  <span className="w-10 text-right text-[11px] tabular-nums text-ink">{b.val}%</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
