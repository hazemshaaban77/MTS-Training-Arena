import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {service,ApiError} from '../lib/service';
import {sample} from '../lib/catalog';
const types=['Quiz','Live Poll','Order It','Match It','Categorize','Spin Wheel','Open the Box','Flashcards','Ultimate Game Show','Scenario Challenge','Dropdown'];
const oldSample=(type:string,lang='en')=>type==='Scenario Challenge'?{type,prompt:'Choose the best decision',options:['Review','Ignore'],correct:0,timer:30,speed:false}:{...sample(type,lang),speed:false};
import {publicActivity} from '../lib/domain.mjs';
// SQLite adapter executes the same statements as D1. No network or production data.
function database(){
 const sql=new DatabaseSync(':memory:');for(const e of JSON.parse(readFileSync('drizzle/meta/_journal.json','utf8')).entries)sql.exec(readFileSync('drizzle/'+e.tag+'.sql','utf8'));
 const adapter:any={sql,prepare(q:string){return {bind(...args:any[]){return {async run(){const r=sql.prepare(q).run(...args);return {meta:{changes:Number(r.changes)}}},async first(){return sql.prepare(q).get(...args)||null},async all(){return {results:sql.prepare(q).all(...args)}}};}};},async batch(statements:any[]){sql.exec('BEGIN');try{const r=[];for(const st of statements)r.push(await st.run());sql.exec('COMMIT');return r;}catch(e){sql.exec('ROLLBACK');throw e;}}};return adapter;
}
function call(db:any,path:string,body?:any,token?:string,owner:string|null='trainer'){return service(db,new Request('https://arena.test/api/'+path,{method:body?'POST':'GET',headers:token?{'X-Player-Token':token}:{},body:body?JSON.stringify(body):undefined}),owner);}
let employeeCounter=0;
function enroll(db:any,body:any){return call(db,'join',{employeeId:'TEST-'+(++employeeCounter),confirmed:true,...body});}
async function room(db:any,activities:any[]=types.map(type=>oldSample(type,'en')),teams=false){return (await call(db,'sessions',{title:'Test arena',activities,teams,language:'en'}) as any).code;}
async function state(db:any,code:string,token?:string,host=false){return call(db,`state?code=${code}${host?'&role=host':''}`,undefined,token) as Promise<any>;}
async function control(db:any,code:string,action:string,index?:number){const s=await state(db,code,undefined,true);return call(db,'control',{code,revision:s.revision,action,index});}
function correct(a:any){if(a.options)return a.correct??0;if(a.order)return a.order;if(a.pairs)return a.pairs;if(a.assignments)return a.assignments;return null;}
test('complete all 11 activities, one room token, deterministic individual/team results',async()=>{
 const db=database(),deck=types.map(type=>oldSample(type,'en')),code=await room(db,deck,true),p:any=await enroll(db,{code,name:'Hazem',team:'Lightning'}),q:any=await enroll(db,{code,name:'Mona',team:'Wave'});
 await control(db,code,'start');let total=0;
 for(let round=0;round<deck.length;round++){
  const a=deck[round],live=await state(db,code,p.token);assert.equal(live.current,round);assert.equal(live.code,code);assert.equal(live.mine.id,p.id);assert.equal(live.activity.correct,undefined);assert.equal(live.activity.backs,undefined);
  if(['Spin Wheel','Open the Box','Flashcards'].includes(a.type)){await control(db,code,'reveal',0);const shown=await state(db,code,p.token);assert.ok(shown.activity.revealed);assert.equal(shown.individual.find((x:any)=>x.uid===p.id).score,total);}
  else {await call(db,'answer',{code,round,answer:correct(a)},p.token);await call(db,'answer',{code,round,answer:correct(a)},q.token);if(!['Live Poll','Categorize'].includes(a.type))total+=1000;const before=await state(db,code,p.token);assert.equal(before.mine.points,null);assert.equal(before.mine.correct,null);assert.equal(before.tally,null);}
  if((await state(db,code)).status==='question')await control(db,code,'close');const after=await state(db,code,p.token);assert.equal(after.individual.find((x:any)=>x.uid===p.id).score,total);assert.equal(after.individual[0].rank,1);assert.equal(after.individual[1].rank,1);assert.equal(after.teams[0].score,total);
  if(round<deck.length-1)await control(db,code,'next');
 }
 await control(db,code,'finish');const done=await state(db,code,p.token);assert.equal(done.status,'completed');assert.equal(total,6000);assert.equal(done.mine.id,p.id);db.sql.close();
});
test('80 concurrent answers, duplicate retry and stale trainer command do not inflate scores',async()=>{
 const db=database(),code=await room(db,[sample('Quiz','en')]),people=await Promise.all(Array.from({length:80},(_,i)=>enroll(db,{code,name:'Player '+i}) as any));
 await assert.rejects(()=>enroll(db,{code,name:'Overflow'}),{message:'FULL'});const lobby=await state(db,code,undefined,true);await control(db,code,'start');
 await assert.rejects(()=>call(db,'control',{code,revision:lobby.revision,action:'start'}),{message:'STALE'});
 await Promise.all(people.map(p=>call(db,'answer',{code,round:0,answer:0},p.token)));
 await assert.rejects(()=>call(db,'answer',{code,round:0,answer:0},people[0].token),{message:'ALREADY_ANSWERED'});
 assert.equal((await state(db,code)).submitted,80);await control(db,code,'close');const result=await state(db,code);assert.equal(result.individual.length,80);assert.equal(result.individual.reduce((n:any,p:any)=>n+p.score,0),80000);
 await assert.rejects(()=>control(db,code,'close'),{message:'STATE'});assert.equal((await state(db,code)).individual[0].score,1000);db.sql.close();
});
test('host authorization, token isolation and active answer keys stay private',async()=>{
 const db=database(),code=await room(db,[sample('Quiz')]);await assert.rejects(()=>call(db,'sessions',undefined,undefined,null),{message:'SIGN_IN'});
 await assert.rejects(()=>call(db,`state?code=${code}&role=host`,undefined,undefined,'intruder'),{message:'FORBIDDEN'});
 const s=await state(db,code);await assert.rejects(()=>call(db,'control',{code,revision:s.revision,action:'start'},undefined,'intruder'),{message:'FORBIDDEN'});
 const p:any=await enroll(db,{code,name:'One'});await control(db,code,'start');await assert.rejects(()=>call(db,'answer',{code,round:0,answer:0},'fake-token'),{message:'PLAYER'});
 await call(db,'answer',{code,round:0,answer:0},p.token);assert.equal((await state(db,code)).mine,null);assert.equal((await state(db,code,p.token)).activity.correct,undefined);assert.ok((await state(db,code,undefined,true)).activities);db.sql.close();
});
test('late join waits for next round; pause, resume and deadlines enforced on server',async()=>{
 const db=database(),code=await room(db,[sample('Quiz'),sample('Quiz')]);await control(db,code,'start');const p:any=await enroll(db,{code,name:'Late'});
 assert.equal((await state(db,code,p.token)).mine.eligible,false);await assert.rejects(()=>call(db,'answer',{code,round:0,answer:0},p.token),{message:'PENDING'});
 await control(db,code,'close');const approval=await state(db,code,undefined,true);await call(db,'control',{code,revision:approval.revision,action:'approve',player:p.id});await control(db,code,'next');assert.equal((await state(db,code,p.token)).mine.eligible,true);
 await control(db,code,'pause');await assert.rejects(()=>call(db,'answer',{code,round:1,answer:0},p.token),{message:'CLOSED'});const paused=await state(db,code);assert.ok(paused.remaining>0);await control(db,code,'resume');
 await assert.rejects(()=>call(db,'answer',{code,round:0,answer:0},p.token),{message:'CLOSED'});
 db.sql.prepare('UPDATE sessions SET deadline=? WHERE code=?').run(Date.now()-10,code);await assert.rejects(()=>call(db,'answer',{code,round:1,answer:0},p.token),{message:'CLOSED'});assert.equal((await state(db,code)).status,'results');await control(db,code,'finish');await assert.rejects(()=>enroll(db,{code,name:'Ended'}),{message:'ENDED'});db.sql.close();
});
test('malformed activity keys and forged score values rejected or ignored',async()=>{
 const db=database();await assert.rejects(()=>room(db,[{...sample('Quiz'),correct:50}]),{message:'DECK'});const a=sample('Match It');const code=await room(db,[a]),p:any=await enroll(db,{code,name:'Player'});await control(db,code,'start');await assert.rejects(()=>call(db,'answer',{code,round:0,answer:[0,0,0]},p.token),{message:'ANSWER'});await call(db,'answer',{code,round:0,answer:a.pairs,points:9999999},p.token);await control(db,code,'close');assert.equal((await state(db,code)).individual[0].score,1000);db.sql.close();
});
test('all public snapshots strip answer keys until result reveal',()=>{
 for(const type of types){const a=sample(type),p=publicActivity(a);for(const key of ['correct','order','pairs','assignments','backs'])assert.equal(p[key],undefined);}
});

test('required employee identity, confirmation, duplicates and public privacy',async()=>{
 const db=database(),code=await room(db,[sample('Quiz')]);
 await assert.rejects(()=>call(db,'join',{code,name:'Person',confirmed:true}),{message:'EMPLOYEE_ID'});
 await assert.rejects(()=>call(db,'join',{code,name:'Person',employeeId:'30000650'}),{message:'CONFIRM_IDENTITY'});
 const p:any=await call(db,'join',{code,name:'Person',employeeId:'٣٠٠٠٠٦٥٠',confirmed:true});
 await assert.rejects(()=>call(db,'join',{code,name:'Duplicate',employeeId:'30000650',confirmed:true}),{message:'ALREADY_REGISTERED'});
 const pub=await state(db,code);assert.equal(pub.players[0].employeeId,undefined);assert.equal(JSON.stringify(pub).includes('30000650'),false);assert.equal(JSON.stringify(pub).includes('recovery'),false);
 assert.equal((await state(db,code,p.token)).mine.employeeId,'30000650');assert.equal((await state(db,code,undefined,true)).players[0].employeeId,'30000650');db.sql.close();
});
test('safe device change preserves scores and invalidates the previous device token',async()=>{
 const db=database(),code=await room(db,[sample('Quiz'),sample('Quiz')]),p:any=await call(db,'join',{code,name:'Person',employeeId:'EMP-123',confirmed:true});
 await control(db,code,'start');await call(db,'answer',{code,round:0,answer:0},p.token);await control(db,code,'close');
 await assert.rejects(()=>call(db,'recover',{code,employeeId:'EMP-123',recoveryCode:'wrong'}),{message:'RECOVERY'});
 const restored:any=await call(db,'recover',{code,employeeId:'emp-123',recoveryCode:p.recoveryCode});
 assert.notEqual(restored.token,p.token);assert.equal((await state(db,code,p.token)).mine,null);assert.equal((await state(db,code,restored.token)).mine.id,p.id);assert.equal((await state(db,code,restored.token)).individual[0].score,1000);
 await control(db,code,'next');await assert.rejects(()=>call(db,'answer',{code,round:1,answer:0},p.token),{message:'PLAYER'});await call(db,'answer',{code,round:1,answer:0},restored.token);await control(db,code,'close');assert.equal((await state(db,code)).individual[0].score,2000);assert.equal((await state(db,code)).players.length,1);db.sql.close();
});

test('an existing pre-identity participant can add their ID without losing their record or points',async()=>{
 const db=database(),code=await room(db,[sample('Quiz')]),p:any=await enroll(db,{code,name:'Existing'});
 await control(db,code,'start');await call(db,'answer',{code,round:0,answer:0},p.token);await control(db,code,'close');
 db.sql.prepare('UPDATE players SET employee_id=NULL,employee_key=NULL,recovery_hash=NULL WHERE session=? AND id=?').run(code,p.id);
 const upgraded:any=await call(db,'join',{code,name:'Existing',employeeId:'LEGACY-1',confirmed:true},p.token);
 assert.equal(upgraded.id,p.id);assert.equal(upgraded.token,p.token);const s=await state(db,code,p.token);assert.equal(s.players.length,1);assert.equal(s.individual[0].score,1000);assert.equal(s.mine.employeeId,'LEGACY-1');db.sql.close();
});
