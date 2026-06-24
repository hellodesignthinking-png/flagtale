"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { GameChip } from "@/components/flagtale/GameChip";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "발견·경험" },
  { href: "/map-tale", label: "플래그맵" },
  { href: "/host", label: "호스트 등록" },
  { href: "/hub", label: "허브" },
  { href: "/lab", label: "플래그테일랩" },
  { href: "/reports", label: "리포트" },
  { href: "/diagnose", label: "진단" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const onMap = pathname.startsWith("/map"); // /map-tale·/map 모두
  const [email, setEmail] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setEmail(session?.user?.email ?? null));
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => setMenuOpen(false), [pathname]); // 라우트 이동 시 모바일 메뉴 닫기

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
          <span
            className="grid h-8 w-8 place-items-center rounded-[10px] bg-amber font-display text-[15px] font-extrabold text-onaccent"
            style={{ transform: "rotate(-4deg)" }}
          >
            F
          </span>
          <span className="text-[16px] font-black tracking-tight">
            Flag<span className="text-blue-l">tale</span>
          </span>
          <span className="hidden text-[11px] text-muted2 sm:inline">· 가장 로컬다운 이야기로 시작하는 여행</span>
        </Link>

        <nav className="ml-2 hidden items-center gap-1 md:flex">
          {NAV.map((n) => {
            const active = pathname === n.href || pathname.startsWith(n.href + "/");
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-[13.5px] font-medium transition-all",
                  active ? "bg-amber/12 text-ink ring-1 ring-amber/30" : "text-muted hover:bg-card2/70 hover:text-ink"
                )}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <GameChip />
          {email ? (
            <Link href="/account" title={email} className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[13.5px] font-medium text-muted hover:text-ink">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-amber/25 text-[11px] font-extrabold text-blue-l">{(email[0] ?? "U").toUpperCase()}</span>
              <span className="hidden sm:inline">내 계정</span>
            </Link>
          ) : (
            <Link href="/auth" className="rounded-md px-3 py-1.5 text-[13.5px] font-medium text-muted hover:text-ink">로그인</Link>
          )}
          <Link
            href="/diagnose"
            className={cn(
              "rounded-full px-3.5 py-1.5 text-[13px] font-extrabold transition-transform hover:scale-[1.03] sm:px-4 sm:text-[13.5px]",
              onMap ? "btn-glow bg-amber text-onaccent" : "bg-ink text-white"
            )}
          >
            지번 진단 →
          </Link>
          <button
            type="button"
            aria-label="메뉴 열기"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            className="grid h-9 w-9 place-items-center rounded-lg text-ink hover:bg-card2/70 md:hidden"
          >
            <span className="text-[18px] leading-none">{menuOpen ? "✕" : "☰"}</span>
          </button>
        </div>
      </div>

      {/* 모바일 내비 드롭다운 */}
      {menuOpen && (
        <div className={cn("absolute inset-x-0 top-14 border-b shadow-xl md:hidden", onMap ? "border-line/40 bg-card" : "theme-light border-line bg-card")}>
          <nav className="mx-auto grid max-w-[1400px] gap-0.5 px-3 py-2">
            {NAV.map((n) => {
              const active = pathname === n.href || pathname.startsWith(n.href + "/");
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={cn(
                    "rounded-lg px-3 py-2.5 text-[14.5px] font-bold transition-colors",
                    active ? "bg-amber/12 text-ink ring-1 ring-amber/30" : "text-muted hover:bg-card2/70 hover:text-ink"
                  )}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
