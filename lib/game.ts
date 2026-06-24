// 게임화 상태 — 코인·체크인·연속(스트릭)·루트. localStorage(기기별) + 커스텀 이벤트로 헤더/패널 동기화.
// (원본 Flagtale의 코인·플래그·체크인·루트빌더를 careet 단일코드로 이식)
export type GameState = {
  coins: number;
  checkins: Record<string, number>; // spotId → 마지막 체크인 timestamp
  regions: Record<string, number>; // 동네(region) → 체크인 횟수 (영토)
  route: string[]; // 루트에 담은 spotId(순서)
  streak: number;
  lastCheckDay: string; // YYYY-MM-DD
};

const KEY = "ft_game";
const EVT = "ft-game-change";
const EMPTY: GameState = { coins: 0, checkins: {}, regions: {}, route: [], streak: 0, lastCheckDay: "" };

export const LEVEL_TITLES = ["로컬 새내기", "동네 탐험가", "로컬 마스터", "플래그 헌터", "로컬 레전드"];
export function levelOf(coins: number): number { return Math.floor(coins / 100) + 1; }
export function levelTitle(coins: number): string { return LEVEL_TITLES[Math.min(levelOf(coins) - 1, LEVEL_TITLES.length - 1)]; }
export function levelProgress(coins: number): number { return coins % 100; } // 0~99 (다음 레벨까지)

const day = (t: number | Date = new Date()) => new Date(t).toISOString().slice(0, 10);

export function readGame(): GameState {
  if (typeof window === "undefined") return { ...EMPTY };
  try { const r = localStorage.getItem(KEY); return r ? { ...EMPTY, ...(JSON.parse(r) as Partial<GameState>) } : { ...EMPTY }; } catch { return { ...EMPTY }; }
}
export function setGame(s: GameState) {
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
export function checkIn(id: string, region?: string): { state: GameState; reward: number; firstEver: boolean } {
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
  if (region) s.regions = { ...s.regions, [region]: (s.regions[region] || 0) + 1 }; // 영토 점령
  setGame(s);
  return { state: s, reward, firstEver };
}

export function territoryCount(s: GameState = readGame()): number { return Object.keys(s.regions || {}).length; }
export function topTerritories(s: GameState = readGame(), n = 6): { region: string; n: number }[] {
  return Object.entries(s.regions || {}).map(([region, n]) => ({ region, n })).sort((a, b) => b.n - a.n).slice(0, n);
}

export function inRoute(id: string, s: GameState = readGame()): boolean { return s.route.includes(id); }
export function toggleRoute(id: string): GameState {
  const s = readGame();
  s.route = s.route.includes(id) ? s.route.filter((x) => x !== id) : [...s.route, id];
  setGame(s);
  return s;
}
export function clearRoute(): GameState { const s = readGame(); s.route = []; setGame(s); return s; }

// ── 업적/뱃지 — 게임 상태에서 파생(별도 저장 없음) ──
export type Badge = { id: string; emoji: string; name: string; desc: string; need: (s: GameState) => boolean };
export const BADGES: Badge[] = [
  { id: "first", emoji: "🚩", name: "첫 깃발", desc: "첫 체크인", need: (s) => flagCount(s) >= 1 },
  { id: "flags5", emoji: "🗺️", name: "동네 탐험가", desc: "5곳 체크인", need: (s) => flagCount(s) >= 5 },
  { id: "flags10", emoji: "🧭", name: "로컬 헌터", desc: "10곳 체크인", need: (s) => flagCount(s) >= 10 },
  { id: "flags25", emoji: "🏆", name: "로컬 마스터", desc: "25곳 체크인", need: (s) => flagCount(s) >= 25 },
  { id: "streak3", emoji: "🔥", name: "불꽃 3일", desc: "3일 연속 체크인", need: (s) => s.streak >= 3 },
  { id: "streak7", emoji: "⚡", name: "일주일 개근", desc: "7일 연속 체크인", need: (s) => s.streak >= 7 },
  { id: "coins100", emoji: "💰", name: "코인 부자", desc: "코인 100개", need: (s) => s.coins >= 100 },
  { id: "route", emoji: "🛤️", name: "루트 메이커", desc: "루트 2곳+ 담기", need: (s) => s.route.length >= 2 },
];
export function earnedBadgeIds(s: GameState = readGame()): string[] { return BADGES.filter((b) => b.need(s)).map((b) => b.id); }

// ── 익명 기기 식별 — 멀티플레이 영토전(동네 점유 경쟁)용. 계정 불필요. ──
export type Device = { id: string; name: string };
const DKEY = "ft_device";
export function getDevice(): Device {
  if (typeof window === "undefined") return { id: "", name: "" };
  try { const r = localStorage.getItem(DKEY); if (r) return JSON.parse(r) as Device; } catch { /* noop */ }
  const id = (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : `d_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const d: Device = { id, name: `로컬러${Math.floor(1000 + Math.random() * 9000)}` };
  try { localStorage.setItem(DKEY, JSON.stringify(d)); } catch { /* noop */ }
  return d;
}
export function setDeviceName(name: string): Device {
  const d = getDevice();
  d.name = (name || d.name).trim().slice(0, 16);
  try { localStorage.setItem(DKEY, JSON.stringify(d)); } catch { /* noop */ }
  return d;
}
