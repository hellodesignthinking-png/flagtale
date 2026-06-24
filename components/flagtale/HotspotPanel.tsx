"use client";

import { narrativeJumpList, STAGE_META, type LifeStage } from "@/lib/narratives";

const ORDER: LifeStage[] = ["formation", "spread", "peak", "gentri", "decline"];
export type HotspotJump = { name: string; stage: LifeStage; theme: string; coord: [number, number]; admCd2: string };

// 지도 디스커버리 — 검증된 핫지역 16개를 라이프사이클 순으로. 누르면 지도가 그 동네로 날아가 실제 이야기를 띄움.
export function HotspotPanel({ onJump, onClose }: { onJump: (it: HotspotJump) => void; onClose: () => void }) {
  const list = narrativeJumpList();
  return (
    <div className="ft-panel-in absolute right-[58px] top-[100px] z-[22] flex max-h-[calc(100%_-_8.5rem)] w-[210px] flex-col overflow-hidden rounded-[14px] border-2 border-ink/15 bg-card shadow-2xl md:top-16">
      <div className="flex shrink-0 items-center justify-between border-b border-line px-2.5 py-2">
        <span className="text-[11.5px] font-extrabold text-ink">🔥 검증된 핫지역 {list.length}</span>
        <button onClick={onClose} aria-label="닫기" className="-mr-1.5 grid h-8 w-8 place-items-center rounded-full text-[14px] leading-none text-muted2 transition-colors hover:bg-card2 hover:text-ink">✕</button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
        {ORDER.map((s) => {
          const items = list.filter((i) => i.stage === s);
          if (!items.length) return null;
          const m = STAGE_META[s];
          return (
            <div key={s} className="mb-1.5">
              <div className="px-1.5 py-1 text-[10px] font-extrabold" style={{ color: m.color }}>{m.emoji} {m.short} <span className="opacity-70">{items.length}</span></div>
              {items.map((it) => (
                <button key={it.name} onClick={() => onJump(it)} className="block w-full rounded-[9px] border-l-[3px] px-2 py-1.5 text-left transition-colors hover:bg-card2" style={{ borderLeftColor: m.color }}>
                  <div className="text-[12px] font-extrabold text-ink">{it.name}</div>
                  <div className="line-clamp-1 text-[10.5px] text-muted2">{it.theme}</div>
                </button>
              ))}
            </div>
          );
        })}
      </div>
      <div className="shrink-0 border-t border-line px-2.5 py-1.5 text-[10px] leading-relaxed text-muted2">눌러서 지도에서 확인 · 실제 핫지역 큐레이션</div>
    </div>
  );
}
