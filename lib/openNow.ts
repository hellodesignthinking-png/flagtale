// 영업시간 문자열 → 현재 영업중 여부. 클라이언트 전용(now는 마운트 후 주입 → SSR 불일치 없음).
// 데이터 포맷 예: "매일 10:00~21:00" · "화~일 11:00~20:00" · "매일 11:00~15:00, 17:00~20:30" · "체크인 15:00 / 체크아웃 11:00"
const DAYMAP: Record<string, number> = { 일: 0, 월: 1, 화: 2, 수: 3, 목: 4, 금: 5, 토: 6 };

export interface NowT { day: number; min: number }

export function openState(hours: string | null | undefined, now: NowT | null): "open" | "closed" | null {
  if (!hours || !now) return null;
  if (/체크인|체크아웃/.test(hours)) return null; // 숙박은 영업중 개념 아님
  const ranges = [...hours.matchAll(/(\d{1,2}):(\d{2})\s*[~\-]\s*(\d{1,2}):(\d{2})/g)];
  if (!ranges.length) return null;
  // 요일 범위(예: 화~일) — 매일이 아니고 범위가 있으면 오늘이 포함되는지 확인
  const dm = hours.match(/([일월화수목금토])\s*~\s*([일월화수목금토])/);
  if (!/매일/.test(hours) && dm) {
    const a = DAYMAP[dm[1]], b = DAYMAP[dm[2]];
    const inRange = a <= b ? now.day >= a && now.day <= b : now.day >= a || now.day <= b;
    if (!inRange) return "closed";
  }
  for (const m of ranges) {
    const s = +m[1] * 60 + +m[2];
    let e = +m[3] * 60 + +m[4];
    if (e <= s) e += 1440; // 자정 넘김
    const t = now.min;
    if ((t >= s && t < e) || (t + 1440 >= s && t + 1440 < e)) return "open";
  }
  return "closed";
}

export function nowParts(d: Date): NowT { return { day: d.getDay(), min: d.getHours() * 60 + d.getMinutes() }; }
