# 디자인 시스템 — careet 라이트

> 진실의 원천: `app/globals.css`(`:root` 다크 + `.theme-light` 라이트) + 인앱 `/design` 페이지. 랜딩·소비자·Lab 콘텐츠 페이지는 **라이트** 사용.

## 원칙
- **ZeroSite × careet** — 화이트 + 잉크블랙 + 샤르트뢰즈 포인트 + 매거진(콘텐츠-피드) 레이아웃.
- **라임은 채움 전용** — 큰 라임 텍스트는 가독성 나쁨. 채움(버튼·배지·핀)=`--amber`, 텍스트 강조(링크·아이브로·태그)=`--blue-l`(lime-700).
- 모더레이트 타이포 + careet 펀치(헤드라인 `font-display font-black`).

## 라이트 토큰 (`.theme-light`)
| 토큰 | 값 | 용도 |
|---|---|---|
| `--navy` | `#ffffff` | 페이지 배경 |
| `--card` / `--card2` | `#ffffff` / `#f5f6f0` | 카드 |
| `--line` | `#ececE6` | 보더(**1.5px** 권장) |
| `--ink` | `#131316` | 본문·다크 필 버튼 |
| `--muted` / `--muted2` | `#57575f` / `#9a9aa3` | 보조 / 흐림 |
| **`--amber`** | **`#d9f21e`** | 강조 채움(샤르트뢰즈) — 버튼·배지·핀 |
| `--amber-d` | `#c4f000` | hover |
| `--on-accent` | `#1c2b02` | 라임 위 텍스트(다크) |
| **`--blue-l`** | **`#4d7c0f`** | 텍스트 강조(lime-700) — 링크·아이브로 |
| `--blue` | `#3f6212` | 프라이머리(흰 텍스트) |
| `--accent-bright` | `#d9f21e` | 형광펜(`hl-mark`) |
| `--green` / `--warn` | `#059669` / `#e11d48` | 긍정 / 경고·하락 |

등급 발산 S `#0f6e5c` · A `#1e7a8c` · B `#3e9aa8` · C `#e2a33a` · D `#d2691e` · E `#a23a2a` (낙인 방지 거친 6단계). 다크맵 패널 `#0d2b5e`. 3D 상승=`#16a34a`/하락=`#f43f5e`.

## 타이포
- 본문 Pretendard(`--font-pretendard`), 디스플레이·숫자 Poppins(`font-display`, `tabular-nums`).
- 히어로 `font-display font-black clamp(38px,6vw,64px) tracking-[-0.035em]`. 섹션 h2 `font-black clamp(22-32px) tracking-[-0.03em]`. 카드 17~19px.
- 아이브로 `klai-eyebrow`(12px·800·uppercase·tracking 0.24em·blue-l). 형광 `hl-mark`(accent-bright 82% 언더라인).

## 시그니처 유틸 (globals.css)
`hl-mark`(형광펜) · `klai-eyebrow` · `lift`(hover -4px+라임링) · `btn-glow` · `ticker-track`/`marquee-track`(무한 마퀴) · `cat-tag` · `status-pill`. 카드 라운드 `rounded-[20px]`, 큰 패널 `rounded-[24~28px]`, 칩 999px.

## 컴포넌트 톤
- 버튼: 채움 `bg-amber text-onaccent btn-glow` / 다크 `bg-ink text-white` / 고스트 `border-[1.5px] border-line bg-card hover:border-ink`.
- 카드: `border-[1.5px] border-line bg-card rounded-[20px] lift`.
- 마스트헤드: 회전(-4°) 라임 "F" 배지 + "Flag**tale**".
