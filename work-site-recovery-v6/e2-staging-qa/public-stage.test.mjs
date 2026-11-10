import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {joinUrl,stageFromV6,fetchPublicStage,PublicStageError} from "../public/e2-preview/v6-public-stage.mjs";

// Realistic V6 /api/state payload shape, with deliberate private fields to verify redaction.
// Source contract: lib/service.ts + lib/domain.mjs on develop/v6-github-arena.
const response={
 code:"123456",title:"ImportVerse Pilot",language:"ar",teamMode:true,status:"question",current:0,
 revision:14,deadline:11_000,serverNow:10_000,paused:false,remaining:1000,
 reveal:null,keyRevealed:false,
 players:[{uid:"internal-user-A",name:"Participant A",employeeId:"EMP-SECRET",approval:"approved",token:"PRIVATE-TOKEN"},
  {uid:"internal-user-B",name:"Participant B",employeeId:"EMP-ALSO-SECRET",approval:"pending"}],
 teams:[{team:"Wave",score:18,rank:2,members:1},{team:"Lightning",score:26,rank:1,members:1}],
 individual:[{uid:"internal-user-A",name:"PERSONAL NAME",score:40}],
 activity:{type:"Quiz",mainType:"Quiz",prompt:"ACID?",options:["First","Second","Third"],correct:1,
  private_answer:"ANSWER-SECRET",explanation:"PRIVATE-EXPLANATION"},
 runtime:{phase:"playing",notes:"PRIVATE HOST NOTES"},owner:"PRIVATE-OWNER-ID",settings:{trainerSecret:"DO-NOT-EXPOSE"},
 mine:{id:"USER-SECRET",employeeId:"EMP-SECRET"},submitted:1
};
test("join URL contains only a stable six-digit code; no host query or credentials",()=>{
 assert.equal(joinUrl("https://arena.test/?token=SECRET#x","123456"),"https://arena.test/?view=join&code=123456");
 assert.equal(joinUrl("https://hazemshaaban77.github.io/MTS-Training-Arena/v6/?token=PRIVATE","123456"),"https://hazemshaaban77.github.io/MTS-Training-Arena/v6/?view=join&code=123456");
 assert.equal(joinUrl("https://hazemshaaban77.github.io/MTS-Training-Arena/v6/host?token=PRIVATE","123456"),"https://hazemshaaban77.github.io/MTS-Training-Arena/v6/?view=join&code=123456");
 assert.equal(joinUrl("https://alice:secret@arena.test/admin?token=SECRET","123456"),"https://arena.test/?view=join&code=123456");
 assert.equal(joinUrl("http://localhost:8090","123456"),"http://localhost:8090/?view=join&code=123456");
 assert.throws(()=>joinUrl("http://arena.test","123456"),{code:"INSECURE_ORIGIN"});
 assert.throws(()=>joinUrl("https://arena.test","BADCODE"),{code:"INVALID_CODE"});
});
test("question projection includes only whitelisted fields; no private data",()=>{
 const stage=stageFromV6(response);
 assert.equal(stage.scene,"question");
 assert.equal(stage.participantCount,1);
 assert.equal(stage.submitted,1);
 assert.equal(stage.teams[0].name,"Lightning");
 assert.equal(stage.teams[0].points,26);
 assert.equal(stage.activity.correct,undefined);
 const json=JSON.stringify(stage);
 for(const sensitive of ["EMP-SECRET","EMP-ALSO-SECRET","PRIVATE-TOKEN","PERSONAL NAME","ANSWER-SECRET","PRIVATE-EXPLANATION","PRIVATE HOST NOTES","PRIVATE-OWNER-ID","DO-NOT-EXPOSE","USER-SECRET"])
  assert.ok(!json.includes(sensitive),sensitive+" must not leak");
});
test("deadline locks but cannot disclose correct answer",()=>{
 const stage=stageFromV6({...response,serverNow:12_000});
 assert.equal(stage.scene,"locked");
 assert.equal(stage.activity.correct,undefined);
});
test("server results flag alone cannot reveal; keyRevealed=true is required",()=>{
 const locked=stageFromV6({...response,status:"results",keyRevealed:false});
 assert.equal(locked.scene,"locked");
 assert.equal(locked.activity.correct,undefined);
 const revealed=stageFromV6({...response,status:"results",keyRevealed:true});
 assert.equal(revealed.scene,"reveal");
 assert.equal(revealed.activity.correct,1);
});
test("forged keyRevealed while question active never leaks a correct answer",()=>{
 const stage=stageFromV6({...response,keyRevealed:true});
 assert.equal(stage.scene,"question");
 assert.equal(stage.activity.correct,undefined);
});
test("revealed results do not pass arbitrary answer objects or arrays",()=>{
 const stage=stageFromV6({...response,status:"results",keyRevealed:true,activity:{...response.activity,correct:{"secret":"KEY"},privateData:"SECRET-VALUE"}});
 assert.equal(stage.activity.correct,undefined);
 assert.ok(!JSON.stringify(stage).includes("SECRET-VALUE"));
});
test("survey, lobby, podium, and draft scenes map without releasing private information",()=>{
 assert.equal(stageFromV6({...response,status:"lobby"}).scene,"lobby");
 assert.equal(stageFromV6({...response,status:"completed"}).scene,"podium");
 assert.equal(stageFromV6({...response,status:"survey"}).scene,"survey");
 assert.equal(stageFromV6({...response,status:"draft"}).scene,"not-ready");
});
test("stale revision and malformed snapshots fail closed",()=>{
 const previous=stageFromV6(response);
 assert.throws(()=>stageFromV6({...response,revision:13},previous),{code:"STALE_SNAPSHOT"});
 assert.throws(()=>stageFromV6({...response,status:"bad"}),{code:"INVALID_SNAPSHOT"});
 assert.throws(()=>stageFromV6({...response,code:"ABC123"}),{code:"INVALID_SNAPSHOT"});
 assert.throws(()=>stageFromV6({...response,revision:-1}),{code:"INVALID_SNAPSHOT"});
});
test("poll tallies are numeric-only, correctly bounded, and displayed only if allowed",()=>{
 const poll={...response,activity:{type:"Live Poll",prompt:"Rate the session",options:["1","2","3"]},tally:[2,-1,"8",900]};
 const live=stageFromV6(poll);
 assert.deepEqual(live.tally,[2,0,0,900]);
 const quiz=stageFromV6({...response,tally:[2,4]});
 assert.equal(quiz.tally,null);
});
test("public GET never includes trainer/player credentials, uses only session code",async()=>{
 let request;
 const result=await fetchPublicStage("https://arena.test/host?token=SENSITIVE","123456",{fetchImpl:async(url,opts)=>{
  request={url,opts};return {ok:true,json:async()=>response};
 }});
 assert.equal(result.scene,"question");
 assert.equal(request.url,"https://arena.test/api/state?code=123456");
 assert.equal(request.opts.method,"GET");
 assert.equal(request.opts.credentials,"omit");
 for(const key of ["token","authorization","x-firebase-token","player-token"]){
  assert.ok(!JSON.stringify(request).toLowerCase().includes(key));
 }
});
test("non-200 and invalid JSON fail without falling back to demo results",async()=>{
 const failing=async(status)=>fetchPublicStage("https://arena.test","123456",{fetchImpl:async()=>({ok:false,status})});
 await assert.rejects(failing(404),{code:"NOT_FOUND"});
 await assert.rejects(failing(401),{code:"ACCESS_DENIED"});
 await assert.rejects(failing(500),{code:"STATE_UNAVAILABLE"});
 await assert.rejects(fetchPublicStage("https://arena.test","123456",{fetchImpl:async()=>({ok:true,json:async()=>{throw Error("bad json")}})}),{code:"INVALID_RESPONSE"});
 await assert.rejects(fetchPublicStage("https://arena.test","123456",{fetchImpl:async()=>{throw Error("offline")}}),{code:"NETWORK_UNAVAILABLE"});
});


test("E2 Cloudflare staging cannot point at production Worker, D1, Pages or Firebase",()=>{
 const fs=requireReadFile();
 const stage=fs("wrangler.e2-staging.toml");
 const live=fs("wrangler.github.toml");
 const worker=fs("github-api-worker.ts");
 const frontend=fs("lib/firebase-client.ts");
 assert.match(stage,/name\\s*=\\s*"mts-training-arena-e2-staging-api"/);
 assert.match(stage,/database_name\\s*=\\s*"mts-training-arena-e2-staging"/);
 assert.match(stage,/database_id\\s*=\\s*"becba428-cc2d-45c3-9930-438726906d79"/);
 assert.match(stage,/ARENA_PUBLIC_ORIGIN\\s*=\\s*"https:\/\/mts-training-arena-e2-staging\\.pages\\.dev"/);
 assert.match(stage,/ARENA_DEPLOYMENT\\s*=\\s*"e2-staging"/);
 assert.match(stage,/ARENA_STAGING_LOCK\\s*=\\s*"locked"/);
 assert.notEqual(stage.match(/^database_id\\s*=\\s*"([^"]+)"/m)?.[1],
  live.match(/^database_id\\s*=\\s*"([^"]+)"/m)?.[1]);
 assert.notEqual(stage.match(/^name\\s*=\\s*"([^"]+)"/m)?.[1],
  live.match(/^name\\s*=\\s*"([^"]+)"/m)?.[1]);
 assert.ok(!stage.includes("CLOUDINARY_API_SECRET"));
 assert.ok(!stage.includes("FIREBASE_SERVICE_ACCOUNT"));
 assert.match(worker,/if\\(env\\.ARENA_DEPLOYMENT==='e2-staging'\\)/);
 assert.match(worker,/STAGING_LOCKED/);
 assert.match(frontend,/STAGING_FIREBASE_NOT_CONFIGURED/);
});
function requireReadFile(){
 return filename=>readFileSync(new URL("../"+filename,import.meta.url),"utf8");
}
