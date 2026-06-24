import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://flatalelocal.vercel.app";
const DESC =
  "Flagtale — 로컬을 발견하고 경험하는 플랫폼. 전국 행정동 매력도(KLAI 지수)를 지도 위에 색·다이어그램으로 보여주고, 젠트리·소멸·내러티브를 진단해 리포트로 발행합니다.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Flagtale · 로컬을 발견하고 경험하다",
    template: "%s · Flagtale",
  },
  description: DESC,
  openGraph: {
    title: "Flagtale · 로컬을 발견하고 경험하다",
    description: DESC,
    siteName: "Flagtale",
    locale: "ko_KR",
    type: "website",
    url: SITE_URL,
  },
  twitter: { card: "summary_large_image", title: "Flagtale", description: DESC },
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
