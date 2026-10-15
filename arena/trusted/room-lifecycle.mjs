import {randomBytes} from "node:crypto";

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
export async function createTrustedRoom({db,uid,title,roomId=randomBytes(12).toString("hex")}){
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
 const tx=await ref.transaction(value=>{
  if(!value||value.status!=="question"||value.deadline>now)return;
  return {...value,status:"between"};
 },undefined,false);
 check(tx.committed,"Round is not active or deadline has not elapsed");
 return {roomId,roundId:tx.snapshot.val().round,status:"between"};
}
