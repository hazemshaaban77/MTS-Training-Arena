'use client';
import type {ReactNode,Dispatch,SetStateAction} from 'react';
import {Award,BarChart3,CheckCircle2,Clock3,Crown,LockKeyhole,Mic2,ShieldCheck,Sparkles,Spotlight,TimerReset,Trophy,Users,Wallet,Zap} from 'lucide-react';

type Props={
 s:any;ar:boolean;host:boolean;display:boolean;actor:boolean;usable:boolean;busy:boolean;closed:boolean;
 g:any;bet:number;setBet:Dispatch<SetStateAction<number>>;
 cast:string[];setCast:Dispatch<SetStateAction<string[]>>;
 onControl:(action:string,index?:number,extra?:any)=>void;
 send:(action:string,payload?:any)=>void;
 children?:ReactNode;
};
export default function ArenaGameShow({s,ar,host,display,actor,usable,busy,closed,g,bet,setBet,cast,setCast,onControl,send,children}:Props){
 const t=(a:string,e:string)=>ar?a:e;
 const phase=s.runtime?.phase||'answering';
 const contestantIds=Array.isArray(s.runtime?.targets)?s.runtime.targets:[];
 const contestants=(s.players||[]).filter((p:any)=>contestantIds.includes(p.uid||p.id));
 const score=Math.max(0,Number((s.individual||[]).find((p:any)=>p.uid===s.mine?.id)?.score||0));
 const maxStake=Math.min(10000,Math.floor(score));
 const selectedCast=(s.players||[]).filter((p:any)=>cast.includes(p.uid));
 const castMax=s.activity?.participation==='head-to-head'?2:1;
 const lives=[
  {kind:'fifty',icon:ShieldCheck,label:'50:50',sub:t('استبعاد اختيارين','Remove two options')},
  {kind:'audience',icon:Users,label:t('الجمهور','Audience'),sub:t('استطلاع غير محسوب','Unscored audience vote')},
  {kind:'time',icon:TimerReset,label:'+30s',sub:t('وقت إضافي','Extra 30 seconds')}
 ];
 const audience=Array.isArray(g.audience)?g.audience.map((n:any)=>Math.max(0,Number(n)||0)):[];
 const voteCount=audience.reduce((sum:number,n:number)=>sum+n,0);
 const options=Array.isArray(s.activity?.options)?s.activity.options:[];
 const validChoice=Number.isInteger(bet)&&bet>=0&&bet<=maxStake;
 return <section className={'arena-tv-show arena-tv-show--'+phase+(closed?' arena-tv-show--closed':'')}
   aria-label={t('البرنامج التنافسي','Competition game show')}>
  <div className="arena-tv-show__lights" aria-hidden="true"><i/><i/><i/><i/></div>
  <header className="arena-tv-show__header">
   <div className="arena-tv-show__brand"><span className="arena-tv-show__live"><span/> LIVE ARENA</span>
    <h3><Trophy size={27}/>{t('عرض الأبطال','ULTIMATE GAME SHOW')}</h3>
    <small>{t('على المسرح… كل قرار يفرق','THE STAGE IS YOURS · EVERY DECISION COUNTS')}</small>
   </div>
   <div className="arena-tv-show__stage-label">
    <Spotlight size={21}/><span>{phase==='casting'?t('اختيار المتسابقين','CONTESTANT SELECTION'):
     phase==='betting'?t('مرحلة الرهان','RISK ROUND'):
     closed?t('لحظة إعلان النتائج','THE REVEAL'):t('المواجهة المباشرة','ON THE SPOTLIGHT')}</span>
   </div>
  </header>
  {s.activity?.showFormat==='ladder'&&<section className="arena-tv-show__ladder"
   aria-label={t('سلّم مستويات المسابقة','Competition prize ladder')}>
   <div className="arena-tv-show__ladder-header"><Crown size={19}/>
    <b>{t('سلّم الجائزة','THE PRIZE LADDER')}</b>
    <span>{t('المستوى','Level')} {s.activity?.showRound||1} / {s.activity?.showTotal||1}</span>
   </div>
   <ol>{(s.activity?.showLadder||[]).map((points:number,i:number)=><li key={i}
    className={i+1===s.activity?.showRound?'current':i+1<s.activity?.showRound?'passed':''}>
    <span>{String(i+1).padStart(2,'0')}</span><strong>{Number(points).toLocaleString(ar?'ar-EG':'en-US')}</strong>
    {i+1===s.activity?.showRound&&<Sparkles size={15}/>}</li>)}</ol>
   <p><ShieldCheck size={16}/>{t('إجابة صحيحة = تكمل للمستوى التالي. إجابة خاطئة أو انتهاء الوقت = خروج المتسابق. الوسائل المساعدة مرة واحدة طوال المنافسة.',
   'Correct advances. Wrong or timed-out ends the contestant run. Each lifeline is available once in the competition.')}</p>
  </section>}
  {phase==='casting'?<div className="arena-tv-show__casting">
   <div className="arena-tv-show__central-emblem"><Mic2 size={59}/><span className="arena-tv-show__orbit"/></div>
   <h4>{t('مين هيطلع مسرح الأبطال؟','WHO TAKES THE SPOTLIGHT?')}</h4>
   <p>{t('المدرب يختار المتسابقين أولًا، والسؤال يفضل مخفي لحد ما يتم اعتمادهم.',
    'The trainer selects the contestants first. Questions stay hidden until selection is confirmed.')}</p>
   {host?<><div className="arena-tv-show__contestants">
    {(s.players||[]).filter((p:any)=>p.approval==='approved').map((p:any)=>{
     const picked=cast.includes(p.uid),eliminated=(g.eliminated||[]).includes(p.uid);
     return <button type="button" key={p.uid} aria-pressed={picked} className={picked?'picked':''} disabled={busy||eliminated}
      onClick={()=>setCast(old=>picked?old.filter(id=>id!==p.uid):[...(castMax===1?[]:old.slice(-(castMax-1))),p.uid])}>
      <span className="arena-tv-show__avatar">{String(p.name||'?').charAt(0)}</span>
      <b>{p.name}</b><small>{eliminated?t('خرج من المنافسة','Eliminated'):p.team||''}</small>{picked&&<CheckCircle2 size={18}/>}
     </button>;
    })}
   </div><p className="arena-tv-show__selection-caption">
    {selectedCast.length} / {castMax} {t('متسابقين مختارين','contestants selected')}</p>
    <button className="btn primary large arena-tv-show__primary" disabled={busy||cast.length!==castMax}
     onClick={()=>onControl('stagecast',undefined,{players:cast})}>
     <Mic2 size={20}/>{t('اعتمد المتسابقين وابدأ الجولة','Confirm contestants and begin')}
    </button></>:<div className="arena-tv-show__standby"><Users size={28}/>{t('استعد… المدرب بيختار نجوم الجولة','Get ready… the trainer is selecting contestants')}</div>}
  </div>:
  phase==='betting'?<div className="arena-tv-show__betting">
   <div className="arena-tv-show__central-emblem"><Wallet size={55}/><span className="arena-tv-show__orbit"/></div>
   <h4>{t('رهان الأبطال','THE STAKES ARE RISING')}</h4>
   <p>{t('اختار رهانك قبل ما السؤال يظهر. الرهان بيتخصم عند تثبيته، وبيرجع مضاعف لما تجاوب صح.',
    'Choose your stake before the question appears. It is deducted on commitment and returns doubled for a correct answer.')}</p>
   {actor&&(g.bet!==null&&g.bet!==undefined?
    <div className="arena-tv-show__receipt"><LockKeyhole size={23}/>{t('تم تثبيت رهانك على السيرفر','Your stake has been committed')}</div>:
    <div className="arena-tv-show__stake">
     <label htmlFor="arena-show-stake">{t('نقاط الرهان','Stake in points')}</label>
     <div className="arena-tv-show__stake-controls"><input id="arena-show-stake" type="number" inputMode="numeric"
      min={0} max={maxStake} step={1} value={bet} disabled={!usable||busy}
      onChange={e=>setBet(Number(e.target.value))}/>
      <button className="btn primary" disabled={!usable||busy||!validChoice}
       onClick={()=>send('bet',{amount:bet})}><LockKeyhole size={18}/>{t('تثبيت الرهان','Commit stake')}</button>
     </div><small>{t('المتاح للرهان: ','Available to stake: ')}{maxStake.toLocaleString(ar?'ar-EG':'en-US')}</small>
    </div>)}
   {host&&<button className="btn primary large arena-tv-show__primary" disabled={busy}
    onClick={()=>onControl('lockbets')}><Zap size={19}/>{t('اقفل الرهانات واكشف السؤال','Lock stakes and reveal question')}</button>}
   {display&&<div className="arena-tv-show__standby"><LockKeyhole size={22}/>{t('الرهانات قيد التثبيت','STAKES ARE BEING LOCKED')}</div>}
  </div>:
  <div className="arena-tv-show__playing">
   <div className="arena-tv-show__contestant-banner">
    <Crown size={25}/><span>{contestants.length?contestants.map((p:any)=>p.name).join('  ×  '):
     t('ساحة الأبطال','CHAMPIONS STAGE')}</span>
    <Award size={25}/>
   </div>
   {actor&&<div className="arena-tv-show__powerups" aria-label={t('وسائل المساعدة','Lifelines')}>
    {lives.map(({kind,icon:Icon,label,sub})=>{
     const used=Array.isArray(g.lifelines)&&g.lifelines.includes(kind);
     return <button type="button" key={kind} className={used?'used':''}
      disabled={!usable||used||busy} aria-label={label+' · '+sub}
      onClick={()=>send('lifeline',{kind})}>
      <Icon size={26}/><b>{label}</b><small>{used?t('استخدمت','USED'):sub}</small>
      {used&&<CheckCircle2 size={14} className="arena-tv-show__used-icon"/>}
     </button>;
    })}
   </div>}
   <div className="arena-tv-show__question-frame"><span className="arena-tv-show__frame-glow" aria-hidden="true"/>
    {children}
   </div>
   {g.audienceRequested&&<section className="arena-tv-show__audience">
    <h4><BarChart3 size={20}/>{t('مؤشر تصويت الجمهور','AUDIENCE VOTE')}</h4>
    <div className="arena-tv-show__audience-chart" role="list">
    {options.map((option:string,i:number)=>{
     const votes=audience[i]||0;
     return <div role="listitem" key={i}><span title={option}>{option}</span>
      <div className="arena-tv-show__chart-track" aria-label={votes+' '+t('صوت','votes')}>
       <i style={{width:(voteCount?100*votes/voteCount:0)+'%'}}/>
      </div><b>{votes.toLocaleString(ar?'ar-EG':'en-US')}</b></div>;
    })}
    </div>
    {actor&&!closed&&<div className="arena-tv-show__audience-ballot">
     <small>{t('اختيار الجمهور استرشادي، بدون نقاط ولا إجابة صحيحة معلنة',
      'Advisory audience opinion only, unscored and not a correct-answer hint')}</small>
     <div>{options.map((_:string,i:number)=><button type="button" key={i}
      disabled={!usable||busy} onClick={()=>send('audience',{choice:i})}
      aria-label={t('صوت للاختيار ','Vote for option ')+(i+1)}>{i+1}</button>)}</div>
    </div>}
   </section>}
   {closed&&<div className="arena-tv-show__result-note"><Sparkles size={21}/>{t('انتهت الجولة… والنتيجة حسب تسجيل السيرفر',
    'Round closed · Official results are provided by the server')}</div>}
  </div>}
 </section>;
}
