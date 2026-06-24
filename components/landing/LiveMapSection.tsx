"use client";

import { useState } from "react";
import { LandingHero3DMapMount } from "./LandingHero3DMapMount";
import type { Hero3DPoint } from "./LandingHero3DMap";
import { MomentumBars, type BarItem } from "./MomentumBars";
import { DongDetailModal } from "./DongDetailModal";
import { CountUp } from "./CountUp";

// 3D 라이브맵 카드 + 모멘텀 Top + 상세 팝업을 묶는 클라이언트 섹션.
// 3D 기둥 클릭 또는 모멘텀 막대 클릭 → 같은 상세 팝업.
export function LiveMapSection({ points, total }: { points: Hero3DPoint[]; total: number }) {
  const [modal, setModal] = useState<Hero3DPoint | null>(null);
  const byCd = new Map(points.map((p) => [p.cd, p]));
  const barItems: BarItem[] = [
    ...points.filter((p) => p.kind === "riser").slice(0, 5).map((p) => ({ cd: p.cd, name: p.name, sigungu: p.sigungu, momentum: p.momentum, kind: "rise" as const })),
    ...points.filter((p) => p.kind === "faller").slice(0, 3).map((p) => ({ cd: p.cd, name: p.name, sigungu: p.sigungu, momentum: p.momentum, kind: "fall" as const })),
  ];

  return (
    <>
      {/* 풀블리드 3D 라이브맵 — 최대 폭, 박스/아이프레임 없이 edge-to-edge */}
      <section
        className="relative z-10 mt-3 h-[64vh] min-h-[480px] w-full overflow-hidden border-y-[1.5px]"
        style={{ background: "linear-gradient(160deg,#0b1c2e,#0d2b5e 60%,#0a1626)", borderColor: "#0d2b5e" }}
      >
        <LandingHero3DMapMount points={points} onPick={setModal} />
      </section>

      {/* 모멘텀 Top — 컨테이너 */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <div className="grid grid-cols-2 content-center gap-3">
            <Stat to={total} label="분석 행정동" />
            <Stat to={13} label="실데이터 소스" />
            <div className="col-span-2 rounded-[20px] border-[1.5px] border-amber bg-amber px-5 py-5 text-center">
              <div className="font-display text-[28px] font-black leading-none tracking-tight text-onaccent">매주 월요일</div>
              <div className="mt-1.5 text-[12px] font-bold" style={{ color: "#2b3d0a" }}>전국 매력도 리프레시</div>
            </div>
          </div>
          <MomentumBars items={barItems} title="🔥 이번 주 모멘텀 Top" onPick={(cd) => { const p = byCd.get(cd); if (p) setModal(p); }} />
        </div>
      </section>

      {modal && <DongDetailModal p={modal} onClose={() => setModal(null)} />}
    </>
  );
}

function Stat({ to, label, warn }: { to: number; label: string; warn?: boolean }) {
  return (
    <div className="rounded-[20px] border-[1.5px] border-line bg-card2 px-4 py-5 text-center">
      <CountUp to={to} className={`font-display text-[28px] font-extrabold tabular-nums leading-none ${warn ? "text-warn" : "text-ink"}`} />
      <div className="mt-1.5 text-[12px] font-semibold text-muted2">{label}</div>
    </div>
  );
}
