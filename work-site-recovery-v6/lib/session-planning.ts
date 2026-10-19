import type {Activity} from './catalog';

/** Conservative session planning aid, not a promise about live elapsed time.
 * Only authored question/puzzle timers and a small stage transition allowance
 * count. Discussions, free play and spontaneous trainer pauses remain unknown. */
export function estimateSessionAgenda(deck:Activity[]){
 let timedSeconds=0,untimedSteps=0,steps=0;
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
 }
 const transitionSeconds=deck.length*20;
 return {timedSeconds,transitionSeconds,totalSeconds:timedSeconds+transitionSeconds,
  untimedSteps,steps};
}
