"use client";

import { useEffect, useState } from "react";

// 지도 썸네일 위 '뜨는/식는 이유' 콜아웃 핀. 클릭 시 요인 상세 툴팁(카드 링크 이동은 차단).
export function ReasonPin({ label, detail, up }: { label: string; detail: string; up: boolean }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  return (
    <span className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
      <span className="relative grid place-items-center">
        <span className="h-3 w-3 rounded-full shadow ring-2 ring-white" style={{ background: up ? "var(--amber)" : "var(--warn)" }} />
        <button
          type="button"
          aria-expanded={open}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen((o) => !o);
          }}
          className="absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-2.5 py-[3px] text-[11px] font-extrabold text-[#0D2B5E] shadow-md ring-1 ring-black/5 transition hover:ring-2 hover:ring-amber"
        >
          {label}
        </button>
        {open && (
          <span
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="absolute left-1/2 top-full z-30 mt-2 w-44 -translate-x-1/2 rounded-xl bg-[#0D2B5E] px-3 py-2 text-left text-[11px] font-medium leading-relaxed text-white shadow-xl ring-1 ring-white/10"
          >
            {detail}
          </span>
        )}
      </span>
    </span>
  );
}
