import { chromium } from "playwright-core";
const EXEC = "/Users/TaiNa0/Library/Caches/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-mac-arm64/chrome-headless-shell";
const b = await chromium.launch({ headless: true, executablePath: EXEC });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs=[]; p.on("console",m=>{if(m.type()==="error")errs.push(m.text().slice(0,70))});
await p.goto("https://flatalelocal.vercel.app/map-tale",{waitUntil:"domcontentloaded",timeout:45000});
await p.waitForTimeout(12000);
const card = await p.$('button[class*="rounded-[12px]"]'); if(card){ await card.click(); await p.waitForTimeout(2000); }
const r = await p.evaluate(()=>{
  const has=!!([...document.querySelectorAll('*')].find(e=>/주변 가까운 곳/.test(e.textContent||"")));
  const nb=[...document.querySelectorAll('.z-\\[200\\] button')].filter(b=>/★/.test(b.textContent||"")&&b.querySelector('span')).length;
  const name1=document.querySelector('.z-\\[200\\] h3')?.textContent||"";
  return { nearbySection: has, name1 };
});
// 주변 항목 클릭 → 다른 항목으로 전환
await p.evaluate(()=>{ const sec=[...document.querySelectorAll('div')].find(d=>/주변 가까운 곳/.test(d.textContent||"")&&d.className.includes('mt-4')); const btn=sec?.querySelector('button'); btn?.click(); });
await p.waitForTimeout(1500);
const name2 = await p.evaluate(()=>document.querySelector('.z-\\[200\\] h3')?.textContent||"");
console.log(JSON.stringify({...r, name2, changed: r.name1 && name2 && r.name1!==name2, errs:errs.slice(0,3)}));
await b.close();
