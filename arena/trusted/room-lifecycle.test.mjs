import test from "node:test";
import assert from "node:assert/strict";
import {createTrustedRoom,openTrustedRound,closeTrustedRound} from "./room-lifecycle.mjs";

function store(){
 const state={"arenaV1/trainerAllowlist/trainer":true};
 const copy=v=>v==null?null:structuredClone(v);
 const db={ref(path){return {
  get:async()=>({val:()=>copy(state[path])}),
  update:async obj=>{for(const [key,value] of Object.entries(obj))state[path+"/"+key]=copy(value)},
  transaction:async fn=>{
   const value=copy(state[path]);
   const next=fn(value);
   if(next===undefined)return {committed:false,snapshot:{val:()=>copy(state[path])}};
   state[path]=copy(next);
   return {committed:true,snapshot:{val:()=>copy(state[path])}};
  }
 }}};
 return {db,state};
}
const id="abcdefabcdefabcdefabcdef";
const activity={kind:"Quiz",question:"What is ACID?",options:["Advance Cargo Information Declaration","Other"],correctIndex:0,durationSeconds:30};
test("trusted room creation freezes owner, round key and opens a question",async()=>{
 const {db,state}=store();
 const room=await createTrustedRoom({db,uid:"trainer",title:"ACI Training",roomId:id});
 assert.equal(room.title,"ACI Training");
 assert.equal(state["arenaTrusted/roomOwners/"+id],"trainer");
 const opened=await openTrustedRound({db,uid:"trainer",roomId:id,activity,now:100});
 assert.equal(opened.roundId,"r1");
 assert.equal(state["arenaTrusted/roundKeys/"+id+"/r1"].correctIndex,0);
 assert.equal(state["arenaV1/rooms/"+id+"/public"].correctIndex,undefined);
 assert.equal(state["arenaV1/rooms/"+id+"/public"].status,"question");
 await assert.rejects(closeTrustedRound({db,uid:"trainer",roomId:id,now:150}),/deadline/);
 const closed=await closeTrustedRound({db,uid:"trainer",roomId:id,now:30100});
 assert.equal(closed.status,"between");
 const next=await openTrustedRound({db,uid:"trainer",roomId:id,activity,now:30101});
 assert.equal(next.roundId,"r2");
});
test("trainer cannot open same round twice or preempt active question",async()=>{
 const {db}=store();await createTrustedRoom({db,uid:"trainer",title:"Training",roomId:id});
 await openTrustedRound({db,uid:"trainer",roomId:id,activity,now:0});
 await assert.rejects(openTrustedRound({db,uid:"trainer",roomId:id,activity,now:1}),/Close the previous/);
 await assert.rejects(createTrustedRoom({db,uid:"trainer",title:"Another",roomId:id}),/already exists/);
});
test("denies spoofed trainer and malformed question before storing keys",async()=>{
 const {db,state}=store();
 await assert.rejects(createTrustedRoom({db,uid:"outsider",title:"Demo",roomId:id}),/not authorized/);
 await createTrustedRoom({db,uid:"trainer",title:"Demo",roomId:id});
 await assert.rejects(openTrustedRound({db,uid:"outsider",roomId:id,activity}),/Not authorized/);
 await assert.rejects(openTrustedRound({db,uid:"trainer",roomId:id,activity:{...activity,correctIndex:9}}),/correct index/);
 assert.equal(state["arenaTrusted/roundKeys/"+id+"/r1"],undefined);
});
