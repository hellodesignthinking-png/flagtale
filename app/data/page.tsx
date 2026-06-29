import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { Panel, Pill, SectionHead, Stat } from "@/components/ui";
import { DonutChart } from "@/components/charts/DonutChart";
import { SOURCES, statusOf, type SourceStatus } from "@/lib/sources";
import { ingestedSources } from "@/lib/data";

export const metadata: Metadata = { title: "데이터 출처 · 연동 상태" };
export const dynamic = "force-dynamic"; // 환경변수(키) 상태 실시간 반영

const BADGE: Record<SourceStatus, { label: string; tone: "amber" | "blue" | "warn"; dot: string }> = {
  real: { label: "실연동 ✓", tone: "blue", dot: "var(--gB)" },
  "key-set": { label: "키 설정됨", tone: "amber", dot: "var(--amber)" },
  pending: { label: "미연동 (키 필요)", tone: "warn", dot: "var(--warn)" },
};

export default function DataPage() {
  const ingested = ingestedSources();
  const rows = SOURCES.map((s) => ({ src: s, ...statusOf(s, ingested) }));
  const realCount = rows.filter((r) => r.status === "real").length;
  const keySetCount = rows.filter((r) => r.status === "key-set").length;
  const pendingCount = rows.filter((r) => r.status === "pending").length;

  return (
    <PageShell>
      <div className="mb-6">
        <span className="klai-eyebrow">Data Sources</span>
        <h1 className="mt-1 font-display text-[clamp(28px,4vw,40px)] font-black tracking-[-0.03em]">데이터 출처 · 연동 상태</h1>
        <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-muted">
          각 지표가 <b className="text-ink">어떤 실제 소스</b>에서 오는지, 지금 <b className="text-ink">실연동됐는지</b>, 아니면
          어떤 <b className="text-ink">키가 없어 미연동</b>인지 투명하게 표시합니다. 한국 공공데이터 키는 사용자 본인 계정으로만 발급되어,
          키를 넣으면 해당 소스가 실데이터로 전환됩니다.
        </p>
      </div>

      {/* 연동 커버리지 인포그래픽 */}
      <Panel className="mb-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
          <div className="relative shrink-0">
            <DonutChart
              size={140}
              segments={[
                { label: "실연동", value: realCount, color: "var(--gB)" },
                { label: "키 설정됨", value: keySetCount, color: "var(--amber)" },
                { label: "미연동", value: pendingCount, color: "var(--warn)" },
              ]}
              centerLabel={`${Math.round((realCount / (rows.length || 1)) * 100)}%`}
              centerSub="실연동"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-2 text-[13px] font-bold text-ink">소스 연동 현황 · 총 {rows.length}종</div>
            <div className="space-y-2">
              {[
                { label: "실연동 (실데이터)", v: realCount, color: "var(--gB)", desc: "지금 실제 소스로 작동" },
                { label: "키 설정됨", v: keySetCount, color: "var(--amber)", desc: "인제스트 시 실데이터 전환" },
                { label: "미연동 (키 필요)", v: pendingCount, color: "var(--warn)", desc: "키 발급 후 연동" },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color, boxShadow: `0 0 6px ${s.color}` }} />
                  <span className="w-32 shrink-0 text-[12.5px] font-semibold text-ink">{s.label}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-navy2/60">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(s.v / (rows.length || 1)) * 100}%`, background: `linear-gradient(90deg, ${s.color}99, ${s.color})` }}
                    />
                  </div>
                  <span className="w-7 text-right text-[13px] font-black tabular-nums" style={{ color: s.color }}>
                    {s.v}
                  </span>
                  <span className="hidden w-44 text-[11px] text-muted2 md:block">{s.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Panel>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="실연동 소스" value={realCount} accent="blue" sub="경계·인구·상권·빈집·건축물" />
        <Stat label="키 설정됨" value={keySetCount} accent="amber" sub="인제스트 시 실데이터 전환" />
        <Stat label="키 필요(미연동)" value={pendingCount} accent="warn" sub="키 발급 후 연동" />
        <Stat label="기본 시계열" value={<span className="text-lg">인구 10년</span>} sub="2016~2025" />
      </div>

      <Panel className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-line bg-card2/50 text-[11px] text-muted2">
                <th className="px-4 py-2.5 font-semibold">지표</th>
                <th className="px-3 py-2.5 font-semibold">실제 출처</th>
                <th className="px-3 py-2.5 font-semibold">상태</th>
                <th className="px-3 py-2.5 font-semibold">필요 키 / 이유</th>
                <th className="px-3 py-2.5 font-semibold">발급</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ src, status, reason }) => {
                const b = BADGE[status];
                return (
                  <tr key={src.id} className="border-b border-line/50 align-top">
                    <td className="px-4 py-3">
                      <div className="font-bold text-ink">{src.metric}</div>
                      {src.axis && <div className="text-[10.5px] text-muted2">{src.axis}</div>}
                      <div className="text-[10.5px] text-muted2">갱신 {src.cadence}</div>
                    </td>
                    <td className="px-3 py-3 text-muted">{src.source}</td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ background: b.dot }} />
                        <Pill tone={b.tone}>{b.label}</Pill>
                      </span>
                    </td>
                    <td className="px-3 py-3 text-[11.5px] text-muted">
                      {src.keyEnv.length > 0 ? (
                        <code className="rounded bg-navy px-1.5 py-0.5 text-[11px] text-blue-l">{src.keyEnv.join(" · ")}</code>
                      ) : (
                        <span className="text-grade-b">키 불필요</span>
                      )}
                      <div className="mt-1 text-[11px] text-muted2">{reason}</div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <a href={src.url} target="_blank" rel="noopener noreferrer" aria-label={`${src.source} 키 발급처 (새 창)`} className="whitespace-nowrap text-[12.5px] text-blue-l hover:underline">
                        발급처 ↗
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel className="mt-5">
        <SectionHead title="실데이터 연동 방법" desc="키 → 인제스트 → 실데이터" />
        <ol className="space-y-2 text-[13px] text-muted">
          <li>
            1. <code className="rounded bg-navy px-1.5 py-0.5 text-blue-l">.env.local</code> 에 보유한 키를 넣습니다 (위 표의 필요 키).
          </li>
          <li>
            2. <code className="rounded bg-navy px-1.5 py-0.5 text-blue-l">npm run ingest</code> — 키가 있는 소스만 실데이터를 받아
            <code className="ml-1 rounded bg-navy px-1.5 py-0.5 text-blue-l">data/</code> 에 기록(가짜 데이터 덮어씀)하고
            <code className="ml-1 rounded bg-navy px-1.5 py-0.5 text-blue-l">data/.ingested.json</code> 에 표시합니다.
          </li>
          <li>3. 키 없는 소스는 그대로 <b className="text-warn">미연동</b>으로 남아 이 페이지에 이유가 표시됩니다.</li>
        </ol>
        <p className="mt-3 text-[12px] text-muted2">
          ⚠ 현재 <b className="text-muted">KLAI 점수·신호·조달</b>은 예시(합성)입니다. 경계·인구·상권·빈집·건축물은 <b className="text-ink">실데이터</b>. 위 절차로 나머지도 소스별 실데이터로 대체됩니다.
        </p>
      </Panel>
    </PageShell>
  );
}
