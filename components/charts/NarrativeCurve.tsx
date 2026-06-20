"use client";

// 내러티브 → 상권 결합 곡선 (시스템맵 §4 포팅)
// 이야기(버즈)가 먼저 솟고 상권 활동이 뒤따른다 · 면 채움 + 글로우 + 티핑/역티핑 펄스 마커

const P: [number, number, number][] = [
  [0, 0.1, 0.05], [0.08, 0.18, 0.07], [0.16, 0.32, 0.12], [0.24, 0.52, 0.2],
  [0.32, 0.74, 0.34], [0.4, 0.92, 0.55], [0.48, 0.86, 0.74], [0.56, 0.72, 0.88],
  [0.64, 0.58, 0.9], [0.72, 0.46, 0.8], [0.8, 0.38, 0.62], [0.88, 0.32, 0.45], [1, 0.28, 0.33],
];
const X = (t: number) => 70 + t * 650;
const Y = (v: number) => 250 - v * 200;
const BASE = 250;

function smoothPath(idx: number): string {
  let d = `M${X(P[0][0])},${Y(P[0][idx])}`;
  for (let i = 1; i < P.length; i++) {
    const px = X(P[i - 1][0]),
      py = Y(P[i - 1][idx]),
      cx = X(P[i][0]),
      cy = Y(P[i][idx]);
    const mx = (px + cx) / 2;
    d += ` C${mx},${py} ${mx},${cy} ${cx},${cy}`;
  }
  return d;
}
const areaPath = (idx: number) => `${smoothPath(idx)} L${X(1)},${BASE} L${X(0)},${BASE} Z`;
const endPt = (idx: number) => ({ x: X(P[P.length - 1][0]), y: Y(P[P.length - 1][idx]) });

const BANDS: [number, number, string][] = [
  [0, 0.24, "형성"],
  [0.24, 0.42, "확산"],
  [0.42, 0.66, "절정"],
  [0.66, 1, "쇠퇴"],
];

export function NarrativeCurve({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 760 290" className={className} role="img" aria-label="내러티브-상권 생애주기 곡선">
      <defs>
        <linearGradient id="ncStory" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4B9CD3" stopOpacity={0.34} />
          <stop offset="100%" stopColor="#4B9CD3" stopOpacity={0.01} />
        </linearGradient>
        <linearGradient id="ncTrade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D4861E" stopOpacity={0.28} />
          <stop offset="100%" stopColor="#D4861E" stopOpacity={0.01} />
        </linearGradient>
      </defs>

      {BANDS.map((b, i) => (
        <g key={i}>
          <rect
            x={X(b[0])}
            y={40}
            width={X(b[1]) - X(b[0])}
            height={210}
            fill={i % 2 ? "#ffffff" : "var(--navy2)"}
            opacity={i % 2 ? 0.03 : 0.25}
          />
          <text x={(X(b[0]) + X(b[1])) / 2} y={62} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--muted)">
            {b[2]}
          </text>
        </g>
      ))}

      {/* 면 채움 (상권 먼저 깔고 이야기 위에) */}
      <path d={areaPath(2)} fill="url(#ncTrade)" />
      <path d={areaPath(1)} fill="url(#ncStory)" />

      {/* 곡선 + 글로우 */}
      <path d={smoothPath(2)} fill="none" stroke="#D4861E" strokeWidth={3} strokeLinecap="round" style={{ filter: "drop-shadow(0 0 5px rgba(212,134,30,0.5))" }} />
      <path d={smoothPath(1)} fill="none" stroke="#4B9CD3" strokeWidth={3} strokeLinecap="round" style={{ filter: "drop-shadow(0 0 5px rgba(75,156,211,0.55))" }} />

      {/* 끝점 */}
      {([[1, "#4B9CD3"], [2, "#D4861E"]] as const).map(([idx, c]) => {
        const p = endPt(idx);
        return <circle key={idx} cx={p.x} cy={p.y} r={3.6} fill={c} stroke="var(--navy)" strokeWidth={1.5} />;
      })}

      {/* 티핑 마커 (펄스) */}
      {([[0.3, "▲ 티핑포인트", "#0F6E5C", true], [0.72, "▼ 역 티핑포인트", "#FF7A3D", false]] as const).map(
        ([t, label, color, up], i) => (
          <g key={i}>
            <line x1={X(t)} y1={46} x2={X(t)} y2={250} stroke={color} strokeWidth={1.5} strokeDasharray="4 4" opacity={0.7} />
            <circle className="klai-pulse-ring" cx={X(t)} cy={up ? 92 : 150} r={9} fill="none" stroke={color} strokeWidth={2} />
            <circle cx={X(t)} cy={up ? 92 : 150} r={4} fill={color} />
            <text x={X(t)} y={up ? 36 : 268} textAnchor="middle" fontSize={11.5} fontWeight={800} fill={color}>
              {label}
            </text>
          </g>
        )
      )}

      {/* 범례 */}
      <g transform="translate(78, 256)" fontSize={11} fontWeight={700}>
        <circle cx={0} cy={0} r={4} fill="#4B9CD3" />
        <text x={9} y={4} fill="var(--muted)">이야기·버즈</text>
        <circle cx={92} cy={0} r={4} fill="#D4861E" />
        <text x={101} y={4} fill="var(--muted)">상권 활동</text>
      </g>
    </svg>
  );
}
