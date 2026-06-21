"use client";

import { useEffect, useState } from "react";
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

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <span className="klai-eyebrow">News · Blog · Social Buzz</span>
          <h2 className="mt-1 text-[1.4rem] font-extrabold tracking-tight sm:text-[1.7rem]">📰 지금 뜨는 <span className="hl-mark">로컬 동네</span></h2>
        </div>
        <span className="klai-tag">{anyLive ? "🟢 네이버 실시간 · 클릭 = 멀티플랫폼 상세" : "에디토리얼 큐레이션 · 클릭 = 상세"}</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TRENDING_LOCALS.map((l) => {
          const cat = CATS[l.cat];
          const lv = live[l.name];
          return (
            <button key={l.name} type="button" onClick={() => setModal(l)} className="lift flex flex-col rounded-2xl border border-line bg-card2/40 p-5 text-left transition hover:border-blue/40">
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full px-2.5 py-1 text-[11px] font-extrabold" style={{ background: cat.c, color: cat.on }}>{cat.label}</span>
                <span className="text-[11.5px] font-semibold text-muted2">{l.region}</span>
              </div>
              <h3 className="mt-2.5 text-[19px] font-extrabold text-ink">{l.name}</h3>

              {lv ? (
                <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11.5px] font-bold">
                  <span className="text-muted">검색 {lv.trendNow}</span>
                  <span style={{ color: lv.trendDelta >= 0 ? "var(--gB)" : "var(--warn)" }}>{lv.trendDelta >= 0 ? "▲" : "▼"}{Math.abs(lv.trendDelta)} <span className="font-semibold text-muted2">1년</span></span>
                  <span className="text-muted2">·</span>
                  <span className="text-muted">📰 {lv.newsTotal.toLocaleString()}건</span>
                  <span className="rounded-full px-1.5 py-0.5 text-[10.5px]" style={{ background: lv.sentiment >= 10 ? "rgba(22,163,74,.15)" : lv.sentiment <= -10 ? "rgba(225,29,72,.15)" : "var(--navy)", color: lv.sentiment >= 10 ? "var(--gB)" : lv.sentiment <= -10 ? "var(--warn)" : "var(--muted2)" }}>
                    {lv.sentiment >= 10 ? "긍정" : lv.sentiment <= -10 ? "위기" : "중립"}
                  </span>
                </div>
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
                    <span key={t} className="rounded-full bg-navy/40 px-2 py-0.5 text-[11px] font-semibold text-muted2">#{t}</span>
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
        카드 클릭 → 네이버 뉴스·블로그·카페·검색트렌드(실연동) + 유튜브 + 인스타·X·쓰레드 검토 링크 · BIGKINDS는 API 종료로 미사용
      </p>
      {modal && <LocalDetailModal local={modal} onClose={() => setModal(null)} />}
    </div>
  );
}
