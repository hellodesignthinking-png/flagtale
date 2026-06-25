import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadSpots, loadCreators } from "@/lib/flagtale";
import { ftImage, round1, SPOT_CAT } from "@/lib/flagtale-types";
import { pointToDistrict } from "@/lib/geocode";
import { Crumb, DetailSection } from "@/components/flagtale/detail/parts";
import { NaverMiniMap } from "@/components/flagtale/NaverMiniMap";

export function generateStaticParams() {
  return loadSpots().map((s) => ({ id: String(s.id) }));
}

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const s = loadSpots().find((x) => x.id === Number(params.id));
  if (!s) return { title: "매장을 찾을 수 없어요" };
  const cat = SPOT_CAT[s.category]?.label ?? s.category;
  return {
    title: `${s.name} — ${s.region} ${cat} · Flagtale`,
    description: `${s.region} ${cat}${s.address ? ` · ${s.address}` : ""}`,
    openGraph: { title: s.name, images: s.image ? [ftImage(s.image)] : [] },
  };
}

export default function SpotDetailPage({ params }: { params: { id: string } }) {
  const spot = loadSpots().find((s) => s.id === Number(params.id));
  if (!spot) notFound();
  const m = SPOT_CAT[spot.category] ?? { emoji: "📍", label: spot.category, color: "#888888" };
  const others = loadSpots().filter((s) => s.id !== spot.id && s.region === spot.region).slice(0, 4);
  const district = pointToDistrict(spot.lng, spot.lat); // 좌표→행정동 (동네 매력도 연결)
  const regionCreators = loadCreators().filter((c) => c.region === spot.region).slice(0, 3); // 같은 지역 크리에이터

  return (
    <main className="mx-auto max-w-[1120px] px-4 py-6 sm:px-6">
      <Crumb items={[{ label: "홈", href: "/" }, { label: "플래그맵", href: "/map-tale" }, { label: spot.region }]} />

      <div className="flex items-center gap-2">
        <span className="rounded-full px-2.5 py-1 text-[12px] font-extrabold" style={{ background: `${m.color}1f`, color: m.color }}>{m.emoji} {m.label}</span>
        <span className="rounded-full bg-card2 px-2 py-0.5 text-[11px] font-bold text-muted2">샘플</span>
      </div>
      <h1 className="mt-2 font-display text-[clamp(24px,4vw,34px)] font-black leading-tight tracking-tight text-ink">{spot.name}</h1>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] font-bold text-muted">
        {spot.rating ? <span>★ <b className="text-ink">{round1(spot.rating)}</b>{spot.review_count ? ` (${spot.review_count})` : ""}</span> : null}
        <span>· 📍 {spot.region}</span>
        {spot.hours ? <span>· 🕒 {spot.hours}</span> : null}
        {spot.crew ? <span>· 👥 {spot.crew}</span> : null}
      </div>

      <div className="relative mt-4 overflow-hidden rounded-[22px] border-[1.5px] border-line">
        {spot.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ftImage(spot.image)} alt={spot.name} className="h-[clamp(220px,40vw,420px)] w-full object-cover" />
        ) : (
          <div className="grid h-[clamp(220px,40vw,420px)] w-full place-items-center text-[64px]" style={{ background: `${m.color}14` }}>{m.emoji}</div>
        )}
        <span className="absolute left-4 top-4 rounded-full bg-amber px-3 py-1.5 text-[12px] font-extrabold text-onaccent shadow-lg">📍 {spot.region} {m.label}</span>
      </div>

      <div className="mt-6 grid gap-7 lg:grid-cols-[1.5fr_1fr]">
        <div className="min-w-0 space-y-7">
          <DetailSection title="기본 정보">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[13.5px]">
              <div><dt className="text-[12px] font-bold text-muted2">종류</dt><dd className="font-extrabold text-ink">{m.label}</dd></div>
              {spot.hours && <div><dt className="text-[12px] font-bold text-muted2">영업시간</dt><dd className="font-bold text-ink">{spot.hours}</dd></div>}
              {spot.price_range && <div><dt className="text-[12px] font-bold text-muted2">가격대</dt><dd className="font-bold text-ink">{spot.price_range}</dd></div>}
              {spot.crew && <div><dt className="text-[12px] font-bold text-muted2">운영</dt><dd className="font-bold text-ink">{spot.crew}</dd></div>}
              {spot.phone && <div><dt className="text-[12px] font-bold text-muted2">전화</dt><dd className="font-bold text-ink">{spot.phone}</dd></div>}
              {spot.address && <div className="col-span-2"><dt className="text-[12px] font-bold text-muted2">주소</dt><dd className="font-bold text-ink">{spot.address}</dd></div>}
            </dl>
          </DetailSection>

          <DetailSection title="후기" sub={spot.rating ? `★ ${round1(spot.rating)}${spot.review_count ? ` · 후기 ${spot.review_count}개` : ""}` : undefined}>
            <div className="flex items-start gap-3 rounded-[14px] border border-line bg-card2/40 p-4">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber/20 text-[15px]">🙂</div>
              <div>
                <div className="text-[12.5px] font-extrabold text-ink">방문자 · {spot.region}</div>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">“{spot.region}에서 꼭 들러야 할 곳. 동네 분위기와 잘 어우러지는 공간이에요.”</p>
              </div>
            </div>
            <p className="mt-2 text-[11.5px] text-muted2">후기는 샘플입니다 · 실제 후기는 네이버 플레이스·리뷰 연동 후 표시됩니다.</p>
          </DetailSection>
        </div>

        <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-[18px] border-[1.5px] border-line bg-card p-4">
            <div className="text-[12px] font-bold text-muted2">위치</div>
            <div className="mt-0.5 text-[13.5px] font-extrabold text-ink">{spot.address || `${spot.region} 일대`}</div>
            <div className="mt-3">
              <NaverMiniMap lat={spot.lat} lng={spot.lng} name={spot.name} query={spot.address || `${spot.name} ${spot.region}`} emoji={m.emoji} zoom={16} className="h-56 w-full" />
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {spot.naver_url && <a href={spot.naver_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 rounded-full bg-[#03c75a] px-4 py-2.5 text-[13px] font-extrabold text-white transition-opacity hover:opacity-90">N 네이버에서 보기 →</a>}
              <Link href="/map-tale" className="flex items-center justify-center gap-1.5 rounded-full border-[1.5px] border-line bg-card px-4 py-2.5 text-[13px] font-extrabold text-ink transition-colors hover:border-ink">🗺 플래그맵에서 보기 →</Link>
              {district && <Link href={`/place/${district.admCd2}`} className="flex items-center justify-center gap-1.5 rounded-full border-[1.5px] border-line bg-card px-4 py-2.5 text-[13px] font-extrabold text-blue-l transition-colors hover:border-ink">🧭 이 동네 매력도 ({district.name}) →</Link>}
              <Link href="/host" className="flex items-center justify-center gap-1.5 rounded-full border-[1.5px] border-amber bg-amber/10 px-4 py-2.5 text-[13px] font-extrabold text-ink transition-colors hover:opacity-90">🏪 이 매장 운영자세요? 등록·수정 →</Link>
            </div>
          </div>
        </aside>
      </div>

      {regionCreators.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 font-display text-[20px] font-black tracking-[-0.03em] text-ink">{spot.region}의 로컬 크리에이터</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {regionCreators.map((c) => (
              <Link key={c.id} href={`/creator/${c.id}`} className="lift flex items-center gap-3 rounded-[16px] border-[1.5px] border-line bg-card p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ftImage(c.image)} alt={c.name} className="h-12 w-12 shrink-0 rounded-full object-cover" />
                <div className="min-w-0">
                  <div className="truncate text-[14px] font-black text-ink">{c.nickname}</div>
                  <div className="truncate text-[11.5px] text-muted">{c.name} · {c.region}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {others.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 font-display text-[20px] font-black tracking-tight text-ink">{spot.region}의 다른 곳</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {others.map((o) => {
              const om = SPOT_CAT[o.category] ?? { emoji: "📍", label: o.category, color: "#888888" };
              return (
                <Link key={o.id} href={`/spot/${o.id}`} className="lift overflow-hidden rounded-[16px] border-[1.5px] border-line bg-card">
                  <div className="relative h-32 w-full overflow-hidden">
                    {o.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={ftImage(o.image)} alt={o.name} loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-[30px]" style={{ background: `${om.color}14` }}>{om.emoji}</div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="text-[10.5px] font-extrabold" style={{ color: om.color }}>{om.label}</div>
                    <h3 className="mt-0.5 line-clamp-1 text-[14px] font-black text-ink">{o.name}</h3>
                    {o.rating ? <div className="mt-1 text-[11.5px] font-bold text-muted2">★ {round1(o.rating)}{o.review_count ? ` (${o.review_count})` : ""}</div> : null}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
