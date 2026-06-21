// 뉴스·블로그로 화제가 되는 '뜨는 로컬 동네' 에디토리얼 큐레이션.
// 가짜 기사 날조 없이, 널리 알려진 공개 맥락 + 실제 네이버 뉴스/블로그 검색 링크로 연결.
// 실시간 뉴스 지표(네이버·BIG KINDS)는 Phase 5 파이프라인.

interface Local {
  name: string;
  region: string;
  cat: "gentri" | "creator" | "art" | "tour";
  blurb: string;
  tags: string[];
  query: string;
}

const CATS: Record<Local["cat"], { label: string; c: string; on: string }> = {
  gentri: { label: "핫플·젠트리", c: "var(--amber)", on: "var(--on-accent)" },
  creator: { label: "로컬크리에이터", c: "#16a34a", on: "#fff" },
  art: { label: "예술·메이커", c: "#1E5FA8", on: "#fff" },
  tour: { label: "관광·라이프", c: "#0F6E5C", on: "#fff" },
};

const LOCALS: Local[] = [
  { name: "성수동", region: "서울 성동구", cat: "gentri", blurb: "수제화거리에서 카페·쇼룸·브랜드 팝업의 성지로. 크리에이티브 기업이 몰리는 서울 대표 상승 상권.", tags: ["팝업스토어", "카페", "쇼룸"], query: "성수동 팝업 상권" },
  { name: "연남동", region: "서울 마포구", cat: "gentri", blurb: "‘연트럴파크’ 경의선숲길을 따라 골목 카페·소품숍·다이닝이 빼곡. 홍대 상권의 확장.", tags: ["경의선숲길", "골목상권", "카페"], query: "연남동 연트럴파크" },
  { name: "연희동", region: "서울 서대문구", cat: "gentri", blurb: "조용한 주택가가 베이커리·와인바·다이닝 거리로. 한적함과 미식이 공존하는 동네.", tags: ["베이커리", "다이닝", "주택가"], query: "연희동 맛집 베이커리" },
  { name: "문래동", region: "서울 영등포구", cat: "art", blurb: "철공소 골목에 예술가 작업실이 들어선 문래창작촌. 산업유산 + 예술 + 로컬 바.", tags: ["문래창작촌", "철공소", "작업실"], query: "문래동 창작촌 예술" },
  { name: "을지로", region: "서울 중구", cat: "gentri", blurb: "‘힙지로’—노포·인쇄골목 사이로 숨은 바·카페. 레트로와 로컬의 재발견.", tags: ["힙지로", "노포", "숨은바"], query: "을지로 힙지로" },
  { name: "수원 행궁동", region: "경기 수원", cat: "creator", blurb: "행궁 옆 ‘행리단길’. 한옥·근대건물을 고친 로컬 카페·공방이 청년 창업 거점.", tags: ["행리단길", "로컬창업", "공방"], query: "수원 행궁동 행리단길" },
  { name: "공주 제민천", region: "충남 공주", cat: "creator", blurb: "원도심 하천 제민천을 따라 청년 가게·게스트하우스가 재생. 로컬 리노베이션의 모델.", tags: ["원도심재생", "청년가게", "하천변"], query: "공주 제민천 원도심" },
  { name: "목포 청년마을", region: "전남 목포", cat: "creator", blurb: "‘괜찮아마을’ 등 청년마을이 원도심 빈집을 살린 로컬 실험. 한 달 살기·창업으로 화제.", tags: ["청년마을", "괜찮아마을", "한달살기"], query: "목포 청년마을 괜찮아마을" },
  { name: "세종 조치원", region: "세종", cat: "creator", blurb: "행정도시 배후의 조치원 일대에서 청년 창업·로컬 콘텐츠가 늘며 새 거점으로.", tags: ["청년창업", "조치원", "로컬콘텐츠"], query: "세종 조치원 로컬크리에이터" },
  { name: "강릉 명주동", region: "강원 강릉", cat: "creator", blurb: "근대 골목 명주동에 로컬 카페·문화공간이 자리. 관광 강릉의 ‘로컬’ 축.", tags: ["근대골목", "로컬카페", "문화공간"], query: "강릉 명주동" },
  { name: "양양", region: "강원 양양", cat: "tour", blurb: "서피비치를 중심으로 서핑·로컬 펍·세컨하우스. 동해안 라이프스타일 성지.", tags: ["서핑", "서피비치", "동해안"], query: "양양 서피비치 서핑" },
  { name: "제주 구좌·한림", region: "제주", cat: "tour", blurb: "이주 창업과 로컬 상점이 몰린 동부·서부 마을. 카페·공방·로컬푸드.", tags: ["이주창업", "로컬상점", "카페"], query: "제주 구좌 한림 로컬" },
];

function naver(where: "news" | "blog", query: string) {
  return `https://search.naver.com/search.naver?where=${where}&query=${encodeURIComponent(query)}`;
}

export function TrendingLocals() {
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <span className="klai-eyebrow">News · Blog Buzz</span>
          <h2 className="mt-1 text-[1.4rem] font-extrabold tracking-tight sm:text-[1.7rem]">📰 지금 뜨는 <span className="hl-mark">로컬 동네</span></h2>
        </div>
        <span className="klai-tag">에디토리얼 큐레이션 · 실제 뉴스·블로그 링크</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LOCALS.map((l) => {
          const cat = CATS[l.cat];
          return (
            <article key={l.name} className="lift flex flex-col rounded-2xl border border-line bg-card2/40 p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full px-2.5 py-1 text-[11px] font-extrabold" style={{ background: cat.c, color: cat.on }}>{cat.label}</span>
                <span className="text-[11.5px] font-semibold text-muted2">{l.region}</span>
              </div>
              <h3 className="mt-2.5 text-[19px] font-extrabold text-ink">{l.name}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{l.blurb}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {l.tags.map((t) => (
                  <span key={t} className="rounded-full bg-navy/40 px-2 py-0.5 text-[11px] font-semibold text-muted2">#{t}</span>
                ))}
              </div>
              <div className="mt-auto flex items-center gap-3 pt-4 text-[12.5px] font-bold">
                <a href={naver("news", l.query)} target="_blank" rel="noopener noreferrer" className="text-blue-l hover:underline">📰 뉴스</a>
                <a href={naver("blog", l.query)} target="_blank" rel="noopener noreferrer" className="text-blue-l hover:underline">✍️ 블로그</a>
                <span className="ml-auto text-[11px] text-muted2">네이버 검색 →</span>
              </div>
            </article>
          );
        })}
      </div>
      <p className="mt-4 text-center text-[11.5px] text-muted2">널리 알려진 공개 맥락 기반 큐레이션 · 실시간 뉴스·버즈 지표 연동(네이버·BIG KINDS)은 Phase 5</p>
    </div>
  );
}
