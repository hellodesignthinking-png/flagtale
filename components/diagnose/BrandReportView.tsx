import type { BrandReport } from "@/lib/brandReport";

const SEV: Record<string, { cls: string; label: string }> = {
  high: { cls: "border-warn/40 bg-warn/10 text-warn", label: "높음" },
  mid: { cls: "border-amber/40 bg-amber/10 text-amber", label: "주의" },
  low: { cls: "border-line bg-card2 text-muted", label: "낮음" },
  check: { cls: "border-blue/40 bg-blue/10 text-blue-l", label: "확인 필요" },
};
const LEVEL: Record<string, { cls: string; label: string }> = {
  strong: { cls: "border-grade-b/40 bg-grade-b/10 text-grade-b", label: "경쟁력 우위" },
  mid: { cls: "border-line bg-card2 text-muted", label: "동네 평균" },
  weak: { cls: "border-warn/40 bg-warn/10 text-warn", label: "보강 필요" },
};

// 브랜드(매장) 중심 진단 뷰 — 신호·경쟁력·임대료·성장·위기
export function BrandReportView({ brand, dongName }: { brand: BrandReport; dongName?: string }) {
  const s = brand.signals;
  const c = brand.competitiveness;
  const lv = LEVEL[c.level];

  return (
    <div className="space-y-4">
      {/* 매장 신호 */}
      <Sec title="매장 신호 — 사람들이 이 매장을 어떻게 말하나" accent="#1E5FA8">
        {s.relevanceRatio != null && (
          <div className="mb-2.5 flex flex-wrap items-center gap-2 text-[11.5px]">
            <span className={`rounded-full border px-2 py-0.5 font-semibold ${s.reliable ? "border-grade-b/40 bg-grade-b/10 text-grade-b" : "border-amber/40 bg-amber/10 text-amber"}`}>
              매장 관련도 {s.relevanceRatio}%{s.reliable ? "" : " · 참고용"}
            </span>
            <span className="truncate text-muted2">검색어: “{s.query}”</span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Mini label="블로그 언급(추정)" value={s.blogPosts.toLocaleString()} unit="건" />
          <Mini label="카페 언급(추정)" value={s.cafePosts.toLocaleString()} unit="건" />
          <Mini label="검색 관심도" value={s.searchNow ?? "—"} unit={s.searchDelta != null ? `추세 ${s.searchDelta >= 0 ? "+" : ""}${s.searchDelta}%` : ""} />
          <Mini label="긍정 비율" value={s.positiveRatio != null ? `${s.positiveRatio}%` : "—"} unit={`긍 ${s.pos}·부 ${s.neg}`} accent={(s.positiveRatio ?? 50) >= 55 ? "var(--green)" : (s.positiveRatio ?? 50) < 45 ? "var(--warn)" : undefined} />
        </div>
        {s.positiveRatio != null && (
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-navy2/60">
            <div className="h-full" style={{ width: `${s.positiveRatio}%`, background: "var(--green)" }} />
          </div>
        )}
        {s.recent.length > 0 && (
          <div className="mt-3">
            <div className="mb-1.5 text-[11px] font-bold text-muted2">최근 언급 (이 매장 관련만 · 긍·부 우선)</div>
            <div className="space-y-1">
              {s.recent.slice(0, 6).map((r, i) => (
                <a key={i} href={r.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-md border border-line bg-card2 px-2.5 py-1.5 text-[11.5px] hover:border-blue">
                  <span style={{ color: r.tone > 0 ? "var(--green)" : r.tone < 0 ? "var(--warn)" : "var(--muted2)" }}>{r.tone > 0 ? "▲긍정" : r.tone < 0 ? "▼부정" : "●중립"}</span>
                  <span className="min-w-0 flex-1 truncate text-muted">{r.title}</span>
                  <span className="shrink-0 text-[10px] text-muted2">{r.channel}</span>
                </a>
              ))}
            </div>
          </div>
        )}
        <p className="mt-2 text-[10.5px] leading-relaxed text-muted2">{s.note}</p>
      </Sec>

      {/* 경쟁력 */}
      <Sec title="경쟁력 — 동네에서 이 매장의 위치" accent="#0F6E5C">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2.5 py-0.5 text-[11.5px] font-bold ${lv.cls}`}>{lv.label}</span>
          <span className="text-[12.5px] text-muted">{c.verdict}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Mini label="동네 평균 대비" value={c.buzzVsNeighbor != null ? `×${c.buzzVsNeighbor}` : "—"} unit={c.neighborAvg != null ? `평균 ${c.neighborAvg.toLocaleString()}건` : ""} accent={(c.buzzVsNeighbor ?? 1) >= 1.2 ? "var(--green)" : (c.buzzVsNeighbor ?? 1) < 0.5 ? "var(--warn)" : undefined} />
          <Mini label="동네 버즈 순위" value={c.neighborRank != null ? `#${c.neighborRank}` : "—"} unit={c.neighborN ? `/ ${c.neighborN}곳` : ""} />
          <Mini label="음식·카페 비중" value={c.foodCafeShare != null ? `${c.foodCafeShare}%` : "—"} unit="동일상권" />
          <Mini label="프랜차이즈 비중" value={c.franchiseShare != null ? `${c.franchiseShare}%` : "—"} unit={(c.franchiseShare ?? 0) >= 12 ? "획일화↑" : "개성↑"} accent={(c.franchiseShare ?? 0) >= 12 ? "var(--warn)" : "var(--green)"} />
        </div>
      </Sec>

      {/* 임대료 */}
      {brand.rent && (
        <Sec title="임대료·비용 — 한국부동산원" accent="#D4861E">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Mini label="임대가격지수" value={brand.rent.index ?? "—"} unit={brand.rent.chgFrom2016 != null ? `2016 대비 ${brand.rent.chgFrom2016 >= 0 ? "+" : ""}${brand.rent.chgFrom2016}` : ""} />
            <Mini label="공실률" value={brand.rent.vacancy != null ? `${brand.rent.vacancy}%` : "—"} unit="상권" />
            <Mini label="비용 신호" value={<span className="text-[13px]">{brand.rent.trend}</span>} unit="" />
          </div>
        </Sec>
      )}

      {/* 성장 전략 */}
      <Sec title="성장 전략 — 어떻게 더 성장하나" accent="#0F6E5C">
        <div className="grid gap-2 sm:grid-cols-2">
          {brand.growth.map((g, i) => (
            <div key={i} className="rounded-lg border border-grade-b/25 bg-grade-b/5 p-3">
              <div className="text-[12.5px] font-bold text-ink">→ {g.title}</div>
              <p className="mt-1 text-[11.5px] leading-relaxed text-muted">{g.detail}</p>
            </div>
          ))}
        </div>
      </Sec>

      {/* 위기 */}
      <Sec title="위기 — 무엇을 조심해야 하나" accent="var(--warn)">
        <div className="space-y-2">
          {brand.risks.map((r, i) => {
            const sv = SEV[r.severity] ?? SEV.mid;
            const isRedev = /재개발|정비사업|모아타운/.test(r.title);
            return (
              <div key={i} className={`rounded-lg border p-3 ${sv.cls.replace(/text-\S+/, "")}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12.5px] font-bold text-ink">{r.title}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${sv.cls}`}>{sv.label}</span>
                </div>
                <p className="mt-1 text-[11.5px] leading-relaxed text-muted">{r.detail}</p>
                {isRedev && (
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
                    <a href="https://cleanup.seoul.go.kr" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-l hover:underline">정비사업 정보몽땅 →</a>
                    <a href={`https://search.naver.com/search.naver?query=${encodeURIComponent(`${dongName ?? brand.name} 모아타운 재개발`)}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-l hover:underline">‘{dongName ?? brand.name} 모아타운/재개발’ 검색 →</a>
                    <a href="/contribute" className="font-semibold text-amber hover:underline">현장 리포트로 제보 →</a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Sec>
    </div>
  );
}

function Sec({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) {
  return (
    <div className="klai-panel p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="h-4 w-1 rounded" style={{ background: accent }} />
        <h3 className="text-[14px] font-extrabold text-ink">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Mini({ label, value, unit, accent }: { label: string; value: React.ReactNode; unit?: string; accent?: string }) {
  return (
    <div className="rounded-lg border border-line bg-card2/50 p-2.5">
      <div className="text-[10.5px] text-muted2">{label}</div>
      <div className="mt-0.5 text-lg font-black tabular-nums" style={{ color: accent ?? "var(--ink)" }}>
        {value}
      </div>
      {unit && <div className="text-[10px] text-muted2">{unit}</div>}
    </div>
  );
}
