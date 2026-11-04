'use client';
import {useEffect} from 'react';
import {Sparkles,Zap} from 'lucide-react';
import './ArenaAnswerReveal.css';

export default function ArenaAnswerReveal({ar,fx='cinematic',preview=false,onComplete}:{
 ar:boolean;fx?:'light'|'standard'|'cinematic';preview?:boolean;onComplete?:()=>void
}){
 useEffect(()=>{
  const id=setTimeout(()=>onComplete?.(),fx==='light'?1550:fx==='standard'?2100:2800);
  return()=>clearTimeout(id);
 },[fx,onComplete]);
 return <div className={'arena-answer-reveal fx-'+fx} role="status" aria-live="polite" aria-atomic="true"
  aria-label={ar?'تم كشف الإجابة الصحيحة':'The correct answer is revealed'}>
  <div className="arena-answer-reveal__shade" aria-hidden="true"/>
  <div className="arena-answer-reveal__beam beam-left" aria-hidden="true"/>
  <div className="arena-answer-reveal__beam beam-right" aria-hidden="true"/>
  <div className="arena-answer-reveal__rings" aria-hidden="true"/>
  <div className="arena-answer-reveal__burst" aria-hidden="true"/>
  <div className="arena-answer-reveal__headline">
   <div className="arena-answer-reveal__icon"><Sparkles/><Zap size={15}/></div>
   <small>{ar?'MTS TRAINING ARENA · لحظة الحسم':'MTS TRAINING ARENA · THE DECISIVE MOMENT'}</small>
   <strong>{ar?'الإجابة الصحيحة!':'THE BIG REVEAL!'}</strong>
   {preview&&<span>{ar?'معاينة المؤثرات فقط — بدون إجابة أو نقاط':'Effects preview only — no answers or points'}</span>}
  </div>
 </div>;
}
