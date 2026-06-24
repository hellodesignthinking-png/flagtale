import Link from "next/link";
import type { Metadata } from "next";
import { loadReports } from "@/lib/data";
import { listRecentWeeklies } from "@/lib/weekly";
import { PageShell } from "@/components/page-shell";
import { ProvisionalBadge } from "@/components/ui";

export const metadata: Metadata = { title: "리포트 아카이브" };
export const dynamic = "force-dynamic"; // 매 요청 시 현재 주차 기준으로 주간 리포트 자동 산출

const KINDS = [
  { id: "", label: "전체" },
  { id: "weekly", label: "Flagtale Weekly" },
  { id: "annual", label: "Flagtale Annual" },
];

type Nat = { avgKlai: number; risingCount: number; decliningCount: number };
const natOf = (r: { blocks?: Record<string, unknown> }) => (r.blocks?.national as Nat | undefined) ?? undefined;
const isAnnual = (k: string) => k === "annual";
function gradOf(kind: string): string {
  return isAnnual(kind)
    ? "linear-gradient(135deg, var(--gC), var(--gD))"
    : "linear-gradient(135deg, var(--blue-l), color-mix(in srgb, var(--amber) 70%, var(--blue-l)))";
}

export default function ReportsPage({ searchParams }: { searchParams: { kind?: string } }) {
  const kind = searchParams.kind ?? "";
  const annuals = loadReports().filter((r) => r.kind === "annual");
  const weeklies = listRecentWeeklies(12, new Date());
  let reports = [...weeklies, ...annuals].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
  if (kind) reports = reports.filter((r) => r.kind === kind);
  const featured = reports[0];
  const rest = reports.slice(1);

  return (
    <PageShell>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="klai-eyebrow">Reports</span>
          <h1 className="display-hero mt-2 font-display font-black tracking-[-0.03em] text-[clamp(28px,4vw,40px)]">
            전국 동네 변화, <span className="hl-mark">매주</span> 발행
          </h1>
          <p className="mt-2 text-[14px] text-muted">
            주간 <b className="text-ink">Flagtale Weekly</b> · 연간 <b className="text-ink">Flagtale Annual</b> — 연구자 관점으로 자동 발행되어 쌓입니다.
          </p>
        </div>
        <div className="flex gap-1.5">
          {KINDS.map((k) => (
            <Link
              key={k.id}
              href={k.id ? `/reports?kind=${k.id}` : "/reports"}
              className={`rounded-full px-3.5 py-1.5 text-[13px] font-bold transition-colors ${
                kind === k.id ? "bg-amber text-onaccent" : "border border-line text-muted hover:bg-card2 hover:text-ink"
              }`}
            >
              {k.label}
            </Link>
          ))}
        </div>
      </div>

      {/* 피처드 — 최신 리포트(careet 대형 카드) */}
      {featured && (
        <Link href={`/reports/${featured.slug}`} className="lift group mb-6 block overflow-hidden rounded-[24px] border-[1.5px] border-line bg-card2/40">
          <div className="grid md:grid-cols-[1.05fr_1fr]">
            <div className="relative flex min-h-[210px] flex-col justify-between overflow-hidden p-7 text-white" style={{ background: gradOf(featured.kind) }}>
              <div className="flex items-center justify-between">
                <span className="status-pill" style={{ background: "rgba(255,255,255,.22)" }}>{isAnnual(featured.kind) ? "🏆 ANNUAL" : "📰 최신호"}</span>
                <span className="text-[12px] font-bold text-white/85">{featured.publishedAt}</span>
              </div>
              <div>
                <div className="text-[13px] font-bold text-white/80">{featured.period}</div>
                {(() => {
                  const sp = (t: string) => <span className="status-pill" style={{ background: "rgba(255,255,255,.18)" }}>{t}</span>;
                  // 연간은 blocks.national이 없음 → ranking·avgKlai·gentriCount로 KPI 노출(이전엔 빈 카드)
                  if (isAnnual(featured.kind)) {
                    const b = featured.blocks as { avgKlai?: number; ranking?: unknown[]; gentriCount?: number } | undefined;
                    return b ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {b.avgKlai != null && sp(`평균 KLAI ${b.avgKlai}`)}
                        {!!b.ranking?.length && sp(`🏅 매력동네 ${b.ranking.length}`)}
                        {b.gentriCount != null && sp(`⚠ 젠트리 경보 ${b.gentriCount}`)}
                      </div>
                    ) : null;
                  }
                  const n = natOf(featured);
                  return n ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {sp(`평균 KLAI ${n.avgKlai}`)}
                      {sp(`▲ 상승 ${n.risingCount.toLocaleString()}`)}
                      {sp(`▼ 하락 ${n.decliningCount.toLocaleString()}`)}
                    </div>
                  ) : null;
                })()}
              </div>
            </div>
            <div className="flex flex-col p-7">
              <div className="cat-tag">{isAnnual(featured.kind) ? "FLAGTALE ANNUAL" : "FLAGTALE WEEKLY"}</div>
              <h2 className="mt-1 font-display text-2xl font-black leading-tight tracking-[-0.03em] text-ink group-hover:text-blue-l">{featured.title}</h2>
              <p className="mt-2 line-clamp-3 flex-1 text-[13.5px] leading-relaxed text-muted">{featured.summary}</p>
              <div className="mt-4 flex items-center justify-between">
                <ProvisionalBadge />
                <span className="text-[14px] font-bold text-blue-l">리포트 열람 →</span>
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* 그리드 — careet 콘텐츠 카드 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rest.map((r) => {
          const n = natOf(r);
          return (
            <Link key={r.id} href={`/reports/${r.slug}`} className="lift group flex flex-col overflow-hidden rounded-[20px] border-[1.5px] border-line bg-card2/40">
              <div className="relative flex h-20 items-end justify-between p-3.5 text-white" style={{ background: gradOf(r.kind) }}>
                <span className="text-[15px] font-black">{r.period}</span>
                <span className="text-[11px] font-bold text-white/85">{isAnnual(r.kind) ? "🏆 연간" : "📰 주간"}</span>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <div className="cat-tag">{isAnnual(r.kind) ? "FLAGTALE ANNUAL" : "FLAGTALE WEEKLY"}</div>
                <h3 className="mt-1 line-clamp-2 font-display text-[15px] font-extrabold tracking-[-0.03em] text-ink group-hover:text-blue-l">{r.title}</h3>
                <p className="mt-1.5 line-clamp-2 flex-1 text-[12.5px] leading-relaxed text-muted">{r.summary}</p>
                {n && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5 text-[10.5px]">
                    <span className="status-pill bg-card2 text-muted">평균 {n.avgKlai}</span>
                    <span className="status-pill text-grade-b" style={{ background: "color-mix(in srgb, var(--gB) 14%, transparent)" }}>▲ {n.risingCount.toLocaleString()}</span>
                    <span className="status-pill text-warn" style={{ background: "color-mix(in srgb, var(--warn) 12%, transparent)" }}>▼ {n.decliningCount.toLocaleString()}</span>
                  </div>
                )}
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="text-[10.5px] text-muted2">{r.publishedAt}</span>
                  <span className="text-[12px] font-bold text-blue-l opacity-0 transition-opacity group-hover:opacity-100">열람 →</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </PageShell>
  );
}
