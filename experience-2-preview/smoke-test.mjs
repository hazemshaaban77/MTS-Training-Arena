// MTS Training Arena Experience 2.0 Stage 1
// Node-only synthetic DOM smoke test. NOT a visual/browser/device acceptance test.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const dir=path.dirname(fileURLToPath(import.meta.url));
const source=fs.readFileSync(path.join(dir,'index.html'),'utf8');
assert.match(source,/<!doctype html>/i);
assert.match(source,/work-site-recovery-v6\/public\/mts.png/);
assert.match(source,/work-site-recovery-v6\/public\/training.png/);
assert.ok(!source.includes("fetch('/api/"),'Preview must not call production backend');

const code=source.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(code,'Missing preview JavaScript');
const elements=new Map(),scheduled=[];
function el(){
 const events={},classes=new Set();
 return {
  events,innerHTML:'',textContent:'',offsetWidth:100,src:'',
  style:{setProperty(){}},
  classList:{
   add:k=>classes.add(k),
   remove:k=>classes.delete(k),
   contains:k=>classes.has(k),
   toggle(k,on){if(on===undefined){if(classes.has(k))classes.delete(k);else classes.add(k)}else if(on)classes.add(k);else classes.delete(k)}
  },
  setAttribute(){},remove(){},
  addEventListener:(k,fn)=>{events[k]=fn},removeEventListener:k=>{delete events[k]}
 };
}
const document={
 body:el(),documentElement:{lang:'ar',dir:'rtl',style:{setProperty(){}}},
 head:{appendChild(){}},
 getElementById(id){if(!elements.has(id))elements.set(id,el());return elements.get(id)},
 createElement:el,
 addEventListener(){}
};
let fakeNow=Date.now();
class FakeDate extends Date { static now(){return fakeNow;} }
const data=new Map();
const localStorage={
 getItem:k=>data.get(k)||null,
 setItem:(k,v)=>{data.set(k,v)}
};
let openedUrl='';
const window={open:url=>{openedUrl=url;return {}},addEventListener(){}};
class BroadcastChannel { postMessage(){} }
const fakeTimeout=(fn,ms)=>{scheduled.push({fn,ms,type:'timeout'});return scheduled.length};
const fakeInterval=(fn,ms)=>{scheduled.push({fn,ms,type:'interval'});return scheduled.length};
const sandbox={document,window,location:{href:'http://localhost:8000/experience-2-preview/'},localStorage,BroadcastChannel,URL,setTimeout:fakeTimeout,setInterval:fakeInterval,clearTimeout(){},clearInterval(){},Date:FakeDate,console};
vm.runInNewContext(code,sandbox,{timeout:2000});
const key='mts-arena-experience-2-preview-v1';
function press(id){const cb=document.getElementById(id).events.click;assert.ok(cb,'Missing click handler: '+id);cb()}
function current(){return JSON.parse(data.get(key)||'{}')}
for(const [button,expected] of [['goLobby','lobby'],['goQuestion','question'],['goReveal','reveal'],['goPodium','podium'],['goIntro','intro']]){
 press(button);
 assert.equal(current().scene,expected,'Failed button '+button);
}
assert.match(document.getElementById('sceneStatus').textContent,/المقدمة/);
const introFinish=scheduled.filter(t=>t.ms===8000&&t.type==='timeout').at(-1);
assert.ok(introFinish,'Intro has no 8-second finish');
introFinish.fn();
assert.equal(current().scene,'question','Intro must transition to question');
assert.ok(!document.getElementById('scene').innerHTML.includes('الإجابة الصحيحة'),'Correct answer shown too early');
fakeNow+=21000;
const timer=scheduled.filter(t=>t.ms===250&&t.type==='interval').at(-1);
assert.ok(timer,'20-second demo question timer missing');timer.fn();
assert.equal(current().scene,'locked','Time should lock responses, not auto-reveal answer');
assert.ok(!document.getElementById('scene').innerHTML.includes('الإجابة الصحيحة'),'Answer must remain hidden until trainer reveals');
press('goReveal');
assert.equal(current().scene,'reveal');
assert.ok(document.getElementById('scene').innerHTML.includes('الإجابة الصحيحة'),'Trainer reveal should expose correct answer');
press('language');
assert.equal(current().lang,'en','Language must be in shared scene state');
assert.match(document.getElementById('scene').innerHTML,/Before an ACID/);
press('projector');
assert.match(openedUrl,/display=1/,'Projector should open read-only display URL');
assert.match(source,/class="stage-logo left"/);
assert.match(source,/class="stage-logo right"/);
console.log('PASS: 5 trainer scenes, countdown locks before reveal, intro transition, language sync, projector URL, logos and no backend calls.');
console.log('PENDING: real browser/device visuals, projector hardware and live multi-device scoring.');
