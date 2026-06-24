import fs from "node:fs";
import path from "node:path";

// 구글 트렌드 '국가별 검색 관심' — 해외(글로벌)·국내 방문 관심 신호.
// SerpApi(google_trends, GEO_MAP_0/region=COUNTRY)로 수집해 data/google-interest.json에 저장한 값을 읽음(서버 전용 fs).
// 갱신: scripts/ingest-serpapi.mjs (SERPAPI_KEY 필요). 페이지뷰마다 API를 호출하지 않아 비용 안전.
export interface GoogleInterest {
  domestic: number; // 한국(KR) 관심값(0~100)
  foreignShare: number; // 해외 관심 비중(%)
  countries: { name: string; value: number }[]; // 상위 검색 관심 국가(한국 포함)
  foreignTop: { name: string; value: number }[]; // 한국 제외 상위
  sample?: boolean; // 샘플(미수집) 여부
}

// 영문 국가명 → 한글(표시용). 없으면 원문 노출.
const COUNTRY_KO: Record<string, string> = {
  "South Korea": "대한민국", "United States": "미국", Japan: "일본", China: "중국", Taiwan: "대만",
  "Hong Kong": "홍콩", Singapore: "싱가포르", Thailand: "태국", Vietnam: "베트남", Philippines: "필리핀",
  Indonesia: "인도네시아", Malaysia: "말레이시아", India: "인도", Germany: "독일", France: "프랑스",
  "United Kingdom": "영국", Canada: "캐나다", Australia: "호주", "United Arab Emirates": "UAE",
};
export const countryKo = (n: string): string => COUNTRY_KO[n] ?? n;

let _cache: Record<string, GoogleInterest> | null = null;

function load(): Record<string, GoogleInterest> {
  if (_cache) return _cache;
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "google-interest.json"), "utf-8")) as {
      byName?: Record<string, GoogleInterest>;
    };
    return (_cache = raw.byName ?? {});
  } catch {
    return (_cache = {});
  }
}

/** 핫지역 내러티브명 → 구글 국가별 검색 관심. 없으면 null. */
export function googleInterestFor(name?: string | null): GoogleInterest | null {
  if (!name) return null;
  return load()[name] ?? null;
}
