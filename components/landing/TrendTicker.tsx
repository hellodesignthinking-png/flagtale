"use client";

// 실시간 급상승 티커 — careet 시그니처 다크 바
const ITEMS = [
  { text: "⚡ 실시간 급상승", accent: true },
  { text: "성수동 +41" },
  { text: "문래동 +33" },
  { text: "공주 제민천 +22" },
  { text: "지좌동 −8.8", warn: true },
  { text: "파평면 +8" },
  { text: "비산1동 +7.4" },
  { text: "서원동 +7.1" },
];

export function TrendTicker() {
  const doubled = [...ITEMS, ...ITEMS];
  return (
    <div className="ticker-bar overflow-hidden" style={{ background: "#131316", color: "#fff" }}>
      <div
        className="ticker-track inline-flex gap-7 whitespace-nowrap py-2"
        style={{ fontSize: "12.5px", fontWeight: 700, letterSpacing: ".01em" }}
      >
        {doubled.map((item, i) => (
          <span
            key={i}
            style={{
              color: item.accent ? "#d9f21e" : item.warn ? "#fb7185" : undefined,
            }}
          >
            {item.text}
          </span>
        ))}
      </div>
    </div>
  );
}
