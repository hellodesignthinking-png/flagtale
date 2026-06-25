"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  KIND_META, SPOT_CATEGORIES, STAY_TYPES, TOUR_TYPES,
  getMyListings, upsertListing, deleteListing, newListingId,
  type Listing, type ListingKind,
} from "@/lib/listings";

const KINDS: ListingKind[] = ["spot", "stay", "tour"];

function emptyForm(kind: ListingKind): Partial<Listing> {
  return { kind, name: "", region: "", host: "", description: "", category: kind === "spot" ? SPOT_CATEGORIES[0] : undefined, stayType: kind === "stay" ? STAY_TYPES[0] : undefined, tourType: kind === "tour" ? TOUR_TYPES[0] : undefined };
}

export function HostCenter() {
  const [tab, setTab] = useState<"register" | "manage">("register");
  const [kind, setKind] = useState<ListingKind | null>(null);
  const [form, setForm] = useState<Partial<Listing>>({});
  const [mine, setMine] = useState<Listing[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [geoMsg, setGeoMsg] = useState<string | null>(null);
  const [geoBusy, setGeoBusy] = useState(false);

  useEffect(() => { setMine(getMyListings()); }, []);

  const refresh = () => setMine(getMyListings());
  const set = (k: keyof Listing, v: string | number) => setForm((f) => ({ ...f, [k]: v }));
  // 주소 → 좌표 지오코딩(/api/geocode) — 저장 시 좌표가 함께 들어가 상세페이지 지도에 정확히 표시됨
  const geocode = async () => {
    const addr = form.address?.trim();
    if (!addr) { setGeoMsg("주소를 먼저 입력하세요"); return; }
    setGeoBusy(true); setGeoMsg(null);
    try {
      const r = await fetch(`/api/geocode?q=${encodeURIComponent(addr)}`);
      const j = await r.json();
      if (r.ok && j.lat && j.lng) { setForm((f) => ({ ...f, lat: j.lat, lng: j.lng })); setGeoMsg(`✓ 위치 확인됨${j.matched ? ` · ${j.matched}` : ""}`); }
      else setGeoMsg("주소를 찾지 못했어요 — 더 구체적으로 입력해 보세요");
    } catch { setGeoMsg("위치 검색 실패 — 잠시 후 다시 시도"); }
    finally { setGeoBusy(false); }
  };
  const startNew = (k: ListingKind) => { setKind(k); setForm(emptyForm(k)); setGeoMsg(null); setTab("register"); };
  const startEdit = (l: Listing) => { setKind(l.kind); setForm(l); setTab("register"); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const canSave = !!(form.name && form.name.trim() && form.region && form.region.trim());

  const save = () => {
    if (!kind || !canSave) return;
    const now = Date.now();
    const l: Listing = {
      id: form.id || newListingId(),
      kind,
      name: form.name!.trim(),
      region: form.region!.trim(),
      host: form.host?.trim() || undefined,
      address: form.address?.trim() || undefined,
      lat: form.lat,
      lng: form.lng,
      description: form.description?.trim() || undefined,
      image: form.image?.trim() || undefined,
      category: kind === "spot" ? form.category : undefined,
      stayType: kind === "stay" ? form.stayType : undefined,
      pricePerNight: kind === "stay" ? Number(form.pricePerNight) || undefined : undefined,
      maxGuests: kind === "stay" ? Number(form.maxGuests) || undefined : undefined,
      tourType: kind === "tour" ? form.tourType : undefined,
      price: kind === "tour" ? Number(form.price) || undefined : undefined,
      maxSeats: kind === "tour" ? Number(form.maxSeats) || undefined : undefined,
      schedule: kind === "tour" ? form.schedule?.trim() || undefined : undefined,
      duration: kind === "tour" ? form.duration?.trim() || undefined : undefined,
      createdAt: form.createdAt || now,
      updatedAt: now,
    };
    upsertListing(l);
    refresh();
    setKind(null);
    setForm({});
    setToast(form.id ? "수정되었습니다" : "등록되었습니다");
    setTab("manage");
    setTimeout(() => setToast(null), 2600);
  };

  const remove = (id: string) => { if (confirm("이 등록을 삭제할까요?")) { deleteListing(id); refresh(); } };

  return (
    <div className="relative">
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-5 py-2.5 text-[13px] font-extrabold text-white shadow-lg">✓ {toast}</div>
      )}

      {/* 탭 */}
      <div className="mb-5 inline-flex rounded-full border-[1.5px] border-line bg-card p-1">
        <button onClick={() => { setTab("register"); }} className={`rounded-full px-4 py-2 text-[13.5px] font-extrabold transition-colors ${tab === "register" ? "bg-amber text-onaccent" : "text-muted hover:text-ink"}`}>+ 등록하기</button>
        <button onClick={() => { setTab("manage"); setKind(null); }} className={`rounded-full px-4 py-2 text-[13.5px] font-extrabold transition-colors ${tab === "manage" ? "bg-amber text-onaccent" : "text-muted hover:text-ink"}`}>내 등록 {mine.length > 0 && `(${mine.length})`}</button>
      </div>

      {/* 등록 탭 */}
      {tab === "register" && !kind && (
        <div className="grid gap-3 sm:grid-cols-3">
          {KINDS.map((k) => {
            const m = KIND_META[k];
            return (
              <button key={k} onClick={() => startNew(k)} className="lift rounded-[18px] border-[1.5px] border-line bg-card p-5 text-left">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[22px]" style={{ background: `${m.color}1f` }}>{m.emoji}</span>
                <div className="mt-3 text-[16px] font-black text-ink">{m.label}</div>
                <div className="mt-1 text-[12px] text-muted">{m.who}</div>
                <span className="mt-3 inline-flex text-[12.5px] font-extrabold" style={{ color: m.color }}>등록 시작 →</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 폼 */}
      {tab === "register" && kind && (
        <div className="rounded-[20px] border-[1.5px] border-line bg-card p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[17px] font-black text-ink">{KIND_META[kind].emoji} {KIND_META[kind].label} {form.id ? "수정" : "등록"}</h2>
            <button onClick={() => { setKind(null); setForm({}); }} className="text-[13px] font-bold text-muted2 hover:text-ink">← 종류 다시 선택</button>
          </div>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field label={kind === "spot" ? "매장·공간 이름" : kind === "stay" ? "스테이 제목" : "투어·워크숍 제목"} required>
              <input value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} placeholder={kind === "spot" ? "예: 명주동 한옥 책방" : kind === "stay" ? "예: 바다뷰 한옥 독채" : "예: 망원동 심야 책방 투어"} className={inp} />
            </Field>
            <Field label="지역" required hint="시/구 또는 동 (예: 서울 마포구 · 강릉)">
              <input value={form.region ?? ""} onChange={(e) => set("region", e.target.value)} placeholder="예: 서울 마포구" className={inp} />
            </Field>

            {kind === "spot" && (
              <Field label="카테고리">
                <select value={form.category ?? SPOT_CATEGORIES[0]} onChange={(e) => set("category", e.target.value)} className={inp}>
                  {SPOT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
            )}
            {kind === "stay" && (<>
              <Field label="스테이 유형"><select value={form.stayType ?? STAY_TYPES[0]} onChange={(e) => set("stayType", e.target.value)} className={inp}>{STAY_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}</select></Field>
              <Field label="1박 요금(원)"><input type="number" value={form.pricePerNight ?? ""} onChange={(e) => set("pricePerNight", e.target.value)} placeholder="120000" className={inp} /></Field>
              <Field label="최대 인원"><input type="number" value={form.maxGuests ?? ""} onChange={(e) => set("maxGuests", e.target.value)} placeholder="4" className={inp} /></Field>
            </>)}
            {kind === "tour" && (<>
              <Field label="유형"><select value={form.tourType ?? TOUR_TYPES[0]} onChange={(e) => set("tourType", e.target.value)} className={inp}>{TOUR_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}</select></Field>
              <Field label="참가비(원)"><input type="number" value={form.price ?? ""} onChange={(e) => set("price", e.target.value)} placeholder="25000" className={inp} /></Field>
              <Field label="정원"><input type="number" value={form.maxSeats ?? ""} onChange={(e) => set("maxSeats", e.target.value)} placeholder="8" className={inp} /></Field>
              <Field label="일정"><input value={form.schedule ?? ""} onChange={(e) => set("schedule", e.target.value)} placeholder="예: 매주 토 오전 11시" className={inp} /></Field>
              <Field label="소요 시간"><input value={form.duration ?? ""} onChange={(e) => set("duration", e.target.value)} placeholder="예: 약 3시간" className={inp} /></Field>
            </>)}

            <Field label={kind === "spot" || kind === "stay" ? "운영자·호스트명" : "진행자명"}>
              <input value={form.host ?? ""} onChange={(e) => set("host", e.target.value)} placeholder="예: 김로컬" className={inp} />
            </Field>
            <Field label="주소" full hint="주소 입력 후 '위치 찾기'로 좌표를 저장하면 지도에 정확히 표시됩니다">
              <div className="flex gap-2">
                <input
                  value={form.address ?? ""}
                  onChange={(e) => { setForm((f) => ({ ...f, address: e.target.value, lat: undefined, lng: undefined })); setGeoMsg(null); }}
                  placeholder="도로명/지번 주소"
                  className={inp}
                />
                <button type="button" onClick={geocode} disabled={geoBusy} className="shrink-0 rounded-xl border-[1.5px] border-line bg-card2 px-3 text-[12.5px] font-extrabold text-blue-l transition-colors hover:border-ink disabled:opacity-50">{geoBusy ? "검색…" : "📍 위치 찾기"}</button>
              </div>
              {geoMsg && <span className={`mt-1 block text-[11px] font-bold ${geoMsg.startsWith("✓") ? "text-grade-b" : "text-warn"}`}>{geoMsg}</span>}
              {form.lat && form.lng && <span className="mt-0.5 block text-[10.5px] text-muted2">좌표 {form.lat.toFixed(5)}, {form.lng.toFixed(5)} 저장됨</span>}
            </Field>
            <Field label="이미지 URL(선택)" full>
              <input value={form.image ?? ""} onChange={(e) => set("image", e.target.value)} placeholder="https://…" className={inp} />
            </Field>
            <Field label="소개" full>
              <textarea value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} rows={3} placeholder="어떤 곳/프로그램인지 한두 문장으로 소개해 주세요." className={`${inp} resize-none`} />
            </Field>
          </div>
          <div className="mt-5 flex items-center gap-2.5">
            <button onClick={save} disabled={!canSave} className={`rounded-full px-6 py-3 text-[14px] font-extrabold ${canSave ? "btn-glow bg-amber text-onaccent" : "cursor-not-allowed bg-card2 text-muted2"}`}>{form.id ? "수정 저장" : "등록하기"}</button>
            {!canSave && <span className="text-[12px] text-muted2">이름·지역은 필수입니다</span>}
          </div>
        </div>
      )}

      {/* 관리 탭 */}
      {tab === "manage" && (
        mine.length === 0 ? (
          <div className="rounded-[20px] border-[1.5px] border-dashed border-line bg-card2 px-6 py-12 text-center">
            <div className="text-[34px]">📭</div>
            <p className="mt-2 text-[14px] font-bold text-ink">아직 등록한 항목이 없어요</p>
            <p className="mt-1 text-[12.5px] text-muted">매장·스테이·투어·워크숍을 등록하면 여기서 관리할 수 있습니다.</p>
            <button onClick={() => setTab("register")} className="btn-glow mt-4 rounded-full bg-amber px-5 py-2.5 text-[13.5px] font-extrabold text-onaccent">+ 첫 등록 시작</button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {mine.map((l) => {
              const m = KIND_META[l.kind];
              return (
                <div key={l.id} className="flex items-center gap-3 rounded-[16px] border-[1.5px] border-line bg-card p-4">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[18px]" style={{ background: `${m.color}1f` }}>{m.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="text-[14.5px] font-black text-ink">{l.name}</span>
                      <span className="rounded-full px-2 py-0.5 text-[10.5px] font-extrabold" style={{ background: `${m.color}1f`, color: m.color }}>{m.label}{l.category ? ` · ${l.category}` : l.tourType ? ` · ${l.tourType}` : ""}</span>
                    </div>
                    <div className="mt-0.5 truncate text-[12px] text-muted">{l.region}{l.host ? ` · ${l.host}` : ""}{l.description ? ` — ${l.description}` : ""}</div>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <button onClick={() => startEdit(l)} className="rounded-full border-[1.5px] border-line bg-card px-3 py-1.5 text-[12px] font-extrabold text-ink hover:border-ink">수정</button>
                    <button onClick={() => remove(l.id)} className="rounded-full border-[1.5px] border-line bg-card px-3 py-1.5 text-[12px] font-extrabold text-warn hover:border-warn">삭제</button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* 데모 고지 */}
      <p className="mt-6 rounded-xl border border-line bg-card2 px-4 py-3 text-[11.5px] leading-relaxed text-muted2">
        ℹ️ 현재는 <b className="text-muted">내 브라우저에 저장되는 데모</b>입니다 — 등록·수정·삭제가 바로 동작하지만 이 기기에서만 보입니다.
        계정·결제 백엔드(Supabase)가 활성화되면 등록 내용이 <b className="text-muted">서버에 저장되어 지도·동네 매력도에 반영</b>되고 다른 사용자에게도 노출됩니다.
        {" "}<Link href="/contribute" className="font-bold text-blue-l hover:text-amber">동네 현장 제보는 여기 →</Link>
      </p>
    </div>
  );
}

const inp = "w-full rounded-xl border-[1.5px] border-line bg-card2 px-3.5 py-2.5 text-[14px] text-ink outline-none transition-colors focus:border-amber";

function Field({ label, required, hint, full, children }: { label: string; required?: boolean; hint?: string; full?: boolean; children: React.ReactNode }) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="mb-1 block text-[12.5px] font-bold text-ink">{label}{required && <span className="text-amber"> *</span>}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-muted2">{hint}</span>}
    </label>
  );
}
