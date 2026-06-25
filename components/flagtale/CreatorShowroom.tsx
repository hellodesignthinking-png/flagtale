"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { type Creator, ftImage, round1, specialtyTags, CREATOR_REGIONS } from "@/lib/flagtale-types";

const SNS: { key: keyof Creator; label: string; icon: string }[] = [
  { key: "instagram", label: "인스타", icon: "📷" },
  { key: "youtube", label: "유튜브", icon: "▶" },
  { key: "blog", label: "블로그", icon: "✏️" },
  { key: "naver_place", label: "네이버", icon: "📍" },
];

export function CreatorShowroom({ creators }: { creators: Creator[] }) {
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("전체");

  const filtered = useMemo(
    () =>
      creators.filter((c) => {
        const okR = region === "전체" || c.region === region;
        const hay = `${c.name} ${c.nickname} ${c.specialty} ${c.description} ${c.region}`.toLowerCase();
        const okQ = !q.trim() || hay.includes(q.trim().toLowerCase());
        return okR && okQ;
      }),
    [creators, q, region]
  );

  return (
    <section className="py-7">
      {/* 검색 + 지역 태그 */}
      <div className="flex items-center gap-2 rounded-full border-[1.5px] border-line bg-card px-4 py-1 focus-within:border-ink">
        <span className="text-muted2">🔍</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="크리에이터 · 동네 · 분야 검색 (예: 책방, 서핑, 망원동)"
          className="h-11 flex-1 bg-transparent text-[15px] text-ink placeholder:text-muted2 focus:outline-none"
          aria-label="크리에이터 검색"
        />
        {q && (
          <button onClick={() => setQ("")} className="text-[13px] font-bold text-muted2 hover:text-ink" aria-label="검색어 지우기">✕</button>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {CREATOR_REGIONS.map((r) => {
          const active = region === r;
          return (
            <button
              key={r}
              onClick={() => setRegion(r)}
              className={`rounded-full border-[1.5px] px-3.5 py-1.5 text-[13px] font-extrabold transition-colors ${active ? "border-ink bg-ink text-white" : "border-line bg-card text-ink hover:border-ink"}`}
            >
              {r}
            </button>
          );
        })}
        <span className="ml-auto text-[12px] font-bold text-muted2">{filtered.length}명의 크리에이터</span>
      </div>

      {/* 카드 그리드 */}
      {filtered.length ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <CreatorCard key={c.id} c={c} />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-[20px] border-[1.5px] border-line bg-card2 py-16 text-center">
          <div className="text-3xl">🔍</div>
          <p className="mt-2 text-[14px] font-bold text-muted">검색 결과가 없어요 — 다른 동네·분야로 찾아보세요.</p>
        </div>
      )}

    </section>
  );
}

function CreatorCard({ c }: { c: Creator }) {
  return (
    <Link href={`/creator/${c.id}`} className="lift group flex flex-col overflow-hidden rounded-[20px] border-[1.5px] border-line bg-card text-left">
      <div className="relative aspect-[16/10] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ftImage(c.cover_image)} alt={`${c.nickname} 커버`} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,transparent 45%,rgba(0,0,0,.5))" }} />
        <span className="absolute left-3 top-3 rounded-full bg-amber px-2.5 py-1 text-[11px] font-extrabold text-onaccent">📍 {c.region}</span>
        {c.rating > 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-ink/80 px-2 py-1 text-[11px] font-extrabold text-white">★ {round1(c.rating)}</span>
        )}
      </div>
      <div className="relative px-5 pb-5">
        {/* 프로필 버블 */}
        <span className="absolute -top-7 left-5 grid h-14 w-14 place-items-center overflow-hidden rounded-full border-[3px] border-card bg-card2 shadow">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ftImage(c.image)} alt={c.name} className="h-full w-full object-cover" />
        </span>
        <div className="pt-9">
          <h3 className="text-[18px] font-black tracking-tight text-ink">{c.nickname}</h3>
          <div className="mt-0.5 text-[12.5px] font-bold text-blue-l">{c.name} · {c.region}</div>
          <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted">{c.description}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {specialtyTags(c.specialty).map((t) => (
              <span key={t} className="rounded-full bg-card2 px-2.5 py-0.5 text-[11px] font-bold text-muted">#{t}</span>
            ))}
          </div>
          <div className="mt-3.5 flex items-center justify-between border-t border-line pt-3">
            <span className="text-[12.5px] font-extrabold text-blue-l">프로필 보기 →</span>
            <div className="flex gap-1">
              {SNS.filter((s) => c[s.key]).map((s) => (
                <span key={s.label} className="grid h-6 w-6 place-items-center rounded-full bg-card2 text-[11px]" title={s.label}>{s.icon}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
