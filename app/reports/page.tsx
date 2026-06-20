import Link from "next/link";
import type { Metadata } from "next";
import { loadReports } from "@/lib/data";
import { PageShell } from "@/components/page-shell";
import { Pill, ProvisionalBadge } from "@/components/ui";

export const metadata: Metadata = { title: "리포트 아카이브" };

const KINDS = [
  { id: "", label: "전체" },
  { id: "weekly", label: "Flagtale Weekly" },
  { id: "annual", label: "KLAI Annual" },
];

export default function ReportsPage({ searchParams }: { searchParams: { kind?: string } }) {
  const kind = searchParams.kind ?? "";
  let reports = loadReports();
  if (kind) reports = reports.filter((r) => r.kind === kind);
  reports = [...reports].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));

  return (
    <PageShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="klai-eyebrow">Reports</span>
          <h1 className="mt-1 text-3xl font-black">리포트 아카이브</h1>
          <p className="mt-1 text-[14px] text-muted">
            주간 <b className="text-ink">Flagtale Weekly</b> · 연간 <b className="text-ink">KLAI Annual</b> — 자동 발행되어 쌓입니다.
          </p>
        </div>
        <div className="flex gap-1.5">
          {KINDS.map((k) => (
            <Link
              key={k.id}
              href={k.id ? `/reports?kind=${k.id}` : "/reports"}
              className={`rounded-lg px-3 py-1.5 text-[13px] font-semibold ${
                kind === k.id ? "bg-blue text-white" : "border border-line text-muted hover:bg-card2 hover:text-ink"
              }`}
            >
              {k.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {reports.map((r) => (
          <Link key={r.id} href={`/reports/${r.slug}`} className="klai-panel group relative overflow-hidden p-5 transition-colors hover:border-blue">
            <span
              className="absolute left-0 top-0 h-full w-1"
              style={{
                background: r.kind === "annual" ? "var(--amber)" : "var(--blue-l)",
                boxShadow: `0 0 12px ${r.kind === "annual" ? "var(--amber)" : "var(--blue-l)"}`,
              }}
            />
            <div className="flex items-center justify-between">
              <Pill tone={r.kind === "annual" ? "amber" : "blue"}>
                {r.kind === "annual" ? "🏆 KLAI Annual" : "📰 Flagtale Weekly"}
              </Pill>
              <span className="text-[12px] text-muted2">{r.publishedAt}</span>
            </div>
            <h2 className="mt-3 text-lg font-extrabold text-ink group-hover:text-blue-l">{r.title}</h2>
            <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted">{r.summary}</p>
            <div className="mt-3 flex items-center justify-between">
              <ProvisionalBadge />
              <span className="text-[13px] font-semibold text-blue-l opacity-0 transition-opacity group-hover:opacity-100">
                열람 →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
