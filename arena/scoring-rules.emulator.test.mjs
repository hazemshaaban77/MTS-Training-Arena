import test,{before,after} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {initializeTestEnvironment,assertFails,assertSucceeds} from "@firebase/rules-unit-testing";

const rules=JSON.parse(readFileSync(new URL("./security/scoring-rules.proposal.json",import.meta.url),"utf8"));
const original=JSON.parse(readFileSync(new URL("./security/merged-rules.candidate.json",import.meta.url),"utf8"));
const room="abc123abc123abc123abc123";
const room2="bbb123bbb123bbb123bbb123";
const scorePath="arenaV1/scoreboards/"+room;
let env;
const db=uid=>env.authenticatedContext(uid).database();
before(async()=>{
  env=await initializeTestEnvironment({projectId:"demo-mts-arena",database:{host:"127.0.0.1",port:9000,rules:JSON.stringify(rules)}});
  await env.clearDatabase();
  await env.withSecurityRulesDisabled(async context=>{
    const d=context.database();
    await d.ref("arenaV1/trainerAllowlist/trusted-trainer").set(true);
    await d.ref("arenaV1/rooms/"+room+"/public").set({title:"Testing",status:"between",round:"r1",question:"Demo",options:["A","B"],deadline:1,joinOpen:true});
    await d.ref("arenaV1/participants/"+room+"/member1").set({name:"Member One",employeeId:"TEST1",joinedRound:"r0"});
    await d.ref(scorePath).set({players:[{uid:"member1",name:"Member One",score:100,rank:1}],teams:[],settledRounds:1});
    await d.ref("arenaV1/scoreboards/"+room2).set({players:[{name:"Private",score:0}]});
  });
});
after(async()=>{if(env)await env.cleanup()});
test("legacy Firebase trees and existing arena rules remain exactly unchanged",()=>{
  for(const [key,value] of Object.entries(original.rules)){
    if(key==="arenaV1")continue;
    assert.deepEqual(rules.rules[key],value);
  }
  for(const [key,value] of Object.entries(original.rules.arenaV1))
    assert.deepEqual(rules.rules.arenaV1[key],value);
  assert.deepEqual(Object.keys(rules.rules.arenaV1).sort(),[...Object.keys(original.rules.arenaV1),"scoreboards"].sort());
});
test("trainer and registered room member can view published results",async()=>{
  await assertSucceeds(db("trusted-trainer").ref(scorePath).get());
  await assertSucceeds(db("member1").ref(scorePath).get());
});
test("outsiders and unauthenticated users cannot see a scoreboard",async()=>{
  await assertFails(db("stranger").ref(scorePath).get());
  await assertFails(env.unauthenticatedContext().database().ref(scorePath).get());
  await assertFails(db("member1").ref("arenaV1/scoreboards/"+room2).get());
});
test("every client is blocked from creating, editing or deleting authoritative scores",async()=>{
  for(const uid of ["trusted-trainer","member1","stranger"]){
    await assertFails(db(uid).ref(scorePath+"/players/0/score").set(999999));
    await assertFails(db(uid).ref(scorePath).remove());
    await assertFails(db(uid).ref("arenaV1/scoreboards/"+room2).set({settledRounds:5}));
  }
});
test("even a permitted reader cannot list scoreboards globally",async()=>{
  await assertFails(db("trusted-trainer").ref("arenaV1/scoreboards").get());
});
