"use client";

import { useRef, useState } from "react";
import { ftImage, type MapItem } from "@/lib/flagtale-types";

// 사용자 스팟 운영 정보 편집 — 사진·운영팀·홈페이지·SNS·소개·영업정보 (로그인 필수, PATCH)
export function SpotEditor({ spot, onClose, onSaved }: { spot: MapItem; onClose: () => void; onSaved: (s: MapItem) => void }) {
  const [f, setF] = useState({
    operator: spot.operator ?? "", homepage: spot.homepage ?? "", instagram: spot.instagram ?? "",
    youtube: spot.youtube ?? "", blog: spot.blog ?? "", detail: spot.detail ?? "",
    hours: spot.hours ?? "", phone: spot.phone ?? "",
  });
  const [images, setImages] = useState<string[]>(spot.images ?? []);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));
  const src = (s: string) => (s.startsWith("http") || s.startsWith("/") ? s : ftImage(s));

  async function uploadPhoto(file: File) {
    setBusy(true); setMsg("사진 업로드 중…");
    const fd = new FormData(); fd.append("id", spot.id); fd.append("file", file);
    try {
      const d = await fetch("/api/spots/photo", { method: "POST", body: fd }).then((r) => r.json());
      if (d?.images) { setImages(d.images); setMsg("✓ 사진 추가됨"); }
      else setMsg(d?.error === "login_required" ? "로그인이 필요해요" : d?.error === "too_large" ? "4MB 이하만" : "업로드 실패");
    } catch { setMsg("업로드 실패"); }
    setBusy(false); setTimeout(() => setMsg(""), 2600);
  }
  async function save() {
    setBusy(true); setMsg("");
    try {
      const d = await fetch("/api/spots", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: spot.id, ...f, images }) }).then((r) => r.json());
      if (d?.spot) { onSaved(d.spot as MapItem); onClose(); }
      else setMsg(d?.error === "login_required" ? "로그인이 필요해요" : "저장 실패");
    } catch { setMsg("저장 실패"); }
    setBusy(false);
  }

  const inputCls = "w-full rounded-[10px] border-[1.5px] border-line bg-card2 px-3 py-2 text-[13px] font-semibold text-ink placeholder:text-muted2 focus:border-ink focus:outline-none";
  const Field = ({ label, k, ph }: { label: string; k: keyof typeof f; ph: string }) => (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold text-muted2">{label}</span>
      <input value={f[k]} onChange={(e) => set(k, e.target.value)} placeholder={ph} className={inputCls} />
    </label>
  );

  return (
    <div className="absolute inset-0 z-[210] grid place-items-center bg-black/45 p-3" onClick={onClose}>
      <div className="ft-panel-in flex max-h-[90%] w-full max-w-[440px] flex-col overflow-hidden rounded-[20px] border-[1.5px] border-line bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex shrink-0 items-center justify-between border-b border-line px-4 py-3">
          <span className="font-display text-[15px] font-black text-ink">✏️ 운영 정보 편집</span>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full bg-card2 text-[13px] text-ink hover:bg-line">✕</button>
        </div>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
          <div className="text-[12.5px] font-extrabold text-ink">{spot.name} <span className="text-[11px] font-bold text-muted2">· {spot.region}</span></div>

          {/* 사진 */}
          <div>
            <span className="mb-1 block text-[11px] font-bold text-muted2">📷 사진</span>
            <div className="flex flex-wrap gap-1.5">
              {images.map((im, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={src(im)} alt="" className="h-16 w-16 rounded-[9px] border border-line object-cover" />
              ))}
              <button onClick={() => fileRef.current?.click()} disabled={busy} className="grid h-16 w-16 place-items-center rounded-[9px] border-[1.5px] border-dashed border-line text-[20px] text-muted2 hover:border-ink disabled:opacity-50">＋</button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadPhoto(file); e.target.value = ""; }} />
          </div>

          <Field label="🏷 운영 팀 / 회사" k="operator" ph="예: secondwind, 명주크루" />
          <Field label="🌐 홈페이지" k="homepage" ph="example.com" />
          <Field label="📸 인스타그램" k="instagram" ph="instagram.com/…" />
          <Field label="▶️ 유튜브" k="youtube" ph="youtube.com/@…" />
          <Field label="✍️ 블로그" k="blog" ph="blog.naver.com/…" />
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold text-muted2">📝 소개</span>
            <textarea value={f.detail} onChange={(e) => set("detail", e.target.value)} rows={3} placeholder="공간·운영 소개" className={`${inputCls} resize-none`} />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Field label="🕒 영업시간" k="hours" ph="매일 11:00~21:00" />
            <Field label="📞 전화" k="phone" ph="02-…" />
          </div>
          {msg && <div className="text-center text-[12px] font-bold text-[#03a04a]">{msg}</div>}
        </div>
        <div className="shrink-0 border-t border-line p-3">
          <button onClick={save} disabled={busy} className="btn-glow flex w-full items-center justify-center rounded-full bg-amber py-2.5 text-[14px] font-extrabold text-onaccent disabled:opacity-50">{busy ? "저장 중…" : "저장하기"}</button>
        </div>
      </div>
    </div>
  );
}
