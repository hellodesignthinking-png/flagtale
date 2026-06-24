// 스팟 신고 — 누적 시 GET에서 숨김(HIDE_REPORTS=3). 사용자당 1회(reporters 중복 방지). 로그인 필수.
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/server";

export const runtime = "nodejs";
const BUCKET = "community", FILE = "spots.json";

export async function POST(req: NextRequest) {
  const admin = createAdminClient();
  if (!admin) return Response.json({ error: "disabled" }, { status: 503 });
  const user = await getUser();
  if (!user) return Response.json({ error: "login_required" }, { status: 401 });
  let body: { id?: string } = {};
  try { body = await req.json(); } catch { /* noop */ }
  if (!body.id) return Response.json({ error: "no_id" }, { status: 400 });

  let spots: Record<string, unknown>[] = [];
  try { const { data } = await admin.storage.from(BUCKET).download(FILE); if (data) { const j = JSON.parse(await data.text()); if (Array.isArray(j)) spots = j; } } catch { /* noop */ }
  const idx = spots.findIndex((s) => s.id === body.id);
  if (idx < 0) return Response.json({ error: "not_found" }, { status: 404 });
  const reporters = Array.isArray(spots[idx].reporters) ? (spots[idx].reporters as string[]) : [];
  const who = user.email ?? user.id;
  if (reporters.includes(who)) return Response.json({ ok: true, already: true });
  reporters.push(who);
  spots[idx].reporters = reporters;
  spots[idx].reports = reporters.length;
  try {
    const blob = new Blob([JSON.stringify(spots)], { type: "application/json" });
    await admin.storage.from(BUCKET).upload(FILE, blob, { upsert: true, contentType: "application/json" });
  } catch { /* noop */ }
  return Response.json({ ok: true, reports: reporters.length });
}
