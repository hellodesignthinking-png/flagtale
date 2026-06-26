import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { BoardPostDetail } from "@/components/board/BoardPostDetail";
import type { Post } from "@/lib/board";

function loadSeed(): Post[] {
  try {
    return (JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "board.json"), "utf-8")).posts ?? []) as Post[];
  } catch {
    return [];
  }
}

export function generateStaticParams() {
  return loadSeed().map((p) => ({ id: p.id }));
}

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const p = loadSeed().find((x) => x.id === params.id);
  return { title: p ? `${p.title} — 동네 게시판` : "동네 게시판 글", description: p?.content?.slice(0, 100) };
}

export default function BoardPostPage({ params }: { params: { id: string } }) {
  return (
    <PageShell width="narrow">
      <BoardPostDetail id={params.id} seed={loadSeed()} />
    </PageShell>
  );
}
