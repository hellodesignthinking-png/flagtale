"use client";

import { useEffect, useRef, type ReactNode } from "react";

// 스크롤 진입 시 페이드+업(.reveal→.is-in). delay로 시퀀스 연출.
export function Reveal({ children, className, delay = 0, as: Tag = "div" }: { children: ReactNode; className?: string; delay?: number; as?: "div" | "section" }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") return; // 미지원 → 그냥 보임
    el.classList.add("reveal-armed"); // JS 동작 확인 후에만 숨김(SSR/실패 시 보임 유지)
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            el.classList.add("is-in");
            io.unobserve(el);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    // 안전장치: 1.6s 내 미발화 시(스크롤 컨테이너 이슈 등) 강제 표시
    const t = setTimeout(() => el.classList.add("is-in"), 1600);
    return () => {
      io.disconnect();
      clearTimeout(t);
    };
  }, []);
  const style = delay ? { transitionDelay: `${delay}ms` } : undefined;
  return (
    <Tag ref={ref as never} className={`reveal ${className ?? ""}`} style={style}>
      {children}
    </Tag>
  );
}
