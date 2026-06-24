"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// 표시 이름 편집 — user_metadata.ft_name
export function ProfileEditor({ initial }: { initial: string }) {
  const router = useRouter();
  const [name, setName] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  async function save() {
    if (!name.trim()) { setMsg("이름을 입력하세요"); setTimeout(() => setMsg(""), 2200); return; }
    const supabase = createClient();
    if (!supabase) return;
    setBusy(true); setMsg("");
    const { error } = await supabase.auth.updateUser({ data: { ft_name: name.trim() } });
    setBusy(false);
    setMsg(error ? "저장 실패" : "✓ 저장됨");
    if (!error) router.refresh();
    setTimeout(() => setMsg(""), 2200);
  }
  return (
    <div className="flex items-center gap-2">
      <input value={name} onChange={(e) => setName(e.target.value)} aria-label="표시 이름" placeholder="표시 이름" maxLength={24} className="min-w-0 flex-1 rounded-xl border-[1.5px] border-line bg-card2 px-3 py-2 text-[13px] font-semibold text-ink focus:border-ink focus:outline-none" />
      <button onClick={save} disabled={busy || !name.trim() || name.trim() === initial} className="shrink-0 rounded-xl bg-ink px-3.5 py-2 text-[13px] font-extrabold text-white disabled:opacity-50">{busy ? "저장중…" : "저장"}</button>
      {msg && <span className="shrink-0 text-[12px] font-bold text-blue-l">{msg}</span>}
    </div>
  );
}
