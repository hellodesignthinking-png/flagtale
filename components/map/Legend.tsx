"use client";

import {
  AXIS_LABEL,
  AXIS_RGB,
  GRADE_HEX,
  GRADE_RANGE,
  MARKET_HEX,
  MARKET_LABEL,
  NARRATIVE_HEX,
  NARRATIVE_LABEL,
  WARN_HEX,
} from "@/lib/constants";
import type { Grade, LayerId } from "@/lib/types";

function Sw({ color, ring }: { color?: string; ring?: boolean }) {
  if (ring)
    return (
      <svg width="15" height="15" className="shrink-0">
        <circle cx="7.5" cy="7.5" r="5.5" fill="none" stroke={WARN_HEX} strokeWidth="2" />
      </svg>
    );
  return <span className="inline-block h-3.5 w-3.5 shrink-0 rounded" style={{ background: color }} />;
}

export function Legend({ layer }: { layer: LayerId }) {
  const items: { color?: string; ring?: boolean; label: string }[] = (() => {
    if (layer === "momentum")
      return [
        { color: "#2FB4A0", label: "▲ 상승" },
        { color: "#5b7596", label: "→ 보합" },
        { color: WARN_HEX, label: "▼ 하락" },
      ];
    if (layer === "popchange")
      return [
        { color: "#2FB4A0", label: "인구 증가" },
        { color: "#5b7596", label: "보합" },
        { color: WARN_HEX, label: "인구 감소" },
      ];
    if (layer === "budget")
      return [
        { color: "#28405f", label: "유입 적음" },
        { color: "#9a7a3e", label: "중간" },
        { color: "#E8A83A", label: "유입 많음" },
      ];
    if (layer === "vitality")
      return [
        { color: "#28405f", label: "등록 없음" },
        { color: "#9a7a3e", label: "공급·검색" },
        { color: "#F09628", label: "활력 높음" },
      ];
    if (layer === "authgap")
      return [
        { color: "#D64434", label: "과열·거품 (검색≫등록)" },
        { color: "#5b6470", label: "균형 / 무신호" },
        { color: "#24A86C", label: "미발견 (등록≫검색)" },
      ];
    if (layer === "commerce")
      return [
        { color: "#28405f", label: "상가 적음" },
        { color: "#1a8a5e", label: "중간" },
        { color: "#18B460", label: "상가 밀집" },
      ];
    if (layer === "vacant")
      return [
        { color: "#2e4e60", label: "빈집 적음" },
        { color: "#9a6048", label: "보통" },
        { color: "#C84030", label: "빈집 많음(위기)" },
      ];
    if (layer === "gentri")
      return [
        { color: "#2e456b", label: "정상" },
        { color: "#785a46", label: "G 상승" },
        { ring: true, label: "젠트리 경보" },
      ];
    if (layer === "market")
      return (["active", "stable", "shrinking"] as const).map((k) => ({
        color: MARKET_HEX[k],
        label: MARKET_LABEL[k],
      }));
    if (layer === "narrative")
      return [
        ...(["formation", "spread", "peak"] as const).map((k) => ({
          color: NARRATIVE_HEX[k],
          label: NARRATIVE_LABEL[k],
        })),
        { color: "#D2691E", label: "젠트리" }, // 검증 핫지역 5단계(서사<자본)
        { color: NARRATIVE_HEX.decline, label: NARRATIVE_LABEL.decline },
        { color: "#c44030", label: "부정서사" },
      ];
    if (layer === "axis4")
      return (["d1", "d2", "d3", "d4"] as const).map((k) => ({
        color: `rgb(${AXIS_RGB[k][0]},${AXIS_RGB[k][1]},${AXIS_RGB[k][2]})`,
        label: AXIS_LABEL[k],
      }));
    // grade layers
    return (["S", "A", "B", "C", "D", "E"] as Grade[]).map((g) => ({
      color: GRADE_HEX[g],
      label: `${g} ${GRADE_RANGE[g]}`,
    }));
  })();

  return (
    <div className="flex flex-wrap gap-x-3.5 gap-y-1.5 text-[11.5px] text-muted">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <Sw color={it.color} ring={it.ring} />
          {it.label}
        </span>
      ))}
    </div>
  );
}
