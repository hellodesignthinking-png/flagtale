// 실측 보정 점수 — 난수 샘플 KLAI를, 실제로 받아오는 신호로 보정.
//   · D4(인식·감성/인기·버즈)  = 네이버 기사량(절대) 로그정규화  [실측]
//   · 모멘텀                    = 네이버 검색 추세(DataLab 최근 vs 초기)  [실측]
//   · D1(인구·지속성)          = KOSIS 인구증감률(시군구) 반영  [부분 실측]
//   · D2(경제·상권)·D3(공간)   = 비교군(유형) 평균 = 미연동 중립 prior
// → 보정 KLAI = .2·D1 + .3·D2 + .3·D4 + .2·D3.  샘플 점수와 별개로 '실측 반영' 표기.
import { gradeOf } from "./scoring";
import type { PlaceScore, Grade } from "./types";
import type { NaverInterest } from "./connectors/naver";

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const avg = (a: number[]) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);

export interface Corrected {
  klai: number;
  grade: Grade;
  d1: number;
  d2: number;
  d3: number;
  d4: number;
  momentum: number;
  buzz: number; // 0~100 인기(기사량 volume)
  mediaSentiment: number; // 미디어 센티먼트 -100~+100 (긍정-부정)
  searchMomentum: number; // 검색 추세 % (3년) — 1차(증감)
  searchAccel: number; // 어텐션 가속도 — 2차(가속/감속). >0=가속(티핑 선행), <0=감속
  newsTotal: number;
  realAxes: ("d1" | "d4" | "momentum")[];
}

export function computeCorrected(
  latest: PlaceScore,
  naver: NaverInterest | null,
  peer: { d1: number; d2: number; d3: number; d4: number }
): Corrected | null {
  if (!naver || (!naver.newsTotal && naver.searchTrend.length === 0)) return null;

  // D4 인기 = 기사량(volume) × 미디어 센티먼트. 부정 기사 많으면 D4가 깎이고(-), 긍정 많으면 가산(+).
  const newsTotal = naver.newsTotal; // 전체 관심(volume)
  const buzz = clamp(((Math.log10(newsTotal + 1) - 3) / 2.5) * 100, 0, 100);
  const sentFactor = clamp(0.85 + (naver.sentiment / 100) * 0.4, 0.4, 1.25); // 센티먼트 보정 ×0.4~×1.25
  const d4 = Math.round(clamp(buzz * sentFactor, 0, 100));

  // 모멘텀 — DataLab 검색 추세(최근 6개월 vs 초기 6개월)
  const tr = naver.searchTrend;
  const recent = avg(tr.slice(-6).map((t) => t.ratio));
  const early = avg(tr.slice(0, 6).map((t) => t.ratio)) || recent;
  const searchMomentum = early ? Math.round(((recent - early) / early) * 1000) / 10 : 0;
  const momentum = Math.round(clamp(searchMomentum / 8, -10, 10) * 10) / 10;

  // F. 어텐션 가속도 — 검색 추세의 2차 변화(가속/감속). 3구간 기울기 비교. >0=가속(티핑 선행).
  const seg = Math.max(2, Math.floor(tr.length / 3));
  const eAvg = avg(tr.slice(0, seg).map((t) => t.ratio));
  const mAvg = avg(tr.slice(seg, 2 * seg).map((t) => t.ratio));
  const rAvg = avg(tr.slice(-seg).map((t) => t.ratio));
  const searchAccel = tr.length >= 6 ? Math.round((rAvg - mAvg - (mAvg - eAvg)) * 10) / 10 : 0;

  // D1 인구·지속성 — KOSIS 시군구 인구증감률
  const d1 = Math.round(clamp(55 + latest.popChangeRate * 9, 20, 90));

  // D2·D3 — 비교군(유형) 평균 = 미연동 중립 prior (난수 아님)
  const d2 = Math.round(peer.d2);
  const d3 = Math.round(peer.d3);

  const klai = Math.round(0.2 * d1 + 0.3 * d2 + 0.2 * d3 + 0.3 * d4);
  return {
    klai,
    grade: gradeOf(klai),
    d1,
    d2,
    d3,
    d4,
    momentum,
    buzz: Math.round(buzz),
    mediaSentiment: naver.sentiment,
    searchMomentum,
    searchAccel,
    newsTotal,
    realAxes: ["d4", "momentum", "d1"],
  };
}

// 행정동명 → 대표 동명 (성수2가1동 → 성수동) : 네이버 검색 질의 정확도
export function searchName(name: string): string {
  return name.replace(/(\d+가)?\d+동$/, "동");
}
