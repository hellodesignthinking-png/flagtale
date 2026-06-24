// 사용자 등록 스팟(UGC) — 네이버 매장 중 플래그테일 미등록 장소를 사용자가 등록 → 모두에게 공유.
// 영속화: Supabase Storage(community/spots.json, 테이블/SQL 불필요). service-role 서버 전용.
// 등록/편집은 로그인 필수. 신고 누적 시 숨김. 운영 정보(사진·SNS·홈페이지) 편집 가능.
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/server";
import { catMeta } from "@/lib/flagtale-types";

export const runtime = "nodejs";
const BUCKET = "community", FILE = "spots.json";
const HIDE_REPORTS = 3;
const EDITABLE = ["operator", "homepage", "instagram", "youtube", "blog", "detail", "hours", "phone", "priceRange", "images", "address"] as const;

function mapCat(c: string): string {
  const s = c || "";
  if (/카페|커피|디저트|베이커리|빵/.test(s)) return "cafe";
  if (/음식|식당|맛집|한식|중식|일식|양식|분식|고기|국밥|치킨|피자/.test(s)) return "food";
  if (/서점|책방|도서/.test(s)) return "bookstore";
  if (/갤러리|미술|전시/.test(s)) return "gallery";
  if (/술집|바\b|호프|주점|와인|펍|이자카야/.test(s)) return "bar";
  if (/공방|공예|클래스/.test(s)) return "workshop";
  if (/숙박|호텔|모텔|게스트|펜션|스테이/.test(s)) return "stay";
  return "shop";
}
const norm = (u?: string) => { const v = (u || "").trim(); return v && !/^https?:\/\//.test(v) && /\./.test(v) ? `https://${v}` : v || null; };

async function readSpots(admin: ReturnType<typeof createAdminClient>): Promise<Record<string, unknown>[]> {
  if (!admin) return [];
  try {
    const { data } = await admin.storage.from(BUCKET).download(FILE);
    if (!data) return [];
    const j = JSON.parse(await data.text());
    return Array.isArray(j) ? j : [];
  } catch { return []; }
}
async function writeSpots(admin: NonNullable<ReturnType<typeof createAdminClient>>, spots: unknown[]) {
  try { await admin.storage.createBucket(BUCKET, { public: true }); } catch { /* 존재 */ }
  const blob = new Blob([JSON.stringify(spots.slice(-800))], { type: "application/json" });
  return admin.storage.from(BUCKET).upload(FILE, blob, { upsert: true, contentType: "application/json" });
}

export async function GET() {
  const admin = createAdminClient();
  if (!admin) return Response.json({ spots: [] });
  const spots = (await readSpots(admin)).filter((s) => (Number(s.reports) || 0) < HIDE_REPORTS);
  return Response.json({ spots }, { headers: { "cache-control": "public, max-age=20, s-maxage=60" } });
}

export async function POST(req: NextRequest) {
  const admin = createAdminClient();
  if (!admin) return Response.json({ error: "disabled" }, { status: 503 });
  const user = await getUser();
  if (!user) return Response.json({ error: "login_required" }, { status: 401 });
  let body: { name?: string; lat?: number; lng?: number; category?: string; address?: string; link?: string; region?: string } = {};
  try { body = await req.json(); } catch { /* noop */ }
  const { name, lat, lng } = body;
  if (!name || typeof lat !== "number" || typeof lng !== "number") return Response.json({ error: "invalid" }, { status: 400 });

  const spots = await readSpots(admin);
  const id = "ugc-" + Buffer.from(`${name}|${lat.toFixed(4)}|${lng.toFixed(4)}`).toString("base64url").slice(0, 18);
  if (spots.some((s) => s.id === id)) return Response.json({ ok: true, dup: true, id });

  const cat = mapCat(body.category || "");
  const m = catMeta(cat);
  const spot = {
    id, kind: "spot", cat, catLabel: m.label, name, lat, lng, region: body.region || "",
    emoji: m.emoji, color: m.color, sub: `사용자 등록 · ${m.label}`, address: body.address || null,
    naverUrl: body.link || null, tags: ["사용자 등록", m.label], reports: 0,
    addedBy: user.email ?? null, addedAt: new Date().toISOString(),
  };
  spots.push(spot);
  const { error } = await writeSpots(admin, spots);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true, spot });
}

export async function PATCH(req: NextRequest) {
  const admin = createAdminClient();
  if (!admin) return Response.json({ error: "disabled" }, { status: 503 });
  const user = await getUser();
  if (!user) return Response.json({ error: "login_required" }, { status: 401 });
  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* noop */ }
  const id = body.id as string;
  if (!id) return Response.json({ error: "no_id" }, { status: 400 });
  const spots = await readSpots(admin);
  const idx = spots.findIndex((s) => s.id === id);
  if (idx < 0) return Response.json({ error: "not_found" }, { status: 404 });
  const spot = spots[idx];
  for (const k of EDITABLE) {
    if (k in body) {
      if (["homepage", "instagram", "youtube", "blog"].includes(k)) spot[k] = norm(body[k] as string);
      else if (k === "images") spot[k] = Array.isArray(body[k]) ? (body[k] as string[]).slice(0, 8) : spot[k];
      else spot[k] = body[k];
    }
  }
  if (typeof body.operator === "string") spot.operator = body.operator.trim() || null;
  spot.updatedBy = user.email ?? null;
  spot.updatedAt = new Date().toISOString();
  spots[idx] = spot;
  const { error } = await writeSpots(admin, spots);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true, spot });
}
