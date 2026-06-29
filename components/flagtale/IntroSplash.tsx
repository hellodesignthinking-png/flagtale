"use client";

import { useEffect, useState } from "react";

// 접속 시 "로컬의 발견 · 경험 · 탐구 · 학습" 문구가 떴다가 사라지고 플래그맵이 드러난다.
// 세션당 1회(sessionStorage)만 — 재방문 시 방해 없음.
export function IntroSplash() {
  const [phase, setPhase] = useState<"hidden" | "in" | "out">("hidden");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem("ft_intro")) return;
      sessionStorage.setItem("ft_intro", "1");
    } catch { /* private mode 등 — 그냥 1회 보여줌 */ }
    setPhase("in");
    const t1 = setTimeout(() => setPhase("out"), 1950);
    const t2 = setTimeout(() => setPhase("hidden"), 2650);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (phase === "hidden") return null;
  const words = ["로컬의", "발견", "경험", "탐구", "학습"];

  return (
    <div
      className="fixed inset-0 z-[300] grid place-items-center transition-opacity duration-700"
      style={{ background: "#0a0c12", opacity: phase === "out" ? 0 : 1, pointerEvents: phase === "out" ? "none" : "auto" }}
      aria-hidden
    >
      <div className="px-6 text-center">
        <div
          className="mb-4 text-[12px] font-extrabold uppercase tracking-[0.34em]"
          style={{ color: "#a3e635", opacity: 0, animation: "ftWordIn .6s ease forwards" }}
        >
          FLAGTALE
        </div>
        <div className="font-display text-[clamp(30px,8.5vw,70px)] font-black leading-tight tracking-tight" style={{ color: "#f4f4f5" }}>
          {words.map((w, i) => (
            <span key={i} className="inline-block" style={{ opacity: 0, animation: `ftWordIn .55s cubic-bezier(.2,.7,.3,1) ${0.25 + i * 0.2}s forwards` }}>
              {w}
              {i < words.length - 1 && <span className="mx-1.5 sm:mx-2.5" style={{ color: "#a3e635" }}>·</span>}
            </span>
          ))}
        </div>
        <div
          className="mt-4 text-[13px] font-medium"
          style={{ color: "#a1a1aa", opacity: 0, animation: "ftWordIn .6s ease 1.15s forwards" }}
        >
          가장 로컬다운 이야기로 시작하는 발견·경험·탐구·학습
        </div>
      </div>
    </div>
  );
}
