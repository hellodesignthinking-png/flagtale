import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { Button, Panel, Pill, SectionHead, Stat } from "@/components/ui";

export const metadata: Metadata = { title: "디자인 시스템 — KLAI" };

const SWATCHES = [
  { name: "accent (라임 채움)", var: "--amber", note: "bg-amber · CTA·배지·활성" },
  { name: "accent-bright (형광)", var: "--accent-bright", note: "hl-mark·강조" },
  { name: "on-accent (라임 위 텍스트)", var: "--on-accent", note: "text-onaccent" },
  { name: "primary (다크)", var: "--blue", note: "bg-blue · 다크 버튼" },
  { name: "link/text 강조", var: "--blue-l", note: "text-blue-l · 링크" },
  { name: "ink", var: "--ink", note: "본문 텍스트" },
  { name: "muted", var: "--muted", note: "보조 텍스트" },
  { name: "line", var: "--line", note: "테두리·구분선" },
  { name: "green (긍정)", var: "--green", note: "상승·성공" },
  { name: "warn (경고)", var: "--warn", note: "하락·위기" },
];
const GRADES = [
  { g: "S", v: "--gS" }, { g: "A", v: "--gA" }, { g: "B", v: "--gB" }, { g: "C", v: "--gC" }, { g: "D", v: "--gD" }, { g: "E", v: "--gE" },
];
const TYPE = [
  { cls: "display-hero text-4xl", label: "Display / display-hero", sample: "지금 뜨는 동네" },
  { cls: "text-3xl font-black", label: "H1 / text-3xl font-black", sample: "동네 매력도 진단" },
  { cls: "text-xl font-extrabold", label: "H2 / text-xl font-extrabold", sample: "섹션 제목" },
  { cls: "text-[15px] font-bold", label: "H3 / 카드 제목", sample: "카드 타이틀" },
  { cls: "text-[14px] text-muted", label: "Body / 본문", sample: "전국 행정동·매장의 활력을 데이터로 진단합니다." },
  { cls: "text-[12px] text-muted2", label: "Caption / 캡션", sample: "출처·잠정 데이터 표기" },
];

export default function DesignSystemPage() {
  return (
    <PageShell>
      <div className="mb-8">
        <span className="klai-eyebrow">Design System</span>
        <h1 className="display-hero mt-2 text-4xl">KLAI 디자인 시스템</h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted">
          <span className="hl-mark">careet 스타일 에디토리얼</span> — 라임 단일 강조색 + 중성 뉴트럴 + 볼드 타이포. 토큰·타이포·컴포넌트의 단일 출처입니다.
        </p>
      </div>

      {/* 색 토큰 */}
      <Panel className="mb-5">
        <SectionHead no="01" title="컬러 토큰" desc="CSS 변수 단일 정의 → Tailwind 의미 토큰" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {SWATCHES.map((s) => (
            <div key={s.var} className="overflow-hidden rounded-xl border border-line">
              <div className="h-16" style={{ background: `var(${s.var})` }} />
              <div className="p-2.5">
                <div className="text-[12px] font-bold text-ink">{s.name}</div>
                <div className="mt-0.5 text-[10.5px] text-muted2">{s.note}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-[12px] font-bold text-muted2">등급 발산 스케일 (데이터)</div>
        <div className="mt-2 flex gap-2">
          {GRADES.map((g) => (
            <div key={g.g} className="grid h-12 flex-1 place-items-center rounded-lg text-[15px] font-black text-white" style={{ background: `var(${g.v})` }}>
              {g.g}
            </div>
          ))}
        </div>
      </Panel>

      {/* 타이포 */}
      <Panel className="mb-5">
        <SectionHead no="02" title="타이포그래피" desc="Pretendard 국문 + Poppins 디스플레이/숫자" />
        <div className="space-y-4">
          {TYPE.map((t) => (
            <div key={t.label} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-line pb-3">
              <div className={`${t.cls} min-w-0`}>{t.sample}</div>
              <div className="ml-auto text-[11px] text-muted2">{t.label}</div>
            </div>
          ))}
        </div>
      </Panel>

      {/* 컴포넌트 */}
      <Panel className="mb-5">
        <SectionHead no="03" title="컴포넌트" desc="버튼·태그·배지·스탯·카드" />
        <div className="space-y-6">
          <div>
            <div className="mb-2 text-[12px] font-bold text-muted2">버튼</div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="amber">Accent CTA</Button>
              <Button variant="primary">Primary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="amber" size="sm">Small</Button>
              <Button variant="amber" size="lg">Large</Button>
            </div>
          </div>
          <div>
            <div className="mb-2 text-[12px] font-bold text-muted2">태그 · 배지 · 형광</div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="cat-tag">CATEGORY</span>
              <Pill tone="amber">amber</Pill>
              <Pill tone="blue">blue</Pill>
              <Pill tone="warn">warn</Pill>
              <Pill tone="muted">muted</Pill>
              <span className="status-pill" style={{ background: "var(--amber)", color: "var(--on-accent)" }}>📈 뜨는 중</span>
              <span className="status-pill border border-warn/40 text-warn">📉 위기</span>
              <span className="text-[14px] font-bold">강조는 <span className="hl-mark">형광펜</span>으로</span>
            </div>
          </div>
          <div>
            <div className="mb-2 text-[12px] font-bold text-muted2">스탯 카드</div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="분석 행정동" value="3,554" accent="blue" icon="◇" />
              <Stat label="상승" value="1,546" sub="모멘텀 +" accent="amber" icon="▲" />
              <Stat label="위기" value="312" accent="warn" icon="⚠" />
              <Stat label="평균 KLAI" value="48.5" icon="●" />
            </div>
          </div>
          <div>
            <div className="mb-2 text-[12px] font-bold text-muted2">카드 (lift 호버)</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="lift rounded-2xl border border-line bg-card2/50 p-5">
                <div className="cat-tag">EDITORIAL</div>
                <div className="mt-1 text-[16px] font-extrabold text-ink">콘텐츠 카드</div>
                <p className="mt-1 text-[13px] text-muted">careet식 카테고리 태그 + 볼드 제목 + 상태 배지 구조.</p>
              </div>
              <div className="gradient-border rounded-2xl bg-card2/50 p-5">
                <div className="cat-tag">GRADIENT BORDER</div>
                <div className="mt-1 text-[16px] font-extrabold text-ink">그라데이션 보더 카드</div>
                <p className="mt-1 text-[13px] text-muted">강조 컨테이너용 라임 그라데이션 테두리.</p>
              </div>
            </div>
          </div>
        </div>
      </Panel>

      <p className="text-center text-[11px] text-muted2">
        토큰은 <b className="text-muted">app/globals.css</b> · 의미 매핑 <b className="text-muted">tailwind.config.ts</b> · 컴포넌트 <b className="text-muted">components/ui.tsx</b>
      </p>
    </PageShell>
  );
}
