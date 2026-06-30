import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { Panel } from "@/components/ui";
import { SOURCES } from "@/lib/sources";

export const metadata: Metadata = { title: "데이터 출처" };

export default function DataPage() {
  return (
    <PageShell>
      <div className="mb-6">
        <span className="klai-eyebrow">Data Sources</span>
        <h1 className="mt-1 font-display text-[clamp(28px,4vw,40px)] font-black tracking-[-0.03em]">데이터 출처</h1>
        <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-muted">
          플래그테일의 지역 진단·매력도·문화영향평가는 아래 <b className="text-ink">공신력 있는 공공·실측 데이터</b>를 근거로 합니다.
          총 <b className="text-ink">{SOURCES.length}종</b>의 출처를 사용하며, 일부 지표는 표본·잠정값으로 화면에 배지로 표시됩니다.
        </p>
      </div>

      <Panel className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-line bg-card2/50 text-[11px] text-muted2">
                <th className="px-4 py-2.5 font-semibold">지표</th>
                <th className="px-3 py-2.5 font-semibold">분야</th>
                <th className="px-3 py-2.5 font-semibold">실제 출처</th>
                <th className="px-3 py-2.5 font-semibold">갱신</th>
              </tr>
            </thead>
            <tbody>
              {SOURCES.map((src) => (
                <tr key={src.id} className="border-b border-line/50 align-top">
                  <td className="px-4 py-3">
                    <div className="font-bold text-ink">{src.metric}</div>
                  </td>
                  <td className="px-3 py-3 text-[11.5px] text-muted2">{src.axis ?? "—"}</td>
                  <td className="px-3 py-3 text-muted">{src.source}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-[11.5px] text-muted2">{src.cadence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <p className="mt-4 text-[12px] leading-relaxed text-muted2">
        주요 출처: 통계청 KOSIS · 소상공인시장진흥공단 · 국토교통부 · 한국문화정보원 · 한국부동산원 · 산업연구원(NABIS) · 네이버 · 공공데이터포털 등.
        모든 데이터는 공개 출처에 근거하며, 개별 점포·개인 식별 정보는 집계 형태로만 사용합니다.
      </p>
    </PageShell>
  );
}
