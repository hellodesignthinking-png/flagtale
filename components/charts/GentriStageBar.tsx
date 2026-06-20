"use client";

import { cn } from "@/lib/utils";

// 젠트리피케이션 6단계 (시스템맵 §3a 포팅) — 진행 여정형. 지나온 단계 채움 · 현재 글로우+핀 · 미래 흐림.
const STAGES: { name: string; detail: string; color: string }[] = [
  { name: "0 잠재", detail: "저렴한 임대료 + 노후·접근성 양호", color: "#3E9AA8" },
  { name: "1 태동", detail: "청년·예술·독립상점 유입, 식음 다양화", color: "#1E7A8C" },
  { name: "2 점화", detail: "미디어·SNS 버즈 급증, 외부유입 증가", color: "#E2A33A" },
  { name: "3 과열", detail: "자본·프랜차이즈 진입, 임대료 급등", color: "#D2691E" },
  { name: "4 내몰림", detail: "초기 상점·원주민 이탈, 획일화", color: "#A23A2A" },
  { name: "5 쇠퇴", detail: "과잉임대료 → 공실 증가 → 매력 하락", color: "#6b2b22" },
];

export function GentriStageBar({ current = -1, compact = false }: { current?: number; compact?: boolean }) {
  return (
    <div className="pt-3">
      <div className="flex gap-1.5">
        {STAGES.map((s, i) => {
          const active = i === current;
          const passed = current >= 0 && i < current;
          return (
            <div key={i} className="flex-1 text-center">
              <div className="relative">
                {/* 현재 단계 핀 마커 */}
                {active && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <svg width="14" height="9" viewBox="0 0 14 9" style={{ filter: `drop-shadow(0 0 4px ${s.color})` }}>
                      <path d="M7 9L0 0h14z" fill={s.color} />
                    </svg>
                  </div>
                )}
                <div
                  className="h-2.5 rounded-full transition-all"
                  style={{
                    background: active || passed ? `linear-gradient(90deg, ${s.color}cc, ${s.color})` : s.color,
                    opacity: active ? 1 : passed ? 0.9 : 0.28,
                    boxShadow: active ? `0 0 12px ${s.color}, 0 0 4px ${s.color}` : "none",
                    transform: active ? "scaleY(1.25)" : "none",
                  }}
                />
              </div>
              <div className={cn("mt-1.5 text-[11px] font-bold", active ? "text-ink" : passed ? "text-muted" : "text-muted2")}>
                {s.name}
              </div>
              {!compact && <div className="mt-0.5 text-[10px] leading-tight text-muted2">{s.detail}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
