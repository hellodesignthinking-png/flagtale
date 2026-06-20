"use client";

import { useMemo, useState } from "react";
import type { DistrictProps } from "@/lib/types";

export function SearchBox({
  places,
  onSelect,
  onSearchPlace,
}: {
  places: DistrictProps[];
  onSelect: (admCd2: string) => void;
  // 장소/역/랜드마크 → /api/geocode 로 해석 후 그 위치로 이동. 성공 true / 실패 false.
  onSearchPlace?: (query: string) => Promise<boolean> | boolean | void;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const matches = useMemo(() => {
    const s = q.trim();
    if (!s) return [];
    return places.filter((p) => p.name.includes(s) || p.sigungu.includes(s) || p.typology.includes(s)).slice(0, 6);
  }, [q, places]);

  const doPlaceSearch = async () => {
    const s = q.trim();
    if (!s || !onSearchPlace || searching) return;
    setSearching(true);
    setNotFound(false);
    try {
      const ok = await onSearchPlace(s);
      if (ok === false) setNotFound(true);
      else setOpen(false);
    } finally {
      setSearching(false);
    }
  };

  const pickDong = (p: DistrictProps) => {
    onSelect(p.admCd2);
    setQ(p.name);
    setOpen(false);
  };

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
            setNotFound(false);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 180)}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            if (matches[0]) pickDong(matches[0]);
            else doPlaceSearch();
          }}
          placeholder="동·지번·역·장소 검색"
          className="w-full bg-transparent text-[13px] text-ink placeholder:text-muted2 focus:outline-none"
        />
        {searching && (
          <svg width="14" height="14" viewBox="0 0 24 24" className="shrink-0 animate-spin text-amber">
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
            <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        )}
      </div>
      {open && q.trim() && (
        <ul className="klai-panel absolute mt-1.5 w-full overflow-hidden p-1">
          {matches.map((p) => (
            <li key={p.admCd2}>
              <button
                onMouseDown={() => pickDong(p)}
                className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left hover:bg-card2"
              >
                <span className="text-[13px] font-semibold text-ink">{p.name}</span>
                <span className="text-[11px] text-muted2">
                  {p.sigungu} · {p.typology}
                </span>
              </button>
            </li>
          ))}
          {/* 장소·역·랜드마크 검색 (네이버 지역검색 → 그 위치 중심 데이터) */}
          {onSearchPlace && (
            <li className={matches.length ? "mt-1 border-t border-line pt-1" : ""}>
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  doPlaceSearch();
                }}
                className="flex w-full items-center gap-1.5 rounded-md px-2.5 py-1.5 text-left hover:bg-card2"
              >
                <span className="text-[13px]">📍</span>
                <span className="flex-1 text-[12.5px] text-ink">
                  ‘<b className="font-bold text-amber">{q.trim()}</b>’ 장소·역으로 검색
                </span>
                {notFound && <span className="text-[11px] text-warn">못 찾음</span>}
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
