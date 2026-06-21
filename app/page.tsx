import Link from "next/link";
import { loadDistricts, loadScores } from "@/lib/data";
import { GRADE_HEX } from "@/lib/constants";
import type { PlaceScore, DistrictProps } from "@/lib/types";
import { SiteFooter } from "@/components/page-shell";
import { NationalScatter, type ScatterPoint } from "@/components/landing/NationalScatter";
import { CountUp } from "@/components/landing/CountUp";
import { Reveal } from "@/components/landing/Reveal";

const SOURCES = ["KOSIS 인구", "네이버 검색·기사", "소진공 상권", "한국부동산원 임대", "한국문화정보원", "나라장터 예산", "VWorld 지오코딩", "서울 생활인구", "카드 매출", "건축HUB"];

// 데이터 → 에디토리얼 헤드라인(careet식 기사 제목 톤)
function hook(name: string, s: PlaceScore, up: boolean): string {
  if (up) {
    if (s.d4 >= s.d2 && s.d4 >= s.d1) return `${name}, 검색·미디어가 먼저 움직였다`;
    if (s.gentriStage <= 1) return `${name}, 저평가 구간에서 뜨는 중`;
    if (s.budgetInflow >= 20) return `${name}, 공공투자가 불 붙인 상권`;
    return `${name}, 상권·인구 동반 상승세`;
  }
  if (s.negativeNarrative) return `${name}, ‘예전 같지 않다’… 식는 신호`;
  if (s.marketVitality === "shrinking") return `${name}, 거래절벽 — 위기 경보`;
  if ((s.popChangeRate || 0) < 0) return `${name}, 인구 빠지며 활력 둔화`;
  return `${name}, 모멘텀 꺾인 국면`;
}

const TYPO_EMOJI: Record<string, string> = { 원도심: "🏙️", 신도시: "🏢", 관광: "🏖️", 대학가: "🎓", 주거: "🏘️", 산업: "🏭", 농산어촌: "🌾", 소멸농산어촌: "🌾" };
const VITALITY_KO: Record<string, string> = { active: "활발", stable: "안정", shrinking: "위축" };

function ArticleCard({ cd, p, s, up, big }: { cd: string; p: DistrictProps; s: PlaceScore; up: boolean; big?: boolean }) {
  const cover = `linear-gradient(135deg, ${GRADE_HEX[s.grade]}, ${GRADE_HEX[s.grade]}26)`;
  const emoji = TYPO_EMOJI[p.typology ?? ""] ?? "📍";
  const meta = p.typology ? `${p.sigungu} · ${p.typology}` : p.sigungu;
  const excerpt = up
    ? `${p.typology || "이 동네"}, 최근 분기 모멘텀 +${s.momentum}. 검색·상권·인식이 함께 오르며 상위권으로 올라서는 중.`
    : `${p.typology || "이 동네"}, 모멘텀 ${s.momentum}. 시장 활력이 ${VITALITY_KO[s.marketVitality] ?? "둔화"}로 돌아서는 신호.`;
  return (
    <Link href={`/diagnose?admCd=${cd}`} className="lift group flex flex-col overflow-hidden rounded-2xl border border-line bg-card2/40">
      <div className="relative aspect-[16/9] w-full overflow-hidden" style={{ background: cover }}>
        <span className="pointer-events-none absolute -right-2 bottom-[-0.5rem] select-none text-[7rem] leading-none opacity-25 mix-blend-soft-light">{emoji}</span>
        <span className="absolute left-3 top-3 status-pill" style={{ background: up ? "var(--amber)" : "rgba(255,255,255,.25)", color: up ? "var(--on-accent)" : "#fff" }}>
          {up ? `📈 유행중 +${s.momentum}` : `📉 식는중 ${s.momentum}`}
        </span>
        <span className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-white/20 text-[12px] text-white">🔖</span>
        <span className="absolute bottom-3 left-4 flex items-end gap-1.5 text-white">
          <span className={`${big ? "text-[3rem]" : "text-[2.2rem]"} font-black leading-none tabular-nums drop-shadow`}>{s.klai}</span>
          <span className="pb-1 text-[12px] font-bold opacity-90">KLAI·{s.grade}</span>
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="cat-tag">{meta}</div>
        <h3 className={`mt-1 font-extrabold leading-snug text-ink group-hover:text-blue-l ${big ? "text-[1.5rem]" : "text-[17px]"}`}>{hook(p.name, s, up)}</h3>
        {big && <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{excerpt}</p>}
        {big && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-navy/50 px-2.5 py-1 text-[11.5px] font-bold text-muted">모멘텀 {up ? "+" : ""}{s.momentum}</span>
            <span className="rounded-full bg-navy/50 px-2.5 py-1 text-[11.5px] font-bold text-muted">시장 {VITALITY_KO[s.marketVitality] ?? "—"}</span>
            <span className="rounded-full bg-navy/50 px-2.5 py-1 text-[11.5px] font-bold text-muted">젠트리 {s.gentriStage}단계</span>
          </div>
        )}
        <div className="mt-auto flex items-center gap-1.5 pt-3 text-[11.5px] text-muted2">
          <span className="font-semibold text-muted">{p.name}</span>
          <span>·</span>
          <span>이번 주 · Flagtale Weekly</span>
        </div>
      </div>
    </Link>
  );
}

export default function LandingPage() {
  const scores = loadScores();
  const districts = loadDistricts();
  const propBy = new Map(districts.features.map((f) => [f.properties.admCd2, f.properties]));
  const rows = Object.entries(scores.byPlace)
    .map(([cd, ser]) => ({ cd, p: propBy.get(cd)!, s: ser[ser.length - 1] }))
    .filter((r) => r.p && r.s);
  const risers = [...rows].sort((a, b) => b.s.momentum - a.s.momentum).slice(0, 10);
  const fallers = [...rows].sort((a, b) => a.s.momentum - b.s.momentum).slice(0, 6);
  const total = districts.features.length;
  const rising = rows.filter((r) => r.s.momentum > 1).length;
  const declining = rows.filter((r) => r.s.momentum < -1).length;
  const feat = risers[0];
  const sideTwo = risers.slice(1, 3);
  const gridSix = risers.slice(3, 9);
  const scatterPoints: ScatterPoint[] = [
    ...risers.map((r) => ({ name: r.p.name, momentum: r.s.momentum, lng: r.p.centroidLng, lat: r.p.centroidLat, kind: "riser" as const })),
    ...fallers.map((r) => ({ name: r.p.name, momentum: r.s.momentum, lng: r.p.centroidLng, lat: r.p.centroidLat, kind: "faller" as const })),
  ];

  return (
    <div className="theme-light relative min-h-screen overflow-hidden bg-navy pt-14 text-ink">
      <div className="deco-bg" aria-hidden />
      <main className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        {/* 상단 인트로(컴팩트) */}
        <div className="flex flex-wrap items-end justify-between gap-3 pt-10 pb-5">
          <div>
            <span className="klai-eyebrow">Local Trend Intelligence</span>
            <h1 className="mt-1.5 text-[1.7rem] font-extrabold tracking-tight sm:text-[2rem]">
              지금 전국에서 <span className="hl-mark">뜨는 동네</span>를 읽다
            </h1>
          </div>
          <Link href="/map" className="hidden shrink-0 rounded-full border border-line bg-card2 px-4 py-2 text-[13px] font-bold text-ink transition-colors hover:border-blue/50 sm:inline-block">지도 전체 탐색 →</Link>
        </div>

        {/* 피처드 — 큰 기사 카드 + 사이드 2 (careet 톱) */}
        <section className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
          <ArticleCard cd={feat.cd} p={feat.p} s={feat.s} up big />
          <div className="grid grid-rows-2 gap-4">
            {sideTwo.map((r) => (
              <ArticleCard key={r.cd} cd={r.cd} p={r.p} s={r.s} up />
            ))}
          </div>
        </section>

        {/* 지금 뜨는 동네 그리드 */}
        <Reveal as="section" className="py-10">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-[1.4rem] font-extrabold tracking-tight sm:text-[1.7rem]">🔥 지금 뜨는 동네</h2>
            <Link href="/reports" className="text-[13px] font-bold text-blue-l hover:underline">주간 리포트 전체 →</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {gridSix.map((r) => (
              <ArticleCard key={r.cd} cd={r.cd} p={r.p} s={r.s} up />
            ))}
          </div>
        </Reveal>

        {/* 식어가는 동네 캐러셀 */}
        <Reveal as="section" className="py-6">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-[1.4rem] font-extrabold tracking-tight sm:text-[1.7rem]">📉 식어가는 동네</h2>
            <span className="text-[12px] font-bold text-muted2">01 / {String(fallers.length).padStart(2, "0")} · 옆으로 →</span>
          </div>
          <div className="snap-row pb-2">
            {fallers.map((r) => (
              <ArticleCard key={r.cd} cd={r.cd} p={r.p} s={r.s} up={false} />
            ))}
          </div>
        </Reveal>

        {/* 전국 한눈에 — 지도 + 카운트업 스탯 */}
        <Reveal as="section" className="py-10">
          <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
            <Link href="/map" className="lift group block overflow-hidden rounded-2xl border border-line bg-card2/40">
              <div className="bg-navy/40 p-3">
                <NationalScatter points={scatterPoints} className="h-[320px] w-full" />
              </div>
              <div className="flex items-center justify-between border-t border-line px-4 py-3">
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
            <div className="grid grid-cols-2 content-center gap-3">
              <Stat to={total} label="분석 행정동" />
              <Stat to={13} label="실데이터 소스" />
              <Stat to={rising} label="상승 동네" />
              <Stat to={declining} label="위기 동네" warn />
            </div>
          </div>
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

        {/* 뉴스레터 signup */}
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

function Stat({ to, label, warn }: { to: number; label: string; warn?: boolean }) {
  return (
    <div className="rounded-2xl border border-line bg-card2/50 px-4 py-5 text-center">
      <CountUp to={to} className={`text-[1.7rem] font-black tracking-tight ${warn ? "text-warn" : "text-blue-l"}`} />
      <div className="mt-1 text-[12px] text-muted2">{label}</div>
    </div>
  );
}
