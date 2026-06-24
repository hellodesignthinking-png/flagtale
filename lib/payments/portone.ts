import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePlan } from "@/lib/tier";

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
  // user_metadata 기반 영속화 (테이블 불필요). 크레딧 적립 + 구독 + 구매기록을 계정 메타에.
  try {
    const { data } = await admin.auth.admin.getUserById(params.userId);
    const m = (data.user?.user_metadata ?? {}) as Record<string, unknown>;
    const credits = (Number(m.ft_credits) || 0) + (params.credits ?? 0);
    const plan = params.plan ?? (typeof m.ft_plan === "string" ? m.ft_plan : "free");
    const prev = Array.isArray(m.ft_purchases) ? (m.ft_purchases as unknown[]) : [];
    const purchases = [...prev, { paymentId: params.paymentId, plan: params.plan ?? null, credits: params.credits ?? null, admCd2: params.admCd2 ?? null, pnu: params.pnu ?? null, at: new Date().toISOString() }].slice(-50);
    await admin.auth.admin.updateUserById(params.userId, { user_metadata: { ...m, ft_credits: credits, ft_plan: plan, ft_purchases: purchases } });
    return { ok: true, mock: false, credits, plan, ...params };
  } catch (e) {
    return { ok: false, error: String(e), ...params };
  }
}

type EntMethod = "plan" | "owned" | "credit" | "none" | "mock";

/** 진단 PDF 권한 조회(차감 없음) — 구독(Pro/기관)=무제한, 기보유 동=재다운, 그 외 크레딧≥1. */
export async function diagnoseEntitlement(userId: string, admCd2: string): Promise<{ allowed: boolean; method: EntMethod; credits: number }> {
  const admin = createAdminClient();
  if (!admin) return { allowed: true, method: "mock", credits: 0 }; // service-role 없으면 통과(목업)
  try {
    const { data } = await admin.auth.admin.getUserById(userId);
    const m = (data.user?.user_metadata ?? {}) as Record<string, unknown>;
    const credits = Number(m.ft_credits) || 0;
    const plan = normalizePlan(typeof m.ft_plan === "string" ? m.ft_plan : null);
    if (plan === "pro" || plan === "org") return { allowed: true, method: "plan", credits };
    const purchases = Array.isArray(m.ft_purchases) ? (m.ft_purchases as Array<{ admCd2?: string }>) : [];
    if (purchases.some((p) => p?.admCd2 === admCd2)) return { allowed: true, method: "owned", credits };
    return credits >= 1 ? { allowed: true, method: "credit", credits } : { allowed: false, method: "none", credits };
  } catch {
    return { allowed: false, method: "none", credits: 0 };
  }
}

/** 진단 PDF 1건 크레딧 차감 + 구매기록 (렌더 성공 후 호출 — 실패 시 과금 방지). */
export async function chargeDiagnoseCredit(userId: string, admCd2: string): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;
  try {
    const { data } = await admin.auth.admin.getUserById(userId);
    const m = (data.user?.user_metadata ?? {}) as Record<string, unknown>;
    const credits = Number(m.ft_credits) || 0;
    if (credits < 1) return;
    const purchases = Array.isArray(m.ft_purchases) ? (m.ft_purchases as unknown[]) : [];
    const rec = { admCd2, credits: -1, at: new Date().toISOString(), via: "credit" };
    await admin.auth.admin.updateUserById(userId, { user_metadata: { ...m, ft_credits: credits - 1, ft_purchases: [...purchases, rec].slice(-50) } });
  } catch {
    /* noop */
  }
}
