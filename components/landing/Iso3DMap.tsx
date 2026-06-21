// 전국 3D 아이소메트릭 매력도 — 동네별 KLAI를 입체 컬럼 높이로, 상승(초록)/하락(로즈) 음영.
// 서버 렌더 SVG(항상 렌더·경량). viewBox를 콘텐츠에 맞춰 동적 프레이밍 → 군집 데이터도 화면을 가득 채움.
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
  const LNG0 = Math.min(...points.map((p) => p.lng));
  const LNG1 = Math.max(...points.map((p) => p.lng));
  const LAT0 = Math.min(...points.map((p) => p.lat));
  const LAT1 = Math.max(...points.map((p) => p.lat));
  const padLng = Math.max((LNG1 - LNG0) * 0.18, 0.08);
  const padLat = Math.max((LAT1 - LAT0) * 0.18, 0.08);
  const lo0 = LNG0 - padLng;
  const lo1 = LNG1 + padLng;
  const la0 = LAT0 - padLat;
  const la1 = LAT1 + padLat;
  const UX = 360;
  const UY = 84;
  const ox = 480;
  const oy = 180;
  const fw = 13;
  const fy = 6.5;
  const gx = (lng: number) => (lng - lo0) / (lo1 - lo0);
  const gy = (lat: number) => (la1 - lat) / (la1 - la0); // 북쪽=뒤
  const corner = (X: number, Y: number) => ({ x: ox + (X - Y) * UX, y: oy + (X + Y) * UY });
  const cols = points
    .map((p) => {
      const X = gx(p.lng);
      const Y = gy(p.lat);
      return { ...p, bx: ox + (X - Y) * UX, by: oy + (X + Y) * UY, depth: X + Y, h: 16 + (p.klai / 100) * 110 };
    })
    .sort((a, b) => a.depth - b.depth);
  const labelNames = new Set([...points].sort((a, b) => b.momentum - a.momentum).slice(0, 1).map((p) => p.name));

  // 콘텐츠 바운딩 → viewBox 동적 프레이밍(컨테이너 가로비에 맞춰 좌우 여백 확보)
  const minX = Math.min(...cols.map((c) => c.bx - fw));
  const maxX = Math.max(...cols.map((c) => c.bx + fw));
  const minTop = Math.min(...cols.map((c) => c.by - c.h));
  const maxBot = Math.max(...cols.map((c) => c.by + fy));
  const vbY = minTop - 40;
  const vbH = maxBot + 18 - vbY;
  const contentW = maxX - minX;
  const desiredW = vbH * 2.3;
  const padX = Math.max(40, (desiredW - contentW) / 2);
  const vbX = minX - padX;
  const vbW = contentW + padX * 2;

  const back = corner(0, 0);
  const right = corner(1, 0);
  const front = corner(1, 1);
  const left = corner(0, 1);

  return (
    <svg viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`} className={className} role="img" aria-label="전국 3D 매력도 다이어그램(컬럼 높이=KLAI, 색=상승/하락)" preserveAspectRatio="xMidYMid meet">
      {/* 아이소 지면 + 격자 */}
      <polygon points={`${back.x},${back.y} ${right.x},${right.y} ${front.x},${front.y} ${left.x},${left.y}`} fill="#eaf0f2" stroke="var(--line)" strokeWidth={1} />
      {[0.2, 0.4, 0.6, 0.8].map((t) => {
        const a = corner(t, 0);
        const b = corner(t, 1);
        const c = corner(0, t);
        const d = corner(1, t);
        return (
          <g key={t} stroke="var(--line)" strokeWidth={0.8} opacity={0.55}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
            <line x1={c.x} y1={c.y} x2={d.x} y2={d.y} />
          </g>
        );
      })}

      {/* 컬럼(뒤→앞) */}
      {cols.map((c, i) => {
        const sh = SHADE[c.kind];
        const ty = c.by - c.h;
        const topFace = `${c.bx},${ty - fy} ${c.bx + fw},${ty} ${c.bx},${ty + fy} ${c.bx - fw},${ty}`;
        const leftFace = `${c.bx - fw},${ty} ${c.bx},${ty + fy} ${c.bx},${c.by + fy} ${c.bx - fw},${c.by}`;
        const rightFace = `${c.bx},${ty + fy} ${c.bx + fw},${ty} ${c.bx + fw},${c.by} ${c.bx},${c.by + fy}`;
        return (
          <g key={i}>
            <ellipse cx={c.bx} cy={c.by + fy} rx={fw + 2} ry={4} fill="#000" opacity={0.12} />
            <polygon points={leftFace} fill={sh.left} />
            <polygon points={rightFace} fill={sh.right} />
            <polygon points={topFace} fill={sh.top} stroke="#fff" strokeWidth={0.8} />
            <text x={c.bx} y={ty - 7} fontSize={10} fontWeight={800} fill="#fff" textAnchor="middle" style={{ paintOrder: "stroke" }} stroke={c.kind === "riser" ? "#15803d" : "#be123c"} strokeWidth={2.5}>
              {c.klai}
            </text>
            {labelNames.has(c.name) && (
              <text x={c.bx} y={ty - 21} fontSize={11.5} fontWeight={800} fill="var(--ink)" stroke="#fff" strokeWidth={3} paintOrder="stroke" textAnchor="middle">
                {c.name} · {c.reason}
              </text>
            )}
          </g>
        );
      })}

      {/* 범례(동적 좌하단) */}
      <g transform={`translate(${vbX + 12}, ${vbY + vbH - 10})`}>
        <rect x={0} y={-10} width={12} height={10} fill={SHADE.riser.top} />
        <text x={18} y={0} fontSize={12} fontWeight={700} fill="var(--muted)">상승</text>
        <rect x={62} y={-10} width={12} height={10} fill={SHADE.faller.top} />
        <text x={80} y={0} fontSize={12} fontWeight={700} fill="var(--muted)">하락</text>
        <text x={134} y={0} fontSize={11.5} fontWeight={600} fill="var(--muted2)">기둥 높이 = KLAI</text>
      </g>
    </svg>
  );
}
