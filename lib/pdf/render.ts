/**
 * 서버 PDF 렌더 (Playwright Chromium) — 스펙 §10·§15: PDF 는 서버에서만 생성.
 * playwright 는 선택 의존성. 동적 import(webpackIgnore)로 빌드/번들에서 제외하고,
 * 런타임에 모듈이 없으면 null 반환 → 호출측이 목업/안내 처리.
 *
 * 활성화:  npm i -D playwright && npx playwright install chromium
 *          .env 에 ENABLE_PDF=1
 */
export async function renderPdf(html: string): Promise<Uint8Array | null> {
  if (process.env.ENABLE_PDF !== "1") return null;
  try {
    // 변수 지정자 → TS/webpack 정적분석 회피(미설치여도 빌드 안전). 런타임에만 resolve.
    const spec = ["play", "wright"].join("");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pw: any = await import(spec).catch(() => null);
    if (!pw) return null;
    const browser = await pw.chromium.launch({ args: ["--no-sandbox"] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "14mm", bottom: "14mm", left: "12mm", right: "12mm" },
    });
    await browser.close();
    return pdf;
  } catch {
    return null;
  }
}
