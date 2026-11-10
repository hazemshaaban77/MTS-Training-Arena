// Shared validation and server-owned learning rules. No client-provided points.
export const learningTypes=['Quiz','True/False','Dropdown','Fill Blank','Match It','Order It','Image Hotspot'];
export function learningQuestion(a:any){return !!a&&learningTypes.includes(a.type)&&!a.questions&&a.mainType!=='Ultimate Game Show'&&a.scored!==false;}
export function learningScore(a:any,base:number,correct:number|null,input:any){
 const power=input.powerUp||'none',confidence=input.confidence;
 if(!['none','double','shield'].includes(power))throw Error('POWER_UP');
 if((power!=='none'||confidence!=null)&&!learningQuestion(a))throw Error('LEARNING_DISABLED');
 if(power!=='none'&&(!a.powerUps||a.learningMode==='practice'))throw Error('LEARNING_DISABLED');
 if(a.confidencePoints){if(![1,2,3].includes(confidence))throw Error('CONFIDENCE');}
 else if(confidence!=null)throw Error('LEARNING_DISABLED');
 if(a.learningMode==='practice')return {points:0,power:'none',confidence:null};
 let points=base;
 if(a.confidencePoints)points+=correct===1?confidence*100:-(confidence-1)*100;
 if(power==='double'&&correct===1)points*=2;
 if(power==='shield'&&correct===0)points=Math.max(0,points);
 return {points,power,confidence:confidence??null};
}

// Repeat only completed, graded source rounds. Never infer a missing answer as wrong.
export function reviewQuestions(deck:any[],answers:any[],current:number,mode:'redemption'|'smart'){
 const candidates=deck.map((a,round)=>{
  const rows=answers.filter(x=>x.round===round&&(x.correct===0||x.correct===1));
  const wrong=rows.filter(x=>x.correct===0);
  return {a,round,rows,wrong,ratio:rows.length?wrong.length/rows.length:0};
 }).filter(x=>x.round<=current&&learningQuestion(x.a)&&!x.a.reviewMode&&x.a.learningMode!=='practice'&&x.wrong.length>0&&
  (mode==='redemption'||x.ratio>=.3));
 if(mode==='smart')candidates.sort((a,b)=>b.ratio-a.ratio||b.wrong.length-a.wrong.length||a.round-b.round);
 return candidates.slice(0,20).map(({a,round,wrong})=>({...a,questions:undefined,
  reviewMode:mode,sourceRound:round,reviewPlayers:wrong.map(x=>x.player),
  powerUps:false,confidencePoints:false,speed:false,learningMode:'classic',
  points:Math.min(500,a.points??1000),weight:1,wrongPenalty:0,
  revealMode:'manual',participation:'all',betEnabled:false,
  section:mode==='smart'?'Smart repetition':'Redemption round'}));
}
