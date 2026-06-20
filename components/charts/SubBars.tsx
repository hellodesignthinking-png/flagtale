"use client";

import { deriveSubs, gradeOf } from "@/lib/scoring";
import { GRADE_HEX } from "@/lib/constants";
import type { PlaceScore } from "@/lib/types";

const AXIS_COLOR: Record<string, string> = {
  d1: "#1E7A8C",
  d2: "#D4861E",
  d3: "#4B9CD3",
  d4: "#0F6E5C",
};
const AXIS_LABEL: Record<string, string> = {
  d1: "D1",
  d2: "D2",
  d3: "D3",
  d4: "D4",
};

export function SubBars({ admCd2, score }: { admCd2: string; score: PlaceScore }) {
  const subs = deriveSubs(admCd2, score);
  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
      {subs.map((s, i) => {
        const hex = GRADE_HEX[gradeOf(s.value)];
        return (
          <div key={i} className="flex items-center gap-2">
            <span className="w-7 shrink-0 text-center text-[10px] font-bold" style={{ color: AXIS_COLOR[s.axis] }}>
              {AXIS_LABEL[s.axis]}
            </span>
            <span className="w-[88px] shrink-0 truncate text-[11px] text-muted">{s.label}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-navy2/60">
              <div
                className="h-full rounded-full transition-[width] duration-700 ease-out"
                style={{
                  width: `${s.value}%`,
                  background: `linear-gradient(90deg, ${hex}99, ${hex})`,
                  boxShadow: `0 0 6px ${hex}77`,
                }}
              />
            </div>
            <span className="w-6 shrink-0 text-right text-[11px] font-semibold tabular-nums" style={{ color: hex }}>
              {s.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}
