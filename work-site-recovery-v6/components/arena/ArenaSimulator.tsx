'use client';
import {useEffect,useMemo,useState} from 'react';
import {ArrowLeft,ArrowRight,CheckCircle2,Eye,Gamepad2,Monitor,Play,RotateCcw,ShieldCheck,Smartphone,Users,X} from 'lucide-react';
import {activityLabel,mainType,type Activity} from '../../lib/catalog';
import {publicActivity,flattenDeck} from '../../lib/domain.mjs';
import ActivityArt from './ActivityArt';
import GamePlay from './GamePlay';
import StageMedia from './StageMedia';

type Mode='host'|'play'|'display';
const fakePlayer={uid:'simulated-player',id:'simulated-player',name:'Demo Learner',team:'Lightning',approval:'approved'};
const isOrder=(v:any)=>Array.isArray(v);
function samplePollSummary(a:any,answers:any[]){
 if(a.pollKind==='rating')return {count:answers.length,average:answers.length?answers.reduce((n,x)=>n+Number(x||0),0)/answers.length:0};
 if(a.pollKind==='word'){const words:Record<string,number>={};answers.forEach(word=>{const s=String(word||'').toLowerCase().trim();if(s)words[s]=(words[s]||0)+1;});return {words};}
 if(a.pollKind==='priority'){const options=a.options||[];return {ranking:options.map((label:string,i:number)=>({label,value:answers.reduce((n,order)=>n+(Array.isArray(order)?options.length-order.indexOf(i):0),0)})).sort((x:any,y:any)=>y.value-x.value)};}
 return null;
}
function initialGame(a:any):any{
 const first=a.nodes?.find((n:any)=>n.id===a.start)||a.nodes?.[0];
 const room=a.rooms?.[0];
 return {
  target:fakePlayer.uid,spinTarget:fakePlayer.uid,turn:0,rounds:a.rounds||3,used:[],version:1,
  scenario:first?{text:first.text,choices:first.choices||[],ending:!!first.ending,
   discussion:first.discussion,path:[],node:first.id}:undefined,
  escape:room?{room:0,puzzle:0,totalRooms:a.rooms.length,question:room.puzzles?.[0],
   title:room.title,narrative:room.narrative,attempts:0,hintAvailable:true}:undefined,
  card:0,flipped:false,back:'',reviewed:[],bet:null
 };
}
function PracticeStage({a,ar,mode,runId}:{a:Activity;ar:boolean;mode:Mode;runId:number}){
 const t=(arabic:string,english:string)=>ar?arabic:english;
 const [game,setGame]=useState<any>(()=>initialGame(a));
 const [answer,setAnswer]=useState<any>(null);
 const [votes,setVotes]=useState<any[]>([]);
 const [revealed,setRevealed]=useState(false);
 const [phase,setPhase]=useState<'intro'|'question'>('intro');
 const [step,setStep]=useState(0);
 const [seconds,setSeconds]=useState(Math.max(0,a.timer||0));
 const [paused,setPaused]=useState(true);
 const [note,setNote]=useState('');
 const isPresentation=['Wheel of Fortune','Spin Wheel','Open the Box','Flashcards'].includes(mainType(a));
 const active:any=a.questions?.length?{...a.questions[Math.min(step,a.questions.length-1)],mainType:a.type}:a;
 const displayActive=publicActivity({...active});
 const isPoll=a.type==='Live Poll';
 useEffect(()=>{
  if(phase!=='question'||paused||revealed||seconds<=0)return;
  const id=window.setTimeout(()=>setSeconds(v=>Math.max(0,v-1)),1000);
  return()=>window.clearTimeout(id);
 },[seconds,paused,phase,revealed]);
 const progress=active.timer?Math.min(100,seconds/Math.max(1,active.timer)*100):100;
 function resetStage(){setGame(initialGame(a));setAnswer(null);setVotes([]);setRevealed(false);
  setPhase('intro');setStep(0);setSeconds(Math.max(0,a.timer||0));setPaused(true);setNote('');}
 function reveal(){setRevealed(true);setPaused(true);}
 function submit(value:any){setAnswer(value);if(isPoll)setVotes(v=>[...v.slice(-19),value]);setNote(t('اتسجلت إجابتك التجريبية. تقدر تعرض النتيجة أو ترجع تغيّرها.','Practice response recorded. Reveal the result or try another answer.'));}
 function action(type:string,payload:any){
  if(type==='decision'){
   const s=game.scenario,now=a.nodes?.find((n:any)=>n.id===s?.node),c=now?.choices?.[payload.choice];
   const next=a.nodes?.find((n:any)=>n.id===c?.next);
   if(next)setGame((g:any)=>({...g,scenario:{node:next.id,text:next.text,choices:next.choices||[],
     ending:!!next.ending,discussion:next.discussion,consequence:c.consequence,
     path:[...(s?.path||[]),{consequence:c.consequence||c.label}]}}));
  }else if(type==='puzzle'){
   const e=game.escape,room=a.rooms?.[e.room],question=room?.puzzles?.[e.puzzle];
   const correct=JSON.stringify(payload.answer)===JSON.stringify(question?.correct)
    ||(question?.type==='Order It'&&JSON.stringify(payload.answer)===JSON.stringify(question?.order));
   if(!correct){setGame((g:any)=>({...g,escape:{...g.escape,attempts:e.attempts+1,
     lastCorrect:false,hint:room?.hint}}));return;}
   let roomIndex=e.room,puzzleIndex=e.puzzle+1;
   if(puzzleIndex>=room.puzzles.length){roomIndex++;puzzleIndex=0;}
   const nextRoom=a.rooms?.[roomIndex];
   setGame((g:any)=>({...g,escape:nextRoom?{room:roomIndex,puzzle:puzzleIndex,
    totalRooms:a.rooms.length,title:nextRoom.title,narrative:nextRoom.narrative,
    question:nextRoom.puzzles?.[puzzleIndex],attempts:0,hintAvailable:true,lastCorrect:true}
    :{...g.escape,escaped:true,lastCorrect:true}}));
  }else if(type==='flip'){const i=payload.index??game.card;setGame((g:any)=>({...g,card:i,flipped:true,back:a.backs?.[i]||''}));}
  else if(type==='card'){const i=payload.index??game.card;setGame((g:any)=>({...g,card:i,flipped:false,back:a.backs?.[i]||''}));}
  else if(type==='selfassess'){setGame((g:any)=>({...g,reviewed:[...g.reviewed,{index:payload.index,known:payload.known}]}));}
  else if(type==='bet'){setGame((g:any)=>({...g,bet:payload.amount}));}
  else if(type==='lifeline'){setGame((g:any)=>({...g,lifelines:[...(g.lifelines||[]),payload.kind]}));}
  else if(type==='miniquiz'||type==='boxquiz'){setGame((g:any)=>({...g,mini:{question:null},box:g.box?{...g.box,answered:true}:undefined}));}
  else if(type==='spin'){spin();}
  else if(type==='box'){openBox(Number(payload.index));}
 }
 function spin(){
  const sectors=a.sectors||[];if(!sectors.length)return;
  const i=(game.turn||0)%sectors.length,s=sectors[i];
  setGame((g:any)=>({...g,turn:(g.turn||0)+1,used:[...g.used,i],
   spin:{id:'practice-'+runId+'-'+(g.turn||0),index:i,revealed:true,startsAt:Date.now()-5000,stopsAt:Date.now()},
   outcome:{label:s.label,kind:s.kind,points:s.points||0,detail:s.detail},
   mini:s.kind==='question'&&s.questions?.length?{question:s.questions[0],step:0,total:s.questions.length,
    deadline:Date.now()+30000,version:1}:null}));
 }
 function openBox(index:number){
  const b=a.boxes?.[index]||{};
  setGame((g:any)=>({...g,used:[...g.used,index],
   box:{index,label:a.items?.[index]||'',detail:b.detail||b.description||
    t('الصندوق اتفتح! ناقش التحدّي مع المشاركين.','Box opened! Discuss the challenge with participants.'),
    question:b.question||null,answered:false,target:fakePlayer.uid}}));
 }
 const closed=revealed;
 const tally=isPoll&&Array.isArray(a.options)?a.options.map((_:string,i:number)=>votes.filter(v=>v===i).length):null;
 const fakeS:any={
  activity:displayActive,status:closed?'results':'question',current:step,serverNow:Date.now(),
  clockNow:Date.now(),paused:phase==='intro'||paused,deadline:null,remaining:seconds*1000,
  runtime:{phase:'answering',analytics:false,highlight:-1},players:[fakePlayer],submitted:isPoll?votes.length:(answer===null?0:1),
  mine:mode==='play'?{...fakePlayer,eligible:true,answered:answer!==null,answer,points:null}:null,
  individual:[{uid:fakePlayer.uid,name:fakePlayer.name,score:0}],teams:[],teamMode:false,
  tally:isPoll&&((a.liveResults&&!closed)||closed)?tally:null,
  pollSummary:isPoll&&((a.liveResults&&!closed)||closed)?samplePollSummary(a,votes):null,
  game, keyRevealed:closed,reveal:game.card,metaSummary:null
 };
 const host=mode==='host',display=mode==='display',play=mode==='play';
 return <div key={runId} className={'arena-sim-stage arena-sim-stage--'+mode}>
  {phase==='intro'?<div className="arena-sim-intro">
   <ActivityArt activity={a} label={activityLabel(a,ar)} eager/>
   <span className="eyebrow">SIMULATION · INTRO</span>
   <h2>{activityLabel(a,ar)}</h2><p>{a.prompt}</p>
   <button className="btn primary" onClick={()=>{setPhase('question');setPaused(false);}}>
    <Play size={17}/>{t('ابدأ تجربة النشاط','Start activity practice')}</button>
  </div>:<>
   <div className="arena-sim-question-head">
    <strong>{active.prompt||a.prompt}</strong><span>{active.timer?
     t('الوقت التجريبي: ','Practice timer: ')+seconds+'s':
     t('بإيقاع المدرب','Trainer paced')}</span>
   </div>
   {!!active.timer&&<div className="arena-sim-timer-track"><i style={{width:progress+'%'}}/></div>}
   <StageMedia media={active.media||a.media}/>
   <GamePlay key={step+':'+mode} s={fakeS} ar={ar} host={host} display={display}
    canAnswer={play&&!closed&&(!active.timer||seconds>0)} busy={false}
    onSubmit={submit}
    onInteract={(kind:string,payload:any)=>action(kind,payload)}
    onControl={(kind:string,index?:number,extra?:any)=>{
     if(kind==='spin')spin();else if(kind==='box')openBox(Number(index));
     else if(kind==='revealkey'||kind==='metareveal')reveal();
     else if(kind==='reveal')setGame((g:any)=>({...g,card:index||0,flipped:true}));
     else if(kind==='selectturn')setNote(t('اختيار المتدرب هنا تجريبي فقط.','Demo player selection only.'));
    }}/>
   {note&&<p className="arena-sim-note" role="status">{note}</p>}
   <div className="arena-sim-controls">
    {host&&<><button className="btn secondary" onClick={()=>setPaused(v=>!v)} disabled={closed||!active.timer}>
     {paused?t('استكمال العداد','Resume timer'):t('إيقاف العداد','Pause timer')}</button>
     {!closed&&<button className="btn primary" onClick={reveal}>{t('اعرض النتيجة','Reveal results')}</button>}</>}
    {play&&!closed&&answer!==null&&<button className="btn secondary" onClick={()=>{setAnswer(null);setNote('');}}>{t('جرّب إجابة أخرى','Try another answer')}</button>}
    {display&&!closed&&<p className="muted">{t('عرض محاكاة البروجيكتور، من غير تحكم في الجلسة.','Simulated projector view: read only.')}</p>}
    {closed&&a.questions?.length>step+1&&<button className="btn primary" onClick={()=>{
     setStep(v=>v+1);setAnswer(null);setRevealed(false);setSeconds(a.questions[step+1]?.timer||30);setPaused(false);setNote('');
    }}>{t('السؤال التالي','Next question')}</button>}
   </div>
  </>}
  <div className="arena-sim-stage-footer"><button className="text-button" onClick={resetStage}><RotateCcw size={15}/>{t('إعادة تجربة النشاط','Restart this activity')}</button>
   <span><ShieldCheck size={15}/>{t('محاكاة محلية · لا بيانات حقيقية','Local preview · no real session data')}</span></div>
 </div>;
}
export default function ArenaSimulator({ar,activities,onClose,title,initialIndex=0}:{
 ar:boolean;activities:Activity[];onClose:()=>void;title?:string;initialIndex?:number
}){
 const t=(a:string,e:string)=>ar?a:e;
 const flattened=useMemo(()=>{
  try{const result=flattenDeck(activities);return Array.isArray(result)&&result.length?result:activities;}
  catch{return activities;}
 },[activities]);
 const [index,setIndex]=useState(Math.min(Math.max(0,initialIndex),Math.max(0,flattened.length-1)));
 const [mode,setMode]=useState<Mode>('play'),[runId,setRunId]=useState(0);
 const go=(i:number)=>{if(i<0||i>=flattened.length)return;setIndex(i);setRunId(n=>n+1);};
 const a=flattened[index];
 if(!a)return null;
 return <div className="arena-simulator-overlay" role="dialog" aria-modal="true" aria-label={t('محاكي التدريب','Training simulator')} dir={ar?'rtl':'ltr'}>
  <div className="arena-simulator-shell">
   <header className="arena-simulator-header">
    <div><span className="eyebrow"><Gamepad2 size={17}/> ARENA PRACTICE MODE</span>
     <h2>{title||t('محاكي الجلسة','Session simulator')}</h2>
     <p>{t('جرّب قبل الانطلاق وارجع عدّل تصميمك في أي وقت','Rehearse first, then return and improve your design anytime')}</p></div>
    <button className="btn secondary" onClick={onClose}><X size={17}/>{t('الرجوع للتعديل','Return to editing')}</button>
   </header>
   <nav className="arena-simulator-progress" aria-label={t('مراحل محاكاة الجلسة','Session simulation steps')}>
    {flattened.map((item:any,i:number)=><button type="button" key={i}
      className={i===index?'selected':''} title={item.prompt} onClick={()=>go(i)}
      aria-current={i===index?'step':undefined}>{String(i+1).padStart(2,'0')} · {activityLabel(item,ar)}</button>)}
   </nav>
   <div className="arena-simulator-toolbar">
    <span><CheckCircle2 size={17}/>{t('وضع تجريبي، مفيش QR ولا متدربين ولا نقاط حقيقية','Practice only: no QR, real participants or live scores')}</span>
    <div className="arena-simulator-modes">
     {([['play',Smartphone,t('المتدرب','Trainee')],['host',Users,t('المدرب','Trainer')],['display',Monitor,t('البروجيكتور','Projector')]] as const).map(([value,Icon,label])=>
      <button type="button" className={mode===value?'selected':''} key={value} onClick={()=>setMode(value)}
       aria-pressed={mode===value}><Icon size={16}/>{label}</button>)}
    </div>
   </div>
   <main className="arena-simulator-main"><PracticeStage key={index+'-'+runId} a={a} ar={ar} mode={mode} runId={runId}/></main>
   <footer className="arena-simulator-footer">
    <button className="btn secondary" disabled={index===0} onClick={()=>go(index-1)}><ArrowRight size={17}/>{t('النشاط السابق','Previous activity')}</button>
    <span>{index+1} / {flattened.length} · {activityLabel(a,ar)}</span>
    <button className="btn primary" disabled={index===flattened.length-1} onClick={()=>go(index+1)}>{t('النشاط التالي','Next activity')}<ArrowLeft size={17}/></button>
   </footer>
  </div>
 </div>;
}
