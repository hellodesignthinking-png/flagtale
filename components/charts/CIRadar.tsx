// 범용 N축 레이더 — 문화영향평가·진단 등에서 공유. points는 0~100 값.
export function CIRadar({ points, color = "#3e9aa8", size = 340 }: { points: { label: string; value: number }[]; color?: string; size?: number }) {
  const N = points.length;
  const W = size, H = size * 0.88, cx = W / 2, cy = H * 0.5, R = W * 0.27;
  const pt = (i: number, rad: number): [number, number] => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / N;
    return [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad];
  };
  const rings = [0.25, 0.5, 0.75, 1].map((f) => points.map((_, i) => pt(i, R * f).join(",")).join(" "));
  const poly = points.map((p, i) => pt(i, (R * Math.max(0, Math.min(100, p.value))) / 100).join(",")).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="레이더 프로파일">
      {rings.map((rg, i) => <polygon key={i} points={rg} fill="none" stroke="var(--line)" strokeWidth={0.7} />)}
      {points.map((_, i) => { const [x, y] = pt(i, R); return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--line)" strokeWidth={0.7} />; })}
      <polygon points={poly} fill={`${color}38`} stroke={color} strokeWidth={2} />
      {points.map((p, i) => { const [x, y] = pt(i, (R * Math.max(0, Math.min(100, p.value))) / 100); return <circle key={i} cx={x} cy={y} r={3.2} fill={color} stroke="#fff" strokeWidth={1} />; })}
      {points.map((p, i) => {
        const [x, y] = pt(i, R + size * 0.06);
        const ax = Math.cos(-Math.PI / 2 + (i * 2 * Math.PI) / N);
        const anchor = ax > 0.3 ? "start" : ax < -0.3 ? "end" : "middle";
        return <text key={i} x={x} y={y} textAnchor={anchor} dominantBaseline="middle" fontSize={size * 0.031} fontWeight={700} fill="var(--muted)">{p.label}</text>;
      })}
      {points.map((p, i) => { const [x, y] = pt(i, (R * Math.max(0, Math.min(100, p.value))) / 100); return <text key={"v" + i} x={x} y={y - 8} textAnchor="middle" fontSize={size * 0.028} fontWeight={800} fill="var(--ink)">{p.value}</text>; })}
    </svg>
  );
}
