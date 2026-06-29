import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { commerceFor, getPeerAvg, getPlace, getRegionComparison, nationalSignalAverage, populationMeta } from "@/lib/data";
import { NaverPanel } from "@/components/analysis/NaverPanel";
import { PageShell } from "@/components/page-shell";
import { Button, MomentumChip, Panel, Pill, ProvisionalBadge, SectionHead, Stat } from "@/components/ui";
import { ScoreRadar } from "@/components/charts/ScoreRadar";
import { SubBars } from "@/components/charts/SubBars";
import { TrendChart, MomentumTrend } from "@/components/charts/TrendChart";
import { GentriStageBar } from "@/components/charts/GentriStageBar";
import { CausalLoop } from "@/components/charts/CausalLoop";
import { PopulationTrend, MigrationBars } from "@/components/charts/PopulationTrend";
import { BudgetFlow, BudgetCategoryBars } from "@/components/charts/BudgetFlow";
import { ProcurementTable } from "@/components/charts/ProcurementTable";
import { SignalAnalysis } from "@/components/analysis/SignalAnalysis";
import { CityCompare, RatioCompare } from "@/components/charts/CityCompare";
import { KlaiGauge } from "@/components/charts/KlaiGauge";
import { CompositionDiagram } from "@/components/charts/CompositionDiagram";
import { MethodologyFlow } from "@/components/diagram/MethodologyFlow";
import { GRADE_LABEL, MARKET_LABEL, NARRATIVE_LABEL, TRAJECTORY_LABEL } from "@/lib/constants";
import { narrativeForPlace } from "@/lib/narratives";
import { instagramFor, igCountLabel, buzzBoost } from "@/lib/connectors/instagram";
import { googleInterestFor, countryKo } from "@/lib/connectors/googleinterest";
import { loadCreators, ftImage } from "@/lib/flagtale";
import { supplyFor, supplyBoost, supplyBreakdown, authenticityGap } from "@/lib/supply";
import { gradeOf } from "@/lib/scoring";
import { AreaNarrativeCard } from "@/components/flagtale/AreaNarrativeCard";
import { formatKRW, signed } from "@/lib/utils";

// 전국 수천 동 → 빌드 시 전체 프리렌더 대신 요청 시 온디맨드 렌더 (빌드 경량화).
// ⚠️ ISR(revalidate+generateStaticParams [])로 바꿨더니 온디맨드 생성이 런타임 500 → force-dynamic 유지.
export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { admCd: string } }): Metadata {
  const b = getPlace(params.admCd);
  if (!b) return { title: "동 리포트" };
  return { title: `${b.props.name} 동 리포트 · ${b.latest.klai}점 ${b.latest.grade}등급` };
}

export default function PlacePage({ params }: { params: { admCd: string } }) {
  const bundle = getPlace(params.admCd);
  if (!bundle) notFound();
  const { props, series, latest, diagnosis, demographics, procurement, signals } = bundle;
  const peer = getPeerAvg(props.typology);
  const periodLabels = series.map((s) => s.period);
  const cmp = getRegionComparison(props.admCd2);

  // 지역 흐름 요약치
  const popFirst = demographics[0];
  const popLast = demographics[demographics.length - 1];
  const popDelta = popLast && popFirst ? popLast.totalPop - popFirst.totalPop : 0;
  const procAnnual = procurement?.annual ?? [];
  const procLast = procAnnual[procAnnual.length - 1];
  const cumBudgetEok = Math.round(procAnnual.reduce((s, a) => s + a.total, 0) / 10000);
  const popReal = populationMeta(); // 있으면 인구·세대수 = KOSIS 실데이터(시군구 단위)
  const area = narrativeForPlace(props.admCd2); // 핫지역이면 큐레이션 '실제 이야기'
  const ig = instagramFor(area?.name); // 핫지역이면 인스타 해시태그 버즈(Apify 수집)
  const gi = googleInterestFor(area?.name); // 구글 국가별 검색 관심(해외·국내, SerpApi)
  // 동네 공급 밀도 — 등록된 플래그테일 공간·프로그램이 많을수록 매력도↑(네트워크 효과).
  const supply = supplyFor(props.admCd2);
  const sBoost = supplyBoost(props.admCd2); // 공급: 등록 콘텐츠 밀도
  const commerce = commerceFor(props.admCd2); // 상권 실측(상가수·업종 다양성) — data.go.kr 인제스트 시에만 존재
  const bBoost = buzzBoost(ig?.postsCount); // 수요: 인스타 검색량(버즈)
  const totalBoost = Math.round((sBoost + bBoost) * 10) / 10;
  const klaiUp = totalBoost ? Math.min(100, Math.round((latest.klai + totalBoost) * 10) / 10) : latest.klai;
  const gradeUp = totalBoost ? gradeOf(latest.klai + totalBoost) : latest.grade;
  const gap = authenticityGap(sBoost, bBoost); // 진정성 갭: 검색 수요 vs 등록 공급 괴리
  // 이 동네(시군구/시도) 로컬 크리에이터 — 지역 기반
  const dongCreators = loadCreators().filter((cr) => props.sigungu.includes(cr.region) || props.sido.includes(cr.region)).slice(0, 3);
  const boardRegion = area?.name ?? props.sigungu.replace(/(시|군|구)$/, ""); // 게시판 딥링크 지역(핫지역명 우선)

  // 일반 사용자용 한 줄 요약(연구 톤↓) — 등급·흐름·뜨는 이유를 평이하게
  const trendWord = latest.momentum > 1.5 ? "상승세" : latest.momentum < -1.5 ? "하락세" : "안정적";
  const gapPhrase =
    gap.verdict === "hype" ? "검색 관심은 뜨겁지만 등록된 가게·콘텐츠는 아직 적어 '과열' 신호가 보여요"
      : gap.verdict === "hidden" ? "등록된 로컬 콘텐츠는 많은데 아직 덜 알려진 '숨은 강세' 동네예요"
      : gap.verdict === "balanced" ? "검색 관심과 로컬 콘텐츠가 함께 크는 건강한 흐름이에요"
      : "";
  const summary = area
    ? `${props.name} · 전국이 주목하는 '뜨는 동네' — ${gapPhrase || "지금 활발히 변하고 있어요"}.`
    : `${props.name} · 매력도 ${gradeUp}등급(${GRADE_LABEL[gradeUp]}) ${props.typology} 동네 — 흐름은 ${trendWord}예요.`;

  return (
    <PageShell>
      {/* 헤더 */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[13px] text-muted2">
            <Link href="/map" className="hover:text-ink">
              매력도 지도
            </Link>
            <span>›</span>
            <span>{props.sigungu}</span>
          </div>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="font-display text-[clamp(26px,4vw,38px)] font-black tracking-[-0.03em]">{props.name}</h1>
            <Pill tone="blue">{props.typology}</Pill>
            <ProvisionalBadge />
          </div>
          <p className="mt-1 text-[13px] text-muted2">
            {props.sido} {props.sigungu} · 행정코드 {props.admCd2}
          </p>
        </div>
        <KlaiGauge klai={klaiUp} grade={gradeUp} momentum={latest.momentum} size={148} />
      </div>

      {/* 일반 사용자용 한 줄 요약 */}
      <div className="mb-6 flex items-start gap-3 rounded-2xl border-[1.5px] border-line bg-card2 px-5 py-4">
        <span className="shrink-0 text-[22px]">🧭</span>
        <div>
          <div className="text-[12px] font-extrabold text-blue-l">한눈에 보기</div>
          <p className="mt-0.5 text-[15px] font-bold leading-relaxed text-ink">{summary}</p>
        </div>
      </div>

      {/* 점수 요약 스탯 */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="등급 의미" value={gradeUp} sub={GRADE_LABEL[gradeUp]} />
        <Stat label="모멘텀" value={<MomentumChip m={latest.momentum} />} accent="amber" />
        <Stat
          label="시장 활성도"
          value={<span className="text-lg">{MARKET_LABEL[latest.marketVitality]}</span>}
          accent={latest.marketVitality === "shrinking" ? "warn" : "blue"}
        />
        <Stat
          label="내러티브 단계"
          value={<span className="text-lg">{NARRATIVE_LABEL[latest.narrativeStage]}</span>}
          sub={latest.negativeNarrative ? "부정 서사 확산" : undefined}
          accent={latest.negativeNarrative ? "warn" : "blue"}
        />
      </div>

      {/* 🏪 동네 공급 밀도 — 등록된 플래그테일 공간·프로그램이 많을수록 매력도↑(네트워크 효과) */}
      <div className="mb-6 rounded-[20px] border-[1.5px] border-line bg-card2/40 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-[16px] font-black tracking-tight text-ink">🏪 동네 공급 밀도 <span className="text-[12px] font-bold text-blue-l">플래그테일 등록</span></h2>
          {sBoost > 0 && <span className="rounded-full bg-amber px-2.5 py-1 text-[12px] font-extrabold text-onaccent">매력도 +{sBoost}</span>}
        </div>
        {supply && supply.count > 0 ? (
          <>
            <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
              등록 <b className="text-ink">{supply.count}곳</b> · {supplyBreakdown(supply)} · 관심(리뷰) <b className="text-ink">{supply.reviews.toLocaleString()}</b> → 매력도 <b className="text-ink">{latest.klai}</b> + 공급 <b className="text-ink">{sBoost}</b>{bBoost > 0 ? <> + 검색 <b className="text-ink">{bBoost}</b></> : null} = <b className="text-ink">{klaiUp}</b>
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {supply.items.slice(0, 10).map((it, i) =>
                it.href ? (
                  <Link key={i} href={it.href} className="rounded-full border border-line bg-card px-2.5 py-1 text-[11px] font-bold text-ink transition-colors hover:border-amber hover:text-amber-d">{it.kind} {it.name}{it.rating ? ` ★${it.rating}` : ""} →</Link>
                ) : (
                  <span key={i} className="rounded-full border border-line bg-card px-2.5 py-1 text-[11px] font-bold text-ink">{it.kind} {it.name}{it.rating ? ` ★${it.rating}` : ""}</span>
                )
              )}
            </div>
          </>
        ) : (
          <p className="mt-2 text-[12.5px] leading-relaxed text-muted">아직 등록된 공간·프로그램이 없어요. <b className="text-ink">매장·스테이·투어가 등록될수록 이 동네의 매력도가 올라갑니다</b> (등록 1곳당 약 +1.5). 동네에 콘텐츠가 쌓일수록 지역 매력도가 함께 성장하는 구조예요.</p>
        )}
      </div>

      {/* 🎨 이 동네 로컬 크리에이터 — 지역 기반 */}
      {dongCreators.length > 0 && (
        <div className="mb-5 rounded-[20px] border-[1.5px] border-line bg-card2/40 p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-display text-[16px] font-black tracking-tight text-ink">🎨 이 동네 로컬 크리에이터</h2>
            <Link href={`/board?region=${encodeURIComponent(boardRegion)}`} className="text-[11.5px] font-bold text-blue-l hover:underline">💬 동네 게시판 →</Link>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-3">
            {dongCreators.map((cr) => (
              <Link key={cr.id} href={`/creator/${cr.id}`} className="lift flex items-center gap-2.5 rounded-[14px] border-[1.5px] border-line bg-card p-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ftImage(cr.image)} alt={cr.name} className="h-11 w-11 shrink-0 rounded-full object-cover" />
                <div className="min-w-0">
                  <div className="truncate text-[13.5px] font-black text-ink">{cr.nickname}</div>
                  <div className="truncate text-[11px] text-muted">{cr.name} · {cr.region}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 🎭 이 동네의 실제 이야기 — 핫지역 큐레이션(쇼케이스와 동일 데이터로 일관) */}
      {area && (
        <div className="mb-6 rounded-[20px] border-[1.5px] border-line bg-card2/40 p-4 sm:p-5">
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-[16px] font-black tracking-tight text-ink">🎭 이 동네의 실제 이야기</h2>
            <Link href="/methodology#narrative" className="text-[11.5px] font-bold text-blue-l hover:underline">전체 라이프사이클 →</Link>
          </div>
          <p className="mb-3 text-[12px] leading-relaxed text-muted2">위 ‘내러티브 단계’(샘플 산출)를 실제 핫지역 흐름으로 검증한 큐레이션입니다.</p>
          <AreaNarrativeCard n={area} />
          {ig && (
            <a href={ig.url} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center justify-between gap-2 rounded-[14px] border border-line bg-card2/40 px-3.5 py-2.5 transition-colors hover:border-ink">
              <span className="text-[12.5px] font-bold text-ink">📸 인스타그램 <span className="text-blue-l">#{ig.tag}</span> · 약 {igCountLabel(ig.postsCount)} 게시물{bBoost > 0 ? <span className="text-amber-d"> · 검색 매력도 +{bBoost}</span> : null}</span>
              <span className="shrink-0 rounded-full bg-card px-2 py-0.5 text-[10px] font-bold text-muted2">Apify 수집·잠정 →</span>
            </a>
          )}
          {gi && !gi.sample && (
            <div className="mt-3 rounded-[14px] border border-line bg-card2/40 px-3.5 py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12.5px] font-bold text-ink">🌐 글로벌 검색 관심 <span className="text-blue-l">구글 트렌드</span></span>
                <span className="shrink-0 rounded-full bg-card px-2 py-0.5 text-[10px] font-bold text-muted2">SerpApi 수집</span>
              </div>
              <p className="mt-1 text-[12px] text-muted">이 지역을 검색하는 나라 · 해외 관심 <b className="text-amber-d">{gi.foreignShare}%</b>{gi.foreignTop[0] ? ` · 해외 1위 ${countryKo(gi.foreignTop[0].name)}` : ""}</p>
              <div className="mt-2.5 space-y-1.5">
                {gi.countries.map((c) => {
                  const kr = /korea/i.test(c.name);
                  return (
                    <div key={c.name} className="flex items-center gap-2">
                      <span className={`w-16 shrink-0 text-[11.5px] font-bold ${kr ? "text-ink" : "text-muted"}`}>{countryKo(c.name)}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
                        <div className="h-full rounded-full" style={{ width: `${Math.max(3, c.value)}%`, background: kr ? "#1E5FA8" : "#D4861E" }} />
                      </div>
                      <span className="w-6 shrink-0 text-right text-[11px] font-bold text-ink">{c.value}</span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 text-[10.5px] leading-snug text-muted2">구글 트렌드 국가별 검색 관심도(0~100 상대값) — 해외 방문·관심 가늠용이며 실제 방문객 수가 아닙니다.</p>
            </div>
          )}
        </div>
      )}

      {/* 도시 평균 대비 — 기본 데이터(인구 10년) 기준 변화 */}
      {cmp && (
        <Panel className="mb-5">
          <SectionHead
            no="비교"
            title="도시 평균 대비 — 이 동은 얼마나 변했나"
            desc={`${cmp.years[0]}~${cmp.years[cmp.years.length - 1]} 인구 지수 · 기본 데이터 대비`}
          />
          <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
            <div>
              <div className="mb-1 text-[12px] font-bold text-ink">
                인구 변화 지수 — 이 동 vs {cmp.sidoName} 평균 vs 전국
              </div>
              <CityCompare cmp={cmp} height={260} />
            </div>
            <div className="rounded-[20px] border-[1.5px] border-line bg-card2/40 p-4">
              <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-amber">연령 구조 격차 (현재)</div>
              <RatioCompare cmp={cmp} />
              <p className="mt-3 border-t border-line pt-2 text-[11px] leading-snug text-muted2">
                도시·전국이라는 <b className="text-muted">기준선</b>이 있어야 이 동의 변화가 빠른지 느린지 알 수 있다.
                실데이터 연동 시 통계청 시도·전국 평균으로 자동 대체.
              </p>
            </div>
          </div>
        </Panel>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {/* 4축 레이더 + 12 Sub */}
        <Panel>
          <SectionHead title="4축 매력 구성" desc={`비교군: ${props.typology}형 평균`} />
          <div className="mb-4">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-amber">합성 공식 (가중치 → KLAI)</div>
            <CompositionDiagram score={latest} />
          </div>
          <div className="hairline my-3" />
          <ScoreRadar score={latest} peerAvg={peer} height={240} />
          <div className="mt-4 border-t border-line pt-4">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-amber">12 Sub-Dimension</div>
            <SubBars admCd2={props.admCd2} score={latest} />
          </div>
        </Panel>

        {/* 추세 */}
        <Panel>
          <SectionHead title="추세 (최근 시계열)" desc="KLAI · 모멘텀" />
          <TrendChart series={series} height={220} />
          <div className="mt-3 border-t border-line pt-3">
            <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-amber">모멘텀</div>
            <MomentumTrend series={series} height={120} />
          </div>
        </Panel>
      </div>

      {/* 상권 실측 — 소상공인시장진흥공단 상가정보(data.go.kr). commerce.json 인제스트 시에만 노출(실데이터) */}
      {commerce && (
        <Panel className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SectionHead title="🏪 상권 실측 — 등록 상가" desc="소상공인시장진흥공단 상가정보 · data.go.kr" />
            <span className="rounded-full bg-[#0F6E5C]/15 px-2.5 py-1 text-[10.5px] font-extrabold text-[#0F6E5C] ring-1 ring-[#0F6E5C]/30">● 실데이터</span>
          </div>
          <div className="mt-3 flex flex-wrap items-end gap-6">
            <Stat label="등록 상가수" value={`${commerce.stores.toLocaleString()}개`} accent="blue" />
            <Stat label="업종 다양성" value={`${Math.round(commerce.diversity * 100)}/100`} sub="업종 대분류 Shannon" />
          </div>
          {commerce.topCategories?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {commerce.topCategories.map(([name, n]) => (
                <span key={name} className="rounded-full border border-line bg-card2/50 px-2.5 py-1 text-[12px] text-muted">
                  {name} <b className="text-ink">{n.toLocaleString()}</b>
                </span>
              ))}
            </div>
          )}
          <p className="mt-3 text-[11px] leading-snug text-muted2">
            행정동 등록 상가 {commerce.sampled.toLocaleString()}개 표본 기준 업종 다양성(Shannon, 0~100). 위 매력도 점수(샘플·잠정)와 별개의 <b className="text-ink">실측 지표</b>입니다.
          </p>
        </Panel>
      )}

      {/* 신호 동조 분석 — 검색·기사·인구·임대료·매물 · 접이식 */}
      {signals && (
        <Collapsible title="📡 신호 동조 분석" sub="검색·기사·인구·임대료·매물 — 무엇이 먼저였나">
          <SignalAnalysis signals={signals} periods={periodLabels} authenticityGap={latest.authenticityGap} avgSignals={nationalSignalAverage()} />
          {/* 네이버 실데이터(검색 관심도·기사량) — Suspense로 스트리밍, 페이지 렌더 막지 않음 */}
          <div className="mt-4">
            <Suspense
              fallback={
                <div className="rounded-[20px] border-[1.5px] border-line bg-card2/40 p-4 text-[12px] text-muted2">
                  네이버 실시간 관심도 불러오는 중…
                </div>
              }
            >
              {/* 행정동명 → 대표 동명 정규화(성수2가1동→성수동) : 네이버 검색 질의 정확도↑ */}
              <NaverPanel query={props.name.replace(/(\d+가)?\d+동$/, "동")} />
            </Suspense>
          </div>
        </Collapsible>
      )}

      {/* 지역 흐름 — 인구 + 공공예산 (장기 이력) · 접이식 */}
      <Collapsible title="📈 지역의 흐름 — 인구 · 공공예산" sub={`인구 ${demographics[0]?.year}~${popLast?.year} · 조달 ${procAnnual[0]?.year}~${procLast?.year}`}>
        {/* 요약치 */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat
            label={popReal ? `${props.sigungu} 인구 (${popLast?.year})` : `총인구 (${popLast?.year})`}
            value={popLast ? popLast.totalPop.toLocaleString() : "—"}
            sub={
              popReal
                ? `시군구 단위 · KOSIS${popDelta !== 0 ? ` · ${popFirst?.year}↔ ${signed(popDelta)}` : ""}`
                : popDelta !== 0
                  ? `${popFirst?.year} 대비 ${signed(popDelta)}명`
                  : undefined
            }
            accent={popDelta >= 0 ? "blue" : "warn"}
          />
          <Stat
            label="청년 / 고령 비율"
            value={popLast ? <span className="text-lg">{popLast.youthRatio}% / {popLast.elderlyRatio}%</span> : "—"}
            sub={popReal ? "20~39 / 65+ · 추정" : "20~39세 / 65세+"}
          />
          <Stat
            label={`공공예산 (${procLast?.year})`}
            value={procLast ? `${Math.round(procLast.total / 10000)}억` : "—"}
            sub={procLast ? `입찰 ${Math.round(procLast.bid / 10000)}억 · 수의 ${Math.round(procLast.sole / 10000)}억` : undefined}
            accent="amber"
          />
          <Stat
            label={`누적 공공예산 (${procAnnual[0]?.year}~)`}
            value={`${cumBudgetEok}억`}
            sub={`${procAnnual.length}개년 합계`}
            accent="amber"
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* 인구 */}
          <div className="rounded-[20px] border-[1.5px] border-line bg-card2/40 p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="text-[12px] font-bold text-ink">
                {popReal ? `${props.sigungu} 인구 추세` : "인구 추세"} (총인구 · 청년/고령)
              </div>
              {popReal && (
                <span
                  className="rounded-full border px-2 py-0.5 text-[10px] font-bold"
                  style={{ borderColor: "var(--green)", color: "var(--green)" }}
                  title={`${popReal.source} · ${popReal.tables.join(", ")}`}
                >
                  KOSIS 실데이터
                </span>
              )}
            </div>
            <PopulationTrend data={demographics} height={230} />
            {popReal && (
              <div className="mt-2 text-[10.5px] leading-relaxed text-muted2">
                <b className="text-muted">총인구·세대수</b> = KOSIS 실데이터(<b className="text-muted">시군구 단위</b>, {demographics[0]?.year}~{popLast?.year}) ·{" "}
                <b className="text-muted">청년/고령·순이동</b> = 추정(시군구 연령·이동 통계 후속 연동)
              </div>
            )}
            <div className="mt-3 border-t border-line pt-3">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-amber">
                순이동 (유입·유출){popReal ? " · 추정" : ""}
              </div>
              <MigrationBars data={demographics} height={110} />
            </div>
          </div>

          {/* 공공예산 */}
          <div className="rounded-[20px] border-[1.5px] border-line bg-card2/40 p-4">
            <div className="mb-2 text-[12px] font-bold text-ink">공공예산 흐름 (입찰 공고 vs 수의계약)</div>
            <BudgetFlow annual={procAnnual} height={230} />
            <div className="mt-3 border-t border-line pt-3">
              <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-amber">
                분야별 공고예산 ({procLast?.year})
              </div>
              <BudgetCategoryBars annual={procAnnual} />
            </div>
          </div>
        </div>

        {/* 조달 기록 */}
        <div className="mt-5 border-t border-line pt-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[12px] font-bold text-ink">나라장터 주요 조달 기록</span>
            <span className="klai-tag klai-tag-sample">샘플</span>
          </div>
          <ProcurementTable records={procurement?.records ?? []} />
        </div>

        <p className="mt-3 text-[11px] leading-snug text-muted2">
          공공예산 유입은 <b className="text-muted">정책 개입 신호</b> — 투입 전후 KLAI 변화를 DiD로 추정하면 정책 ROI를 읽을 수 있다(기획서 §5.7).
          소멸 진행 동에 도시재생·소멸대응 예산이 집중되는 패턴이 보이면 <b className="text-muted">레버리지(일자리·정주여건)</b> 적중 여부를 점검한다.
        </p>
      </Collapsible>

      {/* 진단 요약 (무료) */}
      <Panel className="mt-5">
        <SectionHead no="진단" title="진단 요약" desc="무료 요약 · 상세 원인·전략은 유료" />
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="mb-2 text-[12px] font-bold text-muted">젠트리피케이션 단계</div>
            <GentriStageBar current={diagnosis?.gentriStage ?? -1} compact />
            {diagnosis && (
              <p className="mt-3 text-[13px] leading-relaxed text-muted">
                현재 <b className="text-ink">{diagnosis.gentriStageName}</b>. 다음 단계{" "}
                <b className="text-ink">{diagnosis.gentriTransition.nextStageName}</b> 전이확률{" "}
                <b className="text-amber">{Math.round(diagnosis.gentriTransition.prob * 100)}%</b> · 예상{" "}
                {diagnosis.gentriTransition.etaMonths}개월.
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <SummaryCell label="추세" value={diagnosis ? TRAJECTORY_LABEL[diagnosis.trajectory] : "—"} />
            <SummaryCell label="레버리지" value={diagnosis?.leverage ?? "—"} />
            <SummaryCell label="내러티브 주제" value={diagnosis?.narrativeTheme ?? "—"} />
            <SummaryCell label="진정성 갭" value={gap.verdict !== "none" ? gap.label : diagnosis ? `${diagnosis.authenticityGap}` : "—"} />
          </div>
        </div>

        {/* 🎭 진정성 갭 — 서사(검색 수요) vs 실체(등록 공급) 괴리. 스펙 §5. 무료·실데이터 근사 */}
        {gap.verdict !== "none" && (
          <div className="mt-4 rounded-xl border-[1.5px] border-line bg-card2 px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[13px] font-black text-ink">
                🎭 진정성 갭 — <span className={gap.tone === "warn" ? "text-warn" : "text-grade-b"}>{gap.headline}</span>
              </div>
              <span className="shrink-0 text-[10.5px] font-bold text-muted2">서사(검색) vs 실체(등록)</span>
            </div>
            <div className="mt-2.5 grid gap-1.5">
              {([["검색 수요(버즈)", gap.demandN, "#3E9AA8"], ["등록 공급(콘텐츠)", gap.supplyN, "#D4861E"]] as [string, number, string][]).map(([l, v, c]) => (
                <div key={l} className="flex items-center gap-2">
                  <span className="w-[92px] shrink-0 text-[11px] font-bold text-muted">{l}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.max(3, Math.round(v * 100))}%`, background: c }} />
                  </div>
                  <span className="w-7 shrink-0 text-right text-[11px] font-bold text-ink">{Math.round(v * 100)}</span>
                </div>
              ))}
            </div>
            <p className="mt-2.5 text-[12px] leading-relaxed text-muted">{gap.desc}</p>
            <p className="mt-1 text-[10.5px] text-muted2">* 검색=인스타 버즈, 공급=플래그테일 등록 콘텐츠 밀도 기반 근사 신호(원인 후보).</p>
          </div>
        )}

        {/* 기여요인 Top3 (무료 요약) */}
        {diagnosis && (
          <div className="mt-4 border-t border-line pt-4">
            <div className="mb-2 text-[12px] font-bold text-muted">점수 기여요인 Top 3 (근사)</div>
            <div className="grid gap-2 sm:grid-cols-3">
              {diagnosis.topFactors.map((f, i) => (
                <div key={i} className="rounded-lg border-[1.5px] border-line bg-card2 px-3 py-2">
                  <div className="text-[12px] text-ink">{f.key}</div>
                  <div className={`text-sm font-bold ${f.impact >= 0 ? "text-grade-b" : "text-warn"}`}>
                    {f.impact >= 0 ? "+" : ""}
                    {f.impact}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Panel>

      {/* 상세 (원인·전략) — 페이월 (스펙 §7) */}
      <Panel className="relative mt-5 overflow-hidden">
        <SectionHead no="유료" title="원인 · 위기 · 전략 (상세)" desc="결제 후 전체 열람 + PDF" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <div className="text-[12px] font-bold text-warn">위기 (Risk)</div>
            {(diagnosis?.risks ?? []).slice(0, 3).map((r, i) => (
              <div key={i} className="rounded-lg border border-warn/30 bg-warn/10 px-3 py-2">
                <div className="text-[13px] font-bold text-warn">⚠ {r.title}</div>
                <div className="mt-0.5 text-[12px] text-muted blur-[4px]">{r.detail}</div>
              </div>
            ))}
            {(!diagnosis || diagnosis.risks.length === 0) && (
              <div className="rounded-lg border-[1.5px] border-line bg-card2 px-3 py-2 text-[12px] text-muted">
                현재 임계 경보 없음 — 정상 범위
              </div>
            )}
          </div>
          <div className="space-y-2">
            <div className="text-[12px] font-bold text-grade-b">전략 (Strategy)</div>
            {(diagnosis?.strategy ?? []).map((s, i) => (
              <div key={i} className="rounded-lg border-[1.5px] border-line bg-card2 px-3 py-2">
                <div className="text-[13px] font-bold text-ink">{s.title}</div>
                <div className="mt-0.5 text-[12px] text-muted blur-[4px]">{s.detail}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 페이월 오버레이 */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 bg-gradient-to-t from-navy via-navy/90 to-transparent px-4 pb-6 pt-16">
          <span className="klai-tag">🔒 상세 진단은 유료</span>
          <p className="max-w-md text-center text-[13px] text-muted">
            방향·위기·전략 전체 분석과 PDF 리포트는 결제 후 제공됩니다.
          </p>
          <div className="flex gap-2">
            <Button href={`/diagnose?admCd=${props.admCd2}`} variant="amber">
              상세 진단 받기
            </Button>
            <Button href="/pricing" variant="outline">
              가격 보기
            </Button>
          </div>
        </div>
      </Panel>

      {/* 소멸/성공 루프 (유형별 표시) */}
      {diagnosis && (diagnosis.trajectory === "declining" || diagnosis.trajectory === "rising") && (
        <Panel className="mt-5">
          <SectionHead
            title={diagnosis.trajectory === "declining" ? "소멸 가속 — 악순환 루프" : "성공 상권 — 선순환 루프"}
            desc="진단 엔진 (개념)"
          />
          <div className="mx-auto max-w-sm">
            <CausalLoop kind={diagnosis.trajectory === "declining" ? "vicious" : "virtuous"} className="w-full" />
          </div>
        </Panel>
      )}

      {/* 방법론 — 이 점수는 어떻게 만들어지나 (접이식) */}
      <Collapsible title="🔬 이 점수는 어떻게 만들어지나" sub="데이터 → 합성 → 진단 → 출력">
        <MethodologyFlow />
      </Collapsible>
    </PageShell>
  );
}

function SummaryCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border-[1.5px] border-line bg-card2 px-3 py-2">
      <div className="text-[10px] text-muted2">{label}</div>
      <div className="text-[13px] font-semibold text-ink">{value}</div>
    </div>
  );
}

// 접이식 섹션 — 일반 사용자가 깊은 데이터를 기본 접힘으로 보게(스크롤 부담↓). 네이티브 <details>라 JS 불필요.
function Collapsible({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <details className="klai-panel group mt-5 overflow-hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 sm:px-6">
        <span className="font-display text-[15px] font-black tracking-[-0.02em] text-ink">
          {title}
          {sub && <span className="ml-2 text-[12px] font-medium text-muted2">{sub}</span>}
        </span>
        <span className="shrink-0 rounded-full border border-line px-2.5 py-1 text-[11px] font-bold text-muted transition-transform group-open:rotate-180">▾</span>
      </summary>
      <div className="border-t border-line px-5 pb-5 pt-4 sm:px-6">{children}</div>
    </details>
  );
}
