import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadSpots } from "@/lib/flagtale";
import { ftImage, round1, SPOT_CAT } from "@/lib/flagtale-types";
import { PageShell } from "@/components/page-shell";
import { NaverMiniMap } from "@/components/flagtale/NaverMiniMap";

export function generateStaticParams() {
  const crews = [...new Set(loadSpots().map((s) => s.crew).filter(Boolean))] as string[];
  return crews.map((crew) => ({ crew })); // raw 값 — Next가 인코딩 처리(인코딩값 반환 시 매칭 실패)
}

export function generateMetadata({ params }: { params: { crew: string } }): Metadata {
  const crew = decodeURIComponent(params.crew);
  return { title: `${crew} — 로컬 팀 · Flagtale`, description: `${crew}이(가) 운영하는 로컬 매장·공간` };
}

export default function CrewPage({ params }: { params: { crew: string } }) {
  const crew = decodeURIComponent(params.crew);
  const spots = loadSpots().filter((s) => s.crew === crew);
  if (!spots.length) notFound();
  const region = spots[0].region;
  const rated = spots.filter((s) => s.rating);
  const avg = rated.length ? Math.round((rated.reduce((s, x) => s + x.rating, 0) / rated.length) * 10) / 10 : 0;
  const markers = spots.filter((s) => s.lat && s.lng).map((s) => ({ lat: s.lat, lng: s.lng, emoji: SPOT_CAT[s.category]?.emoji ?? "📍", name: s.name }));

  return (
    <PageShell>
      <div className="mb-4 text-[13px] text-muted2">
        <Link href="/map-tale" className="hover:text-ink">← 플래그맵</Link>
      </div>

      <div className="rounded-[22px] border-[1.5px] border-line bg-card2 p-6 sm:p-7">
        <span className="klai-eyebrow">🏴 로컬 팀 · Crew</span>
        <h1 className="mt-1.5 font-display text-[clamp(26px,4.5vw,38px)] font-black tracking-[-0.03em] text-ink">{crew}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13.5px] font-bold text-muted">
          <span>📍 {region}</span>
          <span>· 🏪 매장·공간 <b className="text-ink">{spots.length}곳</b></span>
          {avg > 0 && <span>· ★ <b className="text-ink">{avg}</b> 평균</span>}
        </div>
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted">{region}에서 활동하는 로컬 팀 <b className="text-ink">{crew}</b>이(가) 운영·큐레이션하는 공간들입니다.</p>
      </div>

      {/* 팀 매장 지도 (전 매장 핀) */}
      <section className="mt-6">
        <h2 className="mb-3 font-display text-[18px] font-black tracking-[-0.03em] text-ink">📍 {crew} 매장 위치</h2>
        <NaverMiniMap markers={markers} query={`${crew} ${region}`} name={crew} className="h-72 w-full" />
      </section>

      {/* 팀 매장 목록 */}
      <section className="mt-6">
        <h2 className="mb-3 font-display text-[18px] font-black tracking-[-0.03em] text-ink">{crew}의 매장·공간 {spots.length}곳</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {spots.map((s) => {
            const m = SPOT_CAT[s.category] ?? { emoji: "📍", label: s.category, color: "#888888" };
            return (
              <Link key={s.id} href={`/spot/${s.id}`} className="lift group flex flex-col overflow-hidden rounded-[18px] border-[1.5px] border-line bg-card">
                <div className="relative aspect-[16/10] overflow-hidden">
                  {s.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ftImage(s.image)} alt={s.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-[40px]" style={{ background: `${m.color}14` }}>{m.emoji}</div>
                  )}
                  <span className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-extrabold text-white" style={{ background: m.color }}>{m.emoji} {m.label}</span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="text-[16px] font-black leading-snug tracking-tight text-ink">{s.name}</h3>
                  <div className="mt-1 text-[12px] text-muted">{s.address || s.region}</div>
                  <div className="mt-auto flex items-center justify-between pt-3 text-[12px] font-bold text-muted2">
                    <span>{s.rating ? `★ ${round1(s.rating)}${s.review_count ? ` (${s.review_count})` : ""}` : s.region}</span>
                    <span className="rounded-full border-[1.5px] border-line bg-card px-3 py-1.5 text-[12px] font-extrabold text-ink transition-colors group-hover:border-ink">상세 →</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </PageShell>
  );
}
