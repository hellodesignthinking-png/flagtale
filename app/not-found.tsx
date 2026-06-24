import Link from "next/link";

// 커스텀 404 — notFound() 또는 없는 경로 (이전: 영문 기본 화면)
export default function NotFound() {
  return (
    <div className="theme-light relative grid min-h-screen place-items-center overflow-hidden bg-navy px-6 pt-14 text-ink">
      <div className="deco-bg" aria-hidden />
      <div className="relative z-10 text-center">
        <div className="font-display text-[clamp(64px,14vw,140px)] font-black leading-none text-amber">404</div>
        <h1 className="mt-2 font-display text-[clamp(22px,3.4vw,30px)] font-black tracking-tight">페이지를 찾을 수 없어요</h1>
        <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-muted">주소가 바뀌었거나, 존재하지 않는 동네·리포트일 수 있어요.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          <Link href="/" className="btn-glow rounded-full bg-amber px-6 py-3 text-[15px] font-extrabold text-onaccent">홈으로 →</Link>
          <Link href="/map-tale" className="rounded-full border-[1.5px] border-line bg-card px-6 py-3 text-[15px] font-extrabold text-ink transition-colors hover:border-ink">플래그맵 탐색</Link>
        </div>
      </div>
    </div>
  );
}
