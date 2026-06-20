"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "지도" },
  { href: "/reports", label: "리포트" },
  { href: "/diagnose", label: "지번 진단" },
  { href: "/dashboard", label: "대시보드" },
  { href: "/data", label: "데이터 출처" },
  { href: "/methodology", label: "방법론" },
  { href: "/pricing", label: "가격" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const onMap = pathname === "/";

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 h-14 border-b",
        onMap
          ? "border-line/40 bg-navy/55 backdrop-blur-md"
          : "theme-light border-line bg-navy/90 backdrop-blur"
      )}
    >
      <div className="mx-auto flex h-full max-w-[1400px] items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-blue to-amber text-[13px] font-black text-white">
            K
          </span>
          <span className="text-[15px] font-extrabold tracking-tight">
            KLAI<span className="text-blue-l"> 매력도</span>
          </span>
          <span className="hidden text-[11px] text-muted2 sm:inline">· 동네 매력도 지도·진단</span>
        </Link>

        <nav className="ml-2 hidden items-center gap-1 md:flex">
          {NAV.map((n) => {
            const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-[13.5px] font-medium transition-colors",
                  active ? "bg-card2 text-ink" : "text-muted hover:text-ink"
                )}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/auth"
            className="rounded-md px-3 py-1.5 text-[13.5px] font-medium text-muted hover:text-ink"
          >
            로그인
          </Link>
          <Link
            href="/diagnose"
            className="rounded-lg bg-amber px-3.5 py-1.5 text-[13.5px] font-bold text-[#1a1206] transition-colors hover:bg-[#e0951f]"
          >
            지번 진단
          </Link>
        </div>
      </div>
    </header>
  );
}
