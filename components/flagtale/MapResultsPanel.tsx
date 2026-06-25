"use client";

import Link from "next/link";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { ftImage, type MapItem } from "@/lib/flagtale-types";
import { openState, type NowT } from "@/lib/openNow";
import { MapFilterBar } from "./MapFilterBar";
import { SpotEditor } from "./SpotEditor";
import { SpotKlaiPanel } from "./SpotKlaiPanel";
import { checkIn, isCheckedToday, toggleRoute, inRoute, onGameChange, earnedBadgeIds, BADGES, getDevice, type Badge } from "@/lib/game";
import { createClient } from "@/lib/supabase/client";

export const SORTS = [
  { key: "rating", label: "평점순" },
  { key: "dist", label: "거리순" },
  { key: "name", label: "이름순" },
  { key: "cat", label: "종류순" },
] as const;

export function sortItems(items: MapItem[], sort: string, center?: [number, number]): MapItem[] {
  const a = [...items];
  if (sort === "dist" && center) a.sort((x, y) => ((x.lng - center[0]) ** 2 + (x.lat - center[1]) ** 2) - ((y.lng - center[0]) ** 2 + (y.lat - center[1]) ** 2));
  else if (sort === "rating") a.sort((x, y) => (y.rating ?? 0) - (x.rating ?? 0));
  else if (sort === "name") a.sort((x, y) => x.name.localeCompare(y.name, "ko"));
  else if (sort === "cat") a.sort((x, y) => x.cat.localeCompare(y.cat) || x.name.localeCompare(y.name, "ko"));
  return a;
}

const naverSearchUrl = (it: MapItem) => it.naverUrl || `https://map.naver.com/p/search/${encodeURIComponent(`${it.name} ${it.region}`)}`;
const naverReviewUrl = (it: MapItem) => `https://map.naver.com/p/search/${encodeURIComponent(`${it.name} ${it.region}`)}?c=15.00,0,0,0,dh`;
const naverDirectionsUrl = (it: MapItem) => `https://map.naver.com/p/directions/-/${it.lng},${it.lat},${encodeURIComponent(it.name)},,/-/walk?c=15,0,0,0,dh`;
const galleryOf = (it: MapItem) => {
  const a = it.images?.length ? [...it.images] : it.image ? [it.image] : [];
  if (process.env.NEXT_PUBLIC_NAVER_STATICMAP === "1") a.push(`/api/naver/staticmap?lat=${it.lat}&lng=${it.lng}&w=720&h=320`); // NCP 활성 시 위치 지도 슬라이드
  return a;
};
const imgSrc = (s: string) => (s.startsWith("/") || s.startsWith("http") ? s : ftImage(s));

interface Cat { key: string; label: string; emoji: string; color: string; count: number }

// 네이버 부동산식 오버레이 — 검색·필터(카테고리/가격/평점)·뷰포트 동기 목록 + 즐겨찾기/비교 + 갤러리·탭 상세(정보·리뷰·시세·지역·네이버)
export function MapResultsPanel({
  title, badge, items, filtered, view, cats, regions, onRegion, selCats, onToggleCat, sort, onSort,
  query, onQuery, viewportOnly, onViewportToggle, priceBand, onPriceBand, minRating, onMinRating,
  now, openOnly, onOpenToggle, onReset, recentCount, recentOnly, onRecentToggle,
  favs, onFav, favOnly, onFavToggle, hoverId, onHover, selId, sel, onSelect, onClose, onRoadview, onSpotAdded,
}: {
  title?: string; badge: string;
  items: MapItem[]; filtered: MapItem[]; view?: MapItem[]; cats: Cat[];
  regions?: string[]; onRegion?: (r: string) => void;
  selCats: string[]; onToggleCat: (k: string) => void;
  sort: string; onSort: (s: string) => void;
  query?: string; onQuery?: (q: string) => void;
  viewportOnly?: boolean; onViewportToggle?: () => void;
  priceBand?: string; onPriceBand?: (b: string) => void; minRating?: number; onMinRating?: (r: number) => void;
  now?: NowT | null; openOnly?: boolean; onOpenToggle?: () => void; onReset?: () => void;
  recentCount?: number; recentOnly?: boolean; onRecentToggle?: () => void;
  favs?: string[]; onFav?: (id: string) => void; favOnly?: boolean; onFavToggle?: () => void;
  hoverId?: string | null; onHover?: (id: string | null) => void;
  selId: string | null; sel: MapItem | null;
  onSelect: (id: string) => void; onClose: () => void; onRoadview?: (it: MapItem) => void;
  onSpotAdded?: (s: MapItem) => void;
}) {
  const [naverResults, setNaverResults] = useState<{ name: string; category?: string; address?: string; link?: string; lat: number; lng: number }[]>([]);
  const [naverBusy, setNaverBusy] = useState(false);
  const [spotMsg, setSpotMsg] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [editingSpot, setEditingSpot] = useState<MapItem | null>(null);
  useEffect(() => {
    const s = createClient();
    if (!s) return;
    s.auth.getUser().then(({ data }) => setLoggedIn(!!data.user));
    const { data } = s.auth.onAuthStateChange((_e, sess) => setLoggedIn(!!sess?.user));
    return () => data.subscription.unsubscribe();
  }, []);
  async function reportSpot(id: string) {
    if (!loggedIn) { setSpotMsg("신고하려면 로그인이 필요해요"); setTimeout(() => setSpotMsg(""), 2600); return; }
    try { const d = await fetch("/api/spots/report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }).then((r) => r.json()); setSpotMsg(d?.already ? "이미 신고했어요" : "🚩 신고 접수됨"); } catch { setSpotMsg("신고 실패"); }
    setTimeout(() => setSpotMsg(""), 2600);
  }
  async function searchNaver() {
    if (!query || query.trim().length < 2) return;
    setNaverBusy(true);
    try {
      const d = await fetch(`/api/naver/search?q=${encodeURIComponent(query)}`).then((r) => (r.ok ? r.json() : null));
      const found = (d?.items ?? []).filter((r: { name: string }) => !items.some((i) => i.name.includes(r.name) || r.name.includes(i.name)));
      setNaverResults(found);
    } catch { /* noop */ }
    setNaverBusy(false);
  }
  async function registerSpot(nr: { name: string; category?: string; address?: string; link?: string; lat: number; lng: number }) {
    if (!loggedIn) { setSpotMsg("로그인 후 등록할 수 있어요 →"); setTimeout(() => setSpotMsg(""), 2800); return; }
    setNaverBusy(true); setSpotMsg("");
    try {
      const region = nr.address?.match(/\S+(시|군|구)/)?.[0] ?? "";
      const d = await fetch("/api/spots", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...nr, region }) }).then((r) => r.json());
      if (d?.spot) { onSpotAdded?.(d.spot as MapItem); setNaverResults((rs) => rs.filter((x) => x.name !== nr.name)); setSpotMsg(`✓ '${nr.name}' 스팟 등록됨`); }
      else if (d?.dup) { setSpotMsg("이미 등록된 곳이에요"); }
      else setSpotMsg("등록 실패 (로그인/연동 확인)");
    } catch { setSpotMsg("등록 실패"); }
    setNaverBusy(false);
    setTimeout(() => setSpotMsg(""), 2600);
  }
  const cardRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [tab, setTab] = useState<"info" | "klai" | "review" | "chart" | "region" | "naver">("info");
  const [copied, setCopied] = useState(false);
  const [, bumpGame] = useReducer((n: number) => n + 1, 0); // 게임 상태 변경 시 리렌더
  const [reward, setReward] = useState<number | null>(null); // 체크인 보상 토스트
  const [badgeToast, setBadgeToast] = useState<Badge | null>(null); // 새 업적 토스트
  useEffect(() => onGameChange(() => bumpGame()), []);
  function doCheckIn(it: MapItem) {
    const before = earnedBadgeIds();
    const { reward: r } = checkIn(it.id, it.region);
    if (r > 0) {
      setReward(r); setTimeout(() => setReward(null), 2400);
      if (it.region) { const dev = getDevice(); fetch("/api/territory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deviceId: dev.id, name: dev.name, region: it.region }) }).catch(() => {}); }
    }
    const newId = earnedBadgeIds().find((b) => !before.includes(b));
    const b = newId ? BADGES.find((x) => x.id === newId) : null;
    if (b) { setBadgeToast(b); setTimeout(() => setBadgeToast(null), 3400); }
  }
  const [gIdx, setGIdx] = useState(0);
  const [compareOpen, setCompareOpen] = useState(false);
  const [detailCollapsed, setDetailCollapsed] = useState(false);
  const [place, setPlace] = useState<{ category?: string; telephone?: string; address?: string; roadAddress?: string; link?: string } | null>(null);
  const [trend, setTrend] = useState<{ period: string; ratio: number }[] | null>(null);
  const [listView, setListView] = useState<"list" | "map">("list");
  const [sheet, setSheet] = useState<"peek" | "full">("peek"); // 모바일 바텀시트 높이(네이버부동산식 펼치기)
  const list = view ?? filtered;
  const isFav = (id: string) => !!favs?.includes(id);
  const gallery = sel ? galleryOf(sel) : [];
  const OpenBadge = ({ hours, big }: { hours?: string | null; big?: boolean }) => {
    const os = openState(hours, now ?? null);
    if (!os) return null;
    return <span className={`rounded-full font-extrabold ${big ? "px-2 py-0.5 text-[11px]" : "px-1.5 py-0.5 text-[9px]"} ${os === "open" ? "bg-[#03c75a]/15 text-[#03a04a]" : "bg-card2 text-muted2"}`}>{os === "open" ? "🟢 영업중" : "영업종료"}</span>;
  };

  useEffect(() => { setTab("info"); setGIdx(0); setDetailCollapsed(false); }, [selId]);
  useEffect(() => { if (selId) setTimeout(() => cardRefs.current.get(selId)?.scrollIntoView({ block: "nearest", behavior: "smooth" }), 60); }, [selId]);
  useEffect(() => { if (hoverId) cardRefs.current.get(hoverId)?.scrollIntoView({ block: "nearest" }); }, [hoverId]);
  useEffect(() => {
    setPlace(null);
    if (!sel || tab !== "naver") return;
    let alive = true;
    fetch(`/api/naver/place?q=${encodeURIComponent(`${sel.name} ${sel.region}`)}`).then((r) => (r.ok ? r.json() : null)).then((d) => { if (alive && d?.items?.length) setPlace(d.items[0]); }).catch(() => {});
    return () => { alive = false; };
  }, [sel, tab]);
  useEffect(() => {
    setTrend(null);
    if (!sel || tab !== "chart") return;
    let alive = true;
    fetch(`/api/naver/trend?q=${encodeURIComponent(sel.region)}`).then((r) => (r.ok ? r.json() : null)).then((d) => { if (alive && d?.series?.length) setTrend(d.series); }).catch(() => {});
    return () => { alive = false; };
  }, [sel, tab]);
  useEffect(() => {
    if (!sel && !compareOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { if (compareOpen) setCompareOpen(false); else onClose(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sel, onClose, compareOpen]);

  const bookable = sel && (sel.kind === "tour" || sel.kind === "stay");
  const idx = sel ? list.findIndex((i) => i.id === sel.id) : -1;
  const go = (d: number) => { const n = list[idx + d]; if (n) onSelect(n.id); };
  const favItems = useMemo(() => items.filter((i) => favs?.includes(i.id)), [items, favs]);

  const region = useMemo(() => {
    if (!sel) return null;
    const ri = items.filter((i) => i.region === sel.region);
    const rated = ri.filter((i) => i.rating);
    const byCat = new Map<string, { label: string; emoji: string; color: string; n: number }>();
    ri.forEach((i) => { const c = byCat.get(i.cat) ?? { label: i.catLabel, emoji: i.emoji, color: i.color, n: 0 }; c.n++; byCat.set(i.cat, c); });
    return { count: ri.length, avg: rated.length ? Math.round((rated.reduce((s, i) => s + (i.rating ?? 0), 0) / rated.length) * 10) / 10 : 0, cats: [...byCat.values()].sort((a, b) => b.n - a.n), top: [...ri].filter((i) => i.id !== sel.id).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 4) };
  }, [sel, items]);
  // 주변 가까운 곳 (거리순 인접 콘텐츠)
  const nearby = useMemo(() => {
    if (!sel) return [];
    return items.filter((i) => i.id !== sel.id).map((i) => ({ i, d: (i.lng - sel.lng) ** 2 + (i.lat - sel.lat) ** 2 })).sort((a, b) => a.d - b.d).slice(0, 4).map((x) => x.i);
  }, [sel, items]);

  // 시세 스타일 포지셔닝 — 동종 카테고리 내 가격(또는 평점) 분포에서 이 곳의 위치 (실데이터)
  const posChart = useMemo(() => {
    if (!sel) return null;
    const isPrice = !!sel.price;
    const group = items.filter((i) => i.cat === sel.cat && (isPrice ? i.price : i.rating));
    const vals = group.map((i) => (isPrice ? i.price! : i.rating!));
    if (vals.length < 2) return { isPrice, enough: false } as const;
    const min = Math.min(...vals), max = Math.max(...vals), avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const val = isPrice ? sel.price! : sel.rating!;
    const rank = vals.filter((v) => v > val).length + 1;
    return { isPrice, enough: true, min, max, avg, val, n: vals.length, rank, regionAvg: region?.avg ?? 0 } as const;
  }, [sel, items, region]);
  const fmtMetric = (x: number, isPrice: boolean) => (isPrice ? (x >= 10000 ? `${Math.round((x / 10000) * 10) / 10}만` : `${Math.round(x).toLocaleString()}원`) : `★${Math.round(x * 10) / 10}`);

  function share(it: MapItem) {
    const url = `${window.location.origin}${window.location.pathname}?sel=${it.id}`;
    const data = { title: it.name, text: `${it.name} · ${it.region} | Flagtale`, url };
    if (navigator.share) navigator.share(data).catch(() => {});
    else { try { navigator.clipboard?.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* noop */ } }
  }

  const InfoRow = ({ k, v }: { k: string; v?: string | null }) => v ? <div className="flex gap-2 border-t border-line py-2 text-[12.5px]"><span className="w-14 shrink-0 font-bold text-muted2">{k}</span><span className="flex-1 font-semibold text-ink">{v}</span></div> : null;
  const Stars = ({ r }: { r: number }) => <span className="text-[14px] tracking-tight text-[#f5a623]">{"★".repeat(Math.round(r))}<span className="text-line">{"★".repeat(5 - Math.round(r))}</span></span>;
  const trendSvg = (s: { period: string; ratio: number }[], color: string) => {
    const W = 300, H = 70, pad = 5, max = Math.max(...s.map((p) => p.ratio), 1), n = s.length;
    const X = (i: number) => pad + (i / (n - 1 || 1)) * (W - 2 * pad);
    const Y = (v: number) => H - pad - (v / max) * (H - 2 * pad);
    const line = s.map((p, i) => `${i ? "L" : "M"}${X(i).toFixed(1)},${Y(p.ratio).toFixed(1)}`).join(" ");
    const area = `${line} L${X(n - 1).toFixed(1)},${(H - pad).toFixed(1)} L${X(0).toFixed(1)},${(H - pad).toFixed(1)} Z`;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height: 70 }}>
        <path d={area} fill={`${color}1f`} />
        <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
        <circle cx={X(n - 1)} cy={Y(s[n - 1].ratio)} r={3.2} fill={color} />
      </svg>
    );
  };

  return (
    <>
      {/* 상단 필터바 — 네이버 부동산식 드롭다운(종류·가격·평점·정렬) + 토글(영업중·즐겨찾기·최근) */}
      <MapFilterBar
        items={items} cats={cats} regions={regions} onRegion={onRegion} selCats={selCats} onToggleCat={onToggleCat}
        priceBand={priceBand} onPriceBand={onPriceBand} minRating={minRating} onMinRating={onMinRating}
        sort={sort} onSort={onSort} openOnly={openOnly} onOpenToggle={onOpenToggle}
        favs={favs} favOnly={favOnly} onFavToggle={onFavToggle}
        recentCount={recentCount} recentOnly={recentOnly} onRecentToggle={onRecentToggle} onReset={onReset}
      />

      {/* 좌측 목록 패널 */}
      <div className={`absolute inset-x-2 bottom-2 z-20 ${listView === "map" ? "hidden md:flex" : "flex"} ${sheet === "full" ? "max-h-[86%]" : "max-h-[46%]"} flex-col overflow-hidden rounded-[18px] border-[1.5px] border-line bg-card shadow-2xl transition-[max-height] duration-300 md:inset-x-auto md:bottom-3 md:left-3 md:top-[60px] md:max-h-[calc(100%_-_72px)] md:w-[372px]`}>
        {/* 드래그 핸들 — 네이버부동산식 시트 펼치기/접기 (모바일) */}
        <button onClick={() => setSheet((s) => (s === "peek" ? "full" : "peek"))} className="flex shrink-0 flex-col items-center gap-1 border-b border-line py-2 active:bg-card2 md:hidden" aria-label={sheet === "peek" ? "목록 펼치기" : "목록 접기"}>
          <span className="h-1 w-10 rounded-full bg-line" />
          <span className="text-[10.5px] font-extrabold text-muted2">{sheet === "peek" ? `▲ 목록 ${list.length}곳 더 보기` : "▼ 지도 보기"}</span>
        </button>
        {onQuery && (
          <div className="shrink-0 border-b border-line p-2.5">
            <div className="flex items-center gap-2 rounded-full bg-card2 px-3 py-2">
              <span className="text-[13px] text-muted2">🔍</span>
              <input value={query ?? ""} onChange={(e) => onQuery(e.target.value)} placeholder="지역·콘텐츠 검색 (예: 강릉, 책방)" className="min-w-0 flex-1 bg-transparent text-[13px] font-semibold text-ink placeholder:text-muted2 focus:outline-none" />
              {query ? <button onClick={() => onQuery("")} className="text-[12px] text-muted2 hover:text-ink">✕</button> : null}
            </div>
          </div>
        )}
        {/* 네이버 검색 → 미등록 매장 스팟 등록 (UGC) */}
        {onQuery && onSpotAdded && (query?.trim().length ?? 0) >= 2 && (
          <div className="shrink-0 border-b border-line px-2.5 py-2">
            {naverResults.length === 0 ? (
              <button onClick={searchNaver} disabled={naverBusy} className="w-full rounded-[10px] border border-dashed border-line py-2 text-[12px] font-bold text-blue-l hover:bg-card2 disabled:opacity-50">{naverBusy ? "네이버 검색 중…" : `🔍 네이버 지도에서 '${query}' 더 찾기 →`}</button>
            ) : (
              <>
                <div className="mb-1.5 px-1 text-[10.5px] font-bold text-muted2">네이버 검색 · 없는 곳을 👥 스팟으로 등록</div>
                <div className="flex flex-col gap-1">
                  {naverResults.map((nr) => (
                    <div key={nr.name + nr.lat} className="flex items-center gap-2 rounded-[10px] border border-line bg-card2/50 px-2 py-1.5">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[8px] bg-[#03c75a]/15 text-[12px] font-black text-[#03a04a]">N</span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12.5px] font-extrabold text-ink">{nr.name}</div>
                        <div className="truncate text-[10.5px] text-muted2">{(nr.category ?? "").split(">").pop()}{nr.address ? ` · ${nr.address}` : ""}</div>
                      </div>
                      <button onClick={() => registerSpot(nr)} disabled={naverBusy} className="shrink-0 rounded-full bg-blue-l px-2.5 py-1 text-[11px] font-extrabold text-white disabled:opacity-50">+ 등록</button>
                    </div>
                  ))}
                </div>
              </>
            )}
            {spotMsg && <div className="mt-1.5 px-1 text-[11px] font-bold text-[#03a04a]">{spotMsg}</div>}
          </div>
        )}
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-line px-3 py-2">
          <div className="flex items-center gap-1.5">
            <span className="font-display text-[13px] font-black tracking-tight text-ink">{list.length}곳</span>
            <button onClick={() => setListView("map")} className="shrink-0 rounded-full bg-card2 px-2 py-0.5 text-[10.5px] font-extrabold text-muted2 hover:text-ink md:hidden">🗺 지도</button>
            {onViewportToggle && (
              <button onClick={onViewportToggle} className={`rounded-full px-2 py-0.5 text-[10.5px] font-extrabold transition-colors ${viewportOnly ? "bg-blue-l text-white" : "bg-card2 text-muted2 hover:text-ink"}`}>{viewportOnly ? "📍 현 지도" : "🌐 전국"}</button>
            )}
            {viewportOnly && filtered.length !== list.length ? <span className="text-[10.5px] text-muted2">/ 전국 {filtered.length}</span> : null}
          </div>
          {(favs?.length ?? 0) >= 2 && <button onClick={() => setCompareOpen(true)} className="shrink-0 rounded-full bg-blue-l px-2.5 py-1 text-[11px] font-extrabold text-white">⚖ 비교 {favs!.length}</button>}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {list.length === 0 ? (
            <div className="grid h-32 place-items-center whitespace-pre-line px-4 text-center text-[12px] text-muted2">{favOnly ? "즐겨찾기한 곳이 없어요.\n♥ 를 눌러 추가하세요." : recentOnly ? "최근 본 곳이 없어요." : "조건에 맞는 결과가 없어요.\n필터를 조정해 보세요."}</div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {list.map((it) => {
                const active = it.id === selId;
                const hovering = hoverId === it.id && !active;
                return (
                  <button key={it.id} ref={(el) => { if (el) cardRefs.current.set(it.id, el); }} onClick={() => onSelect(it.id)} onMouseEnter={() => onHover?.(it.id)} onMouseLeave={() => onHover?.(null)} className={`group flex items-center gap-2.5 rounded-[12px] border-[1.5px] p-2 text-left transition-colors ${active ? "bg-card2" : hovering ? "bg-card2/70" : "border-transparent hover:bg-card2/60"}`} style={active ? { borderColor: it.color } : hovering ? { borderColor: `${it.color}66` } : undefined}>
                    {it.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={ftImage(it.image)} alt="" className="h-12 w-12 shrink-0 rounded-[9px] object-cover" />
                    ) : (
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[9px] text-[19px]" style={{ background: `${it.color}1a` }}>{it.emoji}</span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-full px-1.5 py-0.5 text-[9.5px] font-extrabold" style={{ background: `${it.color}1f`, color: it.color }}>{it.catLabel}</span>
                        <OpenBadge hours={it.hours} />
                        {it.rating ? <span className="text-[10.5px] font-bold text-muted2">★{Math.round(it.rating * 10) / 10}{it.reviewCount ? ` (${it.reviewCount})` : ""}</span> : null}
                        {it.price ? <span className="text-[10.5px] font-bold text-muted2">{it.price.toLocaleString()}원</span> : null}
                      </div>
                      <div className="mt-0.5 truncate text-[13px] font-extrabold tracking-tight text-ink">{it.name}</div>
                      <div className="truncate text-[11px] text-muted">{it.hours ? `🕒 ${it.hours}` : it.sub}</div>
                    </div>
                    {onFav && (
                      <span role="button" tabIndex={-1} onClick={(e) => { e.stopPropagation(); onFav(it.id); }} className={`shrink-0 px-1 text-[16px] leading-none ${isFav(it.id) ? "text-[#e11d48]" : "text-muted2/40 hover:text-[#e11d48]"}`}>{isFav(it.id) ? "♥" : "♡"}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 상세 패널 */}
      {sel && !detailCollapsed && (
        <div className="ft-panel-in absolute inset-x-2 bottom-2 top-auto z-[200] flex max-h-[82%] flex-col overflow-hidden rounded-[18px] border-[1.5px] border-line bg-card shadow-2xl md:inset-x-auto md:bottom-3 md:left-[392px] md:top-[60px] md:max-h-[calc(100%_-_72px)] md:w-[360px]">
          {/* 헤더 — 갤러리 + 액션 */}
          <div className="relative shrink-0">
            {gallery.length ? (
              <div className="relative h-40 w-full overflow-hidden bg-card2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imgSrc(gallery[gIdx])} alt="" className="h-40 w-full object-cover" />
                {gallery.length > 1 && (
                  <>
                    <button onClick={() => setGIdx((i) => (i - 1 + gallery.length) % gallery.length)} className="absolute left-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-ink/55 text-[15px] text-white hover:bg-ink/80">‹</button>
                    <button onClick={() => setGIdx((i) => (i + 1) % gallery.length)} className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-ink/55 text-[15px] text-white hover:bg-ink/80">›</button>
                    <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-ink/55 px-2 py-0.5">
                      {gallery.map((_, i) => <span key={i} className={`h-1.5 rounded-full transition-all ${i === gIdx ? "w-3.5 bg-white" : "w-1.5 bg-white/50"}`} />)}
                    </div>
                    <span className="absolute bottom-2 right-2 rounded-full bg-ink/60 px-2 py-0.5 text-[10px] font-bold text-white">{gIdx + 1}/{gallery.length}</span>
                  </>
                )}
              </div>
            ) : (
              <div className="relative grid h-40 w-full place-items-center" style={{ background: `linear-gradient(135deg, ${sel.color}29, ${sel.color}0d)` }}>
                <span className="text-[62px] drop-shadow-sm">{sel.emoji}</span>
                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-white/75 px-2.5 py-0.5 text-[10px] font-bold text-muted2">📷 사진 준비중</span>
              </div>
            )}
            <div className="absolute left-1/2 top-1.5 h-1 w-10 -translate-x-1/2 rounded-full bg-white/70 md:hidden" />
            <span className="absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold shadow" style={{ background: sel.color, color: "#fff" }}>{sel.emoji} {sel.catLabel}</span>
            <div className="absolute right-2 top-2 flex items-center gap-1.5">
              <button onClick={() => share(sel)} title="공유하기" className="grid h-9 w-9 place-items-center rounded-full bg-white/95 text-[15px] text-ink shadow-md ring-1 ring-black/10 hover:bg-white">↗</button>
              {onFav && <button onClick={() => onFav(sel.id)} title="즐겨찾기" className={`grid h-9 w-9 place-items-center rounded-full bg-white/95 text-[16px] shadow-md ring-1 ring-black/10 hover:bg-white ${isFav(sel.id) ? "text-[#e11d48]" : "text-muted2"}`}>{isFav(sel.id) ? "♥" : "♡"}</button>}
              <button onClick={() => setDetailCollapsed(true)} title="접기" aria-label="접기" className="grid h-9 w-9 place-items-center rounded-full bg-white/95 text-[17px] font-bold text-ink shadow-md ring-1 ring-black/10 hover:bg-white">‹</button>
              <button onClick={onClose} title="닫기" aria-label="닫기" className="grid h-9 w-9 place-items-center rounded-full bg-ink text-[16px] font-bold text-white shadow-md ring-2 ring-white/80 hover:opacity-90">✕</button>
            </div>
            {copied && <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 rounded-full bg-ink/85 px-3 py-1 text-[11px] font-bold text-white">링크가 복사되었어요</div>}
          </div>

          {idx >= 0 && list.length > 1 && (
            <div className="flex shrink-0 items-center justify-between border-b border-line px-3 py-1.5 text-[11.5px] font-bold text-muted2">
              <button onClick={() => go(-1)} disabled={idx <= 0} className="rounded-full px-2 py-1 enabled:hover:bg-card2 enabled:hover:text-ink disabled:opacity-30">← 이전</button>
              <span>{idx + 1} / {list.length}</span>
              <button onClick={() => go(1)} disabled={idx >= list.length - 1} className="rounded-full px-2 py-1 enabled:hover:bg-card2 enabled:hover:text-ink disabled:opacity-30">다음 →</button>
            </div>
          )}

          <div className="shrink-0 px-4 pt-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-[19px] font-black leading-tight tracking-tight text-ink">{sel.name}</h3>
              {sel.rating ? <span className="shrink-0 rounded-full bg-card2 px-2 py-0.5 text-[12px] font-extrabold text-ink">★ {Math.round(sel.rating * 10) / 10}</span> : null}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <OpenBadge hours={sel.hours} big />
              <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-muted">{sel.sub}{sel.reviewCount ? ` · 리뷰 ${sel.reviewCount}` : ""}</span>
            </div>
            <div className="mt-2.5 flex gap-1.5">
              {sel.phone ? <a href={`tel:${sel.phone}`} className="flex flex-1 items-center justify-center gap-1 rounded-[10px] border-[1.5px] border-line py-1.5 text-[12px] font-extrabold text-ink hover:border-ink">📞 전화</a> : null}
              <a href={naverDirectionsUrl(sel)} target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center justify-center gap-1 rounded-[10px] border-[1.5px] border-line py-1.5 text-[12px] font-extrabold text-ink hover:border-ink">🧭 길찾기</a>
              <button onClick={() => share(sel)} className="flex flex-1 items-center justify-center gap-1 rounded-[10px] border-[1.5px] border-line py-1.5 text-[12px] font-extrabold text-ink hover:border-ink">↗ 공유</button>
            </div>
            {/* 게임화 — 체크인 + 루트 */}
            <div className="mt-1.5 flex gap-1.5">
              <button onClick={() => doCheckIn(sel)} disabled={isCheckedToday(sel.id)} className={`flex flex-[1.4] items-center justify-center gap-1 rounded-[10px] py-2 text-[12.5px] font-extrabold transition-colors ${isCheckedToday(sel.id) ? "bg-card2 text-muted2" : "btn-glow bg-amber text-onaccent"}`}>
                {isCheckedToday(sel.id) ? "✓ 오늘 체크인 완료" : "📍 체크인하고 코인 받기"}
              </button>
              <button onClick={() => toggleRoute(sel.id)} className={`flex flex-1 items-center justify-center gap-1 rounded-[10px] border-[1.5px] py-2 text-[12.5px] font-extrabold transition-colors ${inRoute(sel.id) ? "border-blue-l bg-blue-l/10 text-blue-l" : "border-line text-ink hover:border-ink"}`}>
                {inRoute(sel.id) ? "🚩 루트에 담김" : "🚩 루트 추가"}
              </button>
            </div>
            {reward !== null && (
              <div className="ft-panel-in mt-1.5 rounded-[10px] bg-amber/15 py-1.5 text-center text-[12.5px] font-extrabold text-blue-l">🎉 +{reward} 코인 획득!</div>
            )}
            {badgeToast && (
              <div className="ft-panel-in mt-1.5 rounded-[10px] bg-blue-l/10 py-1.5 text-center text-[12.5px] font-extrabold text-blue-l">{badgeToast.emoji} 업적 달성 · {badgeToast.name}!</div>
            )}
            <div className="mt-3 flex gap-0.5 overflow-x-auto border-b border-line">
              {([["info", "정보"], ["klai", "📊 매력도"], ["review", "리뷰"], ["chart", "시세"], ["region", "지역"], ["naver", "네이버"]] as const).map(([k, lbl]) => (
                <button key={k} onClick={() => setTab(k)} className={`-mb-px shrink-0 border-b-2 px-2.5 py-2 text-[12.5px] font-extrabold transition-colors ${tab === k ? "border-ink text-ink" : "border-transparent text-muted2 hover:text-ink"}`}>{lbl}</button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4 pt-3">
            {tab === "klai" && <SpotKlaiPanel item={sel} />}
            {tab === "info" && (
              <div>
                {sel.detail && <p className="text-[13px] leading-relaxed text-muted">{sel.detail}</p>}
                <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
                  {sel.price ? <div className="rounded-[10px] bg-card2 px-2.5 py-2"><div className="text-[10px] text-muted2">{sel.kind === "stay" ? "1박" : "가격"}</div><div className="font-display text-[15px] font-black text-ink">{sel.price.toLocaleString()}<span className="text-[11px]">원</span></div></div> : null}
                  {sel.period ? <div className="rounded-[10px] bg-card2 px-2.5 py-2"><div className="text-[10px] text-muted2">시기</div><div className="text-[13px] font-extrabold text-ink">{sel.period}</div></div> : null}
                  <div className="rounded-[10px] bg-card2 px-2.5 py-2"><div className="text-[10px] text-muted2">지역</div><div className="text-[13px] font-extrabold text-ink">📍 {sel.region}</div></div>
                  {sel.rating ? <div className="rounded-[10px] bg-card2 px-2.5 py-2"><div className="text-[10px] text-muted2">평점</div><div className="text-[13px] font-extrabold text-ink">★ {Math.round(sel.rating * 10) / 10}{sel.reviewCount ? ` · ${sel.reviewCount}` : ""}</div></div> : null}
                </div>
                <div className="mt-1">
                  <InfoRow k="🕒 시간" v={sel.hours} />
                  <InfoRow k="💳 가격대" v={sel.priceRange} />
                  <InfoRow k="📞 전화" v={sel.phone} />
                  <InfoRow k="📌 주소" v={sel.address} />
                </div>
                {sel.tags && sel.tags.length > 0 && <div className="mt-3 flex flex-wrap gap-1">{sel.tags.map((t) => <span key={t} className="rounded-full bg-card2 px-2 py-0.5 text-[10.5px] font-bold text-muted2">#{t}</span>)}</div>}
                {nearby.length > 0 && (
                  <div className="mt-4">
                    <div className="mb-1.5 text-[11px] font-extrabold text-muted2">📍 주변 가까운 곳</div>
                    <div className="flex flex-col gap-1">
                      {nearby.map((n) => (
                        <button key={n.id} onClick={() => onSelect(n.id)} className="flex items-center gap-2 rounded-[10px] border border-line px-2 py-1.5 text-left hover:bg-card2">
                          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[8px] text-[14px]" style={{ background: `${n.color}1a` }}>{n.emoji}</span>
                          <span className="min-w-0 flex-1 truncate text-[12.5px] font-bold text-ink">{n.name}</span>
                          <span className="shrink-0 text-[10.5px] font-bold text-muted2">{n.region}{n.rating ? ` · ★${Math.round(n.rating * 10) / 10}` : ""}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {sel.id.startsWith("ugc-") && (
                  <div className="mt-4 rounded-[12px] border-[1.5px] border-line bg-card2/40 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12px] font-extrabold text-ink">🏷 로컬 팀 운영</span>
                      <button onClick={() => (loggedIn ? setEditingSpot(sel) : (window.location.href = "/auth"))} className="shrink-0 rounded-full bg-ink px-2.5 py-1 text-[11px] font-extrabold text-white hover:opacity-90">✏️ {loggedIn ? "운영 정보 편집" : "로그인하고 편집"}</button>
                    </div>
                    {sel.operator && <div className="mt-2 text-[13px] font-extrabold text-ink">{sel.operator}</div>}
                    {(sel.homepage || sel.instagram || sel.youtube || sel.blog) && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {sel.homepage && <a href={sel.homepage} target="_blank" rel="noopener noreferrer" className="rounded-full border border-line bg-card px-2.5 py-1 text-[11px] font-bold text-ink hover:border-ink">🌐 홈페이지</a>}
                        {sel.instagram && <a href={sel.instagram} target="_blank" rel="noopener noreferrer" className="rounded-full border border-line bg-card px-2.5 py-1 text-[11px] font-bold text-ink hover:border-ink">📸 인스타</a>}
                        {sel.youtube && <a href={sel.youtube} target="_blank" rel="noopener noreferrer" className="rounded-full border border-line bg-card px-2.5 py-1 text-[11px] font-bold text-ink hover:border-ink">▶️ 유튜브</a>}
                        {sel.blog && <a href={sel.blog} target="_blank" rel="noopener noreferrer" className="rounded-full border border-line bg-card px-2.5 py-1 text-[11px] font-bold text-ink hover:border-ink">✍️ 블로그</a>}
                      </div>
                    )}
                    {!sel.operator && !sel.homepage && !sel.instagram && !sel.youtube && !sel.blog && (
                      <p className="mt-1.5 text-[11px] leading-relaxed text-muted2">운영 팀의 홈페이지·인스타그램·유튜브 등이 아직 없어요. {loggedIn ? "운영하신다면 ✏️로 추가해 주세요." : "로그인 후 추가할 수 있어요."}</p>
                    )}
                    <button onClick={() => reportSpot(sel.id)} className="mt-2.5 text-[11px] font-bold text-muted2 hover:text-warn">🚩 잘못된 정보 신고</button>
                    {spotMsg && <span className="ml-2 text-[11px] font-bold text-[#03a04a]">{spotMsg}</span>}
                  </div>
                )}
              </div>
            )}

            {tab === "review" && (
              <div>
                <div className="flex items-center gap-3 rounded-[12px] bg-card2 px-3.5 py-3">
                  <div className="text-center">
                    <div className="font-display text-[26px] font-black leading-none text-ink">{sel.rating ? Math.round(sel.rating * 10) / 10 : "—"}</div>
                    <div className="mt-0.5 text-[10px] font-bold text-muted2">/ 5.0</div>
                  </div>
                  <div className="flex-1">
                    {sel.rating ? <Stars r={sel.rating} /> : <span className="text-[12px] text-muted2">평점 정보 없음</span>}
                    <div className="mt-0.5 text-[11.5px] font-bold text-muted2">리뷰 {sel.reviewCount ?? 0}개</div>
                  </div>
                </div>
                {sel.tags && sel.tags.length > 0 && (
                  <div className="mt-3"><div className="mb-1.5 text-[11px] font-extrabold text-muted2">이런 점이 좋아요</div><div className="flex flex-wrap gap-1">{sel.tags.map((t) => <span key={t} className="rounded-full border border-line px-2 py-0.5 text-[11px] font-bold text-ink">👍 {t}</span>)}</div></div>
                )}
                <div className="mt-3 rounded-[12px] border border-dashed border-line p-3 text-center">
                  <div className="text-[12px] font-bold text-muted">💬 방문자 실제 후기는 네이버 플레이스에서 확인하세요</div>
                  <a href={naverReviewUrl(sel)} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-full bg-[#03c75a] px-4 py-2 text-[12.5px] font-extrabold text-white hover:opacity-90">네이버 리뷰 {sel.reviewCount ? `${sel.reviewCount}개 ` : ""}보기 →</a>
                </div>
                <p className="mt-2 text-center text-[10.5px] text-muted2">평점·리뷰수는 샘플·잠정 데이터입니다.</p>
              </div>
            )}

            {tab === "chart" && (
              <div>
                {/* 실데이터 — 지역 관심도 추이 (네이버 DataLab 검색 트렌드) */}
                <div className="rounded-[12px] border border-line p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-extrabold text-ink">📈 {sel.region} 관심도 추이</span>
                    {trend && trend.length > 1 ? (() => { const a = trend[0].ratio || 1, bb = trend[trend.length - 1].ratio; const dd = Math.round(((bb - a) / a) * 100); return <span className="text-[11px] font-extrabold" style={{ color: dd >= 0 ? "#0F6E5C" : "#D2691E" }}>{dd >= 0 ? "▲" : "▼"} {Math.abs(dd)}%</span>; })() : null}
                  </div>
                  {trend === null ? <div className="mt-2 grid h-[70px] place-items-center text-[11px] text-muted2">불러오는 중…</div>
                    : trend.length > 1 ? (<><div className="mt-2">{trendSvg(trend, sel.color)}</div><div className="mt-1 flex justify-between text-[9.5px] text-muted2"><span>{trend[0].period}</span><span className="font-bold text-[#03a04a]">네이버 검색 · 실데이터</span><span>{trend[trend.length - 1].period}</span></div></>)
                    : <div className="mt-2 grid h-[70px] place-items-center text-[11px] text-muted2">추이 데이터 없음</div>}
                </div>
                {posChart && posChart.enough && (
                  <div className="mt-3">
                    <div className="text-[12px] font-extrabold text-ink">동종 {sel.catLabel} {posChart.isPrice ? "가격" : "평점"} 분포 내 위치</div>
                    <div className="mt-3.5 px-1">
                      <div className="relative h-2.5 rounded-full" style={{ background: `linear-gradient(90deg, ${sel.color}33, ${sel.color})` }}>
                        <div className="absolute -top-1 bottom-[-4px] w-px bg-muted2" style={{ left: `${Math.max(0, Math.min(100, ((posChart.avg - posChart.min) / (posChart.max - posChart.min || 1)) * 100))}%` }} />
                        <div className="absolute -top-2.5 grid -translate-x-1/2 place-items-center" style={{ left: `${Math.max(0, Math.min(100, ((posChart.val - posChart.min) / (posChart.max - posChart.min || 1)) * 100))}%` }}>
                          <span className="h-4 w-4 rounded-full border-[3px] border-white shadow" style={{ background: sel.color }} />
                        </div>
                      </div>
                      <div className="mt-1.5 flex justify-between text-[10px] font-bold text-muted2"><span>{fmtMetric(posChart.min, posChart.isPrice)}</span><span>평균 {fmtMetric(posChart.avg, posChart.isPrice)}</span><span>{fmtMetric(posChart.max, posChart.isPrice)}</span></div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[12px]">
                      <div className="rounded-[10px] bg-card2 py-2"><div className="text-[10px] text-muted2">이 곳</div><div className="font-display text-[14px] font-black" style={{ color: sel.color }}>{fmtMetric(posChart.val, posChart.isPrice)}</div></div>
                      <div className="rounded-[10px] bg-card2 py-2"><div className="text-[10px] text-muted2">동종 평균</div><div className="font-display text-[14px] font-black text-ink">{fmtMetric(posChart.avg, posChart.isPrice)}</div></div>
                      <div className="rounded-[10px] bg-card2 py-2"><div className="text-[10px] text-muted2">순위</div><div className="font-display text-[14px] font-black text-ink">{posChart.rank}/{posChart.n}</div></div>
                    </div>
                  </div>
                )}
                <p className="mt-3 text-[11px] leading-relaxed text-muted2">관심도=네이버 검색량 추이(실데이터) · 동종 분포는 전국 {sel.catLabel} 기준(샘플).</p>
              </div>
            )}

            {tab === "region" && region && (
              <div>
                <div className="flex items-center justify-between rounded-[12px] bg-card2 px-3 py-2.5"><span className="text-[13px] font-extrabold text-ink">📊 {sel.region}</span><span className="text-[11.5px] font-bold text-muted2">콘텐츠 {region.count}곳{region.avg ? ` · ★${region.avg}` : ""}</span></div>
                <div className="mt-2 flex flex-wrap gap-1">{region.cats.map((c) => <span key={c.label} className="rounded-full px-2 py-0.5 text-[10.5px] font-bold" style={{ background: `${c.color}14`, color: c.color }}>{c.emoji} {c.label} {c.n}</span>)}</div>
                {region.top.length > 0 && (
                  <div className="mt-3"><div className="mb-1.5 text-[11px] font-extrabold text-muted2">이 지역 다른 콘텐츠</div><div className="flex flex-col gap-1">
                    {region.top.map((t) => (<button key={t.id} onClick={() => onSelect(t.id)} className="flex items-center gap-2 rounded-[10px] border border-line px-2 py-1.5 text-left hover:bg-card2"><span className="text-[15px]">{t.emoji}</span><span className="min-w-0 flex-1 truncate text-[12.5px] font-bold text-ink">{t.name}</span>{t.rating ? <span className="text-[10.5px] font-bold text-muted2">★{Math.round(t.rating * 10) / 10}</span> : null}</button>))}
                  </div></div>
                )}
                <Link href="/diagnose" className="mt-3 flex items-center justify-center rounded-full bg-ink px-4 py-2.5 text-[13px] font-extrabold text-white hover:opacity-90">이 지역 매력도(KLAI) 진단 →</Link>
              </div>
            )}

            {tab === "naver" && (
              <div>
                {process.env.NEXT_PUBLIC_NAVER_STATICMAP === "1" && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/api/naver/staticmap?lat=${sel.lat}&lng=${sel.lng}`} alt="" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} className="mb-2.5 h-[150px] w-full rounded-[12px] border border-line object-cover" />
                )}
                <div className="rounded-[12px] border border-line p-3">
                  <div className="flex items-center justify-between text-[12px] font-extrabold text-ink">
                    <span className="flex items-center gap-1.5"><span className="grid h-5 w-5 place-items-center rounded bg-[#03c75a] text-[11px] font-black text-white">N</span> 네이버 플레이스 등록정보</span>
                    {place ? <span className="rounded-full bg-[#03c75a]/15 px-2 py-0.5 text-[9.5px] font-bold text-[#03a04a]">실시간 연동</span> : null}
                  </div>
                  <div className="mt-1.5">
                    <InfoRow k="분류" v={place?.category || sel.catLabel + (sel.crew ? ` · ${sel.crew}` : "")} />
                    <InfoRow k="🕒 시간" v={sel.hours} />
                    <InfoRow k="💳 가격" v={sel.priceRange ?? (sel.price ? `${sel.price.toLocaleString()}원` : null)} />
                    <InfoRow k="📞 전화" v={place?.telephone || sel.phone} />
                    <InfoRow k="📌 주소" v={place?.roadAddress || place?.address || sel.address} />
                    <InfoRow k="📍 좌표" v={`${sel.lat.toFixed(5)}, ${sel.lng.toFixed(5)}`} />
                  </div>
                </div>
                <p className="mt-2.5 text-[11.5px] leading-relaxed text-muted2">리뷰·사진·메뉴 등 실시간 등록정보는 네이버 지도에서 확인하세요.</p>
                <a href={place?.link || naverSearchUrl(sel)} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center justify-center gap-1.5 rounded-full bg-[#03c75a] px-4 py-2.5 text-[13px] font-extrabold text-white hover:opacity-90">네이버 지도에서 보기 →</a>
                {onRoadview && <button onClick={() => onRoadview(sel)} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-full border-[1.5px] border-line bg-card px-4 py-2.5 text-[13px] font-extrabold text-ink hover:border-ink">🛣 거리뷰 보기</button>}
              </div>
            )}
          </div>

          <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-line p-3">
            {bookable ? (
              <Link href={sel.kind === "stay" ? `/stay/${sel.id.replace(/^stay-/, "")}` : `/tour/${sel.id.replace(/^tour-/, "")}`} className="btn-glow col-span-2 flex items-center justify-center rounded-full bg-amber px-4 py-2.5 text-[14px] font-extrabold text-onaccent">{sel.kind === "stay" ? "숙소 예약하기" : "투어 예약하기"} →</Link>
            ) : (
              <>
                <Link href="/diagnose" className="flex items-center justify-center rounded-full bg-ink px-3 py-2.5 text-[13px] font-extrabold text-white hover:opacity-90">매력도 진단</Link>
                <Link href={`/hub?region=${encodeURIComponent(sel.region)}`} className="flex items-center justify-center rounded-full border-[1.5px] border-line bg-card px-3 py-2.5 text-[13px] font-extrabold text-ink hover:border-ink">지역 허브</Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* 상세 접힘 → 펼치기 버튼 (오른쪽 그리드 열기) */}
      {sel && detailCollapsed && (
        <button onClick={() => setDetailCollapsed(false)} className="ft-panel-in absolute inset-x-2 bottom-2 top-auto z-[200] flex items-center gap-2 rounded-full border-[1.5px] border-line bg-card px-3 py-2.5 shadow-2xl md:inset-x-auto md:bottom-auto md:left-[392px] md:top-[60px] md:w-[230px]">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[14px]" style={{ background: `${sel.color}1f` }}>{sel.emoji}</span>
          <span className="min-w-0 flex-1 truncate text-left text-[13px] font-extrabold text-ink">{sel.name}</span>
          <span className="shrink-0 rounded-full bg-ink px-2 py-0.5 text-[11px] font-extrabold text-white">펼치기 ›</span>
        </button>
      )}

      {/* 2곳 비교 모달 (찜한 곳 나란히) */}
      {compareOpen && favItems.length >= 2 && (
        <div className="absolute inset-0 z-[210] grid place-items-center bg-black/45 p-3" onClick={() => setCompareOpen(false)}>
          <div className="ft-panel-in flex max-h-[88%] w-full max-w-[760px] flex-col overflow-hidden rounded-[20px] border-[1.5px] border-line bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex shrink-0 items-center justify-between border-b border-line px-4 py-3">
              <span className="font-display text-[15px] font-black text-ink">⚖ 찜한 곳 비교 <span className="text-muted2">({favItems.length})</span></span>
              <button onClick={() => setCompareOpen(false)} className="grid h-8 w-8 place-items-center rounded-full bg-card2 text-[13px] text-ink hover:bg-line">✕</button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto">
              <div className="grid min-w-[480px]" style={{ gridTemplateColumns: `84px repeat(${Math.min(favItems.length, 3)}, minmax(0,1fr))` }}>
                {/* 헤더(사진/이름) */}
                <div className="border-b border-line bg-card2/50 p-2" />
                {favItems.slice(0, 3).map((it) => (
                  <div key={it.id} className="relative border-b border-l border-line p-2 text-center">
                    {onFav && <button onClick={() => onFav(it.id)} className="absolute right-1 top-1 text-[12px] text-muted2 hover:text-[#e11d48]" title="비교 제거">✕</button>}
                    {it.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={ftImage(it.image)} alt="" className="mx-auto h-14 w-full max-w-[120px] rounded-[8px] object-cover" />
                    ) : <div className="mx-auto grid h-14 w-14 place-items-center rounded-[8px] text-[24px]" style={{ background: `${it.color}1a` }}>{it.emoji}</div>}
                    <button onClick={() => { onSelect(it.id); setCompareOpen(false); }} className="mt-1 block w-full truncate text-[12.5px] font-extrabold text-ink hover:underline">{it.name}</button>
                  </div>
                ))}
                {([
                  ["종류", (it: MapItem) => `${it.emoji} ${it.catLabel}`],
                  ["평점", (it: MapItem) => (it.rating ? `★ ${Math.round(it.rating * 10) / 10}${it.reviewCount ? ` (${it.reviewCount})` : ""}` : "—")],
                  ["가격", (it: MapItem) => (it.price ? `${it.price.toLocaleString()}원` : it.priceRange || "—")],
                  ["지역", (it: MapItem) => `📍 ${it.region}`],
                  ["영업", (it: MapItem) => it.hours || "—"],
                  ["주소", (it: MapItem) => it.address || "—"],
                ] as const).map(([label, fn], ri) => (
                  <div key={label} className="contents">
                    <div className={`flex items-center bg-card2/50 px-2.5 py-2.5 text-[11px] font-extrabold text-muted2 ${ri ? "border-t border-line" : ""}`}>{label}</div>
                    {favItems.slice(0, 3).map((it) => (
                      <div key={it.id + label} className={`border-l border-line px-2.5 py-2.5 text-[12px] font-semibold leading-snug text-ink ${ri ? "border-t" : ""}`}>{fn(it)}</div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <p className="shrink-0 border-t border-line px-4 py-2 text-center text-[10.5px] text-muted2">최대 3곳까지 비교 · ♥ 즐겨찾기에서 선택됩니다{favItems.length > 3 ? ` (현재 ${favItems.length}곳 중 3곳 표시)` : ""}</p>
          </div>
        </div>
      )}

      {listView === "map" && (
        <button onClick={() => setListView("list")} className="absolute bottom-3 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-ink px-5 py-2.5 text-[13px] font-extrabold text-white shadow-xl md:hidden">☰ 목록 {list.length}곳</button>
      )}
      {editingSpot && <SpotEditor spot={editingSpot} onClose={() => setEditingSpot(null)} onSaved={(s) => onSpotAdded?.(s)} />}

      <div className="pointer-events-none absolute right-2 top-[54px] z-10 hidden rounded-full bg-[#0d2b5e]/85 px-3 py-1.5 text-[11.5px] font-extrabold text-white md:top-3 md:block">🗺 {badge} · {filtered.length}곳</div>
    </>
  );
}
