'use client';
import {useEffect,useState} from 'react';
import {Award,CheckCircle2,Clock3,Crown,HeartHandshake,LogOut,Mic2,ShieldCheck,TimerReset,Trophy,Users,XCircle,Zap} from 'lucide-react';
export default function ArenaChampionship({s,ar,host,display,busy,onControl,onInteract}:{
 s:any;ar:boolean;host:boolean;display:boolean;busy:boolean;
 onControl:(action:string,index?:number,extra?:any)=>void;
 onInteract:(action:string,extra?:any)=>void;
}){
 const t=(a:string,e:string)=>ar?a:e,show=s.show||{},q=show.question;
 const [selected,setSelected]=useState<number|null>(null),[candidate,setCandidate]=useState(''),[confirmAnswer,setConfirmAnswer]=useState(false);
 useEffect(()=>{setSelected(null);setConfirmAnswer(false);},[show.level,show.contestant,show.phase]);
 const contestant=(s.players||[]).find((p:any)=>p.uid===show.contestant);
 const isActor=!!s.mine&&s.mine.id===show.contestant&&!host&&!display;
 const audience=!!s.mine&&!host&&!display&&!isActor;
 const available=(s.players||[]).filter((p:any)=>p.approval==='approved'&&!(show.usedContestants||[]).includes(p.uid));
 const seconds=s.deadline?Math.max(0,Math.ceil((s.deadline-(s.clockNow||s.serverNow))/1000)):0;
 const remaining=show.ladder?.[Math.max(0,show.level-1)]||0;
 const possible=show.ladder?.[show.level]||0;
 const safeAt=(show.safeLevels||[]).filter((level:number)=>level<=show.level).pop()||0;
 const safeValue=safeAt?show.ladder?.[safeAt-1]:0;
 return <section className="championship-stage" dir={ar?'rtl':'ltr'} aria-label={t('طريق البطولة','Championship game show')}>
  <header className="championship-stage__intro">
   <div><span className="eyebrow"><Trophy size={17}/> CHAMPIONSHIP ARENA</span>
    <h2><Crown size={24}/>{t('التحدي الكبير · طريق البطولة','ULTIMATE SHOW · ROAD TO THE CROWN')}</h2>
    <p>{t('برنامج مسابقات بقواعد حقيقية، وكل متسابق ليه محاولة مستقلة.',
     'Real show rules. Every contestant gets an independent run.')}</p>
   </div><span className="championship-stage__phase">{show.phase==='casting'?t('اختيار المتسابق','SELECT CONTESTANT'):
    show.phase==='completed'?t('لدينا بطل!','WE HAVE A CHAMPION!'):
    t('مواجهة مباشرة','ON THE HOT SEAT')}</span>
  </header>
  <div className="championship-stage__layout">
   <aside className="championship-stage__ladder">
    <h3><Award size={19}/>{t('سلّم الجوائز','Prize ladder')}</h3>
    <ol>{(show.ladder||[]).map((amount:number,i:number)=><li key={i}
     className={(show.phase==='answering'&&i===show.level?'active ':'')+
      ((show.safeLevels||[]).includes(i+1)?'safe ':'')+
      (show.phase==='answering'&&i<show.level?'won':'')}>
     <span>{String(i+1).padStart(2,'0')}</span><b>{amount.toLocaleString(ar?'ar-EG':'en-US')}</b>
     {(show.safeLevels||[]).includes(i+1)&&<ShieldCheck size={14}/>}</li>)}</ol>
    <p>{t('العلامة الخضراء = مستوى أمان','Shield = guaranteed prize level')}</p>
   </aside>
   <div className="championship-stage__center">
    {show.phase==='casting'?<div className="championship-stage__casting">
     <Mic2 size={44} className="championship-stage__spotlight"/>
     <h3>{t('مين المتسابق الجاي؟','Who takes the hot seat?')}</h3>
     <p>{t('كل متسابق جديد يبدأ من السؤال الأول ومساعداته بتتجدد. اللي خرج ما بيرجعش لنفس المسابقة.',
      'Each new contestant starts at question one with fresh lifelines. Completed attempts cannot re-enter.')}</p>
     {host&&s.status==='question'&&<><label>{t('اختار متسابق معتمد','Pick an approved contestant')}
      <select value={candidate} onChange={e=>setCandidate(e.target.value)}>
       <option value="">{t('اختار المتسابق','Select contestant')}</option>
       {available.map((p:any)=><option key={p.uid} value={p.uid}>{p.name}</option>)}
      </select></label>
      <button className="btn primary" disabled={!candidate||busy}
       onClick={()=>{onControl('showcast',undefined,{player:candidate});setCandidate('');}}>
       <Mic2 size={17}/>{t('ابدأ محاولة المتسابق','Start contestant run')}</button>
      {!(show.attempts||[]).length&&<small>{t('اختار واحد من المتدربين المسجلين في نفس الجلسة.',
       'Choose a registered participant from the same session.')}</small>}
     </>}
     {!host&&<p role="status">{t('المُدرّب بيجهّز المتسابق…','Trainer is selecting the next contestant…')}</p>}
     {show.lastCompleted&&<div className="championship-stage__last"><strong>{t('المحاولة السابقة','Last run')}</strong>
      <b>{(s.players||[]).find((p:any)=>p.uid===show.lastCompleted.player)?.name||t('متسابق','Contestant')}</b>
      <span>{show.lastCompleted.earned.toLocaleString()} {t('نقطة','points')} · {
       show.lastCompleted.status==='eliminated'?t('خرج بعد إجابة خطأ','Eliminated'):
       show.lastCompleted.status==='withdrawn'?t('انسحب بالجائزة','Walked away'):t('انتهى الوقت','Timed out')}</span></div>}
     {host&&s.status==='question'&&<button className="btn secondary" disabled={busy} onClick={()=>onControl('showfinish')}>
      <Trophy size={16}/>{t('إنهاء البرنامج وإعلان الترتيب','Finish show & reveal standings')}</button>}
    </div>:show.phase==='completed'?<div className="championship-stage__winner">
     <Trophy size={56}/><h3>{t('عندنا بطل!','We have a champion!')}</h3>
     <strong>{(s.players||[]).find((p:any)=>p.uid===show.winner)?.name||t('المتسابق الفائز','Winning contestant')}</strong>
     <p>{show.lastCompleted?.earned?.toLocaleString()||0} {t('نقطة','points')}</p>
     {host&&s.status==='question'&&<button className="btn primary" disabled={busy} onClick={()=>onControl('showfinish')}>
      {t('اعرض النتيجة النهائية','Reveal final standings')}</button>}
    </div>:<>
     <div className="championship-stage__contestant"><Mic2 size={18}/>
      <b>{contestant?.name||t('المتسابق','Contestant')}</b>
      <span>{t('المستوى','Level')} {show.level+1}/{show.total}</span>
      <span className="championship-stage__clock"><Clock3 size={17}/>{seconds}s</span>
     </div>
     <article className="championship-stage__question">
      <small>{t('سؤال الجائزة','PRIZE QUESTION')} · {possible.toLocaleString()} {t('نقطة','points')}</small>
      <h3>{q?.prompt||t('السؤال بيظهر بعد اختيار المتسابق','Question appears after casting')}</h3>
      <div className="championship-stage__options">{(q?.options||[]).map((option:string,i:number)=>{
       const removed=isActor&&(show.eliminatedChoices||[]).includes(i);
       return <button key={i} type="button" className={selected===i?'selected':''}
        disabled={!isActor||busy||seconds===0||removed}
        aria-pressed={selected===i} onClick={()=>{setSelected(i);setConfirmAnswer(false);}}>
        <b>{String.fromCharCode(65+i)}</b><span>{removed?'—':option}</span></button>;
      })}</div>
      {isActor&&(confirmAnswer
       ?<div className="championship-answer-confirm" role="group" aria-label={t('تأكيد الإجابة','Answer confirmation')}>
        <p>{t('هل دي إجابتك النهائية؟','Is this your final answer?')} <strong>{selected!==null?q?.options?.[selected]:''}</strong></p>
        <div><button type="button" className="btn secondary" disabled={busy}
         onClick={()=>setConfirmAnswer(false)}>{t('تغيير الإجابة','Change answer')}</button>
         <button type="button" className="btn primary" disabled={selected===null||busy||!seconds}
         onClick={()=>{if(selected!==null){setConfirmAnswer(false);onInteract('showanswer',{answer:selected});}}}>
          <CheckCircle2 size={18}/>{t('تأكيد نهائي','Confirm answer')}</button></div>
       </div>
       :<button type="button" className="btn primary championship-stage__submit"
        disabled={selected===null||busy||!seconds} onClick={()=>setConfirmAnswer(true)}>
         <CheckCircle2 size={18}/>{t('تثبيت الإجابة النهائية','Lock final answer')}</button>)}
      {!isActor&&!host&&!display&&<p className="championship-stage__spectator">
       {t('إنت من الجمهور. تقدر تصوّت لو المتسابق طلب مساعدة الجمهور.',
        'You are in the audience. Vote if the contestant requests audience help.')}</p>}
     </article>
     <section className="championship-stage__lifelines">
      <h4>{t('وسائل المساعدة · مرة لكل محاولة','Lifelines · once per run')}</h4>
      <div>{[['fifty','50:50'],['audience',t('الجمهور','Audience')],['time','+30s']].map(([kind,label])=>{
       const used=(show.lifelines||[]).includes(kind);
       return <button key={kind} type="button" disabled={!isActor||used||busy||!seconds}
        onClick={()=>onInteract('showlifeline',{kind})} className={used?'used':''}>
        {kind==='time'?<TimerReset size={20}/>:kind==='audience'?<Users size={20}/>:<ShieldCheck size={20}/>}
        {label}{used&&<CheckCircle2 size={13}/>}</button>;
      })}</div>
      {show.audienceOpen&&<div className="championship-stage__audience">
       <h4><Users size={17}/>{t('تصويت الجمهور الحقيقي','Live audience vote')}</h4>
       <p>{show.audienceCount} {t('صوت مسجل على السيرفر','server-confirmed votes')}</p>
       <div>{(q?.options||[]).map((x:string,i:number)=><span key={i}>
        {String.fromCharCode(65+i)} · {show.audienceVotes?.[i]||0}</span>)}</div>
       {audience&&!show.voted&&<div className="championship-stage__audience-actions">
        {(q?.options||[]).map((x:string,i:number)=><button key={i} className="btn secondary" disabled={busy}
         onClick={()=>onInteract('showaudience',{choice:i})}>{String.fromCharCode(65+i)}</button>)}</div>}
      </div>}
      {isActor&&show.canWithdraw&&<button className="btn secondary championship-stage__withdraw" disabled={busy}
       onClick={()=>{if(window.confirm(t('تنسحب وتحتفظ بجائزتك الحالية؟','Walk away with your current prize?')))
        onInteract('showwithdraw');}}><LogOut size={17}/>
       {t('انسحب واحتفظ بـ','Walk away with')} {remaining.toLocaleString()} {t('نقطة','points')}</button>}
      <small>{t('في حالة الخطأ تضمن جائزة آخر مستوى أمان: ','Wrong answer guarantees: ')}
       {safeValue.toLocaleString()} {t('نقطة','points')}</small>
     </section>
    </>}
   </div>
  </div>
  {(show.attempts||[]).length>0&&<section className="championship-stage__history">
   <h3><Users size={18}/>{t('نتائج المحاولات المعتمدة','Official attempt results')}</h3>
   <div>{show.attempts.map((attempt:any,i:number)=><div key={attempt.id||i}>
    <strong>{(s.players||[]).find((p:any)=>p.uid===attempt.player)?.name||t('متسابق','Contestant')}</strong>
    <span>{attempt.status==='champion'?t('بطل','Champion'):attempt.status==='withdrawn'?t('انسحب','Walked away'):attempt.status==='timed-out'?t('انتهى الوقت','Timed out'):t('خرج','Eliminated')}</span>
    <b>{attempt.earned.toLocaleString()} {t('نقطة','points')}</b>
   </div>)}</div>
  </section>}
  <footer className="championship-stage__footer"><ShieldCheck size={15}/>
   {t('حالة المحاولة والنتيجة والإقصاء والمساعدات يحكم فيها السيرفر، مش المتصفح.',
    'Attempts, awards, elimination and lifelines are server-authoritative.')}</footer>
 </section>;
}
