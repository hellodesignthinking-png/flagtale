"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Supabase Auth(이메일 매직링크 + 카카오 OAuth). 키 없으면 목업.
export function AuthForm() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const supabase = createClient();
  const enabled = !!supabase;

  async function emailSignIn() {
    if (!supabase) {
      setMsg("목업 모드: Supabase 키 설정 시 매직링크가 발송됩니다.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/account` },
    });
    setBusy(false);
    setMsg(error ? `오류: ${error.message}` : "메일로 로그인 링크를 보냈습니다.");
  }

  async function kakaoSignIn() {
    if (!supabase) {
      setMsg("목업 모드: 카카오 OAuth는 Supabase + 카카오 프로바이더 설정 시 동작합니다.");
      return;
    }
    await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: { redirectTo: `${location.origin}/account` },
    });
  }

  return (
    <div className="klai-panel p-7">
      <span className="klai-eyebrow">Sign in</span>
      <h1 className="mt-1 text-2xl font-black">KLAI 로그인</h1>
      <p className="mt-1 text-[13px] text-muted">
        Supabase Auth (이메일 + 카카오) ·{" "}
        <span className={enabled ? "text-grade-b" : "text-muted2"}>{enabled ? "실연동 활성" : "목업 모드"}</span>
      </p>

      <div className="mt-5 space-y-2.5">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일"
          className="h-11 w-full rounded-lg border border-line bg-navy px-3.5 text-[14px] text-ink placeholder:text-muted2 focus:border-blue focus:outline-none"
        />
        <button
          onClick={emailSignIn}
          disabled={busy}
          className="h-11 w-full rounded-lg bg-blue font-bold text-white hover:bg-[#2a6fbd] disabled:opacity-50"
        >
          {busy ? "전송 중…" : enabled ? "매직링크로 로그인" : "이메일로 로그인 (목업)"}
        </button>
      </div>

      <div className="my-4 flex items-center gap-3 text-[11px] text-muted2">
        <span className="h-px flex-1 bg-line" /> 또는 <span className="h-px flex-1 bg-line" />
      </div>

      <button
        onClick={kakaoSignIn}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#FEE500] font-bold text-[#191600] hover:brightness-95"
      >
        <span className="text-lg">💬</span> 카카오로 시작{enabled ? "" : " (목업)"}
      </button>

      {msg && <p className="mt-3 rounded-lg border border-line bg-card2 px-3 py-2 text-[12px] text-muted">{msg}</p>}
    </div>
  );
}
