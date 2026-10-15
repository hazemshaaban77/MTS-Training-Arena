import test from "node:test";
import assert from "node:assert/strict";
import {prepareClosedRound,prepareLeaderboard,addSettlementToLedger} from "./round-settlement.mjs";

const participants={p1:{name:"Ali",team:"Blue"},p2:{name:"Mona",team:"Green"},p3:{name:"Sara",team:"Blue"}};
const args={
 roomId:"aabbccddeeff001122334455",roundId:"r1",
 publicRound:{round:"r1",status:"between",options:["True","False"]},
 privateRound:{roundId:"r1",kind:"Quiz",correctIndex:0,pointsPerCorrect:100},
 participants,answers:{p1:{choice:0},p2:{choice:1}}
};
test("settles a closed quiz and produces server-side ranking",()=>{
 const event=prepareClosedRound(args);
 assert.deepEqual(event.awards,{p1:100,p2:0,p3:0});
 const ledger=addSettlementToLedger(null,event);
 const board=prepareLeaderboard({participants,ledger});
 assert.deepEqual(board.players.map(p=>[p.uid,p.score,p.rank]),[["p1",100,1],["p2",0,2],["p3",0,2]]);
 assert.deepEqual(board.teams.map(t=>[t.team,t.score,t.rank]),[["Blue",100,1],["Green",0,2]]);
 assert.equal(board.settledRounds,1);
});
test("rejects settling an active round or wrong answer key",()=>{
 assert.throws(()=>prepareClosedRound({...args,publicRound:{...args.publicRound,status:"question"}}),/closed/);
 assert.throws(()=>prepareClosedRound({...args,privateRound:{...args.privateRound,roundId:"r2"}}),/answer key/);
});
test("rejects unknown participant and invalid option",()=>{
 assert.throws(()=>prepareClosedRound({...args,answers:{intruder:{choice:0}}}),/Invalid participant/);
 assert.throws(()=>prepareClosedRound({...args,answers:{p1:{choice:2}}}),/Invalid answer/);
});
test("live polls contribute no points; discarded rounds contribute none",()=>{
 const poll=prepareClosedRound({...args,privateRound:{roundId:"r1",kind:"Live Poll"}});
 const discarded=prepareClosedRound({...args,discard:true});
 assert.equal(poll.awards.p1,0);
 assert.equal(discarded.awards.p1,0);
});
test("immutable ledger guard blocks replay and ledger never mutates",()=>{
 const event=prepareClosedRound(args);
 const existing={r1:event};
 assert.throws(()=>addSettlementToLedger(existing,event),/already settled/);
 assert.equal(Object.keys(existing).length,1);
 assert.throws(()=>prepareLeaderboard({participants,ledger:{r2:event}}),/key mismatch/);
});
