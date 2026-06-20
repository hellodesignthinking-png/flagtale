import { NextRequest, NextResponse } from "next/server";
import { grantEntitlement, paymentsEnabled, verifyPayment } from "@/lib/payments/portone";

// 스펙 §13·§15: POST /api/payments/webhook → 결제 검증·반영 (서버검증 필수)
// PortOne 웹훅 수신 → paymentId 추출 → PortOne API 재조회로 PAID 확인 → 크레딧/구독 반영.
// 웹훅 페이로드를 신뢰하지 않고 반드시 재조회한다.
export async function POST(req: NextRequest) {
  if (!paymentsEnabled()) {
    return NextResponse.json({ ok: true, mock: true, message: "결제 미설정 — 목업" });
  }

  let payload: { paymentId?: string; data?: { paymentId?: string } } = {};
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_payload" }, { status: 400 });
  }
  const paymentId = payload.paymentId || payload.data?.paymentId;
  if (!paymentId) return NextResponse.json({ error: "no_payment_id" }, { status: 400 });

  const verified = await verifyPayment(paymentId);
  if (!verified || !verified.paid) {
    return NextResponse.json({ ok: false, status: verified?.status ?? "UNVERIFIED" }, { status: 202 });
  }

  const cd = verified.customData as { plan?: string; credits?: number; userId?: string; admCd2?: string };
  const result = await grantEntitlement({
    userId: cd.userId,
    plan: cd.plan,
    credits: cd.credits,
    paymentId,
    admCd2: cd.admCd2,
  });

  return NextResponse.json({ ok: true, granted: result });
}
