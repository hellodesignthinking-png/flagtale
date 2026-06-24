"use client";

import { useState } from "react";
import Link from "next/link";

// 에어비앤비식 우측 스티키 예약 위젯 — 가격·날짜·인원·합계. 실결제는 백엔드 연동 후(지금은 /auth로 예약 요청).
export function BookingCard({
  kind,
  price,
  rating,
  reviewCount,
  maxPeople,
  peopleLabel,
}: {
  kind: "tour" | "stay";
  price: number;
  rating: number;
  reviewCount?: number;
  maxPeople: number;
  peopleLabel: string;
}) {
  const unit = kind === "stay" ? "박" : "인";
  const [date, setDate] = useState("");
  const [checkout, setCheckout] = useState("");
  const [people, setPeople] = useState(kind === "stay" ? Math.min(2, maxPeople) : 1);

  let nights = 1;
  if (kind === "stay" && date && checkout) {
    const ms = new Date(checkout).getTime() - new Date(date).getTime();
    if (ms > 0) nights = Math.round(ms / 86_400_000);
  }
  const qty = kind === "stay" ? nights : people;
  const subtotal = price * qty;
  const fee = Math.round(subtotal * 0.1);
  const total = subtotal + fee;
  // 스테이는 1박 단가 × 박수(인원 무관) — 날짜를 둘 다 골라야 총액 계산. 투어는 인원 기준이라 항상 계산.
  const ready = kind !== "stay" || (!!date && !!checkout);

  return (
    <div className="rounded-[20px] border-[1.5px] border-line bg-card p-5 shadow-xl">
      <div className="flex items-baseline justify-between">
        <div>
          <span className="font-display text-[24px] font-black tabular-nums text-ink">{price.toLocaleString()}</span>
          <span className="text-[13px] font-bold text-muted2">원 / {unit}</span>
        </div>
        <span className="text-[12.5px] font-bold text-muted">★ <b className="text-ink">{rating}</b>{reviewCount != null ? ` (${reviewCount})` : ""}</span>
      </div>

      <div className="mt-3.5 overflow-hidden rounded-[14px] border-[1.5px] border-line">
        {kind === "stay" ? (
          <div className="grid grid-cols-2 border-b border-line">
            <label className="cursor-pointer border-r border-line p-2.5">
              <span className="block text-[10px] font-extrabold uppercase tracking-wide text-muted2">체크인</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-0.5 w-full bg-transparent text-[12.5px] font-bold text-ink focus:outline-none" />
            </label>
            <label className="cursor-pointer p-2.5">
              <span className="block text-[10px] font-extrabold uppercase tracking-wide text-muted2">체크아웃</span>
              <input type="date" value={checkout} onChange={(e) => setCheckout(e.target.value)} className="mt-0.5 w-full bg-transparent text-[12.5px] font-bold text-ink focus:outline-none" />
            </label>
          </div>
        ) : (
          <label className="block cursor-pointer border-b border-line p-2.5">
            <span className="block text-[10px] font-extrabold uppercase tracking-wide text-muted2">날짜</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-0.5 w-full bg-transparent text-[12.5px] font-bold text-ink focus:outline-none" />
          </label>
        )}
        <div className="flex items-center justify-between p-2.5">
          <span className="text-[10px] font-extrabold uppercase tracking-wide text-muted2">{peopleLabel} · 최대 {maxPeople}</span>
          <div className="flex items-center gap-2.5">
            <button onClick={() => setPeople((p) => Math.max(1, p - 1))} aria-label="인원 감소" disabled={people <= 1} className="grid h-9 w-9 place-items-center rounded-full border border-line text-[18px] font-bold text-ink transition-colors hover:border-ink disabled:opacity-30">−</button>
            <span className="w-6 text-center text-[15px] font-extrabold tabular-nums text-ink">{people}</span>
            <button onClick={() => setPeople((p) => Math.min(maxPeople, p + 1))} aria-label="인원 증가" disabled={people >= maxPeople} className="grid h-9 w-9 place-items-center rounded-full border border-line text-[18px] font-bold text-ink transition-colors hover:border-ink disabled:opacity-30">+</button>
          </div>
        </div>
      </div>

      <Link href="/auth" className="btn-glow mt-3.5 flex items-center justify-center rounded-full bg-amber px-5 py-3.5 text-[15px] font-extrabold text-onaccent">예약 요청하기 →</Link>
      <p className="mt-2 text-center text-[11px] text-muted2">로그인 후 예약 요청 · 지금은 결제되지 않습니다</p>

      {ready ? (
        <div className="mt-3.5 space-y-1.5 border-t border-line pt-3.5 text-[12.5px] text-muted">
          <div className="flex justify-between"><span className="underline decoration-line underline-offset-2">{price.toLocaleString()}원 × {qty}{unit}</span><span className="tabular-nums text-ink">{subtotal.toLocaleString()}원</span></div>
          <div className="flex justify-between"><span className="underline decoration-line underline-offset-2">서비스 수수료</span><span className="tabular-nums text-ink">{fee.toLocaleString()}원</span></div>
          <div className="mt-1 flex justify-between border-t border-line pt-2 text-[14px] font-extrabold text-ink"><span>합계</span><span className="tabular-nums">{total.toLocaleString()}원</span></div>
          {kind === "stay" && <p className="pt-0.5 text-[10.5px] leading-relaxed text-muted2">1박 요금 기준 · 인원과 무관 (최대 {maxPeople}명)</p>}
        </div>
      ) : (
        <p className="mt-3.5 border-t border-line pt-3.5 text-center text-[12px] leading-relaxed text-muted2">체크인·체크아웃을 선택하면 총액이 계산돼요</p>
      )}
    </div>
  );
}
