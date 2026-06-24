import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { Panel, Pill, SectionHead } from "@/components/ui";
import { MethodologyFlow } from "@/components/diagram/MethodologyFlow";
import { DerivedDiagrams } from "@/components/methodology/DerivedDiagrams";
import { NarrativeShowcase } from "@/components/methodology/NarrativeShowcase";

export const metadata: Metadata = { title: "통합 방법론 — 지역 운영체제 Place OS" };

// ── SENSE → ACT → LOOP 폐루프 ──
const LOOP = [
  { key: "①", phase: "SENSE", who: "Flagtale Lab · KLAI", q: "어디에 있나 / 어디로 흐르나", d: "수요·시장·인식을 감지. 4축·모멘텀·라이프사이클·유형코드로 진단.", color: "#4d7c0f", icon: "📡" },
  { key: "②", phase: "ACT", who: "TownOS · 활성화", q: "무엇을, 어떻게 살리나", d: "공급·개입·실행. 잠재자산·활성화 플레이·What-if ROI·자원 연계.", color: "#D4861E", icon: "⚙️" },
  { key: "③", phase: "LOOP", who: "재측정 · 효과검증", q: "효과 있었나 → 처방 보정", d: "개입 후 KLAI 재측정 → DiD 순효과 → 처방 가중치 보정 → 다음 사이클.", color: "#1E5FA8", icon: "🔁" },
];

// ── 세 모델 비교 ──
const MODELS = [
  { row: "역할", lab: "진단·측정 (SENSE)", town: "활성화·실행 (ACT)", klaci: "진단 (정책)" },
  { row: "공간 단위", lab: "행정동 3,554", town: "동·생활권·사업지구", klaci: "시군구 229" },
  { row: "시간성", lab: "동적 (모멘텀·실시간)", town: "개입 전후 (시점)", klaci: "정적 (연 1회)" },
  { row: "관점", lab: "매력·흐름·수요", town: "자원·개입·공급", klaci: "자산역량 (정책)" },
  { row: "산출", lab: "점수·등급·진단·경보", town: "처방·시뮬·실행연계", klaci: "110점·유형코드·레이더" },
  { row: "핵심 강점", lab: "해상도·동태·내러티브", town: "실행 OS (공급 연계)", klaci: "유형론·자산=자본+부채" },
];

// ── 라이프사이클 × 활성화 플레이북 (센터피스) ──
const PLAYBOOK = [
  { stage: "① 형성", signal: "저임대·유휴공간, 버즈 태동", asset: "공실·노후·저임대 = 기회", play: "유휴공간↔로컬크리에이터 매칭, 시드 공간 공급(ZeroSite), 고유 콘텐츠 발굴", guard: "과도한 홍보로 단계 건너뛰기 금지", color: "#0F6E5C" },
  { stage: "② 확산", signal: "검색·기사↑, 유동·다양성↑", asset: "초기 앵커·내러티브 = 자산", play: "앵커 점포 보강, 업종 다양성 처방, 내러티브 육성, belocal 연계", guard: "임대료 상승 시작 모니터", color: "#3E9AA8" },
  { stage: "③ 절정", signal: "핫플 인증, 임대료 급등 시작", asset: "높은 인지도 = 양날", play: "선제 임대안정 상생협약, 가치환류 장치, 공공임대상가 확보", guard: "자본 주도 전환 임계 감시", color: "#E2A33A" },
  { stage: "④ 젠트리", signal: "임대료상승>매출, 창작자 내몰림", asset: "남은 원주민·정체성 = 보전대상", play: "원주민·초기상점 보전, 임대-매출 괴리 차단, 단기임대 사각 보완", guard: "개입 늦으면 ⑤로 직행", color: "#D2691E" },
  { stage: "⑤ 쇠퇴", signal: "공실 폭증, 유동 이탈", asset: "빈 공간·낮은 임대 = 재형성 연료", play: "공실 재활용, 구조 개입, 재형성 시드(①로 리셋), 공공 매입·재생", guard: "임대료 하방경직 → 공실 장기화", color: "#A23A2A" },
];

// ── 동네 유형코드 ──
const TYPOLOGY_SLOTS = [
  { slot: "생애단계", opts: "F형성 / S확산 / P절정 / G젠트리 / D쇠퇴" },
  { slot: "주도동인", opts: "L로컬 / P공공 / C자본" },
  { slot: "지속가능성", opts: "S 高 / s 低" },
  { slot: "매력강도", opts: "A 高 / a 低" },
];
const TYPOLOGY_EX = [
  { code: "S-L-S-A", name: "자생 성장형", d: "확산기·로컬주도·지속가능·고매력 → 보전·확산 투자", ex: "성수 일부", c: "var(--green)" },
  { code: "P-C-s-A", name: "과열 위태형", d: "절정기·자본주도·저지속·고매력 → 임대안정 시급", ex: "가로수길化 경보", c: "var(--warn)" },
  { code: "F-L-S-a", name: "잠재 원석형", d: "형성기·로컬주도·지속가능·저매력 → 시드 공간 공급", ex: "문래 초기형", c: "var(--blue-l)" },
  { code: "D-C-s-a", name: "쇠퇴 구조형", d: "쇠퇴기·자본방치·저지속·저매력 → 구조 개입·재형성", ex: "—", c: "var(--muted2)" },
];

// ── KLACI 흡수 3가지 ──
const ABSORB = [
  { n: "①", t: "유형론 — 순위 대신 캐릭터", d: "우열 순위가 아니라 ‘고유 발전경로’를 제시해 비난 없이 기억에 박힌다. → 동네 유형코드를 헤드라인으로. 단, KLAI는 동·동적이라 단계가 이동하면 유형도 변한다(이게 우리 무기)." },
  { n: "②", t: "‘자산 = 자본 + 부채’ 프레임", d: "약점(부채)도 조정·투입하면 차별적 자산. 공실=팝업·앵커 공간, 노후=콘텐츠 소재, 저임대=창작자 유입 기회, 유휴 공공자산=시드 공간. 형성기 동력 그 자체." },
  { n: "③", t: "내발적(endogenous) 활성화", d: "자원이 새어나가는 지점을 막는 것이 투입보다 중요. 외부 자본 주입(=젠트리 유발)보다 로컬 자생동력 우선 + 누수 차단. 자본 주도가 감지되면 가드레일을 먼저." },
];

// ── ACT — 활성화 플레이(개입 메뉴) ──
const PLAYS = ["공간 공급 (ZeroSite 매입임대)", "창작자 매칭 (belocal)", "앵커 유치", "임대안정 상생협약", "공공예산 마중물", "업종 다양성 처방", "공공임대상가"];

// ── 두 모드 ──
const MODES = [
  { mode: "진단 모드", brand: "Flagtale Lab", icon: "🔍", q: "어디로 흐르는가", items: ["전국 지도 · choropleth", "동 리포트 · 유료 지번 진단", "라이프사이클 · 유형코드 · 경보"], c: "#4d7c0f" },
  { mode: "활성화 모드", brand: "TownOS", icon: "⚙️", q: "무엇을 할 것인가", items: ["잠재자산 보드", "활성화 플레이북 · What-if ROI", "자원 매칭 · 실행 추적 대시보드"], c: "#D4861E" },
];

// ── 5단계 SOP (TownOS 거버넌스) ──
const SOP = [
  { n: "01", t: "데이터 수집", d: "공공 API · IoT 센서 · 입주민 OODR 설문", icon: "📡" },
  { n: "02", t: "AI 처리", d: "LLM 분류 · 점수화 · 매칭 · 예측 모델", icon: "🧠" },
  { n: "03", t: "자동 검증", d: "규칙 기반 · Confidence ≥90% · Outlier 탐지", icon: "🔍" },
  { n: "04", t: "사람 검토", d: "9그룹 거버넌스 + 운영장 final 승인", icon: "👥" },
  { n: "05", t: "액션 실행", d: "자동 실행 + N-Rail 로그 + 분기 보고서", icon: "⚡" },
];

// ── 포지셔닝 & BM ──
const POSITION = [
  { row: "한 줄", klaci: "시군구 자산역량 진단", place: "동네를 진단하고 실제로 살리는 운영체제" },
  { row: "타깃", klaci: "지자체·정책·균형발전", place: "지자체+소상공인+창업자+AMC/VC+ZeroSite" },
  { row: "수익", klaci: "리포트·컨설팅", place: "진단 구독 + 유료 지번 진단 + 활성화 실행연계 수수료" },
];

// ── Place OS 반영 로드맵 ──
const ROADMAP = [
  { t: "SENSE↔ACT 라우팅 (동인→플레이) 구현", where: "TownOS 처방 엔진", pri: 3 },
  { t: "라이프사이클 활성화 플레이북 데이터화", where: "TownOS", pri: 3 },
  { t: "동네 유형코드 산출·표기", where: "Flagtale Lab 지도·리포트", pri: 3 },
  { t: "매력×지속 2축 분면 경보", where: "Flagtale Lab", pri: 2 },
  { t: "잠재자산(자본+부채) 보드", where: "TownOS", pri: 2 },
  { t: "What-if ROI · DiD 효과검증", where: "TownOS · LOOP", pri: 2 },
  { t: "두 모드 토글 UX 통합", where: "플랫폼 코어", pri: 2 },
];

// 기존 SENSE(KLAI) 자료
const AXES = [
  { k: "D1", label: "인구·지속성", w: 20, color: "#1E5FA8", desc: "인구 재생산·순유입·연령 균형 (지방소멸위험의 반대 개념)", src: "KOSIS 인구·세대" },
  { k: "D2", label: "경제·상권", w: 30, color: "#0F6E5C", desc: "창업·생존·업종 다양성·매출·임대 경제성·시장 활성도", src: "소진공·부동산원·카드매출" },
  { k: "D3", label: "공간·물리", w: 20, color: "#8b6ef6", desc: "용도 혼합·보행·건물 다양성·접근성·자산가치", src: "공시지가·건축HUB" },
  { k: "D4", label: "인식·감성", w: 30, color: "#D4861E", desc: "검색·미디어 언급·확산·긍정비율 (장소의 ‘이야기’)", src: "네이버 DataLab·뉴스" },
];
const SCORE_STEPS = [
  { t: "정규화", d: "같은 시도 비교군 안에서 Min-Max(0~100)로 환산. 역방향 지표는 반전, 쏠림 지표는 로그 보정." },
  { t: "합성", d: "4축 가중 합성. 상권(D2)·서사(D4)를 30%로 더 크게 — 동네 매력을 더 좌우하는 축." },
  { t: "모멘텀", d: "축별 변화율의 z-점수 합(±). 점수의 ‘방향·속도’ = 뜨는 중인지 식는 중인지." },
  { t: "등급화", d: "S(강한 매력·안정)부터 E(위기)까지 발산 색 스케일로 표기." },
  { t: "실측 보정", d: "샘플(난수) 점수를 네이버 기사·검색·KOSIS 인구 등 실데이터로 보정 → ‘실측 보정 점수’가 현실을 반영." },
];
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
      {/* 히어로 */}
      <div className="mb-6">
        <span className="klai-eyebrow">Place OS · 통합 방법론</span>
        <h1 className="mt-1 font-display text-[clamp(28px,4.4vw,42px)] font-black tracking-[-0.03em]">
          진단하고, <span className="hl-mark">실제로 살린다</span>
        </h1>
        <p className="mt-2 max-w-2xl text-[14.5px] leading-relaxed text-muted">
          <b className="text-ink">Flagtale Lab</b>(KLAI · 매력도 <b className="text-ink">진단</b>)과 <b className="text-ink">TownOS</b>(지역 <b className="text-ink">활성화</b>·실행)를 하나의 <b className="text-ink">폐루프</b>로 묶은 지역 운영체제 — <b className="text-ink">Place OS</b>. 경쟁 지수 KLACI의 강점(유형론·자산=자본+부채)을 흡수해, <b className="text-ink">진단 → 처방 → 재측정</b>의 유일한 닫힌 고리를 만듭니다.
        </p>
      </div>

      {/* §0 폐루프 SENSE → ACT → LOOP */}
      <Panel className="mb-5">
        <SectionHead no="루프" title="진단과 활성화는 한 몸이다" desc="SENSE → ACT → LOOP · 진단이 처방을 호출하고, 처방이 다시 진단을 갱신한다" />
        <div className="grid gap-3 lg:grid-cols-3">
          {LOOP.map((s, i) => (
            <div key={s.phase} className="relative rounded-[20px] border-[1.5px] p-4" style={{ borderColor: `${s.color}55`, background: `${s.color}0f` }}>
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-[12px] text-[18px]" style={{ background: `${s.color}1f` }}>{s.icon}</span>
                <div>
                  <div className="font-display text-[11px] font-extrabold uppercase tracking-[0.18em]" style={{ color: s.color }}>{s.key} {s.phase}</div>
                  <div className="text-[13.5px] font-black tracking-tight text-ink">{s.who}</div>
                </div>
              </div>
              <div className="mt-2.5 text-[12.5px] font-bold text-ink">“{s.q}”</div>
              <p className="mt-1 text-[12px] leading-relaxed text-muted">{s.d}</p>
              {i < LOOP.length - 1 && <span className="absolute -right-2.5 top-1/2 hidden -translate-y-1/2 text-[18px] font-black text-muted2 lg:block">→</span>}
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-[14px] border-[1.5px] border-amber/40 bg-amber/10 px-4 py-3 text-[12.5px] leading-relaxed text-ink">
          🔗 <b>결정적 연결고리</b> — Flagtale Lab은 이미 <b>‘활성화 동인 분해(로컬크리에이터 / 공공예산 / 자본·부동산)’</b>를 진단합니다. <b>이 진단 결과가 곧 TownOS의 처방 입력값</b>입니다.
        </div>
      </Panel>

      {/* §1 세 모델 비교 */}
      <Panel className="mb-5 overflow-hidden p-0">
        <div className="border-b border-line p-5 pb-3">
          <SectionHead no="비교" title="세 모델의 좌표" desc="KLAI(진단) + TownOS(실행) = KLACI가 못 가진 해상도·동태·실행을 모두 가진 폐루프" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-line bg-card2/50 text-[11px] text-muted2">
                <th className="px-4 py-2.5 font-semibold">구분</th>
                <th className="px-3 py-2.5 font-semibold text-blue-l">Flagtale Lab (KLAI)</th>
                <th className="px-3 py-2.5 font-semibold text-amber">TownOS</th>
                <th className="px-3 py-2.5 font-semibold">KLACI (경쟁)</th>
              </tr>
            </thead>
            <tbody>
              {MODELS.map((m) => (
                <tr key={m.row} className="border-b border-line/50 align-top">
                  <td className="whitespace-nowrap px-4 py-2.5 font-bold text-ink">{m.row}</td>
                  <td className="px-3 py-2.5 font-semibold text-ink">{m.lab}</td>
                  <td className="px-3 py-2.5 text-muted">{m.town}</td>
                  <td className="px-3 py-2.5 text-muted2">{m.klaci}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* SENSE — KLAI 정의 */}
      <Panel className="mb-5">
        <SectionHead no="SENSE" title="① 감지 — KLAI란 무엇인가" desc="K-Local Attractiveness Index · 동네가 어디에 있고 어디로 흐르는가" />
        <p className="text-[13px] leading-relaxed text-muted">
          <b className="text-ink">KLAI</b>는 전국 행정동(洞)의 <b className="text-ink">‘동네 매력도·활력’을 0~100 점수와 S~E 등급</b>으로 나타내는 합성 지표입니다. 인구·상권·공간·인식 <b className="text-ink">4개 축</b>을 가중 합성하고, 변화 속도(<b className="text-ink">모멘텀</b>)와 위기(젠트리·소멸·거래절벽)를 함께 진단합니다.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {AXES.map((a) => (
            <div key={a.k} className="rounded-[20px] border-[1.5px] p-3" style={{ borderColor: `${a.color}55`, background: `${a.color}12` }}>
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-extrabold" style={{ color: a.color }}>{a.k} {a.label}</span>
                <span className="text-[12px] font-black" style={{ color: a.color }}>{a.w}%</span>
              </div>
              <div className="mt-1 text-[11px] leading-snug text-muted">{a.desc}</div>
              <div className="mt-1 text-[10px] text-muted2">{a.src}</div>
            </div>
          ))}
        </div>
        <div className="mt-2 rounded-lg border border-line bg-navy/40 px-3 py-2 text-center text-[12.5px] font-semibold text-ink">
          KLAI = 0.20·D1 + 0.30·D2 + 0.20·D3 + 0.30·D4 &nbsp;±&nbsp; 모멘텀(축별 변화율 z-합)
        </div>
        <div className="mt-4">
          <div className="mb-2 text-[12px] font-bold text-ink">어떻게 점수화하나 (5단계)</div>
          <ol className="space-y-1.5">
            {SCORE_STEPS.map((s, i) => (
              <li key={i} className="flex gap-2.5 rounded-lg border border-line bg-card2 px-3 py-2 text-[11.5px]">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-blue/15 text-[11px] font-black text-blue-l">{i + 1}</span>
                <span><b className="text-ink">{s.t}</b> — <span className="text-muted">{s.d}</span></span>
              </li>
            ))}
          </ol>
        </div>
        <div className="mt-4 rounded-[20px] border-[1.5px] border-amber/30 bg-amber/5 p-3.5">
          <div className="mb-1 text-[12px] font-bold text-amber">누가 만들었나 · 근거</div>
          <p className="text-[12px] leading-relaxed text-muted">
            KLAI는 <b className="text-ink">학계 공인 표준이 아니라 이 플랫폼이 정의한 합성 지표</b>입니다(개념검증 MVP · 잠정). 근거 ▸ <b className="text-ink">한국고용정보원 지방소멸위험지수</b>(이상호) ▸ <b className="text-ink">젠트리피케이션 단계 모델</b> ▸ 글래드웰 <b className="text-ink">티핑포인트</b>(소수의 법칙·고착성·맥락의 힘) ▸ 도시·상권 활력 연구 ▸ 야놀자 축제지수·belocal 로컬 데이터. 실데이터 확대 시 <b className="text-ink">SHAP·Granger·토픽모델</b>로 정밀화됩니다.
          </p>
        </div>
        <p className="mt-3 text-[11.5px] leading-relaxed text-muted2">
          ⚠ 현재 지도의 4축 점수는 <b className="text-muted">난수 샘플(잠정)</b>, 동·매장 진단의 <b className="text-muted">‘실측 보정 점수’</b>가 네이버·KOSIS·소진공 실데이터를 반영합니다. 모든 산출물에 <Pill tone="amber">잠정</Pill> 배지와 커버리지를 노출합니다.
        </p>
      </Panel>

      {/* 라이프사이클 곡선 */}
      <Panel className="mb-5">
        <SectionHead no="모델" title="동네는 5단계로 살고 죽는다" desc="형성 → 절정 → 쇠퇴 곡선 · 이 단계가 처방을 결정한다" />
        <LifecycleCurve />
        <div className="mt-3 grid gap-2 sm:grid-cols-5">
          {LIFECYCLE.map((s) => (
            <div key={s.t} className="rounded-[20px] border-[1.5px] border-line bg-card2/40 p-3">
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

      {/* 내러티브 — 실제 핫지역에 적용 (검증) */}
      <Panel className="mb-5">
        <SectionHead no="내러티브" title="실제 핫지역에 적용한 내러티브" desc="문래·연희·성수·연남… 핫지역의 ‘이야기’를 5단계 라이프사이클에 매핑 — 단계를 눌러 확인" />
        <NarrativeShowcase />
      </Panel>

      {/* §5 ★ 라이프사이클 × 활성화 플레이북 (센터피스) */}
      <Panel className="mb-5 overflow-hidden p-0">
        <div className="border-b border-line p-5 pb-3">
          <SectionHead no="ACT ★" title="라이프사이클 × 활성화 플레이북" desc="진단 신호 → 잠재자산(자본+부채) → TownOS 처방 → 가드레일 · 진단이 처방을 호출하는 핵심 매트릭스" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-[12px]">
            <thead>
              <tr className="border-b border-line bg-card2/50 text-[11px] text-muted2">
                <th className="px-4 py-2.5 font-semibold">단계</th>
                <th className="px-3 py-2.5 font-semibold">진단 신호 (KLAI)</th>
                <th className="px-3 py-2.5 font-semibold">잠재자산 (자본+부채)</th>
                <th className="px-3 py-2.5 font-semibold text-amber">TownOS 활성화 플레이</th>
                <th className="px-3 py-2.5 font-semibold text-warn">가드레일</th>
              </tr>
            </thead>
            <tbody>
              {PLAYBOOK.map((p) => (
                <tr key={p.stage} className="border-b border-line/50 align-top">
                  <td className="whitespace-nowrap px-4 py-3 font-extrabold" style={{ color: p.color }}>{p.stage}</td>
                  <td className="px-3 py-3 text-muted">{p.signal}</td>
                  <td className="px-3 py-3 text-muted">{p.asset}</td>
                  <td className="px-3 py-3 font-semibold text-ink">{p.play}</td>
                  <td className="px-3 py-3 text-[11px] leading-snug text-muted2">{p.guard}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-line px-5 py-3 text-[11.5px] leading-relaxed text-muted2">
          동인 라우팅 — <b className="text-muted">로컬 주도</b>면 보호·증폭(자생 우선), <b className="text-muted">공공 주도</b>면 마중물 후 출구전략, <b className="text-muted">자본 주도</b>면 가드레일(임대안정·다양성 의무) 우선.
        </p>
      </Panel>

      {/* §6 동네 유형코드 */}
      <Panel className="mb-5">
        <SectionHead no="유형" title="동네 유형코드 — 동 단위·동적" desc="KLACI의 4자리 코드를 동·분기로 변형 · 단계가 이동하면 유형도 변한다" />
        <div className="grid gap-2 sm:grid-cols-4">
          {TYPOLOGY_SLOTS.map((s, i) => (
            <div key={s.slot} className="rounded-[16px] border-[1.5px] border-line bg-card2/40 p-3 text-center">
              <div className="font-display text-[18px] font-black text-blue-l">{["①", "②", "③", "④"][i]}</div>
              <div className="mt-0.5 text-[12px] font-bold text-ink">{s.slot}</div>
              <div className="mt-1 text-[10.5px] leading-snug text-muted2">{s.opts}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {TYPOLOGY_EX.map((t) => (
            <div key={t.code} className="rounded-[16px] border-[1.5px] border-line bg-card px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="rounded-md px-2 py-0.5 font-display text-[13px] font-black tracking-wider" style={{ background: `${t.c}1f`, color: t.c }}>{t.code}</span>
                <span className="text-[13px] font-black text-ink">{t.name}</span>
                <span className="ml-auto text-[10.5px] font-bold text-muted2">{t.ex}</span>
              </div>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted">{t.d}</p>
            </div>
          ))}
        </div>
        <p className="mt-2.5 text-[11.5px] leading-relaxed text-muted2">
          KLACI 유형은 시군구·연 1회 고정. <b className="text-muted">KLAI 유형은 동·분기로 변한다</b> — “지난 분기 <code className="rounded bg-card2 px-1 text-blue-l">F-L-S-a</code>에서 <code className="rounded bg-card2 px-1 text-blue-l">S-L-S-A</code>로 올라섰다”처럼 <b className="text-muted">궤적</b>을 보여줍니다.
        </p>
      </Panel>

      {/* §3 KLACI 흡수 */}
      <Panel className="mb-5">
        <SectionHead no="흡수" title="KLACI에서 흡수할 3가지" desc="경쟁 지수의 강점을 Place OS로 + 우리의 동·동적·실행 우위" />
        <div className="grid gap-3 lg:grid-cols-3">
          {ABSORB.map((a) => (
            <div key={a.n} className="rounded-[20px] border-[1.5px] border-line bg-card2/40 p-4">
              <div className="flex items-center gap-2">
                <span className="font-display text-[18px] font-black text-blue-l">{a.n}</span>
                <span className="text-[13.5px] font-black tracking-tight text-ink">{a.t}</span>
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-muted">{a.d}</p>
            </div>
          ))}
        </div>
      </Panel>

      {/* ACT — 활성화 메뉴 + 데이터 파이프라인 */}
      <Panel className="mb-5">
        <SectionHead no="ACT" title="② 작동 — 활성화 플레이 & 자원 연계" desc="공급·개입·실행. 진단의 출력이 처방의 입력으로 자동 흐른다" />
        <div className="flex flex-wrap gap-1.5">
          {PLAYS.map((p) => (
            <span key={p} className="rounded-full border-[1.5px] border-amber/40 bg-amber/10 px-3 py-1.5 text-[12px] font-bold text-ink">{p}</span>
          ))}
        </div>
        <div className="mt-3 rounded-[14px] border border-line bg-card2/40 px-4 py-3 text-[12px] leading-relaxed text-muted">
          <b className="text-ink">What-if 시뮬레이션 → ROI</b> — 개입 시 KLAI·지속가능성 변화를 예측해 정책 가성비를 낸다. 실행 자원은 <b className="text-ink">ZeroSite</b>(공공주택·매입임대·공간 공급) · 도시재생 · <b className="text-ink">belocal</b>(창작자 네트워크) · <b className="text-ink">Flagtale</b>(문화·공간 운영)로 연계.
        </div>
        <div className="mt-4">
          <div className="mb-2 text-[12px] font-bold text-ink">데이터 파이프라인 — 원천 → 정제 → 합성 → 진단</div>
          <MethodologyFlow />
        </div>
      </Panel>

      {/* 데이터 소스 표 */}
      <Panel className="mb-5 overflow-hidden p-0">
        <div className="border-b border-line p-5 pb-3">
          <SectionHead no="데이터" title="무엇을 · 어디서 · 어떻게 계산하나" desc="SENSE 레이어 실데이터 13종" />
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

      {/* 파생 지표 */}
      <Panel className="mb-5">
        <SectionHead no="산식" title="실데이터로 만드는 파생 지표" desc="합성 · 보정 · 동인 · 발산 — ▶ 2016→2026 흐름 재생" />
        <DerivedDiagrams />
      </Panel>

      {/* §9 검증 — 5단계 SOP + LOOP */}
      <Panel className="mb-5">
        <SectionHead no="LOOP" title="③ 학습 — 5단계 SOP & 효과검증" desc="모든 AI 결정은 5단계를 거쳐 인간 거버넌스의 final 승인을 받는다" />
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {SOP.map((s) => (
            <div key={s.n} className="rounded-[16px] border-[1.5px] border-line bg-card2/40 p-3">
              <div className="text-[18px]">{s.icon}</div>
              <div className="mt-1 font-display text-[10px] font-extrabold uppercase tracking-[0.16em] text-blue-l">Step {s.n}</div>
              <div className="text-[13px] font-black tracking-tight text-ink">{s.t}</div>
              <div className="mt-1 text-[10.5px] leading-snug text-muted2">{s.d}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div className="rounded-[14px] border-[1.5px] border-line bg-card px-4 py-3 text-[12px] leading-relaxed text-muted">
            <b className="text-ink">DiD 효과검증</b> — 개입 전후 KLAI 변화로 처방의 <b className="text-ink">순효과(인과)</b>를 입증 → “우리 처방은 효과가 있다”는 데이터로 보정.
          </div>
          <div className="rounded-[14px] border-[1.5px] border-line bg-card px-4 py-3 text-[12px] leading-relaxed text-muted">
            <b className="text-ink">신뢰 가드</b> — Confidence ≥90%만 자동 통과, 미달은 human-in-the-loop. 잠정/실측 배지 · 데이터 커버리지 · “원인 후보” 표기 · 집계전용 · 낙인 방지.
          </div>
        </div>
      </Panel>

      {/* §7 두 모드 */}
      <Panel className="mb-5">
        <SectionHead no="제품" title="한 플랫폼, 두 모드" desc="동일 Place 엔티티·KLAI·유형코드·시계열을 공유 · 진단의 출력이 활성화의 입력으로" />
        <div className="grid gap-3 sm:grid-cols-2">
          {MODES.map((m) => (
            <div key={m.mode} className="rounded-[20px] border-[1.5px] p-4" style={{ borderColor: `${m.c}55`, background: `${m.c}0f` }}>
              <div className="flex items-center gap-2">
                <span className="grid h-10 w-10 place-items-center rounded-[12px] text-[20px]" style={{ background: `${m.c}1f` }}>{m.icon}</span>
                <div>
                  <div className="text-[14px] font-black tracking-tight text-ink">{m.mode}</div>
                  <div className="text-[11.5px] font-bold" style={{ color: m.c }}>{m.brand} · “{m.q}”</div>
                </div>
              </div>
              <ul className="mt-2.5 space-y-1">
                {m.items.map((it) => (
                  <li key={it} className="flex gap-2 text-[12px] text-muted"><span style={{ color: m.c }}>›</span>{it}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-2.5 text-[11.5px] text-muted2">진입 — 시민·창업자 → <b className="text-muted">진단 모드</b> / 지자체·중간지원조직·ZeroSite → <b className="text-muted">활성화 모드</b>(+진단).</p>
      </Panel>

      {/* §8 포지셔닝 & BM */}
      <Panel className="mb-5 overflow-hidden p-0">
        <div className="border-b border-line p-5 pb-3">
          <SectionHead no="포지션" title="경쟁 포지셔닝 & BM" desc="진단은 흔해져도, 살려내는 OS는 희소하다 — ZeroSite 공급 역량이 실행 해자" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-line bg-card2/50 text-[11px] text-muted2">
                <th className="px-4 py-2.5 font-semibold">구분</th>
                <th className="px-3 py-2.5 font-semibold">KLACI</th>
                <th className="px-3 py-2.5 font-semibold text-blue-l">Place OS (KLAI+TownOS)</th>
              </tr>
            </thead>
            <tbody>
              {POSITION.map((p) => (
                <tr key={p.row} className="border-b border-line/50 align-top">
                  <td className="whitespace-nowrap px-4 py-2.5 font-bold text-ink">{p.row}</td>
                  <td className="px-3 py-2.5 text-muted2">{p.klaci}</td>
                  <td className="px-3 py-2.5 font-semibold text-ink">{p.place}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* §10 로드맵 */}
      <Panel className="mb-5">
        <SectionHead no="로드맵" title="Place OS 반영 로드맵" desc="PoC(2026) → 글로벌 SaaS(2030+) · 9그룹 거버넌스만 사람, 나머지 자동" />
        <div className="space-y-1.5">
          {ROADMAP.map((r) => (
            <div key={r.t} className="flex items-center gap-3 rounded-[14px] border border-line bg-card2/40 px-4 py-2.5">
              <span className="text-[12px] font-black tracking-tight text-amber">{"★".repeat(r.pri)}</span>
              <span className="flex-1 text-[12.5px] font-semibold text-ink">{r.t}</span>
              <span className="rounded-full bg-card px-2.5 py-0.5 text-[10.5px] font-bold text-muted2">{r.where}</span>
            </div>
          ))}
        </div>
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
        <div className="mt-3 rounded-[14px] border-[1.5px] border-line bg-card2/40 px-4 py-3 text-[12px] leading-relaxed text-muted">
          <b className="text-ink">한 줄 결론</b> — Flagtale Lab은 동네의 <b className="text-ink">맥</b>을 짚고, TownOS는 <b className="text-ink">처방을 실행</b>한다. 둘을 닫힌 고리로 묶은 <b className="text-ink">Place OS</b>가 어떤 진단 지수도 못 가진 “살려내는 운영체제”다.
        </div>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4 text-[13px]">
          <Link href="/data" className="rounded-lg border-[1.5px] border-line bg-card px-3 py-1.5 font-semibold text-ink transition-colors hover:border-ink">데이터 출처·연동 상태 →</Link>
          <Link href="/diagnose" className="rounded-lg bg-amber px-3 py-1.5 font-bold text-onaccent transition-colors hover:bg-[#c4f000]">진단 리포트 보기 →</Link>
        </div>
      </Panel>
    </PageShell>
  );
}

// ── 라이프사이클 곡선 ──
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
      <circle r="6.5" fill="var(--amber)" stroke="#fff" strokeWidth="1.5" style={{ filter: "drop-shadow(0 0 9px var(--amber))" }}>
        <animateMotion dur="9s" repeatCount="indefinite" calcMode="linear">
          <mpath href="#lcPath" />
        </animateMotion>
      </circle>
    </svg>
  );
}
