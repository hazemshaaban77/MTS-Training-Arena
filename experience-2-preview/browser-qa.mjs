// Browser-level regression QA for Experience 2.0 Stage 1.
// Isolated visual preview only: no production authentication, backend or employee data.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const dir=path.dirname(fileURLToPath(import.meta.url));
const screenshots=path.join(dir,'screenshots');
await fs.mkdir(screenshots,{recursive:true});
const root=process.env.ARENA_PREVIEW_URL||'http://127.0.0.1:8000/experience-2-preview/';
const browser=await chromium.launch({headless:true});
const errors=[];
let trainer,projector,mobile;
try{
  const ctx=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1});
  trainer=await ctx.newPage();
  projector=await ctx.newPage();
  [trainer,projector].forEach(p=>{
    p.on('pageerror',e=>errors.push('JS: '+e.message));
    p.on('console',e=>{if(e.type()==='error')errors.push('Console: '+e.text())});
  });
  await trainer.goto(root,{waitUntil:'domcontentloaded'});
  await projector.setViewportSize({width:1920,height:1080});
  await projector.goto(root+'?display=1',{waitUntil:'domcontentloaded'});
  await trainer.locator('#goLobby').click();
  await projector.waitForFunction(()=>document.getElementById('sceneStatus')?.textContent?.includes('الانتظار'));
  const logos=await projector.locator('.stage-logo').evaluateAll(els=>els.map(x=>({width:x.naturalWidth,visible:getComputedStyle(x).display!=='none'})));
  assert.equal(logos.length,2);
  assert.ok(logos.every(x=>x.width>0&&x.visible),'Projector must show both ORIGINAL loaded logos');
  assert.ok(await projector.locator('body').evaluate(e=>e.classList.contains('projector-mode')));
  await trainer.screenshot({path:path.join(screenshots,'01-lobby-desktop.png'),fullPage:true});
  await projector.screenshot({path:path.join(screenshots,'02-lobby-projector.png')});

  await trainer.locator('#goIntro').click();
  await projector.locator('.intro-cover.on').waitFor({timeout:4000});
  await projector.screenshot({path:path.join(screenshots,'03-intro-projector.png')});
  await projector.waitForFunction(()=>document.getElementById('sceneStatus')?.textContent?.includes('السؤال'),{timeout:12000});
  await projector.screenshot({path:path.join(screenshots,'04-question-projector.png')});
  assert.ok(!(await projector.locator('#scene').innerText()).includes('الإجابة الصحيحة'),'Question must not leak correct answer');

  await trainer.waitForFunction(()=>document.getElementById('sceneStatus')?.textContent?.includes('انتهى الوقت'),{timeout:27000});
  await projector.waitForFunction(()=>document.getElementById('sceneStatus')?.textContent?.includes('انتهى الوقت'),{timeout:7000});
  assert.ok(!(await projector.locator('#scene').innerText()).includes('الإجابة الصحيحة'),'Timer must LOCK, not reveal');

  mobile=await ctx.newPage({viewport:{width:390,height:844}});
  await mobile.setViewportSize({width:390,height:844});
  await mobile.goto(root,{waitUntil:'domcontentloaded'});
  mobile.on('pageerror',e=>errors.push('Mobile JS: '+e.message));
  await mobile.screenshot({path:path.join(screenshots,'05-locked-mobile.png'),fullPage:true});
  const widths=await mobile.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:window.innerWidth}));
  assert.ok(widths.scroll<=widths.viewport+2,'Mobile horizontal overflow: '+JSON.stringify(widths));

  await trainer.locator('#goReveal').click();
  await projector.waitForFunction(()=>document.getElementById('sceneStatus')?.textContent==='كشف الإجابة');
  assert.ok((await projector.locator('#scene').innerText()).includes('الإجابة الصحيحة'));
  await projector.screenshot({path:path.join(screenshots,'06-reveal-projector.png')});

  await trainer.locator('#goPodium').click();
  await projector.waitForFunction(()=>document.getElementById('sceneStatus')?.textContent?.includes('الفائزون'));
  await projector.screenshot({path:path.join(screenshots,'07-podium-projector.png')});
  await trainer.locator('#language').click();
  await projector.waitForFunction(()=>document.documentElement.lang==='en');
  assert.ok((await projector.locator('#scene').innerText()).includes('THE WINNERS'));
  await projector.screenshot({path:path.join(screenshots,'08-podium-english.png')});
  assert.deepEqual(errors,[],'No browser console/page JavaScript errors expected');
  console.log(JSON.stringify({status:'PASS',screenshots:screenshots,checks:['original projector logos','same-browser scene sync','intro','manual reveal after timeout','no premature answer','mobile no horizontal overflow','podium','bilingual update','no JS errors']},null,2));
}finally{await browser.close()}
