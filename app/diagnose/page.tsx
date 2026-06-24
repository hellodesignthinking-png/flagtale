import type { Metadata } from "next";
import { getPlace } from "@/lib/data";
import { PageShell } from "@/components/page-shell";
import { DiagnoseClient } from "@/components/diagnose/DiagnoseClient";

export const metadata: Metadata = { title: "지번 진단 — 방향·위기·전략" };

export default function DiagnosePage({ searchParams }: { searchParams: { admCd?: string } }) {
  const prefill = searchParams.admCd ? getPlace(searchParams.admCd)?.props.name ?? "" : "";

  return (
    <PageShell width="wide">
      <div className="mb-6">
        <span className="klai-eyebrow">🔎 지번·지역 진단 · 무료 공개</span>
        <h1 className="mt-1 font-display text-[clamp(26px,4vw,38px)] font-black tracking-[-0.03em]">지번 진단 리포트</h1>
        <p className="mt-1.5 text-[14px] leading-relaxed text-muted">
          지번/지역을 입력하면 <b className="text-ink">방향 · 2016~2026 장기변화 · 신호 · 위기 · 전략</b> 종합 리포트를 생성합니다.
          4축 레이더·인구/예산 추세·인과 루프 등 다이어그램으로, <b className="text-ink">전체 데이터를 공개</b>합니다.
        </p>
      </div>
      <DiagnoseClient initialQuery={prefill} initialAdmCd={searchParams.admCd} />
    </PageShell>
  );
}
