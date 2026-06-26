import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { loadSpots, loadTours, loadStays, loadCreators, ftImage, round1 } from "@/lib/flagtale";
import { SPOT_CAT } from "@/lib/flagtale-types";
import { PageShell } from "@/components/page-shell";
import { SearchBox, type IdxItem } from "@/components/search/SearchBox";

export const metadata: Metadata = { title: "검색 — 매장·투어·스테이·크리에이터·동네" };

type SeedPost = { id: string; category: string; region: string; title: string; content: string };
function loadBoard(): SeedPost[] {
  try {
    return (JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "board.json"), "utf-8")).posts ?? []) as SeedPost[];
  } catch {
    return [];
  }
}

export default function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = (searchParams.q ?? "").trim();
  const ql = q.toLowerCase();
  const has = (s?: string | null) => !!s && s.toLowerCase().includes(ql);

  // 자동완성 인덱스(전체 콘텐츠) — 클라이언트 SearchBox가 즉시 필터
  const index: IdxItem[] = [
    ...loadSpots().map((s) => ({ label: s.name, sub: `${SPOT_CAT[s.category]?.label ?? s.category} · ${s.region}`, type: "spot", href: `/spot/${s.id}` })),
    ...loadTours().map((t) => ({ label: t.title, sub: `투어 · ${t.region}`, type: "tour", href: `/tour/${t.id}` })),
    ...loadStays().map((s) => ({ label: s.title, sub: `스테이 · ${s.region}`, type: "stay", href: `/stay/${s.id}` })),
    ...loadCreators().map((c) => ({ label: c.nickname, sub: `크리에이터 · ${c.region}`, type: "creator", href: `/creator/${c.id}` })),
    ...([...new Set(loadSpots().map((s) => s.crew).filter(Boolean))] as string[]).map((cr) => ({ label: cr, sub: "로컬 팀(크루)", type: "crew", href: `/crew/${encodeURIComponent(cr)}` })),
  ];

  const spots = q ? loadSpots().filter((s) => has(s.name) || has(s.region) || has(s.category) || has(s.crew) || has(s.address)).slice(0, 12) : [];
  const tours = q ? loadTours().filter((t) => has(t.title) || has(t.region)).slice(0, 8) : [];
  const stays = q ? loadStays().filter((s) => has(s.title) || has(s.region)).slice(0, 8) : [];
  const creators = q ? loadCreators().filter((c) => has(c.name) || has(c.nickname) || has(c.region) || has(c.specialty) || has(c.description)).slice(0, 8) : [];
  const crews = q ? ([...new Set(loadSpots().map((s) => s.crew).filter(Boolean))] as string[]).filter((cr) => has(cr)).slice(0, 6) : [];
  const posts = q ? loadBoard().filter((p) => has(p.title) || has(p.content) || has(p.region)).slice(0, 8) : [];
  const total = spots.length + tours.length + stays.length + creators.length + crews.length + posts.length;

  return (
    <PageShell width="default">
      <div className="mb-5">
        <span className="klai-eyebrow">🔍 통합 검색</span>
        <h1 className="mt-1.5 font-display text-[clamp(24px,4vw,34px)] font-black tracking-[-0.03em] text-ink">무엇이든 찾아보세요</h1>
        <div className="mt-3.5"><SearchBox index={index} initialQ={q} /></div>
        {q && <p className="mt-2.5 text-[13px] text-muted">“<b className="text-ink">{q}</b>” 검색 결과 <b className="text-ink">{total}</b>건</p>}
      </div>

      {!q ? (
        <div className="rounded-[20px] border-[1.5px] border-dashed border-line bg-card2 px-6 py-14 text-center text-[13.5px] text-muted2">검색어를 입력하면 매장·투어·스테이·크리에이터·크루·게시판을 한 번에 찾아드려요.</div>
      ) : total === 0 ? (
        <div className="rounded-[20px] border-[1.5px] border-line bg-card2 px-6 py-14 text-center">
          <div className="text-[34px]">🔍</div>
          <p className="mt-2 text-[14px] font-bold text-ink">“{q}” 결과가 없어요</p>
          <p className="mt-1 text-[12.5px] text-muted">다른 키워드(동네명·업종·크리에이터)로 검색해 보세요.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {spots.length > 0 && (
            <Group title="🏪 매장·공간" count={spots.length}>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {spots.map((s) => {
                  const m = SPOT_CAT[s.category] ?? { emoji: "📍", label: s.category, color: "#888888" };
                  return (
                    <Link key={s.id} href={`/spot/${s.id}`} className="lift flex items-center gap-3 rounded-[14px] border-[1.5px] border-line bg-card p-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[10px] text-[20px]" style={{ background: `${m.color}1a` }}>{m.emoji}</span>
                      <div className="min-w-0"><div className="truncate text-[14px] font-black text-ink">{s.name}</div><div className="truncate text-[11.5px] text-muted">{m.label} · {s.region}{s.crew ? ` · ${s.crew}` : ""}</div></div>
                    </Link>
                  );
                })}
              </div>
            </Group>
          )}
          {creators.length > 0 && (
            <Group title="🎨 크리에이터" count={creators.length}>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {creators.map((c) => (
                  <Link key={c.id} href={`/creator/${c.id}`} className="lift flex items-center gap-3 rounded-[14px] border-[1.5px] border-line bg-card p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ftImage(c.image)} alt={c.name} className="h-11 w-11 shrink-0 rounded-full object-cover" />
                    <div className="min-w-0"><div className="truncate text-[14px] font-black text-ink">{c.nickname}</div><div className="truncate text-[11.5px] text-muted">{c.name} · {c.region}</div></div>
                  </Link>
                ))}
              </div>
            </Group>
          )}
          {crews.length > 0 && (
            <Group title="🏴 로컬 팀(크루)" count={crews.length}>
              <div className="flex flex-wrap gap-2">
                {crews.map((cr) => <Link key={cr} href={`/crew/${encodeURIComponent(cr)}`} className="lift rounded-full border-[1.5px] border-line bg-card px-4 py-2 text-[13px] font-extrabold text-ink hover:border-ink">🏴 {cr} →</Link>)}
              </div>
            </Group>
          )}
          {tours.length > 0 && (
            <Group title="🎫 투어·워크숍" count={tours.length}>
              <div className="grid gap-3 sm:grid-cols-2">
                {tours.map((t) => (
                  <Link key={t.id} href={`/tour/${t.id}`} className="lift flex items-center justify-between gap-3 rounded-[14px] border-[1.5px] border-line bg-card p-3.5">
                    <div className="min-w-0"><div className="truncate text-[14px] font-black text-ink">{t.title}</div><div className="text-[11.5px] text-muted">{t.region} · {t.duration} · ★ {round1(t.rating)}</div></div>
                    <span className="shrink-0 text-[12px] font-extrabold text-blue-l">투어정보 →</span>
                  </Link>
                ))}
              </div>
            </Group>
          )}
          {stays.length > 0 && (
            <Group title="🏠 스테이" count={stays.length}>
              <div className="grid gap-3 sm:grid-cols-2">
                {stays.map((s) => (
                  <Link key={s.id} href={`/stay/${s.id}`} className="lift flex items-center justify-between gap-3 rounded-[14px] border-[1.5px] border-line bg-card p-3.5">
                    <div className="min-w-0"><div className="truncate text-[14px] font-black text-ink">{s.title}</div><div className="text-[11.5px] text-muted">{s.region} · {s.stay_type || "스테이"} · ★ {round1(s.rating)}</div></div>
                    <span className="shrink-0 text-[12px] font-extrabold text-blue-l">예약 →</span>
                  </Link>
                ))}
              </div>
            </Group>
          )}
          {posts.length > 0 && (
            <Group title="💬 게시판 글" count={posts.length}>
              <div className="space-y-2">
                {posts.map((p) => (
                  <Link key={p.id} href={`/board?region=${encodeURIComponent(p.region)}`} className="lift block rounded-[14px] border-[1.5px] border-line bg-card p-3.5">
                    <div className="text-[11px] font-bold text-muted2">{p.category} · 📍 {p.region}</div>
                    <div className="mt-0.5 truncate text-[14px] font-black text-ink">{p.title}</div>
                    <div className="truncate text-[12px] text-muted">{p.content}</div>
                  </Link>
                ))}
              </div>
            </Group>
          )}
        </div>
      )}
    </PageShell>
  );
}

function Group({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 font-display text-[18px] font-black tracking-[-0.03em] text-ink">{title} <span className="text-[13px] font-bold text-muted2">{count}</span></h2>
      {children}
    </section>
  );
}
