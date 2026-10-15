import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const rules = JSON.parse(readFileSync(new URL("./security/arena-rules.reference.json", import.meta.url),"utf8"));
const arena=rules.rules.arenaV1;
test("reference rules are scoped to arenaV1 with default deny",()=>{
 assert.deepEqual(Object.keys(rules.rules),["arenaV1"]);
 assert.equal(arena[".read"],false);
 assert.equal(arena[".write"],false);
});
test("trainer allowlist cannot be written by browser",()=>{
 assert.equal(arena.trainerAllowlist.$uid[".write"],false);
});
test("public session content excludes answer keys",()=>{
 const p=arena.rooms.$roomId.public;
 assert.match(p[".validate"],/hasChildren/);
 assert.equal(p.$other[".validate"],false);
 assert.ok(!Object.keys(p).includes("correct"));
});
test("answers are immutable to participants and gated to active round",()=>{
 const round=arena.answers.$roomId.$round;
 const write=round.$uid[".write"];
 assert.match(write,/!data\.exists/);
 assert.match(write,/auth\.uid === \$uid/);
 assert.match(write,/public\/status/);
 assert.match(write,/public\/round/);
 assert.match(write,/deadline/);
 assert.match(round[".read"],/trainerAllowlist/);
});
test("claims require unclaimed identifiers and open rooms",()=>{
 const claim=arena.claims.$roomId.$employeeId;
 assert.match(claim[".write"],/!data\.exists/);
 assert.match(claim[".write"],/joinOpen/);
});
test("per-user profile restricted, answer choices numeric and bounded",()=>{
 const p=arena.participants.$roomId.$uid;
 assert.match(p[".read"],/auth\.uid === \$uid/);
 const c=arena.answers.$roomId.$round.$uid.choice[".validate"];
 assert.match(c,/public\/options/);
 assert.match(c,/\.exists\(\)/);
});

test("late joiners cannot submit an answer to the round in which they joined",()=>{
 const p=arena.participants.$roomId.$uid;
 assert.match(p[".write"],/joinedRound/);
 assert.match(p[".write"],/public\/round/);
 assert.match(p[".validate"],/joinedRound/);
 const answer=arena.answers.$roomId.$round.$uid[".write"];
 assert.match(answer,/joinedRound/);
 assert.match(answer,/!== \$round/);
});

test("session closure is permanent and no implicit question change while active",()=>{
 const p=arena.rooms.$roomId.public;
 assert.match(p[".write"],/newData\.exists\(\)/);
 assert.match(p[".write"],/!== 'completed'/);
 assert.match(p[".validate"],/status/);
 assert.match(p[".validate"],/question/);
 assert.match(p[".validate"],/deadline/);
});
