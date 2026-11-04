/**
 * Per-activity answer-reveal policy for the existing V6 state machine.
 *
 * Settings.reveal is a backwards-compatible default, never a second
 * client-side source of truth. A committed server state is required to
 * release answer keys. Special interactive activities keep their own
 * server-controlled reveal flows (wheel, boxes, Meta Plan, etc.).
 */
export const REVEAL_DELAY_SECONDS=[0,2,3,5];
export const REVEAL_FX=["light","standard","cinematic"];
const special=new Set([
 "Meta Plan","Categorize","Scenario Challenge","Escape Room",
 "Wheel of Fortune","Spin Wheel","Open the Box","Flashcards"
]);
export const canConfigureAnswerReveal=(activity)=>{
 if(!activity || special.has(activity.type))return false;
 if(activity.showFormat==="championship" || activity.mainType==="Ultimate Game Show"&&activity.showFormat==="championship")return false;
 return true;
};
export function revealPolicy(activity,settings={}){
 const configurable=canConfigureAnswerReveal(activity);
 const mode=activity?.revealMode==="manual"||activity?.revealMode==="auto"?
  activity.revealMode:settings.reveal==="manual"?"manual":"auto";
 const seconds=REVEAL_DELAY_SECONDS.includes(activity?.revealDelay)?
  activity.revealDelay:0;
 const fx=REVEAL_FX.includes(activity?.revealFx)?activity.revealFx:"cinematic";
 const sound=activity?.revealSound===true;
 return {configurable,mode,delayMs:seconds*1000,seconds,fx,sound};
}
export function initialRevealRuntime(activity,settings={},at){
 const p=revealPolicy(activity,settings);
 if(!p.configurable)return {keyRevealed:false,keyRevealAt:null,keyRevealedAt:null};
 if(p.mode==="manual")return {keyRevealed:false,keyRevealAt:null,keyRevealedAt:null};
 return {
  keyRevealed:p.delayMs===0,
  keyRevealAt:at+p.delayMs,
  keyRevealedAt:p.delayMs===0?at:null
 };
}
export const dueAutoReveal=(runtime,now)=>runtime?.keyRevealed!==true &&
 Number.isFinite(runtime?.keyRevealAt) && runtime.keyRevealAt<=now;
