"use client";

import { GRADE_HEX } from "@/lib/constants";
import type { Grade } from "@/lib/types";
import { momentumArrow, signed } from "@/lib/utils";

// 방사형 KLAI 게이지 — 270° 아크, 등급색, 중앙 점수+등급+모멘텀
export function KlaiGauge({
  klai,
  grade,
  momentum,
  size = 168,
  label = "KLAI",
}: {
  klai: number;
  grade: Grade;
  momentum?: number;
  size?: number;
  label?: string;
}) {
  const stroke = size * 0.085;
  const r = (size - stroke) / 2 - 2;
  const cx = size / 2;
  const cy = size / 2;
  const START = 135; // 시작 각(도) — 좌하단
  const SWEEP = 270; // 총 스윕
  const pct = Math.max(0, Math.min(100, klai)) / 100;
  const color = GRADE_HEX[grade];

  const pol = (deg: number) => {
    const a = (deg * Math.PI) / 180;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  };
  const arc = (fromPct: number, toPct: number) => {
    const a0 = START + SWEEP * fromPct;
    const a1 = START + SWEEP * toPct;
    const p0 = pol(a0);
    const p1 = pol(a1);
    const large = a1 - a0 > 180 ? 1 : 0;
    return `M${p0.x},${p0.y} A${r},${r} 0 ${large} 1 ${p1.x},${p1.y}`;
  };
  const arrow = momentum != null ? momentumArrow(momentum) : null;
  const arrowColor = arrow === "▲" ? "var(--gB)" : arrow === "▼" ? "var(--warn)" : "var(--muted)";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="block">
        <defs>
          <linearGradient id={`g-${grade}-${size}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.7} />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        {/* 트랙 */}
        <path d={arc(0, 1)} fill="none" stroke="#21426a" strokeWidth={stroke} strokeLinecap="round" opacity={0.55} />
        {/* 값 */}
        <path
          d={arc(0, pct || 0.001)}
          fill="none"
          stroke={`url(#g-${grade}-${size})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color}66)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted2">{label}</div>
        <div className="tnum text-[clamp(26px,8vw,40px)] font-black leading-none" style={{ color }}>
          {klai}
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          <span
            className="grid h-5 w-5 place-items-center rounded-md text-[11px] font-extrabold text-white"
            style={{ background: color }}
          >
            {grade}
          </span>
          {arrow && (
            <span className="text-[12px] font-bold tnum" style={{ color: arrowColor }}>
              {arrow} {signed(momentum!)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
