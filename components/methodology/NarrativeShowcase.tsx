"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AREA_NARRATIVES, STAGE_META, AUTH_META, narrativePrimaryAdmCd, reasonsFor, type LifeStage } from "@/lib/narratives";

const STAGE_ORDER: LifeStage[] = ["formation", "spread", "peak", "gentri", "decline"];

export function NarrativeShowcase() {
  const [stage, setStage] = useState<LifeStage | "all">("all");

  const filtered = useMemo(
    () => (stage === "all" ? AREA_NARRATIVES : AREA_NARRATIVES.filter((a) => a.stage === stage)),
    [stage]
  );
  const countOf = (s: LifeStage) => AREA_NARRATIVES.filter((a) => a.stage === s).length;

  return (
    <div>
      {/* 단계 필터 */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        <button
          onClick={() => setStage("all")}
          className={`rounded-full border-[1.5px] px-3 py-1.5 text-[12.5px] font-extrabold transition-colors ${stage === "all" ? "border-ink bg-ink text-white" : "border-line bg-card text-ink hover:border-ink"}`}
        >
          전체 <span className="opacity-60">{AREA_NARRATIVES.length}</span>
        </button>
        {STAGE_ORDER.map((s) => {
          const m = STAGE_META[s];
          const active = stage === s;
          return (
            <button
              key={s}
              onClick={() => setStage(s)}
              className="rounded-full border-[1.5px] px-3 py-1.5 text-[12.5px] font-extrabold transition-colors"
              style={active ? { borderColor: m.color, background: m.color, color: "#fff" } : { borderColor: `${m.color}66`, background: `${m.color}10`, color: m.color }}
            >
              {m.emoji} {m.short} <span className="opacity-70">{countOf(s)}</span>
            </button>
          );
        })}
      </div>

      {/* 내러티브 카드 */}
      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((a) => {
          const m = STAGE_META[a.stage];
          const auth = AUTH_META[a.authenticity];
          const admCd = narrativePrimaryAdmCd(a.name);
          const reasons = reasonsFor(a.name);
          return (
            <div key={a.name} className="flex flex-col rounded-[20px] border-[1.5px] border-line bg-card p-4" style={{ borderLeftWidth: 5, borderLeftColor: m.color }}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full px-2.5 py-1 text-[11px] font-extrabold" style={{ background: `${m.color}1a`, color: m.color }}>{m.emoji} {m.label}</span>
                <span className="text-[15px] font-black tracking-tight text-ink">{a.name}</span>
                <span className="text-[11.5px] font-semibold text-muted2">{a.region}</span>
                <span className="ml-auto rounded-full px-2 py-0.5 text-[10.5px] font-bold" style={{ color: auth.color, background: "var(--card2)" }}>{auth.label}</span>
              </div>

              <p className="mt-2.5 text-[14px] font-extrabold leading-snug text-ink">“{a.theme}”</p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{a.arc}</p>

              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {a.keywords.map((k) => (
                  <span key={k} className="rounded-full bg-card2 px-2.5 py-0.5 text-[11px] font-bold text-muted">#{k}</span>
                ))}
              </div>
              {reasons.length > 0 && (
                <div className="mt-3 rounded-[12px] bg-card2/60 p-3">
                  <div className="mb-1.5 text-[11px] font-extrabold text-amber">💡 왜 떴나</div>
                  <ul className="space-y-1">
                    {reasons.map((r, i) => (
                      <li key={i} className="flex gap-1.5 text-[12px] leading-relaxed text-ink"><span className="shrink-0 font-bold text-muted2">{i + 1}</span>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-3 grid gap-1.5 border-t border-line pt-2.5 text-[11.5px] sm:grid-cols-2">
                <div><span className="font-bold text-muted2">앵커 </span><span className="text-muted">{a.anchor}</span></div>
                <div><span className="font-bold text-muted2">진정성 </span><span className="text-muted">{a.authNote}</span></div>
              </div>
              {a.caution && (
                <div className="mt-2 rounded-[10px] px-2.5 py-1.5 text-[11.5px] font-semibold" style={{ background: "rgba(225,29,72,.08)", color: "var(--warn)" }}>⚠ {a.caution}</div>
              )}
              {admCd && (
                <Link href={`/place/${admCd}`} className="mt-3 inline-flex items-center gap-1 self-start rounded-full border-[1.5px] border-line bg-card px-3 py-1.5 text-[11.5px] font-extrabold text-ink transition-colors hover:border-ink">📊 이 동네 매력도 진단 →</Link>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-[11.5px] leading-relaxed text-muted2">
        ※ 핫지역 큐레이션 — 단계는 공개 자료·언론 보도 기반의 <b className="text-muted">개념적 매핑</b>(잠정). 실데이터 연동 시 네이버 검색·기사 동조도로 단계를 자동 산출합니다. 같은 동네도 분기마다 단계가 <b className="text-muted">이동</b>합니다.
      </p>
    </div>
  );
}
