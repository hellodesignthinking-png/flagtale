import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadCreators, loadTours, ftImage, round1 } from "@/lib/flagtale";
import { specialtyTags, REGION_CENTROID } from "@/lib/flagtale-types";
import { PageShell } from "@/components/page-shell";
import { NaverMiniMap } from "@/components/flagtale/NaverMiniMap";

const SNS = [
  { key: "instagram", label: "인스타그램", icon: "📷" },
  { key: "youtube", label: "유튜브", icon: "▶" },
  { key: "blog", label: "블로그", icon: "✏️" },
  { key: "naver_place", label: "네이버 플레이스", icon: "📍" },
] as const;

export function generateStaticParams() {
  return loadCreators().map((c) => ({ id: String(c.id) }));
}

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const c = loadCreators().find((x) => String(x.id) === params.id);
  return { title: c ? `${c.nickname} · ${c.region} 로컬 크리에이터` : "크리에이터" };
}

export default function CreatorDetailPage({ params }: { params: { id: string } }) {
  const c = loadCreators().find((x) => String(x.id) === params.id);
  if (!c) notFound();
  const tours = loadTours().filter((t) => t.creator_id === c.id);
  const ctr = REGION_CENTROID[c.region]; // [lng, lat]

  return (
    <PageShell>
      <div className="mb-4 text-[13px] text-muted2">
        <Link href="/" className="hover:text-ink">← 발견 · 로컬 크리에이터</Link>
      </div>

      {/* 프로필 히어로 */}
      <div className="overflow-hidden rounded-[22px] border-[1.5px] border-line bg-card">
        <div className="relative aspect-[16/7]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ftImage(c.cover_image)} alt={`${c.nickname} 커버`} className="h-full w-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,transparent 45%,rgba(0,0,0,.55))" }} />
          <span className="absolute left-4 top-4 rounded-full bg-amber px-3 py-1 text-[12px] font-extrabold text-onaccent">📍 {c.region}</span>
          {c.rating > 0 && <span className="absolute right-4 top-4 rounded-full bg-ink/80 px-2.5 py-1 text-[12px] font-extrabold text-white">★ {round1(c.rating)} · 리뷰 {c.review_count}</span>}
        </div>
        <div className="relative px-5 pb-6 sm:px-7">
          <span className="absolute -top-10 left-5 grid h-[80px] w-[80px] place-items-center overflow-hidden rounded-full border-[3px] border-card bg-card2 shadow-lg sm:left-7">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ftImage(c.image)} alt={c.name} className="h-full w-full object-cover" />
          </span>
          <div className="pt-12">
            <h1 className="font-display text-[clamp(24px,4vw,34px)] font-black tracking-[-0.03em] text-ink">{c.nickname}</h1>
            <div className="mt-1 text-[14px] font-bold text-blue-l">{c.name} · {c.region}</div>
            <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted">{c.description}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {specialtyTags(c.specialty).map((t) => (
                <span key={t} className="rounded-full bg-card2 px-3 py-1 text-[12px] font-bold text-muted">#{t}</span>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {SNS.filter((s) => c[s.key]).map((s) => (
                <a key={s.label} href={String(c[s.key])} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-line bg-card px-3.5 py-2 text-[12.5px] font-extrabold text-ink transition-colors hover:border-ink">
                  <span>{s.icon}</span> {s.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 진행 투어 */}
      {tours.length > 0 && (
        <section className="mt-7">
          <h2 className="mb-3 font-display text-[20px] font-black tracking-[-0.03em] text-ink">{c.nickname}의 로컬 투어 · 워크숍</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tours.map((t) => (
              <Link key={t.id} href={`/tour/${t.id}`} className="lift group flex flex-col overflow-hidden rounded-[18px] border-[1.5px] border-line bg-card">
                <div className="relative aspect-[16/10] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ftImage(t.image)} alt={t.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <span className="absolute right-3 top-3 rounded-full bg-ink/80 px-2 py-1 text-[11px] font-extrabold text-white">★ {round1(t.rating)}</span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="text-[11px] font-extrabold text-blue-l">{t.region} · {t.duration}</div>
                  <h3 className="mt-1.5 line-clamp-2 text-[15px] font-black leading-snug tracking-tight text-ink">{t.title}</h3>
                  <div className="mt-auto flex items-end justify-between pt-3">
                    <div><span className="font-display text-[18px] font-black tabular-nums text-ink">{t.price.toLocaleString()}</span><span className="text-[12px] font-bold text-muted2">원</span></div>
                    <span className="rounded-full border-[1.5px] border-line bg-card px-3 py-1.5 text-[12px] font-extrabold text-ink transition-colors group-hover:border-ink">투어정보 →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 위치 · 정보 + 네이버 지도 */}
      <section className="mt-7">
        <h2 className="mb-3 font-display text-[20px] font-black tracking-[-0.03em] text-ink">위치 · 정보</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[18px] border-[1.5px] border-line bg-card2 p-5">
            <dl className="space-y-3 text-[13.5px]">
              <div className="flex justify-between gap-3"><dt className="font-bold text-muted2">활동 지역</dt><dd className="font-extrabold text-ink">📍 {c.region}</dd></div>
              <div className="flex justify-between gap-3"><dt className="font-bold text-muted2">분야</dt><dd className="text-right font-bold text-ink">{specialtyTags(c.specialty).join(" · ")}</dd></div>
              {c.rating > 0 && <div className="flex justify-between gap-3"><dt className="font-bold text-muted2">평점</dt><dd className="font-extrabold text-ink">★ {round1(c.rating)} ({c.review_count})</dd></div>}
              {c.naver_place && <div className="flex justify-between gap-3"><dt className="font-bold text-muted2">네이버 플레이스</dt><dd><a href={String(c.naver_place)} target="_blank" rel="noopener noreferrer" className="font-extrabold text-blue-l hover:underline">바로가기 →</a></dd></div>}
            </dl>
            <Link href="/map-tale" className="mt-4 inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-line bg-card px-4 py-2 text-[12.5px] font-extrabold text-ink transition-colors hover:border-ink">🗺 플래그맵에서 {c.region} 콘텐츠 보기 →</Link>
          </div>
          <NaverMiniMap lat={ctr?.[1]} lng={ctr?.[0]} name={`${c.region} · ${c.nickname}`} query={c.naver_place ? `${c.nickname} ${c.region}` : c.region} emoji="🎨" zoom={12} className="h-64 w-full md:h-full md:min-h-[260px]" />
        </div>
        <p className="mt-2 text-[11px] text-muted2">* 크리에이터 활동 지역 기준 위치 — 정확한 매장·공방 위치는 네이버 플레이스에서 확인하세요. (샘플 데이터)</p>
      </section>
    </PageShell>
  );
}
