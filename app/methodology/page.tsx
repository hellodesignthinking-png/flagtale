import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { Panel, Pill, SectionHead } from "@/components/ui";
import { MethodologyFlow } from "@/components/diagram/MethodologyFlow";
import { DerivedDiagrams } from "@/components/methodology/DerivedDiagrams";

export const metadata: Metadata = { title: "데이터 방법론 — 어떻게 정리되나" };

const LIFECYCLE = [
  { n: "①", t: "형성", d: "저임대 유휴공간 + 로컬크리에이터의 고유 콘텐츠", ex: "문래 철공소·예술촌" },
  { n: "②", t: "확산", d: "입소문(검색·기사↑) → 유동인구 → 가게·다양성↑", ex: "성수 2018~" },
  { n: "③", t: "절정", d: "‘핫플’ 인증 → 임대료 급등 + 프랜차이즈 진입", ex: "성수 현재" },
  { n: "④", t: "젠트리", d: "임대료 상승률 > 매출 상승률 → 창작자 내몰림", ex: "가로수길 2016~" },
  { n: "⑤", t: "쇠퇴", d: "임대료 하방경직 + 유동인구 이탈 → 공실 폭증", ex: "가로수길 현재" },
];

const SOURCES = [
  { metric: "행정동 경계", src: "vuski/admdongkor", unit: "행정동 3,554", how: "전국 폴리곤. 기준키 adm_cd2.", real: true },
  { metric: "인구·세대수", src: "통계청 KOSIS", unit: "시군구·연 2016~25", how: "총인구+세대수. adm_cd2 앞5=시군구 매칭.", real: true },
  { metric: "검색 관심도", src: "네이버 DataLab", unit: "동·월", how: "검색어트렌드 3년. 정점후 하락=라이프사이클 신호.", real: true },
  { metric: "미디어 센티먼트", src: "네이버 뉴스", unit: "동·실시간", how: "기사 긍정(+)/부정(−) 분류 → (긍−부)/표본. D4에 가감.", real: true },
  { metric: "골목상권 점포", src: "소상공인진흥공단", unit: "반경 500m", how: "업종 다양성·음식카페·프랜차이즈 비율 → 개성 vs 획일화.", real: true },
  { metric: "임대료·공실률", src: "한국부동산원", unit: "상권·분기 2013~", how: "임대가격지수+공실률. 동/시군구명으로 상권 매칭(시도 제약).", real: true },
  { metric: "상권 매출", src: "서울 우리마을가게", unit: "행정동·분기", how: "업종 합산 매출. 임대료와 rent-to-revenue 발산. 서울.", real: true },
  { metric: "유동인구", src: "서울 생활인구", unit: "행정동·시간대", how: "24시간 → 주간/야간/균형 상권. 서울.", real: true },
  { metric: "문화 활력", src: "한국문화정보원", unit: "시군구", how: "공연·전시·축제 수·분야. 문화 행사 밀도.", real: true },
  { metric: "앵커 점포", src: "네이버 지역검색+블로그", unit: "반경 1km", how: "점포별 블로그 회자도 → 버즈 견인 점포. 거리·핀.", real: true },
  { metric: "지오코딩·지번", src: "VWorld", unit: "필지", how: "주소→좌표→PIP→실제 행정동. 클릭 지점 실제 지번.", real: true },
  { metric: "공공예산", src: "조달청 나라장터", unit: "동·연", how: "공공조달 유입. *현재 샘플.", real: false },
  { metric: "KLAI 4축 점수", src: "(산식 미연동)", unit: "동·분기", how: "*현재 난수 샘플. 보정점수가 현실 반영.", real: false },
];

export default function MethodologyPage() {
  return (
    <PageShell>
      <div className="mb-6">
        <span className="klai-eyebrow">Methodology</span>
        <h1 className="mt-1 text-3xl font-black">데이터는 어떻게 정리되나</h1>
        <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-muted">
          이 플랫폼은 <b className="text-ink">골목상권의 흐름(활성화·쇠퇴)</b>을 13개 실데이터로 진단합니다. 한 동네가
          <b className="text-ink"> 왜 살아나고 왜 죽는가</b>를 라이프사이클·동인·산식으로 풀어, 각 데이터의 출처·계산을 투명하게 정리했습니다.
        </p>
      </div>

      {/* 라이프사이클 곡선 */}
      <Panel className="mb-5">
        <SectionHead no="모델" title="동네는 5단계로 살고 죽는다" desc="형성 → 절정 → 쇠퇴 곡선" />
        <LifecycleCurve />
        <div className="mt-3 grid gap-2 sm:grid-cols-5">
          {LIFECYCLE.map((s) => (
            <div key={s.t} className="rounded-xl border border-line bg-card2/40 p-3">
              <div className="text-[13px] font-extrabold text-ink">{s.n} {s.t}</div>
              <div className="mt-1 text-[11px] leading-snug text-muted">{s.d}</div>
              <div className="mt-1.5 text-[10px] text-muted2">{s.ex}</div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-muted2">
          🟢 살리는 힘 = <b className="text-muted">고유 콘텐츠 × 지속가능한 임대료</b> · 🔴 죽이는 힘 = <b className="text-muted">임대료가 콘텐츠를 내모는 속도</b> + 임대료–매출 괴리
        </p>
      </Panel>

      {/* 데이터 파이프라인 */}
      <Panel className="mb-5">
        <SectionHead no="흐름" title="데이터 파이프라인" desc="원천 → 정제 → 합성 → 진단" />
        <MethodologyFlow />
      </Panel>

      {/* 데이터 소스 표 */}
      <Panel className="mb-5 overflow-hidden p-0">
        <div className="border-b border-line p-5 pb-3">
          <SectionHead no="데이터" title="무엇을 · 어디서 · 어떻게 계산하나" desc="실데이터 13종" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-line bg-card2/50 text-[11px] text-muted2">
                <th className="px-4 py-2.5 font-semibold">지표</th>
                <th className="px-3 py-2.5 font-semibold">출처</th>
                <th className="px-3 py-2.5 font-semibold">단위</th>
                <th className="px-3 py-2.5 font-semibold">정리 방식</th>
              </tr>
            </thead>
            <tbody>
              {SOURCES.map((s) => (
                <tr key={s.metric} className="border-b border-line/50 align-top">
                  <td className="px-4 py-3">
                    <div className="font-bold text-ink">{s.metric}</div>
                    <div className="mt-1">{s.real ? <Pill tone="blue">실데이터</Pill> : <Pill tone="amber">샘플</Pill>}</div>
                  </td>
                  <td className="px-3 py-3 text-muted">{s.src}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-muted2">{s.unit}</td>
                  <td className="px-3 py-3 text-[11.5px] leading-relaxed text-muted">{s.how}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* 파생 지표 — 시간 흐름 애니메이션 */}
      <Panel className="mb-5">
        <SectionHead no="산식" title="실데이터로 만드는 파생 지표" desc="합성 · 보정 · 동인 · 발산 — ▶ 2016→2026 흐름 재생" />
        <DerivedDiagrams />
      </Panel>

      {/* 한계·윤리 */}
      <Panel className="mb-5">
        <SectionHead no="한계" title="투명성 · 데이터 윤리" />
        <ul className="space-y-1.5 text-[12.5px] leading-relaxed text-muted">
          <li>• <b className="text-ink">KLAI 4축 점수·신호는 현재 난수 샘플</b>(‘예시’ 배지). 진단의 <b className="text-ink">실측 보정 점수</b>가 현실을 반영합니다.</li>
          <li>• 인구·임대·매출 일부는 <b className="text-ink">시군구/상권 단위</b>(동 미세분) — 라벨에 단위 명시.</li>
          <li>• 매출·유동인구는 <b className="text-ink">서울만</b>. 비서울은 graceful 처리.</li>
          <li>• 지도는 전국 일괄 샘플, <b className="text-ink">진단(동 조회)만 온디맨드 실데이터</b>.</li>
          <li>• 개별 점포·개인은 <b className="text-ink">집계만</b>. 낙인이 투기 신호로 악용되지 않게 처방 중심.</li>
        </ul>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4 text-[13px]">
          <Link href="/data" className="rounded-lg border border-line px-3 py-1.5 font-semibold text-ink hover:bg-card2">데이터 출처·연동 상태 →</Link>
          <Link href="/diagnose" className="rounded-lg bg-amber px-3 py-1.5 font-bold text-[#1a1206] hover:bg-[#e0951f]">진단 리포트 보기 →</Link>
        </div>
      </Panel>
    </PageShell>
  );
}

// ── 라이프사이클 곡선 ──────────────────────────────────────────
function LifecycleCurve() {
  const pts = [
    { x: 95, y: 168, t: "① 형성" },
    { x: 215, y: 98, t: "② 확산" },
    { x: 360, y: 52, t: "③ 절정" },
    { x: 505, y: 95, t: "④ 젠트리" },
    { x: 640, y: 160, t: "⑤ 쇠퇴" },
  ];
  const curve = "M 55 180 C 130 180, 165 108, 215 98 C 275 86, 320 52, 360 52 C 410 52, 462 76, 505 95 C 562 120, 612 158, 665 168";
  return (
    <svg viewBox="0 0 720 215" className="w-full" role="img" aria-label="동네 라이프사이클 곡선">
      <defs>
        <linearGradient id="lcStroke" x1="0" x2="1">
          <stop offset="0%" stopColor="var(--green)" />
          <stop offset="50%" stopColor="var(--amber)" />
          <stop offset="100%" stopColor="var(--warn)" />
        </linearGradient>
        <linearGradient id="lcFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--amber)" stopOpacity="0.16" />
          <stop offset="100%" stopColor="var(--amber)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="40" y1="186" x2="690" y2="186" stroke="var(--line)" />
      <text x="44" y="30" fontSize="10.5" fill="var(--muted2)">활력·매력</text>
      <text x="648" y="205" fontSize="10.5" fill="var(--muted2)">시간 →</text>
      <path d={`${curve} L 665 186 L 55 186 Z`} fill="url(#lcFill)" />
      <path id="lcPath" d={curve} fill="none" stroke="url(#lcStroke)" strokeWidth="3" strokeLinecap="round" />
      {pts.map((p) => (
        <g key={p.t}>
          <circle cx={p.x} cy={p.y} r="5" fill="var(--navy)" stroke="var(--ink)" strokeWidth="2" />
          <text x={p.x} y={p.y - 12} textAnchor="middle" fontSize="11" fontWeight={700} fill="var(--ink)">{p.t}</text>
        </g>
      ))}
      {/* 시간을 따라 곡선 위를 이동하는 현재 시점 */}
      <circle r="6.5" fill="var(--amber)" stroke="#fff" strokeWidth="1.5" style={{ filter: "drop-shadow(0 0 9px var(--amber))" }}>
        <animateMotion dur="9s" repeatCount="indefinite" calcMode="linear">
          <mpath href="#lcPath" />
        </animateMotion>
      </circle>
    </svg>
  );
}
