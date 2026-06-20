// 네이버 실시간 관심도 패널 — async 서버 컴포넌트(Suspense로 스트리밍).
// 검색 관심도(DataLab) + 기사량(뉴스) 실데이터. 페이지 렌더를 막지 않음.
import { naverInterest } from "@/lib/connectors/naver";
import { NaverInterestChart } from "@/components/charts/NaverInterestChart";

export async function NaverPanel({ query }: { query: string }) {
  const data = await naverInterest(query).catch(() => null);

  if (!data || (!data.searchTrend.length && !data.newsTotal)) {
    return (
      <div className="rounded-xl border border-line bg-card2/40 p-4 text-[12px] text-muted2">
        네이버 실시간 관심도 — 데이터를 불러오지 못했습니다(키/한도 확인). 다른 지표는 정상 표시됩니다.
      </div>
    );
  }

  const last = data.searchTrend.at(-1)?.ratio ?? 0;
  const first = data.searchTrend[0]?.ratio ?? 0;
  const delta = Math.round((last - first) * 10) / 10;

  return (
    <div className="rounded-xl border border-line bg-card2/40 p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-[12px] font-bold text-ink">네이버 실시간 관심도 · "{data.query}"</div>
        <span
          className="rounded-full border px-2 py-0.5 text-[10px] font-bold"
          style={{ borderColor: "var(--green)", color: "var(--green)" }}
        >
          네이버 실데이터
        </span>
      </div>

      <div className="mb-3 grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-line bg-navy2/40 px-3 py-2">
          <div className="text-[18px] font-extrabold tabular-nums text-ink">{last}</div>
          <div className="text-[10px] text-muted2">검색 관심도(최근/100)</div>
        </div>
        <div className="rounded-lg border border-line bg-navy2/40 px-3 py-2">
          <div
            className="text-[18px] font-extrabold tabular-nums"
            style={{ color: delta >= 0 ? "var(--green)" : "var(--warn)" }}
          >
            {delta >= 0 ? "+" : ""}
            {delta}
          </div>
          <div className="text-[10px] text-muted2">3년 추이</div>
        </div>
        <div className="rounded-lg border border-line bg-navy2/40 px-3 py-2">
          <div
            className="text-[18px] font-extrabold tabular-nums"
            style={{ color: data.sentiment >= 0 ? "var(--green)" : "var(--warn)" }}
          >
            {data.sentiment > 0 ? "+" : ""}
            {data.sentiment}
          </div>
          <div className="text-[10px] text-muted2">미디어 센티먼트 (긍{data.pos}·부{data.neg})</div>
        </div>
      </div>

      {data.searchTrend.length > 0 && <NaverInterestChart data={data.searchTrend} />}

      {data.headlines.length > 0 && (
        <div className="mt-3 border-t border-line pt-2">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted2">최근 기사 (긍정 ▲ · 부정 ▼ · 중립 ·)</div>
          <ul className="space-y-1">
            {data.headlines.map((h, i) => (
              <li key={i} className="truncate text-[11px] text-muted">
                <span style={{ color: h.tone > 0 ? "var(--green)" : h.tone < 0 ? "var(--warn)" : "var(--muted2)" }}>
                  {h.tone > 0 ? "▲" : h.tone < 0 ? "▼" : "·"}
                </span>{" "}
                <span className="text-muted2">{h.date}</span> · {h.title}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-2 text-[10px] text-muted2">
        검색 관심도 = DataLab 검색어트렌드 · 미디어 센티먼트 = (긍정−부정)/표본, 부정기사는 지역에 −로 D4 반영. 동명 질의 기준.
      </div>
    </div>
  );
}
