import Link from "next/link";
import type { CSSProperties } from "react";
import { GRADE_HEX } from "@/lib/constants";
import type { DistrictProps, PlaceScore, Grade } from "@/lib/types";

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

// 데이터 → careet식 에디토리얼 헤드라인
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

// 뜨는/식는 핵심 이유(지도 핀 라벨)
function reasonOf(it: CardItem): string {
  if (it.kind === "rise") {
    if (it.gentriStage >= 4) return "⚡ 젠트리 가속";
    // 가장 강한 축이 그 동네가 뜨는 이유 (검색/상권/인구/공간), 공공투자가 압도적이면 우선
    const ax: [string, number][] = [
      ["🔍 검색·미디어 ↑", it.d4],
      ["🏪 상권 성장 ↑", it.d2],
      ["👥 인구 유입 ↑", it.d1],
      ["🏗️ 공간 개선 ↑", it.d3],
    ];
    ax.sort((a, b) => b[1] - a[1]);
    if (it.budgetInflow >= 60 && it.budgetInflow > ax[0][1]) return "🏛️ 공공투자 유입";
    return ax[0][0];
  }
  if (it.marketVitality === "shrinking") return "🧊 거래절벽";
  if (it.negativeNarrative) return "🗣️ 부정 서사 확산";
  if (it.popChangeRate < 0) return "👥 인구 감소";
  return "📉 모멘텀 둔화";
}

// 행정동 중심을 정중앙에 두는 2×2 지도 타일(CARTO voyager) 배경 스타일
function coverStyle(lng: number, lat: number, gradient: string, z = 13): CSSProperties {
  const n = 2 ** z;
  const fx = ((lng + 180) / 360) * n;
  const fy = ((1 - Math.asinh(Math.tan((lat * Math.PI) / 180)) / Math.PI) / 2) * n;
  const cx = Math.floor(fx);
  const cy = Math.floor(fy);
  const tx = fx - cx < 0.5 ? cx - 1 : cx; // 중심이 2×2의 중앙 이음새에 오도록 좌상단 타일 선택
  const ty = fy - cy < 0.5 ? cy - 1 : cy;
  const S = 256;
  const cpx = (fx - tx) * S;
  const cpy = (fy - ty) * S;
  const u = (x: number, y: number) => `url(https://a.basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}@2x.png)`;
  return {
    backgroundImage: `${u(tx, ty)}, ${u(tx + 1, ty)}, ${u(tx, ty + 1)}, ${u(tx + 1, ty + 1)}, ${gradient}`,
    backgroundPosition:
      `calc(50% - ${cpx}px) calc(50% - ${cpy}px), ` +
      `calc(50% - ${cpx - S}px) calc(50% - ${cpy}px), ` +
      `calc(50% - ${cpx}px) calc(50% - ${cpy - S}px), ` +
      `calc(50% - ${cpx - S}px) calc(50% - ${cpy - S}px), center`,
    backgroundSize: `${S}px ${S}px, ${S}px ${S}px, ${S}px ${S}px, ${S}px ${S}px, cover`,
    backgroundRepeat: "no-repeat",
  };
}

export function ArticleCard({ item, big }: { item: CardItem; big?: boolean }) {
  const up = item.kind === "rise";
  const g = GRADE_HEX[item.grade];
  const meta = item.typology ? `${item.sigungu} · ${item.typology}` : item.sigungu;
  const excerpt = up
    ? `${item.typology || "이 동네"}, 최근 분기 모멘텀 +${item.momentum}. 검색·상권·인식이 함께 오르며 상위권으로 올라서는 중.`
    : `${item.typology || "이 동네"}, 모멘텀 ${item.momentum}. 시장 활력이 ${VITALITY_KO[item.marketVitality] ?? "둔화"}로 돌아서는 신호.`;
  return (
    <Link href={`/diagnose?admCd=${item.cd}`} className="lift group flex flex-col overflow-hidden rounded-2xl border border-line bg-card2/40">
      {/* 커버 = 동 중심 2×2 지도 타일 + 스크림 + 이유 핀 */}
      <div className="relative aspect-[16/9] w-full overflow-hidden" style={coverStyle(item.lng, item.lat, `linear-gradient(135deg, ${g}, ${g}26)`)}>
        <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${g}40 0%, transparent 26%, transparent 50%, rgba(0,0,0,.5) 100%)` }} />
        <span className="absolute left-3 top-3 z-10 status-pill" style={{ background: up ? "var(--amber)" : "rgba(255,255,255,.28)", color: up ? "var(--on-accent)" : "#fff" }}>
          {up ? `📈 유행중 +${item.momentum}` : `📉 식는중 ${item.momentum}`}
        </span>
        <span className="absolute right-3 top-3 z-10 grid h-7 w-7 place-items-center rounded-full bg-black/25 text-[12px] text-white backdrop-blur-sm">🔖</span>
        {/* 뜨는/식는 이유 핀(콜아웃) — 정중앙 위치 = 동 위치 */}
        <span className="absolute left-1/2 top-1/2 z-20 h-3 w-3 rounded-full shadow ring-2 ring-white" style={{ background: up ? "var(--amber)" : "var(--warn)", transform: "translate(-50%,-50%)" }} />
        <span className="absolute left-1/2 top-1/2 z-20 whitespace-nowrap rounded-full bg-white px-2.5 py-[3px] text-[11px] font-extrabold text-[#0D2B5E] shadow-md ring-1 ring-black/5" style={{ transform: "translate(-50%, calc(-50% - 13px))" }}>
          {reasonOf(item)}
        </span>
        <span className="absolute bottom-3 left-4 z-10 flex items-end gap-1.5 text-white">
          <span className={`${big ? "text-[3rem]" : "text-[2.1rem]"} font-black leading-none tabular-nums drop-shadow-md`}>{item.klai}</span>
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
