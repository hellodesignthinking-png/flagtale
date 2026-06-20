"use client";

// 인과 루프 다이어그램 (시스템맵 §3b·3c 포팅)
// 악순환(R−) / 선순환(R+) — 흐르는 화살표로 순환 시각화 · 레버리지 노드 펄스 강조

interface Props {
  kind: "vicious" | "virtuous";
  className?: string;
}

const CONFIG = {
  vicious: {
    nodes: ["청년·여성\n유출", "출산↓\n학교·의료 축소", "상점\n폐업", "정주여건\n악화"],
    color: "#D2691E",
    glow: "#ff8a4d",
    sign: "↻ R−",
  },
  virtuous: {
    nodes: ["앵커·다양성\n진정성", "버즈·\n방문 증가", "신규창업\n유입", "소득·\n활력 상승"],
    color: "#3E9AA8",
    glow: "#5fc7d6",
    sign: "↻ R+",
  },
} as const;

export function CausalLoop({ kind, className }: Props) {
  const { nodes, color, glow, sign } = CONFIG[kind];
  const cx = 180,
    cy = 150,
    R = 105;
  const leverageIdx = 0;

  const pos = nodes.map((_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / nodes.length;
    return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
  });

  const shrink = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const vx = b.x - a.x,
      vy = b.y - a.y,
      l = Math.hypot(vx, vy) || 1;
    return { x: a.x + (vx / l) * 30, y: a.y + (vy / l) * 30 };
  };

  return (
    <svg viewBox="0 0 360 300" className={className} role="img" aria-label={`${kind} causal loop`}>
      <defs>
        <marker id={`ah-${kind}`} markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto">
          <path d="M0,0 L7,3 L0,6 Z" fill={color} />
        </marker>
        <radialGradient id={`node-${kind}`} cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor={glow} />
          <stop offset="100%" stopColor={color} />
        </radialGradient>
        <filter id={`glow-${kind}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 중심 순환 표식 */}
      <circle cx={cx} cy={cy} r={46} fill="none" stroke={color} strokeWidth={1} strokeDasharray="2 6" opacity={0.35} />
      <text x={cx} y={cy + 6} textAnchor="middle" fontSize={22} fontWeight={900} fill={color} opacity={0.45}>
        {sign}
      </text>

      {/* 흐르는 화살표 (순환) */}
      {pos.map((p, i) => {
        const q = pos[(i + 1) % pos.length];
        const mx = (p.x + q.x) / 2,
          my = (p.y + q.y) / 2;
        const dx = mx - cx,
          dy = my - cy,
          len = Math.hypot(dx, dy) || 1;
        const ctrlx = mx + (dx / len) * 26,
          ctrly = my + (dy / len) * 26;
        const s1 = shrink(p, { x: ctrlx, y: ctrly }),
          s2 = shrink(q, { x: ctrlx, y: ctrly });
        const d = `M${s1.x},${s1.y} Q${ctrlx},${ctrly} ${s2.x},${s2.y}`;
        return (
          <g key={i}>
            {/* 베이스 옅은 경로 */}
            <path d={d} fill="none" stroke={color} strokeWidth={2.4} opacity={0.22} />
            {/* 흐르는 점선 */}
            <path
              className="klai-flow"
              d={d}
              fill="none"
              stroke={color}
              strokeWidth={2.4}
              strokeLinecap="round"
              markerEnd={`url(#ah-${kind})`}
              style={{ animationDelay: `${i * 0.18}s` }}
            />
          </g>
        );
      })}

      {/* 노드 */}
      {nodes.map((n, i) => {
        const p = pos[i];
        const lev = i === leverageIdx;
        return (
          <g key={i}>
            {lev && (
              <circle className="klai-pulse-ring" cx={p.x} cy={p.y} r={30} fill="none" stroke={glow} strokeWidth={2} />
            )}
            <circle
              cx={p.x}
              cy={p.y}
              r={lev ? 27 : 24}
              fill={lev ? `url(#node-${kind})` : "var(--card)"}
              stroke={color}
              strokeWidth={lev ? 3 : 2}
              filter={lev ? `url(#glow-${kind})` : undefined}
            />
            {n.split("\n").map((line, k, arr) => (
              <text
                key={k}
                x={p.x}
                y={p.y + 4 + (k - (arr.length - 1) / 2) * 12}
                textAnchor="middle"
                fontSize={10.5}
                fontWeight={700}
                fill={lev ? "#fff" : "var(--ink)"}
              >
                {line}
              </text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}
