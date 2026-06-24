"use client";

import Link from "next/link";
import { LAYERS } from "@/lib/constants";
import type { LayerId } from "@/lib/types";

// 매력도 choropleth 레이어 — 네이버 부동산식 우측 레일 옆 세로 플라이아웃(매력도 버튼 아래). + 3D 전체보기(/map).
const GROUPS = ["종합", "매력 4축", "변화·동학", "위기 신호", "공공 투입"];

export function ChoroLayerControl({ layer, onLayer }: { layer: LayerId; onLayer: (l: LayerId) => void }) {
  return (
    <div className="ft-panel-in absolute right-[58px] top-[100px] z-[21] flex max-h-[calc(100%_-_8.5rem)] w-[180px] flex-col overflow-hidden rounded-[14px] border-2 border-ink/15 bg-card shadow-2xl md:top-16">
      <div className="shrink-0 border-b border-line px-2.5 py-2 text-[11.5px] font-extrabold text-ink">🎨 매력도 레이어</div>
      <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
        {GROUPS.map((g) => (
          <div key={g} className="mb-1">
            <div className="px-1 py-0.5 text-[8.5px] font-bold uppercase tracking-wider text-muted2">{g}</div>
            {LAYERS.filter((l) => l.group === g).map((l) => (
              <button
                key={l.id}
                onClick={() => onLayer(l.id)}
                title={l.desc}
                className={`flex w-full items-center justify-between rounded-[8px] px-2 py-1.5 text-left text-[11.5px] font-bold transition-colors ${l.id === layer ? "bg-ink text-white" : "text-ink hover:bg-card2"}`}
              >
                <span className="truncate">{l.label}</span>
                {l.real && <span className={`ml-1 shrink-0 text-[8.5px] font-extrabold ${l.id === layer ? "text-white/70" : "text-[#03a04a]"}`}>실</span>}
              </button>
            ))}
          </div>
        ))}
      </div>
      <div className="shrink-0 border-t border-line p-1.5">
        <Link href="/map" className="btn-glow flex items-center justify-center rounded-full bg-amber py-1.5 text-[11px] font-extrabold text-onaccent">🧊 3D 전체 보기 →</Link>
      </div>
    </div>
  );
}
