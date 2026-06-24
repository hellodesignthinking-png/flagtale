"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readGame, onGameChange, levelOf, levelTitle, flagCount, type GameState } from "@/lib/game";

// 헤더 게임 칩 — 코인·레벨. 첫 체크인(coins>0) 전엔 숨김.
export function GameChip() {
  const [g, setG] = useState<GameState | null>(null);
  useEffect(() => {
    const sync = () => setG(readGame());
    sync();
    return onGameChange(sync);
  }, []);
  if (!g || g.coins <= 0) return null;
  const lv = levelOf(g.coins);
  return (
    <Link
      href="/account"
      title={`${levelTitle(g.coins)} · 코인 ${g.coins} · 깃발 ${flagCount(g)}개`}
      className="flex items-center gap-1.5 rounded-full border border-amber/40 bg-amber/12 px-2.5 py-1 text-[12.5px] font-extrabold text-blue-l transition-colors hover:border-amber"
    >
      <span>🪙 {g.coins.toLocaleString()}</span>
      <span className="rounded-full bg-amber px-1.5 text-[10.5px] text-onaccent">Lv{lv}</span>
    </Link>
  );
}
