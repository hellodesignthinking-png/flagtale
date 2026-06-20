"use client";

import { useEffect, useRef, useState } from "react";

// ── 시간 보간 헬퍼 (2016=0 → 2026=1) ──────────────────────────
const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
const ease = (k: number) => (k < 0 ? 0 : k > 1 ? 1 : k * k * (3 - 2 * k)); // smoothstep
function track(t: number, pts: [number, number][]) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [t0, v0] = pts[i];
    const [t1, v1] = pts[i + 1];
    if (t <= t1) {
      const k = (t - t0) / (t1 - t0 || 1);
      return v0 + (v1 - v0) * ease(k);
    }
  }
  return pts[pts.length - 1][1];
}

// 성수동형 젠트리 아크 — 로컬 주도 → 자본 잠식
const LOCAL: [number, number][] = [[0, 88], [0.5, 80], [1, 58]];
const PUBLIC: [number, number][] = [[0, 34], [0.5, 68], [1, 50]];
const CAPITAL: [number, number][] = [[0, 8], [0.45, 28], [1, 86]];
const SENT: [number, number][] = [[0, 24], [0.5, 78], [1, 30]];
const D1A: [number, number][] = [[0, 50], [1, 58]];
const D2A: [number, number][] = [[0, 45], [0.55, 82], [1, 70]];
const D3A: [number, number][] = [[0, 48], [1, 66]];
const D4A: [number, number][] = [[0, 40], [0.5, 92], [1, 62]];
const RENT: [number, number][] = [[0, 38], [1, 94]];
const REV: [number, number][] = [[0, 38], [0.6, 90], [1, 63]];

export function DerivedDiagrams() {
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(true);
  const raf = useRef<number | undefined>(undefined);
  const last = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!playing) return;
    const loop = (now: number) => {
      if (last.current == null) last.current = now;
      const dt = (now - last.current) / 1000;
      last.current = now;
      setT((prev) => {
        let n = prev + dt / 9; // 9초 1회전
        if (n > 1) n = 0;
        return n;
      });
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      last.current = undefined;
    };
  }, [playing]);

  const year = Math.round(2016 + t * 10);
  const local = track(t, LOCAL);
  const pub = track(t, PUBLIC);
  const cap = track(t, CAPITAL);
  const sent = Math.round(track(t, SENT));
  const d1 = track(t, D1A);
  const d2 = track(t, D2A);
  const d3 = track(t, D3A);
  const d4 = track(t, D4A);
  const klai = Math.round(0.2 * d1 + 0.3 * d2 + 0.2 * d3 + 0.3 * d4);
  const grade = klai >= 85 ? "S" : klai >= 70 ? "A" : klai >= 55 ? "B" : klai >= 40 ? "C" : klai >= 25 ? "D" : "E";

  return (
    <div>
      {/* 시간 컨트롤러 */}
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-gradient-to-r from-blue/10 via-card2/30 to-amber/10 p-3 backdrop-blur">
        <button
          onClick={() => { last.current = undefined; setPlaying((p) => !p); }}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-l to-amber text-white shadow-lg transition-transform hover:scale-105"
          aria-label={playing ? "일시정지" : "재생"}
        >
          {playing ? "❚❚" : "▶"}
        </button>
        <div className="flex items-baseline gap-2">
          <span className="bg-gradient-to-r from-blue-l to-amber bg-clip-text text-2xl font-black tabular-nums text-transparent">{year}</span>
          <span className="text-[11px] text-muted2">동네 흐름 재생 · 2016 → 2026</span>
        </div>
        <div className="flex-1" />
        <span className="hidden shrink-0 items-center gap-1.5 text-[11px] text-muted sm:flex">
          단계
          <b className="rounded-full bg-card2 px-2 py-0.5 font-bold text-ink">
            {t < 0.25 ? "① 형성" : t < 0.45 ? "② 확산" : t < 0.62 ? "③ 절정" : t < 0.82 ? "④ 젠트리" : "⑤ 쇠퇴"}
          </b>
        </span>
      </div>
      {/* 스크러버 */}
      <div className="mb-5">
        <input
          type="range"
          min={0}
          max={1000}
          value={Math.round(t * 1000)}
          onChange={(e) => { setPlaying(false); setT(Number(e.target.value) / 1000); }}
          className="klai-scrub w-full"
          aria-label="연도 스크러브"
        />
        <div className="mt-1 flex justify-between px-0.5 text-[9.5px] tabular-nums text-muted2">
          {[2016, 2018, 2020, 2022, 2024, 2026].map((y) => <span key={y}>{y}</span>)}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="① 4축 합성 → KLAI" desc="가중합 종합 매력도가 시간따라 변화. *축 점수 샘플." accent="var(--blue-l)">
          <Composition d1={d1} d2={d2} d3={d3} d4={d4} klai={klai} grade={grade} />
        </Card>
        <Card title="② 미디어 센티먼트" desc="기사 긍정(+)·부정(−) 순지수 → D4 가감." accent="var(--green)">
          <SentimentGauge sent={sent} />
        </Card>
        <Card title="③ 활성화 동인 분해" desc="로컬·공공·자본 중 무엇이 주도하는지 시간따라 역전." accent="var(--amber)">
          <Drivers local={local} pub={pub} cap={cap} />
        </Card>
        <Card title="④ rent-to-revenue 발산" desc="임대료 vs 매출 — 벌어지면 쇠퇴 신호." accent="var(--warn)">
          <Divergence t={t} year={year} />
        </Card>
      </div>
    </div>
  );
}

function Card({ title, desc, accent, children }: { title: string; desc: string; accent: string; children: React.ReactNode }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-card2/50 to-navy2/20 p-4 backdrop-blur transition-colors hover:border-[color:var(--muted2)]">
      <span className="absolute left-0 top-0 h-full w-1 rounded-r" style={{ background: accent, boxShadow: `0 0 16px ${accent}` }} />
      <div className="pl-2">
        <div className="text-[13px] font-extrabold text-ink">{title}</div>
        <div className="mb-2 text-[11px] leading-snug text-muted2">{desc}</div>
        {children}
      </div>
    </div>
  );
}

// ── ① 4축 합성 ────────────────────────────────────────────────
function Composition({ d1, d2, d3, d4, klai, grade }: { d1: number; d2: number; d3: number; d4: number; klai: number; grade: string }) {
  const axes = [
    { k: "D1", v: d1, w: "20%", c: "rgb(75,156,211)" },
    { k: "D2", v: d2, w: "30%", c: "rgb(24,226,74)" },
    { k: "D3", v: d3, w: "20%", c: "rgb(139,110,246)" },
    { k: "D4", v: d4, w: "30%", c: "rgb(226,138,58)" },
  ];
  const gradeC: Record<string, string> = { S: "#0F6E5C", A: "#1E7A8C", B: "#3E9AA8", C: "#E2A33A", D: "#D2691E", E: "#A23A2A" };
  return (
    <div className="flex items-end gap-4">
      <svg viewBox="0 0 210 132" className="h-[132px] flex-1">
        {axes.map((a, i) => {
          const x = 12 + i * 50;
          const h = (a.v / 100) * 96;
          return (
            <g key={a.k}>
              <rect x={x} y={108 - 96} width={34} height={96} rx={5} fill="var(--navy2)" opacity={0.5} />
              <rect x={x} y={108 - h} width={34} height={h} rx={5} fill={a.c} style={{ filter: `drop-shadow(0 0 5px ${a.c}88)`, transition: "none" }} />
              <text x={x + 17} y={104 - h} textAnchor="middle" fontSize="9.5" fontWeight={800} fill={a.c}>{Math.round(a.v)}</text>
              <text x={x + 17} y={122} textAnchor="middle" fontSize="9.5" fontWeight={700} fill="var(--muted)">{a.k}</text>
              <text x={x + 17} y={131} textAnchor="middle" fontSize="7.5" fill="var(--muted2)">{a.w}</text>
            </g>
          );
        })}
      </svg>
      <div className="shrink-0 text-center">
        <div className="text-[10px] text-muted2">종합 KLAI</div>
        <div className="bg-gradient-to-br from-ink to-muted bg-clip-text text-[34px] font-black leading-none tabular-nums text-transparent">{klai}</div>
        <div className="mt-1 inline-grid h-8 w-8 place-items-center rounded-lg text-[15px] font-black text-white" style={{ background: gradeC[grade], boxShadow: `0 0 14px ${gradeC[grade]}aa` }}>{grade}</div>
      </div>
    </div>
  );
}

// ── ② 센티먼트 게이지 ─────────────────────────────────────────
function SentimentGauge({ sent }: { sent: number }) {
  const cx = 105, cy = 104, r = 78;
  const ang = (Math.PI * (1 - (sent + 100) / 200)); // +100→0(우), -100→π(좌)
  const nx = cx + r * Math.cos(ang);
  const ny = cy - r * Math.sin(ang);
  const col = sent >= 40 ? "var(--green)" : sent >= 0 ? "var(--blue-l)" : sent >= -40 ? "var(--amber)" : "var(--warn)";
  return (
    <div className="flex items-center gap-3">
      <svg viewBox="0 0 210 120" className="h-[120px] flex-1">
        <defs>
          <linearGradient id="gauge" x1="0" x2="1">
            <stop offset="0%" stopColor="var(--warn)" />
            <stop offset="50%" stopColor="var(--muted2)" />
            <stop offset="100%" stopColor="var(--green)" />
          </linearGradient>
        </defs>
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="url(#gauge)" strokeWidth="11" strokeLinecap="round" opacity={0.85} />
        <text x={cx - r} y={cy + 14} fontSize="8.5" fill="var(--warn)">−100</text>
        <text x={cx + r} y={cy + 14} textAnchor="end" fontSize="8.5" fill="var(--green)">+100</text>
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={col} strokeWidth="3" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 5px ${col})` }} />
        <circle cx={cx} cy={cy} r="6" fill={col} />
      </svg>
      <div className="shrink-0 text-center">
        <div className="text-[10px] text-muted2">센티먼트</div>
        <div className="text-[30px] font-black leading-none tabular-nums" style={{ color: col }}>{sent > 0 ? "+" : ""}{sent}</div>
        <div className="mt-0.5 text-[10px] font-bold" style={{ color: col }}>{sent >= 40 ? "긍정 우세" : sent >= 0 ? "약긍정" : "부정 우세"}</div>
      </div>
    </div>
  );
}

// ── ③ 동인 분해 ───────────────────────────────────────────────
function Drivers({ local, pub, cap }: { local: number; pub: number; cap: number }) {
  const rows = [
    { k: "로컬크리에이터·자생", v: local, c: "var(--green)" },
    { k: "공공지원·예산", v: pub, c: "var(--blue-l)" },
    { k: "자본·부동산(젠트리)", v: cap, c: "var(--amber)" },
  ];
  const lead = rows.reduce((a, b) => (b.v > a.v ? b : a));
  return (
    <div className="space-y-2.5">
      <div className="text-[10px] text-muted2">주도 동인 <b style={{ color: lead.c }}>{lead.k.split("·")[0]}</b></div>
      {rows.map((d) => {
        const on = d.k === lead.k;
        return (
          <div key={d.k}>
            <div className="mb-0.5 flex justify-between text-[10.5px]">
              <span className={on ? "font-extrabold text-ink" : "font-medium text-muted"}>{d.k}</span>
              <span className="font-black tabular-nums" style={{ color: d.c }}>{Math.round(d.v)}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-navy2/60">
              <div className="h-full rounded-full" style={{ width: `${d.v}%`, background: d.c, boxShadow: on ? `0 0 10px ${d.c}` : "none" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── ④ rent-to-revenue 발산 ────────────────────────────────────
function Divergence({ t, year }: { t: number; year: number }) {
  const W = 210, H = 132, padL = 8, padR = 8, padT = 12, padB = 18;
  const x = (τ: number) => padL + (W - padL - padR) * τ;
  const y = (v: number) => padT + (H - padT - padB) * (1 - v / 100);
  const N = 64;
  const rentPts: [number, number][] = [];
  const revPts: [number, number][] = [];
  const divTop: [number, number][] = [];
  const divBot: [number, number][] = [];
  for (let i = 0; i <= N; i++) {
    const τ = i / N;
    if (τ > t + 1e-6) break;
    const rv = clamp(track(τ, RENT));
    const sv = clamp(track(τ, REV));
    rentPts.push([x(τ), y(rv)]);
    revPts.push([x(τ), y(sv)]);
    if (rv > sv) { divTop.push([x(τ), y(rv)]); divBot.push([x(τ), y(sv)]); }
  }
  const d = (p: [number, number][]) => p.map((q, i) => (i ? "L" : "M") + q[0].toFixed(1) + " " + q[1].toFixed(1)).join(" ");
  const rentEnd = rentPts[rentPts.length - 1];
  const revEnd = revPts[revPts.length - 1];
  const diverging = divTop.length > 2;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <defs>
          <linearGradient id="divfill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--warn)" stopOpacity="0.32" />
            <stop offset="100%" stopColor="var(--warn)" stopOpacity="0.04" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((g) => <line key={g} x1={padL} x2={W - padR} y1={y(g * 100)} y2={y(g * 100)} stroke="var(--line)" strokeOpacity={0.5} />)}
        {divTop.length > 1 && <path d={`${d(divTop)} L ${divBot.slice().reverse().map((q) => q[0].toFixed(1) + " " + q[1].toFixed(1)).join(" L ")} Z`} fill="url(#divfill)" />}
        <path d={d(revPts)} fill="none" stroke="var(--green)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d={d(rentPts)} fill="none" stroke="var(--amber)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        {revEnd && <circle cx={revEnd[0]} cy={revEnd[1]} r="3.2" fill="var(--green)" style={{ filter: "drop-shadow(0 0 4px var(--green))" }} />}
        {rentEnd && <circle cx={rentEnd[0]} cy={rentEnd[1]} r="3.2" fill="var(--amber)" style={{ filter: "drop-shadow(0 0 4px var(--amber))" }} />}
        {rentEnd && <text x={Math.min(rentEnd[0], W - 30)} y={padT - 2} fontSize="9" fontWeight={800} fill="var(--ink)">{year}</text>}
      </svg>
      <div className="mt-1 flex items-center gap-3 text-[10px]">
        <span className="flex items-center gap-1"><i className="inline-block h-2 w-2 rounded-full" style={{ background: "var(--amber)" }} />임대료(하방경직)</span>
        <span className="flex items-center gap-1"><i className="inline-block h-2 w-2 rounded-full" style={{ background: "var(--green)" }} />매출</span>
        {diverging && <span className="ml-auto font-bold text-[color:var(--warn)]">발산 = 쇠퇴 ▲</span>}
      </div>
    </div>
  );
}
