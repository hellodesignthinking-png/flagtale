// 동네 커뮤니티 게시판 데이터 레이어.
// 지금: 시드 글(data/board.json, 서버) + 내 글(localStorage 데모) 병합. 좋아요도 로컬 기록.
// 활성화: Supabase posts 테이블 도입 시 fetch로 교체 → 서버 영속·공유.

export type PostCategory = "제보" | "후기" | "질문" | "모임";
export const POST_CATS: { key: PostCategory; emoji: string; color: string }[] = [
  { key: "제보", emoji: "📣", color: "#D4861E" },
  { key: "후기", emoji: "⭐", color: "#1E5FA8" },
  { key: "질문", emoji: "❓", color: "#16a34a" },
  { key: "모임", emoji: "🤝", color: "#8b5cf6" },
];

export interface Post {
  id: string;
  category: PostCategory;
  region: string;
  title: string;
  content: string;
  author: string;
  likes: number;
  createdAt: number;
  mine?: boolean;
}

const KEY = "ft_board_v1";
const LIKE_KEY = "ft_board_likes_v1";

export function getMyPosts(): Post[] {
  if (typeof window === "undefined") return [];
  try {
    const arr = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(arr) ? (arr as Post[]).map((p) => ({ ...p, mine: true })) : [];
  } catch {
    return [];
  }
}
export function addPost(p: Post): void {
  if (typeof window === "undefined") return;
  const ls = getMyPosts();
  ls.unshift(p);
  localStorage.setItem(KEY, JSON.stringify(ls));
}
export function deletePost(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(getMyPosts().filter((x) => x.id !== id)));
}
export function newPostId(): string {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

// 좋아요 — 누른 글 id 집합(localStorage)
export function getLiked(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(LIKE_KEY) || "[]"));
  } catch {
    return new Set();
  }
}
export function toggleLike(id: string): boolean {
  if (typeof window === "undefined") return false;
  const s = getLiked();
  const liked = s.has(id);
  if (liked) s.delete(id);
  else s.add(id);
  localStorage.setItem(LIKE_KEY, JSON.stringify([...s]));
  return !liked;
}

export function timeAgo(ts: number, now: number): string {
  const d = Math.max(0, now - ts);
  const min = Math.floor(d / 60000);
  if (min < 1) return "방금";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}일 전`;
  return `${Math.floor(day / 30)}개월 전`;
}
