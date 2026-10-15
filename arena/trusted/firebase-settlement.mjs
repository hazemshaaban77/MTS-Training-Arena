import {prepareClosedRound,prepareLeaderboard} from "./round-settlement.mjs";

/** Server-only orchestration. Requires trusted database access and a verified user identity. */
export async function settleRound({db,verifyIdToken,idToken,roomId,roundId,now=Date.now()}){
 if(!/^[0-9a-f]{24}$/.test(roomId)||!/^r[1-9][0-9]*$/.test(roundId))throw Error("Invalid room or round");
 const user=await verifyIdToken(idToken);
 if(!user?.uid)throw Error("Unauthorized");
 const prefix="arenaV1",service="arenaTrusted";
 const paths=[
  prefix+"/trainerAllowlist/"+user.uid,
  service+"/roomOwners/"+roomId,
  prefix+"/rooms/"+roomId+"/public",
  service+"/roundKeys/"+roomId+"/"+roundId,
  prefix+"/participants/"+roomId,
  prefix+"/answers/"+roomId+"/"+roundId
 ];
 const snaps=await Promise.all(paths.map(path=>db.ref(path).get()));
 if(snaps[0].val()!==true||snaps[1].val()!==user.uid)throw Error("Forbidden");
 const state=snaps[2].val(),key=snaps[3].val();
 if(!state||state.round!==roundId||!["between","completed"].includes(state.status))throw Error("Round is not closed");
 if(!Number.isFinite(state.deadline)||state.deadline>now)throw Error("Round deadline not reached");
 if(!key||key.roundId!==roundId||key.question!==state.question||JSON.stringify(key.options)!==JSON.stringify(state.options))throw Error("Trusted answer key mismatch");
 const participants=snaps[4].val()||{};
 const settlement=prepareClosedRound({roomId,roundId,publicRound:state,privateRound:key,participants,answers:snaps[5].val()||{}});
 const ledgerRef=db.ref(service+"/ledgers/"+roomId);
 const tx=await ledgerRef.transaction(previous=>{
  if(previous&&Object.hasOwn(previous,roundId))return;
  return {...(previous||{}),[roundId]:settlement};
 },undefined,false);
 const ledger=tx.snapshot.val()||{};
 if(!Object.hasOwn(ledger,roundId))throw Error("Ledger transaction failed");
 const currentParticipants=(await db.ref(prefix+"/participants/"+roomId).get()).val()||{};
 const board=prepareLeaderboard({participants:currentParticipants,ledger});
 const published=await db.ref(prefix+"/scoreboards/"+roomId).transaction(previous=>{
  if(previous&&previous.settledRounds>=board.settledRounds)return;
  return {...board,updatedAt:now};
 },undefined,false);
 return {roomId,roundId,created:tx.committed,published:published.committed,settledRounds:board.settledRounds};
}
