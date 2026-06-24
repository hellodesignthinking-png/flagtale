// 실제 핫지역의 내러티브(이야기) — 라이프사이클 단계에 매핑한 큐레이션 데이터.
// 추상적 5단계 모델을 실제 동네(문래·연희·성수·연남…)로 검증할 수 있게 함.
// fs 의존 없음 → 클라이언트 컴포넌트에서 직접 import 가능. (샘플 동 데이터엔 핫지역명이 없어 별도 큐레이션)

export type LifeStage = "formation" | "spread" | "peak" | "gentri" | "decline";

export const STAGE_META: Record<LifeStage, { label: string; short: string; color: string; emoji: string }> = {
  formation: { label: "① 형성", short: "형성", color: "#0F6E5C", emoji: "🌱" },
  spread: { label: "② 확산", short: "확산", color: "#3E9AA8", emoji: "📈" },
  peak: { label: "③ 절정", short: "절정", color: "#E2A33A", emoji: "🔥" },
  gentri: { label: "④ 젠트리", short: "젠트리", color: "#D2691E", emoji: "⚠️" },
  decline: { label: "⑤ 쇠퇴", short: "쇠퇴", color: "#A23A2A", emoji: "📉" },
};

export type Authenticity = "high" | "mid" | "low";
export const AUTH_META: Record<Authenticity, { label: string; color: string }> = {
  high: { label: "정합 (서사≈상권)", color: "var(--green)" },
  mid: { label: "주의 (상승 압력)", color: "var(--amber-d)" },
  low: { label: "괴리 (서사<자본)", color: "var(--warn)" },
};

export interface AreaNarrative {
  name: string;
  region: string;
  stage: LifeStage;
  theme: string;      // 한 줄 정체성(이야기)
  arc: string;        // 서사 궤적(형성 → 현재)
  keywords: string[];
  anchor: string;     // 서사를 견인하는 앵커
  authenticity: Authenticity;
  authNote: string;   // 서사 vs 실제 상권
  caution?: string;   // 역티핑/주의
}

// 라이프사이클 순(형성 → 쇠퇴)
export const AREA_NARRATIVES: AreaNarrative[] = [
  // ── ① 형성 ──
  {
    name: "인천 개항로", region: "인천 중구", stage: "formation",
    theme: "개항장 노포를 ‘로컬 브랜드’로 다시 세우다",
    arc: "1883 개항장 → 쇠락한 인쇄·철공 노포 골목 → ‘개항로 프로젝트’가 노포를 브랜딩(개항로 통닭·라거)하며 원도심 재생.",
    keywords: ["개항로프로젝트", "개항장", "노포", "원도심재생"], anchor: "개항로 프로젝트(로컬 브랜딩)",
    authenticity: "high", authNote: "원조 노포가 주체 — 서사와 실상권이 정합.",
  },
  {
    name: "공주 제민천", region: "충남 공주", stage: "formation",
    theme: "원도심 하천변, 청년이 다시 흐르게 한 물길",
    arc: "쇠락한 원도심 하천 → 제민천 따라 청년 게스트하우스·책방·카페 입주(로컬 리노베이션) → 느린 재생.",
    keywords: ["제민천", "공주원도심", "봉황재", "로컬리노베이션"], anchor: "청년 로컬크리에이터",
    authenticity: "high", authNote: "자생 입점 중심 — 서사·상권 정합.",
  },
  {
    name: "목포 (괜찮아마을)", region: "전남 목포", stage: "formation",
    theme: "청년이 ‘괜찮아’라고 말하며 만든 로컬 실험",
    arc: "빈집 늘던 목포 원도심 → 청년 정착 실험(괜찮아마을) → 게스트하우스·로컬 콘텐츠.",
    keywords: ["괜찮아마을", "목포원도심", "청년마을"], anchor: "청년 정착 프로젝트",
    authenticity: "high", authNote: "공동체 기반 — 상업화 이전 단계.",
  },
  {
    name: "충주 관아골", region: "충북 충주", stage: "formation",
    theme: "관아 옆 구도심 골목의 느린 깨어남",
    arc: "관아공원 주변 쇠락 상권 → 청년몰·로컬 점포 입점 → 원도심 보행 재생 초기.",
    keywords: ["관아골", "충주원도심", "청년몰"], anchor: "청년몰·로컬 점포",
    authenticity: "high", authNote: "초기 형성 — 버즈 태동.",
  },

  // ── ② 확산 ──
  {
    name: "문래동", region: "서울 영등포구", stage: "spread",
    theme: "철공소 위에 내려앉은 예술 — 산업유산이 작업실이 되다",
    arc: "1960s 철공소 밀집 → 2000s 빈 공장에 예술가 작업실(문래창작촌) → 철공소·갤러리·로컬 바가 한 골목에 공존.",
    keywords: ["문래창작촌", "철공소", "작업실", "수제맥주"], anchor: "예술가 작업실·독립 공방",
    authenticity: "high", authNote: "철공소가 실재로 가동 — 서사와 상권이 비교적 정합.",
    caution: "임대료 상승 시 작업실 내몰림이 시작될 수 있다.",
  },
  {
    name: "양양 (죽도·인구)", region: "강원 양양", stage: "spread",
    theme: "서핑이 바꾼 동해 어촌",
    arc: "조용한 어촌 → 죽도·인구해변 서프 스팟화 → 서프 브루어리·해변 카페·서퍼 베이스캠프로 확산.",
    keywords: ["양양서핑", "죽도해변", "브루어리", "서프"], anchor: "서핑 신·브루어리",
    authenticity: "mid", authNote: "계절·관광 의존 — 비수기 변동 큼.",
  },
  {
    name: "망원동", region: "서울 마포구", stage: "spread",
    theme: "시장과 카페가 공존하는 망리단길",
    arc: "망원시장+주택가 → 망리단길 카페·소품숍 → ‘생활밀착 힙’으로 정착.",
    keywords: ["망원동", "망리단길", "망원시장"], anchor: "망원시장·소품숍",
    authenticity: "mid", authNote: "생활상권 기반 — 급변보다 점진.",
  },
  {
    name: "부산 영도", region: "부산 영도구", stage: "spread",
    theme: "조선소 도시의 창고가 바다 뷰 카페로",
    arc: "조선소·물양장 창고 → 흰여울문화마을·봉래동 카페창고 → 바다 뷰 로컬 상권.",
    keywords: ["영도", "흰여울문화마을", "봉래동", "카페창고"], anchor: "창고 개조 카페",
    authenticity: "mid", authNote: "관광 비중 상승 — 주민 생활과 분리 주의.",
  },
  {
    name: "수원 행궁동", region: "경기 수원", stage: "spread",
    theme: "행궁 옆 공방·카페 골목, 행리단길",
    arc: "화성행궁 주변 원도심 → 한옥·적산가옥 개조 공방·카페(행리단길) → 보행 관광 상권.",
    keywords: ["행궁동", "행리단길", "공방", "화성행궁"], anchor: "공방·카페·한옥",
    authenticity: "mid", authNote: "문화재 보존과 상업화 균형 과제.",
  },

  // ── ③ 절정 ──
  {
    name: "연희동", region: "서울 서대문구", stage: "peak",
    theme: "조용한 주택가의 느린 힙 — 골목 사이 책방과 베이커리",
    arc: "고급 주택가 → 사러가 골목·독립서점·소형 출판·베이커리 → 한적한 미식·문화 동네로 무르익음.",
    keywords: ["연희동", "사러가골목", "독립서점", "베이커리"], anchor: "노포·책방·베이커리",
    authenticity: "high", authNote: "주거 기반이라 급변이 적고 색이 또렷.",
  },
  {
    name: "을지로 (힙지로)", region: "서울 중구", stage: "peak",
    theme: "공구상가 사이로 숨은 ‘힙지로’",
    arc: "인쇄·공구상가 → 노포 위층의 숨은 바·카페(힙지로) → 야간 경제·MZ 성지로 절정.",
    keywords: ["을지로", "힙지로", "노가리골목", "공구상가"], anchor: "노포 위층 바·카페",
    authenticity: "mid", authNote: "원조 공구상과 신규 상권이 충돌·공존.",
    caution: "재개발 압력 — 노포 멸실 위험.",
  },
  {
    name: "익선동", region: "서울 종로구", stage: "peak",
    theme: "한옥 골목의 레트로 핫플",
    arc: "낡은 한옥 밀집 → 한옥 개조 카페·바 → 레트로 핫플 → 관광 과포화 진입.",
    keywords: ["익선동", "한옥", "레트로"], anchor: "한옥 개조 점포",
    authenticity: "low", authNote: "프랜차이즈·관광 비중↑ — 한옥 정체성과 상업화 괴리.",
    caution: "한옥 보존 vs 상업화 갈등.",
  },

  // ── ④ 젠트리 ──
  {
    name: "성수동", region: "서울 성동구", stage: "gentri",
    theme: "수제화 공장이 ‘팝업의 성지’가 되다",
    arc: "수제화·인쇄 공장 → 2018 카페·편집숍 → 현재 대기업 팝업·플래그십 성지. 임대료가 콘텐츠를 추월하기 시작.",
    keywords: ["성수동", "팝업스토어", "카페거리", "수제화"], anchor: "팝업·플래그십·대형 카페",
    authenticity: "low", authNote: "원조 제작자 잔존하나 임대료 급등 — 서사<자본.",
    caution: "임대료 상승률 > 매출 상승률 — 젠트리 후기 경보.",
  },
  {
    name: "연남동", region: "서울 마포구", stage: "gentri",
    theme: "경의선숲길이 만든 ‘연트럴파크’",
    arc: "조용한 주택가 → 경의선숲길 공원화(2016) → 연트럴파크 카페·맛집 밀집 → 과포화 후 식는 중.",
    keywords: ["연남동", "연트럴파크", "경의선숲길"], anchor: "경의선숲길 공원",
    authenticity: "low", authNote: "검색 관심도 1년 하락 — 과포화 신호.",
    caution: "임대료 고착 + 방문 둔화 → 공실 전환 주의.",
  },
  {
    name: "한남동", region: "서울 용산구", stage: "gentri",
    theme: "이태원 옆 고급 미식·갤러리 벨트",
    arc: "주택·대사관가 → 갤러리·편집숍·파인다이닝 → 최상위 임대료의 고급 상권.",
    keywords: ["한남동", "갤러리", "파인다이닝", "꼼데가르송길"], anchor: "갤러리·플래그십",
    authenticity: "low", authNote: "자본 주도 — 진입장벽 최상위.",
    caution: "임대료 최상위 — 소상공인 진입 곤란.",
  },

  // ── ⑤ 쇠퇴 ──
  {
    name: "가로수길", region: "서울 강남구", stage: "decline",
    theme: "패션 1번지에서 ‘공실의 거리’로",
    arc: "2000s 디자이너 편집숍 패션 1번지 → 임대료 급등(2016~) → 창작자·편집숍 내몰림 → 공실 폭증.",
    keywords: ["가로수길", "세로수길", "공실", "역티핑"], anchor: "(이탈) 편집숍",
    authenticity: "low", authNote: "콘텐츠가 빠진 자리 — 서사 소멸.",
    caution: "임대료 하방경직 → 공실 장기화 (역티핑 완료 사례).",
  },
];

/** 동/지역명 → 큐레이션 내러티브 (부분 일치). 핫지역만 매칭, 없으면 null. */
export function getAreaNarrative(name?: string | null): AreaNarrative | null {
  if (!name) return null;
  const q = name.replace(/\s/g, "");
  return (
    AREA_NARRATIVES.find((a) => {
      const an = a.name.replace(/\s|\(.*\)/g, "");
      return q.includes(an) || an.includes(q) || a.keywords.some((k) => q.includes(k));
    }) ?? null
  );
}

// 큐레이션 핫지역 → 실제 행정동 코드(adm_cd2). 지도(choropleth)·동 리포트(/place)와 같은 키로 연결.
// (geojson admdong.simplified에서 추출. 일부 지역은 여러 행정동에 걸침.)
export const NARRATIVE_ADMCD: Record<string, string[]> = {
  "인천 개항로": ["2811061500", "2811053000"], // 개항동·신포동
  "공주 제민천": ["4415051000", "4415056000"], // 중학동·옥룡동
  "목포 (괜찮아마을)": ["4611059500", "4611066000"], // 목원동·유달동
  "충주 관아골": ["4313051500"], // 성내·충인동
  문래동: ["1156060500"],
  "양양 (죽도·인구)": ["5183034000"], // 현남면
  망원동: ["1144069000", "1144070000"], // 망원1·2동
  "부산 영도": ["2620055000", "2620059000"], // 영선2동·봉래1동
  "수원 행궁동": ["4111574000"],
  연희동: ["1141061500"],
  "을지로 (힙지로)": ["1114060500"], // 을지로동
  익선동: ["1111061500"], // 종로1·2·3·4가동
  성수동: ["1120065000", "1120066000", "1120067000", "1120069000"],
  연남동: ["1144071000"],
  한남동: ["1117068500"],
  가로수길: ["1168051000"], // 신사동
};

// adm_cd2 → AreaNarrative 역인덱스(O(1)).
const _byAdmCd: Record<string, AreaNarrative> = {};
for (const a of AREA_NARRATIVES) {
  for (const c of NARRATIVE_ADMCD[a.name] ?? []) _byAdmCd[c] = a;
}

/** 행정동 코드(adm_cd2) → 큐레이션 내러티브. 핫지역 행정동만 매칭, 없으면 null. */
export function narrativeForPlace(admCd2?: string | null): AreaNarrative | null {
  return admCd2 ? _byAdmCd[admCd2] ?? null : null;
}

/** 핫지역명 → 대표 행정동 코드(첫 번째). 쇼케이스 → /place 딥링크용. */
export function narrativePrimaryAdmCd(name: string): string | null {
  return NARRATIVE_ADMCD[name]?.[0] ?? null;
}

/** 큐레이션과 연결된 모든 행정동 코드 Set (지도 강조용). */
export const NARRATIVE_ADMCD_SET = new Set(Object.values(NARRATIVE_ADMCD).flat());
