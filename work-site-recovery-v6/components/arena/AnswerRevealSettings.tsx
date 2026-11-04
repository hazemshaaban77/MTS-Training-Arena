'use client';
import {useState} from 'react';
import type {Activity} from '../../lib/catalog';
import ArenaAnswerReveal from './ArenaAnswerReveal';
import './AnswerRevealSettings.css';

const DELAYS=[0,2,3,5];
const FX=['light','standard','cinematic'] as const;
const supported=(a:Activity)=>!['Meta Plan','Categorize','Scenario Challenge','Escape Room','Wheel of Fortune','Spin Wheel','Open the Box','Flashcards'].includes(a.type)&&a.showFormat!=='championship';

export default function AnswerRevealSettings({ar,activity,onChange}:{ar:boolean;activity:Activity;onChange:(patch:Record<string,unknown>)=>void}){
 const [showPreview,setShowPreview]=useState(false);
 const t=(arText:string,enText:string)=>ar?arText:enText;
 if(!supported(activity))return <p className="answer-reveal-info">{t('النشاط ده ليه طريقة كشف خاصة باللعبة وبيتحكم فيها السيرفر، علشان ما نكسرش آلية العرض أو النقاط.','This game has a dedicated, server-controlled reveal flow. Its answer settings are not overridden.')}</p>;
 const mode=activity.revealMode==='manual'||activity.revealMode==='auto'?activity.revealMode:'inherit';
 const delay=DELAYS.includes(activity.revealDelay)?activity.revealDelay:0;
 const fx=FX.includes(activity.revealFx)?activity.revealFx:'cinematic';
 const preview=()=>{setShowPreview(false);requestAnimationFrame(()=>setShowPreview(true));};
 return <section className="answer-reveal-settings" aria-label={t('إعدادات لحظة كشف الإجابة','Answer reveal settings')}>
  <div className="answer-reveal-settings__heading"><strong>{t('لحظة كشف الإجابة','Answer Reveal Moment')}</strong><span>ARENA · REVEAL FX</span></div>
  <p>{t('حدد توقيت الكشف للنشاط ده، مش للجلسة كلها. السيرفر هو اللي يصرّح بظهور الإجابة.','Choose when this activity reveals its answer. Only the server authorizes the answer.')}</p>
  <div className="answer-reveal-settings__grid">
   <label>{t('طريقة الكشف','Reveal method')}
    <select aria-label={t('طريقة كشف الإجابة','Answer reveal method')} value={mode}
     onChange={e=>onChange({revealMode:e.target.value==='inherit'?undefined:e.target.value})}>
     <option value="inherit">{t('إعداد الجلسة الافتراضي','Use session default')}</option>
     <option value="manual">{t('بقرار المدرب','Trainer-controlled')}</option>
     <option value="auto">{t('تلقائي بعد غلق السؤال','Automatic after closing')}</option>
    </select>
   </label>
   <label>{t('تأخير الكشف التلقائي','Auto reveal delay')}
    <select aria-label={t('تأخير الكشف بالثواني','Reveal delay in seconds')} disabled={mode==='manual'}
     value={delay} onChange={e=>onChange({revealDelay:Number(e.target.value)})}>
     {DELAYS.map(n=><option value={n} key={n}>{n} {t('ثواني','seconds')}</option>)}
    </select>
   </label>
   <label>{t('قوة المؤثرات','Lighting & animation')}
    <select aria-label={t('مستوى مؤثرات الكشف','Reveal visual effects level')} value={fx}
     onChange={e=>onChange({revealFx:e.target.value})}>
     <option value="light">{t('خفيف','Light')}</option>
     <option value="standard">{t('قياسي','Standard')}</option>
     <option value="cinematic">{t('سينمائي قوي','Cinematic')}</option>
    </select>
   </label>
   <label className="answer-reveal-settings__checkbox"><input type="checkbox" checked={activity.revealSound===true}
     onChange={e=>onChange({revealSound:e.target.checked})}/>
    <span>{t('صوت الكشف (يتطلب تشغيل الصوت من الجهاز)','Reveal audio (requires sound enabled on the device)')}</span>
   </label>
  </div>
  <div className="answer-reveal-settings__footer">
   <small>{mode==='manual'?t('الإجابة تفضل مخفية لحد ما المدرب يضغط كشف.','The answer stays hidden until the trainer reveals it.'):t('التوقيت محسوب على السيرفر، وكل الشاشات تشوف نفس الحالة.','The server schedules the reveal; screens share the same state.')}</small>
   <button type="button" className="btn secondary" onClick={preview}>{t('جرّب مؤثرات الكشف','Preview reveal FX')}</button>
  </div>
  {showPreview&&<ArenaAnswerReveal key={fx+'-preview'} ar={ar} fx={fx} preview onComplete={()=>setShowPreview(false)}/>}
 </section>;
}
