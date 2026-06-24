import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { Panel, Pill, SectionHead, Stat } from "@/components/ui";
import { ContributeForm } from "@/components/contribute/ContributeForm";
import { getUser } from "@/lib/supabase/server";
import { isSupabaseEnabled } from "@/lib/config";
import { DEMO_REPORTS, VIBE_OPTS, fieldVitality } from "@/lib/fieldreport";

export const metadata: Metadata = { title: "현장 리포트 — belocal 휴먼 센서 네트워크" };
export const dynamic = "force-dynamic";

export default async function ContributePage() {
  const user = await getUser(); // Supabase 키 있을 때만 실제 사용자
  const vibeLabel = (v: string) => VIBE_OPTS.find((o) => o.v === v) ?? { label: v, color: "var(--muted)" };

  return (
    <PageShell>
      <div className="mb-6">
        <span className="klai-eyebrow">✋ 우리 동네 제보</span>
        <h1 className="mt-1 font-display text-[clamp(28px,4vw,38px)] font-black leading-[1.06] tracking-[-0.03em]">우리 동네, <span className="hl-mark">직접 알려주세요</span></h1>
        <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-muted">
          데이터가 못 잡는 진짜 동네 이야기 — <b className="text-ink">뜨는 가게·분위기·객층·회전율</b>을 알려주시면 동네 매력도에 반영됩니다. 누구나 1분이면 제보할 수 있어요.
          {" "}<Link href="/host" className="font-bold text-blue-l hover:underline">매장·스테이·투어를 직접 운영한다면 → 호스트 등록</Link>
        </p>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="기여 보상" value={<span className="text-base">리포트 무료</span>} sub="고급 상권 리포트" accent="blue" />
        <Stat label="검증 포인트" value={<span className="text-base">belocal P</span>} sub="검증이벤트 적립" accent="amber" />
        <Stat label="기여자 배지" value={<span className="text-base">Flagtale Lab 기여자</span>} sub="프로필 배지" />
        <Stat label="데이터 반영" value={<span className="text-base">D4·내러티브</span>} sub="현장 보정" accent="blue" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        {/* 입력 폼 */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            <h2 className="font-display text-[15px] font-black tracking-[-0.03em] text-ink">현장 체크리스트</h2>
            {user ? (
              <Pill tone="blue">{user.email ?? "로그인됨"}</Pill>
            ) : isSupabaseEnabled ? (
              <Link href="/auth" className="text-[12px] font-semibold text-blue-l hover:underline">
                로그인하면 내 기여로 적립 →
              </Link>
            ) : (
              <Pill tone="amber">데모 모드 (Supabase 연동 시 실등록)</Pill>
            )}
          </div>
          <ContributeForm />
        </div>

        {/* 최근 현장 리포트 */}
        <div>
          <SectionHead title="최근 현장 리포트" desc={isSupabaseEnabled ? "실시간 기여" : "데모 예시 · 연동 시 실데이터"} />
          <div className="space-y-2">
            {DEMO_REPORTS.map((r, i) => {
              const vb = vibeLabel(r.vibe);
              return (
                <div key={i} className="rounded-xl border-[1.5px] border-line bg-card2 px-3 py-2.5 transition-colors hover:border-ink">
                  <div className="flex items-center justify-between">
                    <Link href={`/diagnose?admCd=${r.admCd2}`} className="text-[13px] font-bold text-ink hover:text-amber">
                      {r.placeName}
                    </Link>
                    <span className="text-[11.5px] font-bold" style={{ color: vb.color }}>
                      {vb.label}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11.5px] text-muted2">
                    <span>회전율 {r.turnover === "high" ? "높음" : r.turnover === "mid" ? "보통" : "낮음"}</span>
                    <span>신규 {r.newShops} · 폐업 {r.closedShops}</span>
                    <span>체감 활력 {fieldVitality(r)}</span>
                  </div>
                  {r.hotShop && <div className="mt-1 text-[12px] text-muted">🔥 {r.hotShop}</div>}
                  <div className="mt-1 text-[10.5px] text-muted2">
                    {r.contributor} · {r.createdAt}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Panel className="mt-5">
        <SectionHead no="해자" title="왜 belocal 크라우드소싱이 해자인가" />
        <p className="text-[12.5px] leading-relaxed text-muted">
          데이터로 못 잡는 오프라인 신호를 <b className="text-ink">현장 사람들이 보강</b>하면, 경쟁자가 복제 못 하는 데이터 독점이 생깁니다.
          belocal 크리에이터·상인 네트워크 = <b className="text-ink">인간 센서망</b>. 신뢰가 권위의 8할입니다.
          {!isSupabaseEnabled && (
            <span className="mt-2 block text-[11.5px] text-amber">
              ⚠ 현재 Supabase 미연동 — 데모 모드(접수만, 비영속). NEXT_PUBLIC_SUPABASE_URL·ANON_KEY 연동 시 로그인·실등록·집계가 활성화됩니다.
            </span>
          )}
        </p>
      </Panel>
    </PageShell>
  );
}
