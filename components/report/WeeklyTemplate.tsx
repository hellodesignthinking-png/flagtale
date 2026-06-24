import Link from "next/link";
import type { Report } from "@/lib/types";
import type { WeeklyBlocks } from "@/lib/weekly";
import { GradeBadge, MomentumChip, Pill, ProvisionalBadge } from "@/components/ui";
import { GRADE_HEX } from "@/lib/constants";
import { DonutChart } from "@/components/charts/DonutChart";
import { WeeklyMap, type WeeklyMapPoint } from "@/components/report/WeeklyMap";

// Flagtale Weekly — 주간 웹진 (스펙 §10.1). 연구자 관점: 전국 변화·검색·인구 + 성장/쇠퇴 사유.
// 클라이언트 인쇄/PDF 버튼 없음(§15).
export function WeeklyTemplate({ report }: { report: Report }) {
  const b = report.blocks as unknown as WeeklyBlocks;
  const n = b.national;

  // 전국 지도 핀(성장/쇠퇴/스포트라이트, admCd2 중복 제거 — 스포트라이트 우선)
  const points: WeeklyMapPoint[] = [];
  const seen = new Set<string>();
  const pushPt = (p: { admCd2: string; name: string; sigungu: string; klai: number; momentum: number; lng: number; lat: number; reason?: string }, kind: WeeklyMapPoint["kind"]) => {
    if (!p.admCd2 || seen.has(p.admCd2)) return;
    seen.add(p.admCd2);
    points.push({ admCd2: p.admCd2, name: p.name, sigungu: p.sigungu, klai: p.klai, momentum: p.momentum, lng: p.lng, lat: p.lat, reason: p.reason, kind });
  };
  pushPt(b.spotlight, "spotlight");
  b.risers.forEach((r) => pushPt(r, "riser"));
  b.fallers.forEach((r) => pushPt(r, "faller"));

  // 상승/하락/보합 구성(도넛)
  const rising = n.risingCount;
  const declining = n.decliningCount;
  const neutral = Math.max(0, n.totalDongs - rising - declining);
  const risePct = Math.round((rising / (n.totalDongs || 1)) * 100);

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

      {/* 전국 변화 지도 + 상승/하락 구성 */}
      <section className="klai-panel p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="h-4 w-1 rounded bg-blue" />
          <h2 className="text-[15px] font-extrabold">전국 변화 지도 — 이주의 핵심 동네</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
          <div>
            <WeeklyMap points={points} />
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px]">
              <Legend color="#1f9d57" label="▲ 성장 동네" />
              <Legend color="#d2691e" label="▼ 쇠퇴 동네" />
              <Legend color="#D4861E" label="★ 스포트라이트" />
              <span className="text-muted2">핀을 누르면 사유·진단 링크가 열립니다</span>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-line bg-card2/40 p-4">
            <div className="text-[12px] font-bold text-muted2">전국 상승 / 하락 구성</div>
            <DonutChart
              segments={[
                { label: "상승", value: rising, color: "#3E9AA8" },
                { label: "하락", value: declining, color: "#D2691E" },
                { label: "보합", value: neutral, color: "#2a3550" },
              ]}
              size={150}
              centerLabel={`${risePct}%`}
              centerSub="상승 비중"
            />
            <div className="grid w-full grid-cols-3 gap-2 text-center">
              <MiniStat label="상승" value={rising.toLocaleString()} color="#3E9AA8" />
              <MiniStat label="하락" value={declining.toLocaleString()} color="#D2691E" />
              <MiniStat label="보합" value={neutral.toLocaleString()} color="var(--muted2)" />
            </div>
          </div>
        </div>
      </section>

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

      {/* 1-b. 모멘텀 스펙트럼 (다이버징 바) */}
      <Block title="① 이주의 모멘텀 스펙트럼 — 상위 변동 동네">
        <MomentumSpectrum risers={b.risers} fallers={b.fallers} />
        <div className="mt-2 flex items-center justify-center gap-4 text-[11px] text-muted2">
          <Legend color="#3E9AA8" label="상승(+)" />
          <Legend color="#D2691E" label="하락(−)" />
          <span>막대 길이 = 모멘텀 크기</span>
        </div>
      </Block>

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

      {/* 3.5 진정성 갭 — 과열 / 미발견 (검색 수요 vs 등록 공급) */}
      {(b.gapHype?.length || b.gapHidden?.length) ? (
        <section className="grid gap-4 md:grid-cols-2">
          <Block title="🎭 과열·거품 주의 (검색 ≫ 등록)" accent="warn">
            {b.gapHype?.length ? (
              <ul className="space-y-1.5">
                {b.gapHype.map((g) => (
                  <li key={g.admCd2} className="rounded-lg border border-warn/30 bg-warn/10 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <Link href={`/place/${g.admCd2}`} className="text-[13px] font-bold text-ink hover:text-amber">
                        {g.name} <span className="text-[11px] font-normal text-muted2">{g.sigungu}</span>
                      </Link>
                      <span className="text-[12px] font-semibold text-warn">🔴 갭 +{g.gap}</span>
                    </div>
                    <div className="mt-0.5 text-[11.5px] text-muted">{g.reason}</div>
                  </li>
                ))}
              </ul>
            ) : <Empty />}
          </Block>
          <Block title="🎭 미발견 강세 (등록 ≫ 검색)">
            {b.gapHidden?.length ? (
              <ul className="space-y-1.5">
                {b.gapHidden.map((g) => (
                  <li key={g.admCd2} className="rounded-lg border border-line bg-card2 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <Link href={`/place/${g.admCd2}`} className="text-[13px] font-bold text-ink hover:text-amber">
                        {g.name} <span className="text-[11px] font-normal text-muted2">{g.sigungu}</span>
                      </Link>
                      <span className="text-[12px] font-semibold text-grade-b">🟢 갭 {g.gap}</span>
                    </div>
                    <div className="mt-0.5 text-[11.5px] text-muted">{g.reason}</div>
                  </li>
                ))}
              </ul>
            ) : <Empty />}
          </Block>
        </section>
      ) : null}

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

      {/* 5. 전국 동향 심층 분석 — 무엇이, 왜 (논리적 설명) */}
      <Block title="⑤ 전국 동향 심층 분석 — 무엇이, 왜" accent="amber">
        <div className="mb-4">
          <div className="mb-2 text-[12px] font-bold text-ink">📌 이주의 전국 이슈</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {b.analysis.events.map((e) => (
              <div key={e.title} className="rounded-lg border border-line bg-card2 p-3">
                <div className="text-[12.5px] font-bold text-ink">{e.title}</div>
                <p className="mt-1 text-[11.5px] leading-relaxed text-muted">{e.detail}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-[12px] font-bold text-grade-b">
              <span className="h-3 w-1 rounded bg-grade-b" />성장하는 이유
            </div>
            <ul className="space-y-2">
              {b.analysis.growthDrivers.map((d) => (
                <li key={d.title} className="rounded-lg border border-grade-b/25 bg-grade-b/5 p-3">
                  <div className="text-[12px] font-bold text-ink">{d.title}</div>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-muted">{d.detail}</p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-[12px] font-bold text-warn">
              <span className="h-3 w-1 rounded bg-warn" />쇠락하는 이유
            </div>
            <ul className="space-y-2">
              {b.analysis.declineDrivers.map((d) => (
                <li key={d.title} className="rounded-lg border border-warn/25 bg-warn/5 p-3">
                  <div className="text-[12px] font-bold text-ink">{d.title}</div>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-muted">{d.detail}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-4 rounded-xl border border-amber/30 bg-amber/5 p-3.5">
          <div className="mb-1 text-[12px] font-bold text-amber">종합 전망 · 정책 함의</div>
          <p className="text-[12.5px] leading-relaxed text-muted">{b.analysis.outlook}</p>
        </div>
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

const MV: Record<string, string> = { active: "활발", stable: "안정", shrinking: "위축(거래절벽)" };
const NS: Record<string, string> = { formation: "형성", spread: "확산", peak: "절정", decline: "쇠퇴" };

// 클릭(▶)하면 펼쳐지는 상세 사유 — 네이티브 <details>(JS 없이 동작, 서버 렌더)
function ReasonList({ rows, dir }: { rows: WeeklyBlocks["risers"]; dir: "up" | "down" }) {
  if (!rows.length) return <Empty />;
  const tone = dir === "up" ? "text-grade-b" : "text-warn";
  const barColor = dir === "up" ? "#3E9AA8" : "#D2691E";
  return (
    <ol className="space-y-2">
      {rows.map((r, i) => (
        <li key={r.admCd2}>
          <details className="group rounded-lg border border-line bg-card2 open:border-blue/40 open:bg-navy/30">
            <summary className="flex cursor-pointer list-none items-center gap-2.5 px-3 py-2 [&::-webkit-details-marker]:hidden">
              <span className="w-4 text-center text-[12px] font-bold text-muted2">{i + 1}</span>
              <GradeBadge grade={r.grade} size="sm" />
              <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-ink">
                {r.name}
                <span className="ml-1.5 text-[11px] font-normal text-muted2">{r.sigungu}</span>
              </span>
              <div className="hidden h-1.5 w-12 shrink-0 overflow-hidden rounded-full bg-navy2/60 sm:block">
                <div className="h-full rounded-full" style={{ width: `${r.klai}%`, background: `linear-gradient(90deg, ${GRADE_HEX[r.grade]}99, ${GRADE_HEX[r.grade]})` }} />
              </div>
              <span className="w-7 text-right text-[12px] font-semibold tabular-nums" style={{ color: GRADE_HEX[r.grade] }}>
                {r.klai}
              </span>
              <MomentumChip m={r.momentum} />
              <span className="w-3 shrink-0 text-center text-muted2 transition-transform group-open:rotate-90">›</span>
            </summary>
            <div className="border-t border-line px-3 py-3">
              <div className={`mb-2.5 text-[12px] font-semibold ${tone}`}>{r.reason}</div>
              {/* 4축 미니 바 */}
              <div className="mb-2.5 grid grid-cols-4 gap-2">
                {([["D1 인구", r.detail.d1], ["D2 상권", r.detail.d2], ["D3 공간", r.detail.d3], ["D4 인식", r.detail.d4]] as [string, number][]).map(([k, v]) => (
                  <div key={k}>
                    <div className="flex justify-between text-[10px] text-muted2">
                      <span>{k}</span>
                      <span className="tabular-nums">{v}</span>
                    </div>
                    <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-navy2/60">
                      <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, v))}%`, background: barColor }} />
                    </div>
                  </div>
                ))}
              </div>
              {/* 핵심 지표 태그 */}
              <div className="mb-2.5 flex flex-wrap gap-1.5">
                <Tag>젠트리 {r.detail.gentriStage}단계</Tag>
                <Tag>시장 {MV[r.detail.marketVitality] ?? r.detail.marketVitality}</Tag>
                <Tag>내러티브 {NS[r.detail.narrativeStage] ?? r.detail.narrativeStage}</Tag>
                <Tag>
                  인구 {r.detail.popChangeRate >= 0 ? "+" : ""}
                  {r.detail.popChangeRate}%
                </Tag>
                {r.detail.budgetInflow >= 1 && <Tag>공공예산 {Math.round(r.detail.budgetInflow)}억</Tag>}
                {r.detail.negativeNarrative && <Tag warn>부정서사 갭{r.detail.authenticityGap}</Tag>}
              </div>
              {/* 논리적 설명 */}
              <p className="text-[12px] leading-relaxed text-muted">{r.detail.explanation}</p>
              <div className="mt-2.5 flex gap-4 text-[11.5px]">
                <Link href={`/place/${r.admCd2}`} className="font-semibold text-blue-l hover:underline">
                  동 리포트 →
                </Link>
                <Link href={`/diagnose?admCd=${r.admCd2}`} className="font-semibold text-blue-l hover:underline">
                  정밀 진단 →
                </Link>
              </div>
            </div>
          </details>
        </li>
      ))}
    </ol>
  );
}

function Tag({ children, warn }: { children: React.ReactNode; warn?: boolean }) {
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${warn ? "border-warn/40 bg-warn/10 text-warn" : "border-line bg-navy/40 text-muted"}`}>
      {children}
    </span>
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

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-semibold" style={{ color }}>
      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
      {label}
    </span>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg border border-line bg-navy/40 py-2">
      <div className="text-lg font-black tabular-nums" style={{ color }}>
        {value}
      </div>
      <div className="text-[10.5px] text-muted2">{label}</div>
    </div>
  );
}

// 다이버징 바 — 상승(우/청록)·하락(좌/주황) 모멘텀을 한눈에
function MomentumSpectrum({ risers, fallers }: { risers: WeeklyBlocks["risers"]; fallers: WeeklyBlocks["fallers"] }) {
  const all = [...risers.map((r) => ({ ...r, up: true })), ...fallers.map((r) => ({ ...r, up: false }))].sort((a, b) => b.momentum - a.momentum);
  const maxAbs = Math.max(1, ...all.map((r) => Math.abs(r.momentum)));
  return (
    <div className="space-y-1">
      {all.map((r) => {
        const pct = (Math.abs(r.momentum) / maxAbs) * 48; // 좌/우 각 48%
        const color = r.up ? "#3E9AA8" : "#D2691E";
        return (
          <div key={r.admCd2} className="flex items-center gap-2 text-[11.5px]">
            <Link href={`/place/${r.admCd2}`} className="w-24 shrink-0 truncate text-right text-muted hover:text-ink">
              {r.name}
            </Link>
            <div className="relative h-3.5 flex-1">
              <div className="absolute left-1/2 top-0 h-full w-px bg-line" />
              <div
                className="absolute top-0 h-full rounded"
                style={r.up ? { left: "50%", width: `${pct}%`, background: color, boxShadow: `0 0 5px ${color}66` } : { right: "50%", width: `${pct}%`, background: color, boxShadow: `0 0 5px ${color}66` }}
              />
            </div>
            <span className="w-10 shrink-0 text-right font-bold tabular-nums" style={{ color }}>
              {r.up ? "+" : ""}
              {r.momentum}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Empty() {
  return <div className="text-[12px] text-muted2">해당 없음</div>;
}
