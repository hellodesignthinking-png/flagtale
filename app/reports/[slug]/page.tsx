import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getReport, loadReports } from "@/lib/data";
import { PageShell } from "@/components/page-shell";
import { WeeklyTemplate } from "@/components/report/WeeklyTemplate";
import { AnnualTemplate } from "@/components/report/AnnualTemplate";

export function generateStaticParams() {
  return loadReports().map((r) => ({ slug: r.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const r = getReport(params.slug);
  return { title: r?.title ?? "리포트" };
}

export default function ReportViewer({ params }: { params: { slug: string } }) {
  const report = getReport(params.slug);
  if (!report) notFound();

  return (
    <PageShell width="narrow">
      <div className="mb-5 text-[13px] text-muted2">
        <Link href="/reports" className="hover:text-ink">
          ← 리포트 아카이브
        </Link>
      </div>
      {report.kind === "annual" ? <AnnualTemplate report={report} /> : <WeeklyTemplate report={report} />}
    </PageShell>
  );
}
