import test from "node:test";
import assert from "node:assert/strict";
import {createTeams,requestTransfer,cancelTransfer,applyPendingTransfers,teamRanking} from "./team-engine.mjs";
const initial=()=>createTeams(["Blue","Green"],[{id:"a",team:"Blue",score:100},{id:"b",team:"Green",score:50},{id:"c",team:"Blue",score:50}]);
test("during active question transfer is queued, and preserves earned points",()=>{
 const orig=initial(),queued=requestTransfer(orig,"a","Green",true);
 assert.equal(orig.participants[0].team,"Blue");
 assert.equal(queued.participants[0].team,"Blue");
 assert.equal(queued.pending.a,"Green");
 const applied=applyPendingTransfers(queued);
 assert.equal(applied.participants[0].team,"Green");
 assert.equal(applied.participants[0].score,100);
 assert.deepEqual(teamRanking(applied).map(t=>[t.id,t.score]),[["Green",150],["Blue",50]]);
 assert.deepEqual(applied.pending,{});
});
test("pending transfer can be cancelled before activity completes",()=>{
 const s=requestTransfer(initial(),"a","Green",true);
 const cancelled=cancelTransfer(s,"a");
 assert.equal(applyPendingTransfers(cancelled).participants[0].team,"Blue");
 assert.throws(()=>cancelTransfer(cancelled,"a"));
});
test("instant transfer between questions and deterministic equal rank",()=>{
 const s=createTeams(["Blue","Green"],[{id:"a",team:"Blue",score:100},{id:"b",team:"Green",score:100}]);
 assert.deepEqual(teamRanking(s).map(x=>x.rank),[1,1]);
 const moved=requestTransfer(s,"a","Green",false);
 assert.equal(moved.participants[0].team,"Green");
 assert.deepEqual(moved.pending,{});
});
test("average scoring uses assigned members only",()=>{
 const s=createTeams(["Blue","Green"],[{id:"a",team:"Blue",score:100},{id:"b",team:"Blue",score:0},{id:"c",team:"Green",score:60}],"average");
 assert.deepEqual(teamRanking(s).map(t=>[t.id,t.score]),[["Green",60],["Blue",50]]);
});
test("bad transfers and duplicate IDs are rejected",()=>{
 assert.throws(()=>requestTransfer(initial(),"a","Red",true));
 assert.throws(()=>requestTransfer(initial(),"unknown","Blue",false));
 assert.throws(()=>createTeams(["A","B"],[{id:"x",team:"A",score:0},{id:"x",team:"B",score:0}]));
});
