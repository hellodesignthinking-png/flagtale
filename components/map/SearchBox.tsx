"use client";

import { useMemo, useState } from "react";
import type { DistrictProps } from "@/lib/types";

export function SearchBox({
  places,
  onSelect,
}: {
  places: DistrictProps[];
  onSelect: (admCd2: string) => void;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const matches = useMemo(() => {
    const s = q.trim();
    if (!s) return [];
    return places
      .filter((p) => p.name.includes(s) || p.sigungu.includes(s) || p.typology.includes(s))
      .slice(0, 7);
  }, [q, places]);

  return (
    <div className="relative w-[260px]">
      <div className="klai-panel flex items-center gap-2 px-3 py-2">
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="shrink-0 text-muted2">
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.6" />
          <path d="M11 11l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="동명·지번·유형 검색"
          className="w-full bg-transparent text-[13px] text-ink placeholder:text-muted2 focus:outline-none"
        />
      </div>
      {open && matches.length > 0 && (
        <ul className="klai-panel absolute mt-1.5 w-full overflow-hidden p-1">
          {matches.map((p) => (
            <li key={p.admCd2}>
              <button
                onMouseDown={() => {
                  onSelect(p.admCd2);
                  setQ(p.name);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left hover:bg-card2"
              >
                <span className="text-[13px] font-semibold text-ink">{p.name}</span>
                <span className="text-[11px] text-muted2">
                  {p.sigungu} · {p.typology}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
