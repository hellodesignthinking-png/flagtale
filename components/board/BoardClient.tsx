"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { POST_CATS, getMyPosts, addPost, deletePost, newPostId, getLiked, toggleLike, timeAgo, type Post, type PostCategory } from "@/lib/board";

const catMeta = (c: string) => POST_CATS.find((x) => x.key === c) ?? { key: c as PostCategory, emoji: "📝", color: "#888888" };

export function BoardClient({ seed }: { seed: Post[] }) {
  const [mine, setMine] = useState<Post[]>([]);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [now, setNow] = useState(0);
  const [cat, setCat] = useState<string>("전체");
  const [region, setRegion] = useState<string>("전체");
  const [writing, setWriting] = useState(false);
  const [form, setForm] = useState<{ category: PostCategory; region: string; title: string; content: string; author: string }>({ category: "제보", region: "", title: "", content: "", author: "" });
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setMine(getMyPosts());
    setLiked(getLiked());
    setNow(Date.now());
  }, []);

  const all = useMemo(() => [...mine, ...seed].sort((a, b) => b.createdAt - a.createdAt), [mine, seed]);
  const regions = useMemo(() => [...new Set(all.map((p) => p.region))].sort(), [all]);
  const list = all.filter((p) => (cat === "전체" || p.category === cat) && (region === "전체" || p.region === region));

  const submit = () => {
    if (!form.title.trim() || !form.content.trim() || !form.region.trim()) return;
    const p: Post = { id: newPostId(), category: form.category, region: form.region.trim(), title: form.title.trim(), content: form.content.trim(), author: form.author.trim() || "익명", likes: 0, createdAt: Date.now(), mine: true };
    addPost(p);
    setMine(getMyPosts());
    setForm({ category: "제보", region: "", title: "", content: "", author: "" });
    setWriting(false);
    setToast("글이 등록되었습니다");
    setTimeout(() => setToast(null), 2400);
  };
  const like = (id: string) => { toggleLike(id); setLiked(getLiked()); };
  const remove = (id: string) => { if (confirm("이 글을 삭제할까요?")) { deletePost(id); setMine(getMyPosts()); } };

  return (
    <div className="relative">
      {toast && <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-5 py-2.5 text-[13px] font-extrabold text-white shadow-lg">✓ {toast}</div>}

      {/* 필터 + 글쓰기 */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5">
          {["전체", ...POST_CATS.map((c) => c.key)].map((k) => (
            <button key={k} onClick={() => setCat(k)} className={`rounded-full border-[1.5px] px-3 py-1.5 text-[12.5px] font-extrabold transition-colors ${cat === k ? "border-ink bg-ink text-white" : "border-line bg-card text-ink hover:border-ink"}`}>
              {k === "전체" ? "전체" : `${catMeta(k).emoji} ${k}`}
            </button>
          ))}
        </div>
        <button onClick={() => setWriting((w) => !w)} className="btn-glow ml-auto rounded-full bg-amber px-4 py-2 text-[13px] font-extrabold text-onaccent">✍️ 글쓰기</button>
      </div>

      {/* 지역 필터 */}
      {regions.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {["전체", ...regions].map((r) => (
            <button key={r} onClick={() => setRegion(r)} className={`rounded-full px-2.5 py-1 text-[11.5px] font-bold transition-colors ${region === r ? "bg-blue-l text-white" : "bg-card2 text-muted2 hover:text-ink"}`}>{r === "전체" ? "🗺 전체 지역" : `📍 ${r}`}</button>
          ))}
        </div>
      )}

      {/* 글쓰기 폼 */}
      {writing && (
        <div className="mb-5 rounded-[18px] border-[1.5px] border-line bg-card p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap gap-1.5">
            {POST_CATS.map((c) => (
              <button key={c.key} onClick={() => setForm((f) => ({ ...f, category: c.key }))} className={`rounded-full border-[1.5px] px-3 py-1.5 text-[12.5px] font-extrabold transition-colors ${form.category === c.key ? "text-white" : "border-line bg-card text-ink"}`} style={form.category === c.key ? { background: c.color, borderColor: c.color } : undefined}>{c.emoji} {c.key}</button>
            ))}
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <input value={form.region} onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))} placeholder="지역 (예: 성수동, 강릉) *" className={inp} />
            <input value={form.author} onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))} placeholder="닉네임 (선택)" className={inp} />
          </div>
          <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="제목 *" className={`${inp} mt-2.5`} />
          <textarea value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} rows={3} placeholder="내용 — 동네에서 발견한 것, 후기, 질문, 모임 제안 *" className={`${inp} mt-2.5 resize-none`} />
          <div className="mt-3 flex items-center gap-2">
            <button onClick={submit} disabled={!form.title.trim() || !form.content.trim() || !form.region.trim()} className={`rounded-full px-5 py-2.5 text-[13.5px] font-extrabold ${form.title.trim() && form.content.trim() && form.region.trim() ? "btn-glow bg-amber text-onaccent" : "cursor-not-allowed bg-card2 text-muted2"}`}>등록</button>
            <button onClick={() => setWriting(false)} className="text-[12.5px] font-bold text-muted2 hover:text-ink">취소</button>
            <span className="ml-auto text-[10.5px] text-muted2">데모 · 이 기기에 저장</span>
          </div>
        </div>
      )}

      {/* 글 목록 */}
      <div className="space-y-2.5">
        {list.length === 0 ? (
          <div className="rounded-[18px] border-[1.5px] border-dashed border-line bg-card2 px-6 py-12 text-center text-[13px] text-muted2">조건에 맞는 글이 없어요. 첫 글을 남겨보세요!</div>
        ) : (
          list.map((p) => {
            const m = catMeta(p.category);
            const isLiked = liked.has(p.id);
            return (
              <article key={p.id} className="rounded-[16px] border-[1.5px] border-line bg-card p-4">
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <span className="rounded-full px-2 py-0.5 text-[10.5px] font-extrabold" style={{ background: `${m.color}1f`, color: m.color }}>{m.emoji} {p.category}</span>
                  <Link href="/map-tale" className="text-[11.5px] font-bold text-blue-l hover:underline">📍 {p.region}</Link>
                  <span className="text-[11px] text-muted2">· {p.author} · {now ? timeAgo(p.createdAt, now) : ""}</span>
                  {p.mine && <button onClick={() => remove(p.id)} className="ml-auto text-[11px] font-bold text-muted2 hover:text-warn">삭제</button>}
                </div>
                <h3 className="text-[15.5px] font-black tracking-tight text-ink">{p.title}</h3>
                <p className="mt-1 whitespace-pre-line text-[13px] leading-relaxed text-muted">{p.content}</p>
                <div className="mt-2.5 flex items-center gap-2">
                  <button onClick={() => like(p.id)} className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] font-bold transition-colors ${isLiked ? "border-[#e11d48] bg-[#e11d48]/10 text-[#e11d48]" : "border-line text-muted2 hover:border-ink hover:text-ink"}`}>
                    {isLiked ? "♥" : "♡"} {p.likes + (isLiked ? 1 : 0)}
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>

      <p className="mt-6 rounded-xl border border-line bg-card2 px-4 py-3 text-[11.5px] leading-relaxed text-muted2">
        ℹ️ 현재는 <b className="text-muted">시드 글 + 내 글(브라우저 저장) 데모</b>입니다. 계정·백엔드(Supabase) 활성화 시 글이 서버에 저장돼 모두에게 공유되고 댓글·알림이 추가됩니다.
      </p>
    </div>
  );
}

const inp = "w-full rounded-xl border-[1.5px] border-line bg-card2 px-3.5 py-2.5 text-[14px] text-ink outline-none transition-colors focus:border-amber";
