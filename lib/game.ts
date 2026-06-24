// 게임화 상태 — 코인·체크인·연속(스트릭)·루트. localStorage(기기별) + 커스텀 이벤트로 헤더/패널 동기화.
// (원본 Flagtale의 코인·플래그·체크인·루트빌더를 careet 단일코드로 이식)
export type GameState = {
  coins: number;
  checkins: Record<string, number>; // spotId → 마지막 체크인 timestamp
  route: string[]; // 루트에 담은 spotId(순서)
  streak: number;
  lastCheckDay: string; // YYYY-MM-DD
};

const KEY = "ft_game";
const EVT = "ft-game-change";
const EMPTY: GameState = { coins: 0, checkins: {}, route: [], streak: 0, lastCheckDay: "" };

export const LEVEL_TITLES = ["로컬 새내기", "동네 탐험가", "로컬 마스터", "플래그 헌터", "로컬 레전드"];
export function levelOf(coins: number): number { return Math.floor(coins / 100) + 1; }
export function levelTitle(coins: number): string { return LEVEL_TITLES[Math.min(levelOf(coins) - 1, LEVEL_TITLES.length - 1)]; }
export function levelProgress(coins: number): number { return coins % 100; } // 0~99 (다음 레벨까지)

const day = (t: number | Date = new Date()) => new Date(t).toISOString().slice(0, 10);

export function readGame(): GameState {
  if (typeof window === "undefined") return { ...EMPTY };
  try { const r = localStorage.getItem(KEY); return r ? { ...EMPTY, ...(JSON.parse(r) as Partial<GameState>) } : { ...EMPTY }; } catch { return { ...EMPTY }; }
}
function write(s: GameState) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* noop */ }
  window.dispatchEvent(new CustomEvent(EVT));
}
export function onGameChange(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVT, cb);
  window.addEventListener("storage", cb);
  return () => { window.removeEventListener(EVT, cb); window.removeEventListener("storage", cb); };
}

export function flagCount(s: GameState = readGame()): number { return Object.keys(s.checkins).length; }
export function isCheckedToday(id: string, s: GameState = readGame()): boolean {
  return !!s.checkins[id] && day(s.checkins[id]) === day();
}
export function isChecked(id: string, s: GameState = readGame()): boolean { return !!s.checkins[id]; }

// 체크인 — 하루 1회/스팟. 코인 +10 + 연속 보너스(최대 +7). reward=0이면 오늘 이미 체크인.
export function checkIn(id: string): { state: GameState; reward: number; firstEver: boolean } {
  const s = readGame();
  const today = day();
  if (isCheckedToday(id, s)) return { state: s, reward: 0, firstEver: false };
  const firstEver = !s.checkins[id];
  const yesterday = day(Date.now() - 86400000);
  if (s.lastCheckDay === today) { /* 같은 날 다른 스팟 — 스트릭 유지 */ }
  else if (s.lastCheckDay === yesterday) s.streak += 1;
  else s.streak = 1;
  s.lastCheckDay = today;
  s.checkins = { ...s.checkins, [id]: Date.now() };
  const reward = 10 + Math.min(s.streak, 7) + (firstEver ? 5 : 0);
  s.coins += reward;
  write(s);
  return { state: s, reward, firstEver };
}

export function inRoute(id: string, s: GameState = readGame()): boolean { return s.route.includes(id); }
export function toggleRoute(id: string): GameState {
  const s = readGame();
  s.route = s.route.includes(id) ? s.route.filter((x) => x !== id) : [...s.route, id];
  write(s);
  return s;
}
export function clearRoute(): GameState { const s = readGame(); s.route = []; write(s); return s; }
