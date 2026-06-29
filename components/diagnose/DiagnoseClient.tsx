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
import type { SocialBuzz } from "@/lib/connectors/social";
import type { YoutubeBuzz } from "@/lib/connectors/youtube";
import type { DriverAttribution } from "@/lib/driver";
import type { Sustainability } from "@/lib/sustainability";
import type { TenantRx } from "@/lib/tenant";
import type { DiffusionResult } from "@/lib/diffusion";
import type { Supply, AuthGap } from "@/lib/supply";
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
import { BrandReportView } from "@/components/diagnose/BrandReportView";
import type { BrandReport } from "@/lib/brandReport";
import { GRADE_LABEL, MARKET_LABEL, NARRATIVE_LABEL, TRAJECTORY_LABEL } from "@/lib/constants";

interface DiagnoseResult {
  query: string;
  geocoded: { matched: string; lng: number; lat: number; source: string } | null;
  place: DistrictProps;
  latest: PlaceScore;
  series: PlaceScore[];
  diagnosis: Diagnosis | null;
  signals: SignalSeries | null;
  avgSignals: SignalSeries | null;
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
  social: SocialBuzz | null;
  youtube: YoutubeBuzz | null;
  drivers: DriverAttribution;
  sustainability: Sustainability | null;
  tenantRx: TenantRx | null;
  diffusion: DiffusionResult | null;
  brand: BrandReport | null;
  supply: Supply | null;
  supplyBoost: number;
  buzzBoost: number;
  authGap: AuthGap | null;
  vacant: { ratio: number | null; count: number | null; houses?: number | null; est?: number | null; year: number } | null;
  periods: string[];
  reportId: string;
}

type BrandCand = {
  name: string;
  category: string;
  address: string;
  roadAddress: string;
  lng: number;
  lat: number;
  isFranchise: boolean;
  admCd2: string | null;
  dongName: string | null;
  sigungu: string | null;
};

export function DiagnoseClient({ initialQuery = "", initialAdmCd, mode = "parcel" }: { initialQuery?: string; initialAdmCd?: string; mode?: "parcel" | "brand" }) {
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DiagnoseResult | null>(null);
  const [selAnchor, setSelAnchor] = useState<number | null>(null); // 앵커 점포 선택(리스트↔지도 핀 연동)
  const [candidates, setCandidates] = useState<BrandCand[] | null>(null); // 브랜드 검색 후보
  const [searching, setSearching] = useState(false);
  const [store, setStore] = useState<BrandCand | null>(null); // 선택된 중심 매장

  // admCd가 있으면 동명 지오코딩(모호) 대신 그 행정동을 직접 진단
  async function runDiagnose(q: string, admCd?: string) {
    if (!admCd && !q.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSelAnchor(null);
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

  // 브랜드 진단: 매장명 검색 → 후보 표시
  async function searchBrand(q: string) {
    if (!q.trim() || searching || loading) return;
    setSearching(true);
    setError(null);
    setResult(null);
    setCandidates(null);
    setStore(null);
    try {
      const r = await fetch(`/api/brand/search?q=${encodeURIComponent(q.trim())}`);
      if (!r.ok) {
        const e = await r.json();
        setError(e.message || "매장을 찾지 못했습니다.");
        setSearching(false);
        return;
      }
      const j = await r.json();
      setCandidates(j.candidates as BrandCand[]);
    } catch {
      setError("네트워크 오류");
    }
    setSearching(false);
  }

  // 후보 매장 선택 → 그 매장 좌표 중심으로 진단
  async function pickStore(c: BrandCand) {
    if (!c.admCd2) {
      setError("이 매장의 행정동을 찾지 못했습니다. 다른 매장을 선택해 주세요.");
      return;
    }
    setStore(c);
    setCandidates(null);
    setLoading(true);
    setError(null);
    setResult(null);
    setSelAnchor(null);
    try {
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lng: c.lng, lat: c.lat, label: c.name, category: c.category }),
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
  const ag = result?.authGap ?? null; // 진정성 갭(검색 수요 vs 등록 공급)
  const gapStrategy =
    ag?.verdict === "hype"
      ? { title: "과열 관리 — 임대 안정·맥락 보전", detail: "검색 관심이 실체를 앞섭니다. 상생협약·공공임대상가로 임대료를 안정시키고, 고유 점포·콘텐츠를 실제로 채워 서사·실체 격차를 좁혀 역티핑(급랭)을 예방하세요." }
      : ag?.verdict === "hidden"
      ? { title: "노출 확대 — 저평가 강세 알리기", detail: "등록 콘텐츠는 충분한데 검색 노출이 낮습니다. SNS·리포트·콜라보로 발견성을 높이면 빠른 성장 여력이 있습니다." }
      : ag?.verdict === "balanced"
      ? { title: "균형 유지 — 동반 성장", detail: "검색 수요와 등록 공급이 균형입니다. 현 페이스로 콘텐츠와 홍보를 함께 키우는 전략이 유효합니다." }
      : null;
  const popFirst = result?.demographics[0];
  const popLast = result?.demographics[result.demographics.length - 1];
  const proc = result?.procurement?.annual ?? [];
  const cumBudget = Math.round(proc.reduce((s, a) => s + a.total, 0) / 10000);

  return (
    <div className="space-y-6">
      {/* 입력 */}
      <div className="klai-panel p-5">
        {mode === "brand" ? (
          <>
            <label className="text-[13px] font-semibold text-muted">매장 · 브랜드명 (네이버 등록 매장)</label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchBrand(query)}
                placeholder="예: 성수동 어니언 / 망원 카페 / 로컬 브랜드명"
                className="h-11 flex-1 rounded-lg border border-line bg-navy px-3.5 text-[14px] text-ink placeholder:text-muted2 focus:border-blue focus:outline-none"
              />
              <button
                onClick={() => searchBrand(query)}
                disabled={searching || loading}
                className="h-11 rounded-lg bg-amber px-5 text-[14px] font-bold text-onaccent hover:bg-[var(--amber-d)] disabled:opacity-50"
              >
                {searching ? "검색 중…" : "매장 검색"}
              </button>
            </div>
            {error && <p className="mt-2 text-[13px] text-warn">⚠ {error}</p>}
            <p className="mt-2 text-[11.5px] text-muted2">
              네이버 등록 매장 검색 → 매장 선택 → <b className="text-muted">그 매장을 중심으로</b> 지역(상권·문화 인프라·활성화 동인) 평가. 프랜차이즈가 아니라 <b className="text-muted">로컬 브랜드·매장 우선</b>으로 보여줍니다.
            </p>
          </>
        ) : (
          <>
            <label className="text-[13px] font-semibold text-muted">주소 · 지번 · 동명 입력</label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runDiagnose(query)}
                placeholder="주소·지번·동명 또는 역·장소 (예: 강남역 / 홍대입구 / 성수동 / 성수이로 66)"
                className="h-11 flex-1 rounded-lg border border-line bg-navy px-3.5 text-[14px] text-ink placeholder:text-muted2 focus:border-blue focus:outline-none"
              />
              <button
                onClick={() => runDiagnose(query)}
                disabled={loading}
                className="h-11 rounded-lg bg-amber px-5 text-[14px] font-bold text-onaccent hover:bg-[var(--amber-d)] disabled:opacity-50"
              >
                {loading ? "분석 중…" : "진단 실행"}
              </button>
            </div>
            {error && <p className="mt-2 text-[13px] text-warn">⚠ {error}</p>}
            <p className="mt-2 text-[11.5px] text-muted2">
              입력 → VWorld(주소·지번)·네이버(역·장소) 지오코딩 → 행정동 매핑 → 그 지점 중심 진단. 방향·위기·전략 + 2016~2026 변화. (점수/신호는 샘플 · 인구는 KOSIS 실데이터)
            </p>
          </>
        )}
      </div>

      {/* 브랜드 후보 선택 */}
      {mode === "brand" && candidates && !result && (
        <div className="klai-panel p-4">
          <div className="mb-2 text-[13px] font-extrabold text-ink">
            매장 선택 <span className="text-muted2">({candidates.length})</span>
          </div>
          <div className="space-y-1.5">
            {candidates.map((c, i) => (
              <button
                key={i}
                onClick={() => pickStore(c)}
                disabled={!c.admCd2}
                className="flex w-full flex-wrap items-center gap-2 rounded-lg border border-line bg-card2 px-3 py-2 text-left transition-colors hover:border-blue disabled:opacity-50"
              >
                <span className="text-[13px] font-bold text-ink">{c.name}</span>
                <span className={`rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${c.isFranchise ? "border-line text-muted2" : "border-blue/40 bg-blue/10 text-blue-l"}`}>
                  {c.isFranchise ? "프랜차이즈" : "로컬 브랜드"}
                </span>
                <span className="text-[11.5px] text-muted2">{c.category}</span>
                <span className="ml-auto text-[11.5px] text-muted">{c.dongName ? `${c.sigungu ?? ""} ${c.dongName}` : "동 매핑 실패"}</span>
                <span className="w-full truncate text-[11px] text-muted2">{c.roadAddress || c.address}</span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-[10.5px] text-muted2">로컬 브랜드 우선 정렬 · 매장을 누르면 그 지점을 중심으로 지역 평가가 실행됩니다.</p>
        </div>
      )}

      {loading && <div className="klai-panel h-72 animate-pulse" />}

      {result && (
        <div className="space-y-6">
          {/* 브랜드 진단 — 중심 매장 배너 */}
          {store && (
            <div className="klai-panel flex flex-wrap items-center justify-between gap-3 p-4" style={{ borderColor: "var(--blue-l)" }}>
              <div>
                <span className="klai-eyebrow">브랜드 진단 · 중심 매장</span>
                <div className="mt-0.5 flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-black text-ink">{store.name}</h2>
                  <span className={`rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${store.isFranchise ? "border-line text-muted2" : "border-blue/40 bg-blue/10 text-blue-l"}`}>
                    {store.isFranchise ? "프랜차이즈" : "로컬 브랜드"}
                  </span>
                </div>
                <div className="text-[12px] text-muted2">
                  {store.category} · {store.roadAddress || store.address}
                </div>
              </div>
              <a
                href={`https://search.naver.com/search.naver?query=${encodeURIComponent(store.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-line px-3 py-2 text-[12.5px] font-semibold text-blue-l hover:bg-card2"
              >
                네이버에서 보기 →
              </a>
            </div>
          )}

          {/* 브랜드(매장) 중심 진단 — 신호·경쟁력·임대료·성장·위기 */}
          {result.brand && <BrandReportView brand={result.brand} dongName={result.place.name} />}

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
                <b className="text-ink">검색 추세 {result.corrected.searchMomentum > 0 ? "+" : ""}{result.corrected.searchMomentum}%</b>(3년){" "}
                <b style={{ color: result.corrected.searchAccel > 0 ? "var(--green)" : result.corrected.searchAccel < 0 ? "var(--warn)" : "var(--muted2)" }}>
                  {result.corrected.searchAccel > 0 ? "▲가속" : result.corrected.searchAccel < 0 ? "▼감속" : "→유지"} {result.corrected.searchAccel > 0 ? "+" : ""}{result.corrected.searchAccel}
                </b>
                <span className="text-muted2"> (가속도={result.corrected.searchAccel > 0 ? "티핑 선행" : result.corrected.searchAccel < 0 ? "관심 식는 중" : "평탄"})</span> ·{" "}
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

          {/* 매력 × 지속가능성 — 상생지수 4분면 (결론 한 장) */}
          {result.sustainability && (
            <Section
              num="★"
              title="매력 × 지속가능성 — 상생지수 4분면"
              tone={result.sustainability.quadrant.key === "overheat" || result.sustainability.quadrant.key === "decline" ? "warn" : "grade-b"}
            >
              <div className="grid gap-5 lg:grid-cols-[1fr_1.05fr]">
                <QuadrantMatrix s={result.sustainability} />
                <div>
                  <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-amber">진단 한 줄</div>
                  <div className="text-xl font-black text-ink">
                    {result.sustainability.quadrant.icon} {result.sustainability.quadrant.label}
                  </div>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{result.sustainability.quadrant.advice}</p>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-line bg-card2 px-3 py-2">
                      <div className="text-[10px] text-muted2">매력 (KLAI)</div>
                      <div className="text-lg font-black tabular-nums text-blue-l">{Math.round(result.sustainability.attractiveness)}</div>
                    </div>
                    <div className="rounded-lg border border-line bg-card2 px-3 py-2">
                      <div className="text-[10px] text-muted2">상생지수 (지속가능성)</div>
                      <div className="text-lg font-black tabular-nums" style={{ color: result.sustainability.score >= 50 ? "var(--green)" : "var(--warn)" }}>
                        {result.sustainability.score}
                      </div>
                    </div>
                  </div>

                  {/* 상생지수 구성 팩터 */}
                  <div className="mt-3 space-y-1.5">
                    {result.sustainability.factors.map((f) => (
                      <div key={f.label} className="flex items-center gap-2">
                        <span className="w-32 shrink-0 text-[11px] text-muted">{f.label}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-navy2/60">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${f.value}%`, background: f.value >= 50 ? "linear-gradient(90deg,#1e7a8c99,var(--green))" : "linear-gradient(90deg,#d4861e99,var(--warn))" }}
                          />
                        </div>
                        <span className="w-7 text-right text-[11px] font-semibold tabular-nums text-muted2">{Math.round(f.value)}</span>
                      </div>
                    ))}
                  </div>

                  {/* 대형화 + 수익성 가위 경보 */}
                  {(result.sustainability.franchise?.alert || result.sustainability.scissors?.diverging) && (
                    <div className="mt-3 space-y-1.5">
                      {result.sustainability.franchise?.alert && (
                        <div className="rounded-lg border border-warn/30 bg-warn/10 px-3 py-2 text-[12px]">
                          <b className="text-warn">⚠ 대형화 경보</b> <span className="text-muted">프랜차이즈 {result.sustainability.franchise.ratio}% (&gt;35%) — 고유색 희석</span>
                        </div>
                      )}
                      {result.sustainability.scissors?.diverging && (
                        <div className="rounded-lg border border-warn/30 bg-warn/10 px-3 py-2 text-[12px]">
                          <b className="text-warn">⚠ 수익성 가위</b>{" "}
                          <span className="text-muted">임대료 {result.sustainability.scissors.rentChg}% vs 수요 {result.sustainability.scissors.demandMom}% — {result.sustainability.scissors.note}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-2 text-[10.5px]" style={{ color: "var(--green)" }}>
                실측보정 KLAI(매력) × 상생지수(독립성·다양성·공실·진정성·시장안정·소셜) · 커버리지 {result.sustainability.coverage} · &ldquo;뜨지만 위태&rdquo;를 한눈에
              </div>
            </Section>
          )}

          {/* 확산 경로 — 다음 뜰 동 예측 (모듈 A) */}
          {result.diffusion && (result.diffusion.sources.length > 0 || result.diffusion.candidates.length > 0) && (
            <Section num="★" title="확산 경로 — 다음 뜰 동 (Spatial Diffusion)" tone="blue">
              <div
                className="mb-3 rounded-lg border px-3 py-2 text-[12.5px]"
                style={{
                  borderColor: result.diffusion.selfRole === "source" ? "var(--green)" : result.diffusion.selfRole === "candidate" ? "var(--blue-l)" : "var(--line)",
                  background: "color-mix(in srgb, var(--card2) 70%, transparent)",
                }}
              >
                <b style={{ color: result.diffusion.selfRole === "source" ? "var(--green)" : result.diffusion.selfRole === "candidate" ? "var(--blue-l)" : "var(--muted)" }}>
                  {result.diffusion.selfRole === "source" ? "🔥 확산 원천" : result.diffusion.selfRole === "candidate" ? "🌱 확장 후보" : "● 정체"}
                </b>{" "}
                <span className="text-muted">{result.diffusion.note}</span>
              </div>
              <div className="grid gap-5 lg:grid-cols-2">
                {/* 인접 핫 동 — 확산 원천 */}
                <div>
                  <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-amber">인접 핫 동 — 확산 원천</div>
                  {result.diffusion.sources.length ? (
                    <div className="space-y-1.5">
                      {result.diffusion.sources.map((s) => (
                        <a key={s.admCd2} href={`/diagnose?admCd=${s.admCd2}`} className="flex items-center gap-2 rounded-lg border border-line bg-card2 px-2.5 py-1.5 hover:border-blue">
                          <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-ink">{s.name}</span>
                          <span className="shrink-0 text-[10.5px] text-muted2">{s.distM}m</span>
                          <span className="shrink-0 text-[11px] font-bold text-grade-b">▲ +{s.momentum}</span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-line bg-card2 px-3 py-2 text-[12px] text-muted2">인접권 뚜렷한 핫동 없음</div>
                  )}
                </div>
                {/* 다음 확장 후보 */}
                <div>
                  <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-amber">다음 확장 후보 Top {result.diffusion.candidates.length}</div>
                  <div className="space-y-1.5">
                    {result.diffusion.candidates.map((c, i) => (
                      <a key={c.admCd2} href={`/diagnose?admCd=${c.admCd2}`} className="flex items-center gap-2 rounded-lg border border-line bg-card2 px-2.5 py-1.5 hover:border-blue">
                        <span className="w-4 shrink-0 text-center text-[11px] font-bold text-muted2">{i + 1}</span>
                        <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-ink">{c.name}</span>
                        <span className="shrink-0 text-[10px] text-muted2">{c.distM}m</span>
                        <div className="hidden h-1.5 w-14 shrink-0 overflow-hidden rounded-full bg-navy2/60 sm:block">
                          <div className="h-full rounded-full" style={{ width: `${c.readiness}%`, background: "linear-gradient(90deg,#4b9cd399,var(--blue-l))" }} />
                        </div>
                        <span className="w-7 shrink-0 text-right text-[11px] font-bold tabular-nums text-blue-l">{c.readiness}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-2 text-[10.5px]" style={{ color: "var(--green)" }}>
                인접 동(같은 시도·중심 2.8km) 그래프 · 후보 점수=저평가·잠재(젠트리0~1)·모멘텀·근접·핫동인접 · 클릭→그 동 진단. ⚠ 인접 점수는 샘플 — 실데이터 bulk 후 정밀화.
              </div>
            </Section>
          )}

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
              <SignalAnalysis signals={result.signals} periods={result.periods} authenticityGap={result.latest.authenticityGap} avgSignals={result.avgSignals ?? undefined} />
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
                  <Stat label="총 시설" value={result.venues.total} sub="인근(반경 1.2km~)" />
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

          {/* 소셜 네트워크 신호 — 등록수·검색량·유튜브 (긍정/부정 함께) */}
          {result.social && (
            <Section num="★" title="소셜 네트워크 신호 — 블로그·카페·유튜브 (긍정/부정)" tone="grade-b">
              <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="블로그 등록수" value={result.social.blog.total.toLocaleString()} accent="blue" />
                <Stat label="카페 등록수" value={result.social.cafe.total.toLocaleString()} accent="blue" />
                <Stat
                  label="검색 관심도(0~100)"
                  value={result.naver?.searchTrend?.length ? result.naver.searchTrend[result.naver.searchTrend.length - 1].ratio : "—"}
                  sub="네이버 DataLab"
                  accent="amber"
                />
                <Stat
                  label="유튜브 영상(추정)"
                  value={result.youtube ? result.youtube.videoTotal.toLocaleString() : "키 필요"}
                  sub={result.youtube ? "YouTube" : "YOUTUBE_API_KEY"}
                  accent={result.youtube ? "amber" : "warn"}
                />
              </div>

              {/* 채널별 긍정/부정 분해 */}
              <div className="space-y-2.5">
                {[
                  { label: "블로그", a: result.social.blog.agg },
                  { label: "카페", a: result.social.cafe.agg },
                  ...(result.youtube ? [{ label: "유튜브", a: result.youtube.agg }] : []),
                  { label: "통합", a: result.social.combined, strong: true },
                ].map((ch) => (
                  <PosNegBar key={ch.label} label={ch.label} agg={ch.a} strong={(ch as { strong?: boolean }).strong} />
                ))}
              </div>

              {/* 최근 긍정/부정 표본 */}
              {result.social.recent.length > 0 && (
                <div className="mt-3 border-t border-line pt-3">
                  <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-amber">최근 게시물 (긍정·부정 우선)</div>
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    {result.social.recent.map((r, i) => (
                      <a
                        key={i}
                        href={r.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-lg border border-line bg-card2 px-2.5 py-1.5 hover:border-blue"
                      >
                        <span
                          className="shrink-0 text-[11px]"
                          style={{ color: r.tone > 0 ? "var(--green)" : r.tone < 0 ? "var(--warn)" : "var(--muted2)" }}
                        >
                          {r.tone > 0 ? "▲긍정" : r.tone < 0 ? "▼부정" : "중립"}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[12px] text-ink">{r.title}</span>
                        <span className="shrink-0 text-[10px] text-muted2">{r.channel === "blog" ? "블로그" : "카페"}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-2 text-[10.5px]" style={{ color: "var(--green)" }}>
                실데이터 · 네이버 블로그·카페 등록수 + 검색량(DataLab){result.youtube ? " + 유튜브 영상" : " · 유튜브는 YOUTUBE_API_KEY 발급 시 활성화"} · 긍정(활성화)/부정(사건·쇠퇴) 동시 분류
              </div>
            </Section>
          )}

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

          {/* 지역 지도 — 앵커 점포·문화 인프라 (소도시·읍면 포함 항상 표시) */}
          {result.place && (
            <Section num="★" title="지역 지도 — 앵커 점포·문화 인프라" tone="grade-b">
              <p className="mb-2 text-[11.5px] text-muted2">
                진단 지점 인근 <b className="text-muted">대표 점포(블로그 회자도)</b>와 문화·생활 인프라를 지도에 표시. (네이버 지도 &lsquo;좋아요·리뷰 수&rsquo;는 공식 API 미제공 → 블로그 글 수로 대체)
              </p>
              {result.anchor && result.anchor.length > 0 ? (
              <div className="space-y-1">
                {result.anchor.map((s, i) => {
                  const max = result.anchor![0].blogBuzz || 1;
                  const open = selAnchor === i;
                  const hasPt = Number.isFinite(s.lng) && Number.isFinite(s.lat);
                  return (
                    <div key={i}>
                      <button
                        type="button"
                        onClick={() => setSelAnchor(open ? null : i)}
                        aria-expanded={open}
                        className={`flex w-full items-center gap-2 rounded-lg px-1.5 py-1 text-left text-[12px] transition-colors ${open ? "bg-green/10 ring-1 ring-green/40" : "hover:bg-card2"}`}
                      >
                        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold" style={{ background: "var(--green)", color: "#ffffff" }}>{i + 1}</span>
                        <span className="w-24 shrink-0 truncate font-bold text-ink sm:w-28">{s.name}</span>
                        {s.distanceM != null && (
                          <span className="w-12 shrink-0 text-right text-[10.5px] text-muted2">{s.distanceM}m</span>
                        )}
                        <span className="hidden w-20 shrink-0 truncate text-muted2 sm:block">{s.category}</span>
                        <div className="h-2.5 flex-1 rounded bg-navy2">
                          <div className="h-full rounded" style={{ width: `${Math.round((s.blogBuzz / max) * 100)}%`, background: "var(--green)" }} />
                        </div>
                        <span className="w-14 text-right tabular-nums text-muted sm:w-16">{s.blogBuzz.toLocaleString()}</span>
                        <span className={`w-3 shrink-0 text-muted2 transition-transform ${open ? "rotate-90" : ""}`}>›</span>
                      </button>
                      {open && (
                        <div className="mb-1 ml-7 mr-1 rounded-lg border border-green/30 bg-card2 px-3 py-2.5 text-[11.5px]">
                          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                            <div><span className="text-muted2">업종</span> <span className="font-medium text-ink">{s.category || "—"}</span></div>
                            <div><span className="text-muted2">거리</span> <span className="font-medium text-ink">{s.distanceM != null ? `진단지점 ${s.distanceM}m` : "—"}</span></div>
                            <div className="col-span-2"><span className="text-muted2">주소</span> <span className="font-medium text-ink">{s.address || "—"}</span></div>
                            <div><span className="text-muted2">블로그 회자도</span> <span className="font-bold" style={{ color: "var(--green)" }}>{s.blogBuzz.toLocaleString()}건</span></div>
                            <div><span className="text-muted2">버즈 순위</span> <span className="font-medium text-ink">#{i + 1} / {result.anchor!.length}</span></div>
                          </div>
                          <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
                            <a href={`https://search.naver.com/search.naver?query=${encodeURIComponent(s.name)}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-l hover:underline">네이버에서 보기 →</a>
                            {hasPt && (
                              <a href={`https://map.naver.com/p/search/${encodeURIComponent(s.name)}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-l hover:underline">네이버 지도에서 보기 →</a>
                            )}
                          </div>
                          <div className="mt-1.5 text-[10.5px] text-muted2">
                            {hasPt ? `아래 지도의 ●${i + 1} 핀이 강조됩니다 — 핀을 눌러도 이 정보가 뜹니다.` : "이 점포는 좌표 미제공이라 지도에 표시되지 않습니다."}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              ) : (
                <div className="rounded-lg border border-line bg-card2 px-3 py-2.5 text-[11.5px] text-muted2">
                  이 지역은 블로그 버즈가 잡히는 대표 점포가 적습니다(소도시·읍면). 아래 지도·골목상권·문화 인프라로 강점을 확인하세요.
                </div>
              )}
              {(() => {
                const center: [number, number] = result.geocoded
                  ? [result.geocoded.lng, result.geocoded.lat]
                  : [result.place.centroidLng, result.place.centroidLat];
                return (
                  <div className="mt-3">
                    <DiagnoseMap stores={result.anchor ?? []} center={center} venues={result.venues?.venues ?? []} selected={selAnchor} onSelect={setSelAnchor} />
                  </div>
                );
              })()}
              <div className="mt-2 text-[10.5px]" style={{ color: "var(--green)" }}>
                실데이터 · 네이버 지역검색+블로그 · 초록 번호핀=앵커 점포(버즈 순위) · 색 점=문화·생활 인프라(갤러리·도서관·책방·공연장·체육관·공원) · 흰 외곽링=공공 · 파란 핀=진단 지점
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
              {result?.vacant && result.vacant.ratio != null && result.vacant.ratio >= 10 && (
                <div className="rounded-lg border border-warn/30 bg-warn/10 px-3 py-2">
                  <div className="text-[13px] font-bold text-warn">🏚 빈집 비율 {result.vacant.ratio}% — 소멸·공실 경보</div>
                  <div className="mt-0.5 text-[12.5px] text-muted">
                    전국 평균(~8%)을 {result.vacant.ratio >= 15 ? "크게 " : ""}상회.{result.vacant.est != null ? ` 이 동 추정 빈집 ~${result.vacant.est.toLocaleString()}호.` : ""} 거래절벽·노후 가속 위험 — 빈집 활용(리모델링·임대전환)·정비 검토 권고.
                  </div>
                  <div className="mt-1 text-[11px] text-muted2">통계청 인구주택총조사(실데이터) · 비율 시군구{result.vacant.houses != null ? ` · 동 주택 ${result.vacant.houses.toLocaleString()}호` : ""}</div>
                </div>
              )}
              {ag?.verdict === "hype" && (
                <div className="rounded-lg border border-warn/30 bg-warn/10 px-3 py-2">
                  <div className="text-[13px] font-bold text-warn">🎭 진정성 갭 — {ag.headline}</div>
                  <div className="mt-0.5 text-[12.5px] text-muted">{ag.desc}</div>
                  <div className="mt-1 text-[11px] text-muted2">검색 수요 {Math.round(ag.demandN * 100)} vs 등록 공급 {Math.round(ag.supplyN * 100)} · 갭 +{ag.gap}</div>
                </div>
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
              {gapStrategy && (
                <div className="rounded-lg border border-line bg-card2 px-3 py-2">
                  <div className="text-[13px] font-bold text-grade-b">🎭 → {gapStrategy.title}</div>
                  <div className="mt-0.5 text-[12.5px] text-muted">{gapStrategy.detail}</div>
                  <div className="mt-1 text-[11px] text-muted2">
                    검색 수요 {Math.round((ag?.demandN ?? 0) * 100)} / 등록 공급 {Math.round((ag?.supplyN ?? 0) * 100)}
                    {result?.supply && result.supply.count > 0 ? ` · 현재 플래그테일 등록 ${result.supply.count}곳` : ""}
                  </div>
                </div>
              )}
            </div>
            {/* 업종 처방 — 다양성 보강 추천 (모듈 D) */}
            {result.tenantRx && result.tenantRx.gaps.length > 0 && (
              <div className="mt-3 rounded-lg border border-line bg-card2 px-3 py-2.5">
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <span className="text-[12.5px] font-bold text-ink">🧩 업종 처방 — 무엇을 넣어야 다양성이 유지되나</span>
                  {result.tenantRx.overConcentrated && <Pill tone="warn">음식·카페 {result.tenantRx.foodCafeRatio}% 과집중</Pill>}
                </div>
                <div className="mb-2 text-[11.5px] leading-snug text-muted">{result.tenantRx.note}</div>
                <div className="grid gap-1.5 sm:grid-cols-3">
                  {result.tenantRx.gaps.map((g, i) => (
                    <div key={g.name} className="rounded-lg border px-2.5 py-2" style={{ borderColor: "var(--green)", background: "color-mix(in srgb, var(--green) 8%, transparent)" }}>
                      <div className="flex items-baseline justify-between">
                        <span className="text-[12.5px] font-bold" style={{ color: "var(--green)" }}>
                          {i + 1}. {g.name}
                        </span>
                        <span className="text-[10.5px] text-warn">부족 {g.gap}%p</span>
                      </div>
                      <div className="mt-0.5 text-[11px] leading-snug text-muted2">{g.why}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-1.5 text-[10.5px] text-muted2">
                  현재 다양성 {result.tenantRx.diversity}/100 · 최다 업종 {result.tenantRx.topCategory} · 보강 시 기대 다양성 <b className="text-grade-b">+{result.tenantRx.expectedDiversityGain}</b>
                </div>
              </div>
            )}
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
            지도에서 동을 선택해 <Link href="/map" className="text-blue-l hover:underline">탐색</Link>할 수도 있습니다.
          </p>
        </div>
      )}
    </div>
  );
}

function signed(n: number) {
  return `${n > 0 ? "+" : ""}${n.toLocaleString()}`;
}

function QuadrantMatrix({ s }: { s: Sustainability }) {
  const W = 300,
    H = 268,
    padL = 30,
    padB = 28,
    top = 8,
    right = 8;
  const cl = (v: number) => Math.max(0, Math.min(100, v));
  const px = (v: number) => padL + (cl(v) / 100) * (W - padL - right);
  const py = (v: number) => H - padB - (cl(v) / 100) * (H - padB - top);
  const bx = px(55),
    by = py(50);
  const cells = [
    { key: "potential", x: padL, y: top, w: bx - padL, h: by - top, c: "#4b9cd3", icon: "🌱", label: "잠재·안정" },
    { key: "grow", x: bx, y: top, w: W - right - bx, h: by - top, c: "#34a853", icon: "⭐", label: "지속 성장" },
    { key: "decline", x: padL, y: by, w: bx - padL, h: H - padB - by, c: "#a23a2a", icon: "🔻", label: "쇠퇴·소멸" },
    { key: "overheat", x: bx, y: by, w: W - right - bx, h: H - padB - by, c: "#ff7a3d", icon: "⚠", label: "과열·위태" },
  ];
  const dx = px(s.attractiveness),
    dy = py(s.score);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="매력×지속가능성 4분면">
      {cells.map((c) => {
        const active = c.key === s.quadrant.key;
        return (
          <g key={c.key}>
            <rect x={c.x} y={c.y} width={c.w} height={c.h} fill={c.c} fillOpacity={active ? 0.2 : 0.05} stroke={active ? c.c : "var(--line)"} strokeWidth={active ? 1.6 : 0.5} />
            <text x={c.x + c.w / 2} y={c.y + 16} textAnchor="middle" fontSize="10.5" fontWeight={active ? 800 : 600} fill={active ? c.c : "var(--muted2)"}>
              {c.icon} {c.label}
            </text>
          </g>
        );
      })}
      <text x={(padL + W - right) / 2} y={H - 7} textAnchor="middle" fontSize="9.5" fill="var(--muted)">
        매력 (KLAI) →
      </text>
      <text x={11} y={(top + H - padB) / 2} textAnchor="middle" fontSize="9.5" fill="var(--muted)" transform={`rotate(-90 11 ${(top + H - padB) / 2})`}>
        지속가능성 →
      </text>
      <circle className="klai-pulse-ring" cx={dx} cy={dy} r={9} fill="none" stroke="#fff" strokeWidth={2} />
      <circle cx={dx} cy={dy} r={6} fill="var(--ink)" stroke="#fff" strokeWidth={2} style={{ filter: "drop-shadow(0 0 6px rgba(255,255,255,0.55))" }} />
    </svg>
  );
}

function PosNegBar({
  label,
  agg,
  strong,
}: {
  label: string;
  agg: { pos: number; neg: number; neut: number; sentiment: number };
  strong?: boolean;
}) {
  const total = agg.pos + agg.neg + agg.neut || 1;
  const pp = (agg.pos / total) * 100;
  const np = (agg.neut / total) * 100;
  const gp = (agg.neg / total) * 100;
  return (
    <div className="flex items-center gap-2">
      <span className={`w-10 shrink-0 text-[11.5px] ${strong ? "font-extrabold text-ink" : "font-semibold text-muted"}`}>{label}</span>
      <div className="flex h-3 flex-1 overflow-hidden rounded-full bg-navy2/60">
        <div style={{ width: `${pp}%`, background: "var(--green)" }} />
        <div style={{ width: `${np}%`, background: "var(--muted2)", opacity: 0.35 }} />
        <div style={{ width: `${gp}%`, background: "var(--warn)" }} />
      </div>
      <span className="w-20 shrink-0 text-right text-[10.5px] tabular-nums">
        <span style={{ color: "var(--green)" }}>긍{agg.pos}</span> <span style={{ color: "var(--warn)" }}>부{agg.neg}</span>
      </span>
      <span
        className="w-9 shrink-0 text-right text-[11px] font-bold tabular-nums"
        style={{ color: agg.sentiment >= 0 ? "var(--green)" : "var(--warn)" }}
      >
        {agg.sentiment > 0 ? "+" : ""}
        {agg.sentiment}
      </span>
    </div>
  );
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
