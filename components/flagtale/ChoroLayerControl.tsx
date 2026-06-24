"use client";

import Link from "next/link";
import { LAYERS } from "@/lib/constants";
import type { LayerId } from "@/lib/types";

// 플래그맵 choropleth 레이어 전환 — 예전 매력도 Lab LayerControl을 지도 위 하단 바로. + 3D 전체보기(/map) 링크.
const GROUPS = ["종합", "매력 4축", "변화·동학", "위기 신호", "공공 투입"];

export function ChoroLayerControl({ layer, onLayer }: { layer: LayerId; onLayer: (l: LayerId) => void }) {
  const active = LAYERS.find((l) => l.id === layer) ?? LAYERS[0];
  return (
    <div className="absolute bottom-[calc(42%_+_1rem)] left-1/2 z-[21] w-[min(700px,calc(100%_-_1rem))] -translate-x-1/2 rounded-[16px] border-2 border-ink/15 bg-card p-2.5 shadow-[0_10px_40px_-8px_rgba(0,0,0,0.45)] md:bottom-3 md:left-auto md:right-3 md:w-[620px] md:translate-x-0">
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5">
        {GROUPS.map((g) => (
          <div key={g} className="flex shrink-0 items-center gap-1">
            <span className="px-0.5 text-[8.5px] font-bold uppercase tracking-wider text-muted2">{g}</span>
            {LAYERS.filter((l) => l.group === g).map((l) => (
              <button
                key={l.id}
                onClick={() => onLayer(l.id)}
                title={l.desc}
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold transition-colors ${l.id === layer ? "bg-ink text-white" : "border border-line bg-card text-ink hover:border-ink"}`}
              >
                {l.label}{l.real ? " ·실" : ""}
              </button>
            ))}
          </div>
        ))}
      </div>
      <div className="mt-1 flex items-center justify-between gap-2 px-0.5">
        <span className="min-w-0 truncate text-[11px] font-semibold text-muted">
          <b className="text-ink">{active.label}</b> · {active.desc} · {active.real ? <span className="font-bold text-[#03a04a]">실데이터</span> : <span className="text-muted2">샘플</span>}
        </span>
        <Link href="/map" className="btn-glow shrink-0 rounded-full bg-amber px-3 py-1.5 text-[11px] font-extrabold text-onaccent">🧊 3D 전체 보기 →</Link>
      </div>
    </div>
  );
}
