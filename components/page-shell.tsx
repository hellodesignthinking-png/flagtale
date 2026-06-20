import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** 콘텐츠 페이지(지도 외) 공통 셸 — 상단 헤더 여백 + 컨테이너 + 푸터 */
export function PageShell({
  children,
  className,
  width = "default",
}: {
  children: ReactNode;
  className?: string;
  width?: "default" | "wide" | "narrow";
}) {
  const max =
    width === "wide" ? "max-w-[1400px]" : width === "narrow" ? "max-w-3xl" : "max-w-6xl";
  return (
    <div className="theme-light min-h-screen bg-navy pt-14 text-ink">
      <main className={cn("mx-auto px-4 py-8 sm:px-6 sm:py-10", max, className)}>{children}</main>
      <SiteFooter />
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 text-[12px] text-muted2 sm:flex-row sm:items-center">
        <span className="font-extrabold tracking-wide text-muted">
          ZeroSite · NutUnion — KLAI Platform
        </span>
        <span className="sm:ml-2">
          개념 검증(MVP) · 샘플·잠정 데이터 · 야놀자 축제지수 + 도시활력·상권·소멸·젠트리 연구 결합
        </span>
        <nav className="flex gap-4 sm:ml-auto">
          <Link href="/data" className="hover:text-ink">
            데이터 출처
          </Link>
          <Link href="/reports" className="hover:text-ink">
            리포트
          </Link>
          <Link href="/pricing" className="hover:text-ink">
            가격
          </Link>
          <Link href="/dashboard" className="hover:text-ink">
            기관
          </Link>
        </nav>
      </div>
    </footer>
  );
}
