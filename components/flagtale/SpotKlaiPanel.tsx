"use client";

import { useEffect, useState } from "react";
import type { MapItem } from "@/lib/flagtale-types";
import type { PlaceScore, Diagnosis, SignalSeries } from "@/lib/types";
import { KlaiGauge } from "@/components/charts/KlaiGauge";
import { ScoreRadar } from "@/components/charts/ScoreRadar";
import { GentriStageBar } from "@/components/charts/GentriStageBar";
import { SignalAnalysis } from "@/components/analysis/SignalAnalysis";
import { usePlan } from "@/lib/usePlan";
import { canUse, FREE_MODE } from "@/lib/tier";
import { narrativeForPlace } from "@/lib/narratives";
import { AreaNarrativeCard } from "./AreaNarrativeCard";
import { ProLock } from "./ProLock";

// 플래그맵 상세의 "매력도 분석" 탭 — 스팟 좌표→가장 가까운 행정동→KLAI 점수·레이더·또래비교·시그널·진단 (Lab 그래프 재사용)
// 등급: Free=게이지·레이더·젠트리·요약 / Pro=내러티브·전략(레버리지)·시그널 분석
type PeerAvg = { d1: number; d2: number; d3: number; d4: number };
type Bundle = {
  props: { admCd2: string; name: string; sigungu: string };
  latest: PlaceScore & { authenticityGap?: number };
  diagnosis: Diagnosis | null;
  signals: SignalSeries | null;
  matchedKm: number;
  peerAvg?: PeerAvg;
  periods?: string[];
  avgSignals?: SignalSeries;
  supplyBoost?: number;
  supply?: { count: number } | null;
};
const TRAJ: Record<string, string> = { rising: "📈 상승", stable: "→ 안정", declining: "📉 쇠퇴", gentrifying: "⚡ 젠트리화" };
const MARKET: Record<string, string> = { active: "🟢 활발", stable: "🟡 안정", shrinking: "🔴 위축(거래절벽)" };
// 등급(추후 메뉴 등급 분리)용 — 심층 데이터 표식. 현재는 노출, 추후 Pro 전용 게이팅.
const ProBadge = () => (FREE_MODE ? null : <span className="ml-1 rounded bg-amber px-1.5 py-0.5 align-middle text-[8.5px] font-black tracking-wide text-onaccent">PRO</span>);

export function SpotKlaiPanel({ item }: { item: MapItem }) {
  const { plan } = usePlan();
  const pro = canUse(plan, "signals"); // 시그널·전략 = Pro 이상
  const [data, setData] = useState<Bundle | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "err">("loading");

  useEffect(() => {
    let alive = true;
    setState("loading"); setData(null);
    fetch(`/api/place/near?lat=${item.lat}&lng=${item.lng}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!alive) return; if (d?.latest) { setData(d); setState("ok"); } else setState("err"); })
      .catch(() => { if (alive) setState("err"); });
    return () => { alive = false; };
  }, [item.lat, item.lng]);

  if (state === "loading") return <div className="py-12 text-center text-[12px] text-muted2">매력도 데이터 불러오는 중…</div>;
  if (state === "err" || !data) return <div className="py-12 text-center text-[12px] text-muted2">이 위치의 매력도 데이터가 아직 없어요.</div>;

  const s = data.latest, dg = data.diagnosis;
  const area = narrativeForPlace(data.props.admCd2); // 핫지역이면 큐레이션 '실제 이야기'
  return (
    <div className="space-y-3.5 py-1">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 text-[12.5px] font-extrabold text-ink">📊 {data.props.name} <span className="text-[11px] font-bold text-muted2">{data.props.sigungu}</span></div>
        <span className="shrink-0 rounded-full bg-card2 px-2 py-0.5 text-[10px] font-bold text-muted2">가까운 행정동 · {data.matchedKm}km</span>
      </div>

      {/* KLAI 게이지 */}
      <div className="flex items-center justify-center rounded-[14px] border border-line bg-card2/40 p-2">
        <KlaiGauge klai={s.klai} grade={s.grade} momentum={s.momentum} size={156} />
      </div>

      {/* 4축 레이더 + 또래(유형) 평균 비교 */}
      <div className="rounded-[14px] border border-line p-2">
        <div className="mb-1 flex items-center justify-between px-1">
          <span className="text-[11px] font-extrabold text-muted2">4축 매력도</span>
          {data.peerAvg && <span className="text-[9.5px] font-bold text-muted2"><span className="text-blue-l">■</span> 이 동네 · <span className="text-muted2">▦</span> 또래 평균</span>}
        </div>
        <ScoreRadar score={s} peerAvg={data.peerAvg} height={208} />
      </div>

      {/* 젠트리 단계 */}
      <div className="rounded-[14px] border border-line p-3">
        <div className="mb-2 text-[11px] font-extrabold text-muted2">젠트리피케이션 단계</div>
        <GentriStageBar current={s.gentriStage} compact />
      </div>

      {/* 추세 · 시장활성도 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-[12px] border border-line p-2.5"><div className="text-[10px] font-bold text-muted2">추세</div><div className="mt-0.5 text-[14px] font-black text-ink">{dg ? (TRAJ[dg.trajectory] ?? dg.trajectory) : "—"}</div></div>
        <div className="rounded-[12px] border border-line p-2.5"><div className="text-[10px] font-bold text-muted2">시장 활성도</div><div className="mt-0.5 text-[13px] font-black text-ink">{MARKET[s.marketVitality] ?? s.marketVitality}</div></div>
      </div>

      {/* 🏪 동네 공급 밀도 — 등록 콘텐츠가 매력도에 가산(네트워크 효과) */}
      {(data.supplyBoost ?? 0) > 0 && (
        <div className="flex items-center justify-between gap-2 rounded-[12px] border border-line bg-card2/40 p-2.5">
          <span className="text-[11.5px] font-bold text-ink">🏪 플래그테일 등록 <b className="text-blue-l">{data.supply?.count}곳</b></span>
          <span className="rounded-full bg-amber px-2 py-0.5 text-[10.5px] font-extrabold text-onaccent">매력도 +{data.supplyBoost}</span>
        </div>
      )}

      {/* 🎭 핫지역 실제 이야기 — 쇼케이스(/methodology)와 동일 데이터로 일관, 공개 */}
      {area && (
        <div>
          <div className="mb-1.5 text-[10.5px] font-extrabold text-muted2">🎭 이 동네의 실제 이야기 · 라이프사이클</div>
          <AreaNarrativeCard n={area} compact href={`/place/${data.props.admCd2}`} />
        </div>
      )}

      {/* 내러티브·전략·시그널 = Pro 이상 */}
      {pro ? (
        <>
          {!area && dg?.narrativeTheme && <div className="rounded-[12px] border border-line p-2.5"><div className="text-[10.5px] font-extrabold text-muted2">🎭 지금 이 동네의 이야기<ProBadge /></div><p className="mt-1 text-[12px] leading-relaxed text-ink">{dg.narrativeTheme}</p></div>}
          {dg?.leverage && <div className="rounded-[12px] border border-line p-2.5"><div className="text-[10.5px] font-extrabold text-muted2">🎯 레버리지 처방<ProBadge /></div><p className="mt-1 text-[12px] leading-relaxed text-ink">{dg.leverage}</p></div>}
          {data.signals && data.periods && (
            <div className="rounded-[14px] border border-line p-3">
              <div className="mb-2 text-[11px] font-extrabold text-muted2">🔬 시그널 분석<ProBadge /></div>
              <SignalAnalysis signals={data.signals} periods={data.periods} avgSignals={data.avgSignals} authenticityGap={data.latest.authenticityGap ?? 0.2} />
            </div>
          )}
        </>
      ) : (
        <ProLock feature="signals" title="시그널 분석 · 레버리지 전략" desc="선행/후행 시그널 패턴과 동네별 성장 처방은 Pro 등급에서 열람할 수 있어요." />
      )}

      <a href={`/place/${data.props.admCd2}`} className="flex items-center justify-between rounded-[12px] bg-card2/50 p-2.5 hover:bg-card2">
        <span className="text-[11.5px] font-bold text-muted">전체 동 리포트 · 원인·전략</span>
        <span className="rounded-full bg-ink px-3 py-1.5 text-[11px] font-extrabold text-white">매력도 Lab에서 보기 →</span>
      </a>
      <p className="text-center text-[10px] leading-relaxed text-muted2">샘플·잠정(Provisional) · 스팟 위치에서 가장 가까운 행정동 기준{FREE_MODE ? " · 현재 전 기능 무료 공개" : ""}</p>
    </div>
  );
}
