import { createClient } from "@supabase/supabase-js";

/**
 * service-role Supabase 클라이언트 (서버 전용, RLS 우회).
 * 결제 웹훅의 크레딧/구독 반영, 파이프라인 upsert 등에 사용.
 * 키 없으면 null → 목업 처리.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
