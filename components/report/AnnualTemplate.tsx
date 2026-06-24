import Link from "next/link";
import type { RankingRow, Report } from "@/lib/types";
import { GradeBadge, MomentumChip, ProvisionalBadge, Stat } from "@/components/ui";
import { GRADE_HEX } from "@/lib/constants";
import { gradeOf } from "@/lib/scoring";
import { gapMovers } from "@/lib/supply";

interface AnnualBlocks {
  ranking: RankingRow[];
  typologyStats: { typology: string; count: number; avgKlai: number }[];
  avgKlai: number;
  gentriCount: number;
  declineCount: number;
}

// Flagtale Annual — 매력동네 랭킹 + 유형 분석 (스펙 §10.2). 클라이언트 인쇄 버튼 없음(§15).
export function AnnualTemplate({ report }: { report: Report }) {
  const b = report.blocks as unknown as AnnualBlocks;
  const top = b.ranking.slice(0, 30);
  const gm = gapMovers(8); // 올해의 과열/미발견 동네 — 진정성 갭(검색 수요 vs 등록 공급)

  return (
    <article className="space-y-8">
      <header className="klai-panel p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <span className="klai-eyebrow">Flagtale Annual · 연간 권위 발표</span>
          <ProvisionalBadge />
        </div>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">{report.title}</h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted">{report.summary}</p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="평가 행정동" value={b.ranking.length} />
        <Stat label="평균 KLAI" value={b.avgKlai} accent="blue" />
        <Stat label="젠트리 경보" value={b.gentriCount} accent="warn" />
        <Stat label="소멸 진입" value={b.declineCount} accent="amber" />
      </div>

      {/* Top 3 포디움 */}
      {b.ranking.length >= 3 && (
        <div className="klai-panel p-5 sm:p-6">
          <h2 className="mb-4 text-[16px] font-extrabold">🏆 매력동네 Top 3</h2>
          <div className="flex items-end justify-center gap-3 sm:gap-5">
            {[1, 0, 2].map((idx) => {
              const r = b.ranking[idx];
              const medal = ["🥇", "🥈", "🥉"][idx];
              const h = idx === 0 ? 132 : idx === 1 ? 104 : 84;
              const c = GRADE_HEX[r.grade];
              return (
                <Link key={r.admCd2} href={`/place/${r.admCd2}`} className="group flex w-1/3 max-w-[180px] flex-col items-center">
                  <div className="text-2xl">{medal}</div>
                  <div className="mt-1 truncate text-center text-[13px] font-extrabold text-ink group-hover:text-amber">{r.name}</div>
                  <div className="text-[10px] text-muted2">{r.typology}</div>
                  <div
                    className="mt-2 flex w-full flex-col items-center justify-start rounded-t-xl border-t border-x border-line pt-2.5"
                    style={{ height: h, background: `linear-gradient(180deg, ${c}33, ${c}0a)` }}
                  >
                    <div className="text-xl font-black tabular-nums" style={{ color: c }}>
                      {r.klai}
                    </div>
                    <div className="mt-0.5">
                      <GradeBadge grade={r.grade} size="sm" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* 매력동네 랭킹 */}
      <div className="klai-panel overflow-hidden">
        <div className="border-b border-line p-5">
          <h2 className="text-[16px] font-extrabold">매력동네 랭킹 (Top 30)</h2>
          <p className="text-[12px] text-muted2">종합 KLAI 내림차순 · 최신 분기</p>
        </div>
        <div className="divide-y divide-line">
          {top.map((r) => (
            <Link
              key={r.admCd2}
              href={`/place/${r.admCd2}`}
              className="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-card2"
            >
              <span className="w-7 text-center text-[15px] font-black tabular-nums text-amber">{r.rank}</span>
              <GradeBadge grade={r.grade} size="sm" />
              <span className="min-w-0 flex-1 truncate text-[14px] font-bold text-ink">
                {r.name}
                <span className="ml-2 text-[11px] font-normal text-muted2">
                  {r.sigungu} · {r.typology}
                </span>
              </span>
              <div className="hidden h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-navy2/60 sm:block">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${r.klai}%`,
                    background: `linear-gradient(90deg, ${GRADE_HEX[r.grade]}99, ${GRADE_HEX[r.grade]})`,
                    boxShadow: `0 0 5px ${GRADE_HEX[r.grade]}66`,
                  }}
                />
              </div>
              <span className="w-10 text-right text-[14px] font-bold tabular-nums" style={{ color: GRADE_HEX[r.grade] }}>
                {r.klai}
              </span>
              <span className="w-14 text-right">
                <MomentumChip m={r.momentum} />
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* 올해의 과열 / 미발견 동네 — 진정성 갭 (검색 수요 vs 등록 공급) */}
      {(gm.hype.length || gm.hidden.length) ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="klai-panel p-5">
            <h2 className="text-[16px] font-extrabold">🔴 올해의 과열·거품 동네</h2>
            <p className="mb-3 mt-0.5 text-[12px] text-muted2">검색 관심 ≫ 등록 공급 — 서사가 실체를 앞선 곳</p>
            {gm.hype.length ? (
              <ol className="space-y-0.5">
                {gm.hype.map((g, i) => (
                  <li key={g.admCd2}>
                    <Link href={`/place/${g.admCd2}`} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-card2">
                      <span className="w-5 text-center text-[13px] font-black text-warn">{i + 1}</span>
                      <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-ink">
                        {g.name} <span className="text-[11px] font-normal text-muted2">{g.sigungu}</span>
                      </span>
                      <span className="shrink-0 text-[12px] font-bold text-warn">갭 +{g.gap}</span>
                    </Link>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-[12px] text-muted">해당 없음</p>
            )}
          </div>
          <div className="klai-panel p-5">
            <h2 className="text-[16px] font-extrabold">🟢 올해의 미발견 강세 동네</h2>
            <p className="mb-3 mt-0.5 text-[12px] text-muted2">등록 공급 ≫ 검색 관심 — 저평가·노출 여력</p>
            {gm.hidden.length ? (
              <ol className="space-y-0.5">
                {gm.hidden.map((g, i) => (
                  <li key={g.admCd2}>
                    <Link href={`/place/${g.admCd2}`} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-card2">
                      <span className="w-5 text-center text-[13px] font-black text-grade-b">{i + 1}</span>
                      <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-ink">
                        {g.name} <span className="text-[11px] font-normal text-muted2">{g.sigungu}</span>
                      </span>
                      <span className="shrink-0 text-[12px] font-bold text-grade-b">갭 {g.gap}</span>
                    </Link>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-[12px] text-muted">해당 없음</p>
            )}
          </div>
        </div>
      ) : null}

      {/* 유형별 분석 */}
      <div className="klai-panel p-5">
        <h2 className="mb-3 text-[16px] font-extrabold">유형별 평균 매력도</h2>
        <div className="space-y-2.5">
          {[...b.typologyStats]
            .sort((a, c) => c.avgKlai - a.avgKlai)
            .map((t) => (
              <div key={t.typology} className="flex items-center gap-3">
                <span className="w-40 shrink-0 text-[13px] text-ink">{t.typology}</span>
                <span className="w-10 shrink-0 text-[11px] text-muted2">{t.count}곳</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-navy2/60">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${t.avgKlai}%`,
                      background: `linear-gradient(90deg, ${GRADE_HEX[gradeOf(t.avgKlai)]}99, ${GRADE_HEX[gradeOf(t.avgKlai)]})`,
                      boxShadow: `0 0 6px ${GRADE_HEX[gradeOf(t.avgKlai)]}66`,
                    }}
                  />
                </div>
                <span className="w-10 text-right text-[13px] font-bold tabular-nums text-blue-l">{t.avgKlai}</span>
              </div>
            ))}
        </div>
      </div>

      <p className="text-center text-[11px] text-muted2">
        PDF 리포트는 서버에서 생성되어 권한자에게 제공됩니다. (이 웹 뷰어에는 인쇄 버튼이 없습니다 · 스펙 §15)
      </p>
    </article>
  );
}
