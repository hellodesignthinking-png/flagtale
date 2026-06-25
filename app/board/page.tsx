import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { BoardClient } from "@/components/board/BoardClient";
import type { Post } from "@/lib/board";

export const metadata: Metadata = { title: "동네 게시판 — 제보·후기·질문·모임" };

function loadSeed(): Post[] {
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "board.json"), "utf-8")) as { posts?: Post[] };
    return raw.posts ?? [];
  } catch {
    return [];
  }
}

export default function BoardPage({ searchParams }: { searchParams: { region?: string } }) {
  const seed = loadSeed();
  return (
    <PageShell width="narrow">
      <div className="mb-5">
        <span className="klai-eyebrow">💬 동네 게시판 · Community</span>
        <h1 className="mt-1.5 font-display text-[clamp(26px,4vw,38px)] font-black leading-[1.06] tracking-[-0.03em] text-ink">동네 이야기를 <span className="hl-mark">나눠요</span></h1>
        <p className="mt-2 text-[14.5px] leading-relaxed text-muted">뜨는 곳 <b className="text-ink">제보</b>, 방문 <b className="text-ink">후기</b>, <b className="text-ink">질문</b>, <b className="text-ink">모임</b> — 동네 사람들과 소통하세요.</p>
      </div>
      <BoardClient seed={seed} initialRegion={searchParams.region} />
    </PageShell>
  );
}
