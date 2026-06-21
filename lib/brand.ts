// 브랜드 진단 — 네이버에 등록된 매장/로컬 브랜드를 검색해 그 매장을 중심으로 지역을 평가.
// 프랜차이즈(체인)는 식별·라벨링해 '로컬 브랜드'가 부각되도록 정렬한다.
import "server-only";
import { naverJson } from "@/lib/connectors/naverFetch";

const ID = process.env.NAVER_CLIENT_ID;
const SEC = process.env.NAVER_CLIENT_SECRET;
const H = { "X-Naver-Client-Id": ID ?? "", "X-Naver-Client-Secret": SEC ?? "" };

export interface BrandCandidate {
  name: string;
  category: string;
  address: string;
  roadAddress: string;
  lng: number;
  lat: number;
  isFranchise: boolean;
}

// 대표 프랜차이즈/체인 브랜드 — 로컬 브랜드와 구분(완전하진 않지만 흔한 체인 커버).
const FRANCHISE_RE =
  /(스타벅스|투썸|이디야|메가\s?커피|메가엠지씨|빽다방|컴포즈|커피빈|할리스|폴바셋|엔제리너스|탐앤탐스|파스쿠찌|더벤티|매머드|공차|설빙|쥬씨|요거프레소|드롭탑|토프레소|카페베네|블루보틀|투썸플레이스|파리바게[뜨트]|뚜레쥬르|던킨|크리스피크림|성심당[^\s]*분점|맥도날드|버거킹|롯데리아|KFC|맘스터치|노브랜드\s?버거|써브웨이|한솥|본도시락|신전떡볶이|엽기떡볶이|죠스떡볶이|국대떡볶이|두끼|BBQ|비비큐|BHC|비에이치씨|교촌|굽네|네네치킨|자담치킨|처갓집|또래오래|페리카나|호식이|푸라닭|60계|피자헛|도미노|미스터피자|파파존스|반올림피자|피자스쿨|본죽|본설렁탕|김밥천국|고봉민김밥|바르다김선생|이삭토스트|올리브영|다이소|무신사\s?스탠다드|GS25|CU|세븐일레븐|이마트24|미니스톱|새마을식당|홍콩반점|빽보이피자|명륜진사갈비|하남돼지집|원할머니|놀부|채선당|투다리|역전할머니맥주|가르텐비어|버드나무집|봉구비어|생활맥주|컴포즈커피|더진국|배스킨라빈스|배라|나뚜루|설빙|망고식스|쥬스식스)/i;

function isFranchise(name: string, category: string): boolean {
  if (FRANCHISE_RE.test(name)) return true;
  // 'OO 가맹점/체인' 류 카테고리 힌트
  if (/프랜차이즈|체인/.test(category)) return true;
  return false;
}

// 매장/브랜드명 검색 → 좌표·주소·프랜차이즈여부. 로컬 브랜드 우선 정렬.
export async function searchBrands(query: string, max = 6): Promise<BrandCandidate[] | null> {
  const q = query.trim();
  if (!ID || !SEC || !q) return null;
  const j = (await naverJson(
    `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(q)}&display=${Math.min(max + 4, 10)}&sort=comment`,
    H
  )) as { items?: { title?: string; category?: string; address?: string; roadAddress?: string; mapx?: string; mapy?: string }[] } | null;
  const items = j?.items ?? [];
  const seen = new Set<string>();
  const cands: BrandCandidate[] = [];
  for (const it of items) {
    const name = String(it.title ?? "").replace(/<[^>]+>/g, "").trim();
    if (!name || seen.has(name) || !it.mapx || !it.mapy) continue;
    seen.add(name);
    cands.push({
      name,
      category: it.category ?? "",
      address: it.address ?? "",
      roadAddress: it.roadAddress ?? "",
      lng: Number(it.mapx) / 1e7, // 네이버 좌표 = WGS84 × 10^7
      lat: Number(it.mapy) / 1e7,
      isFranchise: isFranchise(name, it.category ?? ""),
    });
  }
  if (!cands.length) return null;
  // 로컬 브랜드 우선(프랜차이즈는 뒤로)
  cands.sort((a, b) => Number(a.isFranchise) - Number(b.isFranchise));
  return cands.slice(0, max);
}
