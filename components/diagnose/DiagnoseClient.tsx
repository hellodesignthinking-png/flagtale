"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type {
  DistrictProps,
  Diagnosis,
  PlaceScore,
  SignalSeries,
  DemographicYear,
  ProcurementPlace,
} from "@/lib/types";
import type { RegionComparison } from "@/lib/data";
import type { Corrected } from "@/lib/corrected";
import type { SanggaStats } from "@/lib/connectors/sangga";
import type { RebForPlace } from "@/lib/connectors/reb";
import type { SeoulSales } from "@/lib/connectors/seoulsales";
import type { LivingPop } from "@/lib/connectors/livingpop";
import type { CultureInfo } from "@/lib/connectors/culture";
import type { AnchorStore } from "@/lib/connectors/anchor";
import type { VenuesResult } from "@/lib/connectors/venues";
import type { DriverAttribution } from "@/lib/driver";
import { GradeBadge, MomentumChip, Pill, ProvisionalBadge, Stat } from "@/components/ui";
import { KlaiGauge } from "@/components/charts/KlaiGauge";
import { ScoreRadar } from "@/components/charts/ScoreRadar";
import { SubBars } from "@/components/charts/SubBars";
import { CompositionDiagram } from "@/components/charts/CompositionDiagram";
import { TrendChart, MomentumTrend } from "@/components/charts/TrendChart";
import { PopulationTrend, MigrationBars } from "@/components/charts/PopulationTrend";
import { BudgetFlow, BudgetCategoryBars } from "@/components/charts/BudgetFlow";
import { ProcurementTable } from "@/components/charts/ProcurementTable";
import { CityCompare, RatioCompare } from "@/components/charts/CityCompare";
import { GentriStageBar } from "@/components/charts/GentriStageBar";
import { CausalLoop } from "@/components/charts/CausalLoop";
import { SignalAnalysis } from "@/components/analysis/SignalAnalysis";
import { DiagnoseMap } from "@/components/diagnose/DiagnoseMap";
import { GRADE_LABEL, MARKET_LABEL, NARRATIVE_LABEL, TRAJECTORY_LABEL } from "@/lib/constants";

interface DiagnoseResult {
  query: string;
  geocoded: { matched: string; lng: number; lat: number; source: string } | null;
  place: DistrictProps;
  latest: PlaceScore;
  series: PlaceScore[];
  diagnosis: Diagnosis | null;
  signals: SignalSeries | null;
  demographics: DemographicYear[];
  procurement: ProcurementPlace | null;
  peer: { d1: number; d2: number; d3: number; d4: number };
  comparison: RegionComparison | null;
  popReal: boolean;
  corrected: Corrected | null;
  naver: { searchTrend: { period: string; ratio: number }[]; newsTotal: number; query: string } | null;
  sangga: SanggaStats | null;
  reb: RebForPlace | null;
  sales: SeoulSales | null;
  living: LivingPop | null;
  culture: CultureInfo | null;
  anchor: AnchorStore[] | null;
  venues: VenuesResult | null;
  drivers: DriverAttribution;
  periods: string[];
  reportId: string;
}

export function DiagnoseClient({ initialQuery = "", initialAdmCd }: { initialQuery?: string; initialAdmCd?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DiagnoseResult | null>(null);

  // admCd가 있으면 동명 지오코딩(모호) 대신 그 행정동을 직접 진단
  async function runDiagnose(q: string, admCd?: string) {
    if (!admCd && !q.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(admCd ? { admCd } : { address: q }),
      });
      if (!res.ok) {
        const e = await res.json();
        setError(e.message || "진단에 실패했습니다.");
        setLoading(false);
        return;
      }
      setResult(await res.json());
    } catch {
      setError("네트워크 오류");
    }
    setLoading(false);
  }

  useEffect(() => {
    if (initialAdmCd) runDiagnose(initialQuery, initialAdmCd);
    else if (initialQuery) runDiagnose(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const d = result?.diagnosis;
  const popFirst = result?.demographics[0];
  const popLast = result?.demographics[result.demographics.length - 1];
  const proc = result?.procurement?.annual ?? [];
  const cumBudget = Math.round(proc.reduce((s, a) => s + a.total, 0) / 10000);

  return (
    <div className="space-y-6">
      {/* 입력 */}
      <div className="klai-panel p-5">
        <label className="text-[13px] font-semibold text-muted">주소 · 지번 · 동명 입력</label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runDiagnose(query)}
            placeholder="예: 서울 성동구 성수이로 66 / 성수동 / 한들동 123-4"
            className="h-11 flex-1 rounded-lg border border-line bg-navy px-3.5 text-[14px] text-ink placeholder:text-muted2 focus:border-blue focus:outline-none"
          />
          <button
            onClick={() => runDiagnose(query)}
            disabled={loading}
            className="h-11 rounded-lg bg-amber px-5 text-[14px] font-bold text-[#1a1206] hover:bg-[#e0951f] disabled:opacity-50"
          >
            {loading ? "분석 중…" : "진단 실행"}
          </button>
        </div>
        {error && <p className="mt-2 text-[13px] text-warn">⚠ {error}</p>}
        <p className="mt-2 text-[11.5px] text-muted2">
          입력 → VWorld 실지오코딩 → 행정동 매핑 → 방향·위기·전략 + 2016~2026 변화. (전체 데이터 공개 · 점수/신호는 샘플 · 인구는 KOSIS 실데이터)
        </p>
      </div>

      {loading && <div className="klai-panel h-72 animate-pulse" />}

      {result && (
        <div className="space-y-6">
          {/* 매핑 헤더 */}
          <div className="klai-panel flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <div className="text-[12px] text-muted2">
                「{result.query}」 →{" "}
                {result.geocoded ? (
                  <span className="text-green">{result.geocoded.matched} (VWorld 실주소)</span>
                ) : (
                  "매핑된 행정동"
                )}
              </div>
              <div className="mt-0.5 flex items-center gap-2">
                <h2 className="text-2xl font-black">{result.place.name}</h2>
                <Pill tone="blue">{result.place.typology}</Pill>
                <ProvisionalBadge />
              </div>
              <div className="text-[12px] text-muted2">
                {result.place.sido} {result.place.sigungu} · {result.place.admCd2}
              </div>
            </div>
            <KlaiGauge klai={result.latest.klai} grade={result.latest.grade} momentum={result.latest.momentum} size={132} />
          </div>

          {/* 실측 신호 보정 — 샘플(난수) vs 실측(네이버·KOSIS) */}
          {result.corrected && (
            <div className="klai-panel p-5" style={{ borderColor: "var(--green)" }}>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider" style={{ color: "var(--green)" }}>
                  실측 신호 보정
                </span>
                <span className="rounded-full border px-2 py-0.5 text-[10px] font-bold" style={{ borderColor: "var(--green)", color: "var(--green)" }}>
                  네이버 · KOSIS 반영
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-line bg-card2/40 p-3">
                  <div className="text-[10px] text-muted2">샘플 점수 (난수 · 현실 무관)</div>
                  <div className="mt-1 flex items-center gap-2">
                    <GradeBadge grade={result.latest.grade} />
                    <span className="text-2xl font-black tabular-nums text-muted line-through decoration-warn/60">{result.latest.klai}</span>
                  </div>
                </div>
                <div className="rounded-xl border bg-card2/40 p-3" style={{ borderColor: "var(--green)" }}>
                  <div className="text-[10px]" style={{ color: "var(--green)" }}>실측 보정 점수</div>
                  <div className="mt-1 flex items-center gap-2">
                    <GradeBadge grade={result.corrected.grade} />
                    <span className="text-2xl font-black tabular-nums text-ink">{result.corrected.klai}</span>
                    <span
                      className="rounded-md px-1.5 py-0.5 text-[12px] font-extrabold"
                      style={{
                        background: result.corrected.klai >= result.latest.klai ? "rgba(0,196,58,.15)" : "rgba(224,82,31,.15)",
                        color: result.corrected.klai >= result.latest.klai ? "var(--green)" : "var(--warn)",
                      }}
                    >
                      {result.corrected.klai >= result.latest.klai ? "▲ +" : "▼ "}
                      {Math.abs(result.corrected.klai - result.latest.klai)}
                    </span>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-[12px] leading-relaxed text-muted">
                샘플 점수는 <b className="text-warn">난수</b>라 현실과 어긋날 수 있습니다. 실측 보정은{" "}
                <b className="text-ink">네이버 기사 {result.corrected.newsTotal.toLocaleString()}건</b> · 미디어 센티먼트{" "}
                <b style={{ color: result.corrected.mediaSentiment >= 0 ? "var(--green)" : "var(--warn)" }}>
                  {result.corrected.mediaSentiment > 0 ? "+" : ""}{result.corrected.mediaSentiment}
                </b>
                (긍정−부정, D4에 반영) ·{" "}
                <b className="text-ink">검색 추세 {result.corrected.searchMomentum > 0 ? "+" : ""}{result.corrected.searchMomentum}%</b>(3년) ·{" "}
                <b className="text-ink">KOSIS 인구</b>를 반영한 값입니다.
                {Math.abs(result.corrected.klai - result.latest.klai) >= 15 && (
                  <>
                    {" "}
                    <b style={{ color: result.corrected.klai > result.latest.klai ? "var(--green)" : "var(--warn)" }}>
                      → 이 동은 샘플 점수보다 실제 관심도가 {result.corrected.klai > result.latest.klai ? "훨씬 높습니다" : "낮습니다"}.
                    </b>
                  </>
                )}
              </p>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 border-t border-line pt-2 text-[11px] text-muted2">
                <span><b style={{ color: "var(--green)" }}>D4 인기 {result.corrected.d4}</b> 실측·네이버</span>
                <span><b style={{ color: "var(--green)" }}>모멘텀 {result.corrected.momentum > 0 ? "+" : ""}{result.corrected.momentum}</b> 실측·검색추세</span>
                <span><b style={{ color: "var(--green)" }}>D1 인구 {result.corrected.d1}</b> KOSIS</span>
                <span>D2 {result.corrected.d2} · D3 {result.corrected.d3} <span className="text-muted2">비교군 평균(미연동)</span></span>
              </div>
            </div>
          )}

          {/* 활성화 동인 분해 — 왜 뜨나/지나 (로컬크리에이터 vs 공공지원 vs 자본) */}
          <Section num="WHY" title="활성화 동인 — 무엇이 이 동네를 움직이나" tone="grade-b">
            <div className="mb-2 flex items-center gap-2">
              <span
                className="rounded-md px-2 py-0.5 text-[12px] font-extrabold"
                style={{
                  background: result.drivers.trend === "활성화" ? "rgba(0,196,58,.15)" : result.drivers.trend === "쇠퇴" ? "rgba(224,82,31,.15)" : "rgba(150,150,150,.15)",
                  color: result.drivers.trend === "활성화" ? "var(--green)" : result.drivers.trend === "쇠퇴" ? "var(--warn)" : "var(--muted)",
                }}
              >
                {result.drivers.trend}
              </span>
              <span className="text-[13px] text-muted">
                주도 동인: <b className="text-ink">{result.drivers.primary.label}</b>
              </span>
            </div>
            <div className="space-y-2">
              {result.drivers.drivers.map((dv) => {
                const tone = dv.key === "local" ? "var(--green)" : dv.key === "public" ? "var(--blue-l)" : "var(--amber)";
                return (
                  <div key={dv.key} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 text-[12px] font-bold text-ink">{dv.label}</span>
                    <div className="h-3 flex-1 rounded-full bg-navy2">
                      <div className="h-full rounded-full" style={{ width: `${dv.score}%`, background: tone }} />
                    </div>
                    <span className="w-8 text-right text-[12px] font-extrabold tabular-nums" style={{ color: tone }}>{dv.score}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 space-y-0.5 text-[11px] text-muted2">
              {result.drivers.drivers.map((dv) => (
                <div key={dv.key}>· <b className="text-muted">{dv.label}</b>: {dv.basis}</div>
              ))}
            </div>
            <p className="mt-2 rounded-lg border border-line bg-card2 px-3 py-2 text-[12.5px] leading-relaxed text-muted">
              {result.drivers.narrative}
            </p>
          </Section>

          {/* 요약 스탯 */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="등급 의미" value={result.latest.grade} sub={GRADE_LABEL[result.latest.grade]} />
            <Stat label="모멘텀" value={<MomentumChip m={result.latest.momentum} />} accent="amber" />
            <Stat
              label="시장 활성도"
              value={<span className="text-lg">{MARKET_LABEL[result.latest.marketVitality]}</span>}
              accent={result.latest.marketVitality === "shrinking" ? "warn" : "blue"}
            />
            <Stat
              label="내러티브"
              value={<span className="text-lg">{NARRATIVE_LABEL[result.latest.narrativeStage]}</span>}
              sub={result.latest.negativeNarrative ? "부정 서사" : undefined}
              accent={result.latest.negativeNarrative ? "warn" : "blue"}
            />
          </div>

          {/* 01 방향 — 4축 구성 + 추세 */}
          <Section num="01" title="방향 (Trajectory)" tone="blue">
            <div className="grid gap-5 lg:grid-cols-2">
              <div>
                <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-amber">합성 공식 (가중치 → KLAI)</div>
                <CompositionDiagram score={result.latest} />
                <div className="hairline my-3" />
                <ScoreRadar score={result.latest} peerAvg={result.peer} height={230} />
                <div className="mt-3 border-t border-line pt-3">
                  <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-amber">12 Sub-Dimension</div>
                  <SubBars admCd2={result.place.admCd2} score={result.latest} />
                </div>
              </div>
              <div>
                <div className="grid grid-cols-2 gap-2">
                  <Cell label="추세" value={d ? TRAJECTORY_LABEL[d.trajectory] : "—"} />
                  <Cell label="유형" value={result.place.typology} />
                  <Cell label="시장 활성도" value={MARKET_LABEL[result.latest.marketVitality]} warn={result.latest.marketVitality === "shrinking"} />
                  <Cell label="내러티브" value={NARRATIVE_LABEL[result.latest.narrativeStage]} warn={result.latest.negativeNarrative} />
                  <Cell
                    label={result.popReal ? `${result.place.sigungu} 인구` : "인구"}
                    value={`${result.latest.population.toLocaleString()}명 (${result.latest.popChangeRate > 0 ? "+" : ""}${result.latest.popChangeRate}%/년)`}
                    warn={result.latest.popChangeRate < 0}
                  />
                  <Cell label="공공예산 유입" value={`${result.latest.budgetInflow}억/년`} />
                </div>
                <div className="mt-3">
                  <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-amber">KLAI 추세 (2016~2026)</div>
                  <TrendChart series={result.series} height={170} />
                </div>
                <div className="mt-3 border-t border-line pt-3">
                  <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-amber">모멘텀</div>
                  <MomentumTrend series={result.series} height={110} />
                </div>
              </div>
            </div>
          </Section>

          {/* 02 2016~2026 장기 변화 — 인구·예산·도시대비 */}
          <Section num="02" title="2016~2026 장기 변화" tone="blue">
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat
                label={result.popReal ? `${result.place.sigungu} 인구 (${popLast?.year})` : `총인구 (${popLast?.year})`}
                value={popLast ? popLast.totalPop.toLocaleString() : "—"}
                sub={result.popReal ? `시군구·KOSIS · ${popFirst?.year}↔ ${signed((popLast?.totalPop ?? 0) - (popFirst?.totalPop ?? 0))}` : undefined}
                accent="blue"
              />
              <Stat label="세대수" value={popLast ? popLast.households.toLocaleString() : "—"} sub={result.popReal ? "KOSIS 실데이터" : undefined} />
              <Stat label={`공공예산 (${proc.at(-1)?.year ?? ""})`} value={`${Math.round((proc.at(-1)?.total ?? 0) / 10000)}억`} accent="amber" />
              <Stat label={`누적 예산 (${proc[0]?.year ?? ""}~)`} value={`${cumBudget}억`} sub={`${proc.length}개년`} accent="amber" />
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-xl border border-line bg-card2/40 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-[12px] font-bold text-ink">{result.popReal ? `${result.place.sigungu} 인구 추세` : "인구 추세"}</div>
                  {result.popReal && (
                    <span className="rounded-full border px-2 py-0.5 text-[10px] font-bold" style={{ borderColor: "var(--green)", color: "var(--green)" }}>
                      KOSIS 실데이터
                    </span>
                  )}
                </div>
                <PopulationTrend data={result.demographics} height={210} />
                <div className="mt-3 border-t border-line pt-2">
                  <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-amber">순이동{result.popReal ? " · 추정" : ""}</div>
                  <MigrationBars data={result.demographics} height={100} />
                </div>
              </div>
              <div className="rounded-xl border border-line bg-card2/40 p-4">
                <div className="mb-2 text-[12px] font-bold text-ink">공공예산 흐름 (입찰 vs 수의계약)</div>
                <BudgetFlow annual={proc} height={210} />
                <div className="mt-3 border-t border-line pt-2">
                  <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-amber">분야별 ({proc.at(-1)?.year})</div>
                  <BudgetCategoryBars annual={proc} />
                </div>
              </div>
            </div>
            {result.comparison && (
              <div className="mt-5 grid gap-5 border-t border-line pt-5 lg:grid-cols-[1.5fr_1fr]">
                <div>
                  <div className="mb-1 text-[12px] font-bold text-ink">인구 변화 지수 — 이 동 vs {result.comparison.sidoName} 평균 vs 전국</div>
                  <CityCompare cmp={result.comparison} height={240} />
                </div>
                <div className="rounded-xl border border-line bg-card2/40 p-4">
                  <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-amber">연령 구조 격차</div>
                  <RatioCompare cmp={result.comparison} />
                </div>
              </div>
            )}
          </Section>

          {/* ★ 신호 동조 */}
          {result.signals && (
            <Section num="★" title="신호 동조 — 검색·기사·인구·임대료·매물" tone="blue">
              <SignalAnalysis signals={result.signals} periods={result.periods} authenticityGap={result.latest.authenticityGap} />
            </Section>
          )}

          {/* 지역 문화 활력 — 공연·전시·축제 (한국문화정보원) */}
          {result.culture && result.culture.total > 0 && (
            <Section num="★" title="지역 문화 활력 — 공연·전시·축제" tone="grade-b">
              <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Stat label={`문화행사 (${result.culture.region})`} value={result.culture.total.toLocaleString()} accent="blue" />
                <Stat label="분야 다양성" value={result.culture.byRealm.length} sub="장르 수" />
                <Stat label="대표 분야" value={<span className="text-sm">{result.culture.byRealm[0]?.name ?? "—"}</span>} accent="amber" />
              </div>
              {result.culture.byRealm.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {result.culture.byRealm.slice(0, 8).map((r) => (
                    <span key={r.name} className="rounded-full border border-line bg-card2 px-2 py-0.5 text-[11px] text-muted">
                      {r.name} {r.count}
                    </span>
                  ))}
                </div>
              )}
              {result.culture.events.length > 0 && (
                <div className="rounded-xl border border-line bg-card2/40 p-3">
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted2">최근/예정 행사</div>
                  <ul className="space-y-1">
                    {result.culture.events.map((e, i) => (
                      <li key={i} className="truncate text-[12px] text-muted">
                        <b className="text-ink">{e.title}</b>
                        {e.realm ? ` · ${e.realm}` : ""}
                        {e.place ? ` · ${e.place}` : ""}
                        {e.period ? ` · ${e.period}` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mt-2 text-[10.5px]" style={{ color: "var(--green)" }}>
                실데이터 · 한국문화정보원 한눈에보는문화정보 · 문화 행사 밀도 = 동네 문화 활력
              </div>
            </Section>
          )}

          {/* 지역 문화·생활 인프라 — 갤러리·도서관·책방·공연장·체육관 (공공/민간) */}
          {result.venues && result.venues.total > 0 && (() => {
            const kindColor = Object.fromEntries(result.venues.byKind.map((k) => [k.kind, k.color]));
            return (
              <Section num="★" title="지역 문화·생활 인프라 — 갤러리·도서관·책방·공연장·체육관·공원" tone="grade-b">
                <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Stat label="문화 인프라 강도" value={result.venues.cultureScore} sub="0~100 (밀도·다양·근접)" accent="blue" />
                  <Stat label="총 시설" value={result.venues.total} sub="반경 1.2km" />
                  <Stat
                    label="공공 / 민간·재단"
                    value={<span className="text-base">{result.venues.publicCount} / {result.venues.privateCount}</span>}
                    accent="amber"
                  />
                  <Stat label="도보권 (500m)" value={result.venues.within500} sub="가까운 자산" accent="blue" />
                </div>

                {/* 종류별 분포 */}
                <div className="mb-3 space-y-1.5">
                  {result.venues.byKind
                    .filter((k) => k.count > 0)
                    .map((k) => (
                      <div key={k.kind} className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: k.color, boxShadow: `0 0 6px ${k.color}` }} />
                        <span className="w-28 shrink-0 text-[12px] font-semibold text-ink">{k.label}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-navy2/60">
                          <div className="h-full rounded-full" style={{ width: `${Math.min(100, k.count * 16)}%`, background: `linear-gradient(90deg, ${k.color}99, ${k.color})` }} />
                        </div>
                        <span className="w-20 text-right text-[11px] text-muted2">
                          {k.count}곳{k.publicCount > 0 ? ` · 공공${k.publicCount}` : ""}
                        </span>
                      </div>
                    ))}
                </div>

                {/* 시설 목록 (가까운 순) */}
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {result.venues.venues.slice(0, 10).map((v, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg border border-line bg-card2 px-2.5 py-1.5">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: kindColor[v.kind] }} />
                      <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-ink">{v.name}</span>
                      <Pill tone={v.publicOp ? "blue" : "muted"}>{v.publicOp ? "공공" : "민간"}</Pill>
                      {v.distanceM != null && <span className="w-12 shrink-0 text-right text-[11px] tabular-nums text-muted2">{v.distanceM}m</span>}
                    </div>
                  ))}
                </div>

                <div className="mt-2 text-[10.5px]" style={{ color: "var(--green)" }}>
                  실데이터 · 네이버 지역검색 · 공공(구립·시립·국립…)+민간/재단 모두 · 진단 지점 지도에 종류별 색 핀으로 배치 · 다양·근접할수록 동네 강점
                </div>
              </Section>
            );
          })()}

          {/* 유동인구 — 시간대 활력 (서울 생활인구) */}
          {result.living && (
            <Section num="★" title="유동인구 — 시간대 활력 (서울 생활인구)" tone="grade-b">
              <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="활력 유형" value={<span className="text-lg">{result.living.type}</span>} accent={result.living.type === "야간상권" ? "amber" : "blue"} />
                <Stat label="주간 평균 (10~17h)" value={result.living.dayAvg.toLocaleString()} accent="blue" />
                <Stat label="야간 평균 (19~5h)" value={result.living.nightAvg.toLocaleString()} accent="amber" />
                <Stat label="피크 시간" value={`${result.living.peakHour}시`} sub={`주/야 ${result.living.dayNightRatio}`} />
              </div>
              <div className="rounded-xl border border-line bg-card2/40 p-4">
                <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-amber">시간대별 생활인구 ({result.living.date} 기준)</div>
                <div className="flex h-24 items-end gap-[3px]">
                  {result.living.hourly.map((p, h) => {
                    const max = Math.max(...result.living!.hourly) || 1;
                    return (
                      <div key={h} className="flex-1" title={`${h}시 ${p.toLocaleString()}명`}>
                        <div
                          className="rounded-t"
                          style={{
                            height: `${Math.max(2, Math.round((p / max) * 100))}%`,
                            background: h >= 10 && h <= 17 ? "var(--blue-l)" : h >= 19 || h <= 5 ? "var(--amber)" : "var(--line)",
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="mt-1 flex justify-between text-[9px] text-muted2"><span>0시</span><span>6</span><span>12</span><span>18</span><span>23</span></div>
              </div>
              <div className="mt-2 text-[10.5px]" style={{ color: "var(--green)" }}>
                실데이터 · 서울 생활인구(시간대별) · <span style={{ color: "var(--blue-l)" }}>파랑=주간</span> <span style={{ color: "var(--amber)" }}>앰버=야간</span> · {result.living.type} 분류
              </div>
            </Section>
          )}

          {/* 골목상권 실측 (소진공) — 승인 반영 시 자동 표시 */}
          {result.sangga && (
            <Section num="★" title="골목상권 실측 — 소진공 상가정보" tone="grade-b">
              <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label={`점포 수 (반경 ${result.sangga.radiusM}m)`} value={result.sangga.total.toLocaleString()} accent="blue" />
                <Stat label="업종 다양성" value={`${result.sangga.diversity}`} sub="0~100 · 높을수록 다채" accent="blue" />
                <Stat label="음식·카페 비율" value={`${result.sangga.foodCafeRatio}%`} sub="핫플 상권 특징" accent="amber" />
                <Stat
                  label="프랜차이즈(지점)"
                  value={`${result.sangga.chainRatio}%`}
                  sub="높을수록 획일화·젠트리"
                  accent={result.sangga.chainRatio > 30 ? "warn" : "blue"}
                />
              </div>
              <div className="rounded-xl border border-line bg-card2/40 p-4">
                <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-amber">업종 구성 (대분류)</div>
                {result.sangga.byLarge.slice(0, 7).map((b) => {
                  const pct = Math.round((b.count / result.sangga!.total) * 100);
                  return (
                    <div key={b.name} className="mb-1.5 flex items-center gap-2 text-[12px]">
                      <span className="w-24 shrink-0 truncate text-muted">{b.name}</span>
                      <div className="h-2.5 flex-1 rounded bg-navy2">
                        <div className="h-full rounded" style={{ width: `${pct}%`, background: "var(--blue-l)" }} />
                      </div>
                      <span className="w-16 text-right tabular-nums text-muted2">{b.count} ({pct}%)</span>
                    </div>
                  );
                })}
                <div className="mt-2 border-t border-line pt-2 text-[11px] text-muted2">
                  주요 업종: {result.sangga.topMid.map((m) => `${m.name}(${m.count})`).join(" · ")}
                </div>
              </div>
              <div className="mt-2 text-[10.5px]" style={{ color: "var(--green)" }}>
                실데이터 · 소진공 상가(상권)정보 · 진단 지점 반경 {result.sangga.radiusM}m 점포 집계
              </div>
            </Section>
          )}

          {/* 앵커 점포 — 지역 버즈를 끄는 대표 점포 */}
          {result.anchor && result.anchor.length > 0 && (
            <Section num="★" title="앵커 점포 — 지역 버즈를 끄는 대표 점포" tone="grade-b">
              <p className="mb-2 text-[11.5px] text-muted2">
                진단 지점 <b className="text-muted">반경 1km 이내</b> 점포 × 블로그 회자도. (네이버 지도 &lsquo;좋아요·리뷰 수&rsquo;는 공식 API 미제공 → 블로그 글 수로 대체)
              </p>
              <div className="space-y-1.5">
                {result.anchor.map((s, i) => {
                  const max = result.anchor![0].blogBuzz || 1;
                  return (
                    <div key={i} className="flex items-center gap-2 text-[12px]">
                      <span className="w-4 text-muted2">{i + 1}</span>
                      <span className="w-28 shrink-0 truncate font-bold text-ink">{s.name}</span>
                      {s.distanceM != null && (
                        <span className="w-12 shrink-0 text-right text-[10.5px] text-muted2">{s.distanceM}m</span>
                      )}
                      <span className="hidden w-20 shrink-0 truncate text-muted2 sm:block">{s.category}</span>
                      <div className="h-2.5 flex-1 rounded bg-navy2">
                        <div className="h-full rounded" style={{ width: `${Math.round((s.blogBuzz / max) * 100)}%`, background: "var(--green)" }} />
                      </div>
                      <span className="w-16 text-right tabular-nums text-muted">{s.blogBuzz.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
              {(() => {
                const a0 = result.anchor!.find((s) => Number.isFinite(s.lng) && Number.isFinite(s.lat));
                const center: [number, number] | null = result.geocoded
                  ? [result.geocoded.lng, result.geocoded.lat]
                  : a0
                    ? [a0.lng as number, a0.lat as number]
                    : null;
                return center ? (
                  <div className="mt-3">
                    <DiagnoseMap stores={result.anchor!} center={center} venues={result.venues?.venues ?? []} />
                  </div>
                ) : null;
              })()}
              <div className="mt-2 text-[10.5px]" style={{ color: "var(--green)" }}>
                실데이터 · 네이버 지역검색+블로그 · 초록 번호핀=앵커 점포(버즈 순위) · 색 점=문화·생활 인프라(갤러리·도서관·책방·공연장·체육관·공원) · 흰 외곽링=공공
              </div>
            </Section>
          )}

          {/* 임대동향 — 부동산원 (rent-to-revenue의 분자) */}
          {result.reb && (result.reb.rent || result.reb.vacancy) && (
            <Section num="★" title="임대동향 — 한국부동산원 (상권 단위)" tone="warn">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {result.reb.rent && (
                  <Stat
                    label={`임대가격지수 · ${result.reb.rent.region}`}
                    value={result.reb.rent.latest}
                    sub={`2016대비 ${result.reb.rent.chgFrom2016 >= 0 ? "+" : ""}${result.reb.rent.chgFrom2016} · ${result.reb.rent.level}`}
                    accent={result.reb.rent.chgFrom2016 > 12 ? "warn" : "blue"}
                  />
                )}
                {result.reb.vacancy && (
                  <Stat
                    label={`공실률 · ${result.reb.vacancy.region}`}
                    value={`${result.reb.vacancy.latest}%`}
                    sub={`${result.reb.vacancy.level} · 높을수록 쇠퇴`}
                    accent={result.reb.vacancy.latest > 12 ? "warn" : "blue"}
                  />
                )}
                <Stat
                  label="신호 해석"
                  value={
                    <span className="text-sm">
                      {(result.reb.rent?.chgFrom2016 ?? 0) > 12
                        ? "임대료 급등 → 젠트리 압력"
                        : (result.reb.vacancy?.latest ?? 0) > 13
                          ? "공실 높음 → 쇠퇴 신호"
                          : "안정 범위"}
                    </span>
                  }
                  accent={(result.reb.rent?.chgFrom2016 ?? 0) > 12 || (result.reb.vacancy?.latest ?? 0) > 13 ? "warn" : "blue"}
                />
              </div>
              {result.sales && (
                <div className="mt-3 rounded-xl border bg-card2/40 p-4" style={{ borderColor: "var(--green)" }}>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-[12px] font-bold text-ink">상권 추정매출 — 우리마을가게 ({result.sales.region})</div>
                    <span className="rounded-full border px-2 py-0.5 text-[10px] font-bold" style={{ borderColor: "var(--green)", color: "var(--green)" }}>
                      서울 실데이터
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <Stat label={`당월 추정매출 (${result.sales.quarter})`} value={`${result.sales.monthlyAmtEok.toLocaleString()}억`} accent="blue" />
                    <Stat label="매출 건수/월" value={result.sales.monthlyCnt.toLocaleString()} />
                    <Stat
                      label="rent-to-revenue 신호"
                      value={
                        <span className="text-sm">
                          {(result.reb?.rent?.chgFrom2016 ?? 0) > 8 && result.sales.monthlyAmtEok > 0
                            ? "임대 상승 vs 매출 — 부담 점검"
                            : "발산 낮음"}
                        </span>
                      }
                      accent={(result.reb?.rent?.chgFrom2016 ?? 0) > 8 ? "warn" : "blue"}
                    />
                  </div>
                  <div className="mt-2 text-[11px] text-muted2">
                    주요 업종 매출: {result.sales.topInduty.map((t) => `${t.name} ${t.eok}억(${t.pct}%)`).join(" · ")}
                  </div>
                  <div className="mt-1.5 text-[11px] leading-relaxed text-muted">
                    <b className="text-ink">rent-to-revenue</b> = 임대료(부동산원) ÷ 매출(우리마을가게). 임대료는 오르는데 매출이 못 따라가면 → 젠트리→공실(가로수길 경로). 두 추세의 <b className="text-ink">발산</b>이 핵심.
                  </div>
                </div>
              )}
              <div className="mt-2 text-[10.5px]" style={{ color: "var(--green)" }}>
                실데이터 · 한국부동산원 임대동향(임대료) {result.sales ? "+ 서울 우리마을가게(매출) → rent-to-revenue 양변 확보" : "· 매출(분모)은 서울만 우리마을가게 연동"}
              </div>
            </Section>
          )}

          {/* 03 위기 */}
          <Section num="03" title="위기 (Risk)" tone="warn">
            <div className="grid gap-5 lg:grid-cols-2">
              <div>
                <div className="mb-1.5 text-[12px] font-bold text-muted">젠트리피케이션 단계</div>
                <GentriStageBar current={d?.gentriStage ?? -1} />
                {d?.gentriTransition && (
                  <div className="mt-2 rounded-lg border border-amber/30 bg-amber/10 px-3 py-2 text-[12px] text-muted">
                    다음 단계 <b className="text-ink">{d.gentriTransition.nextStageName}</b> 전이확률{" "}
                    <b className="text-amber">{Math.round(d.gentriTransition.prob * 100)}%</b> · 예상 {d.gentriTransition.etaMonths}개월
                  </div>
                )}
                {d && d.declineCauses.length > 0 && (
                  <div className="mt-3 rounded-lg border border-line bg-card2 px-3 py-2">
                    <div className="mb-1 text-[12px] font-bold text-ink">소멸 가속 원인 분해</div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {d.declineCauses.map((c, i) => (
                        <span key={i} className="text-[12px] text-muted">
                          <b className="text-warn">[{c.role === "trigger" ? "트리거" : c.role === "amplifier" ? "증폭" : "결과"}]</b> {c.factor}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <div className="mb-1.5 text-[12px] font-bold text-muted">{d?.trajectory === "declining" ? "악순환" : "선순환"} 인과 루프</div>
                <CausalLoop kind={d?.trajectory === "declining" ? "vicious" : "virtuous"} className="w-full" />
              </div>
            </div>
            <div className="mt-3 space-y-2">
              {(d?.risks ?? []).map((r, i) => (
                <div key={i} className="rounded-lg border border-warn/30 bg-warn/10 px-3 py-2">
                  <div className="text-[13px] font-bold text-warn">⚠ {r.title}</div>
                  <div className="mt-0.5 text-[12.5px] text-muted">{r.detail}</div>
                </div>
              ))}
              {(!d || d.risks.length === 0) && (
                <div className="rounded-lg border border-line bg-card2 px-3 py-2 text-[12.5px] text-muted">임계 경보 없음 — 정상 범위. 선제 모니터링 권장.</div>
              )}
            </div>
          </Section>

          {/* 04 전략 */}
          <Section num="04" title="전략 (Strategy)" tone="grade-b">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-line bg-card2 px-3 py-2">
                <span className="text-[12px] text-muted2">레버리지(구속조건): </span>
                <span className="text-[13px] font-bold text-ink">{d?.leverage}</span>
              </div>
              {d?.successPath && (
                <div className="rounded-lg border border-line bg-card2 px-3 py-2">
                  <span className="text-[12px] text-muted2">적합 성공 경로: </span>
                  <span className="text-[13px] font-bold text-grade-b">{d.successPath}</span>
                </div>
              )}
            </div>
            {d && d.topFactors.length > 0 && (
              <div className="mt-3 rounded-lg border border-line bg-card2 px-3 py-2">
                <div className="mb-1 text-[12px] font-bold text-ink">핵심 기여요인 (Top)</div>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {d.topFactors.map((f, i) => (
                    <span key={i} className="text-[12px] text-muted">
                      <b className={f.impact >= 0 ? "text-grade-b" : "text-warn"}>{f.impact >= 0 ? "▲" : "▼"}</b> {f.key}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-3 space-y-2">
              {(d?.strategy ?? []).map((s, i) => (
                <div key={i} className="rounded-lg border border-line bg-card2 px-3 py-2">
                  <div className="text-[13px] font-bold text-grade-b">→ {s.title}</div>
                  <div className="mt-0.5 text-[12.5px] text-muted">{s.detail}</div>
                </div>
              ))}
            </div>
            {/* 조달 상세 + PDF */}
            {result.procurement && result.procurement.records.length > 0 && (
              <div className="mt-4 border-t border-line pt-4">
                <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-amber">최근 공공조달 내역</div>
                <ProcurementTable records={result.procurement.records} />
              </div>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
              <button
                onClick={async () => {
                  const res = await fetch("/api/diagnose/pdf", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ admCd: result.place.admCd2, demoPaid: true }),
                  });
                  if (res.ok && res.headers.get("Content-Type")?.includes("pdf")) {
                    const blob = await res.blob();
                    window.open(URL.createObjectURL(blob), "_blank");
                  } else {
                    const e = await res.json().catch(() => ({}));
                    setError(e.message || "서버 PDF 미활성 (화면 리포트는 정상).");
                  }
                }}
                className="rounded-lg border border-line px-4 py-2 text-[13px] font-semibold text-ink hover:bg-card2"
                title="서버(Playwright) PDF. ENABLE_PDF=1 + playwright 설치 시 동작."
              >
                📄 PDF 다운로드 (서버 생성)
              </button>
              <span className="text-[11px] text-muted2">리포트 ID: {result.reportId}</span>
            </div>
          </Section>
        </div>
      )}

      {!result && !loading && (
        <div className="klai-panel p-8 text-center">
          <p className="text-[14px] text-muted">
            동명/지번을 입력하고 <b className="text-ink">진단 실행</b>을 누르세요.
          </p>
          <p className="mt-2 text-[12px] text-muted2">
            지도에서 동을 선택해 <Link href="/" className="text-blue-l hover:underline">탐색</Link>할 수도 있습니다.
          </p>
        </div>
      )}
    </div>
  );
}

function signed(n: number) {
  return `${n > 0 ? "+" : ""}${n.toLocaleString()}`;
}

function Section({
  num,
  title,
  tone,
  children,
}: {
  num: string;
  title: string;
  tone: "blue" | "warn" | "grade-b";
  children: React.ReactNode;
}) {
  const barColor = tone === "warn" ? "bg-warn" : tone === "grade-b" ? "bg-grade-b" : "bg-blue";
  return (
    <div className="klai-panel p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className={`h-5 w-1.5 rounded ${barColor}`} />
        <span className="text-[12px] font-extrabold tracking-wider text-amber">{num}</span>
        <h3 className="text-[16px] font-extrabold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Cell({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-lg border border-line bg-card2 px-3 py-2">
      <div className="text-[10px] text-muted2">{label}</div>
      <div className={`text-[13px] font-semibold ${warn ? "text-warn" : "text-ink"}`}>{value}</div>
    </div>
  );
}
