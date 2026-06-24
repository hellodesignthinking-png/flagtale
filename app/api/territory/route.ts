// 멀티플레이 영토전 — 동네별 체크인 점유 집계(공유). Supabase Storage(테이블 불필요).
// territory.json = { [region]: { [deviceId]: { name, count } } }. 익명 기기ID 기준.
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
const BUCKET = "community", FILE = "territory.json";

type Cell = { name: string; count: number };
type Data = Record<string, Record<string, Cell>>;

async function load(admin: ReturnType<typeof createAdminClient>): Promise<Data> {
  if (!admin) return {};
  try { const { data } = await admin.storage.from(BUCKET).download(FILE); if (data) return JSON.parse(await data.text()) as Data; } catch { /* noop */ }
  return {};
}
async function save(admin: NonNullable<ReturnType<typeof createAdminClient>>, obj: Data) {
  try { await admin.storage.createBucket(BUCKET, { public: true }); } catch { /* 존재 */ }
  try { await admin.storage.from(BUCKET).upload(FILE, new Blob([JSON.stringify(obj)], { type: "application/json" }), { upsert: true, contentType: "application/json" }); } catch { /* noop */ }
}

// 체크인 1건 기록 — 동네 점유 +1
export async function POST(req: NextRequest) {
  const admin = createAdminClient();
  if (!admin) return Response.json({ error: "disabled" }, { status: 503 });
  let body: { deviceId?: string; name?: string; region?: string };
  try { body = await req.json(); } catch { return Response.json({ error: "bad_json" }, { status: 400 }); }
  const { deviceId, name, region } = body;
  if (!deviceId || !region) return Response.json({ error: "invalid" }, { status: 400 });
  const data = await load(admin);
  const reg = (data[region] ??= {});
  reg[deviceId] = { name: (name || "로컬러").toString().slice(0, 16), count: (reg[deviceId]?.count || 0) + 1 };
  await save(admin, data);
  return Response.json({ ok: true });
}

// 리더보드 — ?device=ID 면 그 기기의 동네별 순위(mine) + 핫한 동네(hot)
export function GET(req: NextRequest) {
  const device = req.nextUrl.searchParams.get("device") || "";
  const admin = createAdminClient();
  if (!admin) return Response.json({ mine: [], hot: [] });
  return load(admin).then((data) => {
    const mine: { region: string; leader: Cell | null; rank: number; count: number; total: number }[] = [];
    const hot: { region: string; total: number; leader: Cell | null }[] = [];
    for (const region in data) {
      const devs = Object.entries(data[region]).map(([id, v]) => ({ id, ...v })).sort((a, b) => b.count - a.count);
      const leader = devs[0] ? { name: devs[0].name, count: devs[0].count } : null;
      hot.push({ region, total: devs.reduce((s, d) => s + d.count, 0), leader });
      if (device) {
        const idx = devs.findIndex((d) => d.id === device);
        if (idx >= 0) mine.push({ region, leader, rank: idx + 1, count: devs[idx].count, total: devs.length });
      }
    }
    hot.sort((a, b) => b.total - a.total);
    return Response.json({ mine, hot: hot.slice(0, 8) }, { headers: { "cache-control": "no-store" } });
  });
}
