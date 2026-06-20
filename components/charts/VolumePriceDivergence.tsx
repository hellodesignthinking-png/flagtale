"use client";

// 유동성이 가격보다 먼저 — 임대료(하방경직) vs 공실률(먼저 폭증) 발산 (시스템맵 §4 포팅)
// 가로수길 실증: 임대료는 버티는데 공실만 폭증 → D2-6 시장 활성도의 근거

const Q: [number, number, number][] = [
  [0, 0.55, 0.12], [0.2, 0.68, 0.14], [0.4, 0.78, 0.2], [0.55, 0.8, 0.34],
  [0.7, 0.79, 0.55], [0.85, 0.76, 0.74], [1, 0.72, 0.86],
];
const VX = (t: number) => 40 + t * 290;
const VY = (v: number) => 195 - v * 160;

function path(idx: number): string {
  let d = `M${VX(Q[0][0])},${VY(Q[0][idx])}`;
  for (let i = 1; i < Q.length; i++) {
    const px = VX(Q[i - 1][0]),
      py = VY(Q[i - 1][idx]),
      cx = VX(Q[i][0]),
      cy = VY(Q[i][idx]);
    const mx = (px + cx) / 2;
    d += ` C${mx},${py} ${mx},${cy} ${cx},${cy}`;
  }
  return d;
}

export function VolumePriceDivergence({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 360 230" className={className} role="img" aria-label="임대료 대 공실률 발산">
      {/* divergence shading */}
      <rect x={VX(0.55)} y={30} width={VX(1) - VX(0.55)} height={165} fill="#FF7A3D" opacity={0.07} />
      <text x={VX(0.78)} y={48} textAnchor="middle" fontSize={10.5} fontWeight={700} fill="#FF7A3D">
        발산 = 쇠퇴 신호
      </text>
      <path d={path(1)} fill="none" stroke="#D4861E" strokeWidth={2.6} strokeLinecap="round" />
      <path d={path(2)} fill="none" stroke="#FF7A3D" strokeWidth={2.6} strokeLinecap="round" />
      {/* legend */}
      {([["임대료(하방경직)", "#D4861E", 58], ["공실률(먼저 폭증)", "#FF7A3D", 74]] as const).map(([t, c, y]) => (
        <g key={t}>
          <rect x={46} y={y - 9} width={11} height={11} rx={2} fill={c} />
          <text x={62} y={y} fontSize={10.5} fill="var(--muted)">
            {t}
          </text>
        </g>
      ))}
    </svg>
  );
}
