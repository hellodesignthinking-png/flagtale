"use client";

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from "recharts";
import type { PlaceScore } from "@/lib/types";

// 4축 레이더 (D1~D4) — 동 vs (선택) 비교군 평균. 그라데이션 채움 + 글로우 + 꼭짓점 점.
export function ScoreRadar({
  score,
  peerAvg,
  height = 240,
}: {
  score: PlaceScore;
  peerAvg?: { d1: number; d2: number; d3: number; d4: number };
  height?: number;
}) {
  const data = [
    { axis: "인구·지속성", v: score.d1, peer: peerAvg?.d1 },
    { axis: "경제·상권", v: score.d2, peer: peerAvg?.d2 },
    { axis: "공간·물리", v: score.d3, peer: peerAvg?.d3 },
    { axis: "인식·감성", v: score.d4, peer: peerAvg?.d4 },
  ];
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} outerRadius="72%">
        <defs>
          <radialGradient id="radarFill" cx="50%" cy="50%" r="68%">
            <stop offset="0%" stopColor="#6fb3e0" stopOpacity={0.6} />
            <stop offset="70%" stopColor="#2f7bc4" stopOpacity={0.32} />
            <stop offset="100%" stopColor="#1E5FA8" stopOpacity={0.12} />
          </radialGradient>
        </defs>
        <PolarGrid stroke="var(--line)" strokeOpacity={0.7} />
        <PolarAngleAxis dataKey="axis" tick={{ fill: "var(--muted)", fontSize: 12, fontWeight: 600 }} />
        <PolarRadiusAxis
          domain={[0, 100]}
          tickCount={5}
          tick={{ fill: "var(--muted2)", fontSize: 9 }}
          angle={90}
          stroke="var(--line)"
          strokeOpacity={0.5}
        />
        {peerAvg && (
          <Radar
            name="비교군 평균"
            dataKey="peer"
            stroke="var(--muted2)"
            strokeWidth={1.5}
            fill="var(--muted2)"
            fillOpacity={0.08}
            strokeDasharray="4 3"
            isAnimationActive={false}
          />
        )}
        <Radar
          name="이 동"
          dataKey="v"
          stroke="#5aa6db"
          strokeWidth={2.4}
          fill="url(#radarFill)"
          fillOpacity={1}
          dot={{ r: 3.5, fill: "#5aa6db", stroke: "var(--navy)", strokeWidth: 1.5 }}
          activeDot={{ r: 5 }}
          style={{ filter: "drop-shadow(0 0 7px rgba(90,166,219,0.55))" }}
          isAnimationActive
          animationDuration={900}
          animationEasing="ease-out"
        />
        {peerAvg && <Legend wrapperStyle={{ fontSize: 11, color: "var(--muted)" }} />}
      </RadarChart>
    </ResponsiveContainer>
  );
}
