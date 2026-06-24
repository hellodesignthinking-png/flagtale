// 이번 주 모멘텀 Top — 상승/하락 가로 막대 그래프. 막대 클릭 시 onPick(cd)로 상세 팝업.
export interface BarItem {
  cd: string;
  name: string;
  sigungu?: string;
  momentum: number;
  kind: "rise" | "fall";
}

export function MomentumBars({ items, title = "이번 주 모멘텀 Top", onPick }: { items: BarItem[]; title?: string; onPick?: (cd: string) => void }) {
  const max = Math.max(1, ...items.map((i) => Math.abs(i.momentum)));
  return (
    <div className="rounded-[20px] border-[1.5px] border-line bg-card p-5">
      <div className="mb-3.5 flex items-center justify-between">
        <span className="text-[14px] font-extrabold text-ink">{title}</span>
        <span className="text-[11px] font-bold text-muted2">막대 클릭 = 상세</span>
      </div>
      <div className="space-y-2.5">
        {items.map((it, i) => (
          <button
            key={`${it.cd}-${i}`}
            type="button"
            onClick={() => onPick?.(it.cd)}
            className="flex w-full items-center gap-2.5 rounded-lg px-1 py-0.5 text-left transition hover:bg-card2"
            title={it.sigungu ? `${it.sigungu} ${it.name}` : it.name}
          >
            <span className="w-16 shrink-0 truncate text-[12.5px] font-bold text-muted">{it.name}</span>
            <div className="relative h-3 flex-1 overflow-hidden rounded-full" style={{ background: "#f0f0ea" }}>
              <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${(Math.abs(it.momentum) / max) * 100}%`, background: it.kind === "rise" ? "#16a34a" : "#f43f5e" }} />
            </div>
            <span className="w-9 shrink-0 text-right text-[12px] font-bold tabular-nums" style={{ color: it.kind === "rise" ? "var(--gB)" : "var(--warn)" }}>
              {it.kind === "rise" ? "+" : ""}
              {it.momentum}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
