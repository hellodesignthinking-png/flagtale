import Link from "next/link";
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

// 행정동 중심 좌표 → 실제 지도 타일(CARTO voyager). 그 위치의 실제 거리·블록 이미지.
function tileUrl(lng: number, lat: number, z = 13): string {
  const n = 2 ** z;
  const x = Math.floor(((lng + 180) / 360) * n);
  const y = Math.floor(((1 - Math.asinh(Math.tan((lat * Math.PI) / 180)) / Math.PI) / 2) * n);
  return `https://a.basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}@2x.png`;
}

export function ArticleCard({ item, big }: { item: CardItem; big?: boolean }) {
  const up = item.kind === "rise";
  const g = GRADE_HEX[item.grade] ?? "#888";
  const meta = item.typology ? `${item.sigungu} · ${item.typology}` : item.sigungu;
  const excerpt = up
    ? `${item.typology || "이 동네"}, 최근 분기 모멘텀 +${item.momentum}. 검색·상권·인식이 함께 오르며 상위권으로 올라서는 중.`
    : `${item.typology || "이 동네"}, 모멘텀 ${item.momentum}. 시장 활력이 ${VITALITY_KO[item.marketVitality] ?? "둔화"}로 돌아서는 신호.`;
  return (
    <Link href={`/diagnose?admCd=${item.cd}`} className="lift group flex flex-col overflow-hidden rounded-2xl border border-line bg-card2/40">
      {/* 커버 = 실제 지도 타일 + 브랜드 스크림 (그라데이션은 타일 로드 실패 시 폴백) */}
      <div className="relative aspect-[16/9] w-full overflow-hidden" style={{ background: `linear-gradient(135deg, ${g}, ${g}26)` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={tileUrl(item.lng, item.lat)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${g}40 0%, transparent 28%, transparent 52%, rgba(0,0,0,.5) 100%)` }} />
        <span className="absolute left-3 top-3 status-pill" style={{ background: up ? "var(--amber)" : "rgba(255,255,255,.28)", color: up ? "var(--on-accent)" : "#fff" }}>
          {up ? `📈 유행중 +${item.momentum}` : `📉 식는중 ${item.momentum}`}
        </span>
        <span className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-black/25 text-[12px] text-white backdrop-blur-sm">🔖</span>
        <span className="absolute bottom-3 left-4 flex items-end gap-1.5 text-white">
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
