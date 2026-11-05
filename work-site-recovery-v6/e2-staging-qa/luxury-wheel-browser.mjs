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
 for(const page of [projector,trainee])page.on('pageerror',e=>problems.push(e.message));
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
 await screenshot(projector,'13-wheel-debug-initial.png');
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
 await screenshot(projector,'13-luxury-wheel-projector-ready.png');
 await screenshot(trainee,'14-luxury-wheel-mobile-ready.png',true);
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
 await screenshot(projector,'15-luxury-wheel-server-countdown.png');
 await sleep(Math.max(0,spin.startsAt-Date.now())+350);
 const afterCountdown=ok(await state(),'post-countdown');
 assert.equal(afterCountdown.game.spin.revealed,false,'No early selected winner');
 await screenshot(projector,'16-luxury-wheel-spinning.png');
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
 await screenshot(projector,'17-luxury-wheel-signed-result.png');
 const repeated=await state();
 assert.equal(repeated.json.game.spin.id,spin.id);
 assert.equal(repeated.json.game.outcome.points,result);
 const standings=winner.individual||[];
 assert.ok(standings.some(row=>row.score===result),'Only server ledger created points');
 assert.deepEqual(problems,[],'No React page errors');
 const mobile=await trainee.evaluate(()=>({viewport:innerWidth,content:document.documentElement.scrollWidth}));
 assert.ok(mobile.content<=mobile.viewport+2,'Responsive wheel causes horizontal overflow '+JSON.stringify(mobile));
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
