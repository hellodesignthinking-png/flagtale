"use client";

import { useEffect, useState } from "react";

// 접속 시: 배경 여행 영상 위로 "로컬의 발견 → 경험 → 탐구 → 학습"이 0.5초 간격 롤링 → 페이드아웃 → 플래그맵.
// 세션당 1회. 배경 영상은 /public/intro-bg.mp4 (없으면 여행 톤 그라데이션 폴백).
const WORDS = ["발견", "경험", "탐구", "학습"];

export function IntroSplash() {
  const [phase, setPhase] = useState<"hidden" | "in" | "out">("hidden");
  const [idx, setIdx] = useState(0);
  const [videoOk, setVideoOk] = useState(true);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("ft_intro")) return;
      sessionStorage.setItem("ft_intro", "1");
    } catch { /* private mode */ }
    setPhase("in");
    let i = 0;
    const roll = setInterval(() => {
      i += 1;
      if (i >= WORDS.length - 1) { setIdx(WORDS.length - 1); clearInterval(roll); }
      else setIdx(i);
    }, 520);
    const tOut = setTimeout(() => setPhase("out"), 2950);
    const tHide = setTimeout(() => setPhase("hidden"), 3650);
    return () => { clearInterval(roll); clearTimeout(tOut); clearTimeout(tHide); };
  }, []);

  if (phase === "hidden") return null;

  return (
    <div
      className="fixed inset-0 z-[300] overflow-hidden transition-opacity duration-700"
      style={{ opacity: phase === "out" ? 0 : 1, pointerEvents: phase === "out" ? "none" : "auto" }}
      aria-hidden
    >
      {/* 배경: 여행 톤 그라데이션(폴백) + 영상(있으면) */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,#0a0c12 0%,#0d1b30 45%,#143a52 75%,#1d5b63 100%)", backgroundSize: "200% 200%", animation: "ftBgPan 12s ease infinite" }} />
      {videoOk && (
        <video
          autoPlay muted loop playsInline
          onError={() => setVideoOk(false)}
          className="absolute inset-0 h-full w-full object-cover opacity-50"
        >
          <source src="/intro-bg.mp4" type="video/mp4" />
        </video>
      )}
      <div className="absolute inset-0" style={{ background: "radial-gradient(120% 80% at 50% 40%, transparent 30%, rgba(6,8,14,.72) 100%)" }} />

      {/* 문구 */}
      <div className="relative grid h-full place-items-center px-6 text-center">
        <div>
          <div className="mb-4 text-[12px] font-extrabold uppercase tracking-[0.34em]" style={{ color: "#a3e635", opacity: 0, animation: "ftWordIn .6s ease forwards" }}>
            FLAGTALE
          </div>
          <div className="font-display text-[clamp(34px,9vw,78px)] font-black leading-tight tracking-tight" style={{ color: "#f4f4f5" }}>
            <span style={{ opacity: 0, animation: "ftWordIn .5s ease forwards" }}>로컬의</span>{" "}
            <span className="inline-block h-[1.12em] overflow-hidden" style={{ verticalAlign: "-0.1em" }}>
              <span className="flex flex-col transition-transform duration-[450ms] ease-out" style={{ transform: `translateY(-${idx * 1.12}em)`, color: "#a3e635" }}>
                {WORDS.map((w) => (
                  <span key={w} className="h-[1.12em] leading-[1.12em]">{w}</span>
                ))}
              </span>
            </span>
          </div>
          <div className="mt-4 text-[13px] font-medium sm:text-[14px]" style={{ color: "#cbd5e1", opacity: 0, animation: "ftWordIn .6s ease .55s forwards" }}>
            가장 로컬다운 이야기로 시작하는 여행
          </div>
        </div>
      </div>
    </div>
  );
}
