"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readGame, onGameChange, levelOf, levelTitle, flagCount, type GameState } from "@/lib/game";
import { pushGame, pullGame } from "@/lib/gameSync";
import { onAuthChange } from "@/lib/accountSync";

// 헤더 게임 칩 — 코인·레벨. 첫 체크인(coins>0) 전엔 숨김. 로그인 시 계정 동기화.
export function GameChip() {
  const [g, setG] = useState<GameState | null>(null);
  useEffect(() => {
    setG(readGame());
    const offGame = onGameChange(() => { setG(readGame()); pushGame(readGame()); });
    const applyCloud = () => pullGame().then((m) => { if (m) setG(m); });
    applyCloud(); // 로그인 상태면 계정↔로컬 병합
    const offAuth = onAuthChange(applyCloud);
    return () => { offGame(); offAuth(); };
  }, []);
  if (!g || g.coins <= 0) return null;
  const lv = levelOf(g.coins);
  return (
    <Link
      href="/play"
      title={`${levelTitle(g.coins)} · 코인 ${g.coins} · 깃발 ${flagCount(g)}개`}
      className="flex items-center gap-1.5 rounded-full border border-amber/40 bg-amber/12 px-2.5 py-1 text-[12.5px] font-extrabold text-blue-l transition-colors hover:border-amber"
    >
      <span>🪙 {g.coins.toLocaleString()}</span>
      <span className="rounded-full bg-amber px-1.5 text-[10.5px] text-onaccent">Lv{lv}</span>
    </Link>
  );
}
