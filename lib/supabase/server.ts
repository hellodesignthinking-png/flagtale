import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseEnabled } from "@/lib/config";

/** 서버(RSC/Route Handler) Supabase 클라이언트. 키 없으면 null. */
export function createClient() {
  if (!isSupabaseEnabled) return null;
  const cookieStore = cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // RSC 렌더 중 set 불가 — 미들웨어가 세션 갱신 담당
        }
      },
    },
  });
}

/** 현재 로그인 사용자 (없으면 null). 목업 모드에서도 null. */
export async function getUser() {
  const supabase = createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
