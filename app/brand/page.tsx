import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { Pill } from "@/components/ui";
import { DiagnoseClient } from "@/components/diagnose/DiagnoseClient";

export const metadata: Metadata = { title: "브랜드 진단 — 매장 중심 지역 평가" };

export default function BrandPage() {
  return (
    <PageShell width="wide">
      <div className="mb-6">
        <span className="klai-eyebrow">Brand Diagnosis</span>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h1 className="font-display text-[clamp(26px,4vw,38px)] font-black tracking-[-0.03em]">브랜드 진단</h1>
          <Pill tone="amber">샘플·잠정</Pill>
        </div>
        <p className="mt-1.5 text-[14px] leading-relaxed text-muted">
          네이버에 등록된 <b className="text-ink">매장·로컬 브랜드</b>를 검색해, <b className="text-ink">그 매장을 중심으로</b> 지역(상권·문화 인프라·활성화 동인·방향·위기·전략)을 평가합니다.
          프랜차이즈가 아니라 <b className="text-ink">로컬 브랜드·매장</b>을 우선으로 보여줍니다.
        </p>
      </div>
      <DiagnoseClient mode="brand" />
    </PageShell>
  );
}
