import test from "node:test";
import assert from "node:assert/strict";
import {rankPlayers,rankTeams} from "./leaderboard.mjs";
const participants=[
 {uid:"u1",name:"Mona",team:"Blue"},
 {uid:"u2",name:"Ali",team:"Green"},
 {uid:"u3",name:"Nour",team:"Green"},
 {uid:"u4",name:"Sara",team:"Blue"}
];
test("players sort by score, give tied scores the same competition rank",()=>{
 const result=rankPlayers({participants,totals:{u1:200,u2:100,u3:200,u4:0}});
 assert.deepEqual(result.map(r=>[r.uid,r.rank]),[["u1",1],["u3",1],["u2",3],["u4",4]]);
});
test("teams rank by sum and average with deterministic tie breaking",()=>{
 const totals={u1:100,u2:100,u3:0,u4:0};
 const sum=rankTeams({participants,totals});
 assert.deepEqual(sum.map(r=>[r.team,r.score,r.rank]),[["Blue",100,1],["Green",100,1]]);
 const average=rankTeams({participants,totals,mode:"average"});
 assert.deepEqual(average.map(r=>[r.team,r.score,r.rank]),[["Blue",50,1],["Green",50,1]]);
});
test("unassigned users excluded from teams but retained in player ranking",()=>{
 const result=rankTeams({participants:[{uid:"u1",name:"Mona",team:null}],totals:{u1:40}});
 assert.deepEqual(result,[]);
});
test("refuses forged, missing, invalid, negative and fractional scores",()=>{
 assert.throws(()=>rankPlayers({participants,totals:{u1:10}}),/Missing or invalid/);
 assert.throws(()=>rankPlayers({participants:[participants[0],participants[0]],totals:{u1:10}}),/repeated/);
 assert.throws(()=>rankTeams({participants,totals:{u1:-5,u2:0,u3:0,u4:0}}),/trusted score/);
 assert.throws(()=>rankTeams({participants,totals:{u1:0.5,u2:0,u3:0,u4:0}}),/trusted score/);
 assert.throws(()=>rankTeams({participants:[],totals:{},mode:"faster"}),/Invalid team/);
});
test("does not mutate inputs",()=>{
 const data={participants:[...participants],totals:{u1:1,u2:2,u3:3,u4:4}};
 const original=structuredClone(data);
 rankPlayers(data);rankTeams({...data,mode:"average"});
 assert.deepEqual(data,original);
});
