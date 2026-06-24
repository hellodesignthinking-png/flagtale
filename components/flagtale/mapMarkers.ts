// 네이버 부동산식 마커 HTML — 줌 단계별 상세도(티어) + 호버/선택 상태 + 클러스터 배지. Naver(icon content)용.
import type { MapItem } from "@/lib/flagtale-types";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));

/** 줌 → 마커 상세 티어. 0: 점(축소) · 1: +이름 · 2: +핵심수치(확대) */
export function markerTier(zoom: number): 0 | 1 | 2 {
  return zoom >= 13.5 ? 2 : zoom >= 10.8 ? 1 : 0;
}

/** 마커 핵심 수치 (부동산 가격표처럼) — 투어·숙박=가격, 그 외=평점 */
function metaText(it: MapItem): string {
  if (it.price) return it.price >= 10000 ? `${Math.round((it.price / 10000) * 10) / 10}만` : `${it.price.toLocaleString()}원`;
  if (it.rating) return `★${Math.round(it.rating * 10) / 10}`;
  return "";
}

/** 부동산식 마커 핀 HTML (꼬리 포함). selected > hovered > tier 순으로 강조 */
export function markerPillHtml(it: MapItem, selected: boolean, tier: 0 | 1 | 2, hovered = false): string {
  const named = selected || hovered || tier >= 1;
  const metaed = selected || hovered || tier >= 2;
  const meta = metaed ? metaText(it) : "";
  const scale = selected ? "scale(1.15)" : hovered ? "scale(1.12)" : "scale(1)";
  const bg = selected ? it.color : "#ffffff";
  const fg = selected ? "#ffffff" : "#1f2024";
  const metaColor = selected ? "rgba(255,255,255,.95)" : it.color;
  const border = selected ? "2px solid #ffffff" : hovered ? `1.5px solid ${it.color}` : "1px solid rgba(0,0,0,.10)";
  const shadow = selected
    ? `0 7px 18px ${it.color}73,0 0 0 3px ${it.color}40`
    : hovered ? `0 7px 17px rgba(0,0,0,.34),0 0 0 2px ${it.color}3a` : "0 3px 10px rgba(0,0,0,.30)";
  const chip = selected
    ? `<span style="font-size:13px;line-height:1">${it.emoji}</span>`
    : `<span style="display:grid;place-items:center;width:18px;height:18px;border-radius:50%;background:${it.color}1f;font-size:11px;line-height:1">${it.emoji}</span>`;
  const name = named ? `<span style="font-size:11.5px;font-weight:800;max-width:122px;overflow:hidden;text-overflow:ellipsis;color:${fg};letter-spacing:-.2px">${esc(it.name)}</span>` : "";
  const metaEl = meta ? `<span style="font-size:11px;font-weight:900;color:${metaColor}">${meta}</span>` : "";
  const tail = `<span style="position:absolute;left:50%;bottom:-5px;transform:translateX(-50%);width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid ${bg}"></span>`;
  return `<div style="position:relative;transform:translate(-50%,-100%) ${scale};transform-origin:center bottom;display:inline-flex;align-items:center;gap:5px;white-space:nowrap;border-radius:999px;background:${bg};border:${border};padding:${named || metaed ? "3px 9px 3px 4px" : "4px"};box-shadow:${shadow};cursor:pointer;font-family:Pretendard,system-ui,sans-serif;">${chip}${name}${metaEl}${tail}</div>`;
}

/** 클러스터 카운트 배지 HTML (부동산식 원형 묶음 — 흰 링 + 다크 카운트) */
export function clusterBadgeHtml(count: number, color = "#16181d"): string {
  const size = count < 10 ? 38 : count < 30 ? 46 : 54;
  const inner = size - 8;
  return `<div style="position:relative;transform:translate(-50%,-50%);display:grid;place-items:center;width:${size}px;height:${size}px;border-radius:50%;background:#ffffff;box-shadow:0 4px 14px rgba(0,0,0,.30);cursor:pointer;font-family:Pretendard,system-ui;"><div style="display:grid;place-items:center;width:${inner}px;height:${inner}px;border-radius:50%;background:${color};color:#fff;font-weight:900;font-size:${count < 30 ? 13 : 14}px;letter-spacing:-.3px">${count}</div></div>`;
}
