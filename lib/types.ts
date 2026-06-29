// KLAI 데이터 모델 타입 (빌드 스펙 §5 의 앱측 표현)

export type Grade = "S" | "A" | "B" | "C" | "D" | "E";
export type MarketVitality = "active" | "stable" | "shrinking";
export type NarrativeStage = "formation" | "spread" | "peak" | "decline";
export type Trajectory = "rising" | "stable" | "declining" | "gentrifying";
export type Severity = "high" | "mid" | "low";

export type LayerId =
  | "klai"
  | "axis4"
  | "d1"
  | "d2"
  | "d3"
  | "d4"
  | "momentum"
  | "gentri"
  | "market"
  | "narrative"
  | "popchange"
  | "budget"
  | "vitality"
  | "authgap"
  | "commerce"
  | "vacant"
  | "building"
  | "real"
  | "culture"
  | "potential";

export interface DistrictProps {
  admCd2: string;
  admCd: string;
  name: string;
  sido: string;
  sigungu: string;
  typology: string;
  centroidLng: number;
  centroidLat: number;
}

export interface DistrictFeature {
  type: "Feature";
  properties: DistrictProps;
  geometry: { type: "Polygon"; coordinates: number[][][] };
}

export interface DistrictCollection {
  type: "FeatureCollection";
  features: DistrictFeature[];
}

export interface PlaceScore {
  period: string;
  klai: number;
  grade: Grade;
  d1: number;
  d2: number;
  d3: number;
  d4: number;
  momentum: number;
  gentriG: number;
  gentriStage: number;
  gentriFlag: boolean;
  marketVitality: MarketVitality;
  narrativeStage: NarrativeStage;
  negativeNarrative: boolean;
  authenticityGap: number;
  population: number; // 해당 연도 총인구
  popChangeRate: number; // YoY %
  budgetInflow: number; // 해당 연도 공공조달 총액 (억원)
  provisional: boolean;
}

export interface ScoresFile {
  periods: string[];
  last: string;
  byPlace: Record<string, PlaceScore[]>;
}

export interface TopFactor {
  key: string;
  impact: number;
}

export interface GentriTransition {
  nextStage: number;
  nextStageName: string;
  prob: number;
  etaMonths: number;
}

export interface DeclineCause {
  factor: string;
  role: "trigger" | "amplifier" | "result";
}

export interface Risk {
  type: "gentri" | "decline" | "transaction_cliff" | "negative_narrative";
  severity: Severity;
  title: string;
  detail: string;
}

export interface Strategy {
  title: string;
  detail: string;
}

export interface Diagnosis {
  admCd2: string;
  period: string;
  trajectory: Trajectory;
  topFactors: TopFactor[];
  gentriStage: number;
  gentriStageName: string;
  gentriTransition: GentriTransition;
  declineCauses: DeclineCause[];
  leverage: string;
  narrativeTheme: string;
  authenticityGap: number;
  successPath: string | null;
  risks: Risk[];
  strategy: Strategy[];
  provisional: boolean;
}

export interface RankingRow {
  rank: number;
  admCd2: string;
  name: string;
  sigungu: string;
  typology: string;
  klai: number;
  grade: Grade;
  momentum: number;
}

export interface ReportRef {
  admCd2: string;
  name: string;
  sigungu?: string;
  klai?: number;
  grade?: Grade;
  momentum?: number;
}

export interface Report {
  id: string;
  kind: "annual" | "weekly" | "parcel";
  title: string;
  slug: string;
  period: string;
  publishedAt: string;
  paywalled: boolean;
  provisional: boolean;
  summary: string;
  blocks: Record<string, unknown>;
}

// ── 인구 장기 이력 ──────────────────────────────────────────
export interface DemographicYear {
  year: number;
  totalPop: number;
  households: number;
  youthRatio: number; // 20~39세 %
  elderlyRatio: number; // 65세+ %
  netMigration: number; // 순이동
  changeRate: number; // YoY %
}
export interface PopMeta {
  source: string;
  tables: string[];
  resolution: "sigungu" | "dong"; // 데이터 해상도
  real: string[]; // 실데이터 필드
  estimated: string[]; // 추정 유지 필드
  years: number[]; // [최소, 최대]
  fetchedFor: number;
}
export interface DemographicsFile {
  years: number[];
  byPlace: Record<string, DemographicYear[]>;
  popMeta?: PopMeta; // 있으면 인구·세대수 = 실데이터
}

// ── 나라장터 공공조달 흐름 ──────────────────────────────────
export interface ProcurementAnnual {
  year: number;
  bid: number; // 입찰 공고 합계 (만원)
  sole: number; // 수의계약 합계 (만원)
  total: number; // 만원
  count: number;
  byCategory: Record<string, number>; // 만원
}
export interface ProcurementRecord {
  year: number;
  type: "bid" | "sole";
  category: string;
  title: string;
  amount: number; // 만원
  agency: string;
}
export interface ProcurementPlace {
  annual: ProcurementAnnual[];
  records: ProcurementRecord[];
}
export interface ProcurementFile {
  years: number[];
  categories: string[];
  byPlace: Record<string, ProcurementPlace>;
}

// ── 상권(상가업소) 실측 — 소상공인시장진흥공단 상가정보(data.go.kr) ──
export interface CommercePlace {
  stores: number;              // 동별 등록 상가수(totalCount)
  sampled: number;             // 다양성 계산 표본 수
  diversity: number;           // 업종 대분류 Shannon 정규화(0~1)
  topCategories: [string, number][]; // [업종명, 개수] 상위
}
export interface CommerceFile {
  source: string;
  fetchedAt: string;
  byPlace: Record<string, CommercePlace>;
}

// ── 빈집 실측 — 통계청 인구주택총조사 미거주주택(빈집)비율 (KOSIS, 시군구) ──
export interface VacantPlace {
  ratio: number | null; // 빈집비율(%) — 시군구
  count: number | null; // 빈집 수(호) — 시군구 합계
  houses?: number | null; // 동 총주택수(호) — 읍면동 census (동단위 실측)
  est?: number | null; // 동 추정 빈집호수 = 동주택수 × 시군구율
  year: number;
}
export interface VacantFile {
  source: string;
  fetchedAt: string;
  resolution: string; // "sigungu"
  year: number;
  censusYear?: number | null; // 총주택수 census 연도
  byPlace: Record<string, VacantPlace>;
}

// ── D3 건축물(주택) 실측 — 통계청 인구주택총조사(KOSIS) ──
export interface BuildingPlace {
  houses: number | null; // 동 총주택수(밀도)
  typeMix: number | null; // 주택종류 다양성(용도혼합) 0~1 — 동단위
  types: { 단독: number; 아파트: number; 연립: number; 다세대: number; 비주거: number } | null;
  oldRatio: number | null; // 30년이상 노후 비율(%) — 시군구
  year: number | null;
}
export interface BuildingFile {
  source: string;
  fetchedAt: string;
  censusYear?: number | null;
  byPlace: Record<string, BuildingPlace>;
}

// ── 지역 문화 활력 — 한국문화정보원 공연·전시·축제 (data.go.kr, 시군구) ──
export interface CulturePlace {
  events: number; // 공연·전시·축제 수(시군구)
  topRealms: { name: string; count: number }[];
}
export interface CultureFile {
  source: string;
  fetchedAt: string;
  resolution: string; // "sigungu"
  byPlace: Record<string, CulturePlace>;
}

// ── 발전가능성 — 국토부 도시재생 쇠퇴진단 등급(시군구) ──
export interface PotentialPlace {
  grade: number; // 핵심지표 평균 등급 1~10(높을수록 양호)
  indicators: Record<string, number>; // 인구변화·재정자립·사업체증감·지가변동 등급
}
export interface PotentialFile {
  source: string;
  fetchedAt: string;
  year: string;
  note: string;
  byPlace: Record<string, PotentialPlace>;
}

// ── 지역 신호 (검색·기사·인구·임대료·매물) ──────────────────
export type SignalKey = "search" | "news" | "population" | "rent" | "listings";
export type SignalSeries = Record<SignalKey, number[]>;
export interface SignalsFile {
  periods: string[];
  keys: SignalKey[];
  byPlace: Record<string, SignalSeries>;
}

// 지도용: 선택 레이어·기간으로 색칠된 피처
export interface ColoredFeature extends DistrictFeature {
  properties: DistrictProps & {
    value: number;
    grade: Grade;
    label: string;
    color: [number, number, number, number];
    score: PlaceScore;
  };
}
