import Link from "next/link";
import type { Report } from "@/lib/types";
import type { WeeklyBlocks } from "@/lib/weekly";
import { GradeBadge, MomentumChip, Pill, ProvisionalBadge } from "@/components/ui";
import { GRADE_HEX } from "@/lib/constants";

// Flagtale Weekly — 주간 웹진 (스펙 §10.1). 연구자 관점: 전국 변화·검색·인구 + 성장/쇠퇴 사유.
// 클라이언트 인쇄/PDF 버튼 없음(§15).
export function WeeklyTemplate({ report }: { report: Report }) {
  const b = report.blocks as unknown as WeeklyBlocks;
  const n = b.national;

  return (
    <article className="space-y-8">
      {/* 표지 */}
      <header className="klai-panel relative overflow-hidden p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <span className="klai-eyebrow">Flagtale Weekly · 플래그테일 주간</span>
          <ProvisionalBadge />
        </div>
        <h1 className="mt-3 text-2xl font-black sm:text-3xl">{report.title}</h1>
        <div className="mt-1 text-[12px] text-muted2">발행 {report.publishedAt} · {report.period} · 매주 월요일 자동 발행</div>
        {/* 전국 요약 — 연구자 서술 */}
        <p className="mt-4 max-w-3xl text-[14px] leading-relaxed text-ink/90">{b.overview}</p>
      </header>

      {/* 전국 지표 인포그래픽 스트립 */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <Kpi label="분석 행정동" value={n.totalDongs.toLocaleString()} unit="동" accent="#1E5FA8" icon="◇" />
        <Kpi label="상승" value={n.risingCount.toLocaleString()} unit="동" accent="#3E9AA8" icon="▲" />
        <Kpi label="하락" value={n.decliningCount.toLocaleString()} unit="동" accent="var(--warn)" icon="▼" />
        <Kpi label="평균 KLAI" value={n.avgKlai} unit="" accent="#0F6E5C" icon="●" />
        <Kpi label="검색 추세" value={`${n.searchTrendPct >= 0 ? "+" : ""}${n.searchTrendPct}`} unit="%" accent="#8b6ef6" icon="🔎" />
        <Kpi label="젠트리 경보" value={n.gentriCount.toLocaleString()} unit="곳" accent="#D4861E" icon="⚠" />
        <Kpi label="거래절벽" value={n.cliffCount.toLocaleString()} unit="곳" accent="var(--warn)" icon="📉" />
      </section>

      {/* 1. 성장/쇠퇴 동네 + 사유 */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Block title="① 이번 주 성장 동네 — 왜 뜨는가" accent="up">
          <ReasonList rows={b.risers} dir="up" />
        </Block>
        <Block title="① 이번 주 쇠퇴 동네 — 왜 지는가" accent="down">
          <ReasonList rows={b.fallers} dir="down" />
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
                <li key={a.admCd2} className="rounded-lg border border-warn/30 bg-warn/10 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <Link href={`/place/${a.admCd2}`} className="text-[13px] font-bold text-ink hover:text-amber">
                      {a.name} <span className="text-[11px] font-normal text-muted2">{a.sigungu}</span>
                    </Link>
                    <span className="text-[12px] font-semibold text-warn">⚠ {a.stage}단계 · G {a.g}</span>
                  </div>
                  <div className="mt-0.5 text-[11.5px] text-muted">{a.reason}</div>
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
                <li key={c.admCd2} className="rounded-lg border border-line bg-card2 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <Link href={`/place/${c.admCd2}`} className="text-[13px] font-bold text-ink hover:text-amber">
                      {c.name} <span className="text-[11px] font-normal text-muted2">{c.sigungu}</span>
                    </Link>
                    <span className="text-[12px] text-muted">KLAI {c.klai}</span>
                  </div>
                  <div className="mt-0.5 text-[11.5px] text-muted">{c.reason}</div>
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
              {b.narrativesHot.length ? b.narrativesHot.map((x) => <Pill key={x} tone="blue">{x}</Pill>) : <Empty />}
            </div>
          </div>
          <div>
            <div className="mb-1.5 text-[12px] font-bold text-warn">🧊 식는 서사 (부정)</div>
            <div className="flex flex-wrap gap-1.5">
              {b.narrativesCold.length ? b.narrativesCold.map((x) => <Pill key={x} tone="warn">{x}</Pill>) : <Empty />}
            </div>
          </div>
        </div>
      </Block>

      {/* 4. 스포트라이트 — 서술형 */}
      <Block title="④ 이주의 심층 스포트라이트" accent="amber">
        <div className="flex flex-wrap items-center gap-4">
          <div className="text-center">
            <div className="text-3xl font-black tabular-nums text-blue-l">{b.spotlight.klai}</div>
            <div className="text-[10px] text-muted2">KLAI</div>
          </div>
          <div className="flex items-center gap-2">
            <GradeBadge grade={b.spotlight.grade} size="lg" />
            <MomentumChip m={b.spotlight.momentum} />
          </div>
          <div className="min-w-[160px] flex-1">
            <Link href={`/place/${b.spotlight.admCd2}`} className="text-lg font-extrabold text-ink hover:text-amber">
              {b.spotlight.name} <span className="text-[12px] font-normal text-muted2">{b.spotlight.sigungu}</span>
            </Link>
          </div>
          <Link href={`/diagnose?admCd=${b.spotlight.admCd2}`} className="rounded-lg border border-line px-3.5 py-2 text-[13px] font-semibold text-ink hover:bg-card2">
            방향·위기·전략 →
          </Link>
        </div>
        <p className="mt-3 text-[13px] leading-relaxed text-muted">{b.spotlight.writeup}</p>
      </Block>

      {/* 방법론 주석 */}
      <div className="rounded-xl border border-line bg-card2/50 p-4">
        <div className="mb-1 text-[11px] font-bold text-muted2">방법론 · 데이터</div>
        <p className="text-[11.5px] leading-relaxed text-muted2">{b.methodologyNote}</p>
      </div>

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

function ReasonList({ rows, dir }: { rows: WeeklyBlocks["risers"]; dir: "up" | "down" }) {
  if (!rows.length) return <Empty />;
  return (
    <ol className="space-y-2">
      {rows.map((r, i) => (
        <li key={r.admCd2} className="rounded-lg border border-line bg-card2 px-3 py-2">
          <div className="flex items-center gap-3">
            <span className="w-4 text-center text-[12px] font-bold text-muted2">{i + 1}</span>
            <GradeBadge grade={r.grade} size="sm" />
            <Link href={`/place/${r.admCd2}`} className="min-w-0 flex-1 truncate text-[13px] font-bold text-ink hover:text-amber">
              {r.name}
              <span className="ml-1.5 text-[11px] font-normal text-muted2">{r.sigungu}</span>
            </Link>
            <div className="hidden h-1.5 w-14 shrink-0 overflow-hidden rounded-full bg-navy2/60 sm:block">
              <div
                className="h-full rounded-full"
                style={{ width: `${r.klai}%`, background: `linear-gradient(90deg, ${GRADE_HEX[r.grade]}99, ${GRADE_HEX[r.grade]})`, boxShadow: `0 0 5px ${GRADE_HEX[r.grade]}66` }}
              />
            </div>
            <span className="w-7 text-right text-[12px] font-semibold tabular-nums" style={{ color: GRADE_HEX[r.grade] }}>
              {r.klai}
            </span>
            <MomentumChip m={r.momentum} />
          </div>
          <div className={`mt-1 pl-7 text-[11.5px] leading-snug ${dir === "up" ? "text-grade-b" : "text-warn"}`}>{r.reason}</div>
        </li>
      ))}
    </ol>
  );
}

function Kpi({ label, value, unit, accent, icon }: { label: string; value: number | string; unit: string; accent: string; icon: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-line bg-card2/60 p-3.5">
      <span className="absolute left-0 top-0 h-full w-1 rounded-r" style={{ background: accent, boxShadow: `0 0 12px ${accent}` }} />
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted2">
        <span style={{ color: accent }}>{icon}</span>
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-xl font-black tabular-nums sm:text-2xl" style={{ color: accent }}>
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
