import { NextRequest, NextResponse } from "next/server";
import { getReport } from "@/lib/data";
import { renderPdf } from "@/lib/pdf/render";
import { reportPdfHtml } from "@/lib/pdf/template";

// 서버 PDF (스펙 §10·§15). 권한자 한정 다운로드 — 여기서는 주간/연간 공개.
export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const report = getReport(params.slug);
  if (!report) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const pdf = await renderPdf(reportPdfHtml(report));
  if (!pdf) {
    return NextResponse.json(
      {
        error: "pdf_disabled",
        message:
          "서버 PDF 미활성. `npm i -D playwright && npx playwright install chromium` 후 ENABLE_PDF=1 설정 시 생성됩니다.",
      },
      { status: 501 }
    );
  }
  return new NextResponse(pdf as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${report.slug}.pdf"`,
    },
  });
}
