import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { GRADE_HEX } from "@/lib/constants";
import type { Grade } from "@/lib/types";
import { momentumArrow, signed } from "@/lib/utils";

export function Panel({
  className,
  children,
  ...rest
}: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("klai-panel p-5", className)} {...rest}>
      {children}
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="klai-eyebrow">{children}</div>;
}

export function ProvisionalBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn("klai-tag klai-tag-sample", className)}
      title="현재 점수·신호·인구·조달은 예시(합성) 데이터입니다. 실데이터 출처·연동 상태는 상단 '데이터 출처' 메뉴 참고."
    >
      예시 데이터(샘플)
    </span>
  );
}

export function GradeBadge({ grade, size = "md" }: { grade: Grade; size?: "sm" | "md" | "lg" }) {
  const dims = size === "lg" ? "h-9 w-9 text-lg" : size === "sm" ? "h-5 w-5 text-[11px]" : "h-7 w-7 text-sm";
  return (
    <span
      className={cn("inline-flex items-center justify-center rounded-md font-extrabold text-white", dims)}
      style={{ background: GRADE_HEX[grade] }}
    >
      {grade}
    </span>
  );
}

export function MomentumChip({ m }: { m: number }) {
  const arrow = momentumArrow(m);
  const color = arrow === "▲" ? "var(--gB)" : arrow === "▼" ? "var(--warn)" : "var(--muted)";
  return (
    <span className="inline-flex items-center gap-1 text-sm font-bold" style={{ color }}>
      {arrow} <span className="tabular-nums">{signed(m)}</span>
    </span>
  );
}

export function Stat({
  label,
  value,
  sub,
  accent,
  icon,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: "blue" | "amber" | "warn";
  icon?: ReactNode;
}) {
  const color =
    accent === "amber" ? "var(--amber)" : accent === "warn" ? "var(--warn)" : "var(--blue-l)";
  return (
    <div className="bento group relative overflow-hidden rounded-2xl border border-line bg-card2/70 px-4 py-3.5">
      {/* 강조 글로우 */}
      <div
        className="pointer-events-none absolute -right-6 -top-8 h-20 w-20 rounded-full opacity-25 blur-2xl transition-opacity group-hover:opacity-50"
        style={{ background: color }}
      />
      {icon && <div className="mb-1 text-[15px]" style={{ color }}>{icon}</div>}
      <div className="text-[26px] font-extrabold leading-none tabular-nums" style={{ color }}>
        {value}
      </div>
      <div className="mt-1.5 text-xs font-medium text-muted">{label}</div>
      {sub && <div className="mt-1 text-[11px] text-muted2">{sub}</div>}
    </div>
  );
}

type ButtonProps = {
  children: ReactNode;
  variant?: "primary" | "ghost" | "amber" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
  href?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const BTN_BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
const BTN_VARIANT: Record<string, string> = {
  primary: "bg-blue text-white hover:bg-[#2a6fbd] btn-glow",
  amber: "bg-amber text-[#06210d] hover:bg-[#0fb53e] btn-glow",
  ghost: "text-ink hover:bg-card2",
  outline: "border border-line text-ink hover:border-blue/50 hover:bg-card2",
};
const BTN_SIZE: Record<string, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  href,
  ...rest
}: ButtonProps) {
  const cls = cn(BTN_BASE, BTN_VARIANT[variant], BTN_SIZE[size], className);
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}

export function SectionHead({
  no,
  title,
  desc,
}: {
  no?: string;
  title: string;
  desc?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-center gap-3 border-b border-line pb-3">
      <span className="h-5 w-1.5 shrink-0 rounded-full bg-gradient-to-b from-blue-l to-amber" />
      {no && (
        <span className="rounded-md border border-amber/30 bg-amber/10 px-2 py-0.5 text-[11px] font-extrabold tracking-wider text-amber">
          {no}
        </span>
      )}
      <h2 className="text-xl font-extrabold tracking-tight">{title}</h2>
      {desc && <p className="ml-auto hidden text-right text-[13px] text-muted2 sm:block">{desc}</p>}
    </div>
  );
}

export function Pill({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "amber" | "warn" | "blue" }) {
  const map = {
    muted: "border-line text-muted",
    amber: "border-amber/40 text-amber bg-amber/10",
    warn: "border-warn/40 text-warn bg-warn/10",
    blue: "border-blue/40 text-blue-l bg-blue/10",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", map[tone])}>
      {children}
    </span>
  );
}
