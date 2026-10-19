'use client';
import type {ComponentType} from 'react';
import {ArrowRight,CheckCircle2,Clock3,DoorOpen,Flag,KeyRound,Lightbulb,LockKeyhole,Map,ShieldCheck,Sparkles,Users,Zap} from 'lucide-react';

type Props={
 s:any;ar:boolean;host:boolean;display:boolean;actor:boolean;usable:boolean;busy:boolean;closed:boolean;g:any;
 QuestionComponent:ComponentType<any>;
 onControl:(action:string,index?:number,extra?:any)=>void;
 send:(action:string,payload?:any)=>void;
};
export default function ArenaEscapeRoom({
 s,ar,host,display,actor,usable,busy,closed,g,QuestionComponent,onControl,send
}:Props){
 const t=(a:string,e:string)=>ar?a:e;
 const a=s.activity||{},rooms=Array.isArray(a.rooms)?a.rooms:[];
 const progress=Array.isArray(g.progress)?g.progress:[];
 const e=g.escape;
 const activeRoom=actor?Math.min(rooms.length-1,Math.max(0,Number(e?.room||0))):
   progress.length?Math.min(rooms.length-1,Math.max(0,Number(progress[0].room||0))):0;
 const finalEscape=actor&&!!e?.escaped;
 const stageName=String(a.theme||'gateway').replace(/[^a-z0-9-]/gi,'').slice(0,35);
 const roomName=String(rooms[activeRoom]?.title||t('البوابة','Gateway'));
 const totalRooms=rooms.length;
 const remaining=e?.deadline?Math.max(0,Math.ceil((e.deadline-(s.clockNow||s.serverNow))/1000)):null;
 function override(actorId:string){
  const participant=(s.players||[]).find((p:any)=>p.uid===actorId||p.id===actorId
   ||actorId==='team:'+p.team||actorId==='collaborative'&&p.approval==='approved');
  if(!participant)return;
  const reason=window.prompt(t('اكتب سبب فتح الغرفة للمراجعة (5 أحرف على الأقل)',
   'Enter the reason for this audited room override (at least five characters)'));
  if(reason&&reason.trim().length>=5)
   onControl('override',undefined,{player:participant.uid||participant.id,reason:reason.trim()});
 }
 return <section className={'arena-escape-vault arena-escape-vault--'+stageName+(finalEscape?' arena-escape-vault--escaped':'')}
  aria-label={t('مهمة غرفة الهروب','Escape room mission')}>
  <div className="arena-escape-vault__ambient" aria-hidden="true"><i/><i/><i/></div>
  <header className="arena-escape-vault__header">
   <div className="arena-escape-vault__identity">
    <span><Map size={16}/>{t('خريطة المهمة','MISSION MAP')} · {totalRooms} {t('غرف','ROOMS')}</span>
    <h3>{t('افتح البوابة الأخيرة','UNLOCK THE FINAL GATE')}</h3>
    <small>{t('حلّ كل لغز عشان تفتح الطريق للمرحلة اللي بعدها.',
     'Solve each puzzle to unlock the path to the next room.')}</small>
   </div>
   {actor&&e&&<span className="arena-escape-vault__progress-count">
    {finalEscape?totalRooms:Math.min(totalRooms,Math.max(0,Number(e.room||0)+1))} / {totalRooms}
   </span>}
  </header>
  <div className="arena-escape-vault__route" role="list" aria-label={t('تقدم الغرف','Room progress')}>
   {rooms.map((room:any,i:number)=>{
    const passed=actor&&(finalEscape||i<Number(e?.room||0));
    const current=actor?!finalEscape&&i===Number(e?.room||0):i===activeRoom;
    return <div className={'arena-escape-vault__route-room '+(passed?'passed ':current?'current ':'locked ')}
     key={i} role="listitem" aria-current={current?'step':undefined}>
     <span className="arena-escape-vault__route-lock">{passed?<CheckCircle2 size={24}/>:
      current?<KeyRound size={24}/>:<LockKeyhole size={22}/>}</span>
     <div><small>{t('غرفة','ROOM')} {String(i+1).padStart(2,'0')}</small>
      <b>{room.title}</b><small>{room.puzzles} {t('ألغاز','puzzles')}</small>
     </div>
    </div>;
   })}
  </div>
  {actor&&e?<>
   <div className={'arena-escape-vault__mission '+(finalEscape?'finished':'')}>
    <div className="arena-escape-vault__door-frame">
     <div className="arena-escape-vault__door" aria-hidden="true">
      <div className="arena-escape-vault__door-shape">
       {finalEscape?<DoorOpen size={64}/>:<LockKeyhole size={58}/>}
       <span>{finalEscape?'UNLOCKED':'LOCKED'}</span>
      </div>
      <div className="arena-escape-vault__door-glow"/>
     </div>
    </div>
    <div className="arena-escape-vault__mission-copy">
     {finalEscape?<><span className="arena-escape-vault__mission-tag"><Sparkles size={17}/>
      {t('المهمة اكتملت','MISSION COMPLETE')}</span>
      <h4>{t('فتحت كل الأبواب!','ALL GATES UNLOCKED!')}</h4>
      <p>{t('مبروك! اجتزت كل الغرف والتحديات.','Congratulations! You completed every room and puzzle.')}</p>
      </>:<>
      <span className="arena-escape-vault__mission-tag"><Zap size={16}/>
       {t('الغرفة الحالية','CURRENT ROOM')} {Number(e.room||0)+1} / {e.totalRooms}</span>
      <h4>{e.title||roomName}</h4>
      <p>{e.narrative}</p>
      <div className="arena-escape-vault__mission-meta">
       <span><KeyRound size={17}/>{t('اللغز','Puzzle')} {Number(e.puzzle||0)+1}
        {typeof rooms[e.room]?.puzzles==='number'?' / '+rooms[e.room].puzzles:''}</span>
       {remaining!==null&&<strong className={remaining<=10?'urgent':''}><Clock3 size={17}/>
        {remaining}{t(' ثانية',' sec')}</strong>}
      </div>
     </>}
    </div>
   </div>
   {!finalEscape&&<>
    {e.question&&<div className="arena-escape-vault__puzzle"><QuestionComponent
     key={String(e.room)+':'+String(e.puzzle)+':'+String(e.attempts||0)}
     a={e.question} ar={ar} disabled={!usable||busy||closed}
     onSubmit={(answer:any)=>send('puzzle',{answer})}/></div>}
    {e.lastCorrect===false&&<div className="arena-escape-vault__feedback" role="status">
     <Flag size={19}/>{t('لسه الباب مقفول. راجع التفاصيل وحاول تاني.',
      'The door is still locked. Review the puzzle and try again.')}</div>}
    {e.hint?<div className="arena-escape-vault__hint"><Lightbulb size={22}/><span>{e.hint}</span></div>:
     <button className="arena-escape-vault__hint-action" type="button"
      disabled={!usable||busy||!e.hintAvailable} onClick={()=>send('hint')}>
      <Lightbulb size={19}/>{t('اطلب تلميح بعد المحاولة الأولى','Request a hint after your first try')}
     </button>}
   </>}
  </>:<div className="arena-escape-vault__spectator">
   <div className="arena-escape-vault__spectator-door" aria-hidden="true"><DoorOpen size={82}/>
    <span>MISSION CONTROL</span></div>
   <h4>{t('التحدّي شغّال على موبايلات المشاركين','THE MISSION IS LIVE')}</h4>
   <p>{t('تابع تقدّم المتدربين في الغرف من غير ما تكشف حلول الألغاز على البروجيكتور.',
    'Follow each player through the rooms without revealing puzzle answers on the projector.')}</p>
   {host&&<div className="arena-escape-vault__participants" aria-label={t('متابعة المشاركين','Player progress')}>
    <h5><Users size={18}/>{t('تقدّم المشاركين','PARTICIPANT PROGRESS')}</h5>
    {progress.length?progress.map((p:any,i:number)=>{
     const participant=(s.players||[]).find((x:any)=>x.uid===p.actor||x.id===p.actor);
     const displayName=participant?.name||p.actor==='collaborative'?t('الفريق بالكامل','Collaborative team'):
      String(p.actor||t('مشارك','Participant')).startsWith('team:')?String(p.actor).slice(5):
      String(p.actor||t('مشارك','Participant'));
     const progressRoom=Math.max(0,Number(p.room)||0);
     const readyToOverride=!!(s.players||[]).find((x:any)=>x.uid===p.actor||x.id===p.actor||p.actor==='team:'+x.team
      ||p.actor==='collaborative'&&x.approval==='approved');
     return <div key={p.actor||i} className="arena-escape-vault__participant">
      <div><b>{displayName}</b><span>{progressRoom>=totalRooms?t('اكتملت','Completed'):
       t('غرفة','Room')+' '+(progressRoom+1)+' · '+t('لغز','Puzzle')+' '+(Number(p.puzzle||0)+1)}</span></div>
      <div className="arena-escape-vault__participant-bar"><i style={{width:
       (100*Math.min(totalRooms,progressRoom)/Math.max(1,totalRooms))+'%'}}/></div>
      <button className="btn secondary compact" disabled={!readyToOverride||busy}
       onClick={()=>override(String(p.actor))}><ShieldCheck size={15}/>{t('تجاوز موثّق','Audited override')}</button>
     </div>;
    }):<p>{t('في انتظار بدء تقدّم المشاركين','Waiting for player progress')}</p>}
   </div>}
  </div>}
 </section>;
}
