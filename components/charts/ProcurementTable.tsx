import type { ProcurementRecord } from "@/lib/types";
import { formatKRW } from "@/lib/utils";

// 나라장터 조달 기록표 (입찰 행사 · 수의계약)
export function ProcurementTable({ records }: { records: ProcurementRecord[] }) {
  if (!records.length) {
    return <div className="text-[13px] text-muted2">조달 기록 없음</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-[12.5px]">
        <thead>
          <tr className="border-b border-line text-[11px] text-muted2">
            <th className="py-2 pr-2 font-semibold">연도</th>
            <th className="py-2 pr-2 font-semibold">구분</th>
            <th className="py-2 pr-2 font-semibold">분야</th>
            <th className="py-2 pr-2 font-semibold">사업명</th>
            <th className="py-2 pr-2 text-right font-semibold">공고예산</th>
            <th className="py-2 font-semibold">발주처</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r, i) => (
            <tr key={i} className="border-b border-line/50">
              <td className="py-2 pr-2 tabular-nums text-muted">{r.year}</td>
              <td className="py-2 pr-2">
                <span
                  className={`rounded px-1.5 py-0.5 text-[10.5px] font-bold ${
                    r.type === "sole" ? "bg-amber/15 text-amber" : "bg-blue/15 text-blue-l"
                  }`}
                >
                  {r.type === "sole" ? "수의" : "입찰"}
                </span>
              </td>
              <td className="py-2 pr-2 text-muted">{r.category}</td>
              <td className="py-2 pr-2 text-ink">{r.title}</td>
              <td className="py-2 pr-2 text-right font-semibold tabular-nums text-ink">{formatKRW(r.amount)}</td>
              <td className="py-2 text-[11.5px] text-muted2">{r.agency}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
