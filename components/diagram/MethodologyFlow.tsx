// 방법론 플로우 다이어그램 — 데이터가 어떻게 흘러 점수·진단이 되는가 (가독성↑)
const STAGES: { cap: string; accent: string; items: string[] }[] = [
  { cap: "원천 데이터", accent: "var(--muted2)", items: ["인구·이동 (KOSIS)", "상권·창업 (LOCALDATA)", "부동산·임대 (R-ONE·RTMS)", "소셜·뉴스 (네이버·BIGKINDS)", "공공조달 (나라장터)"] },
  { cap: "정제·정규화", accent: "#4B9CD3", items: ["행정동코드 매핑", "Min-Max·로그", "역방향 반전", "부동산 역U·포화"] },
  { cap: "4축 합성", accent: "#1E7A8C", items: ["D1 인구 20%", "D2 경제 30%", "D3 공간 20%", "D4 인식 30%"] },
  { cap: "종합 + 보정", accent: "#1E5FA8", items: ["KLAI 0–100·등급", "+ 모멘텀 M", "⚠ 젠트리 경보 G"] },
  { cap: "진단 엔진", accent: "#D4861E", items: ["기여요인 (SHAP)", "선행성·DiD", "젠트리·소멸·성공", "내러티브 동조"] },
  { cap: "출력", accent: "#0F6E5C", items: ["전국 지도", "동 리포트", "유료 진단", "기관 대시보드"] },
];

export function MethodologyFlow() {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {STAGES.map((s, i) => (
        <div key={s.cap} className="flex items-stretch gap-2">
          <div className="bento relative w-[150px] shrink-0 rounded-xl border border-line bg-navy/50 p-3">
            <span className="absolute inset-x-3 top-0 h-0.5 rounded-full" style={{ background: s.accent, boxShadow: `0 0 8px ${s.accent}` }} />
            <div className="mb-2 flex items-center gap-1.5">
              <span
                className="grid h-5 w-5 place-items-center rounded-md text-[10px] font-black text-white"
                style={{ background: s.accent, boxShadow: `0 0 8px ${s.accent}88` }}
              >
                {i + 1}
              </span>
              <span className="text-[12px] font-extrabold text-ink">{s.cap}</span>
            </div>
            <ul className="space-y-1">
              {s.items.map((it) => (
                <li key={it} className="rounded-md border border-line/60 bg-card2/50 px-2 py-1 text-[10.5px] leading-tight text-muted">
                  {it}
                </li>
              ))}
            </ul>
          </div>
          {i < STAGES.length - 1 && (
            <div className="flex items-center" aria-hidden>
              <svg width="26" height="14" viewBox="0 0 26 14" fill="none">
                <line x1="1" y1="7" x2="19" y2="7" stroke={s.accent} strokeWidth="2" strokeLinecap="round" opacity="0.3" />
                <line className="klai-flow" x1="1" y1="7" x2="19" y2="7" stroke={s.accent} strokeWidth="2" strokeLinecap="round" style={{ animationDelay: `${i * 0.15}s` }} />
                <path d="M18 3l5 4-5 4" stroke={s.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
