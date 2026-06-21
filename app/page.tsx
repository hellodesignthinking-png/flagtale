import Link from "next/link";
import { loadDistricts, loadScores } from "@/lib/data";
import { GRADE_HEX } from "@/lib/constants";
import { SiteFooter } from "@/components/page-shell";
import { CompositionDiagram } from "@/components/charts/CompositionDiagram";
import { NarrativeCurve } from "@/components/charts/NarrativeCurve";
import { NationalScatter, type ScatterPoint } from "@/components/landing/NationalScatter";
import { CountUp } from "@/components/landing/CountUp";
import { Reveal } from "@/components/landing/Reveal";

const SOURCES = ["KOSIS 인구", "네이버 검색·기사", "소진공 상권", "한국부동산원 임대", "한국문화정보원", "나라장터 예산", "VWorld 지오코딩", "서울 생활인구", "카드 매출", "건축HUB"];
const FEATURES = [
  { icon: "🗺️", title: "매력도 지도", desc: "9개 레이어·시간 슬라이더", href: "/map" },
  { icon: "🔎", title: "지번 진단", desc: "방향·위기·전략 리포트", href: "/diagnose" },
  { icon: "🏪", title: "브랜드 진단", desc: "매장 중심 경쟁력·위기", href: "/brand" },
  { icon: "🏛️", title: "기관 대시보드", desc: "경보·정책·API", href: "/dashboard" },
];

export default function LandingPage() {
  const scores = loadScores();
  const districts = loadDistricts();
  const propBy = new Map(districts.features.map((f) => [f.properties.admCd2, f.properties]));
  const rows = Object.entries(scores.byPlace)
    .map(([cd, ser]) => ({ cd, p: propBy.get(cd)!, s: ser[ser.length - 1] }))
    .filter((r) => r.p && r.s);
  const risers = [...rows].sort((a, b) => b.s.momentum - a.s.momentum).slice(0, 8);
  const fallers = [...rows].sort((a, b) => a.s.momentum - b.s.momentum).slice(0, 6);
  const total = districts.features.length;
  const rising = rows.filter((r) => r.s.momentum > 1).length;
  const declining = rows.filter((r) => r.s.momentum < -1).length;
  const feat = risers[0];
  const side = risers.slice(0, 2);
  const grid = risers.slice(2, 8);
  const scatterPoints: ScatterPoint[] = [
    ...risers.map((r) => ({ name: r.p.name, momentum: r.s.momentum, lng: r.p.centroidLng, lat: r.p.centroidLat, kind: "riser" as const })),
    ...fallers.map((r) => ({ name: r.p.name, momentum: r.s.momentum, lng: r.p.centroidLng, lat: r.p.centroidLat, kind: "faller" as const })),
  ];

  return (
    <div className="theme-light relative min-h-screen overflow-hidden bg-navy pt-14 text-ink">
      <div className="deco-bg" aria-hidden />
      <main className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        {/* 콘텐츠 우선(careet) — 큰 슬로건 히어로 대신 피처드 먼저 */}
        <section className="pt-10 pb-6 sm:pt-12">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <span className="klai-eyebrow">Now Trending · 동네 트렌드 인텔리전스</span>
              <h1 className="mt-2 text-[1.8rem] font-extrabold leading-tight tracking-tight sm:text-[2.3rem]">
                지금 전국에서 <span className="hl-mark">뜨는 동네</span>
              </h1>
              <p className="mt-1.5 text-[14px] text-muted">{total.toLocaleString()}개 행정동을 13개 실데이터로 진단 — 어디가 왜 뜨고 지는지.</p>
            </div>
            <Link href="/map" className="hidden shrink-0 rounded-full border border-line bg-card2 px-4 py-2 text-[13px] font-bold text-ink transition-colors hover:border-blue/50 sm:inline-block">
              지도 전체 탐색 →
            </Link>
          </div>

          {/* 피처드: 전국 미니 지도(핀) + 사이드 콘텐츠 카드 */}
          <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
            <Link href="/map" className="lift group block overflow-hidden rounded-2xl border border-line bg-card2/40">
              <div className="bg-navy/40 p-3">
                <NationalScatter points={scatterPoints} className="h-[330px] w-full" />
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
                <div className="min-w-0">
                  <div className="cat-tag">NATIONAL MAP</div>
                  <div className="truncate text-[15px] font-extrabold text-ink group-hover:text-blue-l">전국 매력도 지도 · 인터랙티브 →</div>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <span className="status-pill" style={{ background: "color-mix(in srgb, var(--gB) 16%, transparent)", color: "var(--gB)" }}>▲ {rising.toLocaleString()}</span>
                  <span className="status-pill border border-warn/40 text-warn">▼ {declining.toLocaleString()}</span>
                </div>
              </div>
            </Link>
            <div className="grid grid-rows-2 gap-4">
              {side.map((r) => (
                <Link key={r.cd} href={`/diagnose?admCd=${r.cd}`} className="lift group flex overflow-hidden rounded-2xl border border-line bg-card2/40">
                  <div className="relative w-28 shrink-0" style={{ background: `linear-gradient(135deg, ${GRADE_HEX[r.s.grade]}, ${GRADE_HEX[r.s.grade]}33)` }}>
                    <span className="absolute bottom-2 left-2.5 text-2xl font-black text-white/95 tabular-nums">{r.s.klai}</span>
                  </div>
                  <div className="flex min-w-0 flex-col justify-center p-3.5">
                    <span className="status-pill self-start" style={{ background: "var(--amber)", color: "var(--on-accent)" }}>📈 유행중 +{r.s.momentum}</span>
                    <div className="mt-1.5 cat-tag">{r.p.sigungu}</div>
                    <div className="truncate text-[16px] font-extrabold text-ink group-hover:text-blue-l">{r.p.name}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 데이터 소스 마퀴 (③) */}
        <section className="py-4">
          <div className="marquee-mask overflow-hidden">
            <div className="marquee-track">
              {[...SOURCES, ...SOURCES].map((s, i) => (
                <span key={i} className="rounded-full border border-line bg-card2/60 px-3.5 py-1.5 text-[12px] font-semibold text-muted">{s}</span>
              ))}
            </div>
          </div>
        </section>

        {/* 신뢰 스탯 — 카운트업(②) */}
        <Reveal as="section" className="py-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat to={total} label="분석 행정동" />
            <Stat to={13} label="실데이터 소스" />
            <Stat to={rising} label="상승 동네" />
            <Stat to={declining} label="위기 동네" warn />
          </div>
        </Reveal>

        {/* 이주의 뜨는 동네 — careet 콘텐츠 그리드 */}
        <Reveal as="section" className="py-8">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-[1.5rem] font-extrabold tracking-tight sm:text-[1.8rem]">📈 이주의 뜨는 동네</h2>
            <Link href="/reports" className="text-[13px] font-bold text-blue-l hover:underline">주간 리포트 →</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {grid.map((r) => (
              <Link key={r.cd} href={`/diagnose?admCd=${r.cd}`} className="lift group overflow-hidden rounded-2xl border border-line bg-card2/40">
                <div className="relative aspect-[16/7] overflow-hidden" style={{ background: `linear-gradient(135deg, ${GRADE_HEX[r.s.grade]}, ${GRADE_HEX[r.s.grade]}22)` }}>
                  <span className="absolute right-3 top-3 status-pill" style={{ background: "rgba(255,255,255,.22)", color: "#fff" }}>📈 유행중 +{r.s.momentum}</span>
                  <span className="absolute bottom-2 left-4 text-[2rem] font-black leading-none text-white/95 tabular-nums">{r.s.klai}</span>
                  <span className="absolute bottom-3 right-3 text-[11px] font-bold text-white/80">{r.s.grade}등급</span>
                </div>
                <div className="p-4">
                  <div className="cat-tag">{r.p.sigungu} · {r.p.typology}</div>
                  <div className="mt-1 text-[17px] font-extrabold text-ink group-hover:text-blue-l">{r.p.name}</div>
                  <div className="mt-1 text-[12.5px] text-muted">검색·상권·인식이 함께 오르는 상승 국면</div>
                </div>
              </Link>
            ))}
          </div>
        </Reveal>

        {/* 식는 동네 캐러셀 (01/0N) — careet식 가로 스크롤 */}
        <Reveal as="section" className="py-8">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-[1.5rem] font-extrabold tracking-tight sm:text-[1.8rem]">📉 식는 동네 · 위기 신호</h2>
            <span className="text-[12px] font-bold text-muted2">01 / {String(fallers.length).padStart(2, "0")} · 옆으로 스크롤</span>
          </div>
          <div className="snap-row pb-2">
            {fallers.map((r) => (
              <Link key={r.cd} href={`/diagnose?admCd=${r.cd}`} className="lift group overflow-hidden rounded-2xl border border-line bg-card2/40">
                <div className="flex items-center gap-3 p-4">
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl text-xl font-black text-white" style={{ background: GRADE_HEX[r.s.grade] }}>{r.s.grade}</span>
                  <div className="min-w-0">
                    <div className="cat-tag">{r.p.sigungu}</div>
                    <div className="truncate text-[16px] font-extrabold text-ink group-hover:text-blue-l">{r.p.name}</div>
                    <span className="status-pill mt-0.5 border border-warn/40 text-warn">📉 {r.s.momentum} · KLAI {r.s.klai}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Reveal>

        {/* 작동 원리 + 라이프사이클 — 설명 모듈(다이어그램) */}
        <Reveal as="section" className="py-10">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-line bg-card2/40 p-6">
              <span className="klai-eyebrow">How KLAI works</span>
              <h3 className="mt-1.5 text-[1.3rem] font-extrabold">4개 축을 합쳐 <span className="hl-mark">하나의 점수</span>로</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">인구·상권·공간·인식을 가중 합성(상권·서사 30%). 변화 속도(모멘텀)·위기까지.</p>
              <div className="mt-4 rounded-xl border border-line bg-navy/40 p-4">
                <CompositionDiagram score={feat.s} />
              </div>
              <Link href="/methodology" className="mt-3 inline-block text-[13px] font-bold text-blue-l hover:underline">산식·방법론 →</Link>
            </div>
            <div className="rounded-2xl border border-line bg-card2/40 p-6">
              <span className="klai-eyebrow">Lifecycle</span>
              <h3 className="mt-1.5 text-[1.3rem] font-extrabold">동네는 <span className="hl-mark">이렇게</span> 뜨고 진다</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">형성 → 확산 → 절정 → 젠트리 → 쇠퇴. 이야기(검색·기사)가 인구·상권에 선행.</p>
              <div className="mt-4 rounded-xl border border-line bg-navy/40 p-4">
                <NarrativeCurve />
              </div>
            </div>
          </div>
        </Reveal>

        {/* 활용 — 컴팩트 4칩 (careet 큐레이션 모듈) */}
        <Reveal as="section" className="py-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {FEATURES.map((f) => (
              <Link key={f.href} href={f.href} className="lift group rounded-2xl border border-line bg-card2/40 p-5">
                <span className="text-2xl">{f.icon}</span>
                <div className="mt-2 text-[15px] font-extrabold text-ink group-hover:text-blue-l">{f.title}</div>
                <div className="mt-0.5 text-[12px] text-muted">{f.desc}</div>
              </Link>
            ))}
          </div>
        </Reveal>

        {/* 뉴스레터 signup (careet 시그니처) */}
        <Reveal as="section" className="py-12">
          <div className="relative overflow-hidden rounded-[28px] border border-line bg-card2/60 px-6 py-12 text-center sm:px-10">
            <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full opacity-50 blur-3xl" style={{ background: "radial-gradient(circle, var(--blue-l), transparent 70%)" }} />
            <span className="klai-eyebrow relative">Flagtale Weekly</span>
            <h2 className="relative mt-2 text-[1.7rem] font-extrabold tracking-tight sm:text-[2.1rem]">
              트렌드를 <span className="hl-mark">먼저</span> 읽으세요
            </h2>
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

function Stat({ to, label, warn }: { to: number; label: string; warn?: boolean }) {
  return (
    <div className="rounded-2xl border border-line bg-card2/50 px-4 py-4 text-center">
      <CountUp to={to} className={`text-[1.7rem] font-black tracking-tight ${warn ? "text-warn" : "text-blue-l"}`} />
      <div className="mt-1 text-[12px] text-muted2">{label}</div>
    </div>
  );
}
