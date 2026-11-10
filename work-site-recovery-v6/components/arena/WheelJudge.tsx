'use client';
import {useEffect,useState} from 'react';
import {Award,MinusCircle,PlusCircle,ShieldCheck,Star} from 'lucide-react';

/** A per-reveal, host-only ten-point practical rubric. Final points are computed
 * and stored by the server, never trusted from the instructor's browser. */
export default function WheelJudge({ar,game,session,activity,busy,onControl,mode='wheel'}:{
 ar:boolean;game:any;session:any;activity:any;busy:boolean;mode?:'wheel'|'box';
 onControl:(action:string,index?:number,extra?:any)=>void}){
 const t=(a:string,e:string)=>ar?a:e;
 const [grade,setGrade]=useState(7);
 const [direction,setDirection]=useState<1|-1>(1);
 const [pending,setPending]=useState(false);
 const [reason,setReason]=useState('');
 const isBox=mode==='box',reveal=isBox?game?.box:game?.spin;
 const sector=isBox?reveal:activity.sectors?.[reveal?.index]; // Box contents intentionally absent from publicActivity; signed reveal is server-owned
 const shown=!!reveal&&(isBox||reveal.revealed)&&['challenge','penalty'].includes(sector?.kind);
 const rated=game?.manualJudgement||null;
 const targetId=isBox?reveal?.target:game?.spinTarget;
 const target=(session.players||[]).find((x:any)=>x.uid===targetId);
 const base=Number(activity.points??1000);
 const weight=Number(activity.weight??1);
 const points=Math.min(10000,Math.round(grade*base*weight/10));
 const delta=direction*points;
 const cleanReason=reason.trim();
 const valid=Number.isInteger(grade)&&grade>=0&&grade<=10&&Number.isFinite(points)
  &&cleanReason.length>=5&&cleanReason.length<=280&&!!reveal?.id&&!!targetId;
 useEffect(()=>{setPending(false);setGrade(7);setDirection(1);setReason('');},[reveal?.id]);
 useEffect(()=>{if(!busy)setPending(false);},[busy,session.revision]);
 if(!shown)return null;
 function submit(){
  if(!valid||busy||pending||rated)return;
  setPending(true);
  onControl(isBox?'boxaward':'wheelaward',undefined,
   {grade,direction,delta,reason:cleanReason,revealId:reveal.id,target:targetId,adjustmentId:crypto.randomUUID()});
 }
 return <section className="wheel-judge arena-practical-rubric"
   aria-label={t('تقييم أداء المتدرب من عشرة','Grade practical performance out of ten')}>
  <header><Award size={24}/><div><strong>{t('تقييم التحدّي من 10','PRACTICAL CHALLENGE · /10')}</strong>
   <small>{t('التقييم يتسجل في النقاط الرسمية ويتضاف أو يتخصم من الرصيد',
    'Signed points are committed to the official server leaderboard')}</small></div></header>
  <p>{t('المتدرب','Learner')}: <b>{target?.name||t('المشارك صاحب الدور','Current player')}</b></p>
  {rated?<div className="arena-rubric-confirmed" role="status">
   <ShieldCheck size={23}/>{t('تم اعتماد التقييم','Grade committed')}:
   <b>{rated.grade===null?'—':rated.grade+'/10'}</b>
   <strong>{rated.delta>0?'+':''}{rated.delta} {t('نقطة','points')}</strong>
   {rated.reason&&<small className="arena-rubric-confirmed__reason">
    {t('سبب التقييم','Recorded reason')}: {rated.reason}
   </small>}</div>:
  <><div className="arena-rubric-grade">
   <label>{t('تقييم الأداء','Performance grade')}
    <input type="range" min={0} max={10} step={1} value={grade} disabled={busy||pending}
     onChange={e=>setGrade(Number(e.target.value))}/></label>
   <strong aria-live="polite">{grade}<small>/10</small></strong>
  </div>
  <div className="wheel-judge__direction" role="group" aria-label={t('إضافة أو خصم','Award or deduct')}>
   <button type="button" disabled={busy||pending} className={direction===1?'chosen':''} aria-pressed={direction===1}
    onClick={()=>setDirection(1)}><PlusCircle size={18}/>{t('مكافأة','Award')}</button>
   <button type="button" disabled={busy||pending} className={direction===-1?'chosen':''} aria-pressed={direction===-1}
    onClick={()=>setDirection(-1)}><MinusCircle size={18}/>{t('خصم','Deduct')}</button>
  </div>
  <p className="arena-rubric-preview"><Star size={18}/>
   {t('التأثير على الرصيد','Leaderboard impact')}: <b>{delta>0?'+':''}{delta} {t('نقطة','points')}</b></p>
  <label className="arena-rubric-reason" htmlFor="arena-wheel-grade-reason">
   {t('سبب التقييم (إجباري، من 5 إلى 280 حرف)','Grade reason (required, 5–280 characters)')}
   <textarea id="arena-wheel-grade-reason" rows={2} minLength={5} maxLength={280}
    value={reason} disabled={busy||pending}
    placeholder={t('مثال: شرح الحل كاملًا مع توضيح خطوات التنفيذ','e.g. Explained all steps and demonstrated the solution')}
    onChange={e=>setReason(e.target.value)}/>
   <small>{cleanReason.length}/280 · {t('يظهر في سجل المدرب فقط','Only the trainer can view the written reason')}</small>
  </label>

  <button type="button" className="btn primary" disabled={busy||pending||!valid}
   onClick={submit}><ShieldCheck size={18}/>{t('اعتماد الدرجة','Commit grade')}</button>
  {pending&&<small role="status">{t('جاري التحقق من تسجيل الدرجة على السيرفر...',
    'Verifying the server receipt...')}</small>}
  </>}
 </section>;
}
