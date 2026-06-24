import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadStays } from "@/lib/flagtale";
import { ftImage, round1 } from "@/lib/flagtale-types";
import { BookingCard } from "@/components/flagtale/detail/BookingCard";
import { Crumb, DetailSection, CheckList } from "@/components/flagtale/detail/parts";

export function generateStaticParams() {
  return loadStays().map((s) => ({ id: String(s.id) }));
}

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const s = loadStays().find((x) => x.id === Number(params.id));
  if (!s) return { title: "숙소를 찾을 수 없어요" };
  return {
    title: `${s.title} — 로컬 스테이 · Flagtale`,
    description: (s.description || "").slice(0, 120),
    openGraph: { title: s.title, description: (s.description || "").slice(0, 120), images: [ftImage(s.image)] },
  };
}

const AMENITIES = ["무선 인터넷(Wi-Fi)", "취사 가능 · 주방", "주차 가능", "침구·수건 제공", "냉난방 완비", "셀프 체크인"];
const HOUSE_RULES = ["체크인 15:00 / 체크아웃 11:00", "금연 · 반려동물 문의", "정숙 시간 22:00 이후", "기준 인원 초과 시 사전 문의"];

export default function StayDetailPage({ params }: { params: { id: string } }) {
  const stay = loadStays().find((s) => s.id === Number(params.id));
  if (!stay) notFound();
  const others = loadStays().filter((s) => s.id !== stay.id && s.region === stay.region).slice(0, 3);

  return (
    <main className="mx-auto max-w-[1120px] px-4 py-6 sm:px-6">
      <Crumb items={[{ label: "홈", href: "/" }, { label: "로컬 스테이", href: "/#stays" }, { label: stay.region }]} />

      <h1 className="font-display text-[clamp(24px,4vw,34px)] font-black leading-tight tracking-tight text-ink">{stay.title}</h1>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] font-bold text-muted">
        <span>★ <b className="text-ink">{round1(stay.rating)}</b>{stay.review_count ? ` (${stay.review_count})` : ""}</span>
        <span>· 📍 {stay.region}</span>
        {stay.stay_type && <span>· 🏠 {stay.stay_type}</span>}
        <span>· 👤 호스트 {stay.host_name}</span>
        <span className="rounded-full bg-card2 px-2 py-0.5 text-[11px] font-bold text-muted2">샘플</span>
      </div>

      <div className="relative mt-4 overflow-hidden rounded-[22px] border-[1.5px] border-line">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ftImage(stay.image)} alt={stay.title} className="h-[clamp(230px,42vw,460px)] w-full object-cover" />
        {stay.badge_label && <span className="absolute left-4 top-4 rounded-full bg-amber px-3 py-1.5 text-[12px] font-extrabold text-onaccent shadow-lg">{stay.badge_label}</span>}
        {stay.stay_type && <span className="absolute bottom-4 left-4 rounded-full bg-card/90 px-3 py-1.5 text-[12px] font-extrabold text-ink shadow-lg">{stay.stay_type}</span>}
      </div>

      <div className="mt-7 grid gap-9 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          <section className="mb-7 flex items-center gap-3.5 border-b border-line pb-7">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-amber/15 text-[22px] ring-2 ring-amber/30">🏡</div>
            <div className="min-w-0">
              <div className="text-[15px] font-black text-ink">호스트 {stay.host_name}</div>
              <p className="mt-0.5 text-[12.5px] text-muted">{stay.region}에서 손님을 맞이하는 로컬 호스트</p>
              <div className="mt-1 text-[12px] font-bold text-muted2">최대 {stay.max_guests}명 · {stay.stay_type || "스테이"}</div>
            </div>
          </section>

          <div className="space-y-7">
            <DetailSection title="숙소 소개">
              <p className="whitespace-pre-line">{stay.description}</p>
            </DetailSection>

            <DetailSection title="편의시설">
              <CheckList items={AMENITIES} />
              <p className="mt-3 text-[11.5px] text-muted2">편의시설은 대표 항목입니다 · 정확한 구성은 예약 전 호스트에게 확인하세요.</p>
            </DetailSection>

            <DetailSection title="위치" sub={stay.address || stay.region}>
              <p>{stay.region}{stay.address ? ` · ${stay.address}` : ""}. 정확한 주소는 <b className="text-ink">예약 확정 후 안내</b>됩니다.</p>
              <Link href="/map-tale" className="mt-3 inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-line bg-card px-4 py-2 text-[12.5px] font-extrabold text-ink transition-colors hover:border-ink">🗺 플래그맵에서 {stay.region} 동네 보기 →</Link>
            </DetailSection>

            <DetailSection title="후기" sub={`★ ${round1(stay.rating)}${stay.review_count ? ` · 후기 ${stay.review_count}개` : ""}`}>
              <div className="flex items-start gap-3 rounded-[14px] border border-line bg-card2/40 p-4">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber/20 text-[15px]">😊</div>
                <div>
                  <div className="text-[12.5px] font-extrabold text-ink">게스트 · {stay.region}</div>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted">“동네 분위기에 완전히 녹아드는 숙소였어요. 호스트가 알려준 로컬 코스 덕분에 여행이 훨씬 풍성해졌습니다.”</p>
                </div>
              </div>
              <p className="mt-2 text-[11.5px] text-muted2">후기는 샘플입니다 · 실제 후기는 예약·리뷰 연동 후 표시됩니다.</p>
            </DetailSection>

            <section>
              <h2 className="font-display text-[19px] font-black tracking-tight text-ink">숙박 수칙 · 환불</h2>
              <ul className="mt-3 space-y-1.5 text-[13px] leading-relaxed text-muted">
                {HOUSE_RULES.map((r) => <li key={r}>· {r}</li>)}
                <li>· 체크인 7일 전까지 취소 시 전액 환불, 3일 전까지 50% 환불</li>
              </ul>
            </section>
          </div>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <BookingCard kind="stay" price={stay.price_per_night} rating={round1(stay.rating)} reviewCount={stay.review_count} maxPeople={stay.max_guests} peopleLabel="게스트" />
          <div className="mt-2.5 text-center text-[11.5px] text-muted2">최대 {stay.max_guests}명 · {stay.stay_type || "로컬 스테이"}</div>
        </aside>
      </div>

      {others.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 font-display text-[20px] font-black tracking-tight text-ink">{stay.region}의 다른 로컬 스테이</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {others.map((o) => (
              <Link key={o.id} href={`/stay/${o.id}`} className="lift overflow-hidden rounded-[18px] border-[1.5px] border-line bg-card">
                <div className="relative h-36 w-full overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ftImage(o.image)} alt={o.title} loading="lazy" className="h-full w-full object-cover" />
                  {o.stay_type && <span className="absolute bottom-2 left-2 rounded-full bg-card/90 px-2 py-0.5 text-[10.5px] font-extrabold text-ink">{o.stay_type}</span>}
                </div>
                <div className="p-3.5">
                  <h3 className="line-clamp-1 text-[14px] font-black text-ink">{o.title}</h3>
                  <div className="mt-1 text-[12px] font-bold text-muted2">★ {round1(o.rating)} · 👤 {o.host_name}</div>
                  <div className="mt-1.5"><span className="font-display text-[16px] font-black tabular-nums text-ink">{o.price_per_night.toLocaleString()}</span><span className="text-[11px] font-bold text-muted2">원 / 박</span></div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
