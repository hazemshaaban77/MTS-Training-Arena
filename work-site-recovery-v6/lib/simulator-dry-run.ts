import {grade,scoreboards} from './domain.mjs';
import type {Activity} from './catalog';

export type SimulatorScenario='correct'|'mixed'|'incorrect'|'no_response'|'late_join'|'offline';
export type SimulatorStatus='graded'|'ungraded'|'missed'|'late'|'disconnected'|'unsupported';
export type SimulatedLearner={
 uid:string;name:string;team:string;status:SimulatorStatus;
 correct:number|null;points:number;rank:number|null;answer:unknown;
};
export type SimulatedRoom={
 learners:SimulatedLearner[];registered:number;submissions:number;
 graded:number;correct:number;ungraded:number;missed:number;
 unsupported:boolean;teamStandings:Array<{team:string;score:number;rank:number}>;
};

/** Entirely local: uses the exact shared pure evaluator and scoring formula.
 * It NEVER calls the Worker, updates a session or claims live delivery/presence.
 * For server-owned special games, it explicitly refuses to invent a score.
 */
function supported(a:Activity){
 // Betting, targeting, wheel spins and story choices use server-owned transitions
 // and rewards beyond generic grade(); never claim simulated server parity there.
 if(['Ultimate Game Show','Escape Room','Wheel of Fortune','Open the Box','Scenario Challenge'].includes(a.mainType||a.type)||
    a.betEnabled||a.participation&&a.participation!=='all')return false;
 if(a.type==='Live Poll')return ['rating','word'].includes(a.pollKind)||
  Array.isArray(a.options)&&a.options.length>0;
 return !!(a.options?.length||a.order?.length||a.pairs?.length||
  a.assignments?.length||a.type==='Fill Blank'||a.type==='Image Hotspot');
}
function answerFor(a:Activity,index:number,correct:boolean):unknown{
 if(a.type==='Live Poll'){
  if(a.pollKind==='rating')return index%Math.max(1,a.scale||5)+1;
  if(a.pollKind==='word')return ['Planning','Learning','Teamwork'][index%3];
  if(a.pollKind==='priority')return a.options.map((_:unknown,i:number)=>(i+index)%a.options.length);
  return index%a.options.length;
 }
 if(a.options?.length){
  const right=Number.isInteger(a.correct)?a.correct:0;
  return correct?right:a.options.length>1?(right+1)%a.options.length:null;
 }
 if(a.order?.length)return correct?[...a.order]:a.order.length>1?[a.order[1],a.order[0],...a.order.slice(2)]:null;
 if(a.pairs?.length)return correct?[...a.pairs]:a.pairs.length>1?[a.pairs[1],a.pairs[0],...a.pairs.slice(2)]:null;
 if(a.assignments?.length)return correct?[...a.assignments]:
  a.categories?.length>1?[(a.assignments[0]+1)%a.categories.length,...a.assignments.slice(1)]:null;
 if(a.type==='Fill Blank')return correct?a.accepted?.[0]: '__practice_incorrect__';
 if(a.type==='Image Hotspot'){
  if(!a.regions?.length)return null;
  const r=a.regions[0],right={x:r.x,y:r.y};
  if(correct)return right;
  const candidates=[{x:0,y:0},{x:1,y:1},{x:0,y:1},{x:1,y:0}];
  for(const candidate of candidates)try{
   if(grade(a,candidate).evaluation===0)return candidate;
  }catch{}
  return null;
 }
 return null;
}
export function runSimulatedRoom(a:Activity,playerCount:number,scenario:SimulatorScenario):SimulatedRoom{
 if(!Number.isInteger(playerCount)||playerCount<1||playerCount>20)throw Error('SIMULATOR_COUNT');
 const canGrade=supported(a),learners:SimulatedLearner[]=[];
 for(let i=0;i<playerCount;i++){
  const uid='practice-'+String(i+1),name='Demo Learner '+String(i+1).padStart(2,'0');
  const team=i%2===0?'Lightning':'Wave';
  let status:SimulatorStatus='unsupported',correct:number|null=null,points=0,answer:unknown=null;
  if(canGrade){
   const late=scenario==='late_join'&&i%5===0;
   const offline=scenario==='offline'&&i%3===0;
   const missing=scenario==='no_response'||scenario==='mixed'&&i%4===0;
   if(late)status='late';
   else if(offline)status='disconnected';
   else if(missing)status='missed';
   else{
    const chooseCorrect=scenario==='correct'||scenario==='late_join'||scenario==='offline'||
     scenario==='mixed'&&i%3!==0;
    answer=answerFor(a,i,chooseCorrect);
    if(answer===null)status='unsupported';
    else try{
     // No fabricated elapsed-time bonus: full duration is only a fixed test input.
     const duration=Math.max(1,a.timer||30);
     const result=grade(a,answer,{remaining:duration,duration});
     correct=result.correct===null?null:Number(result.correct);
     points=result.points;
     status=correct===null?'ungraded':'graded';
    }catch{status='unsupported';answer=null;}
   }
  }
  learners.push({uid,name,team,status,correct,points,rank:null,answer});
 }
 // No leaderboard from missing submissions, polls or server-event games.
 const players=learners.filter(p=>p.status==='graded').map(p=>({uid:p.uid,name:p.name,team:p.team,approval:'approved'}));
 const totals=Object.fromEntries(learners.map(p=>[p.uid,p.points]));
 const board=scoreboards(players,totals,'shared',{},'sum');
 for(const p of learners)p.rank=board.individual.find((x:any)=>x.uid===p.uid)?.rank??null;
 return {
  learners,registered:playerCount,
  submissions:learners.filter(p=>p.status==='graded'||p.status==='ungraded').length,
  graded:learners.filter(p=>p.status==='graded').length,
  correct:learners.filter(p=>p.status==='graded'&&p.correct===1).length,
  ungraded:learners.filter(p=>p.status==='ungraded').length,
  missed:learners.filter(p=>p.status==='missed'||p.status==='late'||p.status==='disconnected').length,
  unsupported:learners.some(p=>p.status==='unsupported'),
  teamStandings:board.teams.map((t:any)=>({team:t.team,score:t.score,rank:t.rank}))
 };
}
