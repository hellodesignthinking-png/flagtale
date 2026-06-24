import type { Metadata } from "next";
import Link from "next/link";
import { loadDistricts, loadScores } from "@/lib/data";
import { loadCreators, loadTours, loadStays, ftImage, round1 } from "@/lib/flagtale";
import { SiteFooter } from "@/components/page-shell";
import { ArticleCard, toCardItem, reasonInfo } from "@/components/landing/ArticleCard";
import { Carousel } from "@/components/landing/Carousel";
import { FeedTabs } from "@/components/landing/FeedTabs";
import { TrendingLocals } from "@/components/landing/TrendingLocals";
import { LiveMapSection } from "@/components/landing/LiveMapSection";
import type { Hero3DPoint } from "@/components/landing/LandingHero3DMap";
import { Reveal } from "@/components/landing/Reveal";
import { CountUp } from "@/components/landing/CountUp";
import { TrendTicker } from "@/components/landing/TrendTicker";

const SOURCES = ["KOSIS 인구", "네이버 검색·기사", "소진공 상권", "한국부동산원 임대", "한국문화정보원", "나라장터 예산", "VWorld 지오코딩", "서울 생활인구", "카드 매출", "건축HUB"];

export const metadata: Metadata = { title: "플래그테일랩 · 매력도 데이터 부문" };

export default function LabPage() {
  const scores = loadScores();
  const districts = loadDistricts();
  const creators = loadCreators();
  const tours = loadTours();
  const stays = loadStays();
  const expItems = [
    ...tours.slice(0, 2).map((t) => ({ id: `t${t.id}`, kind: "투어", emoji: "🎫", color: "#D4861E", title: t.title, region: t.region, image: t.image, price: t.price, unit: "", rating: t.rating, href: "/experience" })),
    ...stays.slice(0, 2).map((s) => ({ id: `s${s.id}`, kind: "스테이", emoji: "🏠", color: "#16a34a", title: s.title, region: s.region, image: s.image, price: s.price_per_night, unit: "/박", rating: s.rating, href: "/discover" })),
  ];
  const propBy = new Map(districts.features.map((f) => [f.properties.admCd2, f.properties]));
  const rows = Object.entries(scores.byPlace)
    .map(([cd, ser]) => ({ cd, p: propBy.get(cd)!, s: ser[ser.length - 1] }))
    .filter((r) => r.p && r.s);
  const risers = [...rows].sort((a, b) => b.s.momentum - a.s.momentum).slice(0, 10).map((r) => toCardItem(r.cd, r.p, r.s));
  const fallers = [...rows].sort((a, b) => a.s.momentum - b.s.momentum).slice(0, 6).map((r) => toCardItem(r.cd, r.p, r.s));
  const total = districts.features.length;
  const rising = rows.filter((r) => r.s.momentum > 1).length;
  const declining = rows.filter((r) => r.s.momentum < -1).length;
  const feat = risers[0];
  const sideTwo = risers.slice(1, 3);
  // 탭 피드용 풀: 상승 + 하락 + 젠트리(중복 제거)
  const allItems = rows.map((r) => toCardItem(r.cd, r.p, r.s));
  const byMom = [...allItems].sort((a, b) => b.momentum - a.momentum);
  const poolMap = new Map<string, ReturnType<typeof toCardItem>>();
  for (const it of [...byMom.slice(0, 12), ...byMom.slice(-12), ...allItems.filter((i) => i.gentriStage >= 3).sort((a, b) => b.gentriStage - a.gentriStage || b.klai - a.klai).slice(0, 12)]) {
    poolMap.set(it.cd, it);
  }
  const pool = [...poolMap.values()].sort((a, b) => Math.abs(b.momentum) - Math.abs(a.momentum));
  // 또래 평균 = 같은 시도(행안부 코드 앞 2자리) 4축 평균 (업종이 비어있어 지역으로 그룹). 폴백: 전국 평균.
  const sidoAcc = new Map<string, { d1: number; d2: number; d3: number; d4: number; n: number }>();
  const nat = { d1: 0, d2: 0, d3: 0, d4: 0, n: 0 };
  for (const r of rows) {
    const k = r.cd.slice(0, 2);
    const a = sidoAcc.get(k) ?? { d1: 0, d2: 0, d3: 0, d4: 0, n: 0 };
    a.d1 += r.s.d1; a.d2 += r.s.d2; a.d3 += r.s.d3; a.d4 += r.s.d4; a.n++;
    sidoAcc.set(k, a);
    nat.d1 += r.s.d1; nat.d2 += r.s.d2; nat.d3 += r.s.d3; nat.d4 += r.s.d4; nat.n++;
  }
  const peerOf = (cd: string) => {
    const a = sidoAcc.get(cd.slice(0, 2)) ?? (nat.n ? nat : null);
    return a && a.n ? { d1: a.d1 / a.n, d2: a.d2 / a.n, d3: a.d3 / a.n, d4: a.d4 / a.n } : undefined;
  };
  const toHero = (r: ReturnType<typeof toCardItem>, kind: "riser" | "faller"): Hero3DPoint => {
    const ri = reasonInfo(r);
    return {
      cd: r.cd, name: r.name, sigungu: r.sigungu, typology: r.typology, lng: r.lng, lat: r.lat,
      klai: r.klai, grade: r.grade, momentum: r.momentum, reason: ri.label, reasonDetail: ri.detail,
      d1: r.d1, d2: r.d2, d3: r.d3, d4: r.d4, gentriStage: r.gentriStage, marketVitality: r.marketVitality,
      popChangeRate: r.popChangeRate, budgetInflow: r.budgetInflow, peer: peerOf(r.cd), kind,
    };
  };
  // 3D 지도는 더 많은 동네로 밀도 있게 (도시당 하나가 아니라 상승 30 + 하락 14)
  const mapMovers = [...byMom.slice(0, 30), ...byMom.slice(-14)];
  const livePoints: Hero3DPoint[] = mapMovers.map((it) => toHero(it, it.momentum >= 0 ? "riser" : "faller"));

  return (
    <div className="theme-light relative min-h-screen overflow-hidden bg-navy pt-14 text-ink">
      <div className="deco-bg" aria-hidden />

      {/* 트렌드 티커 (careet 시그니처 다크 바) */}
      <TrendTicker />

      {/* 1) 에디토리얼 히어로 + 미니 라이브 카운터 (컨테이너) */}
      <section className="relative z-10 mx-auto flex max-w-6xl flex-wrap items-start justify-between gap-6 px-4 pt-12 pb-4 sm:px-6 sm:pt-14">
          <div className="max-w-[680px]">
            <span className="klai-eyebrow inline-flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-amber" style={{ boxShadow: "0 0 0 4px rgba(217,242,30,.3)" }} />
              Local Trend Intelligence
            </span>
            <h1 className="mt-3.5 font-display text-[clamp(38px,6vw,64px)] font-black leading-[1.04] tracking-[-0.035em]">
              지역의 트렌드변화,<br />지도로 <span className="hl-mark">라이브로</span> 확인하다.
            </h1>
            <p className="mt-5 max-w-[560px] text-[16px] text-muted">
              전국 {total.toLocaleString()}개 행정동의 매력도를 점수로. 검색·상권·인식·인구 13개 실데이터로 <b className="text-ink">뜨는 동네</b>와 <b className="text-ink">식는 동네</b>를 매주 진단합니다.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Link href="/diagnose" className="btn-glow inline-flex items-center gap-1.5 rounded-full bg-amber px-6 py-3.5 text-[15.5px] font-extrabold text-onaccent">내 지번 진단하기 →</Link>
              <Link href="/map" className="rounded-full border-[1.5px] border-line bg-card px-6 py-3.5 text-[15.5px] font-extrabold text-ink transition-colors hover:border-ink">지도 전체 탐색</Link>
            </div>
          </div>
          <div className="flex w-full max-w-[320px] flex-wrap gap-2.5 sm:w-auto">
            <div className="min-w-[136px] flex-1 rounded-[20px] border-[1.5px] border-line p-4">
              <CountUp to={rising} className="block font-display text-[30px] font-extrabold tabular-nums leading-none text-[#16a34a]" />
              <div className="mt-1.5 text-[12px] font-semibold text-muted2">📈 상승 동네</div>
            </div>
            <div className="min-w-[136px] flex-1 rounded-[20px] border-[1.5px] border-line p-4">
              <CountUp to={declining} className="block font-display text-[30px] font-extrabold tabular-nums leading-none text-warn" />
              <div className="mt-1.5 text-[12px] font-semibold text-muted2">📉 위기 동네</div>
            </div>
          </div>
        </section>

      {/* 3D 라이브맵 (풀블리드 — 최대 폭, 박스 없이 edge-to-edge) + 모멘텀 + 상세 팝업 */}
      <LiveMapSection points={livePoints} total={total} />

      <main className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        {/* 2) 매거진 피처드 — This Week */}
        <section className="pt-9 pb-1">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <span className="klai-eyebrow">This Week</span>
              <h2 className="mt-2 font-display text-[clamp(24px,3.4vw,32px)] font-black tracking-[-0.03em]">지금 전국에서 <span className="hl-mark">뜨는 동네</span>를 읽다</h2>
            </div>
            <Link href="/map" className="shrink-0 whitespace-nowrap rounded-full border-[1.5px] border-line bg-card px-[18px] py-2.5 text-[13px] font-extrabold text-ink transition-colors hover:border-ink">전체 탐색 →</Link>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
            <ArticleCard item={feat} big />
            <div className="grid grid-rows-2 gap-4">
              {sideTwo.map((it) => (
                <ArticleCard key={it.cd} item={it} />
              ))}
            </div>
          </div>
        </section>

        {/* 🔥 지금 뜨는 동네 캐러셀 */}
        <Reveal as="section" className="py-10">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="font-display text-[clamp(22px,3vw,28px)] font-black tracking-[-0.03em]">🔥 지금 뜨는 동네</h2>
            <Link href="/reports" className="text-[13px] font-bold text-blue-l hover:underline">주간 리포트 전체 →</Link>
          </div>
          <Carousel>
            {risers.map((it) => (
              <ArticleCard key={it.cd} item={it} />
            ))}
          </Carousel>
        </Reveal>

        {/* 3) 전국 동네 피드 — 카테고리 탭 필터 (careet 그레이 밴드) */}
        <Reveal as="section" className="py-8">
          <div className="rounded-[28px] border-[1.5px] border-line bg-card2 px-5 py-8 sm:px-8">
            <div className="mb-5 flex items-end justify-between">
              <h2 className="font-display text-[clamp(22px,3vw,28px)] font-black tracking-[-0.03em]">🗂 전국 동네 피드</h2>
              <span className="text-[12px] font-bold text-muted2">카테고리로 골라보기</span>
            </div>
            <FeedTabs items={pool} />
          </div>
        </Reveal>

        {/* 로컬 발견·경험 — Flagtale 플랫폼 소비자 콘텐츠 (실데이터) */}
        <Reveal as="section" className="py-9">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <span className="klai-eyebrow">Discover &amp; Experience</span>
              <h2 className="mt-2 font-display text-[clamp(24px,3.4vw,32px)] font-black tracking-[-0.03em]">로컬을 <span className="hl-mark">발견하고 경험하다</span></h2>
            </div>
            <Link href="/discover" className="shrink-0 whitespace-nowrap rounded-full border-[1.5px] border-line bg-card px-[18px] py-2.5 text-[13px] font-extrabold text-ink transition-colors hover:border-ink">발견·경험 전체 →</Link>
          </div>
          {/* 크리에이터 스트립 */}
          <div className="mb-4 flex gap-2.5 overflow-x-auto pb-1">
            {creators.slice(0, 7).map((c) => (
              <Link key={c.id} href="/" className="lift flex shrink-0 items-center gap-2.5 rounded-full border-[1.5px] border-line bg-card py-1.5 pl-1.5 pr-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ftImage(c.image)} alt={c.name} loading="lazy" decoding="async" className="h-9 w-9 rounded-full object-cover" />
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-extrabold text-ink">{c.name}</div>
                  <div className="truncate text-[11px] text-muted2">{c.region} · {c.specialty.split(/[/,·]/)[0].trim()}</div>
                </div>
              </Link>
            ))}
          </div>
          {/* 투어·스테이 카드 */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {expItems.map((e) => (
              <Link key={e.id} href={e.href} className="lift flex flex-col overflow-hidden rounded-[20px] border-[1.5px] border-line bg-card">
                <div className="relative aspect-[16/10] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ftImage(e.image)} alt={e.title} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                  <span className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-extrabold text-white" style={{ background: e.color }}>{e.emoji} {e.kind}</span>
                  {e.rating ? <span className="absolute right-3 top-3 rounded-full bg-ink/80 px-2 py-1 text-[11px] font-extrabold text-white">★ {round1(e.rating)}</span> : null}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="text-[11px] font-extrabold text-blue-l">{e.region}</div>
                  <h3 className="mt-1 line-clamp-2 text-[14.5px] font-black leading-snug tracking-tight text-ink">{e.title}</h3>
                  <div className="mt-auto pt-3">
                    <span className="font-display text-[18px] font-black tabular-nums text-ink">{e.price.toLocaleString()}</span>
                    <span className="text-[12px] font-bold text-muted2">원{e.unit}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Reveal>

        {/* 4) 뉴스·블로그로 뜨는 로컬 동네 (네이버 실시간) */}
        <Reveal as="section" className="py-8">
          <TrendingLocals />
        </Reveal>

        {/* 데이터 소스 마퀴 */}
        <section className="py-2">
          <div className="marquee-mask overflow-hidden">
            <div className="marquee-track">
              {[...SOURCES, ...SOURCES].map((s, i) => (
                <span key={i} className="rounded-full border border-line bg-card2/60 px-3.5 py-1.5 text-[12px] font-semibold text-muted">{s}</span>
              ))}
            </div>
          </div>
        </section>

        {/* 활용 4칩 */}
        <Reveal as="section" className="py-8">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: "🗺️", t: "매력도 지도", href: "/map" },
              { icon: "🔎", t: "지번 진단", href: "/diagnose" },
              { icon: "🏪", t: "브랜드 진단", href: "/brand" },
              { icon: "🏛️", t: "기관 대시보드", href: "/dashboard" },
            ].map((f) => (
              <Link key={f.href} href={f.href} className="lift group rounded-2xl border border-line bg-card2/40 p-5 text-center">
                <div className="text-2xl">{f.icon}</div>
                <div className="mt-2 text-[14px] font-extrabold text-ink group-hover:text-blue-l">{f.t}</div>
              </Link>
            ))}
          </div>
        </Reveal>

        {/* 5) 뉴스레터 CTA (careet 시그니처 옐로 블록) */}
        <Reveal as="section" className="py-12">
          <div className="relative overflow-hidden rounded-[28px] bg-amber px-6 py-14 text-center sm:px-8">
            <div className="pointer-events-none absolute -bottom-10 -right-10 select-none text-[200px] leading-none opacity-[0.12]" style={{ transform: "rotate(-8deg)" }} aria-hidden>🗺</div>
            <span className="relative font-display text-[12px] font-extrabold uppercase tracking-[0.24em]" style={{ color: "#2b3d0a" }}>Flagtale Weekly</span>
            <h2 className="relative mt-2.5 font-display text-[clamp(28px,4.4vw,40px)] font-black tracking-[-0.03em] text-onaccent">
              트렌드를 <span style={{ textDecoration: "underline", textDecorationThickness: "5px", textUnderlineOffset: "4px" }}>먼저</span> 읽으세요
            </h2>
            <p className="relative mx-auto mt-3 max-w-[440px] text-[15px] font-medium" style={{ color: "#2b3d0a" }}>매주 월요일, 전국에서 뜨고 지는 동네와 그 이유를 메일로.</p>
            <div className="relative mx-auto mt-7 flex max-w-[440px] flex-col gap-2 sm:flex-row">
              <input type="email" placeholder="이메일 주소" aria-label="이메일 주소" className="h-[52px] flex-1 rounded-full border-[1.5px] bg-white px-5 text-[15px] text-ink placeholder:text-muted2 focus:outline-none" style={{ borderColor: "#1c2b02" }} />
              <Link href="/auth" className="grid h-[52px] shrink-0 place-items-center whitespace-nowrap rounded-full bg-ink px-8 text-[15px] font-extrabold text-white transition-transform hover:scale-[1.02] active:scale-95">무료 구독</Link>
            </div>
            <p className="relative mt-3.5 text-[11px]" style={{ color: "#3d5212" }}>회원가입 시 주간 리포트·진단 알림. 개인 식별 데이터는 집계로만 사용(§15).</p>
          </div>
        </Reveal>
      </main>
      <SiteFooter />
    </div>
  );
}
