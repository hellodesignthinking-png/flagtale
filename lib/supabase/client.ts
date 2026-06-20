"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseEnabled } from "@/lib/config";

/** 브라우저 Supabase 클라이언트. 키 없으면 null → 호출측이 목업 처리. */
export function createClient() {
  if (!isSupabaseEnabled) return null;
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
