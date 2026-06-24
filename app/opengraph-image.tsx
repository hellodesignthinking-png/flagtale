import { ImageResponse } from "next/og";

// 공유 링크 미리보기 카드 (카카오톡·X·Slack). 영문 카피(한글 폰트 이슈 회피).
// Satori 규칙: 자식이 둘 이상인 div는 display:flex 필수, <br/> 금지(단일 문자열로).
export const runtime = "edge";
export const alt = "Flagtale — Korea's local trend & attractiveness";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 84, background: "linear-gradient(135deg,#0b1b30 0%,#13325c 100%)", color: "#ffffff", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 68, height: 68, borderRadius: 18, background: "#a3e635", color: "#0b1b30", fontSize: 42, fontWeight: 800, marginRight: 18 }}>F</div>
          <div style={{ fontSize: 36, fontWeight: 800 }}>Flagtale</div>
        </div>
        <div style={{ fontSize: 62, fontWeight: 800, marginTop: 36, lineHeight: 1.1 }}>{"Discover Korea's neighborhoods"}</div>
        <div style={{ fontSize: 28, color: "#9fb0c4", marginTop: 26 }}>{"Local attractiveness · live map · data lab"}</div>
      </div>
    ),
    size
  );
}
