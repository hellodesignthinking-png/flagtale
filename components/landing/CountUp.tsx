"use client";

import { useEffect, useRef, useState } from "react";

// 마운트 시 0→target 카운트업(신뢰성 위해 IO 비의존). reduced-motion이면 즉시 값 표시.
export function CountUp({ to, duration = 1400, suffix = "", prefix = "", className }: { to: number; duration?: number; suffix?: string; prefix?: string; className?: string }) {
  const [v, setV] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setV(to);
      return;
    }
    let raf = 0;
    let startTs = 0;
    const step = (now: number) => {
      if (!startTs) startTs = now + 120; // 살짝 지연 후 시작
      const p = Math.max(0, Math.min(1, (now - startTs) / duration));
      setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    // rAF가 멈추는 환경(백그라운드 탭 등)에서도 최종값 보장
    const fallback = setTimeout(() => setV(to), duration + 500);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(fallback);
    };
  }, [to, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {v.toLocaleString()}
      {suffix}
    </span>
  );
}
