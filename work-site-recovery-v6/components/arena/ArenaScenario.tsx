'use client';
import {ArrowLeft,ArrowRight,BookOpen,CheckCircle2,Compass,Flag,GitBranch,Lightbulb,LockKeyhole,MapPinned,MessageSquareText,ShieldCheck,Sparkles,Users} from 'lucide-react';

type PathStep={node?:string;choice?:number;consequence?:string};
type ScenarioState={
 text?:string;choices?:{label:string}[];ending?:boolean;discussion?:string;
 consequence?:string;path?:PathStep[];
};
type Props={
 s:any;ar:boolean;host:boolean;display:boolean;actor:boolean;usable:boolean;
 busy:boolean;closed:boolean;g:any;send:(action:string,extra?:any)=>void;
};

/** Narrative-only presentation over real server scenario progress.
 * Decision transitions, points, outcomes and paths are all server-owned.
 * Host/projector do not see per-learner routes or future/secret nodes.
 */
export default function ArenaScenario({s,ar,host,display,actor,usable,busy,closed,g,send}:Props){
 const t=(arabic:string,english:string)=>ar?arabic:english;
 const a=s.activity;
 const n:ScenarioState|undefined=g?.scenario;
 const path=Array.isArray(n?.path)?n.path:[];
 const steps=path.filter(step=>typeof step?.consequence==='string'&&step.consequence.trim());
 const choices=Array.isArray(n?.choices)?n.choices:[];
 const finished=!!n?.ending;
 const canChoose=actor&&usable&&!busy&&!closed&&!finished;
 const routeNumber=steps.length+1;
 const title=t('تحدّي القرارات','DECISION JOURNEY');
 if(!actor){
  // The public stage cannot honestly show any individual's private branch
  // state. Keep the trainer facilitation prompt but no fake vote progress.
  return <section className={'arena-scenario arena-scenario--stage'+(display?' arena-scenario--projector':'')} aria-label={title}>
   <div className="arena-scenario__ambient" aria-hidden="true"><i/><i/><i/></div>
   <header className="arena-scenario__eyebrow"><Compass size={17}/>{title}</header>
   <div className="arena-scenario__stage-emblem" aria-hidden="true"><GitBranch size={58}/></div>
   <h3>{t('كل قرار بيغيّر الحكاية','EVERY DECISION SHAPES THE STORY')}</h3>
   <p>{t('المتدربون بيتخذوا قراراتهم على موبايلاتهم، وكل واحد ممكن يوصل لنهاية مختلفة.',
         'Participants make their own decisions on their devices. Different choices can lead to different endings.')}</p>
   <div className="arena-scenario__stage-signal"><Users size={19}/>
    {closed?t('الجولة انتهت · وقت مناقشة القرارات','ROUND CLOSED · TIME TO DEBRIEF'):
      t('القرارات شغّالة دلوقتي على أجهزة المشاركين','LEARNERS ARE EXPLORING THEIR PATHS')}</div>
   {host&&<aside className="arena-scenario__facilitator"><BookOpen size={19}/><span>
    {t('اسأل المشاركين: إيه المعلومات اللي اعتمدتوا عليها؟ وإيه العواقب اللي شفتوها؟ بعد ما تقفل الجولة ناقش اختلاف المسارات.',
       'Ask: What information shaped your decision? Which consequences did you see? Compare participant routes once the round closes.')}
   </span></aside>}
   {closed&&g?.scenarioMap&&<div className="arena-scenario__mind-map" role="region"
    aria-label={t('خريطة المسار الصحيح','Canonical decision mind map')}>
    <h3><MapPinned size={24}/>{t('الخريطة النهائية للمسار الصحيح','THE CORRECT DECISION PATH')}</h3>
    {g.scenarioMap.path?.length? <ol>{g.scenarioMap.path.map((node:any,i:number)=>
      <li key={node.id||i} className={node.ending?'is-ending':''}>
       <span className="arena-scenario__mind-index">{i+1}</span>
       <div><b>{node.text}</b>
        {node.choice&&<strong><CheckCircle2 size={16}/>{node.choice}</strong>}
        {node.consequence&&<small>{node.consequence}</small>}
        {node.ending&&<span><Flag size={15}/>{t('النهاية الصحيحة','Correct ending')}</span>}
       </div>
      </li>)}</ol>:null}
    {!g.scenarioMap.complete&&<p>{t('المسار الصحيح غير مكتمل الإعداد. حدّد اختيارًا صحيحًا لكل عقدة داخل الاستوديو.',
      'Correct path is not fully authored. Mark a correct choice for every decision node in Studio.')}</p>}
   </div>}
   <div className="arena-scenario__stage-footer"><ShieldCheck size={16}/>{t('نتائج كل مسار خاصة بصاحب القرار؛ لا نعرض اختيارات فردية على البروجيكتور.',
    'Individual decision paths stay private and are not exposed on the projector.')}</div>
  </section>;
 }
 if(!n)return <section className="arena-scenario arena-scenario--loading" role="status">
  <MapPinned size={36}/>
  <h3>{t('بنجهّز مسار القرار…','Preparing your decision journey…')}</h3>
  <p>{t('استنى تحديث الجلسة من السيرفر.','Waiting for authoritative session progress.')}</p>
 </section>;
 return <section className={'arena-scenario arena-scenario--learner'+(finished?' arena-scenario--ending':'')}
  aria-label={title}>
  <div className="arena-scenario__ambient" aria-hidden="true"><i/><i/><i/></div>
  <div className="arena-scenario__learner-top">
   <span className="arena-scenario__eyebrow"><GitBranch size={17}/>{title}</span>
   <span className="arena-scenario__step"><MapPinned size={17}/>{finished?t('النهاية','ENDING'):t('قرار رقم ','DECISION ')+routeNumber}</span>
  </div>
  <div className="arena-scenario__journey" aria-label={t('مسار قراراتك حتى الآن','Your decision journey so far')}>
   <span className="arena-scenario__journey-node is-start"><Compass size={17}/></span>
   {steps.slice(-8).map((step,i)=><span className="arena-scenario__journey-node is-complete"
     title={step.consequence} key={i}><CheckCircle2 size={16}/></span>)}
   <span className={'arena-scenario__journey-node '+(finished?'is-finished':'is-active')}>
    {finished?<Flag size={16}/>:<GitBranch size={16}/>}
   </span>
  </div>
  {n.consequence&&<div className="arena-scenario__consequence" role="status">
   <span className="arena-scenario__consequence-icon"><Sparkles size={24}/></span>
   <div><small>{t('نتيجة قرارك السابق','CONSEQUENCE OF YOUR LAST DECISION')}</small><p>{n.consequence}</p></div>
  </div>}
  <div className="arena-scenario__case">
   <span className="arena-scenario__case-icon"><Compass size={27}/></span>
   <span className="arena-scenario__case-kicker">{finished?t('وصلت لنهاية مسارك','YOU REACHED YOUR ENDING'):t('الموقف اللي قدامك','YOUR CURRENT SITUATION')}</span>
   <h3>{n.text}</h3>
   {finished&&<span className="arena-scenario__ending-seal"><Flag size={22}/>{t('اكتمل مسار القرارات','DECISION PATH COMPLETE')}</span>}
  </div>
  {finished?<div className="arena-scenario__debrief">
    <div className="arena-scenario__debrief-title"><MessageSquareText size={21}/>{t('سؤال للنقاش مع المدرب','DISCUSSION WITH YOUR TRAINER')}</div>
    {n.discussion?<p>{n.discussion}</p>:<p>{t('إيه اللي اتعلمته من تأثير اختياراتك على النتيجة؟','What did your decisions teach you about their consequences?')}</p>}
    <small>{t('استنى المدرب يناقش اختلاف المسارات ويقفل الجولة.','Discuss different paths with your trainer and wait for the round to close.')}</small>
   </div>:
   <div className="arena-scenario__decisions">
    <div className="arena-scenario__decisions-head"><span><Lightbulb size={17}/>{t('دلوقتي دورك تختار','YOUR NEXT MOVE')}</span>
    <small>{t('فكر في العواقب قبل الضغط','Think about the outcome before choosing')}</small></div>
    {closed?<div className="arena-scenario__locked"><LockKeyhole size={19}/>{t('الجولة اتقفلت، والقرارات الجديدة مش متاحة.','The round has closed; no further decisions can be submitted.')}</div>:
    <div className="arena-scenario__choices">{choices.map((c,i)=><button type="button" key={i}
      className="arena-scenario__choice" disabled={!canChoose} onClick={()=>send('decision',{choice:i})}>
      <span className="arena-scenario__choice-index">{String(i+1).padStart(2,'0')}</span>
      <span className="arena-scenario__choice-label">{c.label}</span>
      {ar?<ArrowLeft size={19}/>:<ArrowRight size={19}/>}
     </button>)}</div>}
    {busy&&<p className="arena-scenario__submitting" role="status">{t('بنسجّل قرارك…','Recording your decision…')}</p>}
   </div>}
  {steps.length>0&&<details className="arena-scenario__trail">
   <summary><MapPinned size={18}/>{t('شوف مسارك لحد دلوقتي','REVIEW YOUR JOURNEY')} <span>{steps.length}</span></summary>
   <ol>{steps.map((step,i)=><li key={i}><b>{t('القرار','Decision')} {i+1}</b><span>{step.consequence}</span></li>)}</ol>
  </details>}
  <footer className="arena-scenario__notice"><ShieldCheck size={15}/>
   {t('التقييم والعواقب بيتحسبوا من السيرفر، مش من جهازك.',
     'Outcomes and scoring are confirmed by the server, not your device.')}
  </footer>
 </section>;
}
