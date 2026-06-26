"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { POST_CATS, getMyPosts, getLiked, toggleLike, getComments, addComment, timeAgo, type Post, type Comment, type PostCategory } from "@/lib/board";

const catMeta = (c: string) => POST_CATS.find((x) => x.key === c) ?? { key: c as PostCategory, emoji: "📝", color: "#888888" };

export function BoardPostDetail({ id, seed }: { id: string; seed: Post[] }) {
  const [post, setPost] = useState<Post | null | undefined>(undefined); // undefined=loading
  const [comments, setComments] = useState<Comment[]>([]);
  const [liked, setLiked] = useState(false);
  const [now, setNow] = useState(0);
  const [cmt, setCmt] = useState("");
  const [cmtAuthor, setCmtAuthor] = useState("");

  useEffect(() => {
    const found = [...getMyPosts(), ...seed].find((p) => p.id === id) ?? null;
    setPost(found);
    setComments(getComments(id));
    setLiked(getLiked().has(id));
    setNow(Date.now());
  }, [id, seed]);

  const submit = () => {
    if (!cmt.trim()) return;
    addComment(id, { id: `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`, author: cmtAuthor.trim() || "익명", content: cmt.trim(), createdAt: Date.now() });
    setComments(getComments(id));
    setCmt("");
  };
  const like = () => { toggleLike(id); setLiked(getLiked().has(id)); };

  if (post === undefined) return <div className="py-20 text-center text-[13px] text-muted2">불러오는 중…</div>;
  if (post === null)
    return (
      <div className="rounded-[20px] border-[1.5px] border-line bg-card2 px-6 py-16 text-center">
        <div className="text-[34px]">🔍</div>
        <p className="mt-2 text-[14px] font-bold text-ink">글을 찾을 수 없어요</p>
        <p className="mt-1 text-[12.5px] text-muted">다른 기기에서 작성된 글이거나 삭제됐을 수 있어요(데모는 기기별 저장).</p>
        <Link href="/board" className="btn-glow mt-4 inline-flex rounded-full bg-amber px-5 py-2.5 text-[13.5px] font-extrabold text-onaccent">← 게시판으로</Link>
      </div>
    );

  const m = catMeta(post.category);
  return (
    <article>
      <div className="mb-4 text-[13px] text-muted2"><Link href="/board" className="hover:text-ink">← 동네 게시판</Link></div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full px-2.5 py-1 text-[12px] font-extrabold" style={{ background: `${m.color}1f`, color: m.color }}>{m.emoji} {post.category}</span>
        <Link href={`/board?region=${encodeURIComponent(post.region)}`} className="text-[12.5px] font-bold text-blue-l hover:underline">📍 {post.region}</Link>
        <span className="text-[12px] text-muted2">· {post.author} · {now ? timeAgo(post.createdAt, now) : ""}</span>
      </div>
      <h1 className="mt-2 font-display text-[clamp(22px,3.5vw,30px)] font-black leading-tight tracking-[-0.02em] text-ink">{post.title}</h1>
      <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-muted">{post.content}</p>

      <div className="mt-4 flex items-center gap-2 border-y border-line py-3">
        <button onClick={like} className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-bold transition-colors ${liked ? "border-[#e11d48] bg-[#e11d48]/10 text-[#e11d48]" : "border-line text-muted2 hover:border-ink hover:text-ink"}`}>{liked ? "♥" : "♡"} 좋아요 {post.likes + (liked ? 1 : 0)}</button>
        <span className="text-[13px] font-bold text-muted2">💬 댓글 {comments.length}</span>
      </div>

      {/* 댓글 */}
      <section className="mt-5">
        <h2 className="mb-3 text-[15px] font-black text-ink">댓글 {comments.length}</h2>
        <div className="space-y-2">
          {comments.length === 0 && <p className="rounded-[12px] border border-dashed border-line bg-card2/50 px-4 py-5 text-center text-[12.5px] text-muted2">첫 댓글을 남겨보세요!</p>}
          {comments.map((c) => (
            <div key={c.id} className="rounded-[12px] border border-line bg-card2/60 px-3.5 py-2.5">
              <div className="text-[11.5px] font-bold text-muted2">{c.author} · {now ? timeAgo(c.createdAt, now) : ""}</div>
              <p className="mt-0.5 whitespace-pre-line text-[13px] text-ink">{c.content}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input value={cmtAuthor} onChange={(e) => setCmtAuthor(e.target.value)} placeholder="닉네임" className="w-24 shrink-0 rounded-xl border-[1.5px] border-line bg-card2 px-3 py-2.5 text-[13px] text-ink outline-none focus:border-amber" />
          <input value={cmt} onChange={(e) => setCmt(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submit(); }} placeholder="댓글 달기…" className="min-w-0 flex-1 rounded-xl border-[1.5px] border-line bg-card2 px-3.5 py-2.5 text-[13px] text-ink outline-none focus:border-amber" />
          <button onClick={submit} disabled={!cmt.trim()} className={`shrink-0 rounded-xl px-4 text-[13px] font-extrabold ${cmt.trim() ? "bg-amber text-onaccent" : "cursor-not-allowed bg-card2 text-muted2"}`}>등록</button>
        </div>
        <p className="mt-1.5 text-[10.5px] text-muted2">좋아요·댓글은 이 기기에 저장(데모) · 백엔드 활성 시 서버 공유</p>
      </section>
    </article>
  );
}
