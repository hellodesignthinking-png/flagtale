"use client";

import { useState } from "react";
import { CROWD_OPTS, TURNOVER_OPTS, VIBE_OPTS } from "@/lib/fieldreport";

type Status = "idle" | "geocoding" | "submitting" | "done" | "error";

export function ContributeForm() {
  const [place, setPlace] = useState("");
  const [crowd, setCrowd] = useState<string>("");
  const [turnover, setTurnover] = useState<string>("");
  const [vibe, setVibe] = useState<string>("");
  const [newShops, setNewShops] = useState(0);
  const [closedShops, setClosedShops] = useState(0);
  const [hotShop, setHotShop] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [msg, setMsg] = useState("");

  const ready = place.trim() && crowd && turnover && vibe;

  async function submit() {
    if (!ready || status === "submitting" || status === "geocoding") return;
    setStatus("geocoding");
    setMsg("");
    // 장소 → 행정동 매핑(네이버/VWorld 지오코딩 재사용)
    let admCd2 = "";
    let placeName = place.trim();
    try {
      const g = await fetch(`/api/geocode?q=${encodeURIComponent(place.trim())}`);
      if (g.ok) {
        const gj = await g.json();
        admCd2 = gj.admCd2;
        placeName = gj.name || placeName;
      }
    } catch {
      /* 지오코딩 실패 — 동명 그대로 제출(서버 검증) */
    }
    if (!admCd2) {
      setStatus("error");
      setMsg("장소를 행정동으로 매핑하지 못했습니다. 동명·역·주소를 더 구체적으로 입력해 주세요.");
      return;
    }
    setStatus("submitting");
    try {
      const r = await fetch("/api/contribute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admCd2, placeName, crowd, turnover, vibe, newShops, closedShops, hotShop, note }),
      });
      const j = await r.json();
      if (j.ok) {
        setStatus("done");
        setMsg(`${placeName} · ${j.message}`);
      } else {
        setStatus("error");
        setMsg(j.message || "접수 실패");
      }
    } catch {
      setStatus("error");
      setMsg("네트워크 오류");
    }
  }

  if (status === "done") {
    return (
      <div className="klai-panel p-6 text-center">
        <div className="text-3xl">🙌</div>
        <div className="mt-2 text-lg font-extrabold text-ink">현장 리포트 접수</div>
        <p className="mt-1 text-[13px] text-muted">{msg}</p>
        <button
          onClick={() => {
            setStatus("idle");
            setCrowd("");
            setTurnover("");
            setVibe("");
            setNewShops(0);
            setClosedShops(0);
            setHotShop("");
            setNote("");
          }}
          className="mt-4 rounded-lg border border-line px-4 py-2 text-[13px] font-semibold text-ink hover:bg-card2"
        >
          다른 동네 리포트 작성 →
        </button>
      </div>
    );
  }

  return (
    <div className="klai-panel space-y-4 p-5">
      <Field label="동네 · 역 · 장소" required>
        <input
          value={place}
          onChange={(e) => setPlace(e.target.value)}
          placeholder="예: 성수동 / 강남역 / 망원동 카페거리"
          className="h-10 w-full rounded-lg border border-line bg-navy px-3 text-[14px] text-ink placeholder:text-muted2 focus:border-blue focus:outline-none"
        />
      </Field>

      <Field label="객층" required>
        <Chips opts={CROWD_OPTS} value={crowd} onChange={setCrowd} />
      </Field>
      <Field label="회전율 (붐비는 정도)" required>
        <Chips opts={TURNOVER_OPTS} value={turnover} onChange={setTurnover} />
      </Field>
      <Field label="분위기 (요즘 느낌)" required>
        <Chips opts={VIBE_OPTS} value={vibe} onChange={setVibe} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="최근 신규 개업 (체감)">
          <Stepper value={newShops} onChange={setNewShops} />
        </Field>
        <Field label="최근 폐업 (체감)">
          <Stepper value={closedShops} onChange={setClosedShops} />
        </Field>
      </div>

      <Field label="요즘 뜨는 가게 (선택)">
        <input
          value={hotShop}
          onChange={(e) => setHotShop(e.target.value)}
          placeholder="한 줄로 — 예: OO 베이커리, 신규 와인바"
          className="h-10 w-full rounded-lg border border-line bg-navy px-3 text-[14px] text-ink placeholder:text-muted2 focus:border-blue focus:outline-none"
        />
      </Field>
      <Field label="자유 메모 (선택)">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="현장에서 느낀 변화·특이사항"
          className="w-full rounded-lg border border-line bg-navy px-3 py-2 text-[13px] text-ink placeholder:text-muted2 focus:border-blue focus:outline-none"
        />
      </Field>

      {msg && status === "error" && <p className="text-[13px] text-warn">⚠ {msg}</p>}
      <button
        onClick={submit}
        disabled={!ready || status === "submitting" || status === "geocoding"}
        className="h-11 w-full rounded-lg bg-amber text-[14px] font-bold text-[#1a1206] hover:bg-[#e0951f] disabled:opacity-50"
      >
        {status === "geocoding" ? "위치 확인 중…" : status === "submitting" ? "접수 중…" : "현장 리포트 제출"}
      </button>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[12.5px] font-semibold text-muted">
        {label} {required && <span className="text-amber">*</span>}
      </label>
      {children}
    </div>
  );
}

function Chips({ opts, value, onChange }: { opts: readonly { v: string; label: string; color?: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {opts.map((o) => {
        const on = value === o.v;
        return (
          <button
            key={o.v}
            onClick={() => onChange(o.v)}
            className={`rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${on ? "border-amber bg-amber/15 text-ink" : "border-line text-muted hover:bg-card2"}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Stepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <button onClick={() => onChange(Math.max(0, value - 1))} className="grid h-9 w-9 place-items-center rounded-lg border border-line text-ink hover:bg-card2">
        −
      </button>
      <span className="w-8 text-center text-[15px] font-bold tabular-nums text-ink">{value}</span>
      <button onClick={() => onChange(value + 1)} className="grid h-9 w-9 place-items-center rounded-lg border border-line text-ink hover:bg-card2">
        +
      </button>
    </div>
  );
}
