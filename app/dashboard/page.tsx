import Link from "next/link";
import type { Metadata } from "next";
import { listPlaces, loadDiagnoses, loadProcurement, loadScores } from "@/lib/data";
import { PageShell } from "@/components/page-shell";
import { GradeBadge, MomentumChip, Panel, Pill, ProvisionalBadge, SectionHead, Stat } from "@/components/ui";
import { GRADE_HEX } from "@/lib/constants";
import { Sparkline } from "@/components/charts/Sparkline";
import { DonutChart } from "@/components/charts/DonutChart";

export const metadata: Metadata = { title: "기관 대시보드 — 경보·모니터링" };

const SEV_ORDER = { high: 0, mid: 1, low: 2 } as const;
const TYPE_LABEL: Record<string, string> = {
  gentri: "젠트리",
  decline: "소멸",
  transaction_cliff: "거래절벽",
  negative_narrative: "부정서사",
};

export default function DashboardPage({ searchParams }: { searchParams: { region?: string } }) {
  const region = searchParams.region ?? "";
  const places = listPlaces();
  const diags = loadDiagnoses();
  const scores = loadScores();
  const regions = Array.from(new Set(places.map((p) => p.sigungu)));

  const filtered = region ? places.filter((p) => p.sigungu === region) : places;

  // 경보 인박스
  const alerts = filtered.flatMap((p) => {
    const d = diags[p.admCd2];
    if (!d) return [];
    return d.risks.map((r) => ({ admCd2: p.admCd2, name: p.name, sigungu: p.sigungu, ...r }));
  });
  alerts.sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity]);

  const counts = {
    gentri: alerts.filter((a) => a.type === "gentri").length,
    decline: alerts.filter((a) => a.type === "decline").length,
    cliff: alerts.filter((a) => a.type === "transaction_cliff").length,
    narrative: alerts.filter((a) => a.type === "negative_narrative").length,
  };

  // 랭킹 (관할)
  const ranked = filtered
    .map((p) => ({ p, s: scores.byPlace[p.admCd2]?.at(-1)! }))
    .filter((x) => x.s)
    .sort((a, b) => b.s.klai - a.s.klai);

  // 공공예산 유입 (나라장터, 최신 연도)
  const proc = loadProcurement();
  const budgetRows = filtered
    .map((p) => {
      const a = proc.byPlace[p.admCd2]?.annual ?? [];
      const last = a[a.length - 1];
      return { p, total: last?.total ?? 0, bid: last?.bid ?? 0, sole: last?.sole ?? 0, year: last?.year };
    })
    .sort((x, y) => y.total - x.total);
  const regionBid = budgetRows.reduce((s, r) => s + r.bid, 0);
  const regionSole = budgetRows.reduce((s, r) => s + r.sole, 0);
  const budgetYear = budgetRows[0]?.year;
  const maxBudget = Math.max(...budgetRows.map((r) => r.total), 1);
  const eok = (manwon: number) => Math.round(manwon / 10000);

  return (
    <PageShell width="wide">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="klai-eyebrow">Institution Dashboard</span>
          <h1 className="mt-1 text-3xl font-black">기관 모니터링 대시보드</h1>
          <p className="mt-1 text-[14px] text-muted">
            관할 행정동 경보 인박스 · 랭킹 · 정책 우선순위. <Pill tone="amber">B2G/B2B 구독</Pill>
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Link
            href="/dashboard"
            className={`rounded-lg px-3 py-1.5 text-[13px] font-semibold ${!region ? "bg-blue text-white" : "border border-line text-muted hover:bg-card2"}`}
          >
            전체
          </Link>
          {regions.map((r) => (
            <Link
              key={r}
              href={`/dashboard?region=${encodeURIComponent(r)}`}
              className={`rounded-lg px-3 py-1.5 text-[13px] font-semibold ${region === r ? "bg-blue text-white" : "border border-line text-muted hover:bg-card2"}`}
            >
              {r}
            </Link>
          ))}
        </div>
      </div>

      {/* 요약 — 경보 유형 분포 도넛 + 카운트 */}
      <Panel className="mb-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
          <div className="relative shrink-0">
            <DonutChart
              size={128}
              segments={[
                { label: "젠트리", value: counts.gentri, color: "var(--warn)" },
                { label: "소멸", value: counts.decline, color: "#D4861E" },
                { label: "거래절벽", value: counts.cliff, color: "#d2691e" },
                { label: "부정 서사", value: counts.narrative, color: "#a23a2a" },
              ]}
              centerLabel={alerts.length.toLocaleString()}
              centerSub="총 경보"
            />
          </div>
          <div className="grid w-full flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="젠트리 경보" value={counts.gentri} accent="warn" />
            <Stat label="소멸 진입" value={counts.decline} accent="amber" />
            <Stat label="거래절벽" value={counts.cliff} accent="warn" />
            <Stat label="부정 서사" value={counts.narrative} accent="amber" />
          </div>
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        {/* 경보 인박스 */}
        <Panel>
          <SectionHead title="조기경보 인박스" desc={`${alerts.length.toLocaleString()}건 · 심각도순 (상위 80)`} />
          <div className="max-h-[560px] space-y-2 overflow-y-auto pr-1">
            {alerts.slice(0, 80).map((a, i) => (
              <Link
                key={i}
                href={`/place/${a.admCd2}`}
                className="flex items-start gap-3 rounded-lg border border-line bg-card2 px-3 py-2.5 hover:border-warn"
              >
                <span
                  className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                    a.severity === "high" ? "bg-warn" : a.severity === "mid" ? "bg-amber" : "bg-muted2"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13.5px] font-bold text-ink">{a.name}</span>
                    <span className="text-[10px] text-muted2">{a.sigungu}</span>
                    <Pill tone={a.type === "gentri" || a.type === "transaction_cliff" ? "warn" : "amber"}>
                      {TYPE_LABEL[a.type]}
                    </Pill>
                  </div>
                  <div className="mt-0.5 text-[12px] text-muted">{a.title}</div>
                </div>
                {(() => {
                  const ks = scores.byPlace[a.admCd2];
                  if (!ks || ks.length < 2) return null;
                  const c = a.severity === "high" ? "var(--warn)" : a.severity === "mid" ? "#D4861E" : "#4B9CD3";
                  return (
                    <div className="hidden shrink-0 self-center sm:block" title="KLAI 추세">
                      <Sparkline data={ks.map((s) => s.klai)} width={62} height={26} color={c} min={0} max={100} dot={false} />
                    </div>
                  );
                })()}
              </Link>
            ))}
            {alerts.length === 0 && <div className="text-[13px] text-muted2">경보 없음</div>}
          </div>
        </Panel>

        {/* 랭킹 + 정책 도구 */}
        <div className="space-y-5">
          <Panel>
            <SectionHead title="관할 랭킹" desc={`${ranked.length}곳`} />
            <div className="space-y-1.5">
              {ranked.slice(0, 8).map((x, i) => (
                <Link
                  key={x.p.admCd2}
                  href={`/place/${x.p.admCd2}`}
                  className="flex items-center gap-2.5 rounded-lg border border-line bg-card2 px-3 py-1.5 hover:border-blue"
                >
                  <span className="w-4 text-center text-[12px] font-bold text-muted2">{i + 1}</span>
                  <GradeBadge grade={x.s.grade} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink">{x.p.name}</span>
                  <div className="hidden h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-navy2/60 sm:block">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${x.s.klai}%`,
                        background: `linear-gradient(90deg, ${GRADE_HEX[x.s.grade]}99, ${GRADE_HEX[x.s.grade]})`,
                        boxShadow: `0 0 5px ${GRADE_HEX[x.s.grade]}66`,
                      }}
                    />
                  </div>
                  <span className="w-7 text-right text-[12px] font-semibold tabular-nums" style={{ color: GRADE_HEX[x.s.grade] }}>
                    {x.s.klai}
                  </span>
                  <MomentumChip m={x.s.momentum} />
                </Link>
              ))}
            </div>
          </Panel>

          <Panel>
            <SectionHead title="정책 도구" />
            <div className="space-y-2 text-[13px]">
              <div className="flex items-center justify-between rounded-lg border border-line bg-card2 px-3 py-2.5">
                <span className="text-muted">What-if 시뮬레이션 (앵커·임대안정·청년주택)</span>
                <Pill tone="muted">기관</Pill>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-line bg-card2 px-3 py-2.5">
                <span className="text-muted">CSV / API 키 발급</span>
                <Pill tone="muted">기관</Pill>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-line bg-card2 px-3 py-2.5">
                <span className="text-muted">정책 ROI 추정 (DiD)</span>
                <Pill tone="muted">기관</Pill>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-muted2">
              상세 정밀 진단·개인식별 데이터는 권한 분리(스펙 §15). 공개 등급은 처방 중심으로 거칠게 표기.
            </p>
          </Panel>
        </div>
      </div>

      {/* 공공예산 유입 흐름 */}
      <Panel className="mt-5">
        <SectionHead
          no="예산"
          title="공공예산 유입 흐름 (나라장터)"
          desc={budgetYear ? `${budgetYear} · 입찰 공고 + 수의계약` : undefined}
        />
        <div className="mb-4 grid grid-cols-3 gap-3">
          <Stat label="관할 총 공공예산" value={`${eok(regionBid + regionSole)}억`} accent="amber" />
          <Stat label="입찰 공고" value={`${eok(regionBid)}억`} accent="blue" />
          <Stat label="수의계약" value={`${eok(regionSole)}억`} accent="amber" />
        </div>
        <div className="mb-2 text-[12px] font-bold text-muted">예산 유입 상위 행정동 ({budgetYear})</div>
        <div className="space-y-1.5">
          {budgetRows.slice(0, 8).map((r) => (
            <Link
              key={r.p.admCd2}
              href={`/place/${r.p.admCd2}`}
              className="flex items-center gap-2.5 rounded-lg border border-line bg-card2 px-3 py-1.5 hover:border-amber"
            >
              <span className="w-24 shrink-0 text-[13px] font-semibold text-ink">{r.p.name}</span>
              <span className="hidden w-16 shrink-0 text-[10px] text-muted2 sm:inline">{r.p.sigungu}</span>
              <div className="flex h-3 flex-1 overflow-hidden rounded-full bg-navy">
                <div className="h-full bg-blue" style={{ width: `${(r.bid / maxBudget) * 100}%` }} title="입찰" />
                <div className="h-full bg-amber" style={{ width: `${(r.sole / maxBudget) * 100}%` }} title="수의계약" />
              </div>
              <span className="w-12 text-right text-[12.5px] font-bold tabular-nums text-ink">{eok(r.total)}억</span>
            </Link>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-4 text-[11px] text-muted2">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-blue" /> 입찰 공고
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber" /> 수의계약
          </span>
          <span className="ml-auto">소멸·재생 동에 예산 집중 시 정책 ROI(DiD) 점검 대상</span>
        </div>
      </Panel>

      <div className="mt-6">
        <ProvisionalBadge />
      </div>
    </PageShell>
  );
}
