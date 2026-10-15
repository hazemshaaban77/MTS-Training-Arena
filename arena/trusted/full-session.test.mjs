import test from "node:test";
import assert from "node:assert/strict";
import {createTrustedRoom,openTrustedRound,closeTrustedRound} from "./room-lifecycle.mjs";
import {settleRound} from "./firebase-settlement.mjs";

const roomId="abc123abc123abc123abc123";
function testDatabase(){
 const tree={arenaV1:{trainerAllowlist:{trainer:true}},arenaTrusted:{}};
 const segments=path=>path.split("/").filter(Boolean);
 const read=path=>segments(path).reduce((v,k)=>v?.[k],tree);
 const put=(path,value)=>{
  const parts=segments(path);let node=tree;
  for(const key of parts.slice(0,-1))node=node[key]??={};
  node[parts.at(-1)]=structuredClone(value);
 };
 const snapshot=value=>({val:()=>value===undefined?null:structuredClone(value)});
 const ref=path=>({
  get:async()=>snapshot(read(path)),
  update:async patch=>{for(const [key,value] of Object.entries(patch))put(path+"/"+key,value);},
  set:async value=>put(path,value),
  transaction:async update=>{
   const original=read(path);
   const value=update(original===undefined?null:structuredClone(original));
   if(value===undefined)return {committed:false,snapshot:snapshot(original)};
   put(path,value);return {committed:true,snapshot:snapshot(value)};
  }
 });
 return {ref,read,put};
}
test("complete room lifecycle: create, answer, close, grade, publish and retry",async()=>{
 const db=testDatabase();
 const room=await createTrustedRoom({db,uid:"trainer",title:"ACI Training",roomId});
 assert.equal(room.roomId,roomId);
 const opened=await openTrustedRound({db,uid:"trainer",roomId,now:1000,activity:{
  kind:"Quiz",question:"What is an invoice?",options:["Commercial document","Cinema ticket"],correctIndex:0,durationSeconds:10
 }});
 assert.equal(opened.roundId,"r1");
 assert.equal(db.read("arenaV1/rooms/"+roomId+"/public").correctIndex,undefined);
 db.put("arenaV1/participants/"+roomId,{p1:{name:"Mona"},p2:{name:"Ali"}});
 db.put("arenaV1/answers/"+roomId+"/r1",{p1:{choice:0},p2:{choice:1}});
 await assert.rejects(closeTrustedRound({db,uid:"trainer",roomId,now:10000}),/deadline/);
 const closed=await closeTrustedRound({db,uid:"trainer",roomId,now:11001});
 assert.equal(closed.roundId,"r1");
 const auth=async token=>token==="test"?{uid:"trainer"}:{uid:"not-trainer"};
 const settle=()=>settleRound({db,verifyIdToken:auth,idToken:"test",roomId,roundId:"r1",now:11002});
 const first=await settle();
 assert.equal(first.created,true);
 const board=db.read("arenaV1/scoreboards/"+roomId);
 assert.equal(board.players.find(p=>p.name==="Mona").score,100);
 assert.equal(board.players.find(p=>p.name==="Ali").score,0);
 const again=await settle();
 assert.equal(again.created,false);
 assert.equal(db.read("arenaTrusted/ledgers/"+roomId).r1.awards.p1,100);
});
test("different user cannot manage or score an existing room",async()=>{
 const db=testDatabase();
 await createTrustedRoom({db,uid:"trainer",title:"Demo",roomId});
 db.put("arenaV1/trainerAllowlist/imposter",true);
 await assert.rejects(openTrustedRound({db,uid:"imposter",roomId,activity:{kind:"Quiz"}}),/Not authorized/);
});

test("80 participants: grade mixed answers, preserve ties, and publish totals",async()=>{
 const db=testDatabase();
 await createTrustedRoom({db,uid:"trainer",title:"80 attendee rehearsal",roomId});
 await openTrustedRound({db,uid:"trainer",roomId,now:2000,activity:{
  kind:"Quiz",question:"Which choice?",options:["Correct","Wrong"],correctIndex:0,durationSeconds:10
 }});
 const roster={};const answers={};
 for(let i=1;i<=80;i++){
  const uid="trainee_"+i;
  roster[uid]={name:"Trainee "+String(i).padStart(2,"0")};
  answers[uid]={choice:i%2===0?0:1};
 }
 db.put("arenaV1/participants/"+roomId,roster);
 db.put("arenaV1/answers/"+roomId+"/r1",answers);
 await closeTrustedRound({db,uid:"trainer",roomId,now:12001});
 const params={db,verifyIdToken:async()=>({uid:"trainer"}),idToken:"fake-for-test",roomId,roundId:"r1",now:12002};
 const result=await settleRound(params);
 assert.equal(result.created,true);
 const scores=db.read("arenaV1/scoreboards/"+roomId).players;
 assert.equal(scores.length,80);
 assert.equal(scores.filter(p=>p.score===100).length,40);
 assert.equal(scores.filter(p=>p.score===0).length,40);
 assert.equal(scores.filter(p=>p.rank===1).length,40);
 assert.equal(scores.find(p=>p.score===0).rank,41);
 const again=await settleRound(params);
 assert.equal(again.created,false);
});

test("two rounds retain previous players and add newly joined players",async()=>{
 const db=testDatabase();
 await createTrustedRoom({db,uid:"trainer",title:"Multi-round",roomId});
 const game={kind:"Quiz",question:"Answer?",options:["Yes","No"],correctIndex:0,durationSeconds:5};
 await openTrustedRound({db,uid:"trainer",roomId,activity:game,now:1000});
 db.put("arenaV1/participants/"+roomId,{p1:{name:"First"},p2:{name:"Second"}});
 db.put("arenaV1/answers/"+roomId+"/r1",{p1:{choice:0},p2:{choice:1}});
 await closeTrustedRound({db,uid:"trainer",roomId,now:6001});
 const params={db,verifyIdToken:async()=>({uid:"trainer"}),idToken:"test",roomId,roundId:"r1",now:6002};
 await settleRound(params);
 await openTrustedRound({db,uid:"trainer",roomId,activity:game,now:7000});
 db.put("arenaV1/participants/"+roomId,{p1:{name:"First"},p2:{name:"Second"},p3:{name:"Late Joiner"}});
 db.put("arenaV1/answers/"+roomId+"/r2",{p2:{choice:0},p3:{choice:0}});
 await closeTrustedRound({db,uid:"trainer",roomId,now:12001});
 await settleRound({...params,roundId:"r2",now:12002});
 const board=db.read("arenaV1/scoreboards/"+roomId);
 assert.equal(board.settledRounds,2);
 assert.deepEqual(Object.fromEntries(board.players.map(p=>[p.uid,p.score])),{p1:100,p2:100,p3:100});
 assert.equal(board.players.length,3);
 const ledger=db.read("arenaTrusted/ledgers/"+roomId);
 assert.equal(Object.keys(ledger.r1.members).length,2);
 assert.equal(Object.keys(ledger.r2.members).length,3);
});
