// 이번 주 모멘텀 Top — 상승/하락 가로 막대 그래프
export interface BarItem {
  name: string;
  sigungu?: string;
  momentum: number;
  kind: "rise" | "fall";
}

export function MomentumBars({ items, title = "이번 주 모멘텀 Top" }: { items: BarItem[]; title?: string }) {
  const max = Math.max(1, ...items.map((i) => Math.abs(i.momentum)));
  return (
    <div className="rounded-2xl border border-line bg-card2/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[13px] font-extrabold text-ink">{title}</span>
        <span className="text-[11px] font-bold text-muted2">▲ 상승 · ▼ 하락</span>
      </div>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={`${it.name}-${i}`} className="flex items-center gap-2">
            <span className="w-16 shrink-0 truncate text-[12px] font-semibold text-muted" title={it.sigungu ? `${it.sigungu} ${it.name}` : it.name}>
              {it.name}
            </span>
            <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-navy/40">
              <div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ width: `${(Math.abs(it.momentum) / max) * 100}%`, background: it.kind === "rise" ? "#16a34a" : "#f43f5e" }}
              />
            </div>
            <span className="w-9 shrink-0 text-right text-[12px] font-bold tabular-nums" style={{ color: it.kind === "rise" ? "var(--gB)" : "var(--warn)" }}>
              {it.kind === "rise" ? "+" : ""}
              {it.momentum}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
