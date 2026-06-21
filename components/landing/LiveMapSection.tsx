"use client";

import { useState } from "react";
import { LandingHero3DMapMount } from "./LandingHero3DMapMount";
import type { Hero3DPoint } from "./LandingHero3DMap";
import { MomentumBars, type BarItem } from "./MomentumBars";
import { DongDetailModal } from "./DongDetailModal";
import { CountUp } from "./CountUp";

// 풀폭 3D 라이브맵 + 요약(스탯·모멘텀 그래프) + 상세 팝업을 묶는 클라이언트 섹션.
// 3D 기둥 클릭 또는 모멘텀 막대 클릭 → 같은 상세 팝업.
export function LiveMapSection({ points, total, rising, declining }: { points: Hero3DPoint[]; total: number; rising: number; declining: number }) {
  const [modal, setModal] = useState<Hero3DPoint | null>(null);
  const byCd = new Map(points.map((p) => [p.cd, p]));
  const barItems: BarItem[] = [
    ...points.filter((p) => p.kind === "riser").slice(0, 5).map((p) => ({ cd: p.cd, name: p.name, sigungu: p.sigungu, momentum: p.momentum, kind: "rise" as const })),
    ...points.filter((p) => p.kind === "faller").slice(0, 3).map((p) => ({ cd: p.cd, name: p.name, sigungu: p.sigungu, momentum: p.momentum, kind: "fall" as const })),
  ];

  return (
    <>
      <section className="relative z-10 h-[74vh] min-h-[560px] w-full border-b border-line">
        <LandingHero3DMapMount points={points} onPick={setModal} />
      </section>

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        <section className="py-8">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="grid grid-cols-2 content-center gap-3">
              <Stat to={total} label="분석 행정동" />
              <Stat to={13} label="실데이터 소스" />
              <Stat to={rising} label="상승 동네" />
              <Stat to={declining} label="위기 동네" warn />
            </div>
            <MomentumBars items={barItems} onPick={(cd) => { const p = byCd.get(cd); if (p) setModal(p); }} />
          </div>
        </section>
      </div>

      {modal && <DongDetailModal p={modal} onClose={() => setModal(null)} />}
    </>
  );
}

function Stat({ to, label, warn }: { to: number; label: string; warn?: boolean }) {
  return (
    <div className="rounded-2xl border border-line bg-card2/50 px-4 py-5 text-center">
      <CountUp to={to} className={`text-[1.7rem] font-black tracking-tight ${warn ? "text-warn" : "text-blue-l"}`} />
      <div className="mt-1 text-[12px] text-muted2">{label}</div>
    </div>
  );
}
