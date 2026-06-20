/**
 * 통합 피처 플래그 — 환경변수 유무로 목업/실연동을 자동 전환하는 단일 지점.
 * 키가 없으면 전부 false → 앱은 시드(목업) 데이터로 그대로 동작한다.
 * 키가 채워지면 해당 통합만 켜진다. (빌드 스펙 §15·§16)
 */

// ── 클라이언트 노출 가능 (NEXT_PUBLIC_*) ─────────────────────
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Supabase Auth/DB(공개 anon) 사용 가능 여부 — 클라이언트·서버 공용 */
export const isSupabaseEnabled = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/** 실제 행정동 경계(GeoJSON) 사용 여부. 기본 'sample'(가상 동, 데이터윤리 §15). */
export const BOUNDARY_SOURCE =
  (process.env.NEXT_PUBLIC_BOUNDARY_SOURCE as "sample" | "real" | undefined) ?? "sample";

// ── 서버 전용 (NEXT_PUBLIC 아님) ─────────────────────────────
// 클라이언트 번들에 들어가지 않도록 함수로 감싸 서버에서만 호출.
export function serverFlags() {
  const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  return {
    /** service-role 로 Supabase 읽기/쓰기 가능 → 데이터 소스를 DB로 전환 */
    isSupabaseAdmin: hasServiceRole && isSupabaseEnabled,
    /** 실데이터 소스 사용(아니면 시드 JSON 목업) */
    dataSource: (hasServiceRole && isSupabaseEnabled ? "supabase" : "mock") as "supabase" | "mock",
    /** PortOne v2 실결제 가능 */
    isPaymentsEnabled: Boolean(process.env.PORTONE_API_SECRET && process.env.PORTONE_STORE_ID),
    /** Resend 이메일 발송 가능 */
    isEmailEnabled: Boolean(process.env.RESEND_API_KEY),
    /** Playwright 서버 PDF 사용 시도 (런타임에 playwright 모듈 동적 import) */
    isPdfEnabled: process.env.ENABLE_PDF === "1",
    cronSecret: process.env.CRON_SECRET || "dev-cron-secret-change-me",
  };
}
