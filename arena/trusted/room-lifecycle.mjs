const newRoomId=()=>Array.from(crypto.getRandomValues(new Uint8Array(12)),n=>n.toString(16).padStart(2,"0")).join("");

const ID=/^[0-9a-f]{24}$/;
const R=/^r[1-9][0-9]*$/;
const check=(condition,message)=>{if(!condition)throw Error(message)};
const root="arenaV1",internal="arenaTrusted";
async function owner(db,uid,roomId){
 const [access,meta]=await Promise.all([
  db.ref(root+"/trainerAllowlist/"+uid).get(),
  db.ref(internal+"/roomOwners/"+roomId).get()
 ]);
 check(access.val()===true&&meta.val()===uid,"Not authorized for room");
}
export async function createTrustedRoom({db,uid,title,roomId=newRoomId()}){
 check(ID.test(roomId)&&typeof uid==="string"&&uid.length>0,"Invalid room");
 check(typeof title==="string"&&title.trim().length>0&&title.length<=120,"Invalid title");
 check((await db.ref(root+"/trainerAllowlist/"+uid).get()).val()===true,"Trainer not authorized");
 const lock=await db.ref(internal+"/roomOwners/"+roomId).transaction(value=>value===null?uid:undefined,undefined,false);
 check(lock.committed,"Room ID already exists");
 const publicState={title:title.trim(),status:"lobby",round:"r0",question:"Ready to play",options:["Waiting","Waiting"],deadline:0,joinOpen:true};
 await db.ref(root+"/rooms/"+roomId).update({public:publicState,private:{createdBy:uid,createdAt:Date.now()}});
 return {roomId,title:publicState.title,status:"lobby"};
}
export async function openTrustedRound({db,uid,roomId,activity,now=Date.now()}){
 check(ID.test(roomId),"Invalid room");
 await owner(db,uid,roomId);
 check(activity&&["Quiz","Dropdown","Live Poll"].includes(activity.kind),"Unsupported activity");
 check(typeof activity.question==="string"&&activity.question.trim().length>0&&activity.question.length<=1000,"Invalid question");
 check(Array.isArray(activity.options)&&activity.options.length>=2&&activity.options.length<=8&&activity.options.every(x=>typeof x==="string"&&x.trim().length>0&&x.length<=200),"Invalid options");
 check(Number.isSafeInteger(activity.durationSeconds)&&activity.durationSeconds>=5&&activity.durationSeconds<=3600,"Invalid duration");
 check(activity.kind==="Live Poll"||Number.isInteger(activity.correctIndex)&&activity.correctIndex>=0&&activity.correctIndex<activity.options.length,"Invalid correct index");
 const publicRef=db.ref(root+"/rooms/"+roomId+"/public");
 const before=(await publicRef.get()).val();
 check(before&&["lobby","between"].includes(before.status),"Close the previous round first");
 if(before.status==="between"){
  const archive=(await db.ref(internal+"/closedRounds/"+roomId+"/"+before.round).get()).val();
  check(archive?.round===before.round&&archive.status==="between","Previous round not archived yet");
  // Do not advance while a completed round is still waiting for trusted grading
  // and publication. This avoids an incomplete leaderboard in the next question.
  const [ledgerSnap,scoreboardSnap]=await Promise.all([
   db.ref(internal+"/ledgers/"+roomId+"/"+before.round).get(),
   db.ref(root+"/scoreboards/"+roomId).get()
  ]);
  const settled=ledgerSnap.val(),scoreboard=scoreboardSnap.val();
  check(settled?.roundId===before.round&&Number.isInteger(scoreboard?.settledRounds)&&scoreboard.settledRounds>=Number(before.round.slice(1)),"Settle and publish the previous round before continuing");
 }
 const nextIndex=Number(before.round.slice(1))+1,roundId="r"+nextIndex;
 check(R.test(roundId),"Invalid round ID");
 const key={roundId,kind:activity.kind,question:activity.question,options:activity.options,correctIndex:activity.kind==="Live Poll"?null:activity.correctIndex,pointsPerCorrect:activity.kind==="Live Poll"?0:100};
 const keyRef=db.ref(internal+"/roundKeys/"+roomId+"/"+roundId);
 const claim=await keyRef.transaction(current=>current===null?key:undefined,undefined,false);
 check(claim.committed,"Round is already being opened");
 const next={title:before.title,status:"question",round:roundId,question:key.question,options:key.options,deadline:now+activity.durationSeconds*1000,joinOpen:before.joinOpen};
 const tx=await publicRef.transaction(current=>{
  if(!current||current.status!==before.status||current.round!==before.round)return;
  return next;
 },undefined,false);
 check(tx.committed,"Room state changed; refresh and retry");
 return {roomId,roundId,deadline:next.deadline};
}
export async function closeTrustedRound({db,uid,roomId,now=Date.now()}){
 check(ID.test(roomId),"Invalid room");
 await owner(db,uid,roomId);
 const ref=db.ref(root+"/rooms/"+roomId+"/public");
 const previous=(await ref.get()).val();
 check(previous?.status==="question"&&previous.deadline<=now,"Round is not active or deadline has not elapsed");
 // Move the actual round first. Never create a closed snapshot for an active round.
 const tx=await ref.transaction(value=>{
  if(!value||value.status!=="question"||value.round!==previous.round||value.deadline>now)return;
  return {...value,status:"between"};
 },undefined,false);
 check(tx.committed,"Round is not active or deadline has not elapsed");
 const closed=tx.snapshot.val();
 const rosterSnapshot=(await db.ref(root+"/participants/"+roomId).get()).val()||{};
 const closedRef=db.ref(internal+"/closedRounds/"+roomId+"/"+closed.round);
 const saved=await closedRef.transaction(value=>value===null?{...closed,closedAt:now,roster:rosterSnapshot}:undefined,undefined,false);
 check(saved.committed||saved.snapshot.val()?.round===closed.round,"Failed to retain closed round");
 return {roomId,roundId:closed.round,status:"between"};
}
