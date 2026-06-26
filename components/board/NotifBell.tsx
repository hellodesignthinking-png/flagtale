"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { notifCount } from "@/lib/board";

export function NotifBell() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    setCount(notifCount());
  }, []);
  return (
    <Link href="/notifications" aria-label="알림" className="relative grid h-9 w-9 place-items-center rounded-lg text-ink transition-colors hover:bg-card2/70">
      <span className="text-[15px] leading-none">🔔</span>
      {count > 0 && <span className="absolute right-0 top-0.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-[#e11d48] px-1 text-[9px] font-extrabold text-white">{count > 9 ? "9+" : count}</span>}
    </Link>
  );
}
