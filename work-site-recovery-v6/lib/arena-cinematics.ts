/** Lightweight, backwards-compatible live scene cues.
 * Host uses the existing audited highlight action; no new API, schema, secret or Worker
 * deploy. Negative reserved values never collide with legitimate 0+ option highlights.
 * The cue is shown only while no round answer clock is running (lobby/results).
 */
export const ARENA_SCENE_OFFSET=100000;
export type ArenaSceneCue={index:number;key:string}|null;
export function introHighlight(index:number):number{
 if(!Number.isInteger(index)||index<0||index>=500)return NaN;
 return -ARENA_SCENE_OFFSET-index;
}
export function sceneFromHighlight(highlight:unknown,status:string,current:number,total:number):ArenaSceneCue{
 if(!['lobby','results'].includes(status)||!Number.isInteger(highlight)||typeof highlight!=='number')return null;
 const index=-ARENA_SCENE_OFFSET-highlight;
 if(!Number.isInteger(index)||index<0||index>=total||index!==current+1)return null;
 return {index,key:'scene:'+index+':'+highlight+':'+status};
}
export function canPreviewNext(status:string,current:number,total:number):boolean{
 return ['lobby','results'].includes(status)&&current+1<total;
}
export type ArenaCue='intro'|'stage'|'lock'|'reveal'|'correct'|'incorrect'|'tick'|'overtime'|'lead'|'victory'|'wheel'|'mystery'|'level'|'countdown';
export type ArenaMomentKind='champion'|'lead'|'streak'|'reveal';
export function stageAtmosphere(type:string):string{
 const map:Record<string,string>={
  'Quiz':'electric','Ultimate Game Show':'gold','Wheel of Fortune':'violet','Spin Wheel':'violet',
  'Escape Room':'teal','Open the Box':'rose','Meta Plan':'emerald','Categorize':'emerald',
  'Live Poll':'cyan','Order It':'blue','Flashcards':'indigo','Scenario Challenge':'amber'};
 return map[type]||'electric';
}
export function eligibleMoment(prev:any,next:any,view:'host'|'display'|'play'):ArenaMomentKind|null{
 if(!prev||!next||next.code!==prev.code)return null;
 if(prev.status!=='completed'&&next.status==='completed'&&next.individual?.length)return 'champion';
 if(view==='play')return null;
 if(prev.status!==next.status&&next.status==='results')return 'reveal';
 if(next.status==='results'&&prev.current===next.current&&prev.status===next.status){
  const previous=(prev.individual||[]).filter((p:any)=>p.rank===1).map((p:any)=>p.uid).sort().join(',');
  const current=(next.individual||[]).filter((p:any)=>p.rank===1).map((p:any)=>p.uid).sort().join(',');
  if(previous&&current&&previous!==current)return 'lead';
 }
 return null;
}
