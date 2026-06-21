import Link from "next/link";
import { loadDistricts, loadScores, getPeerAvg } from "@/lib/data";
import { GRADE_HEX } from "@/lib/constants";
import { SiteFooter } from "@/components/page-shell";
import { KlaiGauge } from "@/components/charts/KlaiGauge";
import { ScoreRadar } from "@/components/charts/ScoreRadar";
import { CompositionDiagram } from "@/components/charts/CompositionDiagram";
import { NarrativeCurve } from "@/components/charts/NarrativeCurve";

const FEATURES = [
  { icon: "🗺️", cat: "EXPLORE", title: "매력도 지도", desc: "전국 행정동을 색으로 — 9개 레이어·시간 슬라이더로 뜨고 지는 동네를 한눈에.", href: "/map" },
  { icon: "🔎", cat: "DIAGNOSE", title: "지번 진단", desc: "주소·지번 입력 → 방향·위기·전략 + 2016~2026 장기 변화 종합 리포트.", href: "/diagnose" },
  { icon: "🏪", cat: "BRAND", title: "브랜드 진단", desc: "네이버 등록 매장 중심 — 경쟁력·성장·위기(재개발 포함)까지.", href: "/brand" },
  { icon: "📰", cat: "WEEKLY", title: "주간 리포트", desc: "매주 전국에서 어떤 동네가 왜 뜨고 지는지, 연구자 관점으로 자동 발행.", href: "/reports" },
  { icon: "📡", cat: "FIELD", title: "현장 리포트", desc: "데이터로 못 잡는 분위기·객층을 현장 사람들이 보강하는 휴먼 센서망.", href: "/contribute" },
  { icon: "🏛️", cat: "B2G·B2B", title: "기관 대시보드", desc: "관할 모니터링·경보·정책 What-if·API. 지자체·AMC·VC용.", href: "/dashboard" },
];
const SOURCES = ["KOSIS 인구", "네이버 검색·기사", "소진공 상권", "부동산원 임대", "문화정보원", "나라장터 예산", "VWorld 지오코딩", "생활인구"];

export default function LandingPage() {
  const scores = loadScores();
  const districts = loadDistricts();
  const propBy = new Map(districts.features.map((f) => [f.properties.admCd2, f.properties]));
  const rows = Object.entries(scores.byPlace)
    .map(([cd, ser]) => ({ cd, p: propBy.get(cd)!, s: ser[ser.length - 1] }))
    .filter((r) => r.p && r.s);
  const risers = [...rows].sort((a, b) => b.s.momentum - a.s.momentum).slice(0, 6);
  const fallers = [...rows].sort((a, b) => a.s.momentum - b.s.momentum).slice(0, 3);
  const feat = risers[0];
  const peer = getPeerAvg(feat.p.typology);
  const total = districts.features.length;

  return (
    <div className="theme-light relative min-h-screen overflow-hidden bg-navy pt-14 text-ink">
      <div className="deco-bg" aria-hidden />
      <main className="relative z-10">
        {/* HERO */}
        <section className="mx-auto max-w-5xl px-6 pb-8 pt-20 text-center sm:pt-24">
          <span className="klai-eyebrow fade-up inline-block">Local Intelligence · 동네 트렌드 인텔리전스</span>
          <h1 className="display-hero fade-up mt-4 text-[2.6rem] sm:text-[4.2rem]">
            지금 뜨는 동네,<br className="hidden sm:block" /> <span className="hl-mark">데이터로 먼저</span> 안다
          </h1>
          <p className="fade-up mx-auto mt-5 max-w-2xl text-[15px] font-medium leading-relaxed text-muted sm:text-[17px]">
            전국 {total.toLocaleString()}개 행정동·로컬 매장의 활력·성장·위기를 13개 실데이터로 진단하고, <b className="text-ink">왜 뜨고 왜 지는지</b>까지 설명합니다.
          </p>
          <div className="fade-up mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/map" className="btn-glow rounded-full bg-amber px-7 py-3.5 text-[15px] font-extrabold text-onaccent">🗺️ 매력도 지도 탐색</Link>
            <Link href="/diagnose" className="rounded-full border border-line bg-card2 px-7 py-3.5 text-[15px] font-extrabold text-ink transition-colors hover:border-blue/50">우리 동네 진단 →</Link>
          </div>
        </section>

        {/* HERO 프리뷰 — 실데이터 진단 미리보기(게이지 + 4축 레이더) */}
        <section className="mx-auto max-w-5xl px-6 pb-6">
          <Link href={`/diagnose?admCd=${feat.cd}`} className="lift gradient-border group block rounded-[28px] bg-card2/60 p-6 sm:p-8">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <span className="cat-tag">LIVE PREVIEW · 이주의 1위</span>
              <span className="status-pill" style={{ background: "var(--amber)", color: "var(--on-accent)" }}>📈 뜨는 중 +{feat.s.momentum}</span>
            </div>
            <div className="grid items-center gap-6 md:grid-cols-[auto_1fr]">
              <div className="flex flex-col items-center">
                <KlaiGauge klai={feat.s.klai} grade={feat.s.grade} momentum={feat.s.momentum} size={150} />
                <div className="mt-2 text-[18px] font-black text-ink group-hover:text-blue-l">{feat.p.name}</div>
                <div className="text-[12px] text-muted2">{feat.p.sido} {feat.p.sigungu} · {feat.p.typology}</div>
              </div>
              <div className="min-w-0">
                <div className="mb-2 text-[12px] font-bold text-muted2">4축 매력도 (vs 유형 평균)</div>
                <ScoreRadar score={feat.s} peerAvg={peer} />
              </div>
            </div>
            <div className="mt-4 text-center text-[12.5px] font-bold text-blue-l">이 동네 전체 진단 보기 →</div>
          </Link>
        </section>

        {/* 이주의 뜨는 동네 */}
        <section className="mx-auto max-w-6xl px-6 py-10">
          <div className="mb-5 flex items-end justify-between">
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">📈 이주의 뜨는 동네</h2>
            <Link href="/reports" className="text-[13px] font-bold text-blue-l hover:underline">주간 리포트 전체 →</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {risers.map((r) => (
              <Link key={r.cd} href={`/diagnose?admCd=${r.cd}`} className="lift group overflow-hidden rounded-2xl border border-line bg-card2/50">
                <div className="relative h-24 overflow-hidden" style={{ background: `linear-gradient(135deg, ${GRADE_HEX[r.s.grade]}, ${GRADE_HEX[r.s.grade]}22)` }}>
                  <span className="absolute right-3 top-3 status-pill" style={{ background: "rgba(255,255,255,.22)", color: "#fff" }}>📈 뜨는 중 +{r.s.momentum}</span>
                  <span className="absolute bottom-2 left-4 text-3xl font-black text-white/95 tabular-nums">{r.s.klai}</span>
                  <span className="absolute bottom-3 right-3 text-[11px] font-bold text-white/80">KLAI · {r.s.grade}등급</span>
                </div>
                <div className="p-4">
                  <div className="cat-tag">{r.p.sigungu} · {r.p.typology}</div>
                  <div className="mt-1 text-[17px] font-extrabold text-ink group-hover:text-blue-l">{r.p.name}</div>
                  <div className="mt-1 text-[12.5px] text-muted">검색·상권·인식이 함께 오르는 상승 국면 — 진단 보기 →</div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 식는 동네 */}
        <section className="mx-auto max-w-6xl px-6 py-6">
          <h2 className="mb-4 text-2xl font-black tracking-tight sm:text-3xl">📉 식는 동네 · 위기 신호</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {fallers.map((r) => (
              <Link key={r.cd} href={`/diagnose?admCd=${r.cd}`} className="lift flex items-center gap-3 rounded-2xl border border-line bg-card2/50 p-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-lg font-black text-white" style={{ background: GRADE_HEX[r.s.grade] }}>{r.s.grade}</span>
                <div className="min-w-0">
                  <div className="cat-tag">{r.p.sigungu}</div>
                  <div className="truncate text-[15px] font-extrabold text-ink">{r.p.name}</div>
                  <span className="status-pill mt-0.5 border border-warn/40 text-warn">📉 {r.s.momentum} · KLAI {r.s.klai}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* KLAI 작동 원리 — 다이어그램(4축 → 점수) */}
        <section className="mx-auto max-w-6xl px-6 py-14">
          <div className="rounded-[28px] border border-line bg-card2/40 p-7 sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              <div>
                <span className="klai-eyebrow">How KLAI works</span>
                <h2 className="display-hero mt-2 text-3xl sm:text-[2.4rem]">
                  4개 축을 합쳐<br /> <span className="hl-mark">하나의 점수</span>로
                </h2>
                <p className="mt-3 text-[14px] leading-relaxed text-muted">
                  인구·상권·공간·인식 4축을 가중 합성하고(상권·서사를 30%로 크게), 변화 속도(모멘텀)와 위기를 함께 진단합니다.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {SOURCES.map((s) => (
                    <span key={s} className="status-pill border border-line bg-navy text-muted">{s}</span>
                  ))}
                </div>
                <Link href="/methodology" className="mt-5 inline-block text-[13.5px] font-bold text-blue-l hover:underline">산식·방법론 자세히 →</Link>
              </div>
              <div className="rounded-2xl border border-line bg-navy/40 p-5">
                <CompositionDiagram score={feat.s} />
              </div>
            </div>
          </div>
        </section>

        {/* 라이프사이클 곡선 — 시그니처 다이어그램 */}
        <section className="mx-auto max-w-6xl px-6 py-8">
          <div className="mb-5 text-center">
            <span className="klai-eyebrow">Lifecycle</span>
            <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">동네는 <span className="hl-mark">이렇게</span> 뜨고 진다</h2>
            <p className="mt-2 text-[14px] text-muted">형성 → 확산 → 절정 → 젠트리 → 쇠퇴. 검색·기사(이야기)가 인구·상권에 선행하는 티핑포인트 구조.</p>
          </div>
          <div className="rounded-[28px] border border-line bg-card2/40 p-6 sm:p-8">
            <NarrativeCurve />
          </div>
        </section>

        {/* 기능 */}
        <section className="mx-auto max-w-6xl px-6 py-14">
          <div className="mb-6">
            <span className="klai-eyebrow">What you get</span>
            <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">하나의 플랫폼, 여섯 가지 진단</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <Link key={f.href} href={f.href} className="lift group flex flex-col rounded-2xl border border-line bg-card2/50 p-6">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue/10 text-xl ring-1 ring-blue/15">{f.icon}</span>
                <div className="mt-4 cat-tag">{f.cat}</div>
                <h3 className="mt-0.5 text-[18px] font-extrabold text-ink group-hover:text-blue-l">{f.title}</h3>
                <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-muted">{f.desc}</p>
                <span className="mt-3 text-[13px] font-bold text-blue-l">바로가기 →</span>
              </Link>
            ))}
          </div>
        </section>

        {/* 뉴스레터 CTA */}
        <section className="mx-auto max-w-5xl px-6 py-16">
          <div className="relative overflow-hidden rounded-[28px] border border-line bg-card2/60 px-8 py-14 text-center">
            <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full opacity-50 blur-3xl" style={{ background: "radial-gradient(circle, var(--blue-l), transparent 70%)" }} />
            <span className="klai-eyebrow relative">Flagtale Weekly</span>
            <h2 className="display-hero relative mt-2 text-3xl sm:text-[2.6rem]">매주 월요일, <span className="hl-mark">전국 동네 변화</span>를 메일로</h2>
            <p className="relative mx-auto mt-3 max-w-xl text-[14px] font-medium text-muted">성장·쇠퇴 동네와 그 이유를 연구자 관점으로 — 무료로 지도부터 둘러보세요.</p>
            <div className="relative mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link href="/reports" className="btn-glow rounded-full bg-amber px-7 py-3.5 text-[15px] font-extrabold text-onaccent">주간 리포트 보기</Link>
              <Link href="/auth" className="rounded-full border border-line bg-navy px-7 py-3.5 text-[15px] font-extrabold text-ink transition-colors hover:border-blue/50">회원가입 →</Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
