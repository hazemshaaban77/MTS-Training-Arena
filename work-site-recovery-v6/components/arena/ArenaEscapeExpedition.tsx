'use client';
import type {ReactNode} from 'react';
import {CheckCircle2,Clock3,DoorOpen,Flag,KeyRound,Lightbulb,LockKeyhole,Map,ShieldCheck,Sparkles,Users,UnlockKeyhole,Zap} from 'lucide-react';

type Props={a:any;ar:boolean;host:boolean;display:boolean;actor:boolean;usable:boolean;
 busy:boolean;g:any;s:any;questionSlot?:ReactNode;
 onControl:(action:string,index?:number,extra?:any)=>void;send:(action:string,extra?:any)=>void};

export default function ArenaEscapeExpedition({a,ar,host,actor,usable,busy,g,s,questionSlot,onControl,send}:Props){
 const t=(arabic:string,english:string)=>ar?arabic:english;
 const rooms:Array<any>=Array.isArray(a.rooms)?a.rooms:[];
 const e=g.escape;
 const complete=!!e?.escaped;
 const rawRoom=Number.isInteger(e?.room)?e.room:0;
 const roomIndex=Math.max(0,Math.min(Math.max(0,rooms.length-1),rawRoom));
 const room=rooms[roomIndex];
 const progress=Array.isArray(g.progress)?g.progress:[];
 const now=Number(s.clockNow||s.serverNow||0);
 const remaining=e?.deadline?Math.max(0,Math.ceil((Number(e.deadline)-now)/1000)):null;
 // Host sees only already-synced player progress. Spectator sees a neutral map,
 // never an invented leaderboard/room state from other participants.
 function override(p:any){
  if(!host)return;
  const player=(s.players||[]).find((x:any)=>x.uid===p.actor||p.actor==='team:'+x.team||p.actor==='collaborative');
  if(!player)return;
  const reason=window.prompt(t('سبب تجاوز الغرفة (5 حروف على الأقل)','Reason for room override (5 characters minimum)'));
  if(reason&&reason.trim().length>=5)onControl('override',undefined,{player:player.uid,reason:reason.trim()});
 }
 return <section className={'escape-expedition'+(complete?' escape-expedition--complete':'')}
  aria-label={t('مهمة غرفة الهروب','Escape room mission')} aria-live="off">
  <div className="escape-expedition__atmosphere" aria-hidden="true"><i/><i/><i/><i/><i/></div>
  <header className="escape-expedition__header">
   <span className="escape-expedition__tag"><LockKeyhole size={17}/>{t('غرفة الهروب · مهمة سرية','ESCAPE ROOM · CLASSIFIED MISSION')}</span>
   <div className="escape-expedition__header-count"><Map size={18}/>
    {actor?complete?t('اكتملت المهمة','MISSION COMPLETE'):
      t('غرفة ','ROOM ')+(roomIndex+1)+' / '+rooms.length:
      rooms.length+' '+t('غرف في المهمة','MISSION ROOMS')}
   </div>
  </header>
  <div className="escape-expedition__main">
   <div className="escape-expedition__door-scene">
    <div className={'escape-expedition__door'+(complete?' escape-expedition__door--open':'')} aria-hidden="true">
     <div className="escape-expedition__door__frame">
      <span className="escape-expedition__door__panel">
       <span className="escape-expedition__door__bars"/>
       <span className="escape-expedition__door__seal">{complete?<UnlockKeyhole size={59}/>:<LockKeyhole size={59}/>}</span>
       <span className="escape-expedition__door__number">{actor?String(roomIndex+1).padStart(2,'0'):'ARENA'}</span>
      </span>
     </div>
     <span className="escape-expedition__door__floor"/>
    </div>
    <div className="escape-expedition__door-caption"><span><KeyRound size={19}/>
      {complete?t('الباب اتفتح!','GATE UNLOCKED'):
       actor?t('حل اللغز عشان تفتح الباب','SOLVE TO UNLOCK'):
       t('المهمة شغالة على أجهزة المشاركين','MISSION ACTIVE ON DEVICES')}</span>
    </div>
   </div>
   <div className="escape-expedition__story">
    <span className="escape-expedition__eyebrow"><Sparkles size={16}/>
     {complete?t('المهمة نجحت','MISSION ACCOMPLISHED'):
       actor?t('مرحلتك الحالية','YOUR CURRENT CHAMBER'):
       t('خريطة المغامرة','ADVENTURE CONTROL')}
    </span>
    <h3>{complete?t('الهروب اكتمل!','YOU ESCAPED!'):
       actor?String(e?.title||room?.title||t('الغرفة','Room')):
       t('كل لغز يقرب الفريق من الهروب','EVERY CLUE OPENS A NEW PATH')}
    </h3>
    <p className="escape-expedition__narrative">
     {complete?t('حلّيت التحديات ووصلت للنهاية. شارك فريقك الحلول اللي استخدمتها.',
       'All puzzles solved. Share your reasoning and strategies with the team.'):
      actor?String(e?.narrative||room?.narrative||''):
      t('كل متدرب بيتقدم حسب إجاباته الفعلية. تابع مستوى تقدمهم من لوحة المدرب.',
       'Participants progress only through their actual answers. Review live progress below.')}
    </p>
    {actor&&!complete&&remaining!==null&&<div className="escape-expedition__countdown" role="timer">
     <Clock3 size={24}/><span>{t('باقي من وقت الغرفة','ROOM TIME LEFT')}</span>
     <strong dir="ltr">{String(Math.floor(remaining/60)).padStart(2,'0')}:{String(remaining%60).padStart(2,'0')}</strong>
    </div>}
    {actor&&!complete&&<div className="escape-expedition__puzzle">
     <div className="escape-expedition__puzzle-title"><Zap size={18}/>
      {t('لغز الغرفة','CHAMBER PUZZLE')}{e&&<small>{Number(e.puzzle||0)+1}</small>}
     </div>
     {questionSlot}
     {e?.lastCorrect===false&&<p className="escape-expedition__retry" role="status">
      <ShieldCheck size={19}/>{t('المحاولة دي مش صحيحة. جرّب مرة تانية وراجع تفاصيل اللغز.',
        'Not solved yet. Review the clues and try another approach.')}
     </p>}
    </div>}
    {actor&&!complete&&<div className="escape-expedition__hint">
     {e?.hint?<div className="escape-expedition__hint-revealed"><Lightbulb size={21}/>
      <span><b>{t('التلميح اتفتح','HINT UNLOCKED')}</b>{e.hint}</span></div>:
      <button className="escape-expedition__hint-action" type="button" disabled={!usable||busy||!e?.hintAvailable}
       onClick={()=>send('hint')}><Lightbulb size={19}/>
       {e?.hintAvailable?t('كشف تلميح الغرفة','Reveal room hint'):
         t('التلميح هيفتح بعد أول محاولة','Hint unlocks after your first attempt')}
      </button>}
    </div>}
    {complete&&<div className="escape-expedition__success" role="status">
     <CheckCircle2 size={28}/><strong>{t('تحدّيت المراحل وفتحت البوابة','THE GATE IS OPEN')}</strong><span>✦ ✦ ✦</span>
    </div>}
   </div>
  </div>
  <div className="escape-expedition__map" aria-label={t('خريطة غرف الهروب','Escape room map')}>
   <div className="escape-expedition__map-heading"><Map size={19}/><strong>{t('خريطة المهمة','MISSION MAP')}</strong></div>
   <div className="escape-expedition__rooms">{rooms.map((r:any,i:number)=>{
    const passed=actor&&(complete||i<roomIndex);
    const active=actor&&!complete&&i===roomIndex;
    return <div key={i} className={'escape-expedition__room'+(passed?' is-complete':'')+(active?' is-current':'')}>
     <span className="escape-expedition__room-index">{passed?<CheckCircle2 size={20}/>:active?<DoorOpen size={20}/>:<LockKeyhole size={20}/>}</span>
     <b>{r.title}</b><small>{t('غرفة ','Room ')+(i+1)} · {Number(r.puzzles)||0} {t('ألغاز','puzzles')}</small>
    </div>;
   })}</div>
  </div>
  {host&&<div className="escape-expedition__host">
   <div className="escape-expedition__host-heading"><Users size={19}/>
    <strong>{t('تقدم المشاركين الفعلي','LIVE PARTICIPANT PROGRESS')}</strong>
    <span>{progress.length}</span>
   </div>
   {progress.length?<div className="escape-expedition__participants">
    {progress.map((p:any,i:number)=>{
     const person=(s.players||[]).find((x:any)=>x.uid===p.actor||p.actor==='team:'+x.team);
     return <div key={String(p.actor||i)} className="escape-expedition__participant">
      <div><span className="escape-expedition__participant-avatar">{String(person?.name||p.actor||'?').charAt(0)}</span>
       <span><b>{person?.name||p.actor}</b><small>{t('غرفة ','Room ')+(Number(p.room||0)+1)} · {t('لغز ','Puzzle ')+(Number(p.puzzle||0)+1)}</small></span></div>
      <button type="button" className="btn secondary compact" onClick={()=>override(p)}>
       <Flag size={15}/>{t('تجاوز موثق','Audited override')}</button>
     </div>;
    })}</div>:<p className="escape-expedition__empty">{t('في انتظار أول تقدم حقيقي من المتدربين','Waiting for actual participant progress')}</p>}
  </div>}
  <p className="escape-expedition__footer"><ShieldCheck size={15}/>
   {t('فتح الغرف والتلميحات والنتائج كلها بتتحدد من السيرفر، مش من الحركة على الشاشة.',
    'Rooms, hints and results are revealed by server state, never by an animation.')}
  </p>
 </section>;
}
