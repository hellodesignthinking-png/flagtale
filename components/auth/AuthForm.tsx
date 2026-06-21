"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "signup" | "login";

// Supabase Auth — 이메일+비밀번호 회원가입/로그인 + 매직링크 + 카카오. 키 없으면 데모(안내).
export function AuthForm() {
  const router = useRouter();
  const supabase = createClient();
  const enabled = !!supabase;

  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err" | "info"; text: string } | null>(null);

  const demoNote = "데모 모드입니다. Supabase 키 연동 시 실제 회원가입·로그인이 활성화됩니다.";

  async function submit() {
    setMsg(null);
    if (!email.trim() || !pw) {
      setMsg({ kind: "err", text: "이메일과 비밀번호를 입력해 주세요." });
      return;
    }
    if (mode === "signup" && pw.length < 6) {
      setMsg({ kind: "err", text: "비밀번호는 6자 이상이어야 합니다." });
      return;
    }
    if (!supabase) {
      setMsg({ kind: "info", text: demoNote });
      return;
    }
    setBusy(true);
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: pw,
        options: { emailRedirectTo: `${location.origin}/account` },
      });
      setBusy(false);
      if (error) return setMsg({ kind: "err", text: `회원가입 실패: ${error.message}` });
      if (data.session) {
        router.push("/account"); // 이메일 확인 비활성 프로젝트 → 즉시 로그인
        router.refresh();
      } else {
        setMsg({ kind: "ok", text: "확인 메일을 보냈습니다. 메일의 링크를 누르면 가입이 완료됩니다." });
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pw });
      setBusy(false);
      if (error) return setMsg({ kind: "err", text: `로그인 실패: ${error.message}` });
      router.push("/account");
      router.refresh();
    }
  }

  async function magicLink() {
    setMsg(null);
    if (!email.trim()) return setMsg({ kind: "err", text: "이메일을 입력해 주세요." });
    if (!supabase) return setMsg({ kind: "info", text: demoNote });
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: `${location.origin}/account` } });
    setBusy(false);
    setMsg(error ? { kind: "err", text: `오류: ${error.message}` } : { kind: "ok", text: "메일로 로그인 링크를 보냈습니다." });
  }

  async function kakao() {
    if (!supabase) return setMsg({ kind: "info", text: "데모 모드: 카카오 로그인은 Supabase + 카카오 프로바이더 설정 시 동작합니다." });
    await supabase.auth.signInWithOAuth({ provider: "kakao", options: { redirectTo: `${location.origin}/account` } });
  }

  return (
    <div className="klai-panel p-7">
      <span className="klai-eyebrow">{mode === "signup" ? "Sign up" : "Sign in"}</span>
      <h1 className="mt-1 text-2xl font-black">{mode === "signup" ? "KLAI 회원가입" : "KLAI 로그인"}</h1>
      <p className="mt-1 text-[13px] text-muted">
        주간 리포트·진단 알림·기여 적립 ·{" "}
        <span className={enabled ? "text-grade-b" : "text-amber"}>{enabled ? "실연동 활성" : "데모 모드"}</span>
      </p>

      {/* 모드 토글 */}
      <div className="mt-4 grid grid-cols-2 gap-1 rounded-lg border border-line bg-card2 p-1">
        {(["signup", "login"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setMsg(null); }}
            className={`rounded-md py-2 text-[13px] font-bold transition-colors ${mode === m ? "bg-blue text-white" : "text-muted hover:text-ink"}`}
          >
            {m === "signup" ? "회원가입" : "로그인"}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-2.5">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일"
          autoComplete="email"
          className="h-11 w-full rounded-lg border border-line bg-navy px-3.5 text-[14px] text-ink placeholder:text-muted2 focus:border-blue focus:outline-none"
        />
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={mode === "signup" ? "비밀번호 (6자 이상)" : "비밀번호"}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          className="h-11 w-full rounded-lg border border-line bg-navy px-3.5 text-[14px] text-ink placeholder:text-muted2 focus:border-blue focus:outline-none"
        />
        <button
          onClick={submit}
          disabled={busy}
          className="h-11 w-full rounded-lg bg-blue font-bold text-white hover:bg-[#65a30d] disabled:opacity-50"
        >
          {busy ? "처리 중…" : mode === "signup" ? "회원가입" : "로그인"}
        </button>
      </div>

      <div className="my-4 flex items-center gap-3 text-[11px] text-muted2">
        <span className="h-px flex-1 bg-line" /> 또는 <span className="h-px flex-1 bg-line" />
      </div>

      <div className="space-y-2">
        <button
          onClick={magicLink}
          disabled={busy}
          className="h-11 w-full rounded-lg border border-line font-semibold text-ink hover:bg-card2 disabled:opacity-50"
        >
          ✉ 비밀번호 없이 매직링크로 로그인
        </button>
        <button
          onClick={kakao}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#FEE500] font-bold text-[#191600] hover:brightness-95"
        >
          <span className="text-lg">💬</span> 카카오로 시작
        </button>
      </div>

      {msg && (
        <p
          className={`mt-3 rounded-lg border px-3 py-2 text-[12px] ${
            msg.kind === "err"
              ? "border-warn/40 bg-warn/10 text-warn"
              : msg.kind === "ok"
                ? "border-grade-b/40 bg-grade-b/10 text-grade-b"
                : "border-amber/40 bg-amber/10 text-amber"
          }`}
        >
          {msg.text}
        </p>
      )}

      <p className="mt-4 text-[11px] leading-relaxed text-muted2">
        가입 시 KLAI 이용약관·개인정보처리방침에 동의하는 것으로 간주됩니다. 개인 식별 데이터는 집계로만 사용됩니다(스펙 §15).
      </p>
    </div>
  );
}
