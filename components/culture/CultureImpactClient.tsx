"use client";

import { useState } from "react";
import { CIRadar } from "@/components/charts/CIRadar";

const RADAR_ORDER = [
  { key: "hyangyu", label: "문화향유" },
  { key: "pyohyeon", label: "표현·참여" },
  { key: "yusan", label: "국가유산" },
  { key: "gongdong", label: "공동체" },
  { key: "damyang", label: "다양성" },
  { key: "changui", label: "창의성" },
];

interface CIInput { label: string; value: string; source: string }
interface Indicator {
  key: string;
  area: "문화기본권" | "문화정체성" | "문화발전";
  label: string;
  score: number | null;
  confidence: "높음" | "중간" | "근사";
  basis: string;
  inputs: CIInput[];
  formula: string;
  interpret: string;
}
interface Result {
  place: { admCd2: string; name: string; sido: string; sigungu: string };
  cultureImpact: {
    total: number | null;
    grade: "우수" | "양호" | "보통" | "취약";
    indicators: Indicator[];
    alternatives: string[];
    coverage: number;
    regional: { sido: string; develop: number | null; innovate: number | null; creative: number | null; year: string | null } | null;
    streets: { count: number; totalStores: number; names: string[] } | null;
  };
}

const AREAS: { key: Indicator["area"]; desc: string }[] = [
  { key: "문화기본권", desc: "문화향유권 · 문화접근권 · 문화표현권 · 정책참여권" },
  { key: "문화정체성", desc: "국가유산 보호·향유 · 지역공동체 · 사회통합" },
  { key: "문화발전", desc: "문화다양성 권리 · 획일화 방지 · 창의성 · 미래지향성" },
];

function scoreColor(s: number) {
  return s >= 70 ? "var(--green)" : s >= 55 ? "#3e9aa8" : s >= 40 ? "#d4861e" : "var(--warn)";
}
function confColor(c: string) {
  return c === "높음" ? "var(--green)" : c === "중간" ? "var(--muted)" : "#d4861e";
}

export function CultureImpactClient({ initialQuery = "" }: { initialQuery?: string }) {
  const [q, setQ] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  async function run() {
    const query = q.trim();
    if (!query) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(`/api/culture-impact?address=${encodeURIComponent(query)}`);
      const j = await res.json();
      if (!res.ok) { setError(j.message || "평가에 실패했습니다."); return; }
      setResult(j);
    } catch {
      setError("네트워크 오류 — 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  const ci = result?.cultureImpact;

  return (
    <div className="space-y-5">
      {/* 검색 */}
      <div className="klai-panel p-5">
        <div className="mb-2 text-[13px] font-bold text-ink">주소 · 지번 · 동명 입력</div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run()}
            placeholder="예: 서울 마포구 성산동 / 전주 풍남동 / 성수동"
            className="h-11 flex-1 rounded-lg border border-line bg-card2 px-4 text-[14px] text-ink outline-none focus:border-[var(--blue-l)]"
          />
          <button
            onClick={run}
            disabled={loading}
            className="h-11 rounded-lg bg-amber px-6 text-[14px] font-bold text-onaccent hover:bg-[var(--amber-d)] disabled:opacity-50"
          >
            {loading ? "평가 중…" : "문화영향평가"}
          </button>
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-muted2">
          문화체육관광부 <b className="text-muted">문화영향평가</b> 6개 지표를 행정동 실데이터(문화행사·상권 다양성·정부 문화사업·건축)로 추정합니다. 일부 지표는 직접 데이터 부재로 <b className="text-muted">근사</b>입니다.
        </p>
      </div>

      {error && <div className="klai-panel border-warn/40 p-4 text-[13px] text-warn">⚠ {error}</div>}

      {ci && result && (
        <>
          {/* 종합 */}
          <div className="klai-panel p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="text-[12px] text-muted2">{result.place.sido} {result.place.sigungu}</div>
                <h2 className="font-display text-[26px] font-black tracking-[-0.02em] text-ink">{result.place.name}</h2>
                <div className="mt-0.5 text-[12px] text-muted">문화영향평가 종합 (6지표 중 {ci.coverage}개 데이터 산출)</div>
              </div>
              <div className="text-right">
                <div className="text-[40px] font-black leading-none tabular-nums" style={{ color: ci.total != null ? scoreColor(ci.total) : "var(--muted2)" }}>
                  {ci.total ?? "—"}<span className="text-[16px] font-normal text-muted2">/100</span>
                </div>
                <div className="text-[13px] font-bold" style={{ color: ci.total != null ? scoreColor(ci.total) : "var(--muted2)" }}>{ci.grade}</div>
              </div>
            </div>
          </div>

          {/* 문화영향 6지표 레이더 프로파일 */}
          <div className="klai-panel p-5">
            <div className="mb-1 flex items-center gap-2">
              <span className="h-4 w-1 rounded bg-grade-b" />
              <h3 className="text-[15px] font-extrabold text-ink">문화영향 프로파일 <span className="text-[11px] font-normal text-muted2">· 6지표 한눈에(0~100)</span></h3>
            </div>
            <div className="mx-auto max-w-[380px]"><CIRadar points={RADAR_ORDER.map((o) => ({ label: o.label, value: ci.indicators.find((x) => x.key === o.key)?.score ?? 0 }))} /></div>
          </div>

          {/* 시도 공식 지수(NABIS) + 지역특화거리 */}
          {(ci.regional || ci.streets) && (
            <div className="klai-panel p-5">
              {ci.regional && (
                <>
                  <div className="mb-1 flex items-center gap-2">
                    <span className="h-4 w-1 rounded bg-grade-b" />
                    <h3 className="text-[15px] font-extrabold text-ink">시도 공식 지수 <span className="text-[11px] font-normal text-muted2">· NABIS 산업연구원 {ci.regional.year} · {result.place.sido}</span></h3>
                  </div>
                  <div className="mb-3 grid grid-cols-3 gap-2">
                    {[
                      { l: "지역발전지수", v: ci.regional.develop },
                      { l: "지역혁신지수", v: ci.regional.innovate },
                      { l: "창조잠재력지수", v: ci.regional.creative },
                    ].map((x) => (
                      <div key={x.l} className="rounded-lg border border-line bg-card2 px-2.5 py-2 text-center">
                        <div className="text-[10.5px] text-muted2">{x.l}</div>
                        <div className="text-[17px] font-extrabold tabular-nums text-ink">{x.v ?? "—"}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {ci.streets && (
                <div className={ci.regional ? "border-t border-line pt-3" : ""}>
                  <div className="text-[12px] font-bold text-ink">🛍 지역특화거리 {ci.streets.count}개 <span className="font-normal text-muted2">· 점포 {ci.streets.totalStores.toLocaleString()} · 공공데이터포털 표준데이터</span></div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {ci.streets.names.map((n, i) => (<span key={i} className="rounded-full bg-card2 px-2 py-0.5 text-[11px] text-muted">{n}</span>))}
                  </div>
                </div>
              )}
              <p className="mt-2 text-[11px] leading-snug text-muted2">시도 공식 지수는 행정동별로 소속 시도값 공유(컨텍스트). <b className="text-ink">창조잠재력은 위 &lsquo;창의성&rsquo; 지표에 공식 반영</b>됩니다.</p>
            </div>
          )}

          {/* 영역별 지표 */}
          {AREAS.map((area) => {
            const items = ci.indicators.filter((i) => i.area === area.key);
            return (
              <div key={area.key} className="klai-panel p-5">
                <div className="mb-1 flex items-center gap-2">
                  <span className="h-4 w-1 rounded bg-grade-b" />
                  <h3 className="text-[15px] font-extrabold text-ink">{area.key}</h3>
                </div>
                <p className="mb-3 text-[11.5px] text-muted2">{area.desc}</p>
                <div className="space-y-3">
                  {items.map((ind) => (
                    <div key={ind.key} className="rounded-xl border border-line bg-card2/40 p-3.5">
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <span className="text-[13.5px] font-bold text-ink">{ind.label}</span>
                        <span className="flex shrink-0 items-center gap-1.5">
                          <span className="rounded-full px-1.5 py-0.5 text-[9.5px] font-bold" style={{ color: confColor(ind.confidence), border: `1px solid ${confColor(ind.confidence)}` }}>{ind.confidence}</span>
                          <span className="w-8 text-right text-[17px] font-extrabold tabular-nums" style={{ color: ind.score != null ? scoreColor(ind.score) : "var(--muted2)" }}>{ind.score ?? "—"}</span>
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-navy2/60">
                        {ind.score != null && <div className="h-full rounded-full transition-all" style={{ width: `${ind.score}%`, background: scoreColor(ind.score) }} />}
                      </div>
                      {ind.inputs.length > 0 && (
                        <div className="mt-2.5 space-y-1">
                          <div className="text-[10px] font-bold uppercase tracking-wide text-muted2">근거 데이터</div>
                          {ind.inputs.map((inp, i) => (
                            <div key={i} className="flex items-baseline justify-between gap-2 border-b border-line/50 pb-0.5 text-[11.5px] last:border-0">
                              <span className="text-muted">{inp.label}</span>
                              <span className="flex items-baseline gap-1.5 text-right"><b className="text-ink">{inp.value}</b><span className="shrink-0 text-[9.5px] text-muted2">{inp.source}</span></span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="mt-2 rounded-md bg-navy2/50 px-2.5 py-1.5">
                        <span className="text-[10px] font-bold text-muted2">산출식 </span>
                        <span className="text-[11px] text-ink" style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace" }}>{ind.formula}</span>
                      </div>
                      <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted">{ind.interpret}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* 대안 제시 */}
          <div className="klai-panel p-5">
            <div className="mb-1 flex items-center gap-2">
              <span className="h-4 w-1 rounded bg-grade-b" />
              <h3 className="text-[15px] font-extrabold text-ink">문화적 대안 제시</h3>
            </div>
            <p className="mb-3 text-[11.5px] text-muted2">제도의 목적 — 문화적 가치를 정책·계획에 반영하도록 대안을 제시합니다(취약 지표 기반).</p>
            <ul className="space-y-1.5">
              {ci.alternatives.map((a, i) => (
                <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-muted">
                  <span className="shrink-0 font-bold" style={{ color: "var(--blue-l)" }}>{i + 1}.</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t border-line pt-2 text-[11px] leading-snug text-muted2">
              근거: 한국문화정보원(문화행사)·소상공인 상권정보(업종 다양성)·행안부/문체부 문화·청년 사업·통계청 건축. 「문화기본법」 제5조 4항. 국가유산 지표는 직접 데이터 부재로 노후건축물 비중을 역사·근대 자산 잠재의 <b className="text-muted">근사</b>로 사용합니다.
            </p>
          </div>
        </>
      )}

      {!result && !loading && !error && (
        <div className="klai-panel p-8 text-center text-[14px] text-muted">
          동명/지번을 입력하고 <b className="text-ink">문화영향평가</b>를 누르세요.
        </div>
      )}
    </div>
  );
}
