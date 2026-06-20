import { NextRequest, NextResponse } from "next/server";
import { getPlace, geocodeToPlace } from "@/lib/data";
import { geocodeToDistrict } from "@/lib/geocode";
import { getUser } from "@/lib/supabase/server";
import { isSupabaseEnabled } from "@/lib/config";
import { renderPdf } from "@/lib/pdf/render";
import { parcelPdfHtml } from "@/lib/pdf/template";

// 유료 지번 진단 PDF (권한 필요). 스펙 §10.3·§11·§15.
export async function POST(req: NextRequest) {
  let body: { admCd?: string; address?: string; demoPaid?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    /* empty */
  }

  // 권한 확인: 인증 활성 시 로그인 필수(+구매는 결제 반영으로). 목업이면 demoPaid 게이트.
  if (isSupabaseEnabled) {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    // TODO: ReportPurchase/크레딧 확인 후 차감 (Supabase)
  } else if (!body.demoPaid) {
    return NextResponse.json({ error: "payment_required", message: "결제 후 PDF 다운로드 가능" }, { status: 402 });
  }

  let place = body.admCd ? getPlace(body.admCd)?.props : undefined;
  if (!place && body.address) {
    place = (await geocodeToDistrict(body.address))?.props ?? geocodeToPlace(body.address) ?? undefined;
  }
  const bundle = place ? getPlace(place.admCd2) : null;
  if (!bundle) return NextResponse.json({ error: "geocode_failed" }, { status: 422 });

  const pdf = await renderPdf(parcelPdfHtml(bundle));
  if (!pdf) {
    return NextResponse.json(
      {
        error: "pdf_disabled",
        message: "서버 PDF 미활성. playwright 설치 + ENABLE_PDF=1 필요. (현재 화면 리포트는 정상 제공)",
      },
      { status: 501 }
    );
  }
  return new NextResponse(pdf as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="parcel_${bundle.props.admCd2}.pdf"`,
    },
  });
}
