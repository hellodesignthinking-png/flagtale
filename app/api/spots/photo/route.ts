// 스팟 사진 업로드 — Supabase Storage(community/photos/{id}/)로 업로드 후 spot.images에 추가. 로그인 필수.
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/server";

export const runtime = "nodejs";
const BUCKET = "community", FILE = "spots.json";
const MAX = 4 * 1024 * 1024; // 4MB

export async function POST(req: NextRequest) {
  const admin = createAdminClient();
  if (!admin) return Response.json({ error: "disabled" }, { status: 503 });
  const user = await getUser();
  if (!user) return Response.json({ error: "login_required" }, { status: 401 });

  let form: FormData;
  try { form = await req.formData(); } catch { return Response.json({ error: "bad_form" }, { status: 400 }); }
  const id = form.get("id") as string | null;
  const file = form.get("file") as File | null;
  if (!id || !file) return Response.json({ error: "invalid" }, { status: 400 });
  if (!file.type.startsWith("image/")) return Response.json({ error: "not_image" }, { status: 400 });
  if (file.size > MAX) return Response.json({ error: "too_large" }, { status: 400 });

  try { await admin.storage.createBucket(BUCKET, { public: true }); } catch { /* 존재 */ }
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "jpg";
  const path = `photos/${id.replace(/[^a-zA-Z0-9_-]/g, "")}/${id.slice(-6)}-${file.size}.${ext}`;
  const up = await admin.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: true });
  if (up.error) return Response.json({ error: up.error.message }, { status: 500 });
  const url = admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

  // spot.images에 추가
  let spots: Record<string, unknown>[] = [];
  try { const { data } = await admin.storage.from(BUCKET).download(FILE); if (data) { const j = JSON.parse(await data.text()); if (Array.isArray(j)) spots = j; } } catch { /* noop */ }
  const idx = spots.findIndex((s) => s.id === id);
  if (idx >= 0) {
    const imgs = Array.isArray(spots[idx].images) ? (spots[idx].images as string[]) : [];
    if (!imgs.includes(url)) imgs.unshift(url);
    spots[idx].images = imgs.slice(0, 8);
    spots[idx].updatedAt = new Date().toISOString();
    try { await admin.storage.from(BUCKET).upload(FILE, new Blob([JSON.stringify(spots)], { type: "application/json" }), { upsert: true, contentType: "application/json" }); } catch { /* noop */ }
  }
  return Response.json({ ok: true, url, images: idx >= 0 ? spots[idx].images : [url] });
}
