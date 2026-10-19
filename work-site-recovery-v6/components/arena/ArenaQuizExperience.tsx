'use client';
import {BarChart3,CheckCircle2,HelpCircle,Hourglass,LockKeyhole,Sparkles,Users,Zap} from 'lucide-react';

/** Quiz-specific presentation. Uses the existing verified Question component.
 * Never computes grades or points here; all outcomes come from the Worker.
 * A correct-answer reveal requires BOTH closed round and server keyRevealed.
 */
export default function ArenaQuizExperience({
 s,ar,host,display,canAnswer,busy,onSubmit,QuestionComponent
}:any){
 const a=s.activity,actor=!!s.mine&&!host&&!display;
 const closed=s.status!=='question';
 const revealed=closed&&!!s.keyRevealed;
 const choices=Array.isArray(a.options)?a.options:[];
 const disclosedIndex=revealed&&Number.isInteger(a.correct)&&a.correct>=0&&a.correct<choices.length?a.correct:null;
 // Defense in depth: even if a future response includes authored answer keys,
 // never hand them to a presentation component before the server reveal flag.
 const visibleQuestion=revealed?a:{...a,correct:undefined,explanation:undefined,
  order:undefined,pairs:undefined,assignments:undefined,regions:undefined};
 const t=(arabic:string,english:string)=>ar?arabic:english;
 const responses=Number.isFinite(Number(s.submitted))?Math.max(0,Number(s.submitted)):0;
 return <section className={'arena-quiz-show '+(actor?'arena-quiz-show--learner':display?'arena-quiz-show--projector':'arena-quiz-show--trainer')}>
  <div className="arena-quiz-show__masthead">
   <span className="arena-quiz-show__identity"><Zap size={19}/>{t('تحدّي المعرفة','KNOWLEDGE CHALLENGE')}</span>
   {(host||display)&&<span className="arena-quiz-show__responses" title={t('عدد الإجابات المستلمة','Received responses')}>
    <Users size={18}/><b>{responses.toLocaleString(ar?'ar-EG':'en-US')}</b>{t('إجابة مستلمة','responses received')}
   </span>}
  </div>
  {actor&&!s.mine?.answered&&!closed&&<div className="arena-quiz-show__tip"><HelpCircle size={17}/>
    {t('اختار إجابتك، وبعدها اضغط تثبيت الإجابة قبل انتهاء الوقت.','Pick an answer, then lock it in before time runs out.')}</div>}
  <div className="arena-quiz-show__question">
   <QuestionComponent key={s.current} a={visibleQuestion} ar={ar} disabled={!canAnswer||busy}
    closed={closed} mine={s.mine} eliminated={s.game?.eliminated||[]}
    tally={revealed?s.tally:null} onSubmit={onSubmit}
    hideSubmit={!actor} hidePrompt={true}/>
  </div>
  {closed&&!revealed&&<div role="status" className="arena-quiz-show__locked">
    <Hourglass size={25}/><div><strong>{t('النتيجة لسه ما اتكشفتش','ANSWER REVEAL PENDING')}</strong>
    <span>{t('استنى المدرب يكشف الإجابة لما تكون جاهزة.','The trainer will reveal the answer when it is ready.')}</span></div>
    <LockKeyhole size={19}/></div>}
  {revealed&&<div className="arena-quiz-show__reveal" role="status">
   <div className="arena-quiz-show__reveal-head"><Sparkles size={22}/>{t('لحظة كشف الإجابة','THE ANSWER REVEAL')}<Sparkles size={22}/></div>
   {disclosedIndex!==null?<div className="arena-quiz-show__winning-answer">
     <CheckCircle2 size={32}/><div><small>{t('الإجابة الصحيحة','CORRECT ANSWER')}</small>
       <strong>{choices[disclosedIndex]}</strong></div></div>:
    <div className="arena-quiz-show__review"><BarChart3 size={24}/>
      {t('راجع النتيجة والتفسير اللي كشفهم النظام أعلى الشاشة.','Review the server-disclosed answer and explanation above.')}
     </div>}
  </div>}
  {actor&&s.mine?.answered&&!closed&&<div className="arena-quiz-show__received">
   <CheckCircle2 size={18}/>{t('إجابتك وصلت للسيرفر. استنى كشف النتيجة.','The server has your answer. Wait for the result.')}
  </div>}
 </section>;
}
