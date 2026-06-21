import Link from "next/link";
import { loadDistricts, loadScores } from "@/lib/data";
import { SiteFooter } from "@/components/page-shell";
import { ArticleCard, toCardItem, reasonInfo } from "@/components/landing/ArticleCard";
import { Carousel } from "@/components/landing/Carousel";
import { FeedTabs } from "@/components/landing/FeedTabs";
import { TrendingLocals } from "@/components/landing/TrendingLocals";
import { LiveMapSection } from "@/components/landing/LiveMapSection";
import type { Hero3DPoint } from "@/components/landing/LandingHero3DMap";
import { Reveal } from "@/components/landing/Reveal";

const SOURCES = ["KOSIS 인구", "네이버 검색·기사", "소진공 상권", "한국부동산원 임대", "한국문화정보원", "나라장터 예산", "VWorld 지오코딩", "서울 생활인구", "카드 매출", "건축HUB"];

export default function LandingPage() {
  const scores = loadScores();
  const districts = loadDistricts();
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
  const toHero = (r: ReturnType<typeof toCardItem>, kind: "riser" | "faller"): Hero3DPoint => {
    const ri = reasonInfo(r);
    return {
      cd: r.cd, name: r.name, sigungu: r.sigungu, typology: r.typology, lng: r.lng, lat: r.lat,
      klai: r.klai, grade: r.grade, momentum: r.momentum, reason: ri.label, reasonDetail: ri.detail,
      d1: r.d1, d2: r.d2, d3: r.d3, d4: r.d4, gentriStage: r.gentriStage, marketVitality: r.marketVitality,
      popChangeRate: r.popChangeRate, budgetInflow: r.budgetInflow, kind,
    };
  };
  const livePoints: Hero3DPoint[] = [...risers.map((r) => toHero(r, "riser")), ...fallers.map((r) => toHero(r, "faller"))];

  return (
    <div className="theme-light relative min-h-screen overflow-hidden bg-navy pt-14 text-ink">
      <div className="deco-bg" aria-hidden />

      {/* 풀폭 3D 라이브 맵 히어로 + 요약 + 상세 팝업 (넓이 제한 없음) */}
      <LiveMapSection points={livePoints} total={total} rising={rising} declining={declining} />

      <main className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3 pt-6 pb-5">
          <div>
            <span className="klai-eyebrow">Local Trend Intelligence</span>
            <h1 className="mt-1.5 text-[1.7rem] font-extrabold tracking-tight sm:text-[2rem]">
              지금 전국에서 <span className="hl-mark">뜨는 동네</span>를 읽다
            </h1>
          </div>
          <Link href="/map" className="hidden shrink-0 rounded-full border border-line bg-card2 px-4 py-2 text-[13px] font-bold text-ink transition-colors hover:border-blue/50 sm:inline-block">지도 전체 탐색 →</Link>
        </div>

        {/* 피처드 — 큰 기사 + 사이드 2 */}
        <section className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
          <ArticleCard item={feat} big />
          <div className="grid grid-rows-2 gap-4">
            {sideTwo.map((it) => (
              <ArticleCard key={it.cd} item={it} />
            ))}
          </div>
        </section>

        {/* 지금 뜨는 동네 그리드 */}
        <Reveal as="section" className="py-10">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-[1.4rem] font-extrabold tracking-tight sm:text-[1.7rem]">🔥 지금 뜨는 동네</h2>
            <Link href="/reports" className="text-[13px] font-bold text-blue-l hover:underline">주간 리포트 전체 →</Link>
          </div>
          <Carousel>
            {risers.map((it) => (
              <ArticleCard key={it.cd} item={it} />
            ))}
          </Carousel>
        </Reveal>

        {/* 뉴스·블로그로 뜨는 로컬 동네 (에디토리얼 큐레이션) */}
        <Reveal as="section" className="py-8">
          <TrendingLocals />
        </Reveal>

        {/* 전국 동네 피드 — 카테고리 탭 필터 */}
        <Reveal as="section" className="py-8">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-[1.4rem] font-extrabold tracking-tight sm:text-[1.7rem]">🗂 전국 동네 피드</h2>
            <span className="text-[12px] font-bold text-muted2">카테고리로 골라보기</span>
          </div>
          <FeedTabs items={pool} />
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

        {/* 뉴스레터 */}
        <Reveal as="section" className="py-12">
          <div className="relative overflow-hidden rounded-[28px] border border-line bg-card2/60 px-6 py-12 text-center sm:px-10">
            <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full opacity-50 blur-3xl" style={{ background: "radial-gradient(circle, var(--blue-l), transparent 70%)" }} />
            <span className="klai-eyebrow relative">Flagtale Weekly</span>
            <h2 className="relative mt-2 text-[1.7rem] font-extrabold tracking-tight sm:text-[2.1rem]">트렌드를 <span className="hl-mark">먼저</span> 읽으세요</h2>
            <p className="relative mx-auto mt-2 max-w-md text-[14px] text-muted">매주 월요일, 전국에서 뜨고 지는 동네와 그 이유를 메일로.</p>
            <div className="relative mx-auto mt-6 flex max-w-md flex-col gap-2 sm:flex-row">
              <input type="email" placeholder="이메일 주소" aria-label="이메일 주소" className="h-12 flex-1 rounded-full border border-line bg-navy px-5 text-[14px] text-ink placeholder:text-muted2 focus:border-blue focus:outline-none" />
              <Link href="/auth" className="btn-glow grid h-12 shrink-0 place-items-center rounded-full bg-amber px-7 text-[15px] font-extrabold text-onaccent">무료 구독</Link>
            </div>
            <p className="relative mt-3 text-[11px] text-muted2">회원가입 시 주간 리포트·진단 알림. 개인 식별 데이터는 집계로만 사용(§15).</p>
          </div>
        </Reveal>
      </main>
      <SiteFooter />
    </div>
  );
}
