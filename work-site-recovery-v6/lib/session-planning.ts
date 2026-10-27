import type {Activity} from './catalog';

/** Conservative session planning aid, not a promise about live elapsed time.
 * Only authored question/puzzle timers and a small stage transition allowance
 * count. Discussions, free play and spontaneous trainer pauses remain unknown. */
export function estimateSessionAgenda(deck:Activity[]){
 let timedSeconds=0,discussionSeconds=0,untimedSteps=0,steps=0;
 const estimateUntimed=(a:Activity)=>{
  switch(a.type){
   case 'Wheel of Fortune':case 'Spin Wheel':return Math.max(1,a.rounds||3)*65;
   case 'Open the Box':return Math.min(a.rounds||a.items?.length||4,a.items?.length||4)*100;
   case 'Meta Plan':case 'Categorize':return 6*60;
   case 'Flashcards':return Math.max(2,a.fronts?.length||2)*45;
   case 'Scenario Challenge':return 7*60;
   case 'Escape Room':return 3*60;
   default:return 2*60;
  }
 };
 for(const activity of deck){
  const nested=activity.questions?.length?activity.questions:
   activity.rooms?.length?activity.rooms.flatMap((room:any)=>room.puzzles||[]):[activity];
  const content=nested.length?nested:[activity];
  for(const step of content){
   steps++;
   const time=Number((step as any).timer??activity.timer??0);
   if(Number.isFinite(time)&&time>0)timedSeconds+=Math.min(3600,time);
   else untimedSteps++;
  }
  if(!activity.timer||['Wheel of Fortune','Spin Wheel','Meta Plan','Categorize','Open the Box','Flashcards','Scenario Challenge','Escape Room'].includes(activity.type)){
   // Training facilitation is not just a timer. This is a planning assumption,
   // never a guarantee of elapsed duration or forced session timeout.
   discussionSeconds+=estimateUntimed(activity);
  }
 }
 const transitionSeconds=deck.length*30;
 return {timedSeconds,discussionSeconds,transitionSeconds,
  totalSeconds:timedSeconds+discussionSeconds+transitionSeconds,untimedSteps,steps};
}
