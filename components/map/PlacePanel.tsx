"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { PlaceBundle } from "@/lib/data";
import { ProvisionalBadge, Pill } from "@/components/ui";
import { KlaiGauge } from "@/components/charts/KlaiGauge";
import { ScoreRadar } from "@/components/charts/ScoreRadar";
import { Sparkline } from "@/components/charts/Sparkline";
import { MARKET_LABEL, NARRATIVE_LABEL, TRAJECTORY_LABEL, GRADE_HEX } from "@/lib/constants";

export function PlacePanel({ admCd2, onClose }: { admCd2: string; onClose: () => void }) {
  const [data, setData] = useState<PlaceBundle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(`/api/place/${admCd2}`)
      .then((r) => r.json())
      .then((d) => {
        if (alive) {
          setData(d);
          setLoading(false);
        }
      })
      .catch(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [admCd2]);

  return (
    <div className="pointer-events-auto flex h-full w-[360px] max-w-[88vw] animate-slide-in flex-col border-l border-line bg-navy/95 backdrop-blur-md">
      <div className="flex items-start justify-between border-b border-line p-4">
        <div>
          {loading || !data ? (
            <div className="h-6 w-32 animate-pulse rounded bg-card2" />
          ) : (
            <>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold">{data.props.name}</h2>
                <Pill tone="blue">{data.props.typology}</Pill>
              </div>
              <div className="mt-0.5 text-[12px] text-muted2">
                {data.props.sido} {data.props.sigungu} · {data.props.admCd2}
              </div>
            </>
          )}
        </div>
        <button onClick={onClose} className="rounded-md p-1 text-muted2 hover:bg-card2 hover:text-ink" aria-label="닫기">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {data && !loading ? (
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {/* 점수 헤드라인 — 게이지 */}
          <div className="flex items-center gap-3 rounded-2xl border border-line bg-card2/70 p-3">
            <KlaiGauge klai={data.latest.klai} grade={data.latest.grade} momentum={data.latest.momentum} size={108} />
            <div className="flex flex-1 flex-col gap-1.5">
              <Pill tone={data.latest.marketVitality === "shrinking" ? "warn" : "muted"}>
                시장 {MARKET_LABEL[data.latest.marketVitality]}
              </Pill>
              {data.latest.gentriFlag && <Pill tone="warn">⚠ 젠트리 {data.latest.gentriStage}단계</Pill>}
              <Pill tone="blue">{TRAJECTORY_LABEL[data.diagnosis?.trajectory ?? "stable"]}</Pill>
            </div>
          </div>

          {/* KLAI 추세 + 모멘텀 미니 차트 */}
          {data.series.length > 1 &&
            (() => {
              const klaiSeries = data.series.map((s) => s.klai);
              const momSeries = data.series.map((s) => s.momentum);
              const delta = Math.round((klaiSeries[klaiSeries.length - 1] - klaiSeries[0]) * 10) / 10;
              const momLast = data.latest.momentum;
              const momColor = momLast > 0.3 ? "var(--gB)" : momLast < -0.3 ? "var(--warn)" : "var(--muted2)";
              const momAbs = Math.max(6, ...momSeries.map((m) => Math.abs(m)));
              return (
                <div className="rounded-xl border border-line bg-card2/70 p-3">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber">KLAI 추세</span>
                    <span className="text-[11px] text-muted2">
                      {data.series[0].period}~{data.latest.period} ·{" "}
                      <b className={delta >= 0 ? "text-grade-b" : "text-warn"}>
                        {delta >= 0 ? "+" : ""}
                        {delta}
                      </b>
                    </span>
                  </div>
                  <Sparkline data={klaiSeries} width={304} height={42} color={GRADE_HEX[data.latest.grade]} min={0} max={100} className="w-full" />
                  <div className="mb-1 mt-2 flex items-center justify-between border-t border-line/60 pt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted2">모멘텀</span>
                    <span className="text-[10px] font-semibold tabular-nums" style={{ color: momColor }}>
                      {momLast > 0 ? "+" : ""}
                      {momLast}
                    </span>
                  </div>
                  <Sparkline data={momSeries} width={304} height={26} color={momColor} min={-momAbs} max={momAbs} baseline={0} fill={false} className="w-full" />
                </div>
              );
            })()}

          {/* 4축 레이더 */}
          <div>
            <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-amber">4축 매력 구성</div>
            <ScoreRadar score={data.latest} height={200} />
          </div>

          {/* 지역 흐름 미니 (인구·공공예산) */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-line bg-card2 px-3 py-2">
              <div className="text-[10px] text-muted2">인구 ({data.latest.period.slice(0, 4)})</div>
              <div className="text-[15px] font-extrabold tabular-nums text-ink">
                {data.latest.population.toLocaleString()}
              </div>
              <div className={`text-[11px] font-semibold ${data.latest.popChangeRate >= 0 ? "text-grade-b" : "text-warn"}`}>
                {data.latest.popChangeRate > 0 ? "+" : ""}
                {data.latest.popChangeRate}%/년
              </div>
            </div>
            <div className="rounded-lg border border-line bg-card2 px-3 py-2">
              <div className="text-[10px] text-muted2">공공예산 유입</div>
              <div className="text-[15px] font-extrabold tabular-nums text-amber">{data.latest.budgetInflow}억</div>
              <div className="text-[11px] text-muted2">나라장터 /년</div>
            </div>
          </div>

          {/* 진단 요약 */}
          {data.diagnosis && (
            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber">진단 요약</div>
              <div className="grid grid-cols-2 gap-2 text-[12px]">
                <SummaryCell label="추세" value={TRAJECTORY_LABEL[data.diagnosis.trajectory]} />
                <SummaryCell label="젠트리 단계" value={data.diagnosis.gentriStageName} />
                <SummaryCell label="내러티브" value={NARRATIVE_LABEL[data.latest.narrativeStage]} />
                <SummaryCell label="레버리지" value={data.diagnosis.leverage} />
              </div>
              {data.diagnosis.risks[0] && (
                <div className="rounded-lg border border-warn/30 bg-warn/10 px-3 py-2">
                  <div className="text-[12px] font-bold text-warn">⚠ {data.diagnosis.risks[0].title}</div>
                </div>
              )}
              {/* 상세는 페이월 (스펙 §7) */}
              <div className="relative overflow-hidden rounded-lg border border-line">
                <div className="select-none p-3 text-[12px] text-muted blur-[5px]">
                  {data.diagnosis.strategy.map((s) => s.detail).join(" ")}
                </div>
                <div className="absolute inset-0 grid place-items-center bg-navy/40">
                  <span className="klai-tag">🔒 원인·전략 상세는 유료</span>
                </div>
              </div>
            </div>
          )}

          <ProvisionalBadge />
        </div>
      ) : (
        <div className="flex-1 space-y-3 p-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-card2" />
          ))}
        </div>
      )}

      {data && !loading && (
        <div className="border-t border-line p-3">
          <div className="grid grid-cols-2 gap-2">
            <Link
              href={`/place/${admCd2}`}
              className="rounded-lg border border-line py-2 text-center text-[13px] font-semibold text-ink hover:bg-card2"
            >
              동 리포트
            </Link>
            <Link
              href={`/diagnose?admCd=${admCd2}`}
              className="rounded-lg bg-amber py-2 text-center text-[13px] font-bold text-[#1a1206] hover:bg-[#e0951f]"
            >
              상세 진단(유료)
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-card2 px-2.5 py-1.5">
      <div className="text-[10px] text-muted2">{label}</div>
      <div className="text-[12.5px] font-semibold text-ink">{value}</div>
    </div>
  );
}
