import test from "node:test";
import assert from "node:assert/strict";
import {makeSession,join,start,submit,pause,resume,close,advance,endSession,ranking,remaining,assertInvariants} from "./engine.mjs";
const activities=[
 {type:"Quiz",question:"2 + 2?",options:["3","4","5"],correct:1,timer:30},
 {type:"Live Poll",question:"Favorite?",options:["A","B"],correct:null,timer:15},
 {type:"Dropdown",question:"Capital?",options:["Cairo","Rome"],correct:0,timer:20}
];
function lobby(){return join(join(makeSession(activities),"p1","Ahmed"),"p2","Salma");}
test("refuses duplicate player identity and answer duplication",()=>{
 let s=lobby();
 assert.throws(()=>join(s,"p1","Other"),/Duplicate/);
 s=start(s,1000);
 s=submit(s,"p1",1,2000);
 assert.throws(()=>submit(s,"p1",2,2500),/Already answered/);
 assert.throws(()=>submit(s,"p2",9,2500),/Invalid choice/);
 assert.throws(()=>submit(s,"p2",0,33000),/Answer window closed/);
 assertInvariants(s);
});
test("correct answers score once and ties use competition ranking",()=>{
 let s=start(lobby(),1000);
 s=submit(s,"p1",1,1001);s=submit(s,"p2",1,1002);
 s=close(s,31000);
 assert.equal(s.players[0].score,100);
 assert.equal(s.players[1].score,100);
 assert.deepEqual(ranking(s).map(x=>x.rank),[1,1]);
 assertInvariants(s);
 s=advance(s,32000);
 s=submit(s,"p1",0,32002);
 s=close(s,47000);
 assert.equal(s.players[0].score,100,"Poll grants no score");
 assert.equal(s.history[1].tally[0],1);
 s=advance(s,48000);
 s=submit(s,"p1",0,48005);
 s=close(s,69000);
 assert.equal(s.status,"completed");
 assert.deepEqual(ranking(s).map(x=>x.rank),[1,2]);
 assertInvariants(s);
 assert.throws(()=>advance(s,70000));
});
test("pause freezes remaining time and rejects submissions until resumed",()=>{
 let s=start(lobby(),1000);
 s=pause(s,6000);
 assert.equal(remaining(s,100000),25000);
 assert.throws(()=>submit(s,"p1",1,10000),/not accepting/);
 s=resume(s,100000);
 assert.equal(remaining(s,100000),25000);
 s=submit(s,"p1",1,100001);
 assert.equal(s.answers.p1.choice,1);
 assertInvariants(s);
});
test("discarding active activity preserves previous scores",()=>{
 let s=start(lobby(),1000);
 s=submit(s,"p1",1,1001);
 s=close(s,2000);
 s=advance(s,3000);
 s=submit(s,"p1",0,3001);
 s=endSession(s,4000);
 assert.equal(s.status,"completed");
 assert.equal(s.history.length,2);
 assert.equal(s.history[1].discarded,true);
 assert.equal(s.players[0].score,100);
 assert.equal(s.players[1].score,0);
 assertInvariants(s);
 assert.throws(()=>endSession(s,5000),/already completed/);
});
test("the previous state never mutates",()=>{
 const s=lobby(),original=JSON.stringify(s);
 const next=start(s,1000);
 assert.equal(JSON.stringify(s),original);
 assert.equal(next.current,0);
});
test("invalid activity configuration is rejected",()=>{
 assert.throws(()=>makeSession([{type:"Quiz",question:"A",options:["Yes","No"],correct:2,timer:30}]),/Correct index/);
 assert.throws(()=>makeSession([{type:"Wheel",question:"A",options:["Yes","No"],timer:30}]),/Unsupported/);
});
