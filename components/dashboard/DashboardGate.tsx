import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { PLAN_LABEL, type Plan } from "@/lib/tier";

// 기관 대시보드 잠금 화면 — Free/Pro 사용자에게 업셀 + 블러 미리보기.
export function DashboardGate({ plan }: { plan: Plan }) {
  return (
    <PageShell width="narrow">
      <div className="mb-5">
        <span className="klai-eyebrow">🏛️ 기관 전용</span>
        <h1 className="mt-2 font-display text-[clamp(26px,4vw,36px)] font-black tracking-tight text-ink">기관 대시보드</h1>
      </div>
      <div className="relative overflow-hidden rounded-[24px] border-[1.5px] border-line bg-card2/40">
        {/* 블러 미리보기 */}
        <div className="pointer-events-none select-none p-6 opacity-40 blur-[3px]" aria-hidden>
          <div className="grid grid-cols-3 gap-3">
            {["젠트리 경보 12", "거래절벽 5", "부정서사 3"].map((t) => (
              <div key={t} className="rounded-2xl border border-line bg-card p-5">
                <div className="text-[22px] font-black text-ink">{t.split(" ")[1]}</div>
                <div className="text-[12px] text-muted2">{t.split(" ")[0]}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 h-28 rounded-2xl border border-line bg-card" />
        </div>
        {/* 잠금 오버레이 */}
        <div className="absolute inset-0 grid place-items-center bg-card/55 px-6 backdrop-blur-[1px]">
          <div className="max-w-[420px] rounded-[20px] border-[1.5px] border-amber bg-card p-7 text-center shadow-2xl">
            <div className="text-[30px]">🏛️</div>
            <h2 className="mt-2 font-display text-[22px] font-black tracking-tight text-ink">기관 대시보드는 기관 등급 전용</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              관할 경보 인박스·동 랭킹·정책 What-if·CSV·<b className="text-ink">API 액세스</b>는 지자체·중간지원조직·AMC/VC 등 <b className="text-ink">기관 등급</b>에서 제공됩니다.
              {plan === "pro" && " (현재 Pro 등급)"}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Link href="/pricing" className="btn-glow rounded-full bg-amber px-5 py-2.5 text-[14px] font-extrabold text-onaccent">기관 등급 문의 →</Link>
              <Link href="/account" className="rounded-full border-[1.5px] border-line bg-card px-5 py-2.5 text-[14px] font-extrabold text-ink hover:border-ink">내 계정 ({PLAN_LABEL[plan]})</Link>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
