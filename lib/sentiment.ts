// 긍정(지역 활성화)/부정(위기·사건사고) 분류 — 소셜·유튜브·뉴스 공용.
// naver.ts 의 분류와 일관. 부정 우선(맛집 글이라도 화재면 부정).

export const POS_RE =
  /맛집|카페|핫플|팝업|전시|축제|공연|페스티벌|뮤지컬|콘서트|창업|오픈|개[업관]|입점|명소|관광|투자|유치|개발|재생|활성화|뜨는|줄[서선]|인기|트렌드|성지|청년|문화|브랜드|플래그십|체험|박람회|상생|북적|방문객|상권\s?살|매출\s?증가|명품거리|랜드마크|부활|골목상권|후기|추천|데이트|나들이|가볼만|존맛|분위기|감성|힙[하한]/;

export const NEG_RE =
  /화재|불(?:이|을)|살인|사망|숨[지져]|시신|사고|부상|중상|폭행|범죄|검거|체포|구속|마약|성[폭추]|음주운전|뺑소니|붕괴|추락|실종|사기|횡령|자살|투신|흉기|강도|절도|방화|폭발|감전|침수|누수|악취|민원|소송|고소|고발|논란|갑질|확진|적발|단속|벌금|과태료|불법|위반|공실|폐업|쇠퇴|침체|내몰|젠트리|떠나|불황|적자|문\s?닫|우범|슬럼|상권\s?붕괴|바가지|불친절|최악|실망|노잼|망[했한]|비추/;

export function classifyTone(text: string): 1 | 0 | -1 {
  if (NEG_RE.test(text)) return -1;
  if (POS_RE.test(text)) return 1;
  return 0;
}

export const cleanText = (s: string) =>
  String(s ?? "")
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z#0-9]+;/gi, " ");

export interface ToneAgg {
  pos: number;
  neg: number;
  neut: number;
  sentiment: number; // -100~+100 = (긍-부)/표본
  positiveRatio: number; // 0~100
}

// 텍스트 목록 → 긍/부/중 집계 + 센티먼트. 톤 태그 배열도 반환.
export function aggregateTones(texts: string[]): { agg: ToneAgg; tones: (1 | 0 | -1)[] } {
  let pos = 0,
    neg = 0,
    neut = 0;
  const tones = texts.map((t) => {
    const v = classifyTone(cleanText(t));
    if (v > 0) pos++;
    else if (v < 0) neg++;
    else neut++;
    return v;
  });
  const n = pos + neg + neut || 1;
  return {
    agg: { pos, neg, neut, sentiment: Math.round(((pos - neg) / n) * 100), positiveRatio: Math.round((pos / n) * 100) },
    tones,
  };
}
