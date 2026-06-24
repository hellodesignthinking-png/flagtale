import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { HostCenter } from "@/components/host/HostCenter";

export const metadata: Metadata = { title: "호스트 등록 — 매장·스테이·투어·워크숍 직접 등록" };

export default function HostPage() {
  return (
    <PageShell width="default">
      <div className="mb-6">
        <span className="klai-eyebrow">✋ 호스트 센터 · Be a Host</span>
        <h1 className="mt-1.5 font-display text-[clamp(28px,4vw,40px)] font-black leading-[1.06] tracking-[-0.03em]">
          내 로컬을 <span className="hl-mark">직접 등록</span>하세요
        </h1>
        <p className="mt-3 max-w-[640px] text-[15px] leading-relaxed text-muted">
          매장·지점·공간은 누구나, 스테이는 숙박 운영자, 투어·워크숍은 진행자가 <b className="text-ink">직접 등록하고 수정</b>합니다.
          동네에 등록이 쌓일수록 그 지역의 <b className="text-ink">매력도</b>가 올라갑니다.
        </p>
      </div>

      {/* 누가 무엇을 등록하나 */}
      <div className="mb-7 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { e: "🙋", t: "일반 사용자", d: "우리 동네 매장·지점을 스팟으로 등록" },
          { e: "🧭", t: "지역 활동가", d: "거점·커뮤니티 공간을 등록·관리" },
          { e: "🏪", t: "매장·숙박 운영자", d: "내 매장·스테이를 직접 등록·수정" },
          { e: "🎫", t: "투어·워크숍 진행자", d: "프로그램을 직접 열고 관리" },
        ].map((r) => (
          <div key={r.t} className="rounded-[16px] border-[1.5px] border-line bg-card2 px-4 py-3.5">
            <div className="text-[20px]">{r.e}</div>
            <div className="mt-1 text-[13.5px] font-black text-ink">{r.t}</div>
            <div className="mt-0.5 text-[11.5px] leading-snug text-muted">{r.d}</div>
          </div>
        ))}
      </div>

      <HostCenter />
    </PageShell>
  );
}
