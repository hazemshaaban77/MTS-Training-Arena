/**
 * Trusted grading core, intentionally not imported into any browser entry point.
 * The caller must run in a trusted execution context with privately stored answer keys
 * and authenticated, verified event inputs. This file itself grants NO Firebase authority.
 */
function insist(ok,why){if(!ok)throw Error(why)}
const distinct=items=>new Set(items).size===items.length;
const integer=n=>Number.isInteger(n)&&n>=0;
export function gradeClosedRound({roundId,kind,correctIndex,submissions,participantIds,discard=false,pointsPerCorrect=100}){
  insist(typeof roundId==="string"&&/^r[1-9][0-9]*$/.test(roundId),"Invalid round");
  insist(["Quiz","Dropdown","Live Poll"].includes(kind),"Unsupported round type");
  insist(Array.isArray(participantIds)&&participantIds.every(p=>typeof p==="string"&&p.length>0)&&distinct(participantIds),"Participant IDs invalid");
  insist(Array.isArray(submissions),"Submissions must be an array");
  insist(integer(pointsPerCorrect)&&pointsPerCorrect<=1000,"Invalid preset scoring");
  insist(kind==="Live Poll"||(integer(correctIndex)&&correctIndex<8),"Correct answer configuration invalid");
  const member=new Set(participantIds),seen=new Set(),awards={};
  participantIds.forEach(uid=>awards[uid]=0);
  for(const response of submissions){
    insist(response&&typeof response.uid==="string"&&member.has(response.uid),"Invalid participant in submission");
    insist(!seen.has(response.uid),"Duplicate answer record");
    insist(integer(response.choice)&&response.choice<8,"Invalid choice index");
    seen.add(response.uid);
    if(!discard&&kind!=="Live Poll"&&response.choice===correctIndex)awards[response.uid]=pointsPerCorrect;
  }
  return {roundId,kind,discarded:!!discard,submitted:seen.size,awards};
}
export function totalFromLedger({participants,closedRounds}){
  insist(Array.isArray(participants)&&distinct(participants),"Participants invalid");
  insist(Array.isArray(closedRounds),"Closed rounds invalid");
  const totals=Object.fromEntries(participants.map(uid=>[uid,0]));
  const seen=new Set();
  for(const event of closedRounds){
    insist(event&&typeof event.roundId==="string"&&!seen.has(event.roundId),"Round already credited");
    seen.add(event.roundId);
    if(event.discarded)continue;
    for(const [uid,points] of Object.entries(event.awards||{})){
      insist(Object.hasOwn(totals,uid)&&integer(points),"Invalid ledger award");
      totals[uid]+=points;
    }
  }
  return totals;
}
