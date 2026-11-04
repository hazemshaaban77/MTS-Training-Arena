import {spawn} from 'node:child_process';
import {setTimeout as sleep} from 'node:timers/promises';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';

// Run exclusively against the existing local V6 fixture. All data is synthetic.
const origin='http://127.0.0.1:8094';
const screenshots=path.resolve('e2-staging-qa/ci-screenshots');
await fs.mkdir(screenshots,{recursive:true});
const fixture=spawn(process.execPath,['.sites-runtime/e2-staging-qa/staging-local-server.mjs'],{
 cwd:process.cwd(),env:{...process.env,E2_FIXTURE_PORT:'8094',E2_FIXTURE_EXPLICIT:'local-only'},stdio:['ignore','pipe','pipe']
});
let logs='';fixture.stdout.on('data',b=>logs+=b.toString());fixture.stderr.on('data',b=>logs+=b.toString());
let browser;
async function request(route,body,trainer=false){
 const res=await fetch(origin+'/api/'+route,{
  method:body?'POST':'GET',
  headers:{'Accept':'application/json',...(body?{'Content-Type':'application/json'}:{}),...(trainer?{'X-Firebase-Token':'local-fixture-trainer'}:{})},
  body:body?JSON.stringify(body):undefined
 });
 return {status:res.status,value:await res.json()};
}
async function ready(){
 for(let i=0;i<80;i++){
  if(fixture.exitCode!==null)throw Error('Fixture shut down');
  try{const r=await fetch(origin+'/__fixture_health');if(r.ok)return;}catch{}
  await sleep(150);
 }
 throw Error('Local fixture not ready');
}
try{
 await ready();
 const q=(label,mode,delay,fx)=>({
  type:'Quiz',prompt:label,timer:120,points:1000,speed:false,
  options:['Correct','Incorrect','Other'],correct:0,
  revealMode:mode,revealDelay:delay,revealFx:fx,revealSound:false
 });
 const created=await request('sessions',{
  title:'Answer Reveal Integration — Synthetic Only',language:'ar',
  settings:{reveal:'auto',progression:'manual'},
  activities:[q('Manual reveal', 'manual', 0,'cinematic'),q('Auto reveal', 'auto',2,'light')]
 },true);
 assert.equal(created.status,200);
 const code=created.value.code;
 const state=async()=>{const s=await request('state?code='+code);assert.equal(s.status,200);return s.value};
 const hostState=async()=>{const s=await request('state?code='+code+'&role=host',undefined,true);assert.equal(s.status,200);return s.value};
 const control=async action=>{
  const host=await hostState();
  const s=await request('control',{code,revision:host.revision,action},true);
  assert.equal(s.status,200,action+': '+JSON.stringify(s.value));
 };
 browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1920,height:1080}});
 const failures=[];
 page.on('pageerror',e=>failures.push(e.message));
 await page.goto(origin+'/MTS-Training-Arena/v6/?view=display&code='+code,{waitUntil:'domcontentloaded'});
 await page.locator('.session-shell.projector').waitFor({timeout:25000});
 await control('start');
 await page.waitForFunction(()=>document.body.textContent?.includes('Manual reveal'),null,{timeout:10000});
 await control('close');
 let s=await state();
 assert.equal(s.status,'results');assert.equal(s.keyRevealed,false);
 assert.equal(s.activity.correct,undefined);
 await sleep(950);
 assert.equal((await state()).keyRevealed,false,'No client-only reveal while trainer waits');
 assert.equal(await page.locator('.arena-answer-reveal').count(),0);
 await control('revealkey');
 await page.locator('.arena-answer-reveal.fx-cinematic').waitFor({timeout:7000});
 // Record the actual brightest moment rather than frame zero of the CSS animation.
 await page.waitForTimeout(1350);
 await page.screenshot({path:path.join(screenshots,'08-react-projector-manual-cinematic.png')});
 await page.locator('.arena-answer-reveal').waitFor({state:'detached',timeout:7000});
 await control('next');
 await page.waitForFunction(()=>document.body.textContent?.includes('Auto reveal'),null,{timeout:9000});
 await control('close');
 s=await state();
 assert.equal(s.keyRevealed,false);assert.equal(s.activity.correct,undefined);
 assert.ok(s.revealScheduledAt>Date.now());
 const scheduledFor=s.revealScheduledAt;
 await page.locator('.arena-answer-reveal').waitFor({state:'detached',timeout:4000});
 // Do not mistake an older in-flight /api/state fetch for the current round.
 // The server guarantees that the key stays hidden until the scheduled instant.
 await sleep(Math.max(0,scheduledFor-Date.now())+240);
 await page.waitForFunction(async code=>{
  const response=await fetch('/api/state?code='+code);
  const s=await response.json();
  return s.keyRevealed===true;
 },code,{timeout:8500,polling:120});
 s=await state();
 assert.equal(s.current,1);
 assert.equal(s.status,'results');
 assert.equal(s.keyRevealed,true);
 assert.equal(s.activity.correct,0);
 assert.equal(s.revealMomentAt,scheduledFor,'Cinematic cue follows server-scheduled timestamp');
 await page.locator('.arena-answer-reveal.fx-light').waitFor({timeout:7000});
 await page.waitForTimeout(450);
 await page.screenshot({path:path.join(screenshots,'09-react-projector-auto-light.png')});
 await page.locator('.arena-answer-reveal').waitFor({state:'detached',timeout:6000});
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('.session-shell.projector').waitFor({timeout:10000});
 await sleep(800);
 assert.equal(await page.locator('.arena-answer-reveal').count(),0,'Do not replay completed animation on returning display');
 assert.deepEqual(failures,[]);
 console.log('PASS React 16:9 projector: manual reveal secure; cinematic light sweep; auto reveal 2s; light FX; no replay; no JavaScript errors.');
}finally{
 if(browser)await browser.close();
 fixture.kill('SIGTERM');
 await Promise.race([new Promise(r=>fixture.once('exit',r)),sleep(1800)]);
 if(fixture.exitCode!==0&&logs)console.error('Fixture logs '+logs.slice(-850));
}
