/** Local pure team allocation / pending transfers, no database side effects. */
function valid(ok,msg){if(!ok)throw Error(msg)}
function clone(x){return structuredClone(x)}
const unique=items=>new Set(items).size===items.length;
export function createTeams(teamNames,participants,mode="sum"){
 valid(Array.isArray(teamNames)&&teamNames.length>=2&&teamNames.length<=20&&teamNames.every(x=>typeof x==="string"&&x.trim())&&unique(teamNames),"Invalid teams");
 valid(Array.isArray(participants)&&unique(participants.map(x=>x.id)),"Duplicate participants");
 valid(["sum","average"].includes(mode),"Invalid team scoring method");
 valid(participants.every(p=>typeof p.id==="string"&&p.id&&Number.isFinite(p.score)&&p.score>=0&&(p.team===null||teamNames.includes(p.team))),"Invalid participant");
 return {teamNames:[...teamNames],participants:clone(participants),pending:{},mode,events:[]};
}
export function requestTransfer(state,participantId,target,questionOpen){
 valid(state.teamNames.includes(target),"Unknown target team");
 const participant=state.participants.find(p=>p.id===participantId);
 valid(participant,"Unknown participant");
 valid(participant.team!==target,"Already on target team");
 const next=clone(state);
 if(questionOpen){next.pending[participantId]=target;next.events.push({type:"transfer-queued",participantId,target});}
 else{next.participants.find(p=>p.id===participantId).team=target;delete next.pending[participantId];next.events.push({type:"transfer-executed",participantId,target});}
 return next;
}
export function cancelTransfer(state,participantId){
 valid(Object.hasOwn(state.pending,participantId),"No pending transfer");
 const next=clone(state);delete next.pending[participantId];next.events.push({type:"transfer-cancelled",participantId});return next;
}
export function applyPendingTransfers(state){
 const next=clone(state);
 for(const [participantId,target] of Object.entries(next.pending)){
  const p=next.participants.find(p=>p.id===participantId);
  valid(p&&next.teamNames.includes(target),"Queued transfer refers to missing entry");
  p.team=target;
  next.events.push({type:"transfer-executed",participantId,target});
 }
 next.pending={};
 return next;
}
export function teamRanking(state){
 const standings=state.teamNames.map(team=>{
  const members=state.participants.filter(p=>p.team===team);
  const sum=members.reduce((total,p)=>total+p.score,0);
  return {id:team,members:members.length,score:state.mode==="average"?(members.length?sum/members.length:0):sum};
 });
 return standings.sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id)).map((r,i,all)=>({...r,rank:all.findIndex(item=>item.score===r.score)+1}));
}
