"use client";

// 루트 레이아웃까지 깨졌을 때의 최후 에러 바운더리 — 자체 html/body 렌더 필수.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#0b1b30", color: "#fff", fontFamily: "Pretendard, system-ui, sans-serif" }}>
        <div style={{ textAlign: "center", padding: 24 }}>
          <div style={{ fontSize: 52 }}>⚠️</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: "12px 0 8px" }}>문제가 발생했어요</h1>
          <p style={{ color: "#9fb0c4", fontSize: 14, margin: 0 }}>잠시 후 다시 시도해 주세요.</p>
          <button onClick={reset} style={{ marginTop: 24, borderRadius: 999, border: 0, background: "#a3e635", color: "#0b1b30", padding: "12px 24px", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>다시 시도</button>
        </div>
      </body>
    </html>
  );
}
