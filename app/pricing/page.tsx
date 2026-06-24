import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { Button, Pill } from "@/components/ui";
import { FREE_MODE } from "@/lib/tier";

export const metadata: Metadata = { title: "가격" };

const TIERS = [
  {
    name: "Free",
    price: "₩0",
    unit: "",
    desc: "시민·언론",
    icon: "🗺️",
    accent: "#4B9CD3",
    features: ["지도 탐색 · 플래그맵 · 9개 레이어", "동 요약 · KLAI·등급·4축 레이더", "Flagtale Weekly 웹 열람"],
    cta: { label: "지도 탐색", href: "/" },
    highlight: false,
  },
  {
    name: "Pay-per",
    price: "₩9,900",
    unit: "/ 5크레딧",
    desc: "소상공인·창업자",
    icon: "🔎",
    accent: "var(--amber)",
    features: ["지번 진단 1건 = N크레딧", "방향·위기·전략 전체", "서버 생성 PDF"],
    cta: { label: "지번 진단", href: "/diagnose" },
    highlight: true,
  },
  {
    name: "Pro",
    price: "₩39,000",
    unit: "/ 월",
    desc: "개인·소상공인",
    icon: "⭐",
    accent: "#1E7A8C",
    features: ["📊 시그널 분석 (선행/후행 패턴)", "🎯 레버리지 전략 처방", "🎨 행정동 choropleth 색칠", "무제한 진단 · 주간 PDF · 알림"],
    cta: { label: "구독 시작", href: "/auth" },
    highlight: false,
  },
  {
    name: "기관 (B2G/B2B)",
    price: "협의",
    unit: "",
    desc: "지자체·AMC·VC·프랜차이즈",
    icon: "🏛️",
    accent: "#1E5FA8",
    features: ["🏛️ 기관 대시보드 · 경보 인박스", "🔌 데이터 API (키 발급·검증)", "CSV · 애뉴얼 · What-if 정책 ROI"],
    cta: { label: "대시보드 보기", href: "/dashboard" },
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <PageShell>
      <div className="mb-8 text-center">
        <span className="klai-eyebrow">Pricing</span>
        <h1 className="mt-1 font-display text-[clamp(28px,4.4vw,40px)] font-black tracking-[-0.03em]">티어 · 과금</h1>
        <p className="mx-auto mt-2 max-w-xl text-[14px] text-muted">
          공개 등급은 무료, 정밀 진단은 결제·기관 권한 뒤로 (데이터 윤리 · 스펙 §15). 결제는 PortOne v2 · 카카오페이/토스 (현재 목업).
        </p>
      </div>

      {FREE_MODE && (
        <div className="mx-auto mb-6 max-w-2xl rounded-[16px] border-[1.5px] border-amber bg-amber/10 px-5 py-4 text-center">
          <div className="font-display text-[15px] font-black text-ink">🎉 베타 — 현재 <span className="hl-mark">전 기능 무료 공개</span></div>
          <p className="mt-1 text-[12.5px] text-muted">시그널·전략·choropleth·대시보드·API까지 모두 무료로 열려 있습니다. 아래 등급은 추후 유료 전환 예정 로드맵입니다.</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {TIERS.map((t) => (
          <div
            key={t.name}
            className="klai-panel relative flex flex-col overflow-hidden rounded-[20px] border-[1.5px] border-line p-5"
            style={
              t.highlight
                ? { borderColor: "var(--amber)", boxShadow: "0 0 0 1.5px var(--amber), 0 10px 34px -8px color-mix(in srgb, var(--amber) 50%, transparent)" }
                : undefined
            }
          >
            <span
              className="absolute inset-x-0 top-0 h-1"
              style={{ background: `linear-gradient(90deg, ${t.accent}, ${t.accent}55)`, boxShadow: `0 0 12px ${t.accent}` }}
            />
            <div className="flex items-center justify-between">
              <span
                className="grid h-10 w-10 place-items-center rounded-xl text-xl"
                style={{ background: `color-mix(in srgb, ${t.accent} 16%, transparent)`, border: `1px solid color-mix(in srgb, ${t.accent} 45%, transparent)` }}
              >
                {t.icon}
              </span>
              {t.highlight && <Pill tone="amber">인기</Pill>}
            </div>
            <h2 className="mt-3 font-display text-lg font-black tracking-[-0.03em]">{t.name}</h2>
            <div className="mt-1 text-[12px] text-muted2">{t.desc}</div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-3xl font-black" style={{ color: t.highlight ? "var(--amber)" : "var(--ink)" }}>
                {t.price}
              </span>
              <span className="text-[12px] text-muted2">{t.unit}</span>
            </div>
            <ul className="mt-4 flex-1 space-y-2">
              {t.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-[13px] text-muted">
                  <span className="mt-0.5" style={{ color: t.accent }}>
                    ✓
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <Button href={t.cta.href} variant={t.highlight ? "amber" : "outline"} className="mt-5 w-full">
              {t.cta.label}
            </Button>
          </div>
        ))}
      </div>

      <p className="mt-8 text-center text-[12px] text-muted2">
        결제는 서버 검증/웹훅 필수 · 클라이언트 신뢰 금지 (스펙 §15). 영수증·환불은 PortOne 콘솔 연동.
      </p>
    </PageShell>
  );
}
