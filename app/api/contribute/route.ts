import { NextRequest, NextResponse } from "next/server";
import { createClient, getUser } from "@/lib/supabase/server";
import { DEMO_REPORTS, fieldVitality, type FieldReport } from "@/lib/fieldreport";

// 현장 리포트 (모듈 E) — belocal 크리에이터·상인의 현장 관측 수집.
//   POST: 제출(Supabase field_reports 저장 / 키 없으면 데모 접수)
//   GET ?admCd= : 해당 동 최근 현장 리포트

// Supabase 테이블(키 연동 시 생성):
//   create table field_reports ( id uuid default gen_random_uuid() primary key,
//     adm_cd2 text, place_name text, crowd text, turnover text, vibe text,
//     new_shops int, closed_shops int, hot_shop text, note text,
//     contributor text, created_at timestamptz default now() );

export async function GET(req: NextRequest) {
  const admCd2 = req.nextUrl.searchParams.get("admCd") ?? "";
  const supabase = createClient();
  if (supabase) {
    let q = supabase.from("field_reports").select("*").order("created_at", { ascending: false }).limit(8);
    if (admCd2) q = supabase.from("field_reports").select("*").eq("adm_cd2", admCd2).order("created_at", { ascending: false }).limit(8);
    const { data, error } = await q;
    if (!error && data) {
      return NextResponse.json({ live: true, reports: data, vitality: data.length ? Math.round(data.reduce((s: number, r: FieldReport) => s + fieldVitality(r), 0) / data.length) : null });
    }
  }
  // 데모(비영속) — Supabase 미연동
  const reports = admCd2 ? DEMO_REPORTS.filter((r) => r.admCd2 === admCd2) : DEMO_REPORTS;
  return NextResponse.json({ live: false, reports, vitality: reports.length ? Math.round(reports.reduce((s, r) => s + fieldVitality(r), 0) / reports.length) : null });
}

export async function POST(req: NextRequest) {
  let body: Partial<FieldReport> = {};
  try {
    body = await req.json();
  } catch {
    /* empty */
  }
  if (!body.admCd2 || !body.crowd || !body.turnover || !body.vibe) {
    return NextResponse.json({ error: "missing_fields", message: "동·객층·회전율·분위기는 필수입니다." }, { status: 400 });
  }

  const supabase = createClient();
  const user = await getUser(); // 로그인 사용자(없으면 null = 데모/익명)
  const row = {
    adm_cd2: body.admCd2,
    place_name: body.placeName ?? "",
    crowd: body.crowd,
    turnover: body.turnover,
    vibe: body.vibe,
    new_shops: Number(body.newShops ?? 0),
    closed_shops: Number(body.closedShops ?? 0),
    hot_shop: body.hotShop ?? "",
    note: body.note ?? "",
    contributor: user?.email ?? "익명 기여자",
  };

  if (supabase && user) {
    const { error } = await supabase.from("field_reports").insert(row);
    if (!error) return NextResponse.json({ ok: true, live: true, message: "현장 리포트가 접수됐습니다. 기여 감사합니다!" });
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  // Supabase 미연동/비로그인 → 데모 접수(비영속)
  return NextResponse.json({
    ok: true,
    live: false,
    demo: true,
    message: supabase ? "로그인하면 실제 등록됩니다. (데모 접수)" : "Supabase 연동 시 실제 등록됩니다. (데모 접수)",
  });
}
