"use client";

// 즐겨찾기·최근 본 항목 계정 동기화 — Supabase user_metadata(테이블 불필요).
// 비로그인/미연동 시 localStorage만(기존 동작). 로그인 시 계정↔로컬 병합 후 기기 간 동기화.
import { createClient } from "@/lib/supabase/client";

const FAV = "ft-favs", REC = "ft-recent";
const read = (k: string): string[] => { try { const v = JSON.parse(localStorage.getItem(k) || "[]"); return Array.isArray(v) ? v : []; } catch { return []; } };
const write = (k: string, v: string[]) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* noop */ } };

export function readLists(): { favs: string[]; recent: string[] } {
  return { favs: read(FAV), recent: read(REC) };
}

let pushTimer: ReturnType<typeof setTimeout> | null = null;
/** 변경 시 계정에 반영(디바운스). 비로그인이면 no-op. */
export function pushToAccount(favs: string[], recent: string[]): void {
  const supabase = createClient();
  if (!supabase) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(async () => {
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      await supabase.auth.updateUser({ data: { ft_favs: favs, ft_recent: recent } });
    } catch { /* noop */ }
  }, 800);
}

/** 로그인 상태면 계정↔로컬 병합 → 로컬·계정 모두 갱신, 병합본 반환. 아니면 null. */
export async function pullFromAccount(): Promise<{ favs: string[]; recent: string[] } | null> {
  const supabase = createClient();
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;
    const m = (data.user.user_metadata || {}) as { ft_favs?: string[]; ft_recent?: string[] };
    const aFav = Array.isArray(m.ft_favs) ? m.ft_favs : [];
    const aRec = Array.isArray(m.ft_recent) ? m.ft_recent : [];
    const lFav = read(FAV), lRec = read(REC);
    const favs = Array.from(new Set([...lFav, ...aFav]));
    const recent = Array.from(new Set([...lRec, ...aRec])).slice(0, 12);
    write(FAV, favs); write(REC, recent);
    if ((lFav.length && lFav.length !== aFav.length) || (lRec.length && lRec.length !== aRec.length)) {
      await supabase.auth.updateUser({ data: { ft_favs: favs, ft_recent: recent } });
    }
    return { favs, recent };
  } catch { return null; }
}

/** 인증 상태 변화 구독. 반환값 호출로 해제. */
export function onAuthChange(cb: () => void): () => void {
  const supabase = createClient();
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange(() => cb());
  return () => data.subscription.unsubscribe();
}
