import { createAdminClient } from "@/lib/supabase/admin";

/**
 * PortOne v2 결제 — 서버 검증 필수 (스펙 §11·§15: 클라이언트 신뢰 금지).
 * 흐름: 브라우저 SDK requestPayment → 서버 /api/payments/webhook 또는 /api/checkout 검증 콜백
 *       → PortOne API 로 결제 재조회(status=PAID, amount 확인) → 크레딧/구독 반영.
 * 키 없으면 전부 목업.
 */
const PORTONE_API = "https://api.portone.io";

export function paymentsEnabled() {
  return Boolean(process.env.PORTONE_API_SECRET && process.env.PORTONE_STORE_ID);
}

export interface VerifiedPayment {
  paid: boolean;
  paymentId: string;
  amount: number;
  status: string;
  customData: Record<string, unknown>;
}

/** PortOne API 로 결제 재조회·검증 (서버 신뢰 원천) */
export async function verifyPayment(paymentId: string): Promise<VerifiedPayment | null> {
  const secret = process.env.PORTONE_API_SECRET;
  if (!secret) return null;
  const res = await fetch(`${PORTONE_API}/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `PortOne ${secret}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const p = (await res.json()) as {
    status?: string;
    amount?: { total?: number };
    customData?: string | Record<string, unknown>;
  };
  let customData: Record<string, unknown> = {};
  try {
    customData = typeof p.customData === "string" ? JSON.parse(p.customData) : p.customData ?? {};
  } catch {
    /* noop */
  }
  return {
    paid: p.status === "PAID",
    paymentId,
    amount: p.amount?.total ?? 0,
    status: p.status ?? "UNKNOWN",
    customData,
  };
}

/** 검증된 결제로 크레딧/구독 반영 (Supabase service-role). 없으면 목업. */
export async function grantEntitlement(params: {
  userId?: string;
  plan?: string;
  credits?: number;
  paymentId: string;
  admCd2?: string;
  pnu?: string;
}) {
  const admin = createAdminClient();
  if (!admin || !params.userId) {
    return { ok: true, mock: true, ...params };
  }
  // 크레딧 적립
  if (params.credits) {
    await admin.rpc("increment_credits", { p_user_id: params.userId, p_amount: params.credits });
  }
  // 구독 반영
  if (params.plan) {
    await admin.from("Subscription").upsert({
      userId: params.userId,
      plan: params.plan,
      status: "active",
      portoneId: params.paymentId,
    });
  }
  // 구매 기록
  await admin.from("ReportPurchase").insert({
    userId: params.userId,
    admCd2: params.admCd2 ?? null,
    pnu: params.pnu ?? null,
    paidAt: new Date().toISOString(),
  });
  return { ok: true, mock: false, ...params };
}
