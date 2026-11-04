import test from 'node:test';
import assert from 'node:assert/strict';
import {joinUrl,publicStage,fetchPublicState,ArenaStateError} from './v6-public-stage.mjs';
const base={
 code:'123456',title:'Training Session',status:'question',revision:5,
 serverNow:1000,deadline:1100,paused:false,
 players:[{name:'Employee One',approval:'approved',employeeId:'PRIVATE-123',token:'SECRET'},
          {name:'Employee Two',approval:'pending',employeeId:'PRIVATE-456'}],
 submitted:1,teams:[{team:'Wave',score:12,rank:2,members:1},{team:'Lightning',score:20,rank:1,members:1}],
 activity:{type:'Quiz',prompt:'What is ACID?',options:['A','B','C'],correct:2,privateAnswer:'NOPE'},
 owner:'user-secret',password:'hidden'
};
test('single session QR points to a stable join URL without credentials',()=>{
 assert.equal(joinUrl('https://arena.example.com/host?token=PRIVATE','123456'),
   'https://arena.example.com/?view=join&code=123456');
 assert.throws(()=>joinUrl('https://arena.example.com','wrong'),{code:'INVALID_CODE'});
 assert.throws(()=>joinUrl('http://arena.example.com','123456'),{code:'INSECURE_ORIGIN'});
 assert.equal(joinUrl('http://localhost:8000','123456'),'http://localhost:8000/?view=join&code=123456');
});
test('unrevealed question with any fields leaks neither answer nor private player info',()=>{
 const p=publicStage(base);
 assert.equal(p.scene,'question');
 assert.equal(p.participantCount,1);
 assert.equal(p.teams[0].name,'Lightning');
 assert.equal(p.activity.correct,undefined);
 const serialized=JSON.stringify(p);
 for(const secret of ['PRIVATE-123','PRIVATE-456','SECRET','NOPE','hidden','user-secret'])
   assert.ok(!serialized.includes(secret),'Private data leak '+secret);
});
test('deadline never reveals; must wait for server-locked state and keyRevealed flag',()=>{
 const expired=publicStage({...base,serverNow:1200});
 assert.equal(expired.scene,'locked');
 assert.equal(expired.activity.correct,undefined);
 const locked=publicStage({...base,status:'results',deadline:900,keyRevealed:false});
 assert.equal(locked.scene,'locked');assert.equal(locked.activity.correct,undefined);
 const revealed=publicStage({...base,status:'results',keyRevealed:true});
 assert.equal(revealed.scene,'reveal');assert.equal(revealed.activity.correct,2);
});
test('out-of-order server revisions are ignored; malformed state fails closed',()=>{
 const current=publicStage(base);
 assert.throws(()=>publicStage({...base,revision:4},current),{code:'STALE_SNAPSHOT'});
 assert.throws(()=>publicStage({...base,code:'abc123'}),{code:'INVALID_SNAPSHOT'});
 assert.throws(()=>publicStage({...base,status:'unknown'}),{code:'INVALID_SNAPSHOT'});
 assert.throws(()=>publicStage({...base,revision:-1}),{code:'INVALID_SNAPSHOT'});
});
test('projector uses public GET with no trainer/player tokens or credentials',async()=>{
 let url,options;
 const snapshot=await fetchPublicState('https://arena.example.com','123456',{fetchImpl:async(u,o)=>{
  url=u;options=o;return {ok:true,json:async()=>base};
 }});
 assert.equal(snapshot.scene,'question');
 assert.equal(url,'https://arena.example.com/api/state?code=123456');
 assert.equal(options.method,'GET');
 assert.equal(options.credentials,'omit');
 assert.ok(!JSON.stringify(options).includes('Firebase'));
 assert.ok(!JSON.stringify(options).includes('Player-Token'));
});
test('public API inaccessible must fail; never substitute sample scores',async()=>{
 await assert.rejects(fetchPublicState('https://arena.example.com','123456',{fetchImpl:async()=>({ok:false,status:403})}),{code:'ACCESS_DENIED'});
 await assert.rejects(fetchPublicState('https://arena.example.com','123456',{fetchImpl:async()=>({ok:false,status:404})}),{code:'NOT_FOUND'});
});
