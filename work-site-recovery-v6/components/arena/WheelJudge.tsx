'use client';
import {useEffect,useState} from 'react';
import {Award,MinusCircle,PlusCircle,ShieldCheck} from 'lucide-react';
/** Host-only console. Never updates score on the client: Worker records
 * authenticated, one-use event with an audit reason and session revision. */
export default function WheelJudge({ar,game,session,activity,busy,onControl}:{
 ar:boolean;game:any;session:any;activity:any;busy:boolean;
 onControl:(action:string,index?:number,extra?:any)=>void}){
 const t=(a:string,e:string)=>ar?a:e;
 const [points,setPoints]=useState(100),[direction,setDirection]=useState<1|-1>(1),[reason,setReason]=useState('');
 const [pending,setPending]=useState(false);
 const spin=game?.spin,sector=spin?.revealed?activity.sectors?.[spin.index]:null;
 const target=(session.players||[]).find((x:any)=>x.uid===game?.spinTarget);
 useEffect(()=>{setPending(false);setReason('');},[spin?.id]);
 if(!sector||sector.kind!=='challenge')return null;
 const value=direction*points,valid=Number.isInteger(points)&&points>=1&&points<=10000&&reason.trim().length>=5;
 const submit=()=>{
  if(!valid||busy)return;
  setPending(true);
  onControl('wheelaward',undefined,{delta:value,reason:reason.trim(),adjustmentId:crypto.randomUUID()});
  setReason('');
 };
 return <section className="wheel-judge" aria-label={t('تقييم أداء المتدرب في التحدي العملي','Judge the practical challenge')}>
  <header><Award size={20}/>
   <div><strong>{t('تقييم التحدّي العملي','PRACTICAL CHALLENGE SCORING')}</strong>
    <small>{t('السيرفر بيحفظ النقاط والسبب في سجل الجلسة','The server stores score and audit reason')}</small></div>
  </header>
  <p>{t('المتدرب','Learner')}: <b>{target?.name||t('المشارك صاحب الدور','Current player')}</b>
   {' · '}{sector.label}</p>
  <div className="wheel-judge__controls">
   <div className="wheel-judge__direction" role="group" aria-label={t('نوع التقييم','Score direction')}>
    <button type="button" className={direction===1?'chosen':''} aria-pressed={direction===1}
     onClick={()=>setDirection(1)}><PlusCircle size={17}/>{t('إضافة','Award')}</button>
    <button type="button" className={direction===-1?'chosen':''} aria-pressed={direction===-1}
     onClick={()=>setDirection(-1)}><MinusCircle size={17}/>{t('خصم','Deduct')}</button>
   </div>
   <label>{t('عدد النقاط','Points')}<input type="number" min={1} max={10000} step={50}
    value={points} onChange={e=>setPoints(Number(e.target.value))}/></label>
   <label>{t('سبب التقييم (إجباري)','Reason (required)')}
    <input type="text" maxLength={280} minLength={5} value={reason}
     placeholder={t('مثال: أنهى المهمة بدقة','e.g. Completed the task accurately')}
     onChange={e=>setReason(e.target.value)}/></label>
  </div>
  <button type="button" className="btn primary" disabled={busy||!valid}
   onClick={submit}><ShieldCheck size={17}/>
   {t('اعتماد ','Submit ')}{value>0?'+':''}{value} {t('نقطة','points')}</button>
  {pending&&<small role="status">{t('راجع لوحة النقاط للتأكد من تسجيل التقييم على السيرفر.',
   'Check the server leaderboard to verify the judgment was recorded.')}</small>}
 </section>;
}
