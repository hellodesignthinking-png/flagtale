"use client";

import { useState } from "react";

interface Cat { key: string; label: string; emoji: string; color: string; count: number }
const PRICE: [string, string][] = [["all", "전체"], ["u5", "~5만원"], ["5to10", "5~10만원"], ["o10", "10만원+"]];
const SORTL: Record<string, string> = { rating: "평점순", dist: "거리순", name: "이름순", cat: "종류순" };

// 네이버 부동산식 상단 필터바 — 드롭다운 패널(종류·가격·평점·정렬) + 토글(영업중·즐겨찾기·최근) + 초기화
export function MapFilterBar({
  items, cats, regions, onRegion, selCats, onToggleCat, priceBand, onPriceBand, minRating, onMinRating, sort, onSort,
  openOnly, onOpenToggle, favs, favOnly, onFavToggle, recentCount, recentOnly, onRecentToggle, onReset,
}: {
  items: { length: number }; cats: Cat[];
  regions?: string[]; onRegion?: (r: string) => void;
  selCats: string[]; onToggleCat: (k: string) => void;
  priceBand?: string; onPriceBand?: (b: string) => void; minRating?: number; onMinRating?: (r: number) => void;
  sort: string; onSort: (s: string) => void;
  openOnly?: boolean; onOpenToggle?: () => void;
  favs?: string[]; favOnly?: boolean; onFavToggle?: () => void;
  recentCount?: number; recentOnly?: boolean; onRecentToggle?: () => void;
  onReset?: () => void;
}) {
  const [open, setOpen] = useState<{ key: string; x: number; y: number } | null>(null);
  function toggleMenu(e: React.MouseEvent, key: string) {
    if (open?.key === key) return setOpen(null);
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setOpen({ key, x: Math.max(8, Math.min(r.left, window.innerWidth - 224)), y: r.bottom + 6 });
  }
  const close = () => setOpen(null);

  const catLabel = selCats.length === 0 ? "종류" : `${cats.find((c) => c.key === selCats[0])?.label ?? "종류"}${selCats.length > 1 ? ` 외 ${selCats.length - 1}` : ""}`;
  const priceLabel = priceBand && priceBand !== "all" ? PRICE.find((p) => p[0] === priceBand)?.[1] ?? "가격" : "가격";
  const ratingLabel = minRating ? `${minRating}★+` : "평점";
  const sortLabel = SORTL[sort] ?? "정렬";
  const active = selCats.length > 0 || !!favOnly || !!recentOnly || !!openOnly || (!!priceBand && priceBand !== "all") || !!(minRating && minRating > 0);

  const pill = (key: string, label: string, on: boolean) => (
    <button onClick={(e) => toggleMenu(e, key)} className={`flex shrink-0 items-center gap-1 rounded-full border-[1.5px] px-3 py-1.5 text-[12.5px] font-extrabold transition-colors ${on ? "border-ink bg-ink text-white" : open?.key === key ? "border-ink bg-card text-ink" : "border-line bg-card text-ink hover:border-ink"}`}>
      {label}<span className={`text-[9px] transition-transform ${open?.key === key ? "rotate-180" : ""}`}>▾</span>
    </button>
  );
  const toggle = (label: string, on: boolean, onClick: () => void, color: string) => (
    <button onClick={onClick} className="shrink-0 rounded-full border-[1.5px] px-3 py-1.5 text-[12.5px] font-extrabold transition-colors" style={on ? { background: color, color: "#fff", borderColor: color } : { borderColor: "var(--line)", color }}>{label}</button>
  );
  const Opt = ({ sel, onClick, children }: { sel: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button onClick={() => { onClick(); close(); }} className={`flex w-full items-center justify-between gap-3 rounded-[9px] px-3 py-2 text-left text-[12.5px] font-bold transition-colors ${sel ? "bg-card2 text-ink" : "text-muted hover:bg-card2/60 hover:text-ink"}`}>
      <span>{children}</span>{sel ? <span className="text-blue-l">✓</span> : null}
    </button>
  );

  return (
    <>
      <div className="absolute inset-x-2 top-2 z-20 flex items-center gap-1.5 overflow-x-auto rounded-full border-[1.5px] border-line bg-card px-2 py-1.5 shadow-xl md:left-3 md:right-auto md:max-w-[calc(100%_-_1.5rem)]">
        {onRegion && pill("region", "📍 지역", false)}
        {pill("cat", catLabel, selCats.length > 0)}
        {onPriceBand && pill("price", priceLabel, !!priceBand && priceBand !== "all")}
        {onMinRating && pill("rating", ratingLabel, !!minRating)}
        {pill("sort", sortLabel, false)}
        {onOpenToggle && toggle("🟢 영업중", !!openOnly, onOpenToggle, "#03c75a")}
        {onFavToggle && toggle(`♥ 즐겨찾기 ${favs?.length ?? 0}`, !!favOnly, onFavToggle, "#e11d48")}
        {onRecentToggle && (recentCount ?? 0) > 0 && toggle(`🕘 최근 ${recentCount}`, !!recentOnly, onRecentToggle, "#4d7c0f")}
        {active && onReset && <button onClick={onReset} className="shrink-0 rounded-full border border-line px-2.5 py-1.5 text-[11px] font-bold text-muted2 hover:text-ink">✕ 초기화</button>}
      </div>
      {open && (
        <>
          <div className="fixed inset-0 z-[58]" onClick={close} aria-hidden />
          <div className="fixed z-[59] max-h-[58vh] w-[210px] overflow-y-auto rounded-[14px] border-[1.5px] border-line bg-card p-2 shadow-2xl" style={{ left: open.x, top: open.y }}>
            {open.key === "cat" && (
              <>
                <Opt sel={selCats.length === 0} onClick={() => onToggleCat("all")}>전체 <span className="opacity-50">{items.length}</span></Opt>
                {cats.map((c) => {
                  const on = selCats.includes(c.key);
                  return (
                    <button key={c.key} onClick={() => onToggleCat(c.key)} className={`flex w-full items-center justify-between gap-3 rounded-[9px] px-3 py-2 text-left text-[12.5px] font-bold transition-colors ${on ? "bg-card2 text-ink" : "text-muted hover:bg-card2/60 hover:text-ink"}`}>
                      <span>{c.emoji} {c.label} <span className="opacity-50">{c.count}</span></span>
                      <span className={on ? "text-blue-l" : "text-line"}>{on ? "☑" : "☐"}</span>
                    </button>
                  );
                })}
              </>
            )}
            {open.key === "price" && onPriceBand && PRICE.map(([v, l]) => <Opt key={v} sel={(priceBand ?? "all") === v} onClick={() => onPriceBand(v)}>{l}</Opt>)}
            {open.key === "rating" && onMinRating && (
              <div className="px-2 py-1.5">
                <div className="mb-2 flex items-center justify-between text-[12px] font-bold"><span className="text-muted2">최소 평점</span><span className="text-ink">{minRating ? `${minRating}★ 이상` : "전체"}</span></div>
                <input type="range" min={0} max={5} step={0.5} value={minRating ?? 0} onChange={(e) => onMinRating(Number(e.target.value))} className="w-full accent-[#4d7c0f]" />
                <div className="mt-1 flex justify-between text-[9.5px] text-muted2"><span>전체</span><span>2.5</span><span>5.0★</span></div>
                <button onClick={() => { onMinRating(0); close(); }} className="mt-2 w-full rounded-[9px] bg-card2 py-1.5 text-[11px] font-bold text-muted2 hover:text-ink">초기화</button>
              </div>
            )}
            {open.key === "sort" && Object.entries(SORTL).map(([v, l]) => <Opt key={v} sel={sort === v} onClick={() => onSort(v)}>{l}</Opt>)}
            {open.key === "region" && onRegion && (
              <>
                <Opt sel={false} onClick={() => onRegion("__all__")}>🗺 전체 지역</Opt>
                {(regions ?? []).map((r) => <Opt key={r} sel={false} onClick={() => onRegion(r)}>📍 {r}</Opt>)}
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}
