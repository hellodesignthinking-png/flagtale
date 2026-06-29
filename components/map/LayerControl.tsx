"use client";

import { LAYERS } from "@/lib/constants";
import { useMapStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const GROUPS = ["종합", "매력 4축", "변화·동학", "위기 신호", "공공 투입", "플래그테일"] as const;

export function LayerControl() {
  const layer = useMapStore((s) => s.layer);
  const setLayer = useMapStore((s) => s.setLayer);
  const active = LAYERS.find((l) => l.id === layer)!;

  return (
    <div className="klai-panel max-h-[70vh] w-[240px] overflow-y-auto p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="klai-eyebrow text-[10px]">레이어</span>
        <span className="text-[10px] text-muted2">단일 선택</span>
      </div>

      <div className="space-y-2.5">
        {GROUPS.map((g) => (
          <div key={g}>
            <div className="mb-1 px-1 text-[9.5px] font-bold uppercase tracking-wider text-muted2">{g}</div>
            <div className="grid grid-cols-1 gap-0.5">
              {LAYERS.filter((l) => l.group === g).map((l) => {
                const on = l.id === layer;
                return (
                  <button
                    key={l.id}
                    onClick={() => setLayer(l.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12.5px] font-medium transition-colors",
                      on ? "bg-blue text-white" : "text-muted hover:bg-card2 hover:text-ink"
                    )}
                  >
                    <span className="flex-1 truncate">{l.label}</span>
                    {l.real ? (
                      <span
                        className="shrink-0 rounded px-1 py-px text-[8.5px] font-bold"
                        style={{ background: on ? "rgba(255,255,255,.22)" : "rgba(0,196,58,.16)", color: on ? "#fff" : "var(--green)" }}
                        title="실데이터 (KOSIS)"
                      >
                        실
                      </span>
                    ) : (
                      <span className={cn("shrink-0 text-[8.5px]", on ? "text-white/55" : "text-muted2")} title="샘플(합성) 데이터">
                        샘플
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2.5 border-t border-line pt-2">
        <p className="text-[11px] leading-snug text-muted2">{active.desc}</p>
        <p className="mt-1.5 text-[10px] leading-snug text-muted2">
          <b className="text-muted">● 실데이터</b> 표시 레이어(상권·빈집·건축물·인구변화)는 KOSIS·소진공 실측. KLAI 종합·4축은 아직 샘플. 임대·매출·유동 등은 동 클릭 →{" "}
          <a href="/diagnose" className="text-blue-l hover:underline">진단</a>.
        </p>
      </div>
    </div>
  );
}
