import Link from "next/link";
import { loadDistricts } from "@/lib/data";
import { SiteFooter } from "@/components/page-shell";

export const dynamic = "force-static";

const FEATURES = [
  { icon: "🗺️", title: "매력도 지도", desc: "전국 행정동 choropleth + 9개 레이어·시간 슬라이더로 어디가 뜨고 지는지 한눈에.", href: "/map", cta: "지도 탐색" },
  { icon: "🔎", title: "지번 진단", desc: "주소·지번을 입력하면 방향·위기·전략 + 2016~2026 장기 변화를 종합 리포트로.", href: "/diagnose", cta: "진단하기" },
  { icon: "🏪", title: "브랜드 진단", desc: "네이버 등록 매장을 중심으로 경쟁력·성장·위기(재개발 포함)를 분석.", href: "/brand", cta: "매장 분석" },
  { icon: "📰", title: "주간 리포트", desc: "매주 전국에서 어떤 동네가 왜 성장·쇠퇴하는지 연구자 관점으로 자동 발행.", href: "/reports", cta: "리포트 보기" },
  { icon: "📡", title: "현장 리포트", desc: "데이터로 못 잡는 객층·회전율·분위기를 현장 사람들이 보강하는 휴먼 센서망.", href: "/contribute", cta: "제보하기" },
  { icon: "🏛️", title: "기관 대시보드", desc: "관할 모니터링·경보 인박스·정책 What-if·CSV/API. 지자체·AMC·VC용.", href: "/dashboard", cta: "대시보드" },
];

const STEPS = [
  { n: "01", t: "실데이터 수집", d: "KOSIS 인구·네이버 검색/기사·소진공 상권·부동산원 임대·문화정보원 등 13개 소스를 행정동 단위로 집계." },
  { n: "02", t: "KLAI 4축 합성", d: "인구·상권·공간·인식 4축을 가중 합성해 0~100 매력도 점수 + 모멘텀·젠트리·소멸 위기를 산출." },
  { n: "03", t: "진단·리포트 발행", d: "지도·동/매장 리포트·주간 웹진·PDF로 ‘왜 뜨고 지는지’를 설명. 현장·결제까지 연결." },
];

const STATS = [
  { v: "3,554", l: "분석 행정동" },
  { v: "13", l: "실데이터 소스" },
  { v: "4축", l: "KLAI 지수" },
  { v: "주간", l: "자동 리포트" },
];

export default function LandingPage() {
  const total = loadDistricts().features.length;

  return (
    <div className="theme-light relative min-h-screen overflow-hidden bg-navy pt-14 text-ink">
      <div className="deco-bg" aria-hidden />
      <main className="relative z-10">
        {/* HERO */}
        <section className="mx-auto max-w-5xl px-6 pb-14 pt-20 text-center sm:pt-28">
          <span className="klai-eyebrow fade-up inline-block">Local Intelligence Platform</span>
          <h1 className="fade-up mt-4 text-[2.4rem] font-black leading-[1.08] tracking-tight sm:text-6xl">
            동네의 <span className="gradient-text">매력도</span>를<br className="hidden sm:block" /> 데이터로 진단합니다
          </h1>
          <p className="fade-up mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-muted sm:text-[17px]">
            전국 {total.toLocaleString()}개 행정동과 로컬 매장의 활력·성장·위기를 13개 실데이터로 진단하고,
            <b className="text-ink"> 왜 뜨고 왜 지는지</b>를 연구자 관점으로 설명하는 로컬 인텔리전스 플랫폼.
          </p>
          <div className="fade-up mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/map" className="btn-glow rounded-xl bg-amber px-6 py-3 text-[15px] font-bold text-white">
              🗺️ 매력도 지도 탐색
            </Link>
            <Link href="/diagnose" className="rounded-xl border border-line bg-card2 px-6 py-3 text-[15px] font-bold text-ink transition-colors hover:border-blue/50">
              지번 진단 시작 →
            </Link>
          </div>

          {/* 신뢰 스탯 스트립 */}
          <div className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.l} className="rounded-2xl border border-line bg-card2/60 px-4 py-4">
                <div className="text-2xl font-black tracking-tight text-blue-l">{s.v}</div>
                <div className="mt-1 text-[12px] text-muted2">{s.l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 기능 */}
        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="mb-8 text-center">
            <span className="klai-eyebrow">Features</span>
            <h2 className="mt-2 text-3xl font-black tracking-tight">하나의 플랫폼, 여섯 가지 진단</h2>
            <p className="mt-2 text-[14px] text-muted">시민·소상공인·창업자·지자체·투자자까지 — 로컬을 보는 모든 관점.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <Link key={f.href} href={f.href} className="lift group klai-panel flex flex-col p-6">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue/10 text-xl ring-1 ring-blue/20">{f.icon}</span>
                <h3 className="mt-4 text-[17px] font-extrabold text-ink">{f.title}</h3>
                <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-muted">{f.desc}</p>
                <span className="mt-4 text-[13px] font-bold text-blue-l">{f.cta} →</span>
              </Link>
            ))}
          </div>
        </section>

        {/* 작동 방식 */}
        <section className="mx-auto max-w-5xl px-6 py-16">
          <div className="mb-8 text-center">
            <span className="klai-eyebrow">How it works</span>
            <h2 className="mt-2 text-3xl font-black tracking-tight">데이터가 진단이 되기까지</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.n} className="relative klai-panel p-6">
                <div className="text-[13px] font-black text-blue-l">{s.n}</div>
                <h3 className="mt-1.5 text-[16px] font-extrabold text-ink">{s.t}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted">{s.d}</p>
                {i < STEPS.length - 1 && <span className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-xl text-muted2 md:block">→</span>}
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link href="/methodology" className="text-[13.5px] font-bold text-blue-l hover:underline">KLAI 산식·방법론 자세히 보기 →</Link>
          </div>
        </section>

        {/* 최종 CTA */}
        <section className="mx-auto max-w-5xl px-6 py-16">
          <div className="gradient-border relative overflow-hidden rounded-3xl bg-card2/60 px-8 py-14 text-center">
            <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full opacity-50 blur-3xl" style={{ background: "radial-gradient(circle, var(--blue-l), transparent 70%)" }} />
            <h2 className="relative text-3xl font-black tracking-tight sm:text-4xl">우리 동네는 지금 뜨고 있을까?</h2>
            <p className="relative mx-auto mt-3 max-w-xl text-[14px] text-muted">
              주소·지번·매장명만 입력하면 방향·위기·전략을 바로 확인할 수 있습니다. 무료로 지도부터 둘러보세요.
            </p>
            <div className="relative mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link href="/map" className="btn-glow rounded-xl bg-amber px-6 py-3 text-[15px] font-bold text-white">매력도 지도 탐색</Link>
              <Link href="/brand" className="rounded-xl border border-line bg-navy px-6 py-3 text-[15px] font-bold text-ink transition-colors hover:border-blue/50">브랜드 진단 →</Link>
            </div>
            <p className="relative mt-5 text-[11px] text-muted2">개념 검증(MVP) · 샘플·잠정 데이터 · 실데이터 커버리지는 각 화면에 표기</p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
