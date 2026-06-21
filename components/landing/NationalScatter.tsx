// 전국 동네 변화 분포 — 경량 SVG 지리 스캐터(서버 렌더, maplibre 불필요·항상 렌더).
// 잘되는 곳(상승)=초록 핀, 식는 곳(하락)=로즈 점, 상위 변동 동엔 '뜨는 이유' 라벨.
export interface ScatterPoint {
  lng: number;
  lat: number;
  kind: "riser" | "faller";
  momentum: number;
  name: string;
  reason?: string;
}

export function NationalScatter({ points, className }: { points: ScatterPoint[]; className?: string }) {
  const W = 620;
  const H = 460;
  const PAD = 26;
  const LNG0 = 125.6;
  const LNG1 = 129.6;
  const LAT0 = 33.1;
  const LAT1 = 38.65;
  const px = (lng: number) => PAD + ((Math.min(LNG1, Math.max(LNG0, lng)) - LNG0) / (LNG1 - LNG0)) * (W - 2 * PAD);
  const py = (lat: number) => PAD + (1 - (Math.min(LAT1, Math.max(LAT0, lat)) - LAT0) / (LAT1 - LAT0)) * (H - 2 * PAD);
  const risers = points.filter((p) => p.kind === "riser");
  const fallers = points.filter((p) => p.kind === "faller");
  const labeled = [...risers].sort((a, b) => b.momentum - a.momentum).slice(0, 4);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} role="img" aria-label="전국 동네 변화 분포 지도(상승 핀·하락 점·이유 라벨)" preserveAspectRatio="xMidYMid meet">
      {Array.from({ length: 5 }).map((_, i) => {
        const yy = PAD + (i * (H - 2 * PAD)) / 4;
        return <line key={`h${i}`} x1={PAD} x2={W - PAD} y1={yy} y2={yy} stroke="var(--line)" strokeWidth={1} opacity={0.55} />;
      })}
      {Array.from({ length: 5 }).map((_, i) => {
        const xx = PAD + (i * (W - 2 * PAD)) / 4;
        return <line key={`v${i}`} x1={xx} x2={xx} y1={PAD} y2={H - PAD} stroke="var(--line)" strokeWidth={1} opacity={0.55} />;
      })}
      <text x={PAD + 4} y={PAD + 16} fontSize={12} fontWeight={800} fill="var(--muted2)" letterSpacing="0.1em">
        KOREA · 전국
      </text>

      {/* 하락 = 로즈 점 */}
      {fallers.map((p, i) => (
        <circle key={`f${i}`} cx={px(p.lng)} cy={py(p.lat)} r={4.5} fill="var(--warn)" opacity={0.8} stroke="#fff" strokeWidth={1.2} />
      ))}

      {/* 상승(잘되는 곳) = 초록 핀 */}
      {risers.map((p, i) => {
        const x = px(p.lng);
        const y = py(p.lat);
        return (
          <g key={`r${i}`}>
            <path d={`M ${x} ${y} L ${x - 6} ${y - 13} A 6 6 0 1 1 ${x + 6} ${y - 13} Z`} fill="#16a34a" stroke="#fff" strokeWidth={1.5} />
            <circle cx={x} cy={y - 13} r={2.6} fill="#fff" />
          </g>
        );
      })}

      {/* 상위 변동 동 '뜨는 이유' 라벨(흰 후광) */}
      {labeled.map((p, i) => {
        const x = px(p.lng);
        const y = py(p.lat);
        const right = x < W * 0.58;
        return (
          <text
            key={`l${i}`}
            x={right ? x + 10 : x - 10}
            y={y - 18}
            fontSize={11}
            fontWeight={800}
            fill="var(--ink)"
            stroke="#fff"
            strokeWidth={3}
            paintOrder="stroke"
            textAnchor={right ? "start" : "end"}
          >
            {p.name} · {p.reason}
          </text>
        );
      })}

      {/* 범례 */}
      <g transform={`translate(${PAD + 2}, ${H - 12})`}>
        <path d="M 6 -2 L 2 -10 A 4 4 0 1 1 10 -10 Z" fill="#16a34a" stroke="#fff" strokeWidth={1} />
        <text x={18} y={0} fontSize={11.5} fontWeight={700} fill="var(--muted)">상승(핀)</text>
        <circle cx={84} cy={-5} r={4.5} fill="var(--warn)" />
        <text x={94} y={0} fontSize={11.5} fontWeight={700} fill="var(--muted)">하락(점)</text>
      </g>
    </svg>
  );
}
