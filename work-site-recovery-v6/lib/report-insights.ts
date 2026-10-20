/* Read-only trainer analytics derived from the authorized /api/report response.
   No backend changes, no identifiable anonymous poll answers, no invented correctness.
   The report may contain nested authored game steps. Indices always refer to the
   actual flattened round list persisted in report.activities. */
export type ReportInsight={
 round:number;
 type:string;
 prompt:string;
 responseCount:number;
 identifiedCount:number;
 anonymousCount:number;
 gradedCount:number;
 correctCount:number;
 incorrectCount:number;
 accuracy:number|null;
 events:number;
 eventPoints:number;
 kind:'poll'|'review'|'game'|'graded'|'participation';
 pollMode?:'choice'|'rating'|'priority'|'word';
 pollBars?:{label:string;count:number;percent:number}[];
 averageRating?:number|null;
 ranking?:{label:string;points:number}[];
};

const finite=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)?v:0;
const parse=(x:unknown):any=>{if(typeof x!=='string')return x;try{return JSON.parse(x);}catch{return undefined;}};
const typename=(a:any)=>a?.mainType||a?.type||'Activity';
const isUnscored=(a:any,type:string)=>a?.scored===false||
 ['Live Poll','Flashcards','Meta Plan','Categorize'].includes(type);
const isGraded=(v:unknown)=>v===0||v===1||v===false||v===true;
const answeredCorrect=(v:unknown)=>v===1||v===true;

export function analyzeReportActivities(report:any):ReportInsight[]{
 const activities=Array.isArray(report?.activities)?report.activities:[];
 const answers=Array.isArray(report?.answers)?report.answers:[];
 const anonymous=Array.isArray(report?.anonymous)?report.anonymous:[];
 const events=Array.isArray(report?.events)?report.events:[];
 return activities.map((a:any,round:number)=>{
  const type=typename(a),rows=answers.filter((r:any)=>r.round===round);
  const anon=anonymous.filter((r:any)=>r.round===round);
  const logs=events.filter((r:any)=>r.round===round);
  const scored=!isUnscored(a,type);
  const judged=scored?rows.filter((r:any)=>isGraded(r.correct)):[];
  const correctCount=judged.filter((r:any)=>answeredCorrect(r.correct)).length;
  const responseCount=rows.length+anon.length;
  const kind:ReportInsight['kind']=type==='Live Poll'?'poll':
   type==='Flashcards'||type==='Meta Plan'||type==='Categorize'?'review':
   ['Escape Room','Scenario Challenge','Wheel of Fortune','Spin Wheel','Open the Box','Ultimate Game Show'].includes(type)?'game':
   scored?'graded':'participation';
  const result:ReportInsight={
   round,type,prompt:String(a?.prompt||a?.section||type),responseCount,
   identifiedCount:rows.length,anonymousCount:anon.length,
   gradedCount:judged.length,correctCount,
   incorrectCount:judged.length-correctCount,
   accuracy:judged.length?Math.round(100*correctCount/judged.length):null,
   events:logs.length,eventPoints:logs.reduce((n:number,e:any)=>n+finite(e.points),0),
   kind
  };
  if(type!=='Live Poll')return result;
  const mode=['choice','rating','priority','word'].includes(a?.pollKind)?a.pollKind:'choice';
  result.pollMode=mode;
  const values=[...rows,...anon].map((r:any)=>parse(r.answer));
  if(mode==='rating'){
   const valid=values.filter((v:any)=>Number.isInteger(v)&&v>=1&&v<=5);
   result.averageRating=valid.length?Math.round(valid.reduce((n:number,v:number)=>n+v,0)/valid.length*10)/10:null;
  }else if(mode==='priority'){
   const options=Array.isArray(a.options)?a.options:[];
   const complete=values.filter((v:any)=>Array.isArray(v)&&v.length===options.length&&v.every((x:any)=>Number.isInteger(x)&&x>=0&&x<options.length)&&new Set(v).size===options.length);
   result.ranking=options.map((name:string,i:number)=>({
    label:String(name),
    points:complete.reduce((n:number,order:number[])=>n+options.length-order.indexOf(i),0)
   })).sort((x,y)=>y.points-x.points);
   if(!complete.length)result.ranking=[];
  }else if(mode==='word'){
   const counts=new Map<string,number>();
   for(const v of values){
    if(typeof v!=='string')continue;
    const word=v.trim().toLowerCase().slice(0,80);
    if(word)counts.set(word,(counts.get(word)||0)+1);
   }
   const total=[...counts.values()].reduce((n,v)=>n+v,0);
   result.pollBars=[...counts].sort((a,b)=>b[1]-a[1]).slice(0,12).map(([label,count])=>({
    label,count,percent:total?Math.round(100*count/total):0
   }));
  }else{
   const options=Array.isArray(a.options)?a.options:[];
   const valid=values.filter((v:any)=>Number.isInteger(v)&&v>=0&&v<options.length);
   result.pollBars=options.map((name:string,i:number)=>{
    const count=valid.filter((v:number)=>v===i).length;
    return {label:String(name),count,percent:valid.length?Math.round(100*count/valid.length):0};
   });
  }
  return result;
});

/** Explicit export only. Spreadsheet formula prefixes are neutralized. */
export function reportInsightsCsv(insights:ReportInsight[]){
 const columns=['Round','Activity','Type','Confirmed responses','Identified responses','Anonymous responses',
  'Graded responses','Correct','Incorrect','Accuracy percent','Documented game events','Event points',
  'Poll mode','Rating average','Poll chart / ranking'];
 const lines=[columns,...insights.map(x=>[
  x.round+1,x.prompt,x.type,x.responseCount,x.identifiedCount,x.anonymousCount,
  x.gradedCount,x.gradedCount?x.correctCount:'',x.gradedCount?x.incorrectCount:'',
  x.accuracy??'',x.events,x.eventPoints,x.pollMode??'',x.averageRating??'',
  x.pollBars?.map(p=>p.label+': '+p.count+' ('+p.percent+'%)').join(' | ')||
  x.ranking?.map(p=>p.label+': '+p.points).join(' | ')||''
 ])];
 const cell=(v:unknown)=>{
  const raw=String(v??''),safe=/^[\s\uFEFF]*[=+@\-\t\r]/.test(raw)?"'"+raw:raw;
  return '"'+safe.replace(/"/g,'""')+'"';
 };
 return '\ufeff'+lines.map(row=>row.map(cell).join(',')).join('\r\n');
}
