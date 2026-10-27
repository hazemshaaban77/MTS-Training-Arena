// Prize-ladder championship contract. Pure functions: no database or browser.
// Every attempt begins at level one, even after a previous contestant exits.
export const isChampionship=a=>a?.type==='Ultimate Game Show'&&a.showFormat==='championship';
export function validateChampionship(a){
 if(!isChampionship(a)||!Array.isArray(a.questions)||a.questions.length<(a.minimumLevels===7?7:2)||a.questions.length>20)throw Error('DECK');
 const prizes=a.questions.map(q=>q.points);
 if(prizes.some((x,i)=>!Number.isInteger(x)||x<=0||x>10000||i>0&&x<=prizes[i-1]))throw Error('DECK');
 const safe=a.safeLevels||[];
 if(!Array.isArray(safe)||safe.length>3||safe.some(x=>!Number.isInteger(x)||x<1||x>a.questions.length)||new Set(safe).size!==safe.length)throw Error('DECK');
 return a;
}
export function showStart(){return {phase:'casting',current:null,attempts:[],usedContestants:[],audienceVotes:{},lastCompleted:null};}
export function safePayout(a,cleared){
 const level=(a.safeLevels||[]).filter(x=>x<=cleared).sort((x,y)=>y-x)[0];
 return level?a.questions[level-1].points:0;
}
export function activeQuestion(a,show){return show.current&&a.questions[show.current.level]||null;}
export function showCommand(a,show,action,extra,now,deadline){
 validateChampionship(a);
 const current=show.current,attempts=show.attempts||[],used=show.usedContestants||[];
 if(action==='cast'){
  const id=extra.player;
  if(show.phase!=='casting'||!id||typeof id!=='string'||used.includes(id))throw Error('SHOW_CAST');
  const attempt={id:extra.attemptId,player:id,level:0,cleared:0,usedLifelines:[],history:[],status:'playing',earned:0};
  if(!attempt.id)throw Error('STATE');
  return {show:{...show,phase:'answering',current:attempt,audienceVotes:{},usedContestants:[...used,id],lastCompleted:show.lastCompleted},deadline:now+a.questions[0].timer*1000};
 }
 if(!current||show.phase!=='answering')throw Error('SHOW_STATE');
 if(action==='lifeline'){
  const kind=extra.kind;
  if(!['fifty','audience','time'].includes(kind)||current.usedLifelines.includes(kind))throw Error('SHOW_LIFELINE');
  if(kind==='time'&&(!deadline||deadline<=now))throw Error('SHOW_TIMEOUT');
  const usedLifelines=[...current.usedLifelines,kind];
  const update={...current,usedLifelines};
  return {show:{...show,current:update,audienceVotes:kind==='audience'?{}:show.audienceVotes},
   deadline:kind==='time'?deadline+30000:deadline};
 }
 if(action==='audience'){
  if(!current.usedLifelines.includes('audience')||extra.player===current.player||show.audienceVotes?.[extra.player]!==undefined||
   !Number.isInteger(extra.choice)||extra.choice<0||extra.choice>=a.questions[current.level].options.length)throw Error('SHOW_AUDIENCE');
  return {show:{...show,audienceVotes:{...show.audienceVotes,[extra.player]:extra.choice}},deadline};
 }
 const question=a.questions[current.level];
 if(action==='answer'){
  if(extra.player!==current.player||!Number.isInteger(extra.answer)||extra.answer<0||extra.answer>=question.options.length)throw Error('SHOW_ANSWER');
  if(!deadline||deadline<=now)throw Error('SHOW_TIMEOUT');
  const correct=extra.answer===question.correct;
  const history=[...current.history,{level:current.level,choice:extra.answer,correct}];
  if(correct&&current.level+1<a.questions.length){
   const advanced={...current,history,level:current.level+1,cleared:current.level+1};
   return {show:{...show,current:advanced,audienceVotes:{}},deadline:now+a.questions[advanced.level].timer*1000};
  }
  const cleared=current.cleared+Number(correct),amount=correct?question.points:safePayout(a,cleared);
  const status=correct?'champion':'eliminated';
  return settle(show,current,{...current,history,cleared,status,earned:amount},now);
 }
 if(action==='withdraw'){
  if(extra.player!==current.player||current.cleared<1)throw Error('SHOW_WITHDRAW');
  const amount=a.questions[current.cleared-1].points;
  return settle(show,current,{...current,status:'withdrawn',earned:amount},now);
 }
 if(action==='timeout'){
  if(!deadline||deadline>now)throw Error('SHOW_TIMEOUT');
  return settle(show,current,{...current,status:'timed-out',earned:safePayout(a,current.cleared)},now);
 }
 throw Error('SHOW_ACTION');
}
function settle(show,prior,result,now){
 const finished={...result,finishedAt:now};
 return {show:{...show,phase:finished.status==='champion'?'completed':'casting',current:null,
  lastCompleted:finished,attempts:[...show.attempts,finished],audienceVotes:{}},deadline:null,
  payout:{id:finished.id,player:finished.player,points:finished.earned,
   kind:'show-championship',detail:{status:finished.status,cleared:finished.cleared,attempt:finished.id}}};
}
export function showPublic(a,show,viewer,host=false){
 const q=activeQuestion(a,show),current=show.current;
 const audienceCount=q?Array.from({length:q.options.length},(_,i)=>Object.values(show.audienceVotes||{}).filter(x=>x===i).length):[];
 const mine=!!current&&viewer===current.player;
 const eliminated=current?.usedLifelines.includes('fifty')?
  q.options.map((_,i)=>i).filter(i=>i!==q.correct).slice(0,2):[];
 return {phase:show.phase,level:current?.level??0,total:a.questions.length,
  ladder:a.questions.map(x=>x.points),safeLevels:a.safeLevels||[],contestant:current?.player||null,
  usedContestants:show.usedContestants||[],attempts:(show.attempts||[]).map(x=>({id:x.id,player:x.player,
   cleared:x.cleared,status:x.status,earned:x.earned})),lastCompleted:show.lastCompleted?{
   player:show.lastCompleted.player,cleared:show.lastCompleted.cleared,
   status:show.lastCompleted.status,earned:show.lastCompleted.earned}:null,
  question:q?{type:q.type,prompt:q.prompt,options:q.options,timer:q.timer}:null,
  lifelines:mine||host?current.usedLifelines:[],eliminatedChoices:mine?eliminated:[],
  audienceOpen:!!current?.usedLifelines.includes('audience'),
  audienceVotes:audienceCount,
  voted:viewer?show.audienceVotes?.[viewer]!==undefined:false,
  canAnswer:mine,canWithdraw:mine&&current.cleared>0,
  winner:show.phase==='completed'?show.lastCompleted?.player:null,
  audienceCount:audienceCount.reduce((x,y)=>x+y,0)};
}
