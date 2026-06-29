"use client";

import { useState } from "react";
import { ftImage } from "@/lib/flagtale-types";

interface Rec {
  id: string; name: string; region: string; kind: string; catLabel: string;
  emoji: string; color: string; lat: number; lng: number; rating?: number; image?: string; sub?: string;
  distanceKm: number | null; reason: string;
}
interface SearchRes {
  summary: string;
  parsed: { origin: string | null; radiusKm: number | null; cats: string[]; keywords: string[] };
  recommendations: Rec[];
}

const EXAMPLES = [
  "이번주말 서울에서 2시간 여행갈만한곳",
  "강릉 근처 책방",
  "전주 한옥 스테이",
  "부산 맛집",
  "제주 갤러리·공방",
];

export function MapAISearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<SearchRes | null>(null);

  async function run(query?: string) {
    const text = (query ?? q).trim();
    if (!text) return;
    setQ(text);
    setLoading(true);
    setRes(null);
    try {
      const r = await fetch("/api/map-search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: text }) });
      setRes(await r.json());
    } catch {
      setRes({ summary: "검색 오류 — 다시 시도해 주세요.", parsed: { origin: null, radiusKm: null, cats: [], keywords: [] }, recommendations: [] });
    } finally {
      setLoading(false);
    }
  }

  function focus(r: Rec) {
    // 지도에 포커스 이벤트(맵이 수신 시 fly-to) + 패널 닫기
    try { window.dispatchEvent(new CustomEvent("ft:map-focus", { detail: { lng: r.lng, lat: r.lat, id: r.id, name: r.name } })); } catch { /* */ }
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-1/2 top-[104px] z-30 -translate-x-1/2 whitespace-nowrap rounded-full border-[1.5px] border-amber bg-card/95 px-4 py-2 text-[13px] font-extrabold text-ink shadow-lg backdrop-blur transition-transform hover:scale-[1.03] sm:top-[60px] sm:left-auto sm:right-4 sm:translate-x-0"
      >
        ✨ 자연어 추천 검색
      </button>

      {open && (
        <div className="theme-light fixed inset-0 z-[140] flex items-start justify-center bg-black/45 p-3 backdrop-blur-sm sm:p-6" onClick={() => setOpen(false)}>
          <div className="mt-[8vh] flex max-h-[82vh] w-full max-w-[560px] flex-col overflow-hidden rounded-2xl border border-line bg-navy shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* 헤더 */}
            <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
              <div>
                <div className="text-[15px] font-black text-ink">✨ 자연어 추천 검색</div>
                <div className="text-[11px] text-muted2">원하는 걸 문장으로 — 관련 지역·콘텐츠를 추천합니다</div>
              </div>
              <button onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-card2 hover:text-ink">✕</button>
            </div>

            {/* 입력 */}
            <div className="border-b border-line px-4 py-3">
              <div className="flex gap-2">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && run()}
                  autoFocus
                  placeholder="예: 이번주말 서울에서 2시간 여행갈만한곳"
                  className="h-11 flex-1 rounded-lg border border-line bg-card2 px-3.5 text-[14px] text-ink outline-none focus:border-amber"
                />
                <button onClick={() => run()} disabled={loading} className="h-11 shrink-0 rounded-lg bg-amber px-4 text-[13.5px] font-extrabold text-onaccent hover:bg-[var(--amber-d)] disabled:opacity-50">
                  {loading ? "검색중…" : "추천받기"}
                </button>
              </div>
              {!res && !loading && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {EXAMPLES.map((e) => (
                    <button key={e} onClick={() => run(e)} className="rounded-full border border-line bg-card2 px-2.5 py-1 text-[11.5px] text-muted hover:border-amber hover:text-ink">{e}</button>
                  ))}
                </div>
              )}
            </div>

            {/* 결과 */}
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
              {loading && <div className="py-8 text-center text-[13px] text-muted">관련 지역을 찾는 중…</div>}
              {res && (
                <>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="text-[13px] font-bold text-ink">{res.summary}</span>
                    {res.parsed.origin && <span className="rounded-full bg-card2 px-2 py-0.5 text-[10.5px] text-muted2">출발 {res.parsed.origin}</span>}
                    {res.parsed.radiusKm && <span className="rounded-full bg-card2 px-2 py-0.5 text-[10.5px] text-muted2">~{res.parsed.radiusKm}km</span>}
                    {res.parsed.cats.map((c) => <span key={c} className="rounded-full bg-card2 px-2 py-0.5 text-[10.5px] text-muted2">{c}</span>)}
                  </div>
                  <div className="space-y-2">
                    {res.recommendations.map((r, i) => (
                      <button key={r.id} onClick={() => focus(r)} className="flex w-full items-center gap-3 rounded-xl border border-line bg-card2/50 p-2.5 text-left transition-colors hover:border-amber hover:bg-card2">
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-extrabold text-white" style={{ background: r.color }}>{i + 1}</span>
                        {r.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={ftImage(r.image)} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                        ) : (
                          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-card text-[20px]">{r.emoji}</span>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[13.5px] font-bold text-ink">{r.emoji} {r.name}</div>
                          <div className="truncate text-[11.5px] text-muted">{r.region} · {r.catLabel}</div>
                          <div className="mt-0.5 text-[11px] font-semibold" style={{ color: "var(--blue-l)" }}>{r.reason}</div>
                        </div>
                        <span className="shrink-0 text-[16px] text-muted2">›</span>
                      </button>
                    ))}
                    {res.recommendations.length === 0 && <div className="py-6 text-center text-[13px] text-muted">조건을 바꿔 다시 검색해 보세요.</div>}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
