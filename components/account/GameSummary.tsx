"use client";

import { useEffect, useState } from "react";
import { readGame, onGameChange, levelOf, levelTitle, levelProgress, flagCount, type GameState } from "@/lib/game";

// 내 로컬 활동 — 코인·깃발·연속·레벨 (localStorage 게임 상태). GameChip이 여기로 링크.
export function GameSummary() {
  const [g, setG] = useState<GameState | null>(null);
  useEffect(() => { const s = () => setG(readGame()); s(); return onGameChange(s); }, []);
  if (!g) return null;
  const lv = levelOf(g.coins), prog = levelProgress(g.coins);
  return (
    <div className="rounded-[20px] border-[1.5px] border-line bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[16px] font-black text-ink">🎮 내 로컬 활동</h2>
        <span className="rounded-full bg-amber/15 px-2.5 py-0.5 text-[11px] font-extrabold text-blue-l">{levelTitle(g.coins)}</span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-[12px] border border-line p-2.5"><div className="font-display text-[20px] font-black tabular-nums text-ink">{g.coins.toLocaleString()}</div><div className="text-[10.5px] font-bold text-muted2">🪙 코인</div></div>
        <div className="rounded-[12px] border border-line p-2.5"><div className="font-display text-[20px] font-black tabular-nums text-ink">{flagCount(g)}</div><div className="text-[10.5px] font-bold text-muted2">🚩 깃발</div></div>
        <div className="rounded-[12px] border border-line p-2.5"><div className="font-display text-[20px] font-black tabular-nums text-ink">{g.streak}</div><div className="text-[10.5px] font-bold text-muted2">🔥 연속(일)</div></div>
      </div>
      <div className="mt-3">
        <div className="mb-1 flex justify-between text-[11px] text-muted2"><span className="font-bold text-blue-l">Lv{lv}</span><span>{prog} / 100 → Lv{lv + 1}</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-card2"><div className="h-full rounded-full" style={{ width: `${prog}%`, background: "var(--amber)" }} /></div>
      </div>
      {g.coins === 0 && <p className="mt-2.5 text-[11.5px] leading-relaxed text-muted2">플래그맵에서 매장·축제를 <b className="text-ink">체크인</b>하면 코인·깃발이 쌓이고 레벨이 올라요. 루트도 만들어 보세요.</p>}
    </div>
  );
}
