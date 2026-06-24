// 기관 API 키 발급/회전 — 기관(org) 등급 전용. 키는 user_metadata.ft_apikey + 비공개 Storage 인덱스(검증용).
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/server";
import { normalizePlan, canUse } from "@/lib/tier";
import { randomBytes } from "node:crypto";

export const runtime = "nodejs";
const BUCKET = "private", FILE = "apikeys.json";

export async function POST() {
  const admin = createAdminClient();
  if (!admin) return Response.json({ error: "disabled" }, { status: 503 });
  const user = await getUser();
  if (!user) return Response.json({ error: "login_required" }, { status: 401 });
  const plan = normalizePlan(user.user_metadata?.ft_plan as string);
  if (!canUse(plan, "api")) return Response.json({ error: "org_required" }, { status: 403 });

  const key = "ft_live_" + randomBytes(18).toString("base64url");
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  await admin.auth.admin.updateUserById(user.id, { user_metadata: { ...meta, ft_apikey: key } });

  // 비공개 인덱스(key → {userId, plan})
  try { await admin.storage.createBucket(BUCKET, { public: false }); } catch { /* 존재 */ }
  let idx: Record<string, { userId: string; plan: string; at: string }> = {};
  try { const { data } = await admin.storage.from(BUCKET).download(FILE); if (data) idx = JSON.parse(await data.text()); } catch { /* noop */ }
  for (const k in idx) if (idx[k].userId === user.id) delete idx[k]; // 기존 키 회전
  idx[key] = { userId: user.id, plan, at: new Date().toISOString() };
  try { await admin.storage.from(BUCKET).upload(FILE, new Blob([JSON.stringify(idx)], { type: "application/json" }), { upsert: true, contentType: "application/json" }); } catch { /* noop */ }

  return Response.json({ ok: true, key });
}
