"use client";

import Link from "next/link";
import { useEffect } from "react";
import { GRADE_HEX } from "@/lib/constants";
import type { Grade } from "@/lib/types";
import type { Hero3DPoint } from "./LandingHero3DMap";

const VIT: Record<string, string> = { active: "활발", stable: "안정", shrinking: "위축" };

// 그래프(3D 기둥·모멘텀 막대) 클릭 시 뜨는 상세 팝업
export function DongDetailModal({ p, onClose }: { p: Hero3DPoint; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const up = p.kind === "riser";
  const accent = up ? "#16a34a" : "#e11d48";
  const axes: [string, number][] = [["인구·지속", p.d1], ["경제·상권", p.d2], ["공간·물리", p.d3], ["인식·감성", p.d4]];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true">
      <div className="relative max-h-[90vh] w-full max-w-md overflow-auto rounded-3xl border border-line bg-card2 p-6 text-ink shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} aria-label="닫기" className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-navy/60 text-[15px] text-muted hover:text-ink">✕</button>

        <div className="flex items-start gap-3 pr-8">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-[20px] font-black text-white" style={{ background: GRADE_HEX[p.grade as Grade] ?? "#888" }}>{p.grade}</span>
          <div className="min-w-0">
            <div className="cat-tag">{[p.sigungu, p.typology].filter(Boolean).join(" · ") || "전국"}</div>
            <div className="truncate text-[22px] font-extrabold leading-tight">{p.name}</div>
          </div>
        </div>

        <div className="mt-3 flex items-end gap-2.5">
          <span className="text-[2.6rem] font-black leading-none tabular-nums">{p.klai}</span>
          <span className="pb-1 text-[12px] font-bold text-muted2">KLAI</span>
          <span className="mb-1 ml-auto rounded-full px-2.5 py-1 text-[12.5px] font-extrabold" style={{ background: `${accent}1f`, color: accent }}>
            {up ? "▲ 상승" : "▼ 하락"} 모멘텀 {p.momentum >= 0 ? "+" : ""}{p.momentum}
          </span>
        </div>

        {/* 4축 그래프 */}
        <div className="mt-4 rounded-2xl border border-line bg-navy/30 p-4">
          <div className="mb-2 text-[12px] font-extrabold text-muted">4대 축 점수</div>
          <div className="space-y-2">
            {axes.map(([k, v]) => (
              <div key={k} className="flex items-center gap-2.5">
                <span className="w-16 shrink-0 text-[12px] text-muted">{k}</span>
                <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-navy/50">
                  <div className="absolute inset-y-0 left-0 rounded-full bg-blue-l" style={{ width: `${Math.max(0, Math.min(100, v))}%` }} />
                </div>
                <span className="w-7 shrink-0 text-right text-[12px] font-bold tabular-nums">{Math.round(v)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 뜨는/쇠퇴 이유 */}
        <div className="mt-3 rounded-2xl border p-4" style={{ borderColor: `${accent}40`, background: `${accent}10` }}>
          <div className="text-[13px] font-extrabold" style={{ color: accent }}>{up ? "뜨는 이유" : "쇠퇴·위기 이유"} · {p.reason}</div>
          {p.reasonDetail && <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{p.reasonDetail}</p>}
        </div>

        {/* 세부 지표 */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Metric label="젠트리 단계" value={`${p.gentriStage} / 5`} />
          <Metric label="시장 활성도" value={VIT[p.marketVitality] ?? "—"} />
          {typeof p.popChangeRate === "number" && <Metric label="인구 증감(YoY)" value={`${p.popChangeRate >= 0 ? "+" : ""}${p.popChangeRate.toFixed(1)}%`} />}
          {typeof p.budgetInflow === "number" && <Metric label="공공투자" value={`${Math.round(p.budgetInflow)}억`} />}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link href={`/place/${p.cd}`} className="rounded-full border border-line py-2.5 text-center text-[13px] font-bold text-ink hover:border-blue/50">동 리포트 →</Link>
          <Link href={`/diagnose?admCd=${p.cd}`} className="btn-glow rounded-full bg-amber py-2.5 text-center text-[13px] font-extrabold text-onaccent">지번 진단 →</Link>
        </div>
        <p className="mt-3 text-center text-[11px] text-muted2">샘플·잠정(Provisional) · 지번 단위 정밀 진단은 결제 후</p>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-card2/60 px-3 py-2">
      <div className="text-[11px] text-muted2">{label}</div>
      <div className="text-[15px] font-extrabold text-ink">{value}</div>
    </div>
  );
}
