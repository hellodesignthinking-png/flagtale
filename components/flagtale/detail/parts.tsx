import Link from "next/link";

// 에어비앤비식 상세 페이지 공통 파츠 (서버 컴포넌트 안전 — fs/상태 없음).

export function Crumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="mb-3 flex flex-wrap items-center gap-1.5 text-[12px] font-bold text-muted2">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {it.href ? (
            <Link href={it.href} className="transition-colors hover:text-ink">{it.label}</Link>
          ) : (
            <span className="text-muted">{it.label}</span>
          )}
          {i < items.length - 1 && <span aria-hidden>›</span>}
        </span>
      ))}
    </nav>
  );
}

export function DetailSection({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-line pb-7">
      <h2 className="font-display text-[19px] font-black tracking-tight text-ink">{title}</h2>
      {sub && <p className="mt-1 text-[12.5px] font-bold text-muted2">{sub}</p>}
      <div className="mt-3 text-[14px] leading-relaxed text-muted">{children}</div>
    </section>
  );
}

export function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-2.5 sm:grid-cols-2">
      {items.map((t) => (
        <li key={t} className="flex items-start gap-2 text-[13.5px] text-ink">
          <span className="mt-0.5 shrink-0 text-amber">✓</span>
          {t}
        </li>
      ))}
    </ul>
  );
}
