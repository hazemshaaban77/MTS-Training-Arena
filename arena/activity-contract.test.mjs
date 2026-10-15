import test from "node:test";
import assert from "node:assert/strict";
import {TYPES,validateActivity,evaluateActivity,revealPresentation,validateActivityTree,flattenTree,ranking} from "./activity-contract.mjs";
const base={prompt:"Training activity",timer:30};
const data={
 "Quiz":{...base,type:"Quiz",options:["A","B"],correct:1},
 "Live Poll":{...base,type:"Live Poll",options:["A","B"],correct:null},
 "Order It":{...base,type:"Order It",items:["First","Second","Third"],order:[2,0,1]},
 "Match It":{...base,type:"Match It",left:["One","Two"],right:["First","Second"],pairs:[1,0]},
 "Categorize":{...base,type:"Categorize",categories:["Import","Export"],items:["A","B","C"],assignments:[0,1,0]},
 "Spin Wheel":{...base,type:"Spin Wheel",items:["Prize","Question"]},
 "Open the Box":{...base,type:"Open the Box",items:["Box A","Box B"]},
 "Flashcards":{...base,type:"Flashcards",fronts:["ACI","ACID"],backs:["Advance Cargo Information","Advance Cargo Information Declaration"]},
 "Ultimate Game Show":{...base,type:"Ultimate Game Show",options:["A","B"],correct:0},
 "Scenario Challenge":{...base,type:"Scenario Challenge",options:["Escalate","Ignore"],correct:0},
 "Dropdown":{...base,type:"Dropdown",options:["Correct","Wrong"],correct:0}
};
test("all eleven activity contracts validate",()=>{
 assert.equal(TYPES.length,11);
 assert.deepEqual([...Object.keys(data)].sort(),[...TYPES].sort());
 TYPES.forEach(type=>assert.equal(validateActivity(data[type]),true));
});
test("single-choice grading is deterministic and correctly scored",()=>{
 for(const type of ["Quiz","Dropdown","Ultimate Game Show","Scenario Challenge"]){
  const a=data[type];assert.deepEqual(evaluateActivity(a,a.correct),{graded:true,correct:true,points:100});
  assert.equal(evaluateActivity(a,a.correct===0?1:0).points,0);
  assert.throws(()=>evaluateActivity(a,-1));
 }
});
test("poll votes remain ungraded and invalid keys are refused",()=>{
 assert.deepEqual(evaluateActivity(data["Live Poll"],1),{graded:false,correct:null,points:0});
 assert.throws(()=>validateActivity({...data["Live Poll"],correct:1}));
});
test("matching, ordering and categorizing evaluate complete correct solutions only",()=>{
 const cases=[["Order It","order"],["Match It","pairs"],["Categorize","assignments"]];
 for(const [type,key] of cases){
  const a=data[type];assert.equal(evaluateActivity(a,a[key]).points,100);
  const wrong=[...a[key]];wrong[0]=type==="Categorize"?(wrong[0]===0?1:0):wrong[1];
  if(type!=="Categorize")wrong[1]=a[key][0];
  assert.equal(evaluateActivity(a,wrong).points,0);
  assert.throws(()=>evaluateActivity(a,[999]));
 }
});
test("presentation games do not add points and use externally chosen outcome",()=>{
 for(const type of ["Spin Wheel","Open the Box","Flashcards"]){
  const a=data[type];assert.deepEqual(evaluateActivity(a,null),{graded:false,correct:null,points:0});
  assert.throws(()=>evaluateActivity(a,0));
  assert.throws(()=>revealPresentation(a,99));
 }
 assert.equal(revealPresentation(data["Spin Wheel"],0),"Prize");
 assert.deepEqual(revealPresentation(data.Flashcards,0),{front:"ACI",back:"Advance Cargo Information"});
});
test("tree max depth three, duplicate IDs and flattened order",()=>{
 const tree=[{id:"parent",children:[{id:"child",children:[{id:"grandchild"}]}]}];
 assert.equal(validateActivityTree(tree),true);
 assert.deepEqual(flattenTree(tree).map(n=>[n.id,n.depth]),[["parent",1],["child",2],["grandchild",3]]);
 assert.throws(()=>validateActivityTree([{id:"a",children:[{id:"b",children:[{id:"c",children:[{id:"d"}]}]}]}]),/depth/);
 assert.throws(()=>validateActivityTree([{id:"a"},{id:"a"}]),/Duplicate/);
});
test("competition ranking is 1-1-3, not dense 1-1-2",()=>{
 assert.deepEqual(ranking([{id:"a",score:100},{id:"b",score:100},{id:"c",score:40}]).map(r=>r.rank),[1,1,3]);
});
test("invalid activity authoring rejected",()=>{
 assert.throws(()=>validateActivity({...data.Quiz,correct:30}));
 assert.throws(()=>validateActivity({...data["Match It"],pairs:[0,0]}));
 assert.throws(()=>validateActivity({...data["Order It"],order:[0,0,1]}));
 assert.throws(()=>validateActivity({...data["Categorize"],assignments:[0,2,0]}));
});
