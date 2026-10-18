/**
 * Trusted leaderboard projection. Only call with server-verified ledger totals.
 * This module DOES NOT read Firebase, authorize callers or establish score trust.
 */
const insist=(condition,message)=>{if(!condition)throw Error(message)};
const safeId=value=>typeof value==="string"&&value.length>0&&value.length<=128;
const safeScore=value=>Number.isSafeInteger(value)&&value>=0;
export function rankPlayers({participants,totals}){
  insist(Array.isArray(participants),"Participants must be an array");
  insist(totals&&typeof totals==="object"&&!Array.isArray(totals),"Totals must be a map");
  const seen=new Set();
  const rows=participants.map(p=>{
    insist(p&&safeId(p.uid)&&!seen.has(p.uid),"Invalid or repeated participant");
    seen.add(p.uid);
    insist(typeof p.name==="string"&&p.name.trim().length>0&&p.name.length<=60,"Invalid display name");
    insist(Object.hasOwn(totals,p.uid)&&safeScore(totals[p.uid]),"Missing or invalid trusted score");
    return {uid:p.uid,name:p.name,score:totals[p.uid]};
  });
  rows.sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name)||a.uid.localeCompare(b.uid));
  let last=null,rank=0;
  return rows.map((row,index)=>{
    if(last!==row.score)rank=index+1;
    last=row.score;
    return {...row,rank};
  });
}
export function rankTeams({participants,totals,mode="sum"}){
  insist(["sum","average"].includes(mode),"Invalid team ranking mode");
  insist(Array.isArray(participants),"Participants must be an array");
  insist(totals&&typeof totals==="object"&&!Array.isArray(totals),"Totals must be a map");
  const seen=new Set(),groups=new Map();
  for(const p of participants){
    insist(p&&safeId(p.uid)&&!seen.has(p.uid),"Invalid or repeated participant");
    seen.add(p.uid);
    insist(Object.hasOwn(totals,p.uid)&&safeScore(totals[p.uid]),"Missing or invalid trusted score");
    if(p.team==null)continue;
    insist(typeof p.team==="string"&&p.team.trim().length>0&&p.team.length<=80,"Invalid team");
    const group=groups.get(p.team)||{team:p.team,members:0,total:0};
    group.members++;
    group.total+=totals[p.uid];
    insist(Number.isSafeInteger(group.total),"Team score overflow");
    groups.set(p.team,group);
  }
  const rows=[...groups.values()].map(group=>({...group,score:mode==="average"?group.total/group.members:group.total}));
  rows.sort((a,b)=>b.score-a.score||a.team.localeCompare(b.team));
  let last=null,rank=0;
  return rows.map((row,index)=>{
    if(last!==row.score)rank=index+1;
    last=row.score;
    return {...row,rank};
  });
}
