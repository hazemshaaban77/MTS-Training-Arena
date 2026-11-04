import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {service,ApiError} from '../lib/service';
import {validateActivity,flattenDeck} from '../lib/domain.mjs';
import {initialRevealRuntime,revealPolicy} from '../lib/reveal-policy.mjs';

function database(){
 const sql=new DatabaseSync(':memory:');
 for(const e of JSON.parse(readFileSync('drizzle/meta/_journal.json','utf8')).entries)sql.exec(readFileSync('drizzle/'+e.tag+'.sql','utf8'));
 return {sql,prepare(q:string){return {bind(...args:any[]){return {
  async run(){const x=sql.prepare(q).run(...args);return {meta:{changes:Number(x.changes)}};},
  async first(){return sql.prepare(q).get(...args)||null;},
  async all(){return {results:sql.prepare(q).all(...args)};}
 };}};},async batch(statements:any[]){sql.exec('BEGIN');try{const rows=[];for(const stmt of statements)rows.push(await stmt.run());sql.exec('COMMIT');return rows;}catch(e){sql.exec('ROLLBACK');throw e;}}};
}
const question=(prompt:string,config:Record<string,unknown>={})=>({
 type:'Quiz',prompt,timer:30,points:1000,speed:false,options:['Answer A','Answer B','Answer C'],correct:0,...config
});
const request=(db:any,path:string,body?:any,owner:string|null='staging-trainer')=>service(
 db,new Request('https://arena.invalid/api/'+path,{method:body?'POST':'GET',body:body?JSON.stringify(body):undefined}),owner);
async function room(db:any,activities:any[],settings:Record<string,unknown>={}) {
 const x:any=await request(db,'sessions',{title:'Reveal QA, synthetic only',language:'en',activities,settings:{progression:'manual',reveal:'auto',...settings}});
 return x.code as string;
}
async function state(db:any,code:string){return request(db,'state?code='+code,undefined,null) as Promise<any>;}
async function control(db:any,code:string,action:string) {
 const h:any=await request(db,'state?code='+code+'&role=host',undefined);
 return request(db,'control',{code,revision:h.revision,action});
}
test('per-activity settings validate and nested quiz questions inherit their own policies',()=>{
 const base=question('Activity', {revealMode:'auto',revealDelay:5,revealFx:'cinematic',revealSound:false});
 assert.doesNotThrow(()=>validateActivity({...base}));
 for(const x of [{revealMode:'evil'},{revealDelay:-1},{revealDelay:17},{revealFx:'strobe'},{revealSound:'yes'}])
  assert.throws(()=>validateActivity({...base,...x}),/DECK/);
 const nested=flattenDeck([{...base,questions:[question('Q1'),question('Q2',{revealMode:'manual',revealDelay:0})]}]);
 assert.equal(nested.length,2);
 assert.deepEqual(nested.map((x:any)=>[x.revealMode,x.revealDelay]),[['auto',5],['manual',0]]);
 assert.equal(revealPolicy(question('Legacy'),{reveal:'manual'}).mode,'manual');
 assert.equal(initialRevealRuntime(question('Manual',{revealMode:'manual'}),{reveal:'auto'},1000).keyRevealed,false);
});
test('manual first round stays private until trainer authorizes reveal, then resets on next round',async()=>{
 const db=database();
 try{
  const code=await room(db,[
   question('Trainer-controlled one',{revealMode:'manual',revealDelay:0,revealFx:'cinematic'}),
   question('Next round',{revealMode:'auto',revealDelay:0})
  ]);
  await control(db,code,'start');
  assert.equal((await state(db,code)).activity.correct,undefined);
  await control(db,code,'close');
  const locked=await state(db,code);
  assert.equal(locked.status,'results');assert.equal(locked.keyRevealed,false);
  assert.equal(locked.activity.correct,undefined);
  assert.equal(locked.revealScheduledAt,null);
  await assert.rejects(control(db,code,'next'),(e:any)=>e instanceof ApiError&&e.code==='REVEAL_PENDING'&&e.status===409);
  await control(db,code,'revealkey');
  const revealed=await state(db,code);
  assert.equal(revealed.keyRevealed,true);
  assert.equal(revealed.activity.correct,0);
  assert.equal(typeof revealed.revealMomentAt,'number');
  await assert.rejects(control(db,code,'revealkey'),(e:any)=>e instanceof ApiError&&e.code==='ALREADY_REVEALED');
  await control(db,code,'next');
  const next=await state(db,code);
  assert.equal(next.current,1);assert.equal(next.keyRevealed,false);
  assert.equal(next.activity.correct,undefined);
  assert.equal(next.revealMomentAt,null);
 }finally{db.sql.close();}
});
test('automatic delayed reveal follows server time only; no early answer or double reveal',async()=>{
 const db=database(),oldNow=Date.now;
 let tick=1800000000000;
 Date.now=()=>tick;
 try{
  const code=await room(db,[question('Auto 3 seconds',{revealMode:'auto',revealDelay:3,revealFx:'standard'})]);
  await control(db,code,'start');
  tick+=500;
  await control(db,code,'close');
  const first=await state(db,code),expected=tick+3000;
  assert.equal(first.revealScheduledAt,expected);assert.equal(first.keyRevealed,false);
  assert.equal(first.activity.correct,undefined);
  tick=expected-1;
  const before=await state(db,code);
  assert.equal(before.keyRevealed,false);
  assert.equal(before.activity.correct,undefined);
  tick=expected+1;
  const after=await state(db,code);
  assert.equal(after.keyRevealed,true);
  assert.equal(after.activity.correct,0);
  assert.equal(after.revealMomentAt,expected);
  assert.equal(after.revealScheduledAt,null);
  assert.equal((await state(db,code)).revision,after.revision,'CAS settle is idempotent');
 }finally{Date.now=oldNow;db.sql.close();}
});
test('automatic reveal after a timeout settles server-side, manual timeout remains locked',async()=>{
 const db=database(),oldNow=Date.now;
 let tick=1800001000000;Date.now=()=>tick;
 try{
  const code=await room(db,[
   question('Timer expires auto',{timer:5,revealMode:'auto',revealDelay:2}),
   question('Timer expires manual',{timer:5,revealMode:'manual'})
  ]);
  await control(db,code,'start');
  const deadline=(await state(db,code)).deadline;
  tick=deadline+10;
  const closed=await state(db,code);
  assert.equal(closed.status,'results');
  assert.equal(closed.keyRevealed,false);
  assert.equal(closed.activity.correct,undefined);
  tick=deadline+2002;
  assert.equal((await state(db,code)).keyRevealed,true);
  await control(db,code,'next');
  const secondDeadline=(await state(db,code)).deadline;
  tick=secondDeadline+10000;
  const manual=await state(db,code);
  assert.equal(manual.status,'results');assert.equal(manual.keyRevealed,false);
  assert.equal(manual.activity.correct,undefined);
 }finally{Date.now=oldNow;db.sql.close();}
});
test('legacy activity without per-round fields keeps existing V6 auto and manual session settings',async()=>{
 const db=database();
 try{
  const auto=await room(db,[question('Old quiz auto')],{reveal:'auto'});
  await control(db,auto,'start');await control(db,auto,'close');
  assert.equal((await state(db,auto)).keyRevealed,true);
  const manual=await room(db,[question('Old quiz manual')],{reveal:'manual'});
  await control(db,manual,'start');await control(db,manual,'close');
  assert.equal((await state(db,manual)).activity.correct,undefined);
  await control(db,manual,'revealkey');
  assert.equal((await state(db,manual)).activity.correct,0);
 }finally{db.sql.close();}
});
