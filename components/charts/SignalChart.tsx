"use client";

import { useState } from "react";
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

const AVG_COLOR = "#9aa3af"; // 전국 평균선(중성 회색, 점선)

// 검색·기사·인구·임대료·매물 겹친 다선 + 동조도 음영 + 전국 평균 비교.
// 칩 클릭 → 해당 지표만(지역 실선 vs 전국 평균 점선) 그래프로 격리.
export function SignalChart({
  signals,
  periods,
  comovement,
  avgSignals,
  avgComovement,
  height = 300,
}: {
  signals: SignalSeries;
  periods: string[];
  comovement: number[];
  avgSignals?: SignalSeries;
  avgComovement?: number[];
  height?: number;
}) {
  const [sel, setSel] = useState<string>("all"); // "all" | "동조도" | signal key
  const hasAvg = !!avgSignals && !!avgComovement;
  const last = periods.length - 1;

  const chips = [
    { key: "동조도", label: "동조도", color: "#D4861E", region: comovement[last], avg: avgComovement?.[last] },
    ...SIGNAL_META.map((m) => ({ key: m.key, label: m.label, color: m.color, region: signals[m.key]?.[last], avg: avgSignals?.[m.key]?.[last] })),
  ];

  const data = periods.map((p, t) => {
    const row: Record<string, number | string> = { period: p.replace("20", "'") };
    row["동조도"] = comovement[t];
    if (hasAvg) row["동조도 평균"] = avgComovement![t];
    for (const m of SIGNAL_META) {
      row[m.label] = signals[m.key]?.[t] ?? 0;
      if (hasAvg) row[`${m.label} 평균`] = avgSignals![m.key]?.[t] ?? 0;
    }
    return row;
  });

  const showAll = sel === "all";
  const isComov = sel === "동조도";
  const selMeta = SIGNAL_META.find((m) => m.key === sel) ?? null;
  const selLabel = isComov ? "동조도" : selMeta?.label ?? "";

  return (
    <div>
      {/* 비교 칩 — 지역 최신값 / 전국 평균 / Δ. 클릭 시 해당 지표만(지역 vs 평균) */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setSel("all")}
          className={`rounded-full border-[1.5px] px-3 py-1.5 text-[12px] font-extrabold transition-colors ${showAll ? "border-ink bg-ink text-white" : "border-line bg-card text-ink hover:border-ink"}`}
        >
          전체
        </button>
        {chips.map((c) => {
          const active = sel === c.key;
          const diff = c.region != null && c.avg != null ? Math.round((c.region - c.avg) * 10) / 10 : null;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => setSel(c.key)}
              className={`flex items-center gap-1.5 rounded-full border-[1.5px] bg-card px-3 py-1.5 text-[12px] font-bold transition-colors ${active ? "" : "border-line hover:border-ink"}`}
              style={active ? { borderColor: c.color } : undefined}
            >
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: c.color }} />
              <span className="text-ink">{c.label}</span>
              <b className="tabular-nums text-ink">{c.region ?? "—"}</b>
              {hasAvg && c.avg != null && <span className="tabular-nums text-muted2">/ 평균 {c.avg}</span>}
              {diff != null && (
                <span className="tabular-nums font-extrabold" style={{ color: diff >= 0 ? "var(--gB)" : "var(--warn)" }}>
                  {diff >= 0 ? "▲+" : "▼"}{Math.abs(diff)}
                </span>
              )}
            </button>
          );
        })}
      </div>

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

          {/* 동조도 음영 (전체 또는 동조도 선택 시) */}
          {(showAll || isComov) && (
            <Area type="monotone" dataKey="동조도" stroke="#D4861E" strokeOpacity={0.5} strokeWidth={1} fill="url(#comov)" />
          )}
          {/* 동조도 전국 평균 (동조도 선택 시) */}
          {isComov && hasAvg && (
            <Line type="monotone" dataKey="동조도 평균" stroke={AVG_COLOR} strokeWidth={2} strokeDasharray="5 3" dot={false} />
          )}

          {/* 신호선 — 전체면 전부, 단일 선택이면 그 신호만 */}
          {SIGNAL_META.filter((m) => showAll || m.key === sel).map((m) => (
            <Line
              key={m.key}
              type="monotone"
              dataKey={m.label}
              stroke={m.color}
              strokeWidth={m.role === "narrative" ? 2.6 : 2}
              strokeDasharray={showAll && m.role === "capital" ? "5 3" : undefined}
              dot={false}
            />
          ))}
          {/* 단일 신호 선택 시 전국 평균 점선 겹침 */}
          {selMeta && hasAvg && (
            <Line type="monotone" dataKey={`${selMeta.label} 평균`} stroke={AVG_COLOR} strokeWidth={2} strokeDasharray="5 3" dot={false} />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {!showAll && (
        <p className="mt-1.5 text-center text-[11px] text-muted2">
          <b style={{ color: isComov ? "#D4861E" : selMeta?.color }}>━ 이 지역 {selLabel}</b>
          {hasAvg && <span> · ┄ 전국 평균</span>}
          <span className="ml-1">· 칩을 다시 누르거나 ‘전체’로 복귀</span>
        </p>
      )}
    </div>
  );
}
