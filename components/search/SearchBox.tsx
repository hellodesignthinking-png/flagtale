"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export type IdxItem = { label: string; sub: string; type: string; href: string };
const RECENT_KEY = "ft_recent_search_v1";
const typeEmoji = (t: string) => ({ spot: "🏪", tour: "🎫", stay: "🏠", creator: "🎨", crew: "🏴", board: "💬" } as Record<string, string>)[t] ?? "📍";

export function SearchBox({ index, initialQ = "" }: { index: IdxItem[]; initialQ?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initialQ);
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try { setRecent(JSON.parse(localStorage.getItem(RECENT_KEY) || "[]")); } catch { /* none */ }
  }, []);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const ql = q.trim().toLowerCase();
  const sugg = ql ? index.filter((i) => i.label.toLowerCase().includes(ql) || i.sub.toLowerCase().includes(ql)).slice(0, 8) : [];

  const saveRecent = (term: string) => {
    const t = term.trim();
    if (!t) return;
    const next = [t, ...recent.filter((r) => r !== t)].slice(0, 8);
    setRecent(next);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* noop */ }
  };
  const go = (term?: string) => {
    const t = (term ?? q).trim();
    if (!t) return;
    saveRecent(t);
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(t)}`);
  };

  return (
    <div ref={boxRef} className="relative">
      <form onSubmit={(e) => { e.preventDefault(); go(); }} className="flex items-center gap-2 rounded-full border-[1.5px] border-line bg-card px-4 py-1.5 focus-within:border-ink">
        <span className="text-muted2">🔍</span>
        <input value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} placeholder="매장·투어·스테이·크리에이터·크루·동네 검색" className="h-10 flex-1 bg-transparent text-[15px] text-ink placeholder:text-muted2 focus:outline-none" />
        <button type="submit" className="btn-glow shrink-0 rounded-full bg-amber px-4 py-2 text-[13px] font-extrabold text-onaccent">검색</button>
      </form>
      {open && (sugg.length > 0 || (!ql && recent.length > 0)) && (
        <div className="absolute inset-x-0 top-[calc(100%+6px)] z-30 max-h-[360px] overflow-y-auto rounded-2xl border-[1.5px] border-line bg-card p-2 shadow-xl">
          {ql ? (
            <>
              <div className="px-3 py-1 text-[11px] font-bold text-muted2">추천</div>
              {sugg.map((s, i) => (
                <Link key={`${s.href}-${i}`} href={s.href} onClick={() => { saveRecent(q); setOpen(false); }} className="flex items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-card2">
                  <span className="text-[15px]">{typeEmoji(s.type)}</span>
                  <span className="min-w-0 flex-1 truncate"><span className="text-[13.5px] font-bold text-ink">{s.label}</span> <span className="text-[11.5px] text-muted2">· {s.sub}</span></span>
                </Link>
              ))}
              <button onMouseDown={(e) => { e.preventDefault(); go(); }} className="mt-1 w-full rounded-xl px-3 py-2 text-left text-[12.5px] font-bold text-blue-l hover:bg-card2">전체 결과 보기 “{q}” →</button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between px-3 py-1">
                <span className="text-[11px] font-bold text-muted2">최근 검색</span>
                <button onClick={() => { setRecent([]); try { localStorage.removeItem(RECENT_KEY); } catch { /* noop */ } }} className="text-[11px] text-muted2 hover:text-ink">전체 지우기</button>
              </div>
              {recent.map((r) => (
                <button key={r} onClick={() => { setQ(r); go(r); }} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left hover:bg-card2">
                  <span className="text-muted2">🕘</span><span className="flex-1 truncate text-[13.5px] text-ink">{r}</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
