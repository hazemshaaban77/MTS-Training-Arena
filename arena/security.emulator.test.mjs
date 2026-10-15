import test, {after, before} from "node:test";
import {readFileSync} from "node:fs";
import {initializeTestEnvironment, assertFails, assertSucceeds} from "@firebase/rules-unit-testing";

const room="abc123abc123abc123abc123", root="arenaV1";
const roomPath=root+"/rooms/"+room;
let env;
const trainee=uid=>env.authenticatedContext(uid).database();
const trainer=()=>env.authenticatedContext("trusted-trainer").database();
const outsider=()=>env.authenticatedContext("other-user").database();
before(async()=>{
  env=await initializeTestEnvironment({
    projectId:"demo-mts-arena",
    database:{rules:readFileSync(new URL("./security/arena-rules.reference.json",import.meta.url),"utf8"),host:"127.0.0.1",port:9000}
  });
  await env.clearDatabase();
  await env.withSecurityRulesDisabled(async context=>{
    const db=context.database();
    await db.ref(root+"/trainerAllowlist/trusted-trainer").set(true);
    await db.ref(roomPath+"/public").set({title:"Test Training",status:"lobby",round:"r0",question:"Ready",options:["Waiting","Waiting"],deadline:0,joinOpen:true});
    await db.ref(roomPath+"/private").set({createdBy:"trusted-trainer"});
  });
});
after(async()=>{if(env)await env.cleanup()});
test("no access without authorization and no client self-promotion",async()=>{
  await assertFails(env.unauthenticatedContext().database().ref(roomPath+"/public").get());
  await assertFails(outsider().ref(roomPath+"/public/status").set("completed"));
  await assertFails(outsider().ref(root+"/trainerAllowlist/other-user").set(true));
  await assertFails(outsider().ref(roomPath+"/private").get());
  await assertSucceeds(trainer().ref(roomPath+"/private").get());
});
test("trainer can publish approved question but cannot expose answer key publicly",async()=>{
  await assertSucceeds(trainer().ref(roomPath+"/public").set({title:"Test Training",status:"question",round:"r1",question:"Answer?",options:["A","B"],deadline:Date.now()+120000,joinOpen:true}));
  await assertFails(trainer().ref(roomPath+"/public/correct").set(1));
});
test("identity claim uniqueness and privacy",async()=>{
  const claim=root+"/claims/"+room+"/TEST001";
  await assertSucceeds(trainee("trainee-a").ref(claim).set("trainee-a"));
  await assertFails(trainee("trainee-b").ref(claim).set("trainee-b"));
  await assertFails(trainee("trainee-b").ref(claim).get());
  await assertSucceeds(trainee("trainee-a").ref(claim).get());
});
test("late joiner cannot answer already active round",async()=>{
  const p=root+"/participants/"+room+"/trainee-a";
  await assertSucceeds(trainee("trainee-a").ref(p).set({name:"Demo Trainee",employeeId:"TEST001",joinedRound:"r1"}));
  await assertFails(trainee("trainee-a").ref(root+"/answers/"+room+"/r1/trainee-a").set({choice:1}));
});
test("next round accepts exactly one answer and enforces privacy and deadline",async()=>{
  const now=Date.now();
  await assertSucceeds(trainer().ref(roomPath+"/public/status").set("between"));
  await assertSucceeds(trainer().ref(roomPath+"/public").set({title:"Test Training",status:"question",round:"r2",question:"Answer?",options:["A","B"],deadline:now+120000,joinOpen:true}));
  const path=root+"/answers/"+room+"/r2/trainee-a";
  await assertSucceeds(trainee("trainee-a").ref(path).set({choice:1}));
  await assertFails(trainee("trainee-a").ref(path).set({choice:0}));
  await assertFails(outsider().ref(path).get());
  await assertSucceeds(trainer().ref(root+"/answers/"+room+"/r2").get());
  await assertSucceeds(trainer().ref(roomPath+"/public/status").set("between"));
  await assertSucceeds(trainer().ref(roomPath+"/public").set({title:"Test Training",status:"question",round:"r3",question:"Expired",options:["A","B"],deadline:now-2000,joinOpen:true}));
  await assertFails(trainee("trainee-a").ref(root+"/answers/"+room+"/r3/trainee-a").set({choice:1}));
});
test("participant cannot read or modify someone else's identity",async()=>{
  await assertFails(outsider().ref(root+"/participants/"+room+"/trainee-a").get());
  await assertFails(outsider().ref(root+"/participants/"+room+"/trainee-a/name").set("Impostor"));
  await assertFails(trainee("trainee-a").ref(root+"/participants/"+room+"/trainee-a/name").set("Changed"));
});

test("completed room is sealed against reopen, edits and deletion",async()=>{
  const ref=trainer().ref(roomPath+"/public");
  await assertSucceeds(ref.update({status:"completed",joinOpen:false}));
  await assertFails(ref.child("status").set("question"));
  await assertFails(ref.child("question").set("Replaced question"));
  await assertFails(ref.remove());
  await assertFails(ref.update({status:"lobby",joinOpen:true}));
  await assertFails(trainee("trainee-b").ref(root+"/claims/"+room+"/TEST002").set("trainee-b"));
});
test("live question may not be silently replaced without closure",async()=>{
  const otherRoom="111111111111111111111111";
  await env.withSecurityRulesDisabled(async context=>{
    await context.database().ref(root+"/rooms/"+otherRoom+"/public").set({title:"Another",status:"question",round:"r1",question:"Original",options:["A","B"],deadline:Date.now()+100000,joinOpen:true});
  });
  const ref=trainer().ref(root+"/rooms/"+otherRoom+"/public");
  await assertFails(ref.child("question").set("Swap without closing"));
  await assertFails(ref.child("options/0").set("New option"));
  await assertFails(ref.child("options/2").set("Injected option"));
  await assertFails(ref.child("round").set("r2"));
  await assertFails(ref.child("deadline").set(Date.now()+500000));
  await assertSucceeds(ref.child("status").set("between"));
});
