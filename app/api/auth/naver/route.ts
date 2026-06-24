// 네이버 로그인 시작 — Supabase 미지원 프로바이더라 커스텀 OAuth. nid.naver.com 인증으로 리다이렉트.
import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const cid = process.env.NAVER_LOGIN_CLIENT_ID || process.env.NAVER_CLIENT_ID;
  const reqOrigin = new URL(req.url).origin;
  // redirect_uri는 네이버 콘솔 등록값과 100% 일치해야 함 → 프리뷰/대체 도메인으로 흔들리지 않게 정식 도메인 고정
  const site = (process.env.NEXT_PUBLIC_SITE_URL || reqOrigin).replace(/\/+$/, "");
  if (!cid) return NextResponse.redirect(new URL("/auth?naver_error=disabled", reqOrigin));
  const redirectUri = `${site}/api/auth/naver/callback`;
  const state = randomUUID();
  const authUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${cid}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
  const res = NextResponse.redirect(authUrl);
  res.cookies.set("nv_state", state, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });
  return res;
}
