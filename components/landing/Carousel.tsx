"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

// 가로 스크롤 캐러셀 + 좌/우 화살표(끝단 비활성). 모바일은 스와이프(화살표 숨김).
export function Carousel({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const sync = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 2);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    sync();
    const el = ref.current;
    if (!el) return;
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      el.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [sync]);

  const go = (dir: number) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.85, 700), behavior: "smooth" });
  };

  const btn = "absolute top-[34%] hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-line bg-card2 text-[20px] font-bold text-ink shadow-lg transition hover:border-amber hover:bg-amber hover:text-onaccent disabled:cursor-default disabled:opacity-0 sm:grid";

  return (
    <div className="relative">
      <div ref={ref} className="snap-row pb-2">
        {children}
      </div>
      <button type="button" aria-label="이전" onClick={() => go(-1)} disabled={atStart} className={`${btn} left-1`}>
        ‹
      </button>
      <button type="button" aria-label="다음" onClick={() => go(1)} disabled={atEnd} className={`${btn} right-1`}>
        ›
      </button>
    </div>
  );
}
