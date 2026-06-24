import { NextRequest, NextResponse } from "next/server";
import { getPlace, geocodeToPlace } from "@/lib/data";
import { geocodeToDistrict } from "@/lib/geocode";
import { getUser } from "@/lib/supabase/server";
import { isSupabaseEnabled } from "@/lib/config";
import { renderPdf } from "@/lib/pdf/render";
import { parcelPdfHtml } from "@/lib/pdf/template";
import { FREE_MODE } from "@/lib/tier";
import { diagnoseEntitlement, chargeDiagnoseCredit } from "@/lib/payments/portone";

// 유료 지번 진단 PDF (권한 필요). 스펙 §10.3·§11·§15.
// 흐름: 동 해석 → (FREE_MODE면 개방, 아니면 결제/크레딧 서버검증) → 렌더 → 성공 시에만 크레딧 차감.
export async function POST(req: NextRequest) {
  let body: { admCd?: string; address?: string; demoPaid?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    /* empty */
  }

  // 1) 동 해석 먼저 — 지오코딩 실패 시 과금 없이 422.
  let place = body.admCd ? getPlace(body.admCd)?.props : undefined;
  if (!place && body.address) {
    place = (await geocodeToDistrict(body.address))?.props ?? geocodeToPlace(body.address) ?? undefined;
  }
  const bundle = place ? getPlace(place.admCd2) : null;
  if (!bundle) return NextResponse.json({ error: "geocode_failed" }, { status: 422 });

  // 2) 권한 — FREE_MODE면 전면 개방. 아니면 결제/크레딧 검증(서버검증 필수, 클라 신뢰 금지).
  //    구독(Pro/기관)·기보유 동은 무료, 그 외는 크레딧 1 — 단 차감은 렌더 성공 후(4단계).
  let chargeAfter: { userId: string; admCd2: string } | null = null;
  if (!FREE_MODE) {
    if (isSupabaseEnabled) {
      const user = await getUser();
      if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      const ent = await diagnoseEntitlement(user.id, bundle.props.admCd2);
      if (!ent.allowed) {
        return NextResponse.json({ error: "payment_required", reason: ent.method, credits: ent.credits, message: "크레딧이 부족해요 — 충전 후 다운로드할 수 있어요." }, { status: 402 });
      }
      if (ent.method === "credit") chargeAfter = { userId: user.id, admCd2: bundle.props.admCd2 };
    } else if (!body.demoPaid) {
      return NextResponse.json({ error: "payment_required", message: "결제 후 PDF 다운로드 가능" }, { status: 402 });
    }
  }

  // 3) 서버 PDF 렌더 (Playwright)
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

  // 4) 렌더 성공 시에만 크레딧 차감 + 구매기록(실패 시 과금 없음).
  if (chargeAfter) await chargeDiagnoseCredit(chargeAfter.userId, chargeAfter.admCd2);

  return new NextResponse(pdf as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="parcel_${bundle.props.admCd2}.pdf"`,
    },
  });
}
