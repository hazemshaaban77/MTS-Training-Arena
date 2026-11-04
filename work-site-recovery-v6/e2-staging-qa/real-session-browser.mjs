/**
 * Sprint 05: real V6 API handler + disposable SQLite + 2 then 5
 * independent browser clients + read-only E2 projector.
 *
 * Browser "participant" test clients POST to the actual V6 join/answer
 * endpoints (not a mock API); trainer verification uses a LOCAL fixture.
 * No Cloudflare deployment, Firebase login, production database or live traffic.
 *
 * This is not a physical phone / projector test.
 */
import {spawn} from "node:child_process";
import {setTimeout as sleep} from "node:timers/promises";
import path from "node:path";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
import {chromium} from "playwright";

const PORT=8094,root="http://127.0.0.1:"+PORT;
const evidence=path.resolve("e2-staging-qa/ci-screenshots");
await fs.mkdir(evidence,{recursive:true});
const work=process.cwd();
const fixture=spawn(process.execPath,[".sites-runtime/e2-staging-qa/staging-local-server.mjs"],{
 cwd:work,env:{...process.env,E2_FIXTURE_PORT:String(PORT),E2_FIXTURE_EXPLICIT:"local-only"},
 stdio:["ignore","pipe","pipe"]
});
let logs="";fixture.stdout.on("data",d=>logs+=String(d));fixture.stderr.on("data",d=>logs+=String(d));
const waitForFixture=async()=>{
 for(let n=0;n<70;n++){
  if(fixture.exitCode!==null)throw Error("Fixture server terminated before ready");
  try{const res=await fetch(root+"/__fixture_health");if(res.ok&&((await res.json()).testOnly))return;}
  catch{}
  await sleep(150);
 }
 throw Error("Fixture did not become ready; check CI logs");
};
const api=async(path,{method="GET",body,token,asTrainer=false}={})=>{
 const response=await fetch(root+"/api/"+path,{
  method,headers:{"Accept":"application/json",...(body?{"Content-Type":"application/json"}:{}),
  ...(token?{"X-Player-Token":token}:{}),...(asTrainer?{"X-Firebase-Token":"local-fixture-trainer"}:{})},
  body:body?JSON.stringify(body):undefined
 });
 const json=await response.json();
 return {status:response.status,json};
};
const ok=(value,context)=>{assert.equal(value.status,200,context+" status="+value.status+" body="+JSON.stringify(value.json));return value.json;};
const post=(path,data,auth={})=>api(path,{method:"POST",body:data,...auth});
const get=(path,auth={})=>api(path,auth);
const userContexts=[];
let browser;
let completed=false;
try{
 await waitForFixture();
 const denied=await post("sessions",{title:"unauthorized",activities:[]});
 assert.equal(denied.status,401,"Unauthenticated trainer must not be able to create session");
 const quiz=index=>({type:"Quiz",prompt:index===1?"First training question (test only)":"Second training question (test only)",
  options:["Correct choice","Incorrect choice","Other choice"],correct:0,timer:120,speed:false});
 const created=ok(await post("sessions",{
  title:"E2 Staging Room — Synthetic Data Only",teams:true,language:"en",
  settings:{reveal:"manual",progression:"manual",teamNames:["Lightning","Wave"]},
  activities:[quiz(1),quiz(2)]
 },{asTrainer:true}),"Create disposable V6 session");
 const code=created.code;
 assert.match(code,/^\d{6}$/);
 const host=async()=>ok(await get("state?code="+code+"&role=host",{asTrainer:true}),"Trainer state");
 const publicState=async()=>ok(await get("state?code="+code),"Anonymous public state");
 const initial=await host();
 assert.equal(initial.status,"lobby");
 assert.equal(initial.code,code);
 assert.equal((await get("state?code="+code+"&role=host")).status,401,"Host private state requires trainer auth");
 browser=await chromium.launch({headless:true});
 const projectorCtx=await browser.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1});
 userContexts.push(projectorCtx);
 const projector=await projectorCtx.newPage();
 const jsErrors=[];
 projector.on("pageerror",e=>jsErrors.push(e.message));
 await projector.goto(root+"/e2-preview/live-projector.html",{waitUntil:"domcontentloaded"});
 await projector.locator("#api-origin").fill(root);
 await projector.locator("#frontend-origin").fill(root+"/MTS-Training-Arena/v6/");
 await projector.locator("#room-code").fill(code);
 await projector.locator("#connect-form button[type=submit]").click();
 await projector.waitForFunction(()=>document.getElementById("stage")?.dataset.scene==="lobby",null,{timeout:7000});
 const joinHref=await projector.locator("#join-link").getAttribute("href");
 assert.equal(joinHref,root+"/MTS-Training-Arena/v6/?view=join&code="+code);
 await projector.screenshot({path:path.join(evidence,"01-real-api-lobby.png")});
 const people=[];
 // Separate browser contexts simulate independent phones. They call the
 // same real /api/join and /api/answer endpoints as the V6 frontend.
 const join=async(n)=>{
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1});
  userContexts.push(context);
  const page=await context.newPage();
  page.on("pageerror",e=>jsErrors.push(e.message));
  await page.goto(root+"/e2-preview/live-projector.html",{waitUntil:"domcontentloaded"});
  const team=n%2?"Lightning":"Wave";
  const registration=await page.evaluate(async({code,n,team})=>{
   const response=await fetch("/api/join",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({code,name:"Fixture player "+n,employeeId:"QA-ONLY-"+String(n).padStart(3,"0"),
     confirmed:true,team,language:"en"})});
   return {status:response.status,body:await response.json()};
  },{code,n,team});
  assert.equal(registration.status,200,"Player "+n+" registration");
  assert.ok(registration.body.token,"Player "+n+" token should be returned");
  const player={n,team,page,context,token:registration.body.token,id:registration.body.id,
    recoveryCode:registration.body.recoveryCode,approval:registration.body.approval};
  people.push(player);
  return player;
 };
 const answer=async(player,round,answerIndex)=>{
  return player.page.evaluate(async({code,token,round,answerIndex})=>{
   const r=await fetch("/api/answer",{method:"POST",headers:{"Content-Type":"application/json","X-Player-Token":token},
     body:JSON.stringify({code,round,answer:answerIndex})});
   return {status:r.status,body:await r.json()};
  },{code,token:player.token,round,answerIndex});
 };
 const control=async(action,extra={})=>{
  const h=await host();
  return post("control",{code,revision:h.revision,action,...extra},{asTrainer:true});
 };
 const p1=await join(1),p2=await join(2);
 assert.equal(p1.approval,"approved");
 assert.equal(p2.approval,"approved");
 await projector.waitForFunction(()=>document.getElementById("stage")?.textContent?.includes("عدد المشاركين: 2"),null,{timeout:7000});
 ok(await control("start"),"Start first round");
 await projector.waitForFunction(()=>document.getElementById("stage")?.dataset.scene==="question",null,{timeout:7000});
 let s=await publicState();
 assert.equal(s.current,0);
 assert.equal(s.activity.correct,undefined,"Correct answer must be hidden during question");
 const a1=await answer(p1,0,0),a2=await answer(p2,0,1);
 assert.equal(a1.status,200);assert.equal(a2.status,200);
 assert.equal((await answer(p1,0,0)).status,409,"Duplicate answer must be rejected");
 assert.equal((await post("control",{code,revision:(await host()).revision,action:"close"})).status,401,"No public control mutations");
 await projector.waitForFunction(()=>document.getElementById("stage")?.textContent?.includes("الإجابات المستلمة: 2"),null,{timeout:7000});
 ok(await control("close"),"Close first round");
 await projector.waitForFunction(()=>document.getElementById("stage")?.dataset.scene==="locked",null,{timeout:7000});
 s=await publicState();
 assert.equal(s.keyRevealed,false);
 assert.equal(s.activity.correct,undefined);
 assert.ok(!(await projector.locator("#stage").innerText()).includes("Correct choice · الصحيح"));
 await projector.screenshot({path:path.join(evidence,"02-locked-without-key.png")});
 ok(await control("revealkey"),"Reveal when trainer commands");
 await projector.waitForFunction(()=>document.getElementById("stage")?.dataset.scene==="reveal",null,{timeout:7000});
 s=await publicState();
 assert.equal(s.keyRevealed,true);
 assert.equal(s.activity.correct,0);
 assert.equal(await projector.locator(".option.correct").count(),1);
 await projector.screenshot({path:path.join(evidence,"03-real-scores-and-answer.png")});
 // Late arrivals remain pending until trainer approval for the NEXT round.
 const p3=await join(3),p4=await join(4),p5=await join(5);
 for(const p of [p3,p4,p5])assert.equal(p.approval,"pending","Late arrivals must be pending");
 for(const p of [p3,p4,p5])ok(await control("approve",{player:p.id}),"Approve player "+p.n);
 ok(await control("next"),"Start next round with approved five");
 await projector.waitForFunction(()=>document.getElementById("stage")?.dataset.scene==="question",null,{timeout:7000});
 s=await publicState();assert.equal(s.current,1);assert.equal(s.activity.correct,undefined);
 const answers=[[p1,1],[p2,0],[p3,0],[p4,1],[p5,0]];
 for(const [person,choice] of answers)assert.equal((await answer(person,1,choice)).status,200);
 assert.equal((await answer(p3,1,0)).status,409,"Second round double score blocked");
 s=await publicState();assert.equal(s.submitted,5,"Five unique submissions counted");
 ok(await control("close"),"Close second round");
 ok(await control("revealkey"),"Reveal second round");
 ok(await control("finish"),"Finish multi-round session");
 await projector.waitForFunction(()=>document.getElementById("stage")?.dataset.scene==="podium",null,{timeout:7000});
 s=await publicState();
 assert.equal(s.status,"completed");
 assert.equal(s.teams.length,2);
 const rank=s.teams.map(t=>({name:t.team,score:t.score,rank:t.rank}));
 assert.deepEqual(rank,[{name:"Lightning",score:3000,rank:1},{name:"Wave",score:1000,rank:2}],"Server is authoritative for team points");
 assert.equal((await projector.locator(".team").count()),2);
 await projector.screenshot({path:path.join(evidence,"04-final-server-standings.png")});
 // Simulate a returning browser using the same attendee's issued token.
 const original=ok(await get("state?code="+code,{token:p2.token}),"Player token before reconnection");
 assert.equal(original.mine.id,p2.id);
 const returningContext=await browser.newContext({viewport:{width:390,height:844}});
 userContexts.push(returningContext);
 const returningPage=await returningContext.newPage();
 await returningPage.goto(root+"/e2-preview/live-projector.html",{waitUntil:"domcontentloaded"});
 const returned=await returningPage.evaluate(async({code,token})=>{
  const r=await fetch("/api/state?code="+code,{headers:{"X-Player-Token":token}});
  return {status:r.status,data:await r.json()};
 },{code,token:p2.token});
 assert.equal(returned.status,200);
 assert.equal(returned.data.mine.id,p2.id);
 // No tokens/private IDs should ever reach the projection DOM.
 const textContent=await projector.locator("body").innerText();
 for(const secret of ["QA-ONLY-","local-fixture-trainer",p1.token,p2.token,p3.token])
  assert.ok(!textContent.includes(secret),"Projection leaked a private item");
 assert.deepEqual(jsErrors,[],"Browser JavaScript errors");
 completed=true;
 console.log(JSON.stringify({status:"PASS",session:"synthetic-code",rounds:2,
  simulatedBrowserClients:5,projector:"actual read-only HTTP integration",
  grades:{Lightning:3000,Wave:1000},
  safeguards:["local test-only trainer verifier","real API handler","SQLite in-memory",
   "duplicate score rejected","late player approval","server-only reveal","stable QR URL",
   "reconnect using same token","no production data"],
  limitations:["Not real Firebase login","Not physical phones","Not live network WebSockets",
   "Not a real Cloudflare staging deploy"]},null,2));
}finally{
 for(const context of userContexts)try{await context.close()}catch{}
 if(browser)await browser.close();
 fixture.kill("SIGTERM");
 await Promise.race([new Promise(resolve=>fixture.once("exit",resolve)),sleep(2000)]);
 if(!completed&&logs)console.error("FIXTURE OUTPUT (no token values): "+logs.slice(-2000));
}
