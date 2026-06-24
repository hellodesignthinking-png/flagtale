"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { normalizePlan, type Plan } from "@/lib/tier";

// 현재 로그인 사용자의 등급(ft_plan) — 클라이언트 게이팅용. 비로그인/키없음 = free.
export function usePlan(): { plan: Plan; ready: boolean } {
  const [plan, setPlan] = useState<Plan>("free");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const s = createClient();
    if (!s) { setReady(true); return; }
    s.auth.getUser().then(({ data }) => { setPlan(normalizePlan(data.user?.user_metadata?.ft_plan as string)); setReady(true); });
    const { data } = s.auth.onAuthStateChange((_e, sess) => setPlan(normalizePlan(sess?.user?.user_metadata?.ft_plan as string)));
    return () => data.subscription.unsubscribe();
  }, []);
  return { plan, ready };
}
