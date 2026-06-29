import type { Metadata } from "next";
import { getPlace } from "@/lib/data";
import { PageShell } from "@/components/page-shell";
import { CultureImpactClient } from "@/components/culture/CultureImpactClient";

export const metadata: Metadata = { title: "문화영향평가 — 지역 문화영향 진단" };

export default function CultureImpactPage({ searchParams }: { searchParams: { admCd?: string } }) {
  const prefill = searchParams.admCd ? getPlace(searchParams.admCd)?.props.name ?? "" : "";

  return (
    <PageShell width="wide">
      <div className="mb-6">
        <span className="klai-eyebrow">🎭 문화영향평가 · 데이터 진단</span>
        <h1 className="mt-1 font-display text-[clamp(26px,4vw,38px)] font-black tracking-[-0.03em]">문화영향평가</h1>
        <p className="mt-1.5 text-[14px] leading-relaxed text-muted">
          국가·지자체 계획·정책이 <b className="text-ink">국민 삶의 질에 미치는 영향을 문화적 관점에서</b> 평가하는 제도(「문화기본법」 §5④).
          이 페이지는 행정동 <b className="text-ink">실데이터</b>로 6개 평가지표를 추정하고 <b className="text-ink">문화적 대안</b>을 제시합니다.
        </p>
      </div>

      {/* 제도 — 평가지표 3영역 */}
      <div className="klai-panel mb-5 p-5">
        <div className="mb-2 text-[12px] font-bold uppercase tracking-wider" style={{ color: "var(--blue-l)" }}>평가지표 (문화체육관광부)</div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { t: "문화기본권", d: "문화향유(시설·프로그램 접근) · 표현·참여(주체적 표현·정책 참여)" },
            { t: "문화정체성", d: "국가유산(역사·근대 자산 보호·향유) · 공동체(지역정체성·소통·통합)" },
            { t: "문화발전", d: "문화다양성(획일화·독점 방지) · 창의성(창의인재·혁신·미래지향)" },
          ].map((a) => (
            <div key={a.t} className="rounded-lg border border-line bg-card2 px-3.5 py-3">
              <div className="text-[13.5px] font-extrabold text-ink">{a.t}</div>
              <div className="mt-1 text-[11.5px] leading-relaxed text-muted2">{a.d}</div>
            </div>
          ))}
        </div>
      </div>

      <CultureImpactClient initialQuery={prefill} />
    </PageShell>
  );
}
