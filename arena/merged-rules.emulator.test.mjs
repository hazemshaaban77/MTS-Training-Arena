import test,{before,after} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {initializeTestEnvironment,assertFails,assertSucceeds} from "@firebase/rules-unit-testing";
import firebase from "firebase/compat/app";
import "firebase/compat/database";
const merged=JSON.parse(readFileSync(new URL("./security/merged-rules.candidate.json",import.meta.url),"utf8")).rules;
const expected={
 rooms:{"$room":{".read":"auth != null",".write":"auth.token.email === 'hazemshaaban65@gmail.com'",players:{"$uid":{name:{".write":"auth != null && auth.uid === $uid && !root.child('rooms').child($room).child('ctl').child('lock').exists() && !root.child('rooms').child($room).child('kicked').child(auth.uid).exists()",".validate":"newData.isString() && newData.val().length > 0 && newData.val().length <= 30"}}}}},
 ans:{"$room":{".read":"auth.token.email === 'hazemshaaban65@gmail.com'",".write":"auth.token.email === 'hazemshaaban65@gmail.com'","$q":{"$uid":{".write":"auth != null && auth.uid === $uid && !data.exists()",".validate":"newData.hasChildren(['k','ts']) && newData.child('k').isNumber() && newData.child('ts').val() === now"}}}},
 eids:{"$room":{".read":"auth.token.email === 'hazemshaaban65@gmail.com'",".write":"auth.token.email === 'hazemshaaban65@gmail.com'","$eid":{".write":"auth != null && (!data.exists() || data.val() === auth.uid)",".validate":"newData.isString() && newData.val() === auth.uid && $eid.length <= 20"}}}
};
test("all three legacy rule subtrees preserved byte-equivalent as JSON objects",()=>{
 for(const [key,value] of Object.entries(expected))assert.deepEqual(merged[key],value);
 assert.ok(merged.arenaV1);
 assert.deepEqual(Object.keys(merged).sort(),["ans","arenaV1","eids","rooms"].sort());
});
let env;
const room="roomdemo";
const user=()=>env.authenticatedContext("player1").database();
const oldAdmin=()=>env.authenticatedContext("old-admin",{email:"hazemshaaban65@gmail.com"}).database();
const stranger=()=>env.authenticatedContext("stranger",{email:"not-the-admin@example.com"}).database();
before(async()=>{
 env=await initializeTestEnvironment({projectId:"demo-mts-arena",database:{host:"127.0.0.1",port:9000,rules:JSON.stringify({rules:merged})}});
 await env.clearDatabase();
 await env.withSecurityRulesDisabled(async c=>{
  await c.database().ref("rooms/"+room).set({players:{},ctl:{},kicked:{}});
  await c.database().ref("arenaV1/trainerAllowlist/trusted-trainer").set(true);
 });
});
after(async()=>{if(env)await env.cleanup()});
test("old rooms: any signed-in user reads, only old admin may edit root",async()=>{
 await assertSucceeds(user().ref("rooms/"+room).get());
 await assertFails(env.unauthenticatedContext().database().ref("rooms/"+room).get());
 await assertFails(stranger().ref("rooms/"+room+"/ctl/lock").set(true));
 await assertSucceeds(oldAdmin().ref("rooms/"+room+"/ctl/lock").set(true));
});
test("old answer tree remains admin-readable, player may write own immutable answer",async()=>{
 await assertFails(user().ref("ans/"+room).get());
 await assertSucceeds(oldAdmin().ref("ans/"+room).get());
 const attempt=user().ref("ans/"+room+"/q0/player1");
 await assertSucceeds(attempt.set({k:1,ts:firebase.database.ServerValue.TIMESTAMP}));
 await assertFails(attempt.set({k:2,ts:firebase.database.ServerValue.TIMESTAMP}));
});
test("old EIDs still allow player to claim only own id and preserve immutability of other ids",async()=>{
 await assertSucceeds(user().ref("eids/"+room+"/EMP01").set("player1"));
 await assertFails(stranger().ref("eids/"+room+"/EMP01").set("stranger"));
 await assertFails(user().ref("eids/"+room).get());
});
test("new Arena allowlist cannot be self-assigned and namespaces are separated",async()=>{
 await assertFails(user().ref("arenaV1/trainerAllowlist/player1").set(true));
 await assertFails(user().ref("arenaV1/rooms/newroom/private").set({secret:"x"}));
 await assertSucceeds(env.authenticatedContext("trusted-trainer").database().ref("arenaV1/trainerAllowlist/trusted-trainer").get());
});
