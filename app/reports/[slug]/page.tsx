import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getReport } from "@/lib/data";
import { computeWeekly, parseWeekSlug } from "@/lib/weekly";
import type { Report } from "@/lib/types";
import { PageShell } from "@/components/page-shell";
import { WeeklyTemplate } from "@/components/report/WeeklyTemplate";
import { AnnualTemplate } from "@/components/report/AnnualTemplate";

export const dynamic = "force-dynamic"; // 주간 슬러그는 주차별로 동적 계산

// flagtale-weekly-YYYY-wNN → 데이터에서 계산 / 그 외(annual) → 시드 아카이브
function resolveReport(slug: string): Report | null {
  const wk = parseWeekSlug(slug);
  if (wk) return computeWeekly(wk.year, wk.week);
  return getReport(slug);
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const r = resolveReport(params.slug);
  return { title: r?.title ?? "리포트" };
}

export default function ReportViewer({ params }: { params: { slug: string } }) {
  const report = resolveReport(params.slug);
  if (!report) notFound();

  return (
    <PageShell width={report.kind === "weekly" ? "default" : "narrow"}>
      <div className="mb-5 text-[13px] text-muted2">
        <Link href="/reports" className="hover:text-ink">
          ← 리포트 아카이브
        </Link>
      </div>
      {report.kind === "annual" ? <AnnualTemplate report={report} /> : <WeeklyTemplate report={report} />}
    </PageShell>
  );
}
