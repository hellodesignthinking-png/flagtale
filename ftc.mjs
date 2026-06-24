import { chromium } from "playwright-core";
const EXEC = "/Users/TaiNa0/Library/Caches/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-mac-arm64/chrome-headless-shell";
const b = await chromium.launch({ headless: true, executablePath: EXEC });
const errs=[];
// map-tale: 가독성(불투명) + 접기/펼치기
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on("console",m=>{if(m.type()==="error")errs.push("MT:"+m.text().slice(0,55))});
await p.goto("https://flatalelocal.vercel.app/map-tale",{waitUntil:"domcontentloaded",timeout:45000});
await p.waitForTimeout(12000);
const barBg = await p.evaluate(()=>{ const bar=document.querySelector('.absolute.inset-x-2.top-2'); return bar?getComputedStyle(bar).backgroundColor:null; });
const card = await p.$('button[class*="rounded-[12px]"]'); if(card){ await card.click(); await p.waitForTimeout(2000); }
// 접기
await p.evaluate(()=>document.querySelector('button[title="접기"]')?.click()); await p.waitForTimeout(900);
const collapsed = await p.evaluate(()=>({ expandBtn: !!([...document.querySelectorAll('button')].find(b=>/펼치기/.test(b.textContent||""))), detailGone: !document.querySelector('.ft-panel-in.flex.max-h-\\[82\\%\\]') }));
// 펼치기
await p.evaluate(()=>[...document.querySelectorAll('button')].find(b=>/펼치기/.test(b.textContent||""))?.click()); await p.waitForTimeout(900);
const expanded = await p.evaluate(()=>!!document.querySelector('button[title="접기"]'));
await p.screenshot({path:"/tmp/mt.png"});
await p.close();
// discover: 지도 없음 + 큐레이션
const d = await b.newPage({ viewport: { width: 1440, height: 1600 } });
d.on("console",m=>{if(m.type()==="error")errs.push("DC:"+m.text().slice(0,55))});
await d.goto("https://flatalelocal.vercel.app/discover",{waitUntil:"domcontentloaded",timeout:45000});
await d.waitForTimeout(6000);
const disc = await d.evaluate(()=>({ noMapMount: !document.querySelector('.h-\\[calc\\(100vh_-_3\\.5rem\\)\\]'), mapBtn: !!([...document.querySelectorAll('a')].find(a=>/지도로 탐색/.test(a.textContent||""))), creators: /크리에이터/.test(document.body.innerText) }));
await d.screenshot({path:"/tmp/dc.png"});
console.log(JSON.stringify({barBg, ...collapsed, expandedBack: expanded, ...disc, errs:errs.slice(0,4)}));
await b.close();
