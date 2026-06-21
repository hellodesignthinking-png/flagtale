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
    <div className="theme-light relative min-h-screen overflow-hidden bg-navy pt-14 text-ink">
      <div className="deco-bg" aria-hidden />
      <main className={cn("relative z-10 mx-auto px-4 py-8 sm:px-6 sm:py-10", max, className)}>{children}</main>
      <SiteFooter />
    </div>
  );
}

const FOOTER_NAV: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "탐색",
    links: [
      { href: "/", label: "매력도 지도" },
      { href: "/reports", label: "리포트" },
      { href: "/data", label: "데이터 출처" },
      { href: "/methodology", label: "방법론" },
    ],
  },
  {
    title: "진단",
    links: [
      { href: "/diagnose", label: "지번 진단" },
      { href: "/brand", label: "브랜드 진단" },
      { href: "/contribute", label: "현장 리포트" },
      { href: "/dashboard", label: "기관 대시보드" },
    ],
  },
  {
    title: "계정",
    links: [
      { href: "/pricing", label: "가격" },
      { href: "/auth", label: "로그인·회원가입" },
      { href: "/account", label: "내 계정" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative z-10 mt-20 border-t border-line">
      <div className="hairline" />
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-blue to-amber text-[14px] font-black text-white">K</span>
            <span className="text-[16px] font-extrabold tracking-tight">
              KLAI<span className="text-blue-l"> 매력도</span>
            </span>
          </div>
          <p className="mt-3 max-w-xs text-[12px] leading-relaxed text-muted2">
            전국 행정동·매장의 매력도와 변화를 데이터로 진단하는 로컬 인텔리전스 플랫폼. 개념 검증(MVP) · 샘플·잠정 데이터.
          </p>
          <p className="mt-3 text-[11px] text-muted2">ZeroSite · NutUnion — KLAI Platform</p>
        </div>
        {FOOTER_NAV.map((col) => (
          <div key={col.title}>
            <div className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-muted2">{col.title}</div>
            <ul className="space-y-1.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[13px] text-muted transition-colors hover:text-ink">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line/60">
        <div className="mx-auto max-w-6xl px-6 py-4 text-[11px] text-muted2">
          © 2026 KLAI · 야놀자 축제지수 + 도시활력·상권·소멸·젠트리 연구 결합 · 데이터 출처와 커버리지는 각 화면에 표기됩니다.
        </div>
      </div>
    </footer>
  );
}
