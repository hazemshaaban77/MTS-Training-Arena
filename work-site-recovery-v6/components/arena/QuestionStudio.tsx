'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowDown,ArrowUp,Check,Copy,Plus,ShieldCheck,Trash2,X} from 'lucide-react';
import QuestionTypeFields from './QuestionTypeFields';
import QuestionMediaPicker,{type QuestionMedia} from './QuestionMediaPicker';
import {changeKnowledgeQuestionType,isKnowledgeQuestionType,knowledgeQuestionTypes,newKnowledgeQuestion,normalizeKnowledgeQuestion,questionTypeLabel,type KnowledgeQuestionType} from '../../lib/question-authoring';
import type {Activity} from '../../lib/catalog';
import {sample} from '../../lib/catalog';
import {validateActivity} from '../../lib/domain.mjs';
import {api} from '../../lib/client';

type Props={ar:boolean;activity:Activity;onCancel:()=>void;onSave:(a:Activity)=>void};
const prizes=[100,250,500,1000,2000,3000,5000,7500,9000,10000];
function initialQuestions(a:Activity):Activity[]{
 if(Array.isArray(a.questions)&&a.questions.length)return a.questions.map(q=>({...q,type:q.type==='Ultimate Game Show'?'Quiz':q.type,questions:undefined}));
 if(a.type==='Ultimate Game Show'&&!a.questions?.length){
  const values=[100,250,500,1000,2000,3000,5000];
  return values.map((points,i)=>({
   ...a,type:'Quiz',showFormat:undefined,questions:undefined,mainType:undefined,
   prompt:(a.prompt||'Championship question')+' · '+(i+1),
   options:Array.isArray(a.options)&&a.options.length===4?[...a.options]:['A','B','C','D'],
   correct:Number.isInteger(a.correct)?a.correct:0,
   section:'Level '+(i+1),speed:false,points,timer:30
  }));
 }

 return [{...a,type:a.type==='Ultimate Game Show'?'Quiz':a.type,questions:undefined,mainType:undefined}];
}
export default function QuestionStudio({ar,activity,onCancel,onSave}:Props){
 const t=(a:string,e:string)=>ar?a:e;
 const game=activity.type==='Ultimate Game Show';
 const [mode,setMode]=useState<'ladder'|'classic'>(game&&(activity.showFormat==='championship'||!activity.questions?.length)?'ladder':'classic');
 const [questions,setQuestions]=useState<Activity[]>(()=>initialQuestions(activity));
 const [active,setActive]=useState(0);
 const [nextType,setNextType]=useState<KnowledgeQuestionType>('Quiz');
 const [safety,setSafety]=useState<number[]>(()=>Array.isArray(activity.safeLevels)?activity.safeLevels:[3]);
 const [title,setTitle]=useState(activity.prompt);
 const [error,setError]=useState('');
 const [ladderAvailable,setLadderAvailable]=useState(false);
 const [bank,setBank]=useState<any[]>([]),formRef=useRef<HTMLDivElement|null>(null);
 useEffect(()=>{api('drafts?kind=question').then((r:any)=>setBank(Array.isArray(r?.items)?r.items:[])).catch(()=>{});},[]);
 useEffect(()=>{formRef.current?.scrollTo({top:0});},[active]);
 useEffect(()=>{let active=true;api('branding').then((value:any)=>{if(active)setLadderAvailable(value?.showRulesVersion===2);}).catch(()=>{if(active)setLadderAvailable(false);});return()=>{active=false;};},[]);
 const index=Math.min(active,Math.max(0,questions.length-1)),q=questions[index];
 const patch=(changes:Record<string,unknown>)=>{
  setQuestions(prev=>prev.map((item,i)=>i===index?{...item,...changes}:item));setError('');
 };
 const makeQuestion=(number:number,type:KnowledgeQuestionType='Quiz'):Activity=>{
  const q=newKnowledgeQuestion(game&&mode==='ladder'?'Quiz':type,ar,number);
  return {...q,timer:30,points:game?prizes[Math.min(number,prizes.length-1)]:1000,
   speed:!game,section:game?t('المستوى ','Level ')+(number+1):''};
 };
 function add(type:KnowledgeQuestionType=nextType){
  if(game&&mode==='ladder'&&questions.length>=10){
   setError(t('الحد الأقصى 10 مستويات للبطولة.','Maximum ten championship levels.'));return;
  }
  if(questions.length>=500){setError(t('وصلت للحد الأقصى 500 سؤال.','Maximum 500 questions.'));return;}
  setQuestions(old=>[...old,makeQuestion(old.length,type)]);setActive(questions.length);setError('');
 }
 function loadSevenLevels(){
  if(questions.length&&typeof window!=='undefined'&&!window.confirm(t(
   'ده هيستبدل الأسئلة الموجودة بسبع مستويات. احفظ نسخة لو محتاجها. تكمل؟',
   'This replaces the existing questions with seven levels. Save a copy first if needed. Continue?')))return;
  setMode('ladder');setSafety([3]);setQuestions(Array.from({length:7},(_,i)=>makeQuestion(i)));
  setActive(0);setError('');
 }
 function importFromBank(id:string){
  const item=bank.find(x=>x.id===id),source=item?.payload;
  if(!source||!isKnowledgeQuestionType(source.type)){
   setError(t('نوع السؤال ده مش مدعوم داخل تحدي المعرفة.',
    'This question type is not supported in the knowledge quiz.'));return;
  }
  if(game&&mode==='ladder'&&(source.type!=='Quiz'||source.options?.length!==4)){
   setError(t('طريق البطولة بيقبل فقط سؤال اختيار من متعدد بأربع إجابات.',
    'Championship accepts only four-choice multiple-choice questions.'));return;
  }
  if(game&&mode==='ladder'&&questions.length>=10){setError(t('الحد الأقصى 10 مستويات.','Maximum 10 levels.'));return;}
  const {questions:unused,mainType:unusedMain,...copy}=structuredClone(source);
  setQuestions(old=>[...old,copy]);
  setActive(questions.length);setError('');
 }
 function duplicate(){if(!q)return;setQuestions(old=>[...old.slice(0,index+1),structuredClone(q),...old.slice(index+1)]);setActive(index+1);setError('');}
 function move(delta:number){const to=index+delta;if(to<0||to>=questions.length)return;const next=[...questions];[next[index],next[to]]=[next[to],next[index]];setQuestions(next);setActive(to);}
 function remove(){if(questions.length===1){setError(t('لازم تسيب سؤال واحد على الأقل.','At least one question is required.'));return;}
  setQuestions(old=>old.filter((_,i)=>i!==index));setActive(Math.max(0,index-1));}
 function chooseMode(value:'ladder'|'classic'){
  if(value==='ladder'&&mode!=='ladder'&&questions.some(q=>q.type!=='Quiz'||q.options?.length!==4)){
   setError(t('نظام البطولة يتطلب أسئلة اختيار من متعدد بأربع اختيارات. غيّر الأنواع الأول أو استخدم قالب 7 مستويات؛ مش هنمسح أسئلتك تلقائيًا.',
    'Championship requires four-choice multiple-choice questions. Change incompatible questions or use the 7-level template; existing questions will not be erased automatically.'));return;
  }
  if(value==='ladder'&&mode!=='ladder'){
   const next=questions.map((x,i)=>({...x,points:prizes[Math.min(i,prizes.length-1)],speed:false,
    timer:x.timer||30,participation:'individual',betEnabled:false,
    section:t('المستوى ','Level ')+(i+1)}));
   setQuestions(next);
  }
  setMode(value);setError('');
 }
 function save(){
  if(game&&mode==='ladder'&&!ladderAvailable){
   setError(t('نظام البطولة على السيرفر غير متاح حاليًا، ومش هنحفظ لعبة بقواعد غير مفعّلة.',
    'Championship server rules are not yet available, so this game cannot be saved in that mode.'));return;
  }
  if(game&&mode==='classic'&&questions.length<7){
   setError(t('التحدي الكبير لازم يحتوي على 7 أسئلة على الأقل.','Ultimate Game Show needs at least seven questions.'));return;
  }
  if(game&&mode==='ladder'&&(questions.length<7||questions.length>10)){
   setError(t('البطولة تحتاج من 7 إلى 10 مستويات.','A championship needs 7–10 levels.'));return;
  }
  const copy:Activity[]=[];
  for(let i=0;i<questions.length;i++){
   try{
    const q=normalizeKnowledgeQuestion(questions[i],game&&mode==='ladder');
    if(game&&mode==='ladder'){
     if(q.type!=='Quiz'||q.options.length!==4||q.timer<5||q.timer>300)throw Error('CHAMPIONSHIP');
     q.points=Number(questions[i].points);
     if(i>0&&q.points<=copy[i-1].points)throw Error('PRIZES');
    }
    if(game&&mode==='ladder')q.section=t('المستوى ','Level ')+(i+1);
    copy.push(q);
   }catch(e:any){
    setActive(i);
    const details:Record<string,[string,string]>={
     CHOICES:['كل الاختيارات لازم تكون مكتوبة.','All choices must contain text.'],
     ANSWER:['اكتب إجابة صحيحة واحدة على الأقل.','Add at least one accepted answer.'],
     PAIRS:['اكتب كل العناصر ومعانيها.','Fill in all matching items.'],
     ORDER:['اكتب كل خطوات الترتيب.','Fill in every ordering step.'],
     PRIZES:['نقاط كل مستوى لازم تكون أعلى من المستوى اللي قبله.','Each level must award more points than the previous.'],
     CHAMPIONSHIP:['البطولة تحتاج أربع اختيارات ووقت 5–300 ثانية.','Championship needs four options and 5–300 seconds.']
    };
    const reason=details[e?.message]||[
     'راجع تفاصيل السؤال حسب نوعه (الاختيارات أو الإجابات أو الربط أو الصورة).',
     'Review the fields for this question type (options, answers, pairs or image).'];
    setError(t('راجع السؤال ','Check question ')+(i+1)+': '+reason[ar?0:1]);
    return;
   }
  }
  try{
   const final={...activity,prompt:title.trim()||copy[0].prompt,questions:copy,
    showFormat:game&&mode==='ladder'?'championship':undefined,
    minimumLevels:game?7:undefined,
    safeLevels:game&&mode==='ladder'?safety.filter(x=>x<=copy.length).sort((a,b)=>a-b):undefined,
    participation:game&&mode==='ladder'?'individual':activity.participation,
    betEnabled:game&&mode==='ladder'?false:activity.betEnabled};
   validateActivity(structuredClone(final));
   onSave(final);
  }catch{setError(t('راجع عنوان المسابقة وإعدادات الأسئلة، بعض القيم غير صالحة.',
    'Check the quiz title and question settings; some values are invalid.'));}
 }
 if(!q)return null;
 
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
     <button type="button" className="btn primary" onClick={()=>add()}><Plus size={16}/>{t('سؤال جديد','New')}</button></div>
    {(!game||mode==='classic')&&<label className="question-studio__new-type">
     {t('نوع السؤال الجديد','New question type')}
     <select value={nextType} onChange={e=>setNextType(e.target.value as KnowledgeQuestionType)}>
      {knowledgeQuestionTypes.map(type=><option value={type} key={type}>{questionTypeLabel(type,ar)}</option>)}
     </select></label>}
    {game&&<button type="button" className="question-studio__preset" onClick={loadSevenLevels}>
      {t('جهّز مسابقة من 7 مستويات','Start a 7-level show')}</button>}
    {bank.length>0&&<label className="question-studio__bank">
     {t('أضف من بنك الأسئلة','Import from question bank')}
     <select aria-label={t('اختر سؤالًا من البنك','Pick a bank question')} value=""
      onChange={e=>{if(e.target.value)importFromBank(e.target.value);}}>
      <option value="">{t('اختار سؤال','Select question')}</option>
      {bank.map(x=><option key={x.id} value={x.id}>{x.title}</option>)}
     </select>
    </label>}
    {questions.map((item,i)=><button type="button" key={i}
      className={'question-studio__item '+(index===i?'selected':'')}
      aria-current={index===i?'step':undefined} onClick={()=>{setActive(i);setError('');}}>
     <strong>{game&&mode==='ladder'?t('المستوى','Level')+' '+(i+1):t('سؤال','Question')+' '+(i+1)}</strong>
     <span>{item.prompt||t('سؤال جديد — اضغط واكتب','Untitled — tap to edit')}</span>
     <small>{questionTypeLabel(item.type,ar)} · {game&&mode==='ladder'?(item.points||0).toLocaleString()+' '+t('نقطة','points'):(item.timer||30)+'s'}</small>
    </button>)}
   </aside>
   <div className="question-studio__form" ref={formRef}>
    <label className="question-studio__title">{t('عنوان النشاط','Activity title')}
     <input maxLength={2000} value={title} onChange={e=>setTitle(e.target.value)}/></label>
    {game&&<div className="question-studio__rules">
     <h3>{t('نظام المسابقة','Competition format')}</h3>
     <div className="question-studio__mode">
      <button type="button" className={mode==='ladder'?'chosen':''} aria-pressed={mode==='ladder'} onClick={()=>chooseMode('ladder')}>
       {t('طريق البطولة · محاولات مستقلة','Championship · independent attempts')}</button>
      <button type="button" className={mode==='classic'?'chosen':''} aria-pressed={mode==='classic'} onClick={()=>chooseMode('classic')}>
       {t('جولات حرة · نفس النظام السابق','Open rounds · legacy rules')}</button>
     </div>
     {mode==='ladder'&&!ladderAvailable&&<p role="status">{t('جاري التحقق من دعم قواعد المسابقة على السيرفر. هيتفعل الحفظ بعد تفعيل الخدمة.','Checking server support: saving this mode requires versioned competition rules on the backend.')}</p>}
    {mode==='ladder'&&<p>{t('كل متسابق يبدأ من أول مستوى. الفوز ينقله للمستوى التالي، والخطأ يخرجه مع الاحتفاظ بجائزة آخر مستوى أمان. يقدر ينسحب بجائزته الحالية، ومساعداته مرة واحدة في محاولته. السيرفر هو الحكم.',
       'Every contestant starts at level one. Correct answers advance; wrong answers exit with the last guaranteed milestone, or they may withdraw with their current prize. Lifelines are single-use per attempt, enforced by the server.')}</p>}
    </div>}
    {game&&mode==='ladder'&&<fieldset className="question-studio__safety">
     <legend>{t('مستويات الأمان · النقاط المحمية عند الخسارة','Guaranteed milestones on a wrong answer')}</legend>
     <div>{questions.map((_,i)=><label key={i}><input type="checkbox" checked={safety.includes(i+1)}
      onChange={e=>setSafety(old=>e.target.checked?[...old,i+1].sort((a,b)=>a-b):old.filter(v=>v!==i+1))}
      disabled={!safety.includes(i+1)&&safety.length>=3}/>{t('مستوى','Level')} {i+1}</label>)}</div>
     <small>{t('حدد حتى 3 مستويات. الانسحاب يحتفظ بآخر جائزة وصل لها المتسابق.',
      'Choose up to 3 safe levels. Withdrawal keeps the last prize won.')}</small>
    </fieldset>}
    {error&&<p className="error-banner" role="alert">{error}</p>}
    <div className="question-studio__question-head">
     <h3>{game&&mode==='ladder'?t('المستوى','Level')+' '+(index+1):t('السؤال','Question')+' '+(index+1)}</h3>
     <div className="question-studio__question-actions">
      <button type="button" title={t('انسخ السؤال','Duplicate')} aria-label={t('انسخ السؤال','Duplicate')} onClick={duplicate}><Copy size={17}/></button>
      <button type="button" title={t('حرك لأعلى','Move up')} aria-label={t('حرك لأعلى','Move up')} disabled={index===0} onClick={()=>move(-1)}><ArrowUp size={17}/></button>
      <button type="button" title={t('حرك لأسفل','Move down')} aria-label={t('حرك لأسفل','Move down')} disabled={index===questions.length-1} onClick={()=>move(1)}><ArrowDown size={17}/></button>
      <button type="button" title={t('احذف السؤال','Delete')} aria-label={t('احذف السؤال','Delete')} disabled={questions.length===1} onClick={remove}><Trash2 size={17}/></button>
     </div>
    </div>
    <label className="question-studio__type-selector">
     {t('نوع السؤال الحالي','Current question type')}
     <select value={isKnowledgeQuestionType(q.type)?q.type:'Quiz'}
      disabled={game&&mode==='ladder'}
      onChange={e=>{
       const type=e.target.value as KnowledgeQuestionType;
       setQuestions(old=>old.map((item,i)=>i===index?changeKnowledgeQuestionType(item,type,ar):item));
       setError('');
      }}>
      {knowledgeQuestionTypes.map(type=><option key={type} value={type}>{questionTypeLabel(type,ar)}</option>)}
     </select>
     {game&&mode==='ladder'&&<small>{t('البطولة تستخدم أربع اختيارات لكل مستوى، لكن تحدي المعرفة بيدعم كل الأنواع.',
      'Championship requires four-choice questions; Knowledge Quiz supports all formats.')}</small>}
    </label>
    <label>{t('اكتب نص السؤال','Question text')}
     <textarea rows={3} maxLength={2000} placeholder={t('السؤال اللي هيظهر للمتدرب…','What the learner will see…')}
      value={q.prompt} onChange={e=>patch({prompt:e.target.value})}/></label>
    <QuestionMediaPicker ar={ar} value={q.media} onError={setError}
     onChange={(media:QuestionMedia|undefined)=>patch(
      q.type==='Image Hotspot'&&media?.type==='image'?{media,image:media.url}:{media}
     )}/>
    <QuestionTypeFields ar={ar} q={q} onPatch={patch}/>
    <div className="question-studio__fields">
     <label>{t('زمن الإجابة بالثواني','Time limit (seconds)')}
      <input type="number" min={5} max={3600} value={q.timer} onChange={e=>patch({timer:Number(e.target.value)})}/></label>
     <label>{game&&mode==='ladder'?t('جائزة المستوى بالنقاط','Prize for this level'):t('نقاط السؤال','Question points')}
      <input type="number" min={0} max={10000} value={q.points??1000} onChange={e=>patch({points:Number(e.target.value)})}/></label>
    </div>
    {game&&mode==='ladder'&&<p className="question-studio__hint"><ShieldCheck size={18}/>{t('الجائزة تُحتسب فقط عند الإجابة الصحيحة. الإجابة الخاطئة تمنع هذا المتسابق من المستويات التالية.',
      'The server awards this level only for a correct answer and blocks an eliminated contestant from later levels.')}</p>}

   </div>
  </div>
  <footer className="modal-footer question-studio__footer">
   <span>{index+1}/{questions.length} · {t('بتعدّل السؤال المختار','Editing selected question')}</span>
   <div><button type="button" className="btn secondary" onClick={onCancel}>{t('إلغاء','Cancel')}</button>
    <button type="button" className="btn primary" onClick={save}><Check size={18}/>{t('احفظ الأسئلة والمسابقـة','Save questions & competition')}</button></div>
  </footer>
 </section></div>;
}
