'use client';
import {CheckCircle2,Crown,Medal,Star,Users,Zap} from 'lucide-react';

export function personalResult(s:any){
 const uid=s?.mine?.id;
 if(!uid)return null;
 const rows=Array.isArray(s?.individual)?s.individual:[];
 const mine=rows.find((row:any)=>row.uid===uid);
 // Scores/ranks are server-owned. Never invent zeros or a guessed rank.
 if(!mine||!Number.isFinite(Number(mine.score)))return null;
 const score=Number(mine.score);
 const rank=Number(mine.rank);
 const approved=(s?.players||[]).filter((p:any)=>p.approval==='approved').length;
 const rankedCount=rows.filter((row:any)=>Number.isFinite(Number(row.rank))).length;
 return {
  name:String(mine.name||s.mine.name||'').slice(0,70),
  score,rank:Number.isFinite(rank)&&rank>0?rank:null,
  participants:rankedCount||approved,teamName:mine.team||s.mine.team||null,
  isWinner:rank===1&&score>0
 };
}
/** Final card for the joined player only. No per-player details on projector. */
export default function TraineeFinalResult({s,ar}:{s:any;ar:boolean}){
 const t=(a:string,e:string)=>ar?a:e;
 const result=personalResult(s);
 if(!result)return <section className="trainee-final-result trainee-final-result--pending" role="status">
   <Star size={30}/>
   <h3>{t('شكرًا لمشاركتك!','Thanks for taking part!')}</h3>
   <p>{t('النتيجة الشخصية مش متاحة دلوقتي؛ ترتيب الأبطال العام ظاهر فوق.','Your personal result is not available yet. You can still see the overall leaderboard.')}</p>
  </section>;
 return <section className="trainee-final-result" aria-label={t('نتيجتك الشخصية','Your personal result')}>
  <div className="trainee-final-result__heading"><Star size={19}/>{t('دي رحلتك في الأرينا','YOUR ARENA JOURNEY')}<Star size={19}/></div>
  <div className="trainee-final-result__identity"><span className="trainee-final-result__avatar">{result.name.charAt(0)}</span><div><small>{t('أداء المشارك','PARTICIPANT PERFORMANCE')}</small><h3>{result.name}</h3></div></div>
  <div className="trainee-final-result__stats">
   <div><Zap size={22}/><strong dir="ltr">{result.score.toLocaleString(ar?'ar-EG':'en-US')}</strong><span>{t('نقطة','POINTS')}</span></div>
   <div><Medal size={22}/><strong dir="ltr">{result.rank===null?'—':result.rank.toLocaleString(ar?'ar-EG':'en-US')}</strong><span>{t('المركز','RANK')}</span></div>
   <div><Users size={22}/><strong dir="ltr">{result.participants.toLocaleString(ar?'ar-EG':'en-US')}</strong><span>{t('مشارك في الترتيب','RANKED PARTICIPANTS')}</span></div>
  </div>
  <div className="trainee-final-result__message">{result.isWinner?
   <><Crown size={18}/>{t('مبروك! أنت في المركز الأول','Congratulations! You finished in first place!')}</>:
   <><CheckCircle2 size={18}/>{t('كل تجربة بتضيف لمهاراتك. شكرًا على مشاركتك!','Every challenge builds your skills. Thanks for joining!')}</>}
  </div>
 </section>;
}
