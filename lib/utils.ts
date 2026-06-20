import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPeriod(p: string): string {
  if (/^\d{4}Q\d$/.test(p)) return p.replace("Q", " Q");
  if (/^\d{4}-W\d+$/.test(p)) return p.replace("-W", " 주차 ");
  return p;
}

export function momentumArrow(m: number): "▲" | "▼" | "→" {
  if (m > 0.8) return "▲";
  if (m < -0.8) return "▼";
  return "→";
}

export function signed(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}

/** 만원 단위 금액 → 억/만원 표기 */
export function formatKRW(manwon: number): string {
  if (manwon >= 10000) {
    const eok = manwon / 10000;
    return `${eok % 1 === 0 ? eok : eok.toFixed(1)}억`;
  }
  return `${manwon.toLocaleString()}만`;
}

export function formatPop(n: number): string {
  return n.toLocaleString() + "명";
}
