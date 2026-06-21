"use client";

import { useEffect, useState } from "react";
import { TRENDING_LOCALS, CATS, naverSearchUrl } from "@/lib/trendingLocals";

interface LocalLive {
  newsTotal: number;
  trendNow: number;
  trendDelta: number;
  sentiment: number;
  headlines: { title: string; date: string; link: string; tone: 1 | 0 | -1 }[];
}

const TONE_C = (t: 1 | 0 | -1) => (t > 0 ? "#16a34a" : t < 0 ? "#e11d48" : "#94a3b8");

export function TrendingLocals() {
  const [live, setLive] = useState<Record<string, LocalLive>>({});
  const [loaded, setLoaded] = useState(false);

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
          <span className="klai-eyebrow">News · Blog Buzz</span>
          <h2 className="mt-1 text-[1.4rem] font-extrabold tracking-tight sm:text-[1.7rem]">📰 지금 뜨는 <span className="hl-mark">로컬 동네</span></h2>
        </div>
        <span className="klai-tag">{anyLive ? "🟢 네이버 검색·뉴스 실시간" : "에디토리얼 큐레이션 · 네이버 연동"}</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TRENDING_LOCALS.map((l) => {
          const cat = CATS[l.cat];
          const lv = live[l.name];
          return (
            <article key={l.name} className="lift flex flex-col rounded-2xl border border-line bg-card2/40 p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full px-2.5 py-1 text-[11px] font-extrabold" style={{ background: cat.c, color: cat.on }}>{cat.label}</span>
                <span className="text-[11.5px] font-semibold text-muted2">{l.region}</span>
              </div>
              <h3 className="mt-2.5 text-[19px] font-extrabold text-ink">{l.name}</h3>

              {/* 네이버 실시간 지표 */}
              {lv ? (
                <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11.5px] font-bold">
                  <span className="text-muted" title="최근월 상대 검색량(0~100)">검색 {lv.trendNow}</span>
                  <span style={{ color: lv.trendDelta >= 0 ? "var(--gB)" : "var(--warn)" }} title="1년 전 대비 검색량 변화">
                    {lv.trendDelta >= 0 ? "▲" : "▼"}{Math.abs(lv.trendDelta)} <span className="font-semibold text-muted2">1년</span>
                  </span>
                  <span className="text-muted2">·</span>
                  <span className="text-muted">📰 {lv.newsTotal.toLocaleString()}건</span>
                  <span className="rounded-full px-1.5 py-0.5 text-[10.5px]" style={{ background: lv.sentiment >= 10 ? "rgba(22,163,74,.15)" : lv.sentiment <= -10 ? "rgba(225,29,72,.15)" : "var(--navy)", color: lv.sentiment >= 10 ? "var(--gB)" : lv.sentiment <= -10 ? "var(--warn)" : "var(--muted2)" }}>
                    {lv.sentiment >= 10 ? "긍정 분위기" : lv.sentiment <= -10 ? "위기 신호" : "중립"}
                  </span>
                </div>
              ) : (
                <p className="mt-2 text-[13px] leading-relaxed text-muted">{l.blurb}</p>
              )}

              {/* 실제 헤드라인 (네이버 뉴스) */}
              {lv?.headlines?.length ? (
                <div className="mt-2.5 space-y-1.5 border-t border-line pt-2.5">
                  {lv.headlines.map((h, i) => (
                    <a key={i} href={h.link} target="_blank" rel="noopener noreferrer" className="flex gap-1.5 text-[12px] leading-snug text-muted hover:text-ink">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: TONE_C(h.tone) }} />
                      <span className="line-clamp-2">{h.title}</span>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="mt-2.5 flex flex-wrap gap-1">
                  {l.tags.map((t) => (
                    <span key={t} className="rounded-full bg-navy/40 px-2 py-0.5 text-[11px] font-semibold text-muted2">#{t}</span>
                  ))}
                </div>
              )}

              <div className="mt-auto flex items-center gap-3 pt-4 text-[12.5px] font-bold">
                <a href={naverSearchUrl("news", l.query)} target="_blank" rel="noopener noreferrer" className="text-blue-l hover:underline">📰 뉴스</a>
                <a href={naverSearchUrl("blog", l.query)} target="_blank" rel="noopener noreferrer" className="text-blue-l hover:underline">✍️ 블로그</a>
                <span className="ml-auto text-[11px] text-muted2">{lv ? "네이버 실시간" : loaded ? "네이버 검색 →" : "불러오는 중…"}</span>
              </div>
            </article>
          );
        })}
      </div>
      <p className="mt-4 text-center text-[11.5px] text-muted2">
        네이버 검색 트렌드(데이터랩)·뉴스 검색 실시간 연동 · 6시간 캐시 · 헤드라인은 실제 기사 · BIGKINDS는 API 종료로 미사용
      </p>
    </div>
  );
}
