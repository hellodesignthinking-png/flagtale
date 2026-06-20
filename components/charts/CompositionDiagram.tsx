"use client";

import type { PlaceScore } from "@/lib/types";
import { signed } from "@/lib/utils";

// 4축 합성 다이어그램 — 가중치·점수 → KLAI 시각 공식 (가독성↑)
const AXES = [
  { key: "d1", label: "인구·지속성", short: "D1", w: 0.2, color: "#1E7A8C" },
  { key: "d2", label: "경제·상권", short: "D2", w: 0.3, color: "#D4861E" },
  { key: "d3", label: "공간·물리", short: "D3", w: 0.2, color: "#4B9CD3" },
  { key: "d4", label: "인식·감성", short: "D4", w: 0.3, color: "#0F6E5C" },
] as const;

export function CompositionDiagram({ score }: { score: PlaceScore }) {
  const vals = { d1: score.d1, d2: score.d2, d3: score.d3, d4: score.d4 } as Record<string, number>;
  const base = AXES.reduce((s, a) => s + a.w * vals[a.key], 0);

  return (
    <div>
      {/* 가중 막대 */}
      <div className="flex items-end gap-2" style={{ height: 150 }}>
        {AXES.map((a) => {
          const v = vals[a.key];
          const contrib = Math.round(a.w * v * 10) / 10;
          return (
            <div key={a.key} className="flex flex-1 flex-col items-center justify-end" style={{ flexGrow: a.w }}>
              <span className="mb-1 tnum text-[11px] font-bold" style={{ color: a.color }}>
                {v}
              </span>
              <div className="relative w-full overflow-hidden rounded-t-md bg-navy" style={{ height: `${v}%`, minHeight: 6 }}>
                <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${a.color}, ${a.color}99)` }} />
              </div>
              <div
                className="mt-1.5 w-full rounded-md py-0.5 text-center text-[10px] font-bold text-white"
                style={{ background: a.color }}
              >
                {Math.round(a.w * 100)}%
              </div>
              <div className="mt-1 text-center text-[10px] font-semibold text-ink">{a.short}</div>
              <div className="text-center text-[9px] leading-tight text-muted2">{a.label}</div>
              <div className="mt-0.5 tnum text-[10px] text-muted">+{contrib}</div>
            </div>
          );
        })}

        {/* = 결과 */}
        <div className="flex flex-col items-center justify-end self-stretch pl-1">
          <span className="mb-1 text-lg font-black text-muted2">=</span>
          <div className="flex h-full flex-col items-center justify-center rounded-xl border border-blue/40 bg-blue/10 px-3">
            <div className="tnum text-2xl font-black text-blue-l">{score.klai}</div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-muted2">KLAI</div>
          </div>
        </div>
      </div>

      {/* 공식 */}
      <div className="mt-3 rounded-lg border border-line bg-navy/40 px-3 py-2 text-center text-[11.5px] text-muted">
        가중합 <b className="text-ink tnum">{Math.round(base * 10) / 10}</b>{" "}
        <span className="text-muted2">+ 모멘텀</span>{" "}
        <b className={score.momentum >= 0 ? "text-grade-b tnum" : "text-warn tnum"}>{signed(score.momentum)}</b>{" "}
        <span className="text-muted2">→ KLAI</span> <b className="text-blue-l tnum">{score.klai}</b>
        {score.gentriFlag && <span className="ml-1 text-warn">· ⚠ 젠트리 상한·감점</span>}
      </div>
    </div>
  );
}
