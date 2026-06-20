// 네이버 API 공용 스로틀 — 진단 시 여러 커넥터(naver·anchor·social)가 동시에 호출하면
// 레이트리밋(429) 발생. 동시 호출을 MAX개로 제한 + 429 시 짧은 백오프 재시도.
import "server-only";

const MAX = 3;
let active = 0;
const waiters: (() => void)[] = [];

function acquire(): Promise<void> {
  if (active < MAX) {
    active++;
    return Promise.resolve();
  }
  return new Promise<void>((res) => waiters.push(res)).then(() => {
    active++;
  });
}
function release() {
  active--;
  const w = waiters.shift();
  if (w) w();
}

// 헤더만 받아 내부에서 타임아웃·429 재시도 관리. 실패 시 throw(호출부에서 catch).
export async function naverFetch(url: string, headers: Record<string, string>, timeoutMs = 5000, retries = 2): Promise<Response> {
  await acquire();
  try {
    for (let attempt = 0; ; attempt++) {
      const res = await fetch(url, { headers, cache: "no-store", signal: AbortSignal.timeout(timeoutMs) });
      if (res.status !== 429 || attempt >= retries) return res;
      await new Promise((r) => setTimeout(r, 300 + attempt * 350)); // 백오프
    }
  } finally {
    release();
  }
}

// JSON 편의 래퍼 — 실패 시 null.
export async function naverJson(url: string, headers: Record<string, string>, timeoutMs = 5000): Promise<unknown | null> {
  try {
    const r = await naverFetch(url, headers, timeoutMs);
    return await r.json();
  } catch {
    return null;
  }
}
