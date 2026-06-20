import Link from "next/link";
import type { Report } from "@/lib/types";
import { GradeBadge, MomentumChip, Pill, ProvisionalBadge } from "@/components/ui";
import { GRADE_HEX } from "@/lib/constants";

interface RiserRow {
  admCd2: string;
  name: string;
  sigungu: string;
  klai: number;
  grade: "S" | "A" | "B" | "C" | "D" | "E";
  momentum: number;
}
interface WeeklyBlocks {
  risers: RiserRow[];
  fallers: RiserRow[];
  gentriAlerts: { admCd2: string; name: string; stage: number; g: number }[];
  cliffs: { admCd2: string; name: string; klai: number }[];
  narrativesHot: string[];
  narrativesCold: string[];
  spotlight: { admCd2: string; name: string; klai: number; grade: RiserRow["grade"]; momentum: number };
}

// Flagtale Weekly — 주간 웹진 (스펙 §10.1). 클라이언트 인쇄/PDF 버튼 없음(§15).
export function WeeklyTemplate({ report }: { report: Report }) {
  const b = report.blocks as unknown as WeeklyBlocks;

  return (
    <article className="space-y-8">
      {/* 표지 */}
      <header className="klai-panel p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <span className="klai-eyebrow">Flagtale Weekly · 플래그테일 주간</span>
          <ProvisionalBadge />
        </div>
        <h1 className="mt-3 text-3xl font-black">{report.title}</h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted">{report.summary}</p>
        <div className="mt-3 text-[12px] text-muted2">발행 {report.publishedAt}</div>
      </header>

      {/* KPI 인포그래픽 스트립 */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="이주의 상승" value={b.risers.length} unit="동" accent="#3E9AA8" icon="▲" />
        <Kpi label="이주의 하락" value={b.fallers.length} unit="동" accent="var(--warn)" icon="▼" />
        <Kpi label="신규 젠트리 경보" value={b.gentriAlerts.length} unit="건" accent="#D4861E" icon="⚠" />
        <Kpi label="거래절벽 경보" value={b.cliffs.length} unit="건" accent="var(--warn)" icon="📉" />
      </section>

      {/* 1. 상승/하락 Top */}
      <section className="grid gap-4 md:grid-cols-2">
        <Block title="① 이주의 상승 Top" accent="up">
          <RankList rows={b.risers} />
        </Block>
        <Block title="① 이주의 하락 Top" accent="down">
          <RankList rows={b.fallers} />
        </Block>
      </section>

      {/* 2. 경보 */}
      <section className="grid gap-4 md:grid-cols-2">
        <Block title="② 신규 젠트리피케이션 경보" accent="warn">
          {b.gentriAlerts.length === 0 ? (
            <Empty />
          ) : (
            <ul className="space-y-1.5">
              {b.gentriAlerts.map((a) => (
                <li key={a.admCd2} className="flex items-center justify-between rounded-lg border border-warn/30 bg-warn/10 px-3 py-2">
                  <Link href={`/place/${a.admCd2}`} className="text-[13px] font-bold text-ink hover:text-amber">
                    {a.name}
                  </Link>
                  <span className="text-[12px] font-semibold text-warn">⚠ {a.stage}단계 · G {a.g}</span>
                </li>
              ))}
            </ul>
          )}
        </Block>
        <Block title="② 거래절벽 경보 (시장 위축)" accent="warn">
          {b.cliffs.length === 0 ? (
            <Empty />
          ) : (
            <ul className="space-y-1.5">
              {b.cliffs.slice(0, 6).map((c) => (
                <li key={c.admCd2} className="flex items-center justify-between rounded-lg border border-line bg-card2 px-3 py-2">
                  <Link href={`/place/${c.admCd2}`} className="text-[13px] font-bold text-ink hover:text-amber">
                    {c.name}
                  </Link>
                  <span className="text-[12px] text-muted">KLAI {c.klai}</span>
                </li>
              ))}
            </ul>
          )}
        </Block>
      </section>

      {/* 3. 내러티브 */}
      <Block title="③ 뜨는 / 식는 내러티브">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="mb-1.5 text-[12px] font-bold text-grade-b">🔥 뜨는 서사</div>
            <div className="flex flex-wrap gap-1.5">
              {b.narrativesHot.length ? b.narrativesHot.map((n) => <Pill key={n} tone="blue">{n}</Pill>) : <Empty />}
            </div>
          </div>
          <div>
            <div className="mb-1.5 text-[12px] font-bold text-warn">🧊 식는 서사 (부정)</div>
            <div className="flex flex-wrap gap-1.5">
              {b.narrativesCold.length ? b.narrativesCold.map((n) => <Pill key={n} tone="warn">{n}</Pill>) : <Empty />}
            </div>
          </div>
        </div>
      </Block>

      {/* 4. 스포트라이트 */}
      <Block title="④ 심층 스포트라이트" accent="amber">
        <div className="flex flex-wrap items-center gap-4">
          <div className="text-center">
            <div className="text-3xl font-black tabular-nums text-blue-l">{b.spotlight.klai}</div>
            <div className="text-[10px] text-muted2">KLAI</div>
          </div>
          <div className="flex items-center gap-2">
            <GradeBadge grade={b.spotlight.grade} size="lg" />
            <MomentumChip m={b.spotlight.momentum} />
          </div>
          <div className="flex-1">
            <Link href={`/place/${b.spotlight.admCd2}`} className="text-lg font-extrabold text-ink hover:text-amber">
              {b.spotlight.name}
            </Link>
            <p className="text-[13px] text-muted">이번 주 가장 가파른 상승. 방향·위기·전략 미리보기는 동 리포트에서.</p>
          </div>
          <Link
            href={`/place/${b.spotlight.admCd2}`}
            className="rounded-lg border border-line px-3.5 py-2 text-[13px] font-semibold text-ink hover:bg-card2"
          >
            동 리포트 →
          </Link>
        </div>
      </Block>

      <p className="text-center text-[11px] text-muted2">
        PDF 리포트는 서버에서 생성되어 권한 구독자에게 제공됩니다. (이 웹 뷰어에는 인쇄 버튼이 없습니다 · 스펙 §15)
      </p>
    </article>
  );
}

function Block({ title, accent, children }: { title: string; accent?: "up" | "down" | "warn" | "amber"; children: React.ReactNode }) {
  const bar =
    accent === "up" ? "bg-grade-b" : accent === "down" ? "bg-warn" : accent === "warn" ? "bg-warn" : accent === "amber" ? "bg-amber" : "bg-blue";
  return (
    <div className="klai-panel p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className={`h-4 w-1 rounded ${bar}`} />
        <h2 className="text-[15px] font-extrabold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function RankList({ rows }: { rows: RiserRow[] }) {
  return (
    <ol className="space-y-1.5">
      {rows.map((r, i) => (
        <li key={r.admCd2} className="flex items-center gap-3 rounded-lg border border-line bg-card2 px-3 py-2">
          <span className="w-4 text-center text-[12px] font-bold text-muted2">{i + 1}</span>
          <GradeBadge grade={r.grade} size="sm" />
          <Link href={`/place/${r.admCd2}`} className="min-w-0 flex-1 truncate text-[13px] font-bold text-ink hover:text-amber">
            {r.name}
            <span className="ml-1.5 text-[11px] font-normal text-muted2">{r.sigungu}</span>
          </Link>
          <div className="hidden h-1.5 w-14 shrink-0 overflow-hidden rounded-full bg-navy2/60 sm:block">
            <div
              className="h-full rounded-full"
              style={{
                width: `${r.klai}%`,
                background: `linear-gradient(90deg, ${GRADE_HEX[r.grade]}99, ${GRADE_HEX[r.grade]})`,
                boxShadow: `0 0 5px ${GRADE_HEX[r.grade]}66`,
              }}
            />
          </div>
          <span className="w-7 text-right text-[12px] font-semibold tabular-nums" style={{ color: GRADE_HEX[r.grade] }}>
            {r.klai}
          </span>
          <MomentumChip m={r.momentum} />
        </li>
      ))}
    </ol>
  );
}

function Kpi({ label, value, unit, accent, icon }: { label: string; value: number; unit: string; accent: string; icon: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-line bg-card2/60 p-3.5">
      <span className="absolute left-0 top-0 h-full w-1 rounded-r" style={{ background: accent, boxShadow: `0 0 12px ${accent}` }} />
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted2">
        <span style={{ color: accent }}>{icon}</span>
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-2xl font-black tabular-nums" style={{ color: accent }}>
          {value}
        </span>
        <span className="text-[11px] text-muted2">{unit}</span>
      </div>
    </div>
  );
}

function Empty() {
  return <div className="text-[12px] text-muted2">해당 없음</div>;
}
