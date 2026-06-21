"use client";

import { useRef, type ReactNode } from "react";

// 가로 스크롤 캐러셀 + 좌/우 화살표(careet식). 모바일은 스와이프(화살표 숨김).
export function Carousel({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const go = (dir: number) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.85, 700), behavior: "smooth" });
  };
  return (
    <div className="relative">
      <div ref={ref} className="snap-row pb-2">
        {children}
      </div>
      <button
        type="button"
        aria-label="이전"
        onClick={() => go(-1)}
        className="absolute left-1 top-[34%] hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-line bg-card2 text-[20px] font-bold text-ink shadow-lg transition hover:border-amber hover:bg-amber hover:text-onaccent sm:grid"
      >
        ‹
      </button>
      <button
        type="button"
        aria-label="다음"
        onClick={() => go(1)}
        className="absolute right-1 top-[34%] hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-line bg-card2 text-[20px] font-bold text-ink shadow-lg transition hover:border-amber hover:bg-amber hover:text-onaccent sm:grid"
      >
        ›
      </button>
    </div>
  );
}
