'use client';
import {useEffect,useState} from 'react';
import {ArrowDown,ArrowUp,Check,Copy,Plus,ShieldCheck,Trash2,X} from 'lucide-react';
import type {Activity} from '../../lib/catalog';
import {sample} from '../../lib/catalog';
import {validateActivity} from '../../lib/domain.mjs';

type Props={ar:boolean;activity:Activity;onCancel:()=>void;onSave:(a:Activity)=>void};
const prizes=[100,250,500,1000,2000,3000,5000,7500,10000,10000];
function initialQuestions(a:Activity):Activity[]{
 if(Array.isArray(a.questions)&&a.questions.length)return a.questions.map(q=>({...q,questions:undefined}));
 return [{...a,questions:undefined,mainType:undefined}];
}
export default function QuestionStudio({ar,activity,onCancel,onSave}:Props){
 const t=(a:string,e:string)=>ar?a:e;
 const game=activity.type==='Ultimate Game Show';
 const [mode,setMode]=useState<'ladder'|'classic'>(game&&activity.showFormat==='ladder'?'ladder':'classic');
 const [questions,setQuestions]=useState<Activity[]>(()=>initialQuestions(activity));
 const [active,setActive]=useState(0);
 const [title,setTitle]=useState(activity.prompt);
 const [error,setError]=useState('');
 const [showRules,setShowRules]=useState(false);
 const index=Math.min(active,Math.max(0,questions.length-1)),q=questions[index];
 const patch=(changes:Record<string,unknown>)=>{
  setQuestions(prev=>prev.map((item,i)=>i===index?{...item,...changes}:item));setError('');
 };
 const makeQuestion=(number:number):Activity=>({...sample('Quiz',ar?'ar':'en'),
  prompt:'',options:['','','',''],correct:0,timer:game?30:30,
  points:game?prizes[Math.min(number,prizes.length-1)]:1000,
  speed:!game,section:game?t('المستوى ','Level ')+(number+1):''});
 function add(){setQuestions(old=>[...old,makeQuestion(old.length)]);setActive(questions.length);setError('');}
 function duplicate(){if(!q)return;setQuestions(old=>[...old.slice(0,index+1),structuredClone(q),...old.slice(index+1)]);setActive(index+1);setError('');}
 function move(delta:number){const to=index+delta;if(to<0||to>=questions.length)return;const next=[...questions];[next[index],next[to]]=[next[to],next[index]];setQuestions(next);setActive(to);}
 function remove(){if(questions.length===1){setError(t('لازم تسيب سؤال واحد على الأقل.','At least one question is required.'));return;}
  setQuestions(old=>old.filter((_,i)=>i!==index));setActive(Math.max(0,index-1));}
 function chooseMode(value:'ladder'|'classic'){
  if(value==='ladder'&&mode!=='ladder'){
   const next=questions.map((x,i)=>({...x,points:prizes[Math.min(i,prizes.length-1)],speed:false,
    timer:x.timer||30,participation:'individual',betEnabled:false,
    section:t('المستوى ','Level ')+(i+1)}));
   setQuestions(next);
  }
  setMode(value);setError('');
 }
 function save(){
  try{
   const copy=questions.map((x,i)=>{
    const clean={...x,questions:undefined,mainType:undefined,type:x.type||'Quiz',
     prompt:x.prompt?.trim()||'',options:(x.options||[]).map((v:string)=>v.trim()),
     correct:x.correct,timer:Number(x.timer),
     points:Number(x.points??1000),speed:mode==='ladder'?false:x.speed,
     section:mode==='ladder'?t('المستوى ','Level ')+(i+1):x.section};
    if(mode==='ladder'&&game)return {...clean,showFormat:'ladder',showRound:i+1,
     showTotal:questions.length,showLadder:questions.map(x=>Number(x.points||0)),
     participation:'individual',betEnabled:false,wrongPenalty:0};
    const {showFormat,showRound,showTotal,showLadder,...standard}=clean;
    return standard;
   });
   for(let i=0;i<copy.length;i++){try{validateActivity(structuredClone(copy[i]));}
    catch{setActive(i);setError(t('راجع السؤال '+(i+1)+': لازم تكتب السؤال و2–4 اختيارات غير فاضية وتحدد الإجابة الصحيحة.',
    'Check question '+(i+1)+': provide a prompt, 2–4 nonempty choices and the correct answer.'));return;}}
   const final={...activity,prompt:title.trim()||copy[0].prompt,questions:copy,
    showFormat:game&&mode==='ladder'?'ladder':undefined,
    participation:game&&mode==='ladder'?'individual':activity.participation,
    betEnabled:game&&mode==='ladder'?false:activity.betEnabled};
   validateActivity(structuredClone(final));
   onSave(final);
  }catch{setError(t('في مشكلة في إعدادات المسابقة. راجع الأسئلة والتوقيت.','Check the competition questions and timers.'));}
 }
 if(!q)return null;
 const options=q.options||['','','',''];
 return <div className="editor-backdrop">
 <section className="activity-editor modal question-studio" role="dialog" aria-modal="true"
  aria-label={game?t('استوديو برنامج المسابقات','Competition studio'):t('استوديو أسئلة الكويز','Quiz question studio')}>
  <header className="modal-header question-studio__header">
   <div><span className="eyebrow">{game?'COMPETITION CONTROL ROOM':'QUESTION STUDIO'}</span>
    <h2>{game?t('صمّم برنامج مسابقات حقيقي','Build your competition'):t('أسئلة واضحة، خطوة بخطوة','Build your knowledge quiz')}</h2>
    <p>{t('اختار السؤال من القائمة، وعدّل كل تفاصيله هنا.','Select a question, then edit everything in one place.')}</p>
   </div><button className="icon-button" onClick={onCancel} aria-label={t('إغلاق','Close')}><X/></button>
  </header>
  <div className="question-studio__body">
   <aside className="question-studio__list" aria-label={t('قائمة الأسئلة','Question list')}>
    <div className="question-studio__list-head"><b>{t('الأسئلة','Questions')} ({questions.length})</b>
     <button type="button" className="btn primary" onClick={add}><Plus size={16}/>{t('سؤال جديد','New')}</button></div>
    {questions.map((item,i)=><button type="button" key={i}
      className={'question-studio__item '+(index===i?'selected':'')}
      aria-current={index===i?'step':undefined} onClick={()=>{setActive(i);setError('');}}>
     <strong>{game&&mode==='ladder'?t('المستوى','Level')+' '+(i+1):t('سؤال','Question')+' '+(i+1)}</strong>
     <span>{item.prompt||t('سؤال جديد — اضغط واكتب','Untitled — tap to edit')}</span>
     <small>{game&&mode==='ladder'?(item.points||0).toLocaleString()+' '+t('نقطة','points'):(item.timer||30)+'s'}</small>
    </button>)}
   </aside>
   <div className="question-studio__form">
    <label className="question-studio__title">{t('عنوان النشاط','Activity title')}
     <input maxLength={2000} value={title} onChange={e=>setTitle(e.target.value)}/></label>
    {game&&<div className="question-studio__rules">
     <h3>{t('نظام المسابقة','Competition format')}</h3>
     <div className="question-studio__mode">
      <button type="button" className={mode==='ladder'?'chosen':''} aria-pressed={mode==='ladder'} onClick={()=>chooseMode('ladder')}>
       {t('سلّم الجوائز · خروج عند الخطأ','Prize ladder · knockout')}</button>
      <button type="button" className={mode==='classic'?'chosen':''} aria-pressed={mode==='classic'} onClick={()=>chooseMode('classic')}>
       {t('جولات حرة · نفس النظام السابق','Open rounds · legacy rules')}</button>
     </div>
     {mode==='ladder'&&<p>{t('متسابق واحد على المسرح؛ كل سؤال مستوى أعلى وجائزة متصاعدة. الخاطئ يخرج من المنافسة، والصحيح يستكمل. وسائل المساعدة تُستخدم مرة واحدة في المسابقة. السيرفر هو الحكم.',
       'One contestant, rising prize levels, wrong answer eliminates that contestant, correct answer advances them. Lifelines are single-use across this competition, enforced by the server.')}</p>}
    </div>}
    <div className="question-studio__question-head">
     <h3>{game&&mode==='ladder'?t('المستوى','Level')+' '+(index+1):t('السؤال','Question')+' '+(index+1)}</h3>
     <div className="question-studio__question-actions">
      <button type="button" title={t('انسخ السؤال','Duplicate')} aria-label={t('انسخ السؤال','Duplicate')} onClick={duplicate}><Copy size={17}/></button>
      <button type="button" title={t('حرك لأعلى','Move up')} aria-label={t('حرك لأعلى','Move up')} disabled={index===0} onClick={()=>move(-1)}><ArrowUp size={17}/></button>
      <button type="button" title={t('حرك لأسفل','Move down')} aria-label={t('حرك لأسفل','Move down')} disabled={index===questions.length-1} onClick={()=>move(1)}><ArrowDown size={17}/></button>
      <button type="button" title={t('احذف السؤال','Delete')} aria-label={t('احذف السؤال','Delete')} disabled={questions.length===1} onClick={remove}><Trash2 size={17}/></button>
     </div>
    </div>
    <label>{t('اكتب نص السؤال','Question text')}
     <textarea rows={3} maxLength={2000} placeholder={t('السؤال اللي هيظهر للمتدرب…','What the learner will see…')}
      value={q.prompt} onChange={e=>patch({prompt:e.target.value})}/></label>
    <fieldset className="question-studio__options">
     <legend>{t('الاختيارات — اضغط الدائرة جنب الإجابة الصحيحة','Answers — select the correct answer')}</legend>
     {options.map((choice:string,i:number)=><div className={'question-studio__option '+(q.correct===i?'correct':'')} key={i}>
      <label className="question-studio__radio"><input type="radio" name="studio-correct-answer"
       checked={q.correct===i} onChange={()=>patch({correct:i})}
       aria-label={t('الإجابة الصحيحة: اختيار ','Correct answer: option ')+(i+1)}/><span>{i+1}</span></label>
      <input value={choice} maxLength={500} placeholder={t('الاختيار ','Option ')+(i+1)}
       onChange={e=>patch({options:options.map((v:string,j:number)=>i===j?e.target.value:v)})}/>
      {options.length>2&&<button type="button" className="question-studio__remove-option" aria-label={t('احذف الاختيار','Remove option')}
       onClick={()=>patch({options:options.filter((_:string,j:number)=>j!==i),correct:q.correct===i?0:(q.correct>i?q.correct-1:q.correct)})}><X size={17}/></button>}
     </div>)}
     {options.length<4&&<button type="button" className="btn secondary" onClick={()=>patch({options:[...options,'']})}><Plus size={15}/>{t('أضف اختيار','Add option')}</button>}
    </fieldset>
    <div className="question-studio__fields">
     <label>{t('زمن الإجابة بالثواني','Time limit (seconds)')}
      <input type="number" min={5} max={3600} value={q.timer} onChange={e=>patch({timer:Number(e.target.value)})}/></label>
     <label>{game&&mode==='ladder'?t('جائزة المستوى بالنقاط','Prize for this level'):t('نقاط السؤال','Question points')}
      <input type="number" min={0} max={10000} value={q.points??1000} onChange={e=>patch({points:Number(e.target.value)})}/></label>
    </div>
    {game&&mode==='ladder'&&<p className="question-studio__hint"><ShieldCheck size={18}/>{t('الجائزة تُحتسب فقط عند الإجابة الصحيحة. الإجابة الخاطئة تمنع هذا المتسابق من المستويات التالية.',
      'The server awards this level only for a correct answer and blocks an eliminated contestant from later levels.')}</p>}
    {error&&<p className="error-banner" role="alert">{error}</p>}
   </div>
  </div>
  <footer className="modal-footer question-studio__footer">
   <span>{index+1}/{questions.length} · {t('بتعدّل السؤال المختار','Editing selected question')}</span>
   <div><button type="button" className="btn secondary" onClick={onCancel}>{t('إلغاء','Cancel')}</button>
    <button type="button" className="btn primary" onClick={save}><Check size={18}/>{t('احفظ الأسئلة والمسابقـة','Save questions & competition')}</button></div>
  </footer>
 </section></div>;
}
