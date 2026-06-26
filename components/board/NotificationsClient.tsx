"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getNotifications, timeAgo, type Notif } from "@/lib/board";

export function NotificationsClient() {
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [now, setNow] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setNotifs(getNotifications());
    setNow(Date.now());
    setLoaded(true);
  }, []);

  return (
    <div>
      {!loaded ? (
        <div className="py-16 text-center text-[13px] text-muted2">불러오는 중…</div>
      ) : notifs.length === 0 ? (
        <div className="rounded-[20px] border-[1.5px] border-dashed border-line bg-card2 px-6 py-14 text-center">
          <div className="text-[34px]">🔔</div>
          <p className="mt-2 text-[14px] font-bold text-ink">아직 알림이 없어요</p>
          <p className="mx-auto mt-1 max-w-sm text-[12.5px] leading-relaxed text-muted">게시판에 글을 쓰면 <b className="text-ink">내 글에 달린 댓글</b>이 여기 알림으로 모여요. <Link href="/board" className="font-bold text-blue-l hover:underline">게시판 가기 →</Link></p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {notifs.map((n) => (
            <Link key={n.postId} href={`/board/${n.postId}`} className="lift block rounded-[16px] border-[1.5px] border-line bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13.5px] font-black text-ink">💬 내 글 “{n.title}”에 댓글 {n.comments.length}개</span>
                <span className="shrink-0 text-[11px] text-muted2">{now ? timeAgo(n.latest, now) : ""}</span>
              </div>
              <p className="mt-1 truncate text-[12.5px] text-muted">최근: {n.comments[n.comments.length - 1]?.author} — {n.comments[n.comments.length - 1]?.content}</p>
            </Link>
          ))}
        </div>
      )}
      <p className="mt-6 rounded-xl border border-line bg-card2 px-4 py-3 text-[11.5px] leading-relaxed text-muted2">
        ℹ️ 현재는 <b className="text-muted">내 글에 달린 댓글</b>을 이 기기에서 모아 보여주는 데모입니다. 계정·백엔드(Supabase) 활성화 시 <b className="text-muted">다른 사용자의 좋아요·댓글·팔로우</b>가 실시간 알림으로 전달됩니다.
      </p>
    </div>
  );
}
