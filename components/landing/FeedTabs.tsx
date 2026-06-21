"use client";

import { useState } from "react";
import { ArticleCard, type CardItem } from "./ArticleCard";

const TABS = [
  { key: "all", label: "전체" },
  { key: "rise", label: "📈 뜨는" },
  { key: "fall", label: "📉 식는" },
  { key: "gentri", label: "⚡ 젠트리" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const matches = (it: CardItem, key: TabKey) => (key === "rise" ? it.kind === "rise" : key === "fall" ? it.kind === "fall" : key === "gentri" ? it.gentriStage >= 3 : true);

export function FeedTabs({ items }: { items: CardItem[] }) {
  const [tab, setTab] = useState<TabKey>("all");
  const counts = Object.fromEntries(TABS.map((t) => [t.key, items.filter((it) => matches(it, t.key)).length])) as Record<TabKey, number>;
  const filtered = items.filter((it) => matches(it, tab)).slice(0, 15);

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              aria-pressed={active}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold transition ${active ? "bg-amber text-onaccent" : "border border-line bg-card2 text-muted hover:border-blue/40 hover:text-ink"}`}
            >
              {t.label}
              <span className={`rounded-full px-1.5 text-[11px] font-extrabold ${active ? "bg-black/15" : "bg-navy/60 text-muted2"}`}>{counts[t.key]}</span>
            </button>
          );
        })}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((it) => (
          <ArticleCard key={it.cd} item={it} />
        ))}
      </div>
      {filtered.length === 0 && <p className="py-12 text-center text-[14px] text-muted2">해당 조건의 동네가 없습니다.</p>}
    </div>
  );
}
