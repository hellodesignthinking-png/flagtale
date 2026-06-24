"use client";

import Link from "next/link";

// 라우트 에러 바운더리 — 렌더/서버 에러 시 (이전: 영문 기본 화면). 에러 바운더리는 클라이언트 컴포넌트 필수.
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="theme-light relative grid min-h-screen place-items-center overflow-hidden bg-navy px-6 pt-14 text-ink">
      <div className="deco-bg" aria-hidden />
      <div className="relative z-10 text-center">
        <div className="text-[52px]" aria-hidden>⚠️</div>
        <h1 className="mt-2 font-display text-[clamp(22px,3.4vw,30px)] font-black tracking-tight">문제가 발생했어요</h1>
        <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-muted">일시적인 오류일 수 있어요. 다시 시도하거나 홈으로 돌아가 주세요.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          <button onClick={reset} className="btn-glow rounded-full bg-amber px-6 py-3 text-[15px] font-extrabold text-onaccent">다시 시도</button>
          <Link href="/" className="rounded-full border-[1.5px] border-line bg-card px-6 py-3 text-[15px] font-extrabold text-ink transition-colors hover:border-ink">홈으로</Link>
        </div>
      </div>
    </div>
  );
}
