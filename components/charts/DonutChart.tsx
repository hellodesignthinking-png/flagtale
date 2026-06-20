// 경량 SVG 도넛 차트 — 세그먼트 + 중앙 라벨 + 글로우. hooks 없음(서버·클라이언트 공용).
export function DonutChart({
  segments,
  size = 132,
  thickness = 18,
  centerLabel,
  centerSub,
  className,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerSub?: string;
  className?: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - thickness) / 2 - 1;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className} role="img" aria-label="연동 커버리지">
      <circle cx={c} cy={c} r={r} fill="none" stroke="var(--line)" strokeWidth={thickness} opacity={0.4} />
      {segments.map((s, i) => {
        const dash = (s.value / total) * circ;
        const el = (
          <circle
            key={i}
            cx={c}
            cy={c}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={thickness}
            strokeDasharray={`${dash.toFixed(2)} ${(circ - dash).toFixed(2)}`}
            strokeDashoffset={(-offset).toFixed(2)}
            transform={`rotate(-90 ${c} ${c})`}
            style={{ filter: `drop-shadow(0 0 4px ${s.color}66)` }}
          />
        );
        offset += dash;
        return el;
      })}
      {centerLabel != null && (
        <text x={c} y={c} textAnchor="middle" fontSize={size * 0.26} fontWeight={900} fill="var(--ink)" dominantBaseline="central">
          {centerLabel}
        </text>
      )}
      {centerSub != null && (
        <text x={c} y={c + size * 0.18} textAnchor="middle" fontSize={size * 0.092} fill="var(--muted2)" dominantBaseline="central">
          {centerSub}
        </text>
      )}
    </svg>
  );
}
