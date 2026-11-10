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

 // The unified QR must work through the REAL React trainee page, not just a
 // direct /api/join shortcut. Run an isolated second room so the existing
 // five-client ranking fixture and its expected results remain unchanged.
 const qrCreated=ok(await post("sessions",{
  title:"ONE QR · Real React Trainee · QA ONLY",teams:false,language:"en",
  settings:{reveal:"manual",progression:"manual"},
  activities:[quiz(1),quiz(2)]
 },{asTrainer:true}),"Create isolated QR journey");
 const qrCode=qrCreated.code;
 const qrUrl=new URL(joinHref);
 qrUrl.searchParams.set("code",qrCode);
 assert.equal(qrUrl.origin,root,"QR must open the site origin, not API credentials or an external login");
 assert.equal(qrUrl.searchParams.get("view"),"join");
 assert.equal(qrUrl.searchParams.get("code"),qrCode);
 const qrCtx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,
  reducedMotion:"reduce"});
 userContexts.push(qrCtx);
 await qrCtx.addInitScript(()=>{
  localStorage.setItem("arena-language","en");
  localStorage.setItem("arena-effects","off");
 });
 const qrPage=await qrCtx.newPage();
 qrPage.on("pageerror",e=>jsErrors.push("QR React: "+e.message));
 await qrPage.goto(qrUrl.toString(),{waitUntil:"domcontentloaded"});
 const joinForm=qrPage.locator(".join-page .join-card form");
 await joinForm.waitFor({state:"visible",timeout:18000});
 assert.ok((await joinForm.innerText()).includes("Employee ID"),
  "Real QR entry must use the trainee registration screen without trainer Firebase login");
 await qrPage.locator("input[autocomplete=name]").fill("QR Browser Participant");
 await qrPage.locator("input[autocomplete=off][maxlength='30']").fill("QA-QR-REACT-01");
 await qrPage.locator(".identity-confirmation input[type=checkbox]").check();
 const joinViewport=await qrPage.evaluate(()=>{
  const btn=document.querySelector('.join-page .join-card form .btn.primary');
  const r=btn?.getBoundingClientRect();
  return {bottom:r?.bottom,top:r?.top,height:r?.height,
   viewport:innerHeight,scrollWidth:document.documentElement.scrollWidth,
   width:innerWidth,loginCopy:document.querySelector('.join-page .private-note')?.textContent||''};
 });
 assert.ok(joinViewport.bottom<=joinViewport.viewport+8&&joinViewport.top>=0,
  "QR join confirmation button should be visible without scrolling on 390x844: "+JSON.stringify(joinViewport));
 assert.ok(joinViewport.scrollWidth<=joinViewport.width+2,
  "QR mobile entry must not overflow horizontally: "+JSON.stringify(joinViewport));
 assert.ok(joinViewport.loginCopy.includes("No trainer account"),
  "Entry copy must clearly distinguish trainee QR joining from trainer Firebase login");
 console.log("QR_JOIN_MOBILE_LAYOUT_PASS",JSON.stringify({
  buttonBottom:joinViewport.bottom,viewport:joinViewport.viewport,
  horizontalOverflow:joinViewport.scrollWidth-joinViewport.width
 }));
 await qrPage.screenshot({path:path.join(evidence,"05-real-react-unified-qr-join.png")});
 await joinForm.locator('button[type="submit"],button.btn.primary').first().click();
 await qrPage.waitForURL(url=>url.searchParams.get("view")==="play"&&url.searchParams.get("code")===qrCode,
  {timeout:20000});
 const qrToken=await qrPage.evaluate(c=>localStorage.getItem("arena-player-"+c),qrCode);
 assert.ok(typeof qrToken==="string"&&qrToken.length>=30,"Real React registration persists one private token");
 assert.ok(!qrPage.url().includes(qrToken),"The private player token must never appear in a QR or address bar");
 // New participants must acknowledge their one-time recovery code BEFORE
 // the activity buttons become interactive. Exercise the real modal, never
 // dismiss a production privacy step via injected state.
 const recoveryDialog=qrPage.locator(".recovery-welcome[role=dialog]");
 await recoveryDialog.waitFor({state:"visible",timeout:12000});
 const shownRecovery=await recoveryDialog.locator(".recovery-code").innerText();
 assert.match(shownRecovery,/^[A-F0-9]{5}(?:-[A-F0-9]{5}){3}$/,
  "One-time recovery code should be readable and correctly formatted");
 assert.ok(!qrPage.url().includes(shownRecovery),"The recovery secret must not leak into QR URL");
 await recoveryDialog.locator("button.btn.primary").click({timeout:8000});
 await recoveryDialog.waitFor({state:"detached",timeout:8000});
 const qrProfile=ok(await get("state?code="+qrCode,{token:qrToken}),"QR token identity");
 assert.equal(qrProfile.mine?.name,"QR Browser Participant");
 const qrUid=qrProfile.mine?.id;
 const qrHost=async()=>ok(await get("state?code="+qrCode+"&role=host",{asTrainer:true}),"QR host state");
 const qrControl=async action=>{
  const h=await qrHost();
  return post("control",{code:qrCode,revision:h.revision,action},{asTrainer:true});
 };
 // A learner can never turn their player token into trainer controls, host
 // state, or someone else's room identity.
 assert.equal((await post("control",{code:qrCode,revision:(await qrHost()).revision,
  action:"start"},{token:qrToken})).status,401,"QR participant cannot start the session");
 assert.equal((await get("state?code="+qrCode+"&role=host",{token:qrToken})).status,401,
  "QR participant token cannot read trainer-only session details");
 const crossRoom=ok(await get("state?code="+code,{token:qrToken}),"cross-room public snapshot");
 assert.equal(crossRoom.mine,null,"One room token cannot impersonate a player in another room");
 ok(await qrControl("start"),"QR trainer begins activity one");
 await qrPage.waitForFunction(()=>document.querySelector(".session-progress")?.textContent?.includes("1 / 2")
   &&document.querySelectorAll(".answer-option:not(:disabled)").length>0,null,{timeout:16000});
 await qrPage.locator(".answer-option").first().click({timeout:10000});
 await qrPage.locator(".submit-answer").click({timeout:10000});
 const firstRound=await (async()=>{
  for(let tries=0;tries<24;tries++){
   const r=ok(await get("state?code="+qrCode,{token:qrToken}),"QR round one state");
   if(r.mine?.answered)return r;
   await sleep(400);
  }
  throw Error("QR round one answer was not confirmed by server");
 })();
 assert.equal(firstRound.current,0);
 assert.equal(firstRound.mine?.id,qrUid,"QR identity persists into the first activity");
 ok(await qrControl("close"),"QR trainer closes activity one");
 ok(await qrControl("revealkey"),"QR trainer reveals first result");
 ok(await qrControl("next"),"QR trainer begins second activity without new QR");
 await qrPage.reload({waitUntil:"domcontentloaded"});
 assert.equal(await qrPage.evaluate(c=>localStorage.getItem("arena-player-"+c),qrCode),
  qrToken,"One participant token must survive an actual React page reload");
 assert.ok(!qrPage.url().includes("view=join"),"Second activity must NOT require another QR");
 await qrPage.waitForFunction(()=>document.querySelector(".session-progress")?.textContent?.includes("2 / 2")
   &&document.querySelectorAll(".answer-option:not(:disabled)").length>0,null,{timeout:18000});
 await qrPage.locator(".answer-option").first().click({timeout:10000});
 await qrPage.locator(".submit-answer").click({timeout:10000});
 let secondRound;
 for(let tries=0;tries<24;tries++){
  const r=ok(await get("state?code="+qrCode,{token:qrToken}),"QR round two state");
  if(r.current===1&&r.mine?.answered){secondRound=r;break;}
  await sleep(400);
 }
 assert.ok(secondRound,"Second answer was confirmed by server using the SAME QR identity");
 assert.equal(secondRound.mine.id,qrUid);
 assert.equal(secondRound.code,qrCode);
 assert.equal((await qrHost()).players.filter(p=>p.uid===qrUid).length,1,
  "A real React refresh cannot silently create a second participant");
 await qrPage.screenshot({path:path.join(evidence,"06-real-react-qr-second-activity.png")});

 // A SECOND physical-like browser has no first-device localStorage.
 // Restore the same participant from the ORIGINAL session QR, not a second QR
 // or a privileged trainer endpoint. The recovery secret must stay private.
 const transferCtx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,
  reducedMotion:"reduce"});
 userContexts.push(transferCtx);
 await transferCtx.addInitScript(()=>{
  localStorage.setItem("arena-language","en");
  localStorage.setItem("arena-effects","off");
 });
 const transferPage=await transferCtx.newPage();
 transferPage.on("pageerror",e=>jsErrors.push("QR transfer React: "+e.message));
 await transferPage.goto(qrUrl.toString(),{waitUntil:"domcontentloaded"});
 const transferForm=transferPage.locator(".join-page .join-card form");
 await transferForm.waitFor({state:"visible",timeout:16000});
 assert.equal(await transferPage.evaluate(c=>localStorage.getItem("arena-player-"+c),qrCode),null,
  "Independent QR device must start with no participant token");
 await transferPage.locator(".recovery-link").click();
 await transferForm.locator('input[autocomplete="off"][maxlength="30"]').fill("QA-QR-REACT-01");
 await transferForm.locator('input[placeholder="XXXXX-XXXXX-XXXXX-XXXXX"]').fill(shownRecovery);
 // An incorrect recovery code must NEVER sign in or create another participant.
 const incorrectCode=shownRecovery.slice(0,-1)+(shownRecovery.endsWith("A")?"B":"A");
 await transferForm.locator('input[placeholder="XXXXX-XXXXX-XXXXX-XXXXX"]').fill(incorrectCode);
 await transferForm.locator("button.btn.primary").click();
 await transferPage.waitForFunction(()=>document.querySelector(".error-banner")!==null,
  null,{timeout:10000});
 assert.equal(await transferPage.evaluate(c=>localStorage.getItem("arena-player-"+c),qrCode),null,
  "Incorrect recovery must not issue a participant token");
 await transferForm.locator('input[placeholder="XXXXX-XXXXX-XXXXX-XXXXX"]').fill(shownRecovery);
 // Simulate the most dangerous network failure: the Worker commits recovery,
 // but the 200 response is lost. The real form must RETRY the SAME attempt,
 // not issue a new one that would consume and strand the recovery code.
 let droppedRecoveryResponse=false,committedAttemptId=null;
 await transferPage.route("**/api/recover",async route=>{
  const payload=route.request().postDataJSON();
  if(!droppedRecoveryResponse&&payload.recoveryCode===shownRecovery){
   const result=await route.fetch();
   if(result.status()!==200)throw Error("Expected first real recovery response before simulated loss");
   droppedRecoveryResponse=true;committedAttemptId=payload.attemptId;
   await route.abort("failed");return;
  }
  await route.continue();
 });
 await transferForm.locator("button.btn.primary").click();
 await transferPage.waitForFunction(()=>!!document.querySelector(".error-banner")&&
  !document.querySelector(".join-card form button.btn.primary")?.disabled,null,{timeout:12000});
 assert.equal(droppedRecoveryResponse,true,"Test dropped one already-committed server response");
 assert.equal(await transferPage.evaluate(c=>localStorage.getItem("arena-player-"+c),qrCode),null,
  "A lost response does not fabricate a participant token");
 const pendingIntent=await transferPage.evaluate(()=>Object.entries(sessionStorage)
  .filter(([k])=>k.startsWith("arena-recovery-intent-")).map(([,v])=>v));
 assert.ok(pendingIntent.includes(committedAttemptId),
  "The real browser retains the original idempotency attempt across network failure");
 await transferForm.locator("button.btn.primary").click();
 await transferPage.waitForURL(url=>url.searchParams.get("view")==="play"&&
  url.searchParams.get("code")===qrCode,{timeout:16000});
 await transferPage.unroute("**/api/recover");
 const renewedModal=transferPage.locator(".recovery-welcome[role=dialog]");
 await renewedModal.waitFor({state:"visible",timeout:12000});
 const nextRecovery=await renewedModal.locator(".recovery-code").innerText();
 assert.match(nextRecovery,/^[A-F0-9]{5}(?:-[A-F0-9]{5}){3}$/);
 assert.notEqual(nextRecovery,shownRecovery,"Successful device transfer must rotate the recovery code");
 const rejectedOld=await post("recover",{code:qrCode,employeeId:"QA-QR-REACT-01",
  recoveryCode:shownRecovery,attemptId:crypto.randomUUID()});
 assert.equal(rejectedOld.status,401,"Already consumed recovery code cannot authorize a fresh transfer");
 await transferPage.reload({waitUntil:"domcontentloaded"});
 await transferPage.locator(".recovery-welcome .recovery-code").waitFor({state:"visible",timeout:10000});
 assert.equal(await transferPage.locator(".recovery-welcome .recovery-code").innerText(),
  nextRecovery,"New code stays visible after reload until the trainee acknowledges saving it");
 await transferPage.locator(".recovery-welcome button.btn.primary").click();
 await transferPage.locator(".recovery-welcome").waitFor({state:"detached",timeout:10000});
 const transferredToken=await transferPage.evaluate(c=>localStorage.getItem("arena-player-"+c),qrCode);
 assert.ok(transferredToken&&transferredToken!==qrToken,
  "A new device gets a fresh token and invalidates the old token");
 const restored=ok(await get("state?code="+qrCode,{token:transferredToken}),"QR real React recovery");
 assert.equal(restored.mine?.id,qrUid,"Recovery preserves participant identity");
 assert.equal(restored.individual.find(p=>p.uid===qrUid)?.score,
  secondRound.individual.find(p=>p.uid===qrUid)?.score,
  "Recovery preserves server-scored points from both previous rounds");
 const revoked=ok(await get("state?code="+qrCode,{token:qrToken}),"Old QR device after transfer");
 assert.equal(revoked.mine,null,"Original device token must be invalid after transfer");
 assert.equal((await qrHost()).players.filter(p=>p.uid===qrUid).length,1,
  "Moving devices must not duplicate a participant in the same room");
 assert.equal((await post("control",{code:qrCode,revision:(await qrHost()).revision,
   action:"close"},{token:transferredToken})).status,401,
  "Transferred trainee credentials never acquire trainer privileges");
 assert.ok(!transferPage.url().includes(transferredToken)&&
  !transferPage.url().includes(shownRecovery),"No recovery secrets in the browser URL");
 await transferPage.screenshot({path:path.join(evidence,"07-real-react-qr-device-transfer.png")});
 console.log("QR_DEVICE_TRANSFER_PASS",JSON.stringify({
  independentBrowser:true,originalJoinQR:true,invalidCodeRejected:true,
  identityRestored:true,scorePreserved:true,oldTokenRevoked:true,
  noDuplicateParticipant:true,trainerPermissionsStillBlocked:true,fixtureOnly:true
 }));

 console.log("UNIFIED_QR_REAL_REACT_PASS",JSON.stringify({
  mobileViewport:390,oneJoinUrl:true,sameRoom:true,twoActivities:true,
  reloadKeepsIdentity:true,trainerControlsBlocked:true,crossRoomIdentityBlocked:true,
  trainerLoginNotRequiredForTrainee:true,fixtureOnly:true
 }));
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
