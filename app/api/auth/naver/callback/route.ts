// 네이버 로그인 콜백 — code→네이버토큰→프로필(email) → Supabase 사용자 생성/조회
// → 매직링크 토큰을 verifyOtp로 교환해 세션 쿠키를 심고 /account로 리다이렉트.
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const origin = url.origin;
  const fail = (e: string) => NextResponse.redirect(new URL(`/auth?naver_error=${e}`, origin));
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = req.cookies.get("nv_state")?.value;
  if (!code || !state || state !== cookieState) return fail("state");

  const cid = process.env.NAVER_LOGIN_CLIENT_ID || process.env.NAVER_CLIENT_ID;
  const csec = process.env.NAVER_LOGIN_CLIENT_SECRET || process.env.NAVER_CLIENT_SECRET;
  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL, anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const admin = createAdminClient();
  if (!cid || !csec || !admin || !supaUrl || !anon) return fail("config");

  try {
    const tok = await fetch(`https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id=${cid}&client_secret=${csec}&code=${code}&state=${encodeURIComponent(state)}`, { cache: "no-store", signal: AbortSignal.timeout(8000) }).then((r) => r.json());
    if (!tok?.access_token) return fail("token");
    const prof = await fetch("https://openapi.naver.com/v1/nid/me", { headers: { Authorization: `Bearer ${tok.access_token}` }, cache: "no-store", signal: AbortSignal.timeout(8000) }).then((r) => r.json());
    const p = prof?.response ?? {};
    const email: string | undefined = p.email;
    if (!email) return fail("no_email");
    const name = p.name || p.nickname || email.split("@")[0];

    try { await admin.auth.admin.createUser({ email, email_confirm: true, user_metadata: { ft_name: name, naver_id: p.id, provider: "naver" } }); } catch { /* 이미 존재 */ }

    const { data: link } = await admin.auth.admin.generateLink({ type: "magiclink", email });
    const tokenHash = link?.properties?.hashed_token;
    if (!tokenHash) return fail("link");

    const res = NextResponse.redirect(new URL("/account", origin));
    const supabase = createServerClient(supaUrl, anon, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cs: { name: string; value: string; options?: Record<string, unknown> }[]) => cs.forEach(({ name: n, value, options }) => res.cookies.set(n, value, options as Parameters<typeof res.cookies.set>[2])),
      },
    });
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "email" });
    if (error) return fail("verify");
    res.cookies.set("nv_state", "", { path: "/", maxAge: 0 });
    return res;
  } catch {
    return fail("exception");
  }
}
