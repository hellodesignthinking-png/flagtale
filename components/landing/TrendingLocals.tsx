"use client";

import { useEffect, useMemo, useState } from "react";
import { TRENDING_LOCALS, CATS, type TrendingLocal } from "@/lib/trendingLocals";
import { LocalDetailModal } from "./LocalDetailModal";

interface LocalLive {
  newsTotal: number;
  trendNow: number;
  trendDelta: number;
  sentiment: number;
  headlines: { title: string; date: string; link: string; tone: 1 | 0 | -1 }[];
}

export function TrendingLocals() {
  const [live, setLive] = useState<Record<string, LocalLive>>({});
  const [loaded, setLoaded] = useState(false);
  const [modal, setModal] = useState<TrendingLocal | null>(null);

  useEffect(() => {
    let on = true;
    fetch("/api/trending-locals")
      .then((r) => r.json())
      .then((d) => on && setLive(d || {}))
      .catch(() => {})
      .finally(() => on && setLoaded(true));
    return () => {
      on = false;
    };
  }, []);

  const anyLive = Object.keys(live).length > 0;

  // 변화 강도(volatility) = |검색 1년 변화| + 감성 극단치 보정.
  // 가장 변화가 심한 곳(급등·급락 불문)을 상단으로 → 사이트가 살아있게 보이도록.
  const volOf = (name: string) => {
    const lv = live[name];
    return lv ? Math.abs(lv.trendDelta) + Math.abs(lv.sentiment) / 12 : -1;
  };
  const sorted = useMemo(() => [...TRENDING_LOCALS].sort((a, b) => volOf(b.name) - volOf(a.name)), [live]);
  const maxVol = useMemo(() => Math.max(1, ...sorted.map((l) => volOf(l.name))), [sorted]);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
        <div>
          <span className="klai-eyebrow">News · Blog · Social Buzz</span>
          <h2 className="mt-1.5 font-display text-[clamp(22px,3vw,28px)] font-black tracking-[-0.03em]">📰 지금 뜨는 <span className="hl-mark">로컬 동네</span></h2>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border-[1.5px] px-3 py-1.5 text-[11.5px] font-extrabold" style={{ background: "rgba(217,242,30,.18)", borderColor: "rgba(132,204,22,.42)", color: "var(--blue-l)" }}>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full" style={{ background: "#16a34a", opacity: 0.65 }} />
            <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: "#16a34a" }} />
          </span>
          {anyLive ? "네이버 실시간 · 변화 큰順" : "에디토리얼 큐레이션 · 클릭=상세"}
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((l, idx) => {
          const cat = CATS[l.cat];
          const lv = live[l.name];
          const vol = volOf(l.name);
          const intensity = vol > 0 ? Math.max(6, Math.round((vol / maxVol) * 100)) : 0;
          const surge = lv ? lv.trendDelta : 0;
          const isTop = anyLive && vol > 0 && idx < 3;
          return (
            <button key={l.name} type="button" onClick={() => setModal(l)} className="lift relative flex flex-col rounded-[20px] border-[1.5px] border-line bg-card p-5 text-left transition">
              {/* 급변 랭크 (변화 강도 상위 3) — 생동감 */}
              {isTop && (
                <span className="absolute -top-2.5 left-4 inline-flex items-center gap-1 rounded-full bg-ink px-2.5 py-1 text-[10.5px] font-extrabold text-white shadow-sm">🔥 변화 TOP {idx + 1}</span>
              )}
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full px-2.5 py-1 text-[11px] font-extrabold" style={{ background: cat.c, color: cat.on }}>{cat.label}</span>
                <span className="text-[11.5px] font-semibold text-muted2">{l.region}</span>
              </div>
              <h3 className="mt-2.5 text-[19px] font-extrabold text-ink">{l.name}</h3>

              {lv ? (
                <>
                  <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11.5px] font-bold">
                    <span className="text-muted">검색 {lv.trendNow}</span>
                    <span style={{ color: surge >= 0 ? "var(--gB)" : "var(--warn)" }}>{surge >= 0 ? "▲ 급등 " : "▼ 급락 "}{Math.abs(surge)} <span className="font-semibold text-muted2">1년</span></span>
                    <span className="text-muted2">·</span>
                    <span className="text-muted">📰 {lv.newsTotal.toLocaleString()}건</span>
                  </div>
                  {/* 변화 강도 바 */}
                  <div className="mt-2.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: "#f0f0ea" }}>
                      <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${intensity}%`, background: surge >= 0 ? "linear-gradient(90deg,#84cc16,#16a34a)" : "linear-gradient(90deg,#fb7185,#e11d48)" }} />
                    </div>
                    <span className="text-[10px] font-bold tabular-nums text-muted2">강도 {intensity}</span>
                  </div>
                </>
              ) : (
                <p className="mt-2 text-[13px] leading-relaxed text-muted">{l.blurb}</p>
              )}

              {lv?.headlines?.length ? (
                <div className="mt-2.5 space-y-1.5 border-t border-line pt-2.5">
                  {lv.headlines.slice(0, 2).map((h, i) => (
                    <div key={i} className="flex gap-1.5 text-[12px] leading-snug text-muted">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: h.tone > 0 ? "#16a34a" : h.tone < 0 ? "#e11d48" : "#94a3b8" }} />
                      <span className="line-clamp-2">{h.title}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-2.5 flex flex-wrap gap-1">
                  {l.tags.map((t) => (
                    <span key={t} className="rounded-full bg-card2 px-2 py-0.5 text-[11px] font-semibold text-muted2">#{t}</span>
                  ))}
                </div>
              )}

              <div className="mt-auto flex items-center justify-between pt-4 text-[12px] font-bold">
                <span className="text-blue-l">멀티플랫폼 상세 →</span>
                <span className="text-[11px] text-muted2">{lv ? "네이버 실시간" : loaded ? "" : "불러오는 중…"}</span>
              </div>
            </button>
          );
        })}
      </div>
      <p className="mt-4 text-center text-[11.5px] text-muted2">
        카드 클릭 → 네이버 뉴스·블로그·카페·검색트렌드(실연동) + 유튜브 + 인스타·X·쓰레드 검토 링크 · 변화 강도 = |검색 1년 변화| 기준 정렬
      </p>
      {modal && <LocalDetailModal local={modal} onClose={() => setModal(null)} />}
    </div>
  );
}
