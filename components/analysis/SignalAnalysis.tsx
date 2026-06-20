import { analyzeSignals, SIGNAL_META, type SignalPattern } from "@/lib/signals";
import type { SignalSeries } from "@/lib/types";
import { SignalChart } from "@/components/charts/SignalChart";
import { Pill } from "@/components/ui";

const ROLE_COLOR = Object.fromEntries(SIGNAL_META.map((m) => [m.key, m.color])) as Record<string, string>;

const PATTERN_TONE: Record<SignalPattern, { bg: string; fg: string; border: string }> = {
  narrative_led: { bg: "rgba(15,110,92,.14)", fg: "var(--gB)", border: "rgba(62,154,168,.4)" },
  broad_rise: { bg: "rgba(30,95,168,.14)", fg: "var(--blue-l)", border: "rgba(75,156,211,.4)" },
  capital_led: { bg: "rgba(255,122,61,.12)", fg: "var(--warn)", border: "rgba(255,122,61,.4)" },
  decline: { bg: "rgba(162,58,42,.14)", fg: "#e0856f", border: "rgba(210,105,30,.4)" },
  flat: { bg: "rgba(146,168,198,.1)", fg: "var(--muted)", border: "var(--line)" },
};

// **bold** 만 간단 파싱
function Rich({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((p, i) => (i % 2 === 1 ? <b key={i} className="text-ink">{p}</b> : <span key={i}>{p}</span>))}
    </>
  );
}

const STATUS = {
  good: { dot: "var(--gB)", label: "양호" },
  watch: { dot: "var(--amber)", label: "주의" },
  bad: { dot: "var(--warn)", label: "경보" },
  info: { dot: "var(--muted2)", label: "확인" },
} as const;

export function SignalAnalysis({
  signals,
  periods,
  authenticityGap = 0.2,
}: {
  signals: SignalSeries;
  periods: string[];
  authenticityGap?: number;
}) {
  const a = analyzeSignals(signals, periods, authenticityGap);
  const tone = PATTERN_TONE[a.pattern];

  return (
    <div className="space-y-4">
      {/* 패턴 헤드라인 */}
      <div
        className="flex flex-wrap items-center gap-3 rounded-xl border p-3"
        style={{ background: tone.bg, borderColor: tone.border }}
      >
        <span className="text-sm font-extrabold" style={{ color: tone.fg }}>
          {a.patternLabel}
        </span>
        <span className="text-[12px] text-muted">
          동조도 정점 <b className="text-ink">{a.peakValue}%</b> · {a.peakPeriod}
        </span>
        {a.leader && (
          <span className="ml-auto text-[12px] text-muted2">
            선행: <span style={{ color: ROLE_COLOR[a.leader.key] }} className="font-bold">{a.leader.label}</span>
          </span>
        )}
      </div>

      {/* 그래프 */}
      <SignalChart signals={signals} periods={periods} comovement={a.comovement} height={300} />

      {/* 선행 순서 (lead-lag) */}
      {a.leadOrder.length > 1 && (
        <div className="rounded-xl border border-line bg-card2/40 p-3">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-amber">
            먼저 움직인 순서 (선행 → 후행)
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {a.leadOrder.map((o, i) => (
              <span key={o.key} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-muted2">→</span>}
                <span
                  className="rounded-md border px-2 py-1 text-[12px] font-semibold"
                  style={{ borderColor: ROLE_COLOR[o.key], color: ROLE_COLOR[o.key] }}
                >
                  {o.label}
                  <span className="ml-1 text-[10px] text-muted2">{o.at}</span>
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 이유 (왜 함께 올랐나) */}
      <div className="rounded-xl border border-line bg-navy/40 p-4">
        <div className="mb-1.5 flex items-center gap-2">
          <span className="text-[15px]">🔎</span>
          <span className="text-[13px] font-bold text-ink">왜 모든 데이터가 함께 올랐나</span>
        </div>
        <p className="text-[13.5px] leading-relaxed text-muted">
          <Rich text={a.reason} />
        </p>
      </div>

      {/* 방향 + 전략 */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-blue/30 bg-blue/5 p-3">
          <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-blue-l">로컬 방향</div>
          <p className="text-[13px] leading-relaxed text-ink">{a.direction}</p>
        </div>
        <div className="rounded-xl border border-line bg-card2/40 p-3">
          <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-amber">전략</div>
          <ul className="space-y-1.5">
            {a.strategy.map((s, i) => (
              <li key={i} className="flex gap-2 text-[12.5px] text-muted">
                <span className="mt-0.5 text-grade-b">›</span>
                <span><Rich text={s} /></span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 확인 방법 (검증 체크리스트) */}
      <div className="rounded-xl border border-line bg-card2/40 p-3">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber">
            어떻게 확인하나 — 검증 체크리스트
          </span>
          <Pill tone="muted">기획서 §5.1·§5.6·§3.3-D</Pill>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {a.verify.map((v, i) => (
            <div key={i} className="rounded-lg border border-line bg-navy/40 px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: STATUS[v.status].dot }} />
                <span className="text-[12.5px] font-bold text-ink">{v.title}</span>
                <span className="ml-auto text-[10px]" style={{ color: STATUS[v.status].dot }}>
                  {STATUS[v.status].label}
                </span>
              </div>
              <div className="mt-1 text-[12px] leading-snug text-muted">
                <Rich text={v.detail} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
