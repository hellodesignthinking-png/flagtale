"use client";

import { useRef, useState } from "react";
import type React from "react";

// 전국 3D 아이소메트릭 매력도 — 동네별 KLAI=기둥 높이, 상승(초록)/하락(로즈) 음영.
// 드래그로 회전(ⓖ), 기둥 호버/클릭 시 상세 툴팁(ⓕ). 고정 viewBox 안에서 씬이 회전.
export interface IsoPoint {
  name: string;
  lng: number;
  lat: number;
  klai: number;
  momentum: number;
  kind: "riser" | "faller";
  reason?: string;
}

const SHADE = {
  riser: { top: "#34d399", left: "#16a34a", right: "#15803d" },
  faller: { top: "#fb7185", left: "#f43f5e", right: "#be123c" },
};

export function Iso3DMap({ points, className }: { points: IsoPoint[]; className?: string }) {
  const [theta, setTheta] = useState(0.5);
  const [hovered, setHovered] = useState<number | null>(null);
  const drag = useRef<{ x: number; t: number } | null>(null);
  const moved = useRef(false);

  const lngs = points.map((p) => p.lng);
  const lats = points.map((p) => p.lat);
  const padLng = Math.max((Math.max(...lngs) - Math.min(...lngs)) * 0.18, 0.08);
  const padLat = Math.max((Math.max(...lats) - Math.min(...lats)) * 0.18, 0.08);
  const lo0 = Math.min(...lngs) - padLng;
  const lo1 = Math.max(...lngs) + padLng;
  const la0 = Math.min(...lats) - padLat;
  const la1 = Math.max(...lats) + padLat;

  const W = 820;
  const H = 560;
  const UX = 270;
  const UY = 126;
  const ox = 410;
  const oy = 345;
  const fw = 13;
  const fy = 6.5;
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  const rot = (X: number, Y: number) => ({ rx: X * cos - Y * sin, ry: X * sin + Y * cos });
  const cols = points
    .map((p, i) => {
      const { rx, ry } = rot((p.lng - lo0) / (lo1 - lo0) - 0.5, (la1 - p.lat) / (la1 - la0) - 0.5);
      return { ...p, i, bx: ox + (rx - ry) * UX, by: oy + (rx + ry) * UY, depth: rx + ry, h: 16 + (p.klai / 100) * 116 };
    })
    .sort((a, b) => a.depth - b.depth);
  const gpt = (X: number, Y: number) => {
    const { rx, ry } = rot(X - 0.5, Y - 0.5);
    return { x: ox + (rx - ry) * UX, y: oy + (rx + ry) * UY };
  };

  const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
    drag.current = { x: e.clientX, t: theta };
    moved.current = false;
    setHovered(null);
  };
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    if (Math.abs(dx) > 3) moved.current = true;
    setTheta(drag.current.t + dx * 0.012);
  };
  const onUp = () => {
    drag.current = null;
  };

  const c00 = gpt(0, 0);
  const c10 = gpt(1, 0);
  const c11 = gpt(1, 1);
  const c01 = gpt(0, 1);
  const hc = hovered != null ? cols.find((c) => c.i === hovered) : null;

  return (
    <div className={`relative ${className ?? ""}`}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="전국 3D 매력도 다이어그램(드래그로 회전, 기둥 높이=KLAI, 상승/하락 색)"
        className="h-full w-full cursor-grab touch-none select-none active:cursor-grabbing"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
      >
        <polygon points={`${c00.x},${c00.y} ${c10.x},${c10.y} ${c11.x},${c11.y} ${c01.x},${c01.y}`} fill="#eaf0f2" stroke="var(--line)" strokeWidth={1} />
        {[0.2, 0.4, 0.6, 0.8].map((t) => {
          const a = gpt(t, 0);
          const b = gpt(t, 1);
          const c = gpt(0, t);
          const d = gpt(1, t);
          return (
            <g key={t} stroke="var(--line)" strokeWidth={0.8} opacity={0.5}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
              <line x1={c.x} y1={c.y} x2={d.x} y2={d.y} />
            </g>
          );
        })}

        {cols.map((c) => {
          const sh = SHADE[c.kind];
          const ty = c.by - c.h;
          const on = hovered === c.i;
          return (
            <g
              key={c.i}
              style={{ cursor: "pointer" }}
              onMouseEnter={() => {
                if (!drag.current) setHovered(c.i);
              }}
              onMouseLeave={() => setHovered((h) => (h === c.i ? null : h))}
              onPointerUp={() => {
                if (!moved.current) setHovered((v) => (v === c.i ? null : c.i));
              }}
            >
              <ellipse cx={c.bx} cy={c.by + fy} rx={fw + 2} ry={4} fill="#000" opacity={0.12} />
              <polygon points={`${c.bx - fw},${ty} ${c.bx},${ty + fy} ${c.bx},${c.by + fy} ${c.bx - fw},${c.by}`} fill={sh.left} />
              <polygon points={`${c.bx},${ty + fy} ${c.bx + fw},${ty} ${c.bx + fw},${c.by} ${c.bx},${c.by + fy}`} fill={sh.right} />
              <polygon points={`${c.bx},${ty - fy} ${c.bx + fw},${ty} ${c.bx},${ty + fy} ${c.bx - fw},${ty}`} fill={sh.top} stroke={on ? "#0D2B5E" : "#fff"} strokeWidth={on ? 2 : 0.8} />
              <text x={c.bx} y={ty - 7} fontSize={10} fontWeight={800} fill="#fff" textAnchor="middle" style={{ paintOrder: "stroke" }} stroke={c.kind === "riser" ? "#15803d" : "#be123c"} strokeWidth={2.5}>
                {c.klai}
              </text>
            </g>
          );
        })}

        {hc &&
          (() => {
            const tw = 168;
            const th = 60;
            let tx = hc.bx + 14;
            if (tx + tw > W) tx = hc.bx - 14 - tw;
            let tyy = hc.by - hc.h - th - 6;
            if (tyy < 4) tyy = 4;
            return (
              <g pointerEvents="none">
                <rect x={tx} y={tyy} width={tw} height={th} rx={9} fill="#0D2B5E" opacity={0.97} />
                <text x={tx + 12} y={tyy + 20} fontSize={13} fontWeight={800} fill="#fff">{hc.name}</text>
                <text x={tx + 12} y={tyy + 37} fontSize={11} fill="#cdd8ec">KLAI {hc.klai} · 모멘텀 {hc.momentum >= 0 ? "+" : ""}{hc.momentum}</text>
                <text x={tx + 12} y={tyy + 52} fontSize={11} fontWeight={700} fill={hc.kind === "riser" ? "#34d399" : "#fb7185"}>{hc.reason}</text>
              </g>
            );
          })()}

        <g transform={`translate(14, ${H - 12})`} pointerEvents="none">
          <rect x={0} y={-10} width={12} height={10} fill={SHADE.riser.top} />
          <text x={18} y={0} fontSize={12} fontWeight={700} fill="var(--muted)">상승</text>
          <rect x={62} y={-10} width={12} height={10} fill={SHADE.faller.top} />
          <text x={80} y={0} fontSize={12} fontWeight={700} fill="var(--muted)">하락</text>
          <text x={132} y={0} fontSize={11.5} fontWeight={600} fill="var(--muted2)">기둥 = KLAI</text>
        </g>
      </svg>
      <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-[#0D2B5E]/85 px-2.5 py-1 text-[11px] font-bold text-white/90">드래그로 회전 ↻ · 클릭/호버 상세</div>
    </div>
  );
}
