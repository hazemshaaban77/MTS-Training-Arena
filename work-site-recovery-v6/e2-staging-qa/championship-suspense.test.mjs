import {test} from 'node:test';
import assert from 'node:assert/strict';
import {showStart,showCommand,showPublic,CHAMPIONSHIP_SUSPENSE_MS} from '../lib/championship.mjs';

const game={type:'Ultimate Game Show',showFormat:'championship',safeLevels:[1],
 questions:[100,300,700].map((points,i)=>({type:'Quiz',prompt:'Level '+(i+1),options:['A','B','C','D'],correct:1,timer:30,points}))};
const cast=(s=showStart())=>showCommand(game,s,'cast',{player:'p',attemptId:'attempt-p'},1000,null);
test('server locks the answer without revealing before exactly two seconds',()=>{
 const init=cast(),lock=showCommand(game,init.show,'answer',{player:'p',answer:1},2000,init.deadline);
 assert.equal(CHAMPIONSHIP_SUSPENSE_MS,2000);
 assert.equal(lock.show.phase,'suspense');assert.equal(lock.deadline,4000);
 const pub=showPublic(game,lock.show,'viewer');
 assert.equal(pub.canAnswer,false);assert.equal(pub.lastReveal,null);
 assert.equal('pending' in pub,false,'The committed answer remains private');
 assert.throws(()=>showCommand(game,lock.show,'resolve',{},3999,4000),/SHOW_STATE/);
 assert.throws(()=>showCommand(game,lock.show,'answer',{player:'p',answer:1},3000,4000),/SHOW_STATE/);
 const next=showCommand(game,lock.show,'resolve',{},4000,4000);
 assert.equal(next.show.phase,'answering');assert.equal(next.show.current.level,1);
 assert.equal(next.show.lastReveal.correct,true);assert.equal(next.deadline,34000);
});
test('wrong answer releases only the last safe level once resolved',()=>{
 const init=cast(),first=showCommand(game,init.show,'answer',{player:'p',answer:1},2000,init.deadline);
 const next=showCommand(game,first.show,'resolve',{},4000,4000);
 const locked=showCommand(game,next.show,'answer',{player:'p',answer:0},5000,next.deadline);
 const settled=showCommand(game,locked.show,'resolve',{},7000,7000);
 assert.equal(settled.show.phase,'casting');assert.equal(settled.payout.points,100);
 assert.equal(settled.show.lastCompleted.status,'eliminated');
 assert.equal(showPublic(game,settled.show,'spectator').lastReveal.correct,false);
});
test('lifelines, voting, withdrawal and second answer are frozen during suspense',()=>{
 const init=cast(),locked=showCommand(game,init.show,'answer',{player:'p',answer:1},2000,init.deadline);
 for(const action of ['lifeline','audience','withdraw','answer'])assert.throws(
 ()=>showCommand(game,locked.show,action,{kind:'time',choice:0,player:'p',answer:1},2100,locked.deadline),/SHOW_STATE/);
});