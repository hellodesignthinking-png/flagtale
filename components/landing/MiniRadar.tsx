// 4축 미니 레이더(인구·상권·공간·인식) + 또래(업종) 평균 겹치기. 다크/라이트 테마 공용.
export interface Quad {
  d1: number;
  d2: number;
  d3: number;
  d4: number;
}

const AX = [
  { k: "인구", key: "d1" as const, a: -90 },
  { k: "상권", key: "d2" as const, a: 0 },
  { k: "공간", key: "d3" as const, a: 90 },
  { k: "인식", key: "d4" as const, a: 180 },
];

export function MiniRadar({ self, peer, dark, className }: { self: Quad; peer?: Quad; dark?: boolean; className?: string }) {
  const S = 172;
  const c = S / 2;
  const R = 50;
  const pt = (v: number, a: number): [number, number] => {
    const r = (Math.max(0, Math.min(100, v)) / 100) * R;
    const rad = (a * Math.PI) / 180;
    return [c + r * Math.cos(rad), c + r * Math.sin(rad)];
  };
  const poly = (q: Quad) => AX.map((x) => pt(q[x.key], x.a).join(",")).join(" ");
  const grid = dark ? "rgba(255,255,255,.14)" : "rgba(15,30,60,.12)";
  const mainStroke = dark ? "#9be15d" : "#65a30d";
  const mainFill = dark ? "rgba(155,225,93,.26)" : "rgba(101,163,13,.18)";
  const peerStroke = dark ? "rgba(255,255,255,.55)" : "rgba(100,116,139,.75)";
  const labelC = dark ? "#cdd8ec" : "#5b6470";

  return (
    <svg viewBox={`0 0 ${S} ${S}`} className={className ?? "mx-auto h-[150px] w-[150px]"} role="img" aria-label="4대 축 레이더(또래 평균 비교)">
      {[0.25, 0.5, 0.75, 1].map((t) => (
        <circle key={t} cx={c} cy={c} r={R * t} fill="none" stroke={grid} strokeWidth={1} />
      ))}
      {AX.map((x) => {
        const [ex, ey] = pt(100, x.a);
        return <line key={x.k} x1={c} y1={c} x2={ex} y2={ey} stroke={grid} strokeWidth={1} />;
      })}
      {peer && <polygon points={poly(peer)} fill="none" stroke={peerStroke} strokeWidth={1.5} strokeDasharray="3 3" />}
      <polygon points={poly(self)} fill={mainFill} stroke={mainStroke} strokeWidth={2} />
      {AX.map((x) => {
        const [px, py] = pt(self[x.key], x.a);
        return <circle key={x.k} cx={px} cy={py} r={2.6} fill={mainStroke} />;
      })}
      {AX.map((x) => {
        const [lx, ly] = pt(128, x.a);
        return (
          <text key={x.k} x={lx} y={ly} fontSize={10.5} fontWeight={800} fill={labelC} textAnchor="middle" dominantBaseline="middle">
            {x.k} {Math.round(self[x.key])}
          </text>
        );
      })}
    </svg>
  );
}
