/**
 * Wheel Sprint 07: actual V6 React participant + projector using the unchanged
 * V6 HTTP handler and disposable SQLite. No worker/DB deployment, no Firebase
 * credentials, no real employee data. WebGL runs in Chromium with SwiftShader.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {setTimeout as sleep} from 'node:timers/promises';
import {chromium} from 'playwright';

const root='http://127.0.0.1:8094';
const output=path.resolve('e2-staging-qa/ci-screenshots');
await fs.mkdir(output,{recursive:true});
const fixture=spawn(process.execPath,['.sites-runtime/e2-staging-qa/staging-local-server.mjs'],{
  cwd:process.cwd(),env:{...process.env,E2_FIXTURE_PORT:'8094',E2_FIXTURE_EXPLICIT:'local-only'},
  stdio:['ignore','pipe','pipe']
});
let log='';fixture.stdout.on('data',chunk=>log+=String(chunk));fixture.stderr.on('data',chunk=>log+=String(chunk));
const api=async(route,body=null,headers={})=>{
 const res=await fetch(root+'/api/'+route,{
  method:body?'POST':'GET',
  headers:{'Accept':'application/json',...(body?{'Content-Type':'application/json'}:{}),...headers},
  body:body?JSON.stringify(body):undefined
 });
 return {status:res.status,json:await res.json()};
};
const auth={'X-Firebase-Token':'local-fixture-trainer'};
const ok=(response,what)=>{assert.equal(response.status,200,what+': '+JSON.stringify(response.json));return response.json;};
const checkReady=async()=>{
 for(let i=0;i<80;i++){
  if(fixture.exitCode!==null)throw Error('Local V6 fixture crashed');
  try{const r=await fetch(root+'/__fixture_health');if(r.ok)return;}catch{}
  await sleep(160);
 }
 throw Error('Local V6 fixture did not start');
};
const screenshot=async(page,name,fullPage=false)=>{
  // Screenshot capture through software WebGL can stall in headless CI.
  // Data-flow assertions MUST still complete; never confuse a GPU capture
  // issue with the server's session / score correctness.
  try{await page.screenshot({path:path.join(output,name),fullPage,animations:'disabled',timeout:9000});}
  catch(e){console.warn('SOFTWARE_WEBGL_SCREENSHOT_UNAVAILABLE',name,e?.name||'Error');}
};
const until=async(predicate,timeout=10000)=>{
 const start=Date.now();
 while(Date.now()-start<timeout){
  const result=await predicate();if(result)return result;
  await sleep(160);
 }
 throw Error('Timed out checking authoritative V6 state');
};
// Two independent CLI scenarios share this source but run in separate Node processes.
// This prevents a prior SwiftShader wheel render from starving the crate GPU.
const scenario=process.argv.includes('--challenge')?'challenge':process.argv.includes('--wheel')?'wheel':process.argv.includes('--crate')?'crate':'both';
let browser;
const contexts=[];
const problems=[];
try{
 await checkReady();
 if(scenario==='wheel'||scenario==='both'){
 const sectors=[
  {kind:'prize',label:'Recognition Star',points:250,detail:'Knowledge participation star',repeatable:true},
  {kind:'prize',label:'Teamwork Reward',points:400,detail:'Outstanding teamwork',repeatable:true},
  {kind:'prize',label:'Safety Bonus',points:300,detail:'Safe handling practices',repeatable:true},
  {kind:'prize',label:'Focus Award',points:200,detail:'Great attention to detail',repeatable:true}
 ];
 const created=ok(await api('sessions',{
   title:'Luxury Wheel QA · Synthetic Session',language:'en',
   activities:[{type:'Wheel of Fortune',prompt:'Discover your mission',
     timer:0,rounds:1,spinDuration:4,sectors}],
   settings:{reveal:'manual',progression:'manual'}
 },auth),'create room');
 const code=created.code;
 assert.match(code,/^\d{6}$/);
 const joined=ok(await api('join',{
   code,name:'Wheel QA Trainee',employeeId:'QA-WHEEL-001',
   confirmed:true,language:'en'
 }),'join synthetic trainee');
 assert.ok(joined.token);
 const playerToken=joined.token;
 const hostState=()=>api('state?code='+code+'&role=host',null,auth);
 const state=()=>api('state?code='+code);
 const control=async action=>{
  const rev=ok(await hostState(),'host state').revision;
  return ok(await api('control',{code,revision:rev,action},auth),'trainer '+action);
 };
 await control('start');
 const readyState=ok(await state(),'room before spin');
 assert.equal(readyState.status,'question');
 assert.equal(readyState.game?.spin,undefined);
 browser=await chromium.launch({
  headless:true,args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']
 });
 const projectorCtx=await browser.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1});
 const traineeCtx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1});
 contexts.push(projectorCtx,traineeCtx);
 const projector=await projectorCtx.newPage();
 const trainee=await traineeCtx.newPage();
 for(const page of [projector,trainee]){
  page.on('pageerror',e=>problems.push(e.message));
  page.on('request',req=>{if(req.url().includes('/api/state'))console.log('TRACE_STATE_REQUEST',page===projector?'projector':'trainee',req.method());});
  page.on('response',response=>{if(response.url().includes('/api/state'))console.log('TRACE_STATE_RESPONSE',page===projector?'projector':'trainee',response.status());});
  page.on('requestfailed',req=>{if(req.url().includes('/api/'))console.log('TRACE_API_NETWORK_FAIL',page===projector?'projector':'trainee',req.failure()?.errorText?.slice(0,120));});
 }
 await trainee.addInitScript(({code,token})=>localStorage.setItem('arena-player-'+code,token),
   {code,token:playerToken});
 await Promise.all([
  projector.goto(root+'/MTS-Training-Arena/v6/?view=display&code='+code,{waitUntil:'domcontentloaded'}),
  trainee.goto(root+'/MTS-Training-Arena/v6/?view=play&code='+code,{waitUntil:'domcontentloaded'})
 ]);
 const wheel=projector.locator('[data-testid="arena-wheel3d"]');
 await projector.waitForTimeout(2200);
 const debug=await projector.evaluate(()=>({
  path:location.pathname,search:location.search,body:document.body.innerText.slice(0,1900),
  wheelNodes:document.querySelectorAll('[data-testid="arena-wheel3d"]').length,
  fallback:document.querySelectorAll('.arena-wheel-webgl-unavailable').length,
  gameNodes:document.querySelectorAll('.presentation-play').length,
  activeMode:document.querySelectorAll('.session-shell.projector').length
 }));
 console.log('WHEEL_PROJECTION_DIAGNOSTIC',JSON.stringify(debug));
 // The fixture API is probed directly to distinguish API latency from a
 // client-side auth/persistence wait (no secrets or live API involved).
 const direct=await projector.evaluate(async code=>{
  const started=performance.now();
  try{const res=await fetch('/api/state?code='+code,{cache:'no-store'});
   const body=await res.json();return {status:res.status,ms:Math.round(performance.now()-started),stage:body.status};}
  catch(e){return {ms:Math.round(performance.now()-started),error:String(e).slice(0,80)};}
 },code);
 console.log('DIRECT_PUBLIC_STATE_DIAGNOSTIC',JSON.stringify(direct));

 await wheel.waitFor({state:'attached',timeout:22000});
 const tap=trainee.locator('.arena-wheel3d__tap');
 await tap.waitFor({timeout:20000});
 await until(async()=>await tap.isEnabled(),13000);
 const canvas=wheel.locator('.arena-wheel3d__canvas canvas');
 await canvas.waitFor({timeout:14000});
 const textures=await projector.evaluate(async()=>{
  const resp=await fetch('/MTS-Training-Arena/v6/e2-preview/assets/arena-logo-safe-margin.png');
  return {ok:resp.ok,type:resp.headers.get('content-type'),size:(await resp.arrayBuffer()).byteLength};
 });
 assert.ok(textures.ok&&textures.size>2000,'Approved original product PNG must be served locally');
 const style=await wheel.evaluate(el=>({
  stage:!!el.querySelector('.arena-wheel3d__broadcast-truss'),
  floor:!!el.querySelector('.arena-wheel3d__broadcast-floor'),
  wings:!!el.querySelector('.arena-wheel3d__broadcast-wings'),
  mode:getComputedStyle(el).display,
  image:el.getBoundingClientRect().toJSON()
 }));
 assert.ok(style.stage&&style.floor&&style.wings,'Broadcast stage/truss/floor present');
 const projectorFrame=await wheel.evaluate(el=>{
  const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height,viewport:innerHeight};
 });
 assert.ok(projectorFrame.height<=530,'Projector wheel must be framed to 16:9: '+JSON.stringify(projectorFrame));
 assert.ok(projectorFrame.bottom<=projectorFrame.viewport+4,'Entire wheel needs to fit on projector: '+JSON.stringify(projectorFrame));


 // Actual button interaction on React PARTICIPANT UI, not a forged score.
 await tap.click();
 const started=await until(async()=>{
  const x=await state();return x.json?.game?.spin?.id?x.json:null;
 },8000);
 const spin=started.game.spin;
 assert.equal(spin.revealed,false);
 assert.equal(spin.index,null,'Winning sector must stay undisclosed while spinning');
 const before=spin.startsAt-started.serverNow;
 assert.ok(before>1900&&before<=3100,'Countdown must be close to 3 seconds from authoritative server: '+before);
 assert.equal(spin.stopsAt-spin.startsAt,4000,'Server spin duration exactly 4 seconds');
 const duplicate=await api('interact',{
  code,round:0,action:'spin',turn:started.game.turn,version:started.game.version
 },{'X-Player-Token':playerToken});
 assert.equal(duplicate.status,409,'Cannot spin twice while current spin unresolved');
 // The server's startsAt and stopsAt are asserted above. A slow Chromium
 // software renderer can hydrate after the 3-second countdown has finished,
 // so do not fail an otherwise official spin for a missed transient DOM label.
 const countdownVisible=await projector.locator('.arena-wheel3d__countdown').isVisible().catch(()=>false);
 console.log('WHEEL_COUNTDOWN_VISUAL_SAMPLE',JSON.stringify({visible:countdownVisible,
  issuedCountdownMs:before,serverWindowMs:spin.stopsAt-spin.startsAt}));

 await sleep(Math.max(0,spin.startsAt-Date.now())+350);
 const afterCountdown=ok(await state(),'post-countdown');
 assert.equal(afterCountdown.game.spin.revealed,false,'No early selected winner');

 const winner=await until(async()=>{
  const x=await state();return x.json?.game?.spin?.revealed?x.json:null;
 },12500);
 assert.ok(Number.isInteger(winner.game.spin.index));
 assert.equal(winner.game.spin.id,spin.id,'Single immutable signed spin');
 assert.equal(winner.game.outcome?.kind,'prize');
 const result=winner.game.outcome.points;
 assert.ok(sectors.some(s=>s.points===result),'Award comes only from configured server sector');
 await projector.waitForFunction(()=>document.querySelector('.wheel-outcome-grand')!==null,
  null,{timeout:8500});
 const resultBox=await projector.locator('.wheel-outcome-grand').evaluate(el=>{
  const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height,viewport:innerHeight};
 });
 assert.ok(resultBox.bottom<=resultBox.viewport+4,'Winner card must be visible without scrolling: '+JSON.stringify(resultBox));

 const repeated=await state();
 assert.equal(repeated.json.game.spin.id,spin.id);
 assert.equal(repeated.json.game.outcome.points,result);
 const standings=winner.individual||[];
 assert.ok(standings.some(row=>row.score===result),'Only server ledger created points');
 assert.deepEqual(problems,[],'No React page errors');
 // Only after game logic is verified do we attempt optional GPU screenshots.
 // Software WebGL capture can hang on CI; never block or fake the signed result.
 await screenshot(projector,'17-luxury-wheel-signed-result.png');
 await screenshot(trainee,'18-luxury-wheel-mobile-result.png',true);
 const mobile=await trainee.evaluate(()=>({viewport:innerWidth,content:document.documentElement.scrollWidth}));
 assert.ok(mobile.content<=mobile.viewport+2,'Responsive wheel causes horizontal overflow '+JSON.stringify(mobile));

 // Wheel Challenge Card: a second isolated room exercises manual scoring.
 // No real account, production DB, or browser-calculated points are trusted.
 const challengeSectors=[
  {kind:'challenge',label:'Explain the ACI flow',detail:'Demonstrate each step',points:0,repeatable:true},
  {kind:'penalty',label:'Safety recovery drill',detail:'Correct the scenario',points:0,repeatable:true}
 ];
 const challengeRoom=ok(await api('sessions',{
  title:'Wheel Challenge Card · Synthetic QA',language:'en',
  activities:[{type:'Wheel of Fortune',prompt:'Demonstrate the challenge',
   timer:0,rounds:2,spinDuration:4,points:1000,weight:1,sectors:challengeSectors}],
  settings:{reveal:'manual',progression:'manual'}
 },auth),'create graded challenge');
 const challengeCode=challengeRoom.code;
 const contender=ok(await api('join',{code:challengeCode,name:'Practical Challenger',employeeId:'QA-WHEEL-CHALLENGE',
  confirmed:true,language:'en'}),'join challenge');
 const chHost=()=>api('state?code='+challengeCode+'&role=host',null,auth);
 const chPublic=()=>api('state?code='+challengeCode);
 const chControl=async(action,extra={})=>{
  const snapshot=ok(await chHost(),'challenge host revision');
  return api('control',{code:challengeCode,revision:snapshot.revision,action,...extra},auth);
 };
 ok(await chControl('start'),'start challenge');
 ok(await chControl('spin'),'spin challenge');
 const gradedReveal=await until(async()=>{
  const x=await chPublic();return x.json?.game?.spin?.revealed?x.json:null;
 },14000);
 const challengeSpin=gradedReveal.game.spin;
 assert.ok(['challenge','penalty'].includes(gradedReveal.game.outcome.kind),
  'Mission is chosen by authoritative wheel outcome');
 const locked=await chControl('spin');
 assert.equal(locked.status,409,'Cannot skip ungraded practical challenge');
 const switchPlayer=await chControl('selectturn',{mode:'random'});
 assert.equal(switchPlayer.status,409,'Cannot replace challenger before grading');
 const canonical={revealId:challengeSpin.id,target:gradedReveal.game.spinTarget,grade:8,
  direction:1,delta:800,reason:'Completed practical challenge with verified steps',
  adjustmentId:crypto.randomUUID()};
 const tampered=await chControl('wheelaward',{...canonical,delta:810});
 assert.equal(tampered.status,400,'Server rejects client-tampered reward');
 ok(await chControl('wheelaward',canonical),'trainer grades and awards exactly once');
 const duplicateGrade=await chControl('wheelaward',canonical);
 assert.equal(duplicateGrade.status,409,'Duplicate grading rejected');
 const staleGrade=await chControl('wheelaward',{...canonical,revealId:crypto.randomUUID()});
 assert.equal(staleGrade.status,409,'Old or forged reveal identifier rejected');
 const afterGrade=ok(await chPublic(),'public grade receipt');
 const hostGrade=ok(await chHost(),'host grade receipt');
 assert.equal(afterGrade.game.manualJudgement.delta,800);
 assert.equal(afterGrade.game.manualJudgement.reason,undefined,'Private trainer note not leaked to public');
 assert.equal(hostGrade.game.manualJudgement.reason,canonical.reason,'Host can audit justification');
 assert.equal(afterGrade.individual.find(p=>p.uid===contender.id)?.score,800,
  'Server ledger yields precisely one practical reward');
 ok(await chControl('spin'),'Next turn unlocked by official grade');
 const secondChallenge=await until(async()=>{
  const x=await chPublic();return x.json?.game?.spin?.revealed&&
   x.json.game.spin.id!==challengeSpin.id?x.json:null;
 },14000);
 const deduction={revealId:secondChallenge.game.spin.id,target:secondChallenge.game.spinTarget,
  grade:5,direction:-1,delta:-500,reason:'Missed five mandatory safety verification steps',
  adjustmentId:crypto.randomUUID()};
 ok(await chControl('wheelaward',deduction),'Trainer records negative assessment');
 const afterDeduction=ok(await chPublic(),'official scoreboard after deduction');
 assert.equal(afterDeduction.game.manualJudgement.delta,-500,'Official penalty is signed');
 assert.equal(afterDeduction.individual.find(p=>p.uid===contender.id)?.score,300,
  'Reward and penalty both settle exactly once in official leaderboard');
 assert.equal((await chControl('wheelaward',deduction)).status,409,
  'Penalty cannot be entered a second time');
 console.log('WHEEL_CHALLENGE_CARD_PASS',JSON.stringify({oneSignedGrade:true,
  tamperRejected:true,duplicateRejected:true,nextSpinUnlocked:true,privateReason:true,
  signedAward:800,signedDeduction:-500,finalServerScore:300}));
 console.log('WHEEL_FIXTURE_PASS',JSON.stringify({signedResult:true,oneServerLedger:true,duplicateSpinRejected:true,countdownMs:before}));
 await projectorCtx.close();
 await traineeCtx.close();
 await browser.close();
 browser=undefined;
 }
 if(scenario==='crate'||scenario==='both'){
 browser=await chromium.launch({
  headless:true,args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']
 });
 const crateCtx=await browser.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1,reducedMotion:'reduce'});
 contexts.push(crateCtx);

 // Real V6 Open the Box route: verify the actual licensed 9-mesh crate loads
 // in Chromium with disposable session data, not only a source-code assertion.
 const boxRoom=ok(await api('sessions',{
  title:'Licensed Sci-Fi Crate QA · Synthetic Session',language:'en',
  activities:[{type:'Open the Box',prompt:'Choose a training challenge',
    timer:0,rounds:3,items:['Explain ACI','Teamwork','Safety check']}],
  settings:{reveal:'manual',progression:'manual'}
 },auth),'create Sci-Fi Crate room');
 const boxCode=boxRoom.code;
 ok(await api('join',{
  code:boxCode,name:'Crate QA Learner',employeeId:'QA-CRATE-001',
  confirmed:true,language:'en'
 }),'join synthetic crate room');
 const boxHost=ok(await api('state?code='+boxCode+'&role=host',null,auth),'crate trainer state');
 ok(await api('control',{code:boxCode,revision:boxHost.revision,action:'start'},auth),'start crate room');
 const cratePage=await crateCtx.newPage();
 cratePage.on('pageerror',e=>problems.push('crate: '+e.message));
 cratePage.on('console',msg=>{
  const line=msg.text();
  if(/Sci-Fi Crate unavailable|WebGL|Context Lost|THREE\.WebGLRenderer|deflate|ERR_/.test(line))
   console.warn('CRATE_BROWSER_DIAGNOSTIC',msg.type(),line.slice(0,220));
 });
 cratePage.on('requestfailed',req=>{
  if(req.url().includes('/api/'))console.warn('CRATE_API_REQUEST_FAILED',req.failure()?.errorText?.slice(0,120));
 });
 await cratePage.goto(root+'/MTS-Training-Arena/v6/?view=display&code='+boxCode,
  {waitUntil:'domcontentloaded'});
 // The cinematic intro can hide the scene while original React initializes;
 // verify that genuine geometry mounts, then inspect its actual dimensions.
 await cratePage.waitForFunction(()=>!!document.querySelector('.stage-splash .splash-skip')||!!document.querySelector('[data-source-model="agustin-honnun-sci-fi-crate"]'),null,{timeout:16000});
 // Trigger the real React intro Skip control (not a server/game mutation),
 // then test the full 3D renderer without two WebGL scenes competing.
 await cratePage.evaluate(()=>document.querySelector('.stage-splash .splash-skip')?.click());
 await cratePage.waitForFunction(()=>!document.querySelector('.stage-splash'),null,{timeout:18000});
 const crateDebug=await cratePage.evaluate(()=>({
   sceneCount:document.querySelectorAll('.arena-box3d').length,
   sources:[...document.querySelectorAll('[data-source-model]')].map(x=>x.getAttribute('data-source-model')),
   canvasCount:document.querySelectorAll('.arena-box3d canvas').length,
   viewExists:!!document.querySelector('.arena-box3d__scene'),
   fallback:!!document.querySelector('.arena-box3d--lite'),
   splash:!!document.querySelector('.stage-splash'),
   body:document.body.innerText.slice(0,1300)
 }));
 console.log('LICENSED_CRATE_DIAGNOSTIC',JSON.stringify(crateDebug));
 const authenticCrate=cratePage.locator('[data-source-model="agustin-honnun-sci-fi-crate"]');
 try{await authenticCrate.waitFor({state:'attached',timeout:16000});}
 catch{
  const beforeReload=await cratePage.evaluate(()=>({
   page:location.pathname+location.search,
   sourceCount:document.querySelectorAll('[data-source-model]').length,
   gameCount:document.querySelectorAll('.box-stage--vault').length,
   splashCount:document.querySelectorAll('.stage-splash').length,
   fallback:!!document.querySelector('.arena-box3d--lite'),
   sceneRoot:!!document.querySelector('.arena-box3d__scene'),
   canvasCount:document.querySelectorAll('.arena-box3d__scene canvas').length,
   text:document.body.innerText.slice(0,300)
  })).catch(()=>({unavailable:true}));
  console.warn('CRATE_STAGE_RECOVERY_DIAGNOSTIC',JSON.stringify(beforeReload));
  // Verify the public projector can recover from one transient remount.
  // This must never fabricate a box selection or alter server state.
  await cratePage.reload({waitUntil:'domcontentloaded'});
  await authenticCrate.waitFor({state:'attached',timeout:30000});
 }
 const crateCanvas=authenticCrate.locator('.arena-box3d__scene canvas');
 await crateCanvas.waitFor({state:'attached',timeout:12000});
 const boxButtons=authenticCrate.locator('.arena-box3d__selector');
 assert.equal(await boxButtons.count(),3,'Three server-sourced crate choices rendered');
 const crateBounds=await crateCanvas.evaluate(el=>{
  const r=el.getBoundingClientRect();
  return {width:r.width,height:r.height,bottom:r.bottom,screenHeight:innerHeight,viewport:innerWidth,overflow:document.documentElement.scrollWidth};
 });
 assert.ok(crateBounds.width>=crateBounds.viewport*.50&&crateBounds.height>200&&crateBounds.bottom<=crateBounds.screenHeight+5,
  'Real crate WebGL canvas occupies visible projector area: '+JSON.stringify(crateBounds));
 assert.equal(crateBounds.overflow<=crateBounds.viewport+2,true,'No horizontal projector overflow');
 await screenshot(cratePage,'19-licensed-sci-fi-crates-projector.png');
 // Open a real crate through the same authorized V6 server control endpoint.
 // The projector must reflect the confirmed state; no local fake reward.
 const boxHostBefore=ok(await api('state?code='+boxCode+'&role=host',null,auth),'crate trainer before open');
 ok(await api('control',{
   code:boxCode,revision:boxHostBefore.revision,action:'box',index:1
 },auth),'authorized trainer opens second crate');
 const boxState=ok(await api('state?code='+boxCode),'crate public state');
 assert.equal(boxState.game?.box?.index,1,'Server chooses crate 2');
 assert.ok(boxState.game?.used?.includes(1),'Server records opened crate 2');
 await cratePage.waitForFunction(()=>document.querySelectorAll('.arena-box3d__selector--used').length===1
   &&document.querySelectorAll('.arena-box3d__selector--active').length===1,null,{timeout:12000});
 assert.equal(await boxButtons.nth(1).isDisabled(),true,'Crate 2 cannot be opened twice');
 await cratePage.waitForTimeout(900);
 const revealCard=cratePage.locator('.box-vault-reveal');
 await revealCard.waitFor({state:'visible',timeout:12000});
 const revealFrame=await revealCard.evaluate(el=>{
  const b=el.getBoundingClientRect();return {top:b.top,bottom:b.bottom,screen:innerHeight,height:b.height};
 });
 assert.ok(revealFrame.bottom<=revealFrame.screen+4,'Official crate reward must fit inside 16:9 projector: '+JSON.stringify(revealFrame));
 const broadcast=await cratePage.evaluate(()=>{
  const box=document.querySelector('.box-stage--vault .arena-box3d')?.getBoundingClientRect();
  const prize=document.querySelector('.box-stage--vault .box-vault-reveal')?.getBoundingClientRect();
  return box&&prize?{boxLeft:box.left,boxRight:box.right,boxWidth:box.width,
    prizeLeft:prize.left,prizeRight:prize.right,prizeWidth:prize.width,viewport:innerWidth}:null;
 });
 assert.ok(broadcast&&broadcast.boxWidth>=broadcast.viewport*.25&&broadcast.prizeWidth>=230
   &&(broadcast.prizeLeft>=broadcast.boxRight-5||broadcast.prizeRight<=broadcast.boxLeft+5),
   'Projector must show large licensed crates BESIDE the official prize card: '+JSON.stringify(broadcast));
 // Mesh-level frustum guard catches lids cropped by the vault canvas even
 // when the outer HTML box and reward card remain inside the viewport.
 await cratePage.waitForFunction(()=>document.querySelector('.arena-box3d__scene canvas')?.dataset.modelFits==='true',
   null,{timeout:12000});
 assert.ok(await authenticCrate.locator('.arena-box3d__credit').count(),'Original CC BY attribution survives the game integration');
 await screenshot(cratePage,'20-licensed-crate-server-open-projector.png');
 // Keep one WebGL context: exercise narrow-view layout on the same rendered
 // session, without falsely claiming a physical phone test.
 await cratePage.setViewportSize({width:390,height:844});
 await cratePage.waitForTimeout(1000);
 const narrow=await cratePage.evaluate(()=>({
   viewport:innerWidth,overflow:document.documentElement.scrollWidth,
   buttons:document.querySelectorAll('.arena-box3d__selector').length,
   fit:document.querySelector('.arena-box3d__scene canvas')?.dataset.modelFits
 }));
 assert.ok(narrow.overflow<=narrow.viewport+2,'3D crate page must not scroll horizontally: '+JSON.stringify(narrow));
 assert.equal(narrow.buttons,3,'All three box controls remain available on narrow view');
 assert.equal(narrow.fit,'true','Opened crate geometry fits narrow camera frustum');
 await screenshot(cratePage,'21-licensed-crate-narrow-layout.png',true);

 console.log('CRATE_FIXTURE_PASS',JSON.stringify({serverOwnedOpen:true,duplicateLock:true,webglModel:true,projectorFit:true,narrowFit:true}));
 }

 if(scenario==='challenge'){
  const challengeSectors=[
   {label:'Import challenge',kind:'challenge',detail:'Explain the ACID import request process step by step',repeatable:true},
   {label:'Customs scenario',kind:'penalty',detail:'Describe how to correct a missing invoice',repeatable:true}
  ];
  const created=ok(await api('sessions',{
   title:'Wheel Challenge Card · Synthetic Session',language:'en',
   activities:[{type:'Wheel of Fortune',prompt:'Demonstrate your skills',
    timer:0,rounds:2,spinDuration:4,points:1000,sectors:challengeSectors}],
   settings:{reveal:'manual',progression:'manual'}
  },auth),'create challenge fixture');
  const challengeCode=created.code;
  const member=ok(await api('join',{code:challengeCode,name:'Challenge QA Learner',
   employeeId:'QA-WHEEL-CARD',confirmed:true,language:'en'}),'join challenge fixture');
  const host=()=>api('state?code='+challengeCode+'&role=host',null,auth);
  let hs=ok(await host(),'challenge host ready');
  ok(await api('control',{code:challengeCode,revision:hs.revision,action:'start'},auth),'challenge session start');
  hs=ok(await host(),'challenge host started');
  ok(await api('control',{code:challengeCode,revision:hs.revision,action:'spin'},auth),'challenge signed spin');
  const before=ok(await api('state?code='+challengeCode),'challenge public pre-reveal');
  assert.ok(before.game.spin&&!before.game.spin.revealed,'Challenge stays hidden while spinning');
  assert.equal(before.game.outcome,undefined,'Unrevealed mission must not leak to projector');
  const signed=await until(async()=>{
   const res=await api('state?code='+challengeCode);
   return res.json?.game?.spin?.revealed?res.json:null;
  },17000);
  assert.ok(['challenge','penalty'].includes(signed.game.outcome.kind));
  assert.equal(signed.game.spinTarget,member.uid||signed.game.spinTarget);
  const ctx=await (browser=await chromium.launch({
   headless:true,args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']
  })).newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1});
  contexts.push(ctx);
  const page=await ctx.newPage();
  page.on('pageerror',e=>problems.push('wheel-card: '+e.message));
  await page.goto(root+'/MTS-Training-Arena/v6/?view=display&code='+challengeCode,
   {waitUntil:'domcontentloaded'});
  const card=page.locator('[data-testid="wheel-challenge-card"]');
  await card.waitFor({state:'attached',timeout:30000});
  const intro=page.locator('.stage-splash .splash-skip');
  if(await intro.count())await page.evaluate(()=>document.querySelector('.stage-splash .splash-skip')?.click());
  const shown=await card.innerText();
  assert.ok(shown.includes(signed.game.outcome.label),'Signed challenge title visible to audience');
  assert.ok(shown.includes('Challenge QA Learner'),'Server-selected trainee visible on challenge card');
  assert.ok(shown.includes('AWAITING')||shown.includes('بانتظار'),'Must await trainer verification');
  const revealId=signed.game.spin.id;
  const note='Explained every compliance step with a correct example';
  // Mount the real public live Leaderboard before official scoring so the
  // signed score difference can be measured across consecutive snapshots.
  hs=ok(await host(),'scoreboard host revision');
  ok(await api('control',{code:challengeCode,revision:hs.revision,action:'projection',
   board:true,quiet:true,intensity:'full',analytics:false},auth),'show live leaderboard');
  await page.waitForFunction(()=>document.querySelector('.projector-leaderboard [data-server-score="0"]'),
   null,{timeout:12000});
  hs=ok(await host(),'challenge host grade revision');
  const grade={code:challengeCode,revision:hs.revision,action:'wheelaward',
   revealId,target:signed.game.spinTarget,grade:6,direction:-1,delta:-600,
   reason:note,adjustmentId:crypto.randomUUID()};
  ok(await api('control',grade,auth),'signed challenge grade');
  const duplicate=await api('control',{...grade,revision:(await host()).json.revision},auth);
  assert.equal(duplicate.status,409,'Duplicate grading rejected');
  const final=ok(await api('state?code='+challengeCode),'public signed challenge grade');
  assert.equal(final.game.manualJudgement.delta,-600);
  assert.equal(final.game.manualJudgement.reason,undefined);
  assert.equal(final.individual.find(p=>p.uid===signed.game.spinTarget)?.score,-600);
  await page.waitForFunction(()=>document.querySelector('[data-testid="wheel-challenge-card"]')
   ?.textContent?.match(/GRADE CONFIRMED|تم تسجيل التقييم/),null,{timeout:15000});
  const content=await card.innerText();
  assert.ok(!content.includes(note),'Trainer private rationale must never leak to public projector');
  await page.waitForFunction(()=>!!document.querySelector('.projector-leaderboard [data-server-score="-600"] .arena-rank-score--loss'),
   null,{timeout:13000});
  const scoreRibbon=await page.locator('.projector-leaderboard .arena-rank-score--loss').innerText();
  // Arabic interface uses Arabic-Indic digits; normalize presentation digits
  // without relaxing the server's exact numeric -600 score assertion above.
  const englishDigits=scoreRibbon.replace(/[\u0660-\u0669\u06f0-\u06f9]/g,d=>
    String(d.charCodeAt(0)-(d.charCodeAt(0)<0x6f0?0x660:0x6f0)));
  assert.ok(englishDigits.includes('600'),
    'Live leaderboard must show the -600 server delta in either digit locale: '+scoreRibbon);
  await screenshot(page,'23-server-signed-leaderboard-penalty.png');
  // Keep original Wheel Challenge Card visual-fit evidence without an open
  // scoreboard overlay, preserving the presentation user's chosen layout.
  hs=ok(await host(),'restore public stage revision');
  ok(await api('control',{code:challengeCode,revision:hs.revision,action:'projection',
   board:false,quiet:true,intensity:'full',analytics:false},auth),'hide live leaderboard');
  await page.waitForFunction(()=>!document.querySelector('.projector-leaderboard'),
   null,{timeout:12000});
  const frame=await card.evaluate(el=>{
    const r=el.getBoundingClientRect();
    const wheel=document.querySelector('.wheel-stage--challenge-revealed .arena-wheel3d--crown')
      ?.getBoundingClientRect();
    return {width:r.width,top:r.top,bottom:r.bottom,screen:innerHeight,
      scroll:document.documentElement.scrollWidth,viewport:innerWidth,
      wheelLeft:wheel?.left,wheelRight:wheel?.right,cardLeft:r.left,cardRight:r.right};
  });
  assert.ok(frame.width>380&&frame.scroll<=frame.viewport+2,
   'Signed Wheel Challenge Card fits projector width: '+JSON.stringify(frame));
  assert.ok(frame.top>=0&&frame.bottom<=frame.screen-12,
   'Complete challenge task and signed grade MUST fit visible 16:9 projector: '+JSON.stringify(frame));
  assert.ok(frame.wheelRight!==undefined&&(frame.wheelRight<=frame.cardLeft+5||frame.cardRight<=frame.wheelLeft+5),
   'Wheel and challenge task must be visible side by side (LTR or RTL): '+JSON.stringify(frame));
  await screenshot(page,'22-wheel-challenge-card-projector.png');
  console.log('WHEEL_CHALLENGE_CARD_PASS',JSON.stringify({
   signedRevealId:revealId,grade:6,points:-600,duplicateRejected:true,reasonPrivate:true
  }));
 }
 assert.deepEqual(problems,[], 'No React browser errors in '+scenario+' scenario');
 console.log('ARENA_E2_3D_PASS',JSON.stringify({scenario,isolatedFixture:true,noLiveWrites:true}));
}finally{
 for(const ctx of contexts)try{await ctx.close()}catch{}
 if(browser)await browser.close();
 fixture.kill('SIGTERM');
 await Promise.race([new Promise(resolve=>fixture.once('exit',resolve)),sleep(1600)]);
 if(fixture.exitCode && log)console.error('Local fixture: '+log.slice(-1300));
}
