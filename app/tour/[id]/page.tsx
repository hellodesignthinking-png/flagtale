import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadTours, creatorById } from "@/lib/flagtale";
import { ftImage, round1, specialtyTags } from "@/lib/flagtale-types";
import { BookingCard } from "@/components/flagtale/detail/BookingCard";
import { Crumb, DetailSection, CheckList } from "@/components/flagtale/detail/parts";
import { NaverMiniMap } from "@/components/flagtale/NaverMiniMap";

export function generateStaticParams() {
  return loadTours().map((t) => ({ id: String(t.id) }));
}

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const t = loadTours().find((x) => x.id === Number(params.id));
  if (!t) return { title: "투어를 찾을 수 없어요" };
  return {
    title: `${t.title} — 로컬 투어 · Flagtale`,
    description: (t.description || "").slice(0, 120),
    openGraph: { title: t.title, description: (t.description || "").slice(0, 120), images: [ftImage(t.image)] },
  };
}

const INCLUDED = ["현지 로컬 크리에이터의 직접 가이드", "소규모 그룹(프라이빗한 분위기)", "골목·숨은 명소 추천 코스", "참여 기념 로컬 굿즈"];
const BRING = ["편한 신발", "날씨에 맞는 옷차림", "카메라(선택)", "현장 간단 간식비(선택)"];

export default function TourDetailPage({ params }: { params: { id: string } }) {
  const tour = loadTours().find((t) => t.id === Number(params.id));
  if (!tour) notFound();
  const cm = creatorById(tour.creator_id);
  const left = Math.max(0, tour.max_seats - tour.booked_seats);
  const soldout = left === 0;
  const others = loadTours().filter((t) => t.id !== tour.id && t.region === tour.region).slice(0, 3);

  return (
    <main className="mx-auto max-w-[1120px] px-4 py-6 sm:px-6">
      <Crumb items={[{ label: "홈", href: "/" }, { label: "로컬 투어", href: "/#tours" }, { label: tour.region }]} />

      <h1 className="font-display text-[clamp(24px,4vw,34px)] font-black leading-tight tracking-tight text-ink">{tour.title}</h1>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] font-bold text-muted">
        <span>★ <b className="text-ink">{round1(tour.rating)}</b></span>
        <span>· ❤ {tour.like_count}</span>
        <span>· 📍 {tour.region}</span>
        <span>· ⏱ {tour.duration}</span>
        <span className="rounded-full bg-card2 px-2 py-0.5 text-[11px] font-bold text-muted2">샘플</span>
      </div>

      <div className="relative mt-4 overflow-hidden rounded-[22px] border-[1.5px] border-line">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ftImage(tour.image)} alt={tour.title} className="h-[clamp(230px,42vw,460px)] w-full object-cover" />
        <span className="absolute left-4 top-4 rounded-full bg-amber px-3 py-1.5 text-[12px] font-extrabold text-onaccent shadow-lg">📍 {tour.region} 로컬 투어</span>
        {soldout ? (
          <span className="absolute right-4 top-4 rounded-full bg-ink/85 px-3 py-1.5 text-[12px] font-extrabold text-white shadow-lg">마감</span>
        ) : left <= 3 ? (
          <span className="absolute right-4 top-4 rounded-full bg-warn px-3 py-1.5 text-[12px] font-extrabold text-white shadow-lg">🔥 마감임박 {left}석</span>
        ) : null}
      </div>

      <div className="mt-7 grid gap-9 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          {cm && (
            <section className="mb-7 flex items-center gap-3.5 border-b border-line pb-7">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ftImage(cm.image)} alt={cm.nickname} className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-amber/30" />
              <div className="min-w-0">
                <div className="text-[15px] font-black text-ink">{cm.nickname} <span className="text-[12px] font-bold text-blue-l">· 호스트</span></div>
                <p className="mt-0.5 line-clamp-1 text-[12.5px] text-muted">{cm.description}</p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {specialtyTags(cm.specialty).slice(0, 3).map((s) => (
                    <span key={s} className="rounded-full bg-card2 px-2 py-0.5 text-[10.5px] font-bold text-muted2">#{s}</span>
                  ))}
                </div>
              </div>
            </section>
          )}

          <div className="space-y-7">
            <DetailSection title="체험 소개">
              <p className="whitespace-pre-line">{tour.description}</p>
            </DetailSection>

            <DetailSection title="일정 안내" sub={`${tour.duration} · ${tour.schedule}`}>
              <div className="grid gap-2.5 sm:grid-cols-3">
                {[
                  { t: "모임·소개", d: "만나서 오늘의 동네 이야기와 코스를 안내해요." },
                  { t: "골목 탐방", d: "현지인만 아는 가게·작업실·골목을 함께 걸어요." },
                  { t: "마무리", d: "차 한 잔과 함께 오늘의 발견을 나눠요." },
                ].map((s, i) => (
                  <div key={i} className="rounded-[14px] border border-line bg-card2/40 p-3.5">
                    <div className="text-[12px] font-extrabold text-amber">STEP {i + 1}</div>
                    <div className="mt-1 text-[13.5px] font-black text-ink">{s.t}</div>
                    <p className="mt-1 text-[12px] leading-relaxed text-muted">{s.d}</p>
                  </div>
                ))}
              </div>
            </DetailSection>

            <DetailSection title="포함 사항 · 준비물">
              <CheckList items={INCLUDED} />
              <div className="mt-4 rounded-[14px] bg-card2/50 p-3.5">
                <div className="mb-1.5 text-[12px] font-extrabold text-muted2">준비물</div>
                <div className="flex flex-wrap gap-1.5">
                  {BRING.map((b) => <span key={b} className="rounded-full border border-line bg-card px-2.5 py-1 text-[12px] font-bold text-ink">{b}</span>)}
                </div>
              </div>
            </DetailSection>

            <DetailSection title="만나는 곳" sub={`${tour.region} 일대`}>
              <p>정확한 만남 장소는 <b className="text-ink">예약 확정 후 안내</b>됩니다. {tour.region}의 중심가에서 시작해요.</p>
              <Link href="/map-tale" className="mt-3 inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-line bg-card px-4 py-2 text-[12.5px] font-extrabold text-ink transition-colors hover:border-ink">🗺 플래그맵에서 {tour.region} 보기 →</Link>
            </DetailSection>

            <DetailSection title="후기" sub={`★ ${round1(tour.rating)} · ❤ ${tour.like_count}명이 찜했어요`}>
              <div className="flex items-start gap-3 rounded-[14px] border border-line bg-card2/40 p-4">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber/20 text-[15px]">🙂</div>
                <div>
                  <div className="text-[12.5px] font-extrabold text-ink">방문자 · {tour.region}</div>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted">“현지인이 직접 안내해줘서 가이드북엔 없는 골목과 가게를 알게 됐어요. 동네의 진짜 분위기를 느낀 시간이었습니다.”</p>
                </div>
              </div>
              <p className="mt-2 text-[11.5px] text-muted2">후기는 샘플입니다 · 실제 후기는 예약·리뷰 연동 후 표시됩니다.</p>
            </DetailSection>

            <section>
              <h2 className="font-display text-[19px] font-black tracking-tight text-ink">취소·환불 정책</h2>
              <ul className="mt-3 space-y-1.5 text-[13px] leading-relaxed text-muted">
                <li>· 체험 7일 전까지 취소 시 전액 환불</li>
                <li>· 3일 전까지 취소 시 50% 환불</li>
                <li>· 우천 등 진행 불가 시 일정 변경 또는 전액 환불</li>
              </ul>
            </section>
          </div>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          {soldout ? (
            <div className="rounded-[20px] border-[1.5px] border-line bg-card p-5 text-center shadow-xl">
              <div className="text-[15px] font-black text-ink">이번 회차는 마감됐어요</div>
              <p className="mt-1.5 text-[12.5px] text-muted">다음 일정 알림을 받아보세요.</p>
              <Link href="/auth" className="btn-glow mt-3.5 flex items-center justify-center rounded-full bg-amber px-5 py-3 text-[14px] font-extrabold text-onaccent">알림 신청하기 →</Link>
            </div>
          ) : (
            <BookingCard kind="tour" price={tour.price} rating={round1(tour.rating)} maxPeople={left} peopleLabel="인원" />
          )}
          <div className="mt-2.5 text-center text-[11.5px] text-muted2">잔여 {left}/{tour.max_seats}석 · {tour.schedule}</div>
        </aside>
      </div>

      {/* 📍 위치 · 정보 (하단 네이버 지도) */}
      <section className="mt-10">
        <h2 className="mb-3 font-display text-[20px] font-black tracking-tight text-ink">📍 위치 · 정보</h2>
        <div className="grid gap-4 md:grid-cols-[1fr_1.5fr]">
          <div className="rounded-[18px] border-[1.5px] border-line bg-card2 p-5">
            <dl className="space-y-3 text-[13.5px]">
              <div className="flex justify-between gap-3"><dt className="font-bold text-muted2">지역</dt><dd className="font-extrabold text-ink">📍 {tour.region}</dd></div>
              <div className="flex justify-between gap-3"><dt className="font-bold text-muted2">일정</dt><dd className="text-right font-bold text-ink">{tour.schedule}</dd></div>
              <div className="flex justify-between gap-3"><dt className="font-bold text-muted2">소요 시간</dt><dd className="font-bold text-ink">{tour.duration}</dd></div>
              <div className="flex justify-between gap-3"><dt className="font-bold text-muted2">정원</dt><dd className="font-bold text-ink">최대 {tour.max_seats}명</dd></div>
              <div className="flex justify-between gap-3"><dt className="font-bold text-muted2">만나는 곳</dt><dd className="text-right font-bold text-ink">예약 확정 후 안내</dd></div>
            </dl>
          </div>
          <NaverMiniMap lat={tour.lat} lng={tour.lng} name={tour.title} query={tour.region} emoji="🎫" className="h-64 w-full md:h-full md:min-h-[240px]" />
        </div>
        <p className="mt-2 text-[11px] text-muted2">* 지역 중심 좌표 기준 — 정확한 만남 장소는 예약 확정 후 안내됩니다. (샘플 데이터)</p>
      </section>

      {others.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 font-display text-[20px] font-black tracking-tight text-ink">{tour.region}의 다른 로컬 투어</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {others.map((o) => (
              <Link key={o.id} href={`/tour/${o.id}`} className="lift overflow-hidden rounded-[18px] border-[1.5px] border-line bg-card">
                <div className="relative h-36 w-full overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ftImage(o.image)} alt={o.title} loading="lazy" className="h-full w-full object-cover" />
                </div>
                <div className="p-3.5">
                  <h3 className="line-clamp-1 text-[14px] font-black text-ink">{o.title}</h3>
                  <div className="mt-1 text-[12px] font-bold text-muted2">★ {round1(o.rating)} · ⏱ {o.duration}</div>
                  <div className="mt-1.5"><span className="font-display text-[16px] font-black tabular-nums text-ink">{o.price.toLocaleString()}</span><span className="text-[11px] font-bold text-muted2">원~ / 인</span></div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
