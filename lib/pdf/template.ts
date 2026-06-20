import type { PlaceBundle } from "@/lib/data";
import type { Report } from "@/lib/types";

// 서버 PDF용 독립 HTML (ZeroSite 톤, 인라인 CSS). 클라이언트 인쇄 버튼 없음(§15).
const BASE_CSS = `
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Pretendard',system-ui,sans-serif;color:#0b1b30;background:#fff;padding:24px;line-height:1.5}
  .eyebrow{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#d4861e;font-weight:700}
  h1{font-size:26px;font-weight:800;margin:6px 0 4px}
  h2{font-size:15px;font-weight:800;margin:18px 0 8px;border-bottom:1px solid #cdd8e6;padding-bottom:4px}
  .muted{color:#6e87a8;font-size:12px}
  .row{display:flex;gap:10px;flex-wrap:wrap;margin:8px 0}
  .stat{border:1px solid #cdd8e6;border-radius:10px;padding:8px 12px;min-width:120px}
  .stat .big{font-size:22px;font-weight:800;color:#1e5fa8}
  .stat .lab{font-size:11px;color:#6e87a8}
  .badge{display:inline-block;font-size:10px;font-weight:700;padding:2px 8px;border-radius:999px;background:#eef2f7;color:#6e87a8;border:1px solid #cdd8e6}
  table{width:100%;border-collapse:collapse;font-size:11.5px;margin-top:6px}
  th,td{text-align:left;padding:5px 6px;border-bottom:1px solid #e3e9f1}
  .foot{margin-top:24px;font-size:10px;color:#9fb0c6}
`;

function wrap(title: string, body: string): string {
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css">
  <title>${title}</title><style>${BASE_CSS}</style></head><body>${body}
  <div class="foot">KLAI · K-Local Attractiveness Index — 서버 생성 PDF · 샘플·잠정(Provisional) 데이터 · 진단은 원인 후보로 해석</div>
  </body></html>`;
}

/** 동/지번 진단 PDF (방향·위기·전략) */
export function parcelPdfHtml(b: PlaceBundle): string {
  const d = b.diagnosis;
  const risks = (d?.risks ?? []).map((r) => `<li><b>⚠ ${r.title}</b> — ${r.detail}</li>`).join("");
  const strat = (d?.strategy ?? []).map((s) => `<li><b>→ ${s.title}</b> — ${s.detail}</li>`).join("");
  const body = `
    <div class="eyebrow">KLAI 지번 진단 리포트</div>
    <h1>${b.props.name} <span class="badge">${b.props.typology}</span></h1>
    <div class="muted">${b.props.sido} ${b.props.sigungu} · ${b.props.admCd2} · 기준 ${b.latest.period}</div>
    <div class="row">
      <div class="stat"><div class="big">${b.latest.klai}</div><div class="lab">KLAI · ${b.latest.grade}등급</div></div>
      <div class="stat"><div class="big">${b.latest.momentum > 0 ? "+" : ""}${b.latest.momentum}</div><div class="lab">모멘텀</div></div>
      <div class="stat"><div class="big">${b.latest.population.toLocaleString()}</div><div class="lab">인구 (${b.latest.popChangeRate > 0 ? "+" : ""}${b.latest.popChangeRate}%/년)</div></div>
      <div class="stat"><div class="big">${b.latest.budgetInflow}억</div><div class="lab">공공예산 유입/년</div></div>
    </div>
    <h2>방향 (Trajectory)</h2>
    <div class="muted">추세 ${d?.trajectory ?? "—"} · 시장 ${b.latest.marketVitality} · 내러티브 ${b.latest.narrativeStage}</div>
    <h2>위기 (Risk)</h2>
    <ul>${risks || "<li>임계 경보 없음 — 정상 범위</li>"}</ul>
    <h2>전략 (Strategy)</h2>
    <div class="muted">레버리지: ${d?.leverage ?? "—"}</div>
    <ul>${strat}</ul>`;
  return wrap(`${b.props.name} 진단`, body);
}

/** 리포트 PDF (요약형 — Weekly/Annual 표지 + 요약) */
export function reportPdfHtml(report: Report): string {
  const body = `
    <div class="eyebrow">${report.kind === "annual" ? "KLAI Annual" : "Flagtale Weekly"}</div>
    <h1>${report.title}</h1>
    <div class="muted">발행 ${report.publishedAt} · ${report.period}</div>
    <h2>요약</h2>
    <p>${report.summary}</p>
    <div class="muted" style="margin-top:12px">전체 웹진은 /reports/${report.slug} 에서 열람.</div>`;
  return wrap(report.title, body);
}
