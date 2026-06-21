"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function logout() {
    const supabase = createClient();
    if (!supabase) return;
    setBusy(true);
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }
  return (
    <button
      onClick={logout}
      disabled={busy}
      className="rounded-lg border border-line px-3.5 py-2 text-[13px] font-semibold text-muted hover:bg-card2 hover:text-ink disabled:opacity-50"
    >
      {busy ? "로그아웃 중…" : "로그아웃"}
    </button>
  );
}
