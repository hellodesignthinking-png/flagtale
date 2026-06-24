"use client";

// 게임 상태 계정 동기화 — Supabase user_metadata.ft_game (테이블 불필요).
// 비로그인/미연동 시 localStorage만. 로그인 시 계정↔로컬 병합 → 기기 간 유지.
import { createClient } from "@/lib/supabase/client";
import { readGame, setGame, type GameState } from "@/lib/game";

function merge(l: GameState, c: GameState): GameState {
  const checkins: Record<string, number> = {};
  for (const id of new Set([...Object.keys(l.checkins || {}), ...Object.keys(c.checkins || {})])) checkins[id] = Math.max(l.checkins?.[id] || 0, c.checkins?.[id] || 0);
  const regions: Record<string, number> = {};
  for (const r of new Set([...Object.keys(l.regions || {}), ...Object.keys(c.regions || {})])) regions[r] = Math.max(l.regions?.[r] || 0, c.regions?.[r] || 0);
  return {
    coins: Math.max(l.coins || 0, c.coins || 0), // 안전 우선(인플레 방지) — 합산 아님
    checkins,
    regions,
    route: l.route?.length ? l.route : c.route || [],
    streak: Math.max(l.streak || 0, c.streak || 0),
    lastCheckDay: (l.lastCheckDay || "") > (c.lastCheckDay || "") ? l.lastCheckDay : c.lastCheckDay || "",
  };
}

let pushTimer: ReturnType<typeof setTimeout> | null = null;
/** 게임 변경 시 계정에 반영(디바운스). 비로그인이면 no-op. */
export function pushGame(s: GameState): void {
  const supabase = createClient();
  if (!supabase) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(async () => {
    try { const { data } = await supabase.auth.getUser(); if (!data.user) return; await supabase.auth.updateUser({ data: { ft_game: s } }); } catch { /* noop */ }
  }, 900);
}

/** 로그인 상태면 계정↔로컬 병합 → 로컬·계정 갱신, 병합본 반환. 아니면 null. */
export async function pullGame(): Promise<GameState | null> {
  const supabase = createClient();
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;
    const cloud = (data.user.user_metadata?.ft_game as GameState | undefined) ?? null;
    const local = readGame();
    const merged = cloud ? merge(local, cloud) : local;
    setGame(merged);
    if (!cloud || JSON.stringify(merged) !== JSON.stringify(cloud)) {
      await supabase.auth.updateUser({ data: { ft_game: merged } });
    }
    return merged;
  } catch { return null; }
}
