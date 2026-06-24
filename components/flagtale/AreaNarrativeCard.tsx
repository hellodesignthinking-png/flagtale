import Link from "next/link";
import { type AreaNarrative, STAGE_META, AUTH_META, reasonsFor } from "@/lib/narratives";

// 핫지역 큐레이션 내러티브 카드 — 쇼케이스/지도패널/동 리포트/지도 InfoWindow에서 같은 '이야기'를 일관되게 렌더.
// compact=지도 패널용(궤적 생략). href=동 리포트 딥링크. solid=지도 위 팝업용(불투명 배경·그림자·폭제한).
export function AreaNarrativeCard({ n, compact, href, solid }: { n: AreaNarrative; compact?: boolean; href?: string; solid?: boolean }) {
  const sm = STAGE_META[n.stage];
  const am = AUTH_META[n.authenticity];
  const reasons = reasonsFor(n.name);
  return (
    <div className="rounded-[16px] border-[1.5px] p-3.5" style={{ borderColor: `${sm.color}55`, background: solid ? "var(--card)" : `${sm.color}0c`, ...(solid ? { boxShadow: "0 6px 22px rgba(0,0,0,.28)", maxWidth: 256 } : {}) }}>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded-full px-2.5 py-1 text-[11px] font-extrabold text-white" style={{ background: sm.color }}>{sm.emoji} {sm.label}</span>
        <span className="rounded-full border px-2 py-0.5 text-[10.5px] font-bold" style={{ color: am.color, borderColor: am.color }}>{am.label}</span>
      </div>
      <div className="mt-2 flex flex-wrap items-baseline gap-1.5">
        <span className="text-[13px] font-black text-ink">{n.name}</span>
        <span className="text-[10.5px] font-bold text-muted2">· {n.region}</span>
      </div>
      <p className="mt-1.5 text-[14px] font-black leading-snug text-ink">“{n.theme}”</p>
      {!compact && <p className="mt-2 text-[12.5px] leading-relaxed text-muted">{n.arc}</p>}
      <div className="mt-2.5 flex flex-wrap gap-1">
        {n.keywords.map((k) => (
          <span key={k} className="rounded-full bg-card2 px-2 py-0.5 text-[10.5px] font-bold text-blue-l">#{k}</span>
        ))}
      </div>
      {reasons.length > 0 && (
        <div className="mt-2.5 rounded-[10px] bg-card2/50 p-2.5">
          <div className="mb-1 text-[10.5px] font-extrabold text-amber">💡 왜 떴나</div>
          <ul className="space-y-0.5">
            {(compact ? reasons.slice(0, 2) : reasons).map((r, i) => (
              <li key={i} className="flex gap-1.5 text-[11.5px] leading-relaxed text-ink"><span className="shrink-0 text-muted2">·</span>{r}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-2.5 space-y-1 border-t border-line/60 pt-2.5 text-[11.5px] leading-relaxed">
        <div><b className="text-ink">앵커</b> <span className="text-muted">{n.anchor}</span></div>
        <div><b className="text-ink">진정성</b> <span className="text-muted">{n.authNote}</span></div>
        {n.caution && <div className="font-semibold text-warn">⚠ {n.caution}</div>}
      </div>
      {href && (
        <Link href={href} className="mt-3 inline-flex items-center gap-1 rounded-full border-[1.5px] border-line bg-card px-3 py-1.5 text-[11.5px] font-extrabold text-ink transition-colors hover:border-ink">
          이 동네 매력도 진단 →
        </Link>
      )}
    </div>
  );
}
