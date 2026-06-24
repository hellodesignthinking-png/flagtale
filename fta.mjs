import { chromium } from "playwright-core";
const EXEC = "/Users/TaiNa0/Library/Caches/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-mac-arm64/chrome-headless-shell";
const b = await chromium.launch({ headless: true, executablePath: EXEC });
const errs=[];
// 모바일 — 필터바 드롭다운 위치 + 레이어 레일 점검
const m = await b.newPage({ viewport: { width: 390, height: 844 } });
m.on("console",x=>{if(x.type()==="error")errs.push("MO:"+x.text().slice(0,60))});
await m.goto("https://flatalelocal.vercel.app/map-tale",{waitUntil:"domcontentloaded",timeout:45000});
await m.waitForTimeout(12000);
await m.screenshot({path:"/tmp/au-m1.png"});
// 모바일에서 종류 드롭다운 열기 (fixed 위치가 화면 안에 들어오는지)
await m.evaluate(()=>{ [...document.querySelectorAll('button')].find(b=>/^종류/.test(b.textContent?.trim()||""))?.click(); });
await m.waitForTimeout(700);
const mdrop = await m.evaluate(()=>{ const panel=document.querySelector('.fixed.z-\\[59\\]'); if(!panel) return {panel:false}; const r=panel.getBoundingClientRect(); return { panel:true, x:Math.round(r.x), right:Math.round(r.right), inView: r.x>=0 && r.right<=390 }; });
await m.screenshot({path:"/tmp/au-m2.png"});
await m.close();
// 데스크톱 — 영업중/즐겨찾기 토글 + 정렬 거리순
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on("console",x=>{if(x.type()==="error")errs.push("DT:"+x.text().slice(0,60))});
await p.goto("https://flatalelocal.vercel.app/map-tale",{waitUntil:"domcontentloaded",timeout:45000});
await p.waitForTimeout(12000);
await p.screenshot({path:"/tmp/au-d1.png"});
console.log(JSON.stringify({mobileDrop: mdrop, errs:errs.slice(0,6)}));
await b.close();
