import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { paymentsEnabled } from "@/lib/payments/portone";

// 스펙 §13: POST /api/checkout {plan|credits} → 결제 세션
// PortOne 키 있으면 브라우저 SDK 가 쓸 결제 파라미터 반환, 없으면 목업 세션.
// ⚠ 실제 결제 승인은 /api/payments/webhook 서버검증으로만 인정 (스펙 §15).
export async function POST(req: NextRequest) {
  let body: { plan?: string; credits?: number; userId?: string; admCd2?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* empty */
  }

  const amount = body.plan === "pro" ? 39000 : 9900;
  const paymentId = `klai_${randomUUID()}`;

  if (paymentsEnabled()) {
    // 브라우저에서 PortOne.requestPayment(...) 에 사용할 파라미터
    return NextResponse.json({
      ok: true,
      mock: false,
      provider: "portone",
      storeId: process.env.PORTONE_STORE_ID,
      channelKey: process.env.PORTONE_CHANNEL_KEY ?? null,
      paymentId,
      orderName: body.plan ? `Flagtale Lab ${body.plan} 구독` : "Flagtale Lab 지번 진단 크레딧",
      totalAmount: amount,
      currency: "KRW",
      payMethod: "EASY_PAY",
      customData: { plan: body.plan ?? null, credits: body.credits ?? 5, userId: body.userId ?? null, admCd2: body.admCd2 ?? null },
    });
  }

  // 목업 세션
  return NextResponse.json({
    ok: true,
    mock: true,
    paymentId,
    plan: body.plan ?? null,
    credits: body.credits ?? 5,
    message: "목업 결제 세션. PORTONE_API_SECRET·PORTONE_STORE_ID 설정 시 실결제로 전환됩니다.",
  });
}
