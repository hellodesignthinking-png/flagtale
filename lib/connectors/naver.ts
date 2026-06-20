// 네이버 실데이터 — 검색 관심도(DataLab 검색어트렌드) + 기사량(뉴스 검색).
// 전국 3,554동 일괄 수집은 API 일일한도 초과 → place 페이지 조회 시 해당 동만
// 온디맨드 호출하고 메모리에 캐시(6h). 서버 전용.
import "server-only";

const ID = process.env.NAVER_CLIENT_ID;
const SECRET = process.env.NAVER_CLIENT_SECRET;

export interface NaverInterest {
  query: string;
  searchTrend: { period: string; ratio: number }[]; // 월별 상대 검색량(0~100, DataLab)
  newsTotal: number; // 전체 기사량(검색 결과 총건수)
  sentiment: number; // 미디어 센티먼트 -100~+100 = (긍정-부정)/표본
  pos: number; // 표본 내 긍정(활성화) 기사 수
  neg: number; // 표본 내 부정(위기·사건) 기사 수
  neut: number; // 중립
  headlines: { title: string; date: string; link: string; tone: 1 | 0 | -1 }[]; // 톤 태그 포함
}

// 긍정(지역 활성화) / 부정(위기·사건사고) 키워드 — 뉴스가 지역에 어떻게 작용하는지 분류.
const POS =
  /맛집|카페|핫플|팝업|전시|축제|공연|페스티벌|뮤지컬|콘서트|창업|오픈|개[업관]|입점|명소|관광|투자|유치|개발|재생|활성화|뜨는|줄[서선]|인기|트렌드|성지|청년|문화|브랜드|플래그십|체험|박람회|상생|북적|방문객|상권\s?살|매출\s?증가|명품거리|랜드마크|부활|골목상권/;
const NEG =
  /화재|불(?:이|을)|살인|사망|숨[지져]|시신|사고|부상|중상|폭행|범죄|검거|체포|구속|마약|성[폭추]|음주운전|뺑소니|붕괴|추락|실종|사기|횡령|자살|투신|흉기|강도|절도|방화|폭발|감전|침수|누수|악취|민원|소송|고소|고발|논란|갑질|확진|적발|단속|벌금|과태료|불법|위반|공실|폐업|쇠퇴|침체|내몰|젠트리|떠나|불황|적자|문\s?닫|우범|슬럼|상권\s?붕괴/;

// 톤 분류: 부정 우선(맛집 기사라도 화재면 부정) → 긍정 → 중립
function toneOf(text: string): 1 | 0 | -1 {
  if (NEG.test(text)) return -1;
  if (POS.test(text)) return 1;
  return 0;
}

const cache = new Map<string, { at: number; data: NaverInterest }>();
const TTL = 1000 * 60 * 60 * 6;

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function naverInterest(query: string): Promise<NaverInterest | null> {
  const q = query.trim();
  if (!ID || !SECRET || !q) return null;
  const cached = cache.get(q);
  if (cached && Date.now() - cached.at < TTL) return cached.data;

  const headers = { "X-Naver-Client-Id": ID, "X-Naver-Client-Secret": SECRET };
  const now = new Date();
  const start = new Date(now);
  start.setFullYear(start.getFullYear() - 3);

  const trendReq = fetch("https://openapi.naver.com/v1/datalab/search", {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(4500),
    body: JSON.stringify({
      startDate: ymd(start),
      endDate: ymd(now),
      timeUnit: "month",
      keywordGroups: [{ groupName: q, keywords: [q] }],
    }),
  })
    .then((r) => r.json())
    .catch(() => null);

  // display 40 — 긍정/부정/중립 센티먼트 표본 확대
  const newsReq = fetch(
    `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(q)}&display=40&sort=date`,
    { headers, cache: "no-store", signal: AbortSignal.timeout(4500) }
  )
    .then((r) => r.json())
    .catch(() => null);

  const [trendJson, newsJson] = await Promise.all([trendReq, newsReq]);

  const searchTrend: NaverInterest["searchTrend"] = (trendJson?.results?.[0]?.data ?? []).map(
    (d: { period: string; ratio: number }) => ({
      period: d.period.slice(0, 7),
      ratio: Math.round(d.ratio * 10) / 10,
    })
  );
  if (!searchTrend.length && !newsJson?.total) return null; // 둘 다 실패면 폴백

  const items = (newsJson?.items ?? []) as { title: string; description?: string; pubDate: string; originallink?: string; link: string }[];
  const clean = (s: string) => String(s).replace(/<[^>]+>/g, "").replace(/&[a-z]+;/g, " ");
  let pos = 0, neg = 0, neut = 0;
  const tagged = items.map((it) => {
    const t = toneOf(clean(it.title) + " " + clean(it.description ?? ""));
    if (t > 0) pos++;
    else if (t < 0) neg++;
    else neut++;
    return {
      title: clean(it.title),
      date: it.pubDate ? new Date(it.pubDate).toISOString().slice(0, 10) : "",
      link: it.originallink || it.link,
      tone: t,
    };
  });
  const sampleN = pos + neg + neut || 1;
  const sentiment = Math.round(((pos - neg) / sampleN) * 100); // -100~+100

  const data: NaverInterest = {
    query: q,
    searchTrend,
    newsTotal: Number(newsJson?.total ?? 0),
    sentiment,
    pos,
    neg,
    neut,
    headlines: tagged.slice(0, 6), // 톤 태그 포함(긍정·부정 모두)
  };
  cache.set(q, { at: Date.now(), data });
  return data;
}
