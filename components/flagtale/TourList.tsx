"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { type Tour, ftImage, round1 } from "@/lib/flagtale-types";

type CMeta = { name: string; nickname: string; image: string };

const SORTS: { key: string; label: string }[] = [
  { key: "popular", label: "인기순" },
  { key: "rating", label: "평점순" },
  { key: "price-low", label: "낮은 가격" },
  { key: "seats", label: "잔여석" },
];

export function TourList({ tours, creators }: { tours: Tour[]; creators: Record<number, CMeta> }) {
  const [open, setOpen] = useState<number | null>(null);
  const [sort, setSort] = useState("popular");

  const sorted = useMemo(() => {
    const arr = [...tours];
    switch (sort) {
      case "rating": return arr.sort((a, b) => b.rating - a.rating);
      case "price-low": return arr.sort((a, b) => a.price - b.price);
      case "seats": return arr.sort((a, b) => (b.max_seats - b.booked_seats) - (a.max_seats - a.booked_seats));
      default: return arr.sort((a, b) => b.like_count - a.like_count);
    }
  }, [tours, sort]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {SORTS.map((s) => (
          <button
            key={s.key}
            onClick={() => setSort(s.key)}
            className={`rounded-full border-[1.5px] px-3 py-1.5 text-[12.5px] font-extrabold transition-colors ${sort === s.key ? "border-ink bg-ink text-white" : "border-line bg-card text-ink hover:border-ink"}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {sorted.map((t) => {
          const left = t.max_seats - t.booked_seats;
          const cm = creators[t.creator_id];
          const isOpen = open === t.id;
          return (
            <div key={t.id} className="overflow-hidden rounded-[20px] border-[1.5px] border-line bg-card">
              <div className="flex flex-col sm:flex-row">
                <div className="relative aspect-[16/10] sm:aspect-auto sm:w-52 sm:shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ftImage(t.image)} alt={t.title} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                  <span className="absolute left-3 top-3 rounded-full bg-amber px-2.5 py-1 text-[11px] font-extrabold text-onaccent">📍 {t.region}</span>
                  {left <= 2 && (
                    <span className="absolute right-3 top-3 rounded-full bg-warn px-2.5 py-1 text-[11px] font-extrabold text-white">🔥 마감임박 {left}석</span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <Link href={`/tour/${t.id}`}><h3 className="text-[18px] font-black leading-snug tracking-tight text-ink transition-colors hover:text-blue-l">{t.title}</h3></Link>
                  {cm && (
                    <div className="mt-2 flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ftImage(cm.image)} alt={cm.nickname} loading="lazy" decoding="async" className="h-6 w-6 rounded-full object-cover" />
                      <span className="text-[12.5px] font-bold text-blue-l">{cm.nickname}</span>
                    </div>
                  )}
                  <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted">{t.description}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-bold text-muted2">
                    <span>★ <b className="text-ink">{round1(t.rating)}</b></span>
                    <span>❤ {t.like_count}</span>
                    <span>· {t.duration}</span>
                    <span>· 잔여 {left}/{t.max_seats}석</span>
                  </div>
                  <div className="mt-auto flex items-end justify-between pt-3.5">
                    <div>
                      <span className="font-display text-[22px] font-black tabular-nums text-ink">{t.price.toLocaleString()}</span>
                      <span className="text-[12px] font-bold text-muted2">원~ / 인</span>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => setOpen(isOpen ? null : t.id)} className="rounded-full border-[1.5px] border-line bg-card px-3.5 py-2 text-[12.5px] font-extrabold text-ink transition-colors hover:border-ink">
                        {isOpen ? "접기" : "📋 코스"}
                      </button>
                      <Link href={`/tour/${t.id}`} className="btn-glow rounded-full bg-amber px-4 py-2 text-[12.5px] font-extrabold text-onaccent">참여하기</Link>
                    </div>
                  </div>
                </div>
              </div>
              {isOpen && (
                <div className="border-t border-line bg-card2 px-5 py-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Info label="일정" value={t.schedule} icon="🗓" />
                    <Info label="소요 시간" value={t.duration} icon="⏱" />
                    <Info label="모임 인원" value={`최대 ${t.max_seats}명 · 현재 ${t.booked_seats}명 예약`} icon="👥" />
                    <Info label="호스트" value={cm ? `${cm.nickname} (${cm.name})` : "-"} icon="🎫" />
                  </div>
                  <p className="mt-3 text-[11.5px] text-muted2">※ 실제 예약·결제는 로그인 후 진행됩니다. 결제 연동(PortOne)·좌석 확정은 백엔드 통합 단계에서 활성화됩니다.</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Info({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="flex items-start gap-2 rounded-[14px] border-[1.5px] border-line bg-card px-3 py-2.5">
      <span className="text-[14px]">{icon}</span>
      <div>
        <div className="text-[10.5px] font-bold uppercase tracking-wider text-muted2">{label}</div>
        <div className="text-[13px] font-bold text-ink">{value}</div>
      </div>
    </div>
  );
}
