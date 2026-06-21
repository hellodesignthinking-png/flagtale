"use client";

import { useEffect, useState, type ReactNode } from "react";
import { type TrendingLocal, CATS, platformLinks } from "@/lib/trendingLocals";

interface Tone { pos: number; neg: number; neut: number; sentiment: number; positiveRatio: number }
interface Detail {
  news: { newsTotal: number; sentiment: number; headlines: { title: string; date: string; link: string; tone: 1 | 0 | -1 }[] } | null;
  social: { blog: { total: number }; cafe: { total: number }; totalPosts: number; combined: Tone; recent: { title: string; channel: "blog" | "cafe"; date: string; link: string; tone: 1 | 0 | -1 }[] } | null;
  youtube: { videoTotal: number; topVideos: { title: string; channel: string; date: string; videoId?: string; tone: 1 | 0 | -1 }[] } | null;
  trend: { now: number; delta: number } | null;
  youtubeEnabled: boolean;
}

const toneDot = (t: 1 | 0 | -1) => (t > 0 ? "#16a34a" : t < 0 ? "#e11d48" : "#94a3b8");

function Tones({ a }: { a: Tone }) {
  const tot = a.pos + a.neg + a.neut || 1;
  return (
    <div>
      <div className="flex h-2 overflow-hidden rounded-full">
        <div style={{ width: `${(a.pos / tot) * 100}%`, background: "#16a34a" }} />
        <div style={{ width: `${(a.neut / tot) * 100}%`, background: "#cbd5e1" }} />
        <div style={{ width: `${(a.neg / tot) * 100}%`, background: "#e11d48" }} />
      </div>
      <div className="mt-1 text-[11px] text-muted2">긍정 {a.pos} · 중립 {a.neut} · 부정 {a.neg} <span className="font-bold" style={{ color: a.sentiment >= 0 ? "var(--gB)" : "var(--warn)" }}>({a.sentiment >= 0 ? "+" : ""}{a.sentiment})</span></div>
    </div>
  );
}

const PLATFORMS = (l: TrendingLocal) => {
  const u = platformLinks(l);
  return [
    { label: "네이버 블로그", icon: "📝", href: u.naverBlog, live: true },
    { label: "네이버 카페", icon: "☕", href: u.naverCafe, live: true },
    { label: "유튜브", icon: "▶️", href: u.youtube, live: false },
    { label: "인스타그램", icon: "📷", href: u.instagram, live: false },
    { label: "X (트위터)", icon: "𝕏", href: u.x, live: false },
    { label: "쓰레드", icon: "🧵", href: u.threads, live: false },
  ];
};

export function LocalDetailModal({ local, onClose }: { local: TrendingLocal; onClose: () => void }) {
  const [d, setD] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const cat = CATS[local.cat];

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    let on = true;
    setLoading(true);
    fetch(`/api/local-detail?q=${encodeURIComponent(local.apiQuery)}`)
      .then((r) => r.json())
      .then((j) => on && setD(j))
      .catch(() => {})
      .finally(() => on && setLoading(false));
    return () => {
      on = false;
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [local, onClose]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true">
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-auto rounded-3xl border border-line bg-card2 p-6 text-ink shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} aria-label="닫기" className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-navy/60 text-[15px] text-muted hover:text-ink">✕</button>
        <div className="flex items-center gap-2 pr-8">
          <span className="rounded-full px-2.5 py-1 text-[11px] font-extrabold" style={{ background: cat.c, color: cat.on }}>{cat.label}</span>
          <span className="text-[11.5px] font-semibold text-muted2">{local.region}</span>
        </div>
        <h3 className="mt-2 text-[22px] font-extrabold">{local.name}</h3>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">{local.blurb}</p>

        {loading ? (
          <div className="grid place-items-center py-12"><div className="h-7 w-7 animate-spin rounded-full border-2 border-line border-t-blue-l" /></div>
        ) : (
          <>
            {/* 요약 지표 */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              <Metric label="검색 트렌드" value={d?.trend ? `${d.trend.now}` : "—"} sub={d?.trend ? `${d.trend.delta >= 0 ? "▲" : "▼"}${Math.abs(d.trend.delta)} 1년` : ""} up={!!d?.trend && d.trend.delta >= 0} />
              <Metric label="뉴스 기사" value={d?.news ? d.news.newsTotal.toLocaleString() : "—"} sub="건" />
              <Metric label="블로그+카페" value={d?.social ? d.social.totalPosts.toLocaleString() : "—"} sub="등록" />
            </div>

            {/* 네이버 블로그·카페 버즈 */}
            {d?.social && (
              <Section title="📝 네이버 블로그·카페" right={`블로그 ${d.social.blog.total.toLocaleString()} · 카페 ${d.social.cafe.total.toLocaleString()}`}>
                <Tones a={d.social.combined} />
                <div className="mt-2 space-y-1.5">
                  {d.social.recent.slice(0, 4).map((p, i) => (
                    <a key={i} href={p.link} target="_blank" rel="noopener noreferrer" className="flex gap-1.5 text-[12px] leading-snug text-muted hover:text-ink">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: toneDot(p.tone) }} />
                      <span className="line-clamp-1">{p.title}</span>
                      <span className="ml-auto shrink-0 text-[10px] text-muted2">{p.channel === "blog" ? "블로그" : "카페"}</span>
                    </a>
                  ))}
                </div>
              </Section>
            )}

            {/* 유튜브 */}
            <Section title="▶️ 유튜브" right={d?.youtube ? `영상 ${d.youtube.videoTotal.toLocaleString()}+` : ""}>
              {d?.youtube ? (
                <div className="space-y-1.5">
                  {d.youtube.topVideos.slice(0, 4).map((v, i) => (
                    <a key={i} href={v.videoId ? `https://www.youtube.com/watch?v=${v.videoId}` : platformLinks(local).youtube} target="_blank" rel="noopener noreferrer" className="flex gap-1.5 text-[12px] leading-snug text-muted hover:text-ink">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: toneDot(v.tone) }} />
                      <span className="line-clamp-1">{v.title}</span>
                      <span className="ml-auto shrink-0 text-[10px] text-muted2">{v.channel}</span>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] text-muted2">{d?.youtubeEnabled ? "관련 영상 없음" : "YOUTUBE_API_KEY 발급 시 영상 수·제목·긍부정 자동 분석. 지금은 아래 ‘유튜브’ 버튼으로 검색 →"}</p>
              )}
            </Section>

            {/* 뉴스 헤드라인 */}
            {d?.news && d.news.headlines.length > 0 && (
              <Section title="📰 최신 기사">
                <div className="space-y-1.5">
                  {d.news.headlines.slice(0, 4).map((h, i) => (
                    <a key={i} href={h.link} target="_blank" rel="noopener noreferrer" className="flex gap-1.5 text-[12px] leading-snug text-muted hover:text-ink">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: toneDot(h.tone) }} />
                      <span className="line-clamp-1">{h.title}</span>
                    </a>
                  ))}
                </div>
              </Section>
            )}
          </>
        )}

        {/* 플랫폼별 콘텐츠 검토(딥링크) */}
        <div className="mt-4 border-t border-line pt-3">
          <div className="mb-2 text-[12px] font-extrabold text-ink">플랫폼별 지역 콘텐츠 보기 →</div>
          <div className="grid grid-cols-3 gap-2">
            {PLATFORMS(local).map((p) => (
              <a key={p.label} href={p.href} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 rounded-xl border border-line bg-card2/60 px-2 py-2 text-[12px] font-bold text-ink transition hover:border-blue/50">
                <span>{p.icon}</span>
                <span className="truncate">{p.label}</span>
              </a>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted2">네이버 블로그·카페·뉴스·검색트렌드 = API 실연동 · 유튜브 = 키 발급 시 · 인스타·X·쓰레드 = 공개 검색 API 없음/유료 → 링크로 검토</p>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, sub, up }: { label: string; value: string; sub?: string; up?: boolean }) {
  return (
    <div className="rounded-xl border border-line bg-navy/30 px-3 py-2 text-center">
      <div className="text-[10.5px] text-muted2">{label}</div>
      <div className="text-[17px] font-extrabold tabular-nums text-ink">{value}</div>
      {sub && <div className="text-[10.5px] font-bold" style={{ color: up === undefined ? "var(--muted2)" : up ? "var(--gB)" : "var(--warn)" }}>{sub}</div>}
    </div>
  );
}

function Section({ title, right, children }: { title: string; right?: string; children: ReactNode }) {
  return (
    <div className="mt-3 rounded-2xl border border-line bg-navy/20 p-3.5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[12.5px] font-extrabold text-ink">{title}</span>
        {right && <span className="text-[11px] font-semibold text-muted2">{right}</span>}
      </div>
      {children}
    </div>
  );
}
