import test from "node:test";
import assert from "node:assert/strict";
import {gradeClosedRound,totalFromLedger} from "./scoring.mjs";
const participants=["p1","p2","p3"];
test("grades once, awards correct answers only and counts submissions",()=>{
 const a=gradeClosedRound({roundId:"r1",kind:"Quiz",correctIndex:1,participantIds:participants,submissions:[{uid:"p1",choice:1},{uid:"p2",choice:0}]});
 assert.deepEqual(a.awards,{p1:100,p2:0,p3:0});
 assert.equal(a.submitted,2);
});
test("poll awards no points, and cancelled round contributes zero",()=>{
 const poll=gradeClosedRound({roundId:"r2",kind:"Live Poll",participantIds:participants,submissions:[{uid:"p1",choice:0}]});
 assert.deepEqual(poll.awards,{p1:0,p2:0,p3:0});
 const disc=gradeClosedRound({roundId:"r3",kind:"Dropdown",correctIndex:1,participantIds:participants,discard:true,submissions:[{uid:"p1",choice:1}]});
 assert.equal(disc.awards.p1,0);
 assert.deepEqual(totalFromLedger({participants,closedRounds:[poll,disc]}),{p1:0,p2:0,p3:0});
});
test("replay cannot credit same round twice",()=>{
 const a=gradeClosedRound({roundId:"r1",kind:"Quiz",correctIndex:0,participantIds:participants,submissions:[{uid:"p1",choice:0}]});
 assert.throws(()=>totalFromLedger({participants,closedRounds:[a,a]}),/already credited/);
});
test("rejects duplicate submissions, forged identities and suspicious presets",()=>{
 const base={roundId:"r1",kind:"Quiz",correctIndex:0,participantIds:participants};
 assert.throws(()=>gradeClosedRound({...base,submissions:[{uid:"p1",choice:0},{uid:"p1",choice:0}]}),/Duplicate/);
 assert.throws(()=>gradeClosedRound({...base,submissions:[{uid:"forged",choice:0}]}),/Invalid participant/);
 assert.throws(()=>gradeClosedRound({...base,submissions:[],pointsPerCorrect:-100}),/Invalid preset/);
});
test("excluded previously credited activity is recomputed without modifying other rounds",()=>{
 const p=gradeClosedRound({roundId:"r1",kind:"Quiz",correctIndex:1,participantIds:participants,submissions:[{uid:"p1",choice:1}]});
 const q=gradeClosedRound({roundId:"r2",kind:"Quiz",correctIndex:0,participantIds:participants,submissions:[{uid:"p2",choice:0}]});
 assert.deepEqual(totalFromLedger({participants,closedRounds:[p,q]}),{p1:100,p2:100,p3:0});
 assert.deepEqual(totalFromLedger({participants,closedRounds:[{...p,discarded:true},q]}),{p1:0,p2:100,p3:0});
});
