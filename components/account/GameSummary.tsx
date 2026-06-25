"use client";

import { useEffect, useState } from "react";
import { readGame, onGameChange, levelOf, levelTitle, levelProgress, flagCount, BADGES, earnedBadgeIds, territoryCount, topTerritories, type GameState } from "@/lib/game";

// 내 로컬 활동 — 코인·깃발·연속·레벨 (localStorage 게임 상태). GameChip이 여기로 링크.
export function GameSummary() {
  const [g, setG] = useState<GameState | null>(null);
  useEffect(() => { const s = () => setG(readGame()); s(); return onGameChange(s); }, []);
  if (!g) return null;
  const lv = levelOf(g.coins), prog = levelProgress(g.coins);
  const earned = earnedBadgeIds(g);
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

      {/* 업적/뱃지 */}
      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[11px] font-extrabold text-muted2">🏅 업적</span>
          <span className="text-[10.5px] font-bold text-muted2">{earned.length}/{BADGES.length}</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {BADGES.map((b) => {
            const on = earned.includes(b.id);
            return (
              <div key={b.id} title={`${b.name} · ${b.desc}`} className={`flex flex-col items-center rounded-[12px] border p-2 text-center transition-colors ${on ? "border-amber/40 bg-amber/10" : "border-line bg-card2/40 opacity-45"}`}>
                <span className="text-[18px] leading-none">{b.emoji}</span>
                <span className="mt-1 text-[9px] font-bold leading-tight text-ink">{b.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 영토 — 점령한 동네 */}
      {territoryCount(g) > 0 && (
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-muted2">🏰 점령한 동네</span>
            <span className="text-[10.5px] font-bold text-muted2">{territoryCount(g)}곳</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {topTerritories(g, 8).map((t) => (
              <span key={t.region} className="inline-flex items-center gap-1 rounded-full border border-line bg-card2/50 px-2.5 py-1 text-[11px] font-extrabold text-ink">
                🚩 {t.region} <span className="text-blue-l">{t.n}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {g.coins === 0 && (
        <div className="mt-3 rounded-[14px] border border-dashed border-line bg-card2/60 px-4 py-4 text-center">
          <div className="text-[26px]">🚩</div>
          <p className="mx-auto mt-1.5 max-w-xs text-[12.5px] leading-relaxed text-muted">아직 첫 깃발 전이에요! <b className="text-ink">플래그맵에서 매장·축제를 체크인</b>하면 코인·깃발이 쌓이고, 동네를 점령하며 레벨이 올라갑니다.</p>
          <a href="/map-tale" className="btn-glow mt-3 inline-flex rounded-full bg-amber px-4 py-2 text-[12.5px] font-extrabold text-onaccent">🗺 첫 체크인 하러 가기 →</a>
        </div>
      )}
    </div>
  );
}
