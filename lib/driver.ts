// 활성화/쇠퇴 동인 분해 — "왜 이 동네가 뜨나/지나?"를 실측 신호로 귀인(attribution).
//   · 로컬크리에이터·자생 = 네이버 버즈/검색추세 + 소진공 독립점포·음식카페·다양성
//   · 공공지원           = 나라장터 공공예산 유입
//   · 자본·부동산(젠트리) = 부동산원 임대가격지수 급등 + 공실률
import type { PlaceScore } from "./types";
import type { Corrected } from "./corrected";
import type { SanggaStats } from "./connectors/sangga";
import type { RebForPlace } from "./connectors/reb";

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
const r0 = (v: number) => Math.round(v);

export interface Driver {
  key: "local" | "public" | "capital";
  label: string;
  score: number; // 0~100
  basis: string; // 근거(실측 수치)
}
export interface DriverAttribution {
  primary: Driver;
  drivers: Driver[];
  trend: "활성화" | "쇠퇴" | "정체";
  narrative: string;
}

export function attributeDrivers(args: {
  latest: PlaceScore;
  corrected: Corrected | null;
  sangga: SanggaStats | null;
  reb: RebForPlace | null;
}): DriverAttribution {
  const { latest, corrected, sangga, reb } = args;
  const buzz = corrected?.d4 ?? 0;
  const searchMom = corrected?.searchMomentum ?? 0;

  // ① 로컬크리에이터·자생
  let local = buzz * 0.6;
  let localBasis = `네이버 버즈 ${buzz}`;
  if (sangga) {
    const indie = 100 - sangga.chainRatio; // 독립점포 비율
    local += indie * 0.2 + Math.min(sangga.foodCafeRatio, 60) * 0.3;
    localBasis += ` · 독립점포 ${r0(indie)}% · 음식·카페 ${sangga.foodCafeRatio}% · 다양성 ${sangga.diversity}`;
  } else if (searchMom > 0) {
    local += 15;
  }
  const localD: Driver = { key: "local", label: "로컬크리에이터·자생", score: r0(clamp(local)), basis: localBasis };

  // ② 공공지원
  const pub = clamp((latest.budgetInflow / 110) * 100);
  const publicD: Driver = { key: "public", label: "공공지원·예산", score: r0(pub), basis: `나라장터 공공예산 ${latest.budgetInflow}억/년` };

  // ③ 자본·부동산(젠트리)
  let cap = 0;
  let capBasis = "부동산원 임대 데이터 매칭 안 됨";
  if (reb?.rent) {
    cap = reb.rent.chgFrom2016 * 2.2 + (reb.vacancy ? reb.vacancy.latest * 1.2 : 0);
    capBasis = `임대가격지수 2016대비 ${reb.rent.chgFrom2016 >= 0 ? "+" : ""}${reb.rent.chgFrom2016} (${reb.rent.region})`;
    if (reb.vacancy) capBasis += ` · 공실률 ${reb.vacancy.latest}%`;
  }
  const capitalD: Driver = { key: "capital", label: "자본·부동산(젠트리)", score: r0(clamp(cap)), basis: capBasis };

  const drivers = [localD, publicD, capitalD].sort((a, b) => b.score - a.score);
  const primary = drivers[0];

  // 활성화/쇠퇴 — 검색추세 + 공실률 + 모멘텀
  const vac = reb?.vacancy?.latest ?? null;
  const trend: DriverAttribution["trend"] =
    searchMom > 10 && (vac == null || vac < 12)
      ? "활성화"
      : searchMom < -15 || (vac != null && vac > 15)
        ? "쇠퇴"
        : "정체";

  const why: Record<Driver["key"], string> = {
    local: "고유 콘텐츠·독립 점포와 자생적 관심(검색·기사)이 동네를 끌어올리는 구조입니다. 임대료가 콘텐츠를 내몰지 않는 한 지속됩니다.",
    public: "공공예산·사업 투입이 큰 비중입니다. 자생 수요로 이어지지 않으면 지원 종료 후 동력이 꺾일 수 있습니다.",
    capital: "임대료 상승·자본 유입이 주도합니다. 매출·콘텐츠가 임대료를 못 따라가면 젠트리→공실로 갑니다(가로수길 경로).",
  };
  const narrative = `${trend} · 주도 동인은 「${primary.label}」(${primary.score}점). ${why[primary.key]}`;

  return { primary, drivers, trend, narrative };
}
