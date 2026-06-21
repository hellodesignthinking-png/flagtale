import Link from "next/link";
import type { CSSProperties } from "react";
import type { DistrictProps, PlaceScore, Grade } from "@/lib/types";
import { ReasonPin } from "./ReasonPin";

// 클라이언트(탭/캐러셀)로도 넘길 수 있게 직렬화 가능한 카드 데이터
export interface CardItem {
  cd: string;
  name: string;
  sigungu: string;
  typology: string;
  klai: number;
  grade: Grade;
  momentum: number;
  marketVitality: string;
  gentriStage: number;
  d1: number;
  d2: number;
  d3: number;
  d4: number;
  budgetInflow: number;
  negativeNarrative: boolean;
  popChangeRate: number;
  lng: number;
  lat: number;
  kind: "rise" | "fall";
}

export function toCardItem(cd: string, p: DistrictProps, s: PlaceScore): CardItem {
  return {
    cd,
    name: p.name,
    sigungu: p.sigungu,
    typology: p.typology ?? "",
    klai: s.klai,
    grade: s.grade,
    momentum: s.momentum,
    marketVitality: s.marketVitality,
    gentriStage: s.gentriStage,
    d1: s.d1,
    d2: s.d2,
    d3: s.d3,
    d4: s.d4,
    budgetInflow: s.budgetInflow,
    negativeNarrative: s.negativeNarrative,
    popChangeRate: s.popChangeRate,
    lng: p.centroidLng,
    lat: p.centroidLat,
    kind: s.momentum >= 0 ? "rise" : "fall",
  };
}

const VITALITY_KO: Record<string, string> = { active: "활발", stable: "안정", shrinking: "위축" };

function hook(it: CardItem): string {
  if (it.kind === "rise") {
    if (it.gentriStage <= 1) return `${it.name}, 저평가 구간에서 뜨는 중`;
    if (it.gentriStage >= 3) return `${it.name}, 젠트리 가속 — 지금이 변곡점`;
    if (it.marketVitality === "active") return `${it.name}, 상권에 다시 불이 붙었다`;
    return `${it.name}, 검색·인식이 먼저 움직였다`;
  }
  if (it.marketVitality === "shrinking") return `${it.name}, 거래절벽 — 위기 경보`;
  if (it.gentriStage >= 4) return `${it.name}, 젠트리 후폭풍에 식는 중`;
  return `${it.name}, 모멘텀 꺾인 국면`;
}

// 뜨는/식는 핵심 이유: 핀 라벨 + 클릭 상세. 지배 축으로 자동 판별.
export function reasonInfo(it: CardItem): { label: string; detail: string } {
  if (it.kind === "rise") {
    if (it.gentriStage >= 4) return { label: "⚡ 젠트리 가속", detail: "브랜드·임대료 상승이 빨라지는 젠트리 가속 구간. 기존 상인·원주민 이탈은 경계 신호." };
    const ax = [
      { l: "🔍 검색·미디어 ↑", v: it.d4, d: "네이버 검색·기사·SNS 버즈가 또래 동 대비 상위. 인식이 상권보다 먼저 움직이는 선행 신호." },
      { l: "🏪 상권 성장 ↑", v: it.d2, d: "창업·매출·업종 다양성이 강세. 상권 규모 자체가 커지는 국면." },
      { l: "👥 인구 유입 ↑", v: it.d1, d: "인구·생활인구 유입이 견인. 수요 기반이 두꺼워지는 중." },
      { l: "🏗️ 공간 개선 ↑", v: it.d3, d: "접근성·신축·정비 등 물리 환경 개선이 상승을 받친다." },
    ].sort((a, b) => b.v - a.v);
    if (it.budgetInflow >= 60 && it.budgetInflow > ax[0].v) return { label: "🏛️ 공공투자 유입", detail: "공공조달·예산 유입이 또래 동 대비 큼. 정비·인프라가 마중물 역할." };
    return { label: ax[0].l, detail: ax[0].d };
  }
  if (it.marketVitality === "shrinking") return { label: "🧊 거래절벽", detail: "거래량 급감·공실 장기화. 가격이 아니라 '안 팔리는' 위축 신호." };
  if (it.negativeNarrative) return { label: "🗣️ 부정 서사 확산", detail: "기사·리뷰의 부정 톤이 확산. 인식 악화가 방문·매출로 번질 위험." };
  if (it.popChangeRate < 0) return { label: "👥 인구 감소", detail: `인구가 전년 대비 ${it.popChangeRate.toFixed(1)}% 감소. 수요 기반이 얇아지는 중.` };
  return { label: "📉 모멘텀 둔화", detail: "상승 동력이 식는 국면. 축별 신호가 약해지고 있다." };
}

// 행정동 중심을 정중앙에 두는 3×3 지도 타일(CARTO voyager) 배경 — 넓은 카드도 빈틈 없이 채움
function coverStyle(lng: number, lat: number, z = 13): CSSProperties {
  const n = 2 ** z;
  const fx = ((lng + 180) / 360) * n;
  const fy = ((1 - Math.asinh(Math.tan((lat * Math.PI) / 180)) / Math.PI) / 2) * n;
  const cx = Math.floor(fx);
  const cy = Math.floor(fy);
  const S = 352; // 타일 표시 크기(넓은 피처드 카드도 3×3로 빈틈 없이 덮도록)
  const cpx = (fx - (cx - 1)) * S; // 중심 좌표의 합성 내 위치(중앙 타일 기준)
  const cpy = (fy - (cy - 1)) * S;
  const imgs: string[] = [];
  const poss: string[] = [];
  const sizes: string[] = [];
  for (let j = 0; j < 3; j++) {
    for (let i = 0; i < 3; i++) {
      imgs.push(`url(https://a.basemaps.cartocdn.com/rastertiles/voyager/${z}/${cx - 1 + i}/${cy - 1 + j}@2x.png)`);
      poss.push(`calc(50% - ${cpx - i * S}px) calc(50% - ${cpy - j * S}px)`);
      sizes.push(`${S}px ${S}px`);
    }
  }
  imgs.push("linear-gradient(135deg, #e8edf0, #dbe3e7)"); // 타일 실패/여백 시 지도색과 어우러지는 폴백
  poss.push("center");
  sizes.push("cover");
  return {
    backgroundImage: imgs.join(", "),
    backgroundPosition: poss.join(", "),
    backgroundSize: sizes.join(", "),
    backgroundRepeat: "no-repeat",
  };
}

export function ArticleCard({ item, big }: { item: CardItem; big?: boolean }) {
  const up = item.kind === "rise";
  const meta = item.typology ? `${item.sigungu} · ${item.typology}` : item.sigungu;
  const info = reasonInfo(item);
  const excerpt = up
    ? `${item.typology || "이 동네"}, 최근 분기 모멘텀 +${item.momentum}. 검색·상권·인식이 함께 오르며 상위권으로 올라서는 중.`
    : `${item.typology || "이 동네"}, 모멘텀 ${item.momentum}. 시장 활력이 ${VITALITY_KO[item.marketVitality] ?? "둔화"}로 돌아서는 신호.`;
  return (
    <Link href={`/diagnose?admCd=${item.cd}`} className="lift group flex flex-col overflow-hidden rounded-2xl border border-line bg-card2/40">
      {/* 커버 = 동 중심 2×2 지도 타일 + 가벼운 하단 스크림(지도 가시성↑) + 이유 핀 */}
      <div className="relative aspect-[16/9] w-full" style={coverStyle(item.lng, item.lat)}>
        <div className="pointer-events-none absolute inset-0 rounded-t-2xl" style={{ background: "linear-gradient(180deg, transparent 46%, rgba(0,0,0,.52) 100%)" }} />
        <span className="absolute left-3 top-3 z-10 status-pill shadow-sm" style={{ background: up ? "var(--amber)" : "rgba(20,30,50,.6)", color: up ? "var(--on-accent)" : "#fff" }}>
          {up ? `📈 유행중 +${item.momentum}` : `📉 식는중 ${item.momentum}`}
        </span>
        <span className="absolute right-3 top-3 z-10 grid h-7 w-7 place-items-center rounded-full bg-black/30 text-[12px] text-white backdrop-blur-sm">🔖</span>
        <ReasonPin label={info.label} detail={info.detail} up={up} />
        <span className="absolute bottom-3 left-4 z-10 flex items-end gap-1.5 text-white">
          <span className={`${big ? "text-[3rem]" : "text-[2.1rem]"} font-black leading-none tabular-nums drop-shadow-lg`}>{item.klai}</span>
          <span className="pb-1 text-[12px] font-bold opacity-95 drop-shadow">KLAI·{item.grade}</span>
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="cat-tag">{meta}</div>
        <h3 className={`mt-1 font-extrabold leading-snug text-ink group-hover:text-blue-l ${big ? "text-[1.5rem]" : "text-[17px]"}`}>{hook(item)}</h3>
        {big && <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{excerpt}</p>}
        {big && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-navy/50 px-2.5 py-1 text-[11.5px] font-bold text-muted">모멘텀 {up ? "+" : ""}{item.momentum}</span>
            <span className="rounded-full bg-navy/50 px-2.5 py-1 text-[11.5px] font-bold text-muted">시장 {VITALITY_KO[item.marketVitality] ?? "—"}</span>
            <span className="rounded-full bg-navy/50 px-2.5 py-1 text-[11.5px] font-bold text-muted">젠트리 {item.gentriStage}단계</span>
          </div>
        )}
        <div className="mt-auto flex items-center gap-1.5 pt-3 text-[11.5px] text-muted2">
          <span className="font-semibold text-muted">{item.name}</span>
          <span>·</span>
          <span>이번 주 · Flagtale Weekly</span>
        </div>
      </div>
    </Link>
  );
}
