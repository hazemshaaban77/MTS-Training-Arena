'use client';
import {useState} from 'react';
import {Crown,RotateCcw,Sparkles,Trophy,Users} from 'lucide-react';

type Champion={name:string;score:number;rank:number};
export function championsFromSession(s:any,ar:boolean):Champion[]{
 const teams=Array.isArray(s?.teams)?s.teams:[];
 const individual=Array.isArray(s?.individual)?s.individual:[];
 const rows=s?.teamMode&&teams.length?teams:individual;
 const valid=rows.filter((r:any)=>Number(r?.rank)===1&&Number.isFinite(Number(r?.score))&&Number(r.score)>0);
 return valid.slice(0,6).map((r:any)=>({
  name:String(r.name||r.team||'').slice(0,65)|| (ar?'البطل':'Champion'),
  score:Number(r.score),rank:Number(r.rank)
 }));
}
export default function ArenaVictory({s,ar}:{s:any;ar:boolean}){
 const [show,setShow]=useState(0);
 const t=(a:string,e:string)=>ar?a:e;
 const top=championsFromSession(s,ar);
 const singular=top.length===1;
 const champions=top.map(w=>w.name);
 const plural=top.length>1;
 return <div key={show} className="arena-victory" aria-label={t('احتفال تتويج الأبطال','Champions victory ceremony')}>
  <div className="arena-victory__backdrop" aria-hidden="true">
   <span className="arena-victory__spotlight arena-victory__spotlight--one"/>
   <span className="arena-victory__spotlight arena-victory__spotlight--two"/>
   <span className="arena-victory__spotlight arena-victory__spotlight--three"/>
   <span className="arena-victory__halo"/>
   <span className="arena-victory__ground"/>
   {Array.from({length:5},(_,i)=><div key={'fire-'+i} className={'arena-victory__firework arena-victory__firework--'+i}>
    {Array.from({length:14},(_,j)=><i key={j} style={{'--ray':j,'--spark-delay':(j%5)*.025+'s'} as React.CSSProperties}/>)}
   </div>)}
   <div className="arena-victory__confetti">{Array.from({length:88},(_,i)=><i key={i}
    style={{'--piece':i,'--pos':((i*47)%97+2)+'%','--delay':((i*13)%26)*.085+'s','--drift':((i*19)%200-100)+'px',
      '--size':(5+i%5)+'px','--confetti-hue':[44,169,195,222,284][i%5]} as React.CSSProperties}/>)}</div>
  </div>
  <div className="arena-victory__content">
   <span className="arena-victory__eyebrow"><Sparkles size={19}/>{t('لحظة مجد في ساحة التدريب','THE ARENA VICTORY MOMENT')}<Sparkles size={19}/></span>
   <div className="arena-victory__trophy" aria-hidden="true">
    <div className="arena-victory__orbit arena-victory__orbit--first"/>
    <div className="arena-victory__orbit arena-victory__orbit--second"/>
    <div className="arena-victory__trophy-body"><Trophy strokeWidth={1.3}/><Crown className="arena-victory__crown" strokeWidth={1.7}/></div>
    <span className="arena-victory__star arena-victory__star--one">✦</span>
    <span className="arena-victory__star arena-victory__star--two">✦</span>
    <span className="arena-victory__star arena-victory__star--three">✦</span>
   </div>
   <div className="arena-victory__headline">
    <span className="arena-victory__headline-top">{t('هذا هو وقت الأبطال','IT IS TIME FOR')}</span>
    <h2>{t('لحظة التتويج!','THE CHAMPIONS!')}</h2>
    <div className="arena-victory__ribbon"><i/>{t('انتهى التحدّي… وبدأ المجد','THE CHALLENGE ENDS. LEGENDS BEGIN.')}<i/></div>
   </div>
   {top.length>0?<div className="arena-victory__winner" aria-label={t('الأبطال أصحاب المركز الأول','First place winners')}>
    <span className="arena-victory__winner-title"><Crown size={18}/>{plural?t('أبطال المركز الأول','JOINT CHAMPIONS'):t('المركز الأول','FIRST PLACE')}</span>
    <strong>{champions.join(' · ')}</strong>
    {singular&&<small>{top[0].score.toLocaleString(ar?'ar-EG':'en-US')} {t('نقطة','POINTS')}</small>}
    {plural&&<small>{t('تعادل مشرف في الصدارة','A glorious tie for first place')}</small>}
   </div>:<div className="arena-victory__winner arena-victory__winner--collective">
    <span className="arena-victory__winner-title"><Users size={18}/>{t('كل المشاركين أبطال','EVERY PARTICIPANT COUNTS')}</span>
    <strong>{t('كل مشاركة تستحق الاحتفال!','EVERY VOICE DESERVES THE SPOTLIGHT!')}</strong>
   </div>}
   <div className="arena-victory__divider"><span>✦</span><span>✦</span><span>✦</span></div>
   <button type="button" className="arena-victory__replay" onClick={()=>setShow(v=>v+1)}>
    <RotateCcw size={17}/>{t('إعادة لحظة التتويج','Replay victory moment')}
   </button>
  </div>
 </div>;
}
