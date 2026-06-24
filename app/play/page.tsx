import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { GameSummary } from "@/components/account/GameSummary";
import { TerritoryBoard } from "@/components/account/TerritoryBoard";

export const metadata: Metadata = { title: "내 로컬 플레이 — 코인·깃발·영토" };

// 게스트도 볼 수 있는 게임 요약(로그인 불필요). GameChip이 여기로 링크.
export default function PlayPage() {
  return (
    <PageShell width="narrow">
      <div className="mb-5">
        <span className="klai-eyebrow">🎮 Local Play</span>
        <h1 className="mt-2 font-display text-[clamp(26px,4vw,36px)] font-black tracking-tight text-ink">내 로컬 플레이</h1>
        <p className="mt-1.5 text-[14px] leading-relaxed text-muted">플래그맵에서 매장·축제를 <b className="text-ink">체크인</b>하면 코인·깃발·영토가 쌓여요. 동네를 점령하고 레벨을 올리세요.</p>
      </div>
      <GameSummary />
      <div className="mt-4"><TerritoryBoard /></div>
      <div className="mt-4 flex flex-wrap gap-2.5">
        <Link href="/map-tale" className="btn-glow rounded-full bg-amber px-5 py-3 text-[14px] font-extrabold text-onaccent">🗺 플래그맵에서 체크인 →</Link>
        <Link href="/account" className="rounded-full border-[1.5px] border-line bg-card px-5 py-3 text-[14px] font-extrabold text-ink transition-colors hover:border-ink">계정으로 저장</Link>
      </div>
      <p className="mt-3 text-[11.5px] leading-relaxed text-muted2">로그인하면 코인·영토가 계정에 저장돼 <b className="text-ink">기기를 넘어 유지</b>됩니다. (지금은 이 기기에만 저장)</p>
    </PageShell>
  );
}
