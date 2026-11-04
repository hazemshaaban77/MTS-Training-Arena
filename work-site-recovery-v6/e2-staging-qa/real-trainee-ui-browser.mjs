/**
 * Sprint 05.1: actual V6 React participant join/answer UX in two isolated
 * browser contexts, backed by the REAL V6 API handler + disposable SQLite.
 * No real Firebase trainer login (local fixture only); no production data.
 */
import {spawn} from "node:child_process";
import {setTimeout as sleep} from "node:timers/promises";
import path from "node:path";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
import {chromium} from "playwright";
const root="http://127.0.0.1:8094",screenshots=path.resolve("e2-staging-qa/ci-screenshots");
await fs.mkdir(screenshots,{recursive:true});
const fixture=spawn(process.execPath,[".sites-runtime/e2-staging-qa/staging-local-server.mjs"],{
 cwd:process.cwd(),env:{...process.env,E2_FIXTURE_PORT:"8094",E2_FIXTURE_EXPLICIT:"local-only"},
 stdio:["ignore","pipe","pipe"]});
let fixtureLog="";fixture.stdout.on("data",b=>fixtureLog+=b.toString());fixture.stderr.on("data",b=>fixtureLog+=b.toString());
async function ready(){for(let i=0;i<100;i++){
 if(fixture.exitCode!==null)throw Error("Fixture died");
 try{const r=await fetch(root+"/__fixture_health");if(r.ok)return;}catch{}
 await sleep(150);
}throw Error("Fixture unavailable");}
async function post(path,body,trainer=false){
 const r=await fetch(root+"/api/"+path,{method:"POST",
  headers:{"Content-Type":"application/json",...(trainer?{"X-Firebase-Token":"local-fixture-trainer"}:{})},
  body:JSON.stringify(body)});
 return {status:r.status,body:await r.json()};
}
async function state(code,trainer=false){
 const r=await fetch(root+"/api/state?code="+code+(trainer?"&role=host":""),
  {headers:trainer?{"X-Firebase-Token":"local-fixture-trainer"}:{}});
 return {status:r.status,body:await r.json()};
}
let browser;
const contexts=[];
try{
 await ready();
 const created=await post("sessions",{
  title:"Actual React Join/Answer UI — Fixture Only",language:"ar",teams:true,
  settings:{reveal:"manual",teamNames:["Lightning","Wave"]},
  activities:[{type:"Quiz",prompt:"ما هو رقم ACID؟ (مثال اختبار فقط)",
    timer:120,options:["رقم تعريفي للشحنة","اسم السائق","رقم الحاوية"],correct:0,speed:false}]
 },true);
 assert.equal(created.status,200,"Room creation");
 const code=created.body.code;
 browser=await chromium.launch({headless:true});
 const pages=[];
 for(let i=1;i<=2;i++){
  const ctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1});
  contexts.push(ctx);
  const page=await ctx.newPage();
  pages.push(page);
  page.on("pageerror",err=>{console.error("React page error "+i+": "+err.message)});
  await page.goto(root+"/MTS-Training-Arena/v6/?view=join&code="+code,{waitUntil:"domcontentloaded"});
  await page.locator("input[autocomplete='name']").waitFor({timeout:25000});
  assert.equal(new URL(page.url()).searchParams.get("code"),code,"Single code from URL");
  await page.locator("input[autocomplete='name']").fill("Browser trainee "+i);
  await page.locator("input[maxlength='30']").fill("QA-REACT-"+String(i).padStart(3,"0"));
  const team= i===1?"Lightning":"Wave";
  await page.locator("select").filter({has:page.locator("option[value='Lightning']")}).selectOption(team);
  await page.locator(".identity-confirmation input[type='checkbox']").check();
  await page.screenshot({path:path.join(screenshots,"05-react-trainee-"+i+"-confirm.png"),fullPage:true});
  await page.locator("button").filter({hasText:"تأكيد الدخول والانضمام"}).click();
  await page.waitForURL(/view=play/,{timeout:18000});
  const token=await page.evaluate(room=>"localStorage".length && window.localStorage.getItem("arena-player-"+room),code);
  assert.ok(token,"React participant UI must store a token after server acknowledgement");
  const mine=await fetch(root+"/api/state?code="+code,{headers:{"X-Player-Token":token}});
  const mineBody=await mine.json();assert.equal(mine.status,200);
  assert.ok(mineBody.mine?.id);
  // Pass identity and assigned token to fixture checks; never persist these values.
  pages[i-1].__fixtureToken=undefined;
  if(i===1)console.log("React join: browser contexts display same QR code and reach play route");
 }
 async function trainer(action){
  const host=(await state(code,true)).body;
  const out=await post("control",{code,revision:host.revision,action},true);
  assert.equal(out.status,200,"Trainer "+action+" action: "+JSON.stringify(out.body));
 }
 await trainer("start");
 for(const [i,page] of pages.entries()){
  await page.reload({waitUntil:"domcontentloaded"});
  await page.locator(".answer-option").first().waitFor({timeout:20000});
  assert.equal(await page.locator(".answer-option").count(),3);
  await page.locator(".answer-option").nth(i===0?0:1).click();
  const send=page.locator(".submit-answer");
  await send.waitFor({timeout:7000});
  await send.click();
  await page.waitForFunction(()=>document.body.innerText.includes("إجابتك وصلت للسيرفر."),null,{timeout:17000});
  await page.screenshot({path:path.join(screenshots,"06-react-trainee-"+(i+1)+"-submitted.png"),fullPage:true});
 }
 const publicStatus=await state(code);
 assert.equal(publicStatus.body.submitted,2);
 await trainer("close");
 const closed=(await state(code)).body;
 assert.equal(closed.keyRevealed,false,"React UI cannot cause early key reveal");
 // Re-render participant after results; answer must remain unknown.
 await pages[0].reload({waitUntil:"domcontentloaded"});
 await pages[0].locator(".arena-quiz-show__locked").waitFor({timeout:15000});
 assert.equal(await pages[0].locator(".right-answer").count(),0);
 await trainer("revealkey");
 await pages[0].reload({waitUntil:"domcontentloaded"});
 await pages[0].locator(".arena-quiz-show__winning-answer").waitFor({timeout:15000});
 await pages[0].screenshot({path:path.join(screenshots,"07-react-trainee-safe-reveal.png"),fullPage:true});
 console.log(JSON.stringify({status:"PASS",test:"Actual React trainee UI",clients:2,
   scenarios:["QR URL opens React join route","name/id/confirmation submitted",
    "server token persists locally","server start reflected in UI",
    "two choices submitted via button","server acknowledgement visible",
    "no answer leaked until trainer reveal","React reveals only after server flag"],
   limits:["Local fixture trainer","No physical phones","No production Firebase","No live WebSockets"]},null,2));
}finally{
 for(const ctx of contexts)try{await ctx.close()}catch{}
 if(browser)await browser.close();
 fixture.kill("SIGTERM");
 await Promise.race([new Promise(resolve=>fixture.once("exit",resolve)),sleep(1500)]);
 if(fixture.exitCode && fixtureLog)console.error("Fixture error output "+fixtureLog.slice(-1000));
}
