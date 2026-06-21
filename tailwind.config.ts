import type { Config } from "tailwindcss";

/**
 * ZeroSite 디자인 시스템 (KLAI 빌드 스펙 §12 · 시스템맵 CSS 변수)
 * 색은 globals.css 의 CSS 변수로 정의하고 여기서 의미 토큰으로 연결한다.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 불투명도 수정자(bg-navy/95 등) 지원: RGB 채널 + <alpha-value>.
        // 채널 변수가 hex 변수와 동일 색이라 불투명 사용(bg-navy)도 그대로.
        navy: "rgb(var(--navy-rgb) / <alpha-value>)",
        navy2: "rgb(var(--navy2-rgb) / <alpha-value>)",
        card: "var(--card)",
        card2: "rgb(var(--card2-rgb) / <alpha-value>)",
        line: "rgb(var(--line-rgb) / <alpha-value>)",
        blue: "rgb(var(--blue-rgb) / <alpha-value>)",
        "blue-l": "var(--blue-l)",
        amber: "rgb(var(--amber-rgb) / <alpha-value>)",
        "amber-d": "var(--amber-d)",
        onaccent: "var(--on-accent)", // 라임 위 텍스트(다크)
        "accent-bright": "rgb(var(--accent-bright-rgb) / <alpha-value>)", // 비비드 라임(형광·배지)
        green: "var(--green)",
        "green-soft": "var(--green-soft)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        muted2: "var(--muted2)",
        warn: "rgb(var(--warn-rgb) / <alpha-value>)",
        // 등급 발산 스케일
        "grade-s": "var(--gS)",
        "grade-a": "var(--gA)",
        "grade-b": "var(--gB)",
        "grade-c": "var(--gC)",
        "grade-d": "var(--gD)",
        "grade-e": "var(--gE)",
      },
      fontFamily: {
        sans: ["var(--font-pretendard)", "Pretendard", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Poppins", "var(--font-pretendard)", "sans-serif"],
      },
      borderRadius: {
        xl: "18px",
      },
      keyframes: {
        "pulse-ring": {
          "0%, 100%": { opacity: "0.35" },
          "50%": { opacity: "1" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
      },
      animation: {
        "pulse-ring": "pulse-ring 2.2s ease-in-out infinite",
        "fade-in": "fade-in 0.4s ease-out",
        "slide-in": "slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
