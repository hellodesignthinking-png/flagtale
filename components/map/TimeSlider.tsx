"use client";

import { useEffect } from "react";
import { useMapStore } from "@/lib/store";
import { formatPeriod } from "@/lib/utils";

export function TimeSlider() {
  const { periods, periodIndex, playing, setPeriodIndex, togglePlay, stepPeriod, setPlaying } = useMapStore();

  // 재생 애니메이션: 900ms 마다 기간 스텝
  useEffect(() => {
    if (!playing || periods.length === 0) return;
    const id = setInterval(() => stepPeriod(), 900);
    return () => clearInterval(id);
  }, [playing, periods.length, stepPeriod]);

  if (periods.length === 0) return null;
  const current = periods[periodIndex] ?? periods[periods.length - 1];

  return (
    <div className="klai-panel flex items-center gap-3 px-4 py-2.5">
      <button
        onClick={togglePlay}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber text-[#ffffff] transition-transform hover:scale-105"
        aria-label={playing ? "일시정지" : "재생"}
      >
        {playing ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <rect x="2" y="1" width="3.5" height="12" rx="1" />
            <rect x="8.5" y="1" width="3.5" height="12" rx="1" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M2 1.5v11l10-5.5z" />
          </svg>
        )}
      </button>

      <div className="flex flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <span className="text-[11px] uppercase tracking-wider text-amber">기간</span>
          <span className="text-sm font-extrabold tabular-nums text-ink">{formatPeriod(current)}</span>
          <span className="text-[11px] text-muted2">
            시간 재생 시 동 색이 변해갑니다
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={periods.length - 1}
          value={periodIndex}
          onChange={(e) => {
            setPlaying(false);
            setPeriodIndex(Number(e.target.value));
          }}
          className="h-1.5 w-[260px] cursor-pointer appearance-none rounded-full bg-line accent-[#4B9CD3] sm:w-[340px]"
        />
        <div className="flex justify-between text-[9.5px] tabular-nums text-muted2">
          <span>{periods[0]}</span>
          <span>{periods[periods.length - 1]}</span>
        </div>
      </div>
    </div>
  );
}
