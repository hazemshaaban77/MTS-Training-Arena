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
let browser;
const contexts=[];
const problems=[];
try{
 await checkReady();
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
 await projector.waitForFunction(()=>document.querySelector('.arena-wheel3d__countdown')!==null,
  null,{timeout:6000});

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
 // Release both expensive WebGL wheel views before the separate crate scene.
 await projector.close();
 await trainee.close();

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
 const cratePage=await projectorCtx.newPage();
 cratePage.on('pageerror',e=>problems.push('crate: '+e.message));
 await cratePage.goto(root+'/MTS-Training-Arena/v6/?view=display&code='+boxCode,
  {waitUntil:'domcontentloaded'});
 // The cinematic intro can hide the scene while original React initializes;
 // verify that genuine geometry mounts, then inspect its actual dimensions.
 await cratePage.waitForFunction(()=>!!document.querySelector('.stage-splash .splash-skip')||!!document.querySelector('[data-source-model="agustin-honnun-sci-fi-crate"]'),null,{timeout:16000});
 const introSkip=cratePage.locator('.stage-splash .splash-skip');
 if(await introSkip.count())await introSkip.click({timeout:8000});
 const crateDebug=await cratePage.evaluate(()=>({
   sceneCount:document.querySelectorAll('.arena-box3d').length,
   sources:[...document.querySelectorAll('[data-source-model]')].map(x=>x.getAttribute('data-source-model')),
   canvasCount:document.querySelectorAll('.arena-box3d canvas').length,
   body:document.body.innerText.slice(0,1300)
 }));
 console.log('LICENSED_CRATE_DIAGNOSTIC',JSON.stringify(crateDebug));
 const authenticCrate=cratePage.locator('[data-source-model="agustin-honnun-sci-fi-crate"]');
 await authenticCrate.waitFor({state:'attached',timeout:18000});
 const crateCanvas=authenticCrate.locator('.arena-box3d__scene canvas');
 await crateCanvas.waitFor({state:'attached',timeout:12000});
 const boxButtons=authenticCrate.locator('.arena-box3d__selector');
 assert.equal(await boxButtons.count(),3,'Three server-sourced crate choices rendered');
 const crateBounds=await crateCanvas.evaluate(el=>{
  const r=el.getBoundingClientRect();
  return {width:r.width,height:r.height,viewport:innerWidth,overflow:document.documentElement.scrollWidth};
 });
 assert.ok(crateBounds.width>100&&crateBounds.height>200,
  'Real crate WebGL canvas occupies visible projector area: '+JSON.stringify(crateBounds));
 assert.equal(crateBounds.overflow<=crateBounds.viewport+2,true,'No horizontal projector overflow');
 await screenshot(cratePage,'19-licensed-sci-fi-crates-projector.png');
 assert.deepEqual(problems,[],'No React WebGL runtime errors in wheel or licensed crate');
 console.log(JSON.stringify({status:'PASS',mode:'actual V6 participant React + real backend + 1920px projector',
  winnerIndex:winner.game.spin.index,pointsFromServer:result,uid:'synthetic',
  countdownMs:before,spinMs:spin.stopsAt-spin.startsAt,webglCanvas:true,
  noDoubleSpin:duplicate.status===409,stagingOnly:true},null,2));
}finally{
 for(const ctx of contexts)try{await ctx.close()}catch{}
 if(browser)await browser.close();
 fixture.kill('SIGTERM');
 await Promise.race([new Promise(resolve=>fixture.once('exit',resolve)),sleep(1600)]);
 if(fixture.exitCode && log)console.error('Local fixture: '+log.slice(-1300));
}
