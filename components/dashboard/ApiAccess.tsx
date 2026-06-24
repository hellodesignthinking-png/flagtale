"use client";

import { useState } from "react";
import { FREE_MODE } from "@/lib/tier";

// 기관 API 액세스 — 키 발급/회전 + 예제. 기관 대시보드 전용 섹션.
export function ApiAccess({ initialKey, origin }: { initialKey: string | null; origin: string }) {
  const [key, setKey] = useState<string | null>(initialKey);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState("");

  async function gen() {
    setBusy(true);
    try {
      const d = await fetch("/api/v1/keys", { method: "POST" }).then((r) => r.json());
      if (d?.key) setKey(d.key);
    } catch { /* noop */ }
    setBusy(false);
  }
  function copy(text: string, what: string) {
    navigator.clipboard?.writeText(text).then(() => { setCopied(what); setTimeout(() => setCopied(""), 1500); }).catch(() => {});
  }

  const example = `curl "${origin}/api/v1/places?region=성동구&limit=50" \\\n  -H "x-api-key: ${key ?? "YOUR_API_KEY"}"`;

  return (
    <div className="rounded-[20px] border-[1.5px] border-line bg-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-[16px] font-black text-ink">🔌 API 액세스</h3>
        <span className="rounded-full bg-amber/15 px-2.5 py-0.5 text-[11px] font-extrabold text-blue-l">{FREE_MODE ? "베타 무료" : "기관 전용"}</span>
      </div>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">행정동 매력도(KLAI·등급·모멘텀·젠트리·시장활성도)를 프로그램으로 조회. 출점·투자 스코어링·내부 시스템 연동용.</p>

      {/* 키 */}
      <div className="mt-4">
        <div className="mb-1 text-[11px] font-bold text-muted2">API 키</div>
        {key ? (
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-[10px] border border-line bg-card2 px-3 py-2 font-mono text-[12px] text-ink">{key}</code>
            <button onClick={() => copy(key, "key")} className="shrink-0 rounded-[10px] border border-line bg-card px-3 py-2 text-[12px] font-extrabold text-ink hover:border-ink">{copied === "key" ? "복사됨 ✓" : "복사"}</button>
          </div>
        ) : (
          <button onClick={gen} disabled={busy} className="btn-glow rounded-full bg-amber px-4 py-2 text-[13px] font-extrabold text-onaccent disabled:opacity-50">{busy ? "발급 중…" : "API 키 발급"}</button>
        )}
        {key && <button onClick={gen} disabled={busy} className="mt-2 text-[11px] font-bold text-muted2 hover:text-warn">{busy ? "재발급 중…" : "🔄 키 재발급(기존 무효화)"}</button>}
      </div>

      {/* 예제 */}
      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[11px] font-bold text-muted2">예제 요청</span>
          <button onClick={() => copy(example, "ex")} className="text-[11px] font-bold text-blue-l hover:underline">{copied === "ex" ? "복사됨 ✓" : "복사"}</button>
        </div>
        <pre className="overflow-x-auto rounded-[10px] border border-line bg-[#0d1828] px-3 py-2.5 font-mono text-[11px] leading-relaxed text-[#cfe3ff]">{example}</pre>
      </div>

      {/* 문서 */}
      <div className="mt-3 rounded-[10px] border border-line bg-card2/40 p-3 text-[11.5px] leading-relaxed text-muted">
        <div className="font-extrabold text-ink">GET /api/v1/places</div>
        <div className="mt-1"><code className="text-blue-l">region</code> 시군구·시도·동명 필터(선택) · <code className="text-blue-l">limit</code> 1–500(기본 100)</div>
        <div className="mt-0.5">응답: <code className="text-ink">admCd2·name·sido·sigungu·klai·grade·momentum·gentriStage·marketVitality</code></div>
        <div className="mt-1 text-muted2">인증: <code className="text-ink">x-api-key</code> 헤더 또는 <code className="text-ink">?key=</code> · 샘플·잠정 데이터</div>
      </div>
    </div>
  );
}
