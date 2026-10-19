'use client';
import {Award,CheckCircle2,Medal,Sparkles,Target,Users} from 'lucide-react';

/** View-only participant wrap-up. It reads the authoritative server board;
 * it does not compute scores/ranks and is never shown to projector/host.
 */
export default function TraineeFinalSummary({s,ar}:{s:any;ar:boolean}){
 const t=(a:string,e:string)=>ar?a:e;
 const id=s?.mine?.id;
 if(!id)return null;
 const individual=Array.isArray(s.individual)?s.individual:[];
 const me=individual.find((row:any)=>row.uid===id||row.id===id);
 const participants=individual.length;
 const score=me&&Number.isFinite(Number(me.score))?Number(me.score):null;
 const rank=me&&Number.isFinite(Number(me.rank))&&Number(me.rank)>0?Number(me.rank):null;
 const rankTies=rank?individual.filter((row:any)=>Number(row.rank)===rank).length:0;
 return <section className="trainee-final-summary" aria-label={t('نتيجتك الشخصية','Your personal result')}>
  <div className="trainee-final-summary__header">
   <span className="eyebrow"><Sparkles size={16}/>{t('رحلتك في الأرينا','YOUR ARENA JOURNEY')}</span>
   <h3>{t('مبروك إنك كمّلت التحدّي!','You finished the challenge!')}</h3>
   <p>{t('شكرًا لمشاركتك، دي نتيجتك المعتمدة من الجلسة.','Thanks for taking part. Here is your result from the session.')}</p>
  </div>
  <div className="trainee-final-summary__identity"><CheckCircle2 size={18}/><b>{s.mine.name}</b></div>
  <div className="trainee-final-summary__metrics">
   <div className="trainee-final-summary__metric">
    <Target size={22}/>
    <span>{t('نقاطك','Your points')}</span>
    <strong dir="ltr">{score===null?'—':score.toLocaleString(ar?'ar-EG':'en-US')}</strong>
   </div>
   <div className="trainee-final-summary__metric">
    <Medal size={22}/>
    <span>{t('مركزك','Your rank')}</span>
    <strong dir="ltr">{rank===null?'—':'#'+rank.toLocaleString(ar?'ar-EG':'en-US')}</strong>
   </div>
   <div className="trainee-final-summary__metric">
    <Users size={22}/>
    <span>{t('عدد المشاركين في الترتيب','Ranked participants')}</span>
    <strong dir="ltr">{participants.toLocaleString(ar?'ar-EG':'en-US')}</strong>
   </div>
  </div>
  {rankTies>1&&<p className="trainee-final-summary__tie"><Award size={16}/>
   {t('مركز مشترك مع ','Shared rank with ')}{(rankTies-1).toLocaleString(ar?'ar-EG':'en-US')}{t(' مشارك آخر',' other participant(s)')}
  </p>}
  {(!me||score===null||rank===null)&&<p className="trainee-final-summary__note">
   {t('مفيش ترتيب نهائي متاح لك في بيانات الجلسة الحالية. مش هنظهر نقاطًا أو مركزًا تخمينيًا.',
      'A personal final ranking is not available in this session. No estimated rank or points are displayed.')}
  </p>}
  <p className="trainee-final-summary__closing">{t('النتيجة مهمة، والأهم إنك شاركت واتعلّمت. نشوفك في تحدّي جديد!',
    'The score matters, but your participation and learning matter more. See you in the next challenge!')}</p>
 </section>;
}
