// 경량 SVG 스파크라인 — 면 그라데이션 + 라인 글로우 + 끝점. hooks 없음(서버·클라이언트 공용).
// PlacePanel 드로어·대시보드 경보·리포트에서 재사용.
export function Sparkline({
  data,
  width = 120,
  height = 34,
  color = "#4B9CD3",
  min,
  max,
  baseline,
  fill = true,
  dot = true,
  className,
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  min?: number;
  max?: number;
  baseline?: number; // 0선 등 기준선
  fill?: boolean;
  dot?: boolean;
  className?: string;
}) {
  if (!data || data.length < 2) return null;
  const pad = 3;
  const lo = min ?? Math.min(...data);
  const hi = max ?? Math.max(...data);
  const span = hi - lo || 1;
  const X = (i: number) => pad + (i / (data.length - 1)) * (width - pad * 2);
  const Y = (v: number) => height - pad - ((v - lo) / span) * (height - pad * 2);
  const pts = data.map((v, i) => [X(i), Y(v)] as const);
  const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const area = `${line} L ${pts[pts.length - 1][0].toFixed(1)} ${height - pad} L ${pts[0][0].toFixed(1)} ${height - pad} Z`;
  const end = pts[pts.length - 1];
  const gid = "spkg-" + color.replace(/[^a-zA-Z0-9]/g, "");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.34} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      {baseline != null && lo <= baseline && baseline <= hi && (
        <line x1={pad} y1={Y(baseline)} x2={width - pad} y2={Y(baseline)} stroke="var(--line)" strokeDasharray="2 3" />
      )}
      {fill && <path d={area} fill={`url(#${gid})`} />}
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 3px ${color}66)` }}
      />
      {dot && <circle cx={end[0]} cy={end[1]} r={2.6} fill={color} stroke="var(--navy)" strokeWidth={1} />}
    </svg>
  );
}
