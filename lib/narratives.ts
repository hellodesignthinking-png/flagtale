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

  // ── 전국 확장 — 추가 핫지역(라이프사이클 순) ──
  // 형성
  {
    name: "군산 원도심", region: "전북 군산", stage: "formation",
    theme: "근대 항구도시의 적산가옥이 깨어나다",
    arc: "일제강점기 무역항 → 쇠락한 원도심 적산가옥·창고 → 근대문화유산·말랭이마을 재생.",
    keywords: ["군산원도심", "근대건축", "말랭이마을", "적산가옥"], anchor: "근대문화유산·청년몰",
    authenticity: "high", authNote: "근대 건축 원형이 주체 — 서사·실상권 정합.",
  },
  {
    name: "제주 (산지천)", region: "제주 제주시", stage: "formation",
    theme: "버려진 포구 원도심에 다시 켜진 불",
    arc: "쇠락한 산지천·탑동 원도심 → 로컬 책방·카페·게스트하우스 입점 → 원도심 재생 초기.",
    keywords: ["제주원도심", "산지천", "탑동", "로컬"], anchor: "로컬 크리에이터·도시재생",
    authenticity: "high", authNote: "자생 입점 초기 — 상업화 이전.",
  },
  {
    name: "인천 배다리", region: "인천 동구", stage: "formation",
    theme: "헌책방 골목이 지킨 동네의 시간",
    arc: "쇠락한 배다리 헌책방거리 → 주민·예술가가 재개발 막고 문화공간화 → 느린 문화재생.",
    keywords: ["배다리", "헌책방거리", "문화재생", "금창동"], anchor: "헌책방·주민 공동체",
    authenticity: "high", authNote: "주민 주도 — 상업화 경계.",
  },
  // 확산
  {
    name: "광주 양림동", region: "광주 남구", stage: "spread",
    theme: "선교사 사택과 펭귄마을이 만든 근대 골목",
    arc: "근대 선교·한옥의 양림동 → 근대역사문화마을·펭귄마을 → 카페·공방 확산.",
    keywords: ["양림동", "펭귄마을", "근대역사", "광주"], anchor: "근대문화유산·펭귄마을",
    authenticity: "mid", authNote: "관광·생활 혼재 — 상승 압력.",
  },
  {
    name: "대전 소제동", region: "대전 동구", stage: "spread",
    theme: "철도관사촌이 카페거리가 되다",
    arc: "대전역 뒤 철도관사촌 → 빈 관사에 카페·식당(소제동 카페거리) → 빠른 확산.",
    keywords: ["소제동", "철도관사촌", "카페거리", "대전역"], anchor: "관사 개조 카페",
    authenticity: "mid", authNote: "원형 보존 vs 상업화 속도 — 주의.",
    caution: "재개발·임대료 상승 압력.",
  },
  {
    name: "광주 동명동", region: "광주 동구", stage: "spread",
    theme: "법원 떠난 자리, 동리단길의 밤",
    arc: "법원·검찰청 이전 후 한적 주택가 → 카페·맛집·바(동리단길) → 광주 핫플 확산.",
    keywords: ["동명동", "동리단길", "카페골목", "광주"], anchor: "카페·다이닝",
    authenticity: "mid", authNote: "주거지 상업화 빠름 — 상승 압력.",
  },
  {
    name: "부산 전포", region: "부산 부산진구", stage: "spread",
    theme: "공구상가 골목에 스며든 카페",
    arc: "전포 공구상가 → 빈 점포에 카페·로스터리(전포카페거리) → 해외 매체 주목 후 확산.",
    keywords: ["전포카페거리", "전포동", "로스터리", "서면"], anchor: "로스터리·카페",
    authenticity: "mid", authNote: "공구상과 카페 공존 — 임대료 상승.",
    caution: "임대료 상승 시 원조 공구상 내몰림.",
  },
  {
    name: "신당동", region: "서울 중구", stage: "spread",
    theme: "떡볶이타운 위층에 모인 젊은 가게들",
    arc: "신당동 떡볶이타운·중앙시장 → 노포 사이 신상 바·카페(신당 힙) → 레트로 핫플 확산.",
    keywords: ["신당동", "신당힙", "중앙시장", "떡볶이타운"], anchor: "노포·신상 바",
    authenticity: "mid", authNote: "시장 생활상권 기반 — 점진 확산.",
  },
  {
    name: "강릉 명주동", region: "강원 강릉", stage: "spread",
    theme: "원도심 골목이 커피로 다시 흐르다",
    arc: "쇠락한 강릉 원도심 명주동 → 로컬 카페·문화공간(봉봉방앗간 등) → 원도심 재생 확산.",
    keywords: ["명주동", "강릉원도심", "커피", "봉봉방앗간"], anchor: "로컬 카페·문화공간",
    authenticity: "high", authNote: "자생 문화공간 중심 — 서사·상권 정합.",
  },
  // 절정
  {
    name: "경주 황리단길", region: "경북 경주", stage: "peak",
    theme: "천년 고도 한옥 골목의 절정",
    arc: "대릉원 옆 한옥 주택가 → 한옥 개조 카페·숍(황리단길) → 경주 대표 관광상권 절정.",
    keywords: ["황리단길", "경주", "대릉원", "한옥"], anchor: "한옥 개조 점포",
    authenticity: "low", authNote: "프랜차이즈·관광 비중↑ — 한옥 정체성과 괴리.",
    caution: "임대료 급등·획일화 우려.",
  },
  {
    name: "대구 김광석길", region: "대구 중구", stage: "peak",
    theme: "방천시장 옆, 노래로 남은 골목",
    arc: "쇠락한 방천시장 → ‘김광석 다시 그리기 길’ 벽화 → 관광상권 절정.",
    keywords: ["김광석길", "방천시장", "대봉동", "벽화"], anchor: "벽화거리·시장",
    authenticity: "mid", authNote: "관광 의존↑ — 시장 생활성과 분리 주의.",
  },
  {
    name: "서촌", region: "서울 종로구", stage: "peak",
    theme: "경복궁 옆, 조용히 무르익은 한옥 동네",
    arc: "한옥 주택가 서촌 → 통인시장·갤러리·책방·노포 → 한적한 미식·문화 동네로 절정.",
    keywords: ["서촌", "통인시장", "청운효자동", "갤러리"], anchor: "노포·갤러리·책방",
    authenticity: "high", authNote: "주거·문화 기반 — 색이 또렷.",
    caution: "한옥 보존 vs 상업화 갈등.",
  },
  {
    name: "통영 동피랑", region: "경남 통영", stage: "peak",
    theme: "벼랑 위 벽화가 살린 바다 마을",
    arc: "철거 예정 달동네 동피랑 → 벽화마을 운동으로 보존 → 통영 대표 관광지 절정.",
    keywords: ["동피랑", "벽화마을", "통영", "강구안"], anchor: "벽화·중앙시장",
    authenticity: "mid", authNote: "관광 과포화 — 주민 생활 침해 주의.",
    caution: "오버투어리즘 — 주민 피로.",
  },
  {
    name: "송리단길", region: "서울 송파구", stage: "peak",
    theme: "석촌호수가 키운 골목 미식",
    arc: "잠실 석촌호수변 주택가 → 송리단길 카페·다이닝 → 잠실 배후 핫플 절정.",
    keywords: ["송리단길", "석촌호수", "삼전동", "잠실"], anchor: "다이닝·카페",
    authenticity: "mid", authNote: "배후수요 탄탄 — 상승 후 안정.",
  },
  // 젠트리
  {
    name: "북촌 한옥마을", region: "서울 종로구", stage: "gentri",
    theme: "한옥의 결을 덮어버린 관광 인파",
    arc: "북촌 한옥 주거지 → 한옥 카페·게스트하우스 → 관광 과포화·주민 갈등(투어 제한).",
    keywords: ["북촌한옥마을", "가회동", "한옥", "오버투어리즘"], anchor: "한옥 관광",
    authenticity: "low", authNote: "관광 자본 주도 — 주거 정체성과 괴리.",
    caution: "주민 이탈·생활권 침해 — 관광 총량 논의.",
  },
  {
    name: "전주 한옥마을", region: "전북 전주", stage: "gentri",
    theme: "한옥의 외피만 남은 관광 1번지",
    arc: "풍남동 한옥 주거지 → 한옥 개조 상업화 → 꼬치·프랜차이즈 과포화, 주민 내몰림.",
    keywords: ["전주한옥마을", "풍남동", "한옥", "경기전"], anchor: "한옥 개조 상점",
    authenticity: "low", authNote: "관광 자본>주거 — 진정성 괴리 심화.",
    caution: "획일화·주민 내몰림 — 한옥 공실 조짐.",
  },
  {
    name: "해방촌", region: "서울 용산구", stage: "gentri",
    theme: "남산 아래 신흥시장의 두 얼굴",
    arc: "실향민 정착촌 해방촌 → 신흥시장·루프탑 카페(해방촌 힙) → 임대료 급등·젠트리.",
    keywords: ["해방촌", "신흥시장", "용산2가동", "루프탑"], anchor: "신흥시장·루프탑",
    authenticity: "low", authNote: "임대료 상승률>매출 — 젠트리 진행.",
    caution: "원주민·예술가 내몰림.",
  },
  // 쇠퇴
  {
    name: "경리단길", region: "서울 용산구", stage: "decline",
    theme: "가장 빨리 뜨고 가장 빨리 식은 길",
    arc: "이태원 경리단길 핫플(2010s) → 임대료 급등 → 임차인 이탈·공실 급증(역티핑).",
    keywords: ["경리단길", "이태원", "공실", "역티핑"], anchor: "(이탈) 맛집·바",
    authenticity: "low", authNote: "콘텐츠 이탈 — 서사 소멸.",
    caution: "임대료 하방경직 → 공실 장기화 (역티핑 사례).",
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
  // 전국 확장
  "군산 원도심": ["5213053000"], // 월명동
  "제주 (산지천)": ["5011059000"], // 건입동
  "인천 배다리": ["2814064000"], // 금창동
  "광주 양림동": ["2915551000"],
  "대전 소제동": ["3011051500"], // 중앙동
  "광주 동명동": ["2911054500"],
  "부산 전포": ["2623061000", "2623060000"], // 전포2·1동
  신당동: ["1114061500"],
  "강릉 명주동": ["5115052000"], // 중앙동(명주동 원도심)
  "경주 황리단길": ["4713057000"], // 황남동
  "대구 김광석길": ["2711068000"], // 대봉1동
  서촌: ["1111051500"], // 청운효자동
  "통영 동피랑": ["4822055000"], // 중앙동
  송리단길: ["1171061000"], // 삼전동
  "북촌 한옥마을": ["1111060000"], // 가회동
  "전주 한옥마을": ["5211153000"], // 풍남동
  해방촌: ["1117052000"], // 용산2가동
  경리단길: ["1117065000"], // 이태원1동
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

// 핫지역 대표 좌표(대표 행정동 centroid) — 지도 '날아가기'(디스커버리)용.
export const NARRATIVE_COORD: Record<string, [number, number]> = {
  "인천 개항로": [37.477, 126.6122],
  "공주 제민천": [36.4504, 127.1231],
  "목포 (괜찮아마을)": [34.7942, 126.3834],
  "충주 관아골": [36.972, 127.9324],
  문래동: [37.5168, 126.8925],
  "양양 (죽도·인구)": [37.9423, 128.7428],
  망원동: [37.5545, 126.9024],
  "부산 영도": [35.082, 129.0474],
  "수원 행궁동": [37.2796, 127.0157],
  연희동: [37.5717, 126.9309],
  "을지로 (힙지로)": [37.5661, 126.9961],
  익선동: [37.5771, 126.9896],
  성수동: [37.5417, 127.0413],
  연남동: [37.5635, 126.9226],
  한남동: [37.5396, 127.0056],
  가로수길: [37.5254, 127.022],
  // 전국 확장
  "군산 원도심": [35.9869, 126.712],
  "제주 (산지천)": [33.5168, 126.5418],
  "인천 배다리": [37.4722, 126.6401],
  "광주 양림동": [35.139, 126.9147],
  "대전 소제동": [36.3315, 127.4364],
  "광주 동명동": [35.1518, 126.9237],
  "부산 전포": [35.1633, 129.0729],
  신당동: [37.5647, 127.0139],
  "강릉 명주동": [37.7537, 128.8949],
  "경주 황리단길": [35.8119, 129.1986],
  "대구 김광석길": [35.8599, 128.6057],
  서촌: [37.5842, 126.9704],
  "통영 동피랑": [34.8469, 128.4227],
  송리단길: [37.5014, 127.0934],
  "북촌 한옥마을": [37.5855, 126.9876],
  "전주 한옥마을": [35.814, 127.1572],
  해방촌: [37.5419, 126.9869],
  경리단길: [37.5328, 126.9942],
};

/** 지도 디스커버리용 핫지역 목록 — 라이프사이클 순(형성→쇠퇴), 좌표·대표코드 포함. */
export function narrativeJumpList(): { name: string; stage: LifeStage; theme: string; coord: [number, number]; admCd2: string }[] {
  return AREA_NARRATIVES.filter((a) => NARRATIVE_COORD[a.name] && NARRATIVE_ADMCD[a.name]).map((a) => ({
    name: a.name,
    stage: a.stage,
    theme: a.theme,
    coord: NARRATIVE_COORD[a.name],
    admCd2: NARRATIVE_ADMCD[a.name][0],
  }));
}
