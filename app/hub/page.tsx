import type { Metadata } from "next";
import Link from "next/link";
import { loadCreators, loadTours, loadSpots } from "@/lib/flagtale";
import { SiteFooter } from "@/components/page-shell";

export const metadata: Metadata = { title: "허브 · secondwind 공간 시너지" };

const STAGES = [
  { n: 1, icon: "🔗", title: "거점 연결", desc: "secondwind 공간을 베이스캠프로 묶어, 크리에이터·투어·스테이를 한 거점에서 연결합니다.", points: ["거점 스케줄러", "베이스캠프 네트워크", "지역 간 송객"] },
  { n: 2, icon: "🛍", title: "팝업 스토어", desc: "로컬 크리에이터의 굿즈·상품을 거점 매대에 입점시켜 오프라인 유통을 시뮬레이션합니다.", points: ["가상 매대 분배", "위탁 판매", "정산 리포트"] },
  { n: 3, icon: "💻", title: "워케이션", desc: "스테이 + 기간 + 투어를 묶어 워케이션 패키지를 구성하고 실시간 견적을 냅니다.", points: ["패키지 빌더", "실시간 견적", "우선 예약"] },
];

export default function HubPage() {
  const creators = loadCreators().length;
  const tours = loadTours().length;
  const cities = new Set(loadSpots().map((s) => s.region)).size;
  const stats = [
    { v: "1,247", label: "누적 깃발" },
    { v: "342", label: "투어 참여" },
    { v: String(creators), label: "크리에이터" },
    { v: String(cities), label: "연결 도시" },
  ];

  return (
    <div className="theme-light relative min-h-screen overflow-hidden bg-navy pt-14 text-ink">
      <div className="deco-bg" aria-hidden />
      <main className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        <section className="pt-12 pb-2 sm:pt-14">
          <span className="klai-eyebrow inline-flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-amber" style={{ boxShadow: "0 0 0 4px rgba(217,242,30,.3)" }} />
            secondwind Hub · 공간 연계 시너지
          </span>
          <h1 className="mt-3.5 font-display text-[clamp(34px,5.4vw,56px)] font-black leading-[1.05] tracking-[-0.035em]">
            공간을 잇고, <span className="hl-mark">로컬을 확장</span>하다
          </h1>
          <p className="mt-4 max-w-[600px] text-[16px] text-muted">
            secondwind 거점 네트워크로 크리에이터·투어·스테이·상품을 연결합니다. 거점 연결 → 팝업 유통 → 워케이션까지 한 흐름으로.
          </p>
          <div className="mt-6 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-[20px] border-[1.5px] border-line bg-card px-4 py-4 text-center">
                <div className="font-display text-[26px] font-black tabular-nums leading-none text-ink">{s.v}</div>
                <div className="mt-1.5 text-[11.5px] font-semibold text-muted2">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 3단계 시너지 */}
        <section className="py-7">
          <div className="grid gap-4 lg:grid-cols-3">
            {STAGES.map((s) => (
              <div key={s.n} className="flex flex-col rounded-[24px] border-[1.5px] border-line bg-card p-6">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-11 w-11 place-items-center rounded-[14px] bg-amber text-[20px]">{s.icon}</span>
                  <div>
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-blue-l">Step {s.n}</div>
                    <h2 className="font-display text-[19px] font-black tracking-[-0.02em] text-ink">{s.title}</h2>
                  </div>
                </div>
                <p className="mt-3 text-[13.5px] leading-relaxed text-muted">{s.desc}</p>
                <ul className="mt-3 space-y-1.5">
                  {s.points.map((p) => (
                    <li key={p} className="flex gap-2 text-[12.5px] font-semibold text-muted">
                      <span className="text-grade-b">›</span>{p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-7">
          <div className="relative overflow-hidden rounded-[28px] bg-amber px-6 py-12 text-center sm:px-8">
            <div className="pointer-events-none absolute -bottom-10 -right-8 select-none text-[180px] leading-none opacity-[0.12]" style={{ transform: "rotate(-8deg)" }} aria-hidden>🚩</div>
            <span className="relative font-display text-[12px] font-extrabold uppercase tracking-[0.24em]" style={{ color: "#2b3d0a" }}>Partner with secondwind</span>
            <h2 className="relative mt-2.5 font-display text-[clamp(24px,4vw,36px)] font-black tracking-[-0.03em] text-onaccent">공간이 있다면, 함께 로컬을 만들어요</h2>
            <p className="relative mx-auto mt-3 max-w-md text-[14px] font-medium" style={{ color: "#2b3d0a" }}>거점 입점·팝업·워케이션 제휴 문의 — 인터랙티브 시뮬레이터는 곧 공개됩니다.</p>
            <Link href="/auth" className="relative mt-6 inline-flex items-center rounded-full bg-ink px-7 py-3.5 text-[15px] font-extrabold text-white transition-transform hover:scale-[1.02]">제휴 문의하기 →</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
