// 전국 동네 변화 분포 — 경량 SVG 지리 스캐터(서버 렌더, maplibre 불필요·항상 렌더).
// 행정동 중심 좌표를 한반도 경계에 투영해 상승(라임)·하락(로즈) 점으로 표시.
export interface ScatterPoint {
  lng: number;
  lat: number;
  kind: "riser" | "faller";
  momentum: number;
  name: string;
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
  const maxM = Math.max(1, ...points.map((p) => Math.abs(p.momentum)));
  const top = points.filter((p) => p.kind === "riser").sort((a, b) => b.momentum - a.momentum)[0];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} role="img" aria-label="전국 동네 변화 분포 지도" preserveAspectRatio="xMidYMid meet">
      {/* graticule(위경도 격자) — 지리 맵 느낌 */}
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

      {/* 점 — 상승(라임/에메랄드)·하락(로즈), 크기=|모멘텀| */}
      {points.map((p, i) => {
        const r = 4 + (Math.abs(p.momentum) / maxM) * 6.5;
        const c = p.kind === "riser" ? "#16a34a" : "var(--warn)";
        return <circle key={i} cx={px(p.lng)} cy={py(p.lat)} r={r} fill={c} opacity={0.82} stroke="#fff" strokeWidth={1.2} />;
      })}

      {/* 1위 펄스 + 라벨 */}
      {top && (
        <g>
          <circle cx={px(top.lng)} cy={py(top.lat)} r={9} fill="none" stroke="#16a34a" strokeWidth={2} className="klai-pulse-ring" />
          <text x={px(top.lng) + 12} y={py(top.lat) + 4} fontSize={12} fontWeight={800} fill="var(--ink)">
            {top.name} +{top.momentum}
          </text>
        </g>
      )}

      {/* 범례 */}
      <g transform={`translate(${PAD + 2}, ${H - 14})`}>
        <circle cx={6} cy={-4} r={5} fill="#16a34a" />
        <text x={16} y={0} fontSize={11.5} fontWeight={700} fill="var(--muted)">상승</text>
        <circle cx={66} cy={-4} r={5} fill="var(--warn)" />
        <text x={76} y={0} fontSize={11.5} fontWeight={700} fill="var(--muted)">하락</text>
      </g>
    </svg>
  );
}
