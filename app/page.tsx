import type { Metadata } from "next";
import Link from "next/link";
import { loadCreators, loadTours, loadStays, loadFlagPasses, ftImage, round1 } from "@/lib/flagtale";
import { SiteFooter } from "@/components/page-shell";
import { CreatorShowroom } from "@/components/flagtale/CreatorShowroom";
import { TourList } from "@/components/flagtale/TourList";
import { narrativeJumpList, reasonsFor, STAGE_META } from "@/lib/narratives";
import { authenticityGap, supplyBoost } from "@/lib/supply";
import { instagramFor, buzzBoost, igCountLabel } from "@/lib/connectors/instagram";

export const metadata: Metadata = { title: "Flagtale · 로컬을 발견하고 경험하다" };

export default function HomePage() {
  const creators = loadCreators();
  const tours = loadTours();
  const stays = loadStays();
  const passes = loadFlagPasses();
  const creatorsMap = Object.fromEntries(creators.map((c) => [c.id, { name: c.name, nickname: c.nickname, image: c.image }]));
  const regions = new Set(creators.map((c) => c.region)).size;

  // 🔥 지금 뜨는 동네 — 핫지역 내러티브 + 인스타 버즈 + 진정성 갭. 일반 사용자용 '확인' 피드.
  // 라이프사이클 단계 우선(절정·확산 먼저) → 그 안에서 버즈순. 태그수 큰 지역이 무조건 앞서지 않게.
  const STAGE_RANK: Record<string, number> = { peak: 0, spread: 1, gentri: 2, formation: 3, decline: 4 };
  const trending = narrativeJumpList()
    .map((n) => {
      const ig = instagramFor(n.name);
      const gap = authenticityGap(supplyBoost(n.admCd2), buzzBoost(ig?.postsCount));
      return { name: n.name, admCd2: n.admCd2, stage: n.stage, sm: STAGE_META[n.stage], reason: reasonsFor(n.name)[0] ?? n.theme, posts: ig?.postsCount ?? 0, verdict: gap.verdict };
    })
    .sort((a, b) => (STAGE_RANK[a.stage] - STAGE_RANK[b.stage]) || b.posts - a.posts)
    .slice(0, 12);

  return (
    <div className="theme-light relative min-h-screen overflow-hidden bg-navy pt-14 text-ink">
      <div className="deco-bg" aria-hidden />

      {/* 히어로 */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 pt-12 pb-2 sm:px-6 sm:pt-14">
        <span className="klai-eyebrow inline-flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-amber" style={{ boxShadow: "0 0 0 4px rgba(217,242,30,.3)" }} />
          Discover &amp; Experience
        </span>
        <h1 className="mt-3.5 font-display text-[clamp(34px,5.4vw,56px)] font-black leading-[1.05] tracking-[-0.035em]">
          로컬을 <span className="hl-mark">발견하고 경험하다</span>
        </h1>
        <p className="mt-4 max-w-[600px] text-[16px] text-muted">
          전국 로컬 크리에이터가 큐레이션한 <b className="text-ink">투어 · 스테이 · FLAG PASS</b>. 지도로 둘러보려면 플래그맵에서.
        </p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <Link href="/map-tale" className="btn-glow inline-flex items-center gap-1.5 rounded-full bg-amber px-6 py-3.5 text-[15px] font-extrabold text-onaccent">🗺 지도로 탐색 →</Link>
          <Link href="/pricing" className="rounded-full border-[1.5px] border-line bg-card px-6 py-3.5 text-[15px] font-extrabold text-ink transition-colors hover:border-ink">FLAG PASS 보기</Link>
        </div>
        {trending.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-muted2">
            <span className="font-extrabold text-warn">🔥 지금 뜨는</span>
            {trending.slice(0, 5).map((t) => (
              <Link key={t.admCd2} href={`/place/${t.admCd2}`} className="font-bold text-ink underline-offset-2 hover:text-amber hover:underline">
                {t.name}
              </Link>
            ))}
            <a href="#trending" className="font-bold text-blue-l hover:text-amber">더 보기 →</a>
          </div>
        )}
      </section>

      <main className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        {/* 🔥 지금 뜨는 동네 — 일반 사용자용 '확인' 피드 (핫지역 내러티브·인스타 버즈·진정성 갭) */}
        {trending.length > 0 && (
          <section id="trending" className="scroll-mt-20 pt-9">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <div>
                <span className="klai-eyebrow">🔥 지금 뜨는 동네</span>
                <h2 className="mt-1.5 font-display text-[clamp(24px,3.4vw,32px)] font-black tracking-[-0.03em]">실시간으로 뜨는 동네, <span className="hl-mark">우리 동네는?</span></h2>
              </div>
              <Link href="/map-tale" className="shrink-0 rounded-full border-[1.5px] border-line bg-card px-4 py-2 text-[13px] font-extrabold text-ink transition-colors hover:border-ink">🗺 지도에서 전체 보기 →</Link>
            </div>
            <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
              {trending.map((t) => (
                <Link key={t.admCd2} href={`/place/${t.admCd2}`} className="lift flex w-[230px] shrink-0 snap-start flex-col rounded-[18px] border-[1.5px] border-line bg-card p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full px-2.5 py-1 text-[11px] font-extrabold" style={{ background: `${t.sm.color}22`, color: t.sm.color }}>{t.sm.emoji} {t.sm.short}</span>
                    {t.verdict === "hype" && <span className="text-[10.5px] font-extrabold text-warn">🔴 과열</span>}
                    {t.verdict === "hidden" && <span className="text-[10.5px] font-extrabold text-grade-b">🟢 미발견</span>}
                  </div>
                  <h3 className="mt-2.5 font-display text-[19px] font-black tracking-tight text-ink">{t.name}</h3>
                  {t.posts > 0 && <div className="mt-0.5 text-[11.5px] font-extrabold text-blue-l">📸 인스타 {igCountLabel(t.posts)} 게시물</div>}
                  <p className="mt-2 line-clamp-3 flex-1 text-[12px] leading-relaxed text-muted">{t.reason}</p>
                  <span className="mt-3 inline-flex items-center text-[12.5px] font-extrabold text-ink">왜 떴나 →</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 발견 — 크리에이터 쇼룸 */}
        <section className="pt-10 pb-1">
          <div className="mb-1 flex flex-wrap items-end justify-between gap-2">
            <div>
              <span className="klai-eyebrow">발견 · Creators</span>
              <h2 className="mt-1.5 font-display text-[clamp(24px,3.4vw,32px)] font-black tracking-[-0.03em]">로컬 크리에이터의 <span className="hl-mark">철학</span></h2>
            </div>
            <div className="flex gap-2 text-[12px] font-bold text-muted2">
              <span>크리에이터 {creators.length}</span>·<span>{regions}개 도시</span>·<span>투어 {tours.length}</span>
            </div>
          </div>
          <CreatorShowroom creators={creators} />
        </section>

        {/* 경험 — FLAG PASS */}
        <section className="py-7">
          <div className="mb-4">
            <span className="klai-eyebrow">경험 · FLAG PASS</span>
            <h2 className="mt-1.5 font-display text-[clamp(22px,3vw,28px)] font-black tracking-[-0.03em]">패스 하나로 전국 로컬을 <span className="hl-mark">할인가</span>에</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {passes.map((p, i) => {
              const featured = i === 1;
              return (
                <div key={p.id} className="relative flex flex-col rounded-[24px] border-[1.5px] border-line bg-card p-6" style={featured ? { boxShadow: "0 0 0 1.5px var(--amber), 0 24px 50px -30px rgba(0,0,0,.25)" } : undefined}>
                  {featured && <span className="absolute -top-2.5 left-6 rounded-full bg-amber px-3 py-1 text-[11px] font-extrabold text-onaccent">🔥 가장 인기</span>}
                  <div className="text-[13px] font-extrabold text-blue-l">{p.name}</div>
                  <div className="mt-1.5 flex items-end gap-1">
                    <span className="font-display text-[30px] font-black tabular-nums leading-none text-ink">{p.price.toLocaleString()}</span>
                    <span className="pb-1 text-[13px] font-bold text-muted2">원 / {p.duration_days}일</span>
                  </div>
                  <div className="mt-1 inline-flex w-fit rounded-full bg-amber/15 px-2.5 py-1 text-[12px] font-extrabold text-blue-l">투어·숙소 {p.discount_percent}% 할인</div>
                  <ul className="mt-4 space-y-2">
                    {p.benefits.split(",").map((b, bi) => (
                      <li key={`${p.id}-${bi}`} className="flex gap-2 text-[12.5px] text-muted"><span className="text-grade-b">✓</span><span>{b.trim()}</span></li>
                    ))}
                  </ul>
                  <Link href="/pricing" className={`mt-5 flex items-center justify-center rounded-full px-5 py-3 text-[14px] font-extrabold ${featured ? "btn-glow bg-amber text-onaccent" : "border-[1.5px] border-line bg-card text-ink hover:border-ink"}`}>플랜 보기</Link>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-center text-[11.5px] text-muted2">샘플 가격 · 실제 결제(PortOne)는 백엔드 통합 후 활성화됩니다.</p>
        </section>

        {/* 경험 — 투어 */}
        <section id="tours" className="scroll-mt-20 py-7">
          <div className="mb-4">
            <span className="klai-eyebrow">경험 · Local Tours</span>
            <h2 className="mt-1.5 font-display text-[clamp(22px,3vw,28px)] font-black tracking-[-0.03em]">지금 뜨는 <span className="hl-mark">로컬 투어</span></h2>
          </div>
          <TourList tours={tours} creators={creatorsMap} />
        </section>

        {/* 경험 — 스테이 */}
        <section id="stays" className="scroll-mt-20 py-7">
          <div className="mb-4">
            <span className="klai-eyebrow">경험 · Local Stays</span>
            <h2 className="mt-1.5 font-display text-[clamp(22px,3vw,28px)] font-black tracking-[-0.03em]">하룻밤 더, <span className="hl-mark">로컬 스테이</span></h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {stays.map((s) => (
              <Link key={s.id} href={`/stay/${s.id}`} className="group lift flex flex-col overflow-hidden rounded-[20px] border-[1.5px] border-line bg-card">
                <div className="relative aspect-[16/10] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ftImage(s.image)} alt={s.title} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,transparent 50%,rgba(0,0,0,.5))" }} />
                  {s.badge_label && <span className="absolute left-3 top-3 rounded-full bg-amber px-2.5 py-1 text-[11px] font-extrabold text-onaccent">{s.badge_label}</span>}
                  <span className="absolute right-3 top-3 rounded-full bg-ink/80 px-2 py-1 text-[11px] font-extrabold text-white">★ {round1(s.rating)}</span>
                  <span className="absolute bottom-3 left-3 rounded-full bg-card/90 px-2.5 py-1 text-[11px] font-extrabold text-ink">{s.stay_type}</span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="text-[11px] font-extrabold tracking-wide text-blue-l">{s.region} · 호스트 {s.host_name}</div>
                  <h3 className="mt-1.5 text-[17px] font-black leading-snug tracking-tight text-ink">{s.title}</h3>
                  <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-muted">{s.description}</p>
                  <div className="mt-auto flex items-end justify-between pt-3.5">
                    <div>
                      <span className="font-display text-[20px] font-black tabular-nums text-ink">{s.price_per_night.toLocaleString()}</span>
                      <span className="text-[12px] font-bold text-muted2">원 / 박</span>
                    </div>
                    <span className="rounded-full border-[1.5px] border-line bg-card px-3.5 py-2 text-[12.5px] font-extrabold text-ink transition-colors group-hover:border-ink">예약 →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <p className="mt-4 text-center text-[11.5px] text-muted2">샘플·잠정 데이터 · 실제 예약·결제(PortOne)·외부 OTA 연동은 백엔드 통합 단계에서 활성화됩니다.</p>
        </section>

        {/* ✋ 참여 — 동네를 함께 만들기 */}
        <section className="py-9">
          <div className="rounded-[28px] border-[1.5px] border-line bg-card2 px-6 py-8 sm:px-9">
            <div className="text-center">
              <span className="klai-eyebrow">✋ 참여 · Be Local</span>
              <h2 className="mt-2 font-display text-[clamp(22px,3.2vw,30px)] font-black tracking-[-0.03em]">동네는 <span className="hl-mark">함께</span> 만들어집니다</h2>
              <p className="mt-2 text-[14px] text-muted">확인하고, 제보하고, 경험하세요 — 당신의 참여가 동네의 매력을 키웁니다.</p>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Link href="/map-tale" className="lift rounded-[18px] border-[1.5px] border-line bg-card p-5 text-center">
                <div className="text-[26px]">🔍</div>
                <div className="mt-1.5 text-[15px] font-black text-ink">내 동네 확인</div>
                <p className="mt-1 text-[12px] text-muted">우리 동네 매력도·등급·뜨는 이유를 지도에서</p>
              </Link>
              <Link href="/host" className="lift rounded-[18px] border-[1.5px] border-amber bg-card p-5 text-center" style={{ boxShadow: "0 0 0 1.5px var(--amber)" }}>
                <div className="text-[26px]">🏪</div>
                <div className="mt-1.5 text-[15px] font-black text-ink">매장·공간 등록</div>
                <p className="mt-1 text-[12px] text-muted">내 매장·스테이·투어·워크숍을 직접 등록</p>
              </Link>
              <Link href="/contribute" className="lift rounded-[18px] border-[1.5px] border-line bg-card p-5 text-center">
                <div className="text-[26px]">📝</div>
                <div className="mt-1.5 text-[15px] font-black text-ink">동네 제보</div>
                <p className="mt-1 text-[12px] text-muted">뜨는 가게·공간·분위기를 알려주세요</p>
              </Link>
              <Link href="#tours" className="lift rounded-[18px] border-[1.5px] border-line bg-card p-5 text-center">
                <div className="text-[26px]">🎒</div>
                <div className="mt-1.5 text-[15px] font-black text-ink">로컬 경험</div>
                <p className="mt-1 text-[12px] text-muted">크리에이터가 큐레이션한 투어·스테이</p>
              </Link>
            </div>
          </div>
        </section>

        {/* 플래그테일랩(데이터 부문) 진입 */}
        <section className="py-10">
          <Link href="/lab" className="lift group relative flex flex-col items-start gap-4 overflow-hidden rounded-[28px] border-[1.5px] border-line bg-card2 px-6 py-9 sm:px-9 md:flex-row md:items-center md:justify-between">
            <div className="pointer-events-none absolute -right-6 -top-8 select-none text-[150px] leading-none opacity-[0.06]" aria-hidden>📊</div>
            <div className="relative">
              <span className="klai-eyebrow">Flagtale Lab · 매력도 데이터</span>
              <h2 className="mt-2 font-display text-[clamp(22px,3.2vw,30px)] font-black tracking-[-0.03em]">이 동네가 <span className="hl-mark">왜 뜨고 식는지</span> 데이터로 읽다</h2>
              <p className="mt-2 max-w-[520px] text-[14px] text-muted">전국 행정동 매력도 점수·모멘텀·젠트리 단계·시그널. 검색·상권·인구·인식 실데이터 기반의 데이터 부문.</p>
            </div>
            <span className="relative shrink-0 whitespace-nowrap rounded-full bg-ink px-6 py-3.5 text-[14.5px] font-extrabold text-white transition-transform group-hover:scale-[1.03]">플래그테일랩 →</span>
          </Link>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
