// 데이터 출처 레지스트리 — 각 지표의 실제 소스·필요 키·발급처.
// "실제 데이터가 없는 건 이유를 알려줘" → 이 레지스트리가 그 이유를 투명하게 보여준다.

export interface DataSource {
  id: string;
  metric: string; // 무엇을
  axis?: string; // KLAI 어느 축
  source: string; // 실제 기관/서비스
  url: string; // 발급/문서
  keyEnv: string[]; // 필요한 환경변수(없으면 무키)
  keyless?: boolean; // 키 없이 가능
  cadence: string; // 갱신 주기
  note: string; // 비고/이유
}

export const SOURCES: DataSource[] = [
  {
    id: "boundary",
    metric: "행정동 경계",
    source: "vuski/admdongkor (행안부 기반)",
    url: "https://github.com/vuski/admdongkor",
    keyEnv: [],
    keyless: true,
    cadence: "비정기",
    note: "공개 GitHub — 키 불필요. 이미 실제 데이터 연동됨(전국 3,554동).",
  },
  {
    id: "population",
    metric: "인구·세대수 (시군구) · 청년/고령·순이동(추정)",
    axis: "D1 인구·지속성",
    source: "통계청 KOSIS DT_1B040A3·DT_1B040B3",
    url: "https://kosis.kr/openapi",
    keyEnv: ["KOSIS_API_KEY"],
    cadence: "연 2015~2025",
    note: "✅ 연동됨: 총인구·세대수 시군구 단위 실데이터(2015~2025). 동별로는 소속 시군구 값 공유. 청년/고령·순이동은 시군구 연령·이동 통계 후속 연동 전까지 추정.",
  },
  {
    id: "commerce",
    metric: "창업·폐업·업종 다양성",
    axis: "D2 경제·상권",
    source: "소상공인진흥공단 상가(상권)정보 (data.go.kr)",
    url: "https://www.data.go.kr/data/15083033/openapi.do",
    keyEnv: ["DATA_GO_KR_KEY"],
    cadence: "분기",
    note: "LOCALDATA 접속 불안정 → data.go.kr 소진공 상가업소 API로 대체(업종·좌표 제공, 동 집계). 공공데이터포털 serviceKey 공용.",
  },
  {
    id: "rent",
    metric: "임대료·공실·수익률",
    axis: "D2-5 경제성",
    source: "한국부동산원 R-ONE 상업용 임대동향",
    url: "https://www.reb.or.kr/r-one/",
    keyEnv: ["RONE_API_KEY"],
    cadence: "분기",
    note: "R-ONE OpenAPI 키 필요. 상권/시도 단위 → 동 매핑 필요.",
  },
  {
    id: "transactions",
    metric: "매물·실거래·거래량",
    axis: "D2-6 시장활성도",
    source: "국토부 실거래가(RTMS) · 부동산거래현황",
    url: "https://www.data.go.kr",
    keyEnv: ["RTMS_API_KEY"],
    cadence: "월/실거래시",
    note: "data.go.kr serviceKey 필요. 필지→동 집계.",
  },
  {
    id: "search",
    metric: "검색량(관심도)",
    axis: "D4-2 인기",
    source: "네이버 데이터랩",
    url: "https://developers.naver.com/apps",
    keyEnv: ["NAVER_CLIENT_ID", "NAVER_CLIENT_SECRET"],
    cadence: "일/주",
    note: "네이버 개발자센터 애플리케이션 등록 → client id/secret 발급(무료).",
  },
  {
    id: "news",
    metric: "기사량·논조",
    axis: "D4-3 미디어",
    source: "네이버 뉴스 검색 API",
    url: "https://developers.naver.com/docs/serviceapi/search/news/news.md",
    keyEnv: ["NAVER_CLIENT_ID", "NAVER_CLIENT_SECRET"],
    cadence: "일/주",
    note: "BIGKINDS가 API 제공 종료 → 네이버 뉴스 검색 API로 대체. 지역명 질의의 total(기사량)·표본 제목으로 논조 추정. 키 작동 확인됨.",
  },
  {
    id: "procurement",
    metric: "공공조달(입찰·수의계약)",
    source: "조달청 나라장터",
    url: "https://www.data.go.kr",
    keyEnv: ["G2B_API_KEY"],
    cadence: "월/분기",
    note: "⚠ 라이브 호출 시 'Unexpected errors' — data.go.kr에서 '나라장터 입찰공고정보' 오픈API 활용신청 승인 필요(키 정상, 해당 API 미승인). 승인 후 기관 주소→동 지오코딩 연동.",
  },
  {
    id: "parcels",
    metric: "지번·필지 경계 (줌인 세부)",
    axis: "세부 LOD",
    source: "국토부 VWorld 연속지적도",
    url: "https://www.vworld.kr/dev/v4api.do",
    keyEnv: ["VWORLD_KEY"],
    cadence: "비정기",
    note: "VWorld 운영키 작동 확인. 확대 시 필지 단위 성장·활력 그래프로 전환.",
  },
  // ── 지역 연구용 추가 지표 ───────────────────────────────────
  {
    id: "building",
    metric: "건축 인허가·착공·준공·대수선·멸실",
    axis: "D3 공간·물리 (개발·노후·재생)",
    source: "국토부 건축HUB 건축인허가/건축물대장 (data.go.kr)",
    url: "https://www.data.go.kr/data/15134735/openapi.do",
    keyEnv: ["DATA_GO_KR_KEY"],
    cadence: "월",
    note: "신축·대수선·멸실 건수·연면적 → 물리적 변화·재생·노후도 신호. ⚠ 라이브 호출 시 Forbidden — data.go.kr에서 '건축HUB 건축인허가' 오픈API 활용신청 승인 필요(키는 정상, 해당 API 미승인). 승인 후 동(법정동) 단위 연동.",
  },
  {
    id: "landprice",
    metric: "개별공시지가 (㎡당)",
    axis: "D3-5 자산가치",
    source: "국토부 개별공시지가 (data.go.kr / 부동산공시가격알리미)",
    url: "https://www.data.go.kr/data/15012926/openapi.do",
    keyEnv: ["DATA_GO_KR_KEY"],
    cadence: "연",
    note: "필지별 공시지가 → 동 집계로 지가 추세·격차. 역U·포화 보정(시세표화 금지, §15). serviceKey 공용.",
  },
  {
    id: "business",
    metric: "사업체수·종사자수 (산업 구조)",
    axis: "D2 경제·상권 (고용 기반)",
    source: "통계청 전국사업체조사 (KOSIS)",
    url: "https://kosis.kr/openapi",
    keyEnv: ["KOSIS_API_KEY"],
    cadence: "연",
    note: "시군구 단위 사업체·종사자 → 경제 기반·고용 규모. KOSIS 키 작동 확인(인구와 동일). 동 단위는 소속 시군구 공유.",
  },
];

export type SourceStatus = "real" | "key-set" | "pending";

// 서버 전용 — 환경변수·실데이터 파일 유무로 상태 판정
export function statusOf(src: DataSource, realIngested: Set<string>): {
  status: SourceStatus;
  reason: string;
} {
  if (src.keyless || realIngested.has(src.id)) {
    return { status: "real", reason: "실제 데이터 연동됨" };
  }
  const missing = src.keyEnv.filter((k) => !process.env[k]);
  if (missing.length === 0 && src.keyEnv.length > 0) {
    return { status: "key-set", reason: "키 설정됨 — 인제스트 실행 시 연동" };
  }
  return { status: "pending", reason: `키 미설정: ${src.keyEnv.join(", ")} — ${src.note}` };
}
