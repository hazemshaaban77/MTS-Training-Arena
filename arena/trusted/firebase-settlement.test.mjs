import test from "node:test";
import assert from "node:assert/strict";
import {settleRound} from "./firebase-settlement.mjs";

const roomId="abcdefabcdefabcdefabcdef";
const base="arenaV1",secret="arenaTrusted";
const round={title:"Demo",round:"r1",status:"between",question:"Which?",options:["A","B"],deadline:1000,joinOpen:true};
function fakeStore(){
 const data={
  [base+"/trainerAllowlist/trainer"]:true,
  [base+"/rooms/"+roomId+"/private/createdBy"]:"trainer",
  [base+"/rooms/"+roomId+"/public"]:{...round},
  [secret+"/roundKeys/"+roomId+"/r1"]:{roundId:"r1",kind:"Quiz",correctIndex:0,question:"Which?",options:["A","B"],pointsPerCorrect:100},
  [base+"/participants/"+roomId]:{p1:{name:"Ahmed"},p2:{name:"Mona"}},
  [base+"/answers/"+roomId+"/r1"]:{p1:{choice:0},p2:{choice:1}}
 };
 const db={ref(path){return {
   get:async()=>({val:()=>structuredClone(data[path]??null)}),
   transaction:async update=>{
     const current=structuredClone(data[path]??null);
     const next=update(current);
     const committed=next!==undefined;
     if(committed)data[path]=structuredClone(next);
     return {committed,snapshot:{val:()=>structuredClone(data[path]??null)}};
   }
 }}};
 const verifyIdToken=async token=>token==="valid"?{uid:"trainer"}:{uid:"stranger"};
 return {db,data,verifyIdToken};
}
const request=ctx=>({db:ctx.db,verifyIdToken:ctx.verifyIdToken,idToken:"valid",roomId,roundId:"r1",now:2000});
test("authorized trainer settles quiz and writes trusted leaderboard",async()=>{
 const ctx=fakeStore();const result=await settleRound(request(ctx));
 assert.equal(result.created,true);
 assert.equal(result.settledRounds,1);
 const board=ctx.data[base+"/scoreboards/"+roomId];
 assert.deepEqual(board.players.map(p=>[p.name,p.score]),[["Ahmed",100],["Mona",0]]);
});
test("repeated request cannot credit the same round twice",async()=>{
 const ctx=fakeStore();
 await settleRound(request(ctx));
 const second=await settleRound(request(ctx));
 assert.equal(second.created,false);
 assert.equal(ctx.data[secret+"/ledgers/"+roomId].r1.awards.p1,100);
});
test("rejects unauthorized or premature settlement",async()=>{
 const ctx=fakeStore();
 await assert.rejects(settleRound({...request(ctx),idToken:"forged"}),/Forbidden/);
 await assert.rejects(settleRound({...request(ctx),now:900}),/deadline/);
});
test("rejects answer-key mismatch and active question",async()=>{
 const ctx=fakeStore();
 ctx.data[secret+"/roundKeys/"+roomId+"/r1"].question="Injected";
 await assert.rejects(settleRound(request(ctx)),/key mismatch/);
 ctx.data[secret+"/roundKeys/"+roomId+"/r1"].question="Which?";
 ctx.data[base+"/rooms/"+roomId+"/public"].status="question";
 await assert.rejects(settleRound(request(ctx)),/not closed/);
});
test("rejects injected answer records before ledger mutation",async()=>{
 const ctx=fakeStore();
 ctx.data[base+"/answers/"+roomId+"/r1"].intruder={choice:0};
 await assert.rejects(settleRound(request(ctx)),/Invalid participant/);
 assert.equal(ctx.data[secret+"/ledgers/"+roomId],undefined);
});
