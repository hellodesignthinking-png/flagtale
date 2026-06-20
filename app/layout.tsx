import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: {
    default: "KLAI · 동네 매력도 지도와 진단",
    template: "%s · KLAI",
  },
  description:
    "K-로컬 매력도 지수(KLAI) — 행정동 단위 인구·상권·공간·인식 4축 매력도를 지도 위에 색·다이어그램으로 보여주고, 젠트리·소멸·성공·내러티브를 진단해 리포트로 발행하는 플랫폼.",
};

export const viewport: Viewport = {
  themeColor: "#0b1b30",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css"
        />
        {/* 공간디자인페어 차용 — Poppins(영문·숫자 디스플레이) + Pretendard(국문) */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap"
        />
      </head>
      <body>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
