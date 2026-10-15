/**
 * Trusted-side preparation of a closed round settlement.
 * Pure functions ONLY: callers MUST authorize the trainer, load immutable records,
 * and persist the settlement atomically on a trusted server.
 */
import {gradeClosedRound,totalFromLedger} from "./scoring.mjs";
import {rankPlayers,rankTeams} from "./leaderboard.mjs";

const requireThat=(condition,message)=>{if(!condition)throw Error(message)};
const validId=value=>typeof value==="string"&&/^[a-zA-Z0-9_-]{1,128}$/.test(value);
const object=value=>value!==null&&typeof value==="object"&&!Array.isArray(value);
const validRound=value=>typeof value==="string"&&/^r[1-9][0-9]*$/.test(value);

/**
 * Produces a candidate immutable grading event. The current Firebase pilot lacks
 * server-recorded submission timestamps: deadline enforcement MUST remain in
 * security rules and must be rechecked by the server implementation.
 */
export function prepareClosedRound({roomId,roundId,publicRound,privateRound,participants,answers,discard=false}){
  requireThat(validId(roomId)&&validRound(roundId),"Invalid room or round ID");
  requireThat(object(publicRound)&&publicRound.round===roundId&&["between","completed"].includes(publicRound.status),"Round must be closed before settlement");
  requireThat(object(privateRound)&&privateRound.roundId===roundId,"Trusted answer key missing or for wrong round");
  requireThat(["Quiz","Dropdown","Live Poll"].includes(privateRound.kind),"Invalid activity type");
  requireThat(Array.isArray(publicRound.options)&&publicRound.options.length>=2&&publicRound.options.length<=8,"Invalid options");
  requireThat(object(participants)&&object(answers),"Participants and answers must be maps");
  const members=Object.entries(participants).map(([uid,value])=>{
    requireThat(validId(uid)&&object(value)&&typeof value.name==="string"&&value.name.trim(),"Invalid participant record");
    return {uid,name:value.name,team:value.team??null};
  });
  requireThat(members.length<=1000,"Room size exceeds settlement limit");
  const submissions=Object.entries(answers).map(([uid,value])=>{
    requireThat(validId(uid)&&object(value)&&Number.isInteger(value.choice)&&value.choice>=0&&value.choice<publicRound.options.length,"Invalid answer record");
    return {uid,choice:value.choice};
  });
  const event=gradeClosedRound({
    roundId,kind:privateRound.kind,correctIndex:privateRound.correctIndex,
    submissions,participantIds:members.map(m=>m.uid),
    discard,pointsPerCorrect:privateRound.pointsPerCorrect??100
  });
  return {roomId,...event};
}

/**
 * Computes a projection from a server-verified complete ledger.
 * Never pass a score map uploaded by a browser.
 */
export function prepareLeaderboard({participants,ledger,teamMode="sum"}){
  requireThat(object(participants)&&object(ledger),"Invalid settlement inputs");
  const members=Object.entries(participants).map(([uid,value])=>{
    requireThat(validId(uid)&&object(value),"Invalid participant");
    return {uid,name:value.name,team:value.team??null};
  });
  const events=Object.entries(ledger).map(([roundId,event])=>{
    requireThat(validRound(roundId)&&object(event)&&event.roundId===roundId,"Ledger key mismatch");
    return event;
  });
  const totals=totalFromLedger({participants:members.map(p=>p.uid),closedRounds:events});
  return {players:rankPlayers({participants:members,totals}),teams:rankTeams({participants:members,totals,mode:teamMode}),settledRounds:events.length};
}

/**
 * Conditional insert for an immutable ledger record, for use inside a Firebase
 * RTDB transaction on a single room's ledger node. This is NOT a transaction.
 * On conflict, it throws instead of replacing a previously credited round.
 */
export function addSettlementToLedger(existingLedger,settlement){
  requireThat(object(settlement)&&validRound(settlement.roundId),"Invalid settlement");
  requireThat(existingLedger===null||object(existingLedger),"Invalid ledger");
  const ledger=existingLedger||{};
  requireThat(!Object.hasOwn(ledger,settlement.roundId),"Round already settled");
  return {...ledger,[settlement.roundId]:settlement};
}
