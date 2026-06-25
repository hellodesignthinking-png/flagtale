"use client";

import { useEffect, useState } from "react";
import { getDevice, setDeviceName, onGameChange, type Device } from "@/lib/game";

type Mine = { region: string; leader: { name: string; count: number } | null; rank: number; count: number; total: number };
type Hot = { region: string; total: number; leader: { name: string; count: number } | null };

// 멀티플레이 영토전 리더보드 — 익명 기기ID 기준 동네 점유 경쟁(공유 집계).
export function TerritoryBoard() {
  const [device, setDevice] = useState<Device>({ id: "", name: "" });
  const [mine, setMine] = useState<Mine[]>([]);
  const [hot, setHot] = useState<Hot[]>([]);
  const [loading, setLoading] = useState(true);
  const [nameEdit, setNameEdit] = useState("");

  async function load() {
    const dev = getDevice();
    setDevice(dev);
    try {
      const d = await fetch(`/api/territory?device=${encodeURIComponent(dev.id)}`).then((r) => (r.ok ? r.json() : null));
      if (d) { setMine(d.mine || []); setHot(d.hot || []); }
    } catch { /* noop */ }
    setLoading(false);
  }
  useEffect(() => { load(); return onGameChange(load); }, []);

  function saveName() { if (nameEdit.trim()) { setDevice(setDeviceName(nameEdit)); setNameEdit(""); } }

  return (
    <div className="rounded-[20px] border-[1.5px] border-line bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[16px] font-black text-ink">🏆 동네 점유전</h2>
        <span className="text-[11px] font-bold text-muted2">나: <b className="text-blue-l">{device.name}</b></span>
      </div>
      <div className="mt-2 flex gap-1.5">
        <input value={nameEdit} onChange={(e) => setNameEdit(e.target.value)} placeholder="닉네임 바꾸기" aria-label="닉네임" maxLength={16} className="min-w-0 flex-1 rounded-[10px] border border-line bg-card2 px-3 py-1.5 text-[12px] font-semibold text-ink placeholder:text-muted2 focus:border-ink focus:outline-none" />
        <button onClick={saveName} disabled={!nameEdit.trim()} className="shrink-0 rounded-[10px] bg-ink px-3 py-1.5 text-[12px] font-extrabold text-white disabled:opacity-40">변경</button>
      </div>

      {loading ? (
        <div className="py-6 text-center text-[12px] text-muted2">불러오는 중…</div>
      ) : (
        <>
          {mine.length > 0 && (
            <div className="mt-3">
              <div className="mb-1.5 text-[11px] font-extrabold text-muted2">내가 뛰는 동네</div>
              <div className="space-y-1.5">
                {[...mine].sort((a, b) => a.rank - b.rank).map((m) => (
                  <div key={m.region} className={`flex items-center justify-between gap-2 rounded-[12px] border p-2.5 ${m.rank === 1 ? "border-amber/50 bg-amber/10" : "border-line"}`}>
                    <div className="min-w-0">
                      <span className="text-[12.5px] font-extrabold text-ink">{m.rank === 1 ? "👑 " : ""}{m.region}</span>
                      <span className="ml-1.5 text-[11px] text-muted2">{m.rank === 1 ? "점령 중!" : `👑 ${m.leader?.name} ${m.leader?.count}회`}</span>
                    </div>
                    <span className="shrink-0 text-[11.5px] font-bold text-blue-l">내 {m.rank}위/{m.total} · {m.count}회</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {hot.length > 0 && (
            <div className="mt-3">
              <div className="mb-1.5 text-[11px] font-extrabold text-muted2">🔥 가장 치열한 동네</div>
              <div className="space-y-1">
                {hot.map((h, i) => (
                  <div key={h.region} className="flex items-center justify-between gap-2 rounded-[10px] bg-card2/40 px-2.5 py-1.5">
                    <span className="min-w-0 truncate text-[12px] font-bold text-ink">{i + 1}. {h.region}</span>
                    <span className="shrink-0 text-[11px] text-muted2">👑 {h.leader?.name} · 총 {h.total}회</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {mine.length === 0 && hot.length === 0 && <p className="mt-3 text-center text-[11.5px] leading-relaxed text-muted2">아직 점령한 동네가 없어요. 체크인할 때마다 그 동네 깃발이 내 것이 돼요 — 플래그맵에서 <b className="text-ink">첫 깃발</b>을 꽂아보세요!</p>}
        </>
      )}
    </div>
  );
}
