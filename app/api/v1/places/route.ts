// 기관 데이터 API — API 키(기관 등급 발급)로 행정동 매력도 조회. key=쿼리 또는 x-api-key 헤더.
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { listPlaces, loadScores } from "@/lib/data";

export const runtime = "nodejs";
const BUCKET = "private", FILE = "apikeys.json";

async function keyOwner(key: string): Promise<{ userId: string; plan: string } | null> {
  if (!key || !key.startsWith("ft_live_")) return null;
  const admin = createAdminClient();
  if (!admin) return null;
  try {
    const { data } = await admin.storage.from(BUCKET).download(FILE);
    if (!data) return null;
    const idx = JSON.parse(await data.text());
    return idx[key] ?? null;
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key") || req.headers.get("x-api-key") || "";
  const owner = await keyOwner(key);
  if (!owner) return Response.json({ error: "invalid_api_key", hint: "기관 등급에서 발급한 API 키가 필요합니다." }, { status: 401 });

  const region = (req.nextUrl.searchParams.get("region") || "").trim();
  const limit = Math.min(500, Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") || "100", 10) || 100));
  const scores = loadScores();
  let places = listPlaces();
  if (region) places = places.filter((p) => p.sigungu.includes(region) || p.sido.includes(region) || p.name.includes(region));
  const out = places.slice(0, limit).map((p) => {
    const s = scores.byPlace[p.admCd2]?.at(-1);
    return { admCd2: p.admCd2, name: p.name, sido: p.sido, sigungu: p.sigungu, klai: s?.klai ?? null, grade: s?.grade ?? null, momentum: s?.momentum ?? null, gentriStage: s?.gentriStage ?? null, marketVitality: s?.marketVitality ?? null };
  });
  return Response.json({ ok: true, period: scores.periods.at(-1), count: out.length, places: out });
}
