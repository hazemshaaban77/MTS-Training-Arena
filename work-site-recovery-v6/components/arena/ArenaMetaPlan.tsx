'use client';
import {useState} from 'react';
import {ArrowRight,BarChart3,Check,CheckCircle2,ClipboardList,Layers3,Lightbulb,LockKeyhole,Send,StickyNote,Users} from 'lucide-react';
import MetaPlanDragBoard from './MetaPlanDragBoard';

const palette=['#30c9c9','#92a8ff','#f9c476','#ef9fbd','#85d9a4','#c9a5f0'];

/** Server-authoritative Meta Plan / Categorize interface.
 * The mobile learner only submits category indexes. The trainer's progressive
 * reveal uses public assignments (-1 = hidden) and never derives answer keys.
 */
export default function ArenaMetaPlan({
 s,ar,host,display,actor,canAnswer,busy,onSubmit,onControl
}:{s:any;ar:boolean;host:boolean;display:boolean;actor:boolean;canAnswer:boolean;busy:boolean;
 onSubmit:(answer:number[])=>void;onControl:(action:string,index?:number,extra?:any)=>void}){
 const a=s.activity,t=(a:string,e:string)=>ar?a:e;
 const categories:string[]=Array.isArray(a.categories)?a.categories:[];
 const items:string[]=Array.isArray(a.items)?a.items:[];
 const mine=s.mine,closed=s.status!=='question',already=!!mine?.answered;
 const initial=Array.isArray(mine?.answer)&&mine.answer.length===items.length?mine.answer:items.map(()=>-1);
 const [mapping,setMapping]=useState<number[]>(initial);
 const [active,setActive]=useState<number|null>(null);
 const [showAnalysis,setShowAnalysis]=useState(false);
 const [notes,setNotes]=useState(String(s.runtime?.notes||''));
 const [notesDirty,setNotesDirty]=useState(false);
 const ready=actor&&canAnswer&&!busy&&!closed&&!already;
 const selected:number[]=already&&Array.isArray(mine.answer)?mine.answer:mapping;
 const completed=selected.filter(x=>Number.isInteger(x)&&x>=0&&x<categories.length).length;
 const allAssigned=categories.length>0&&items.length>0&&completed===items.length;
 const correct=closed&&s.keyRevealed&&Array.isArray(a.assignments)?a.assignments:null;
 const partialReveal=correct?.filter((n:number)=>Number.isInteger(n)&&n>=0).length||0;
 const revealed=partialReveal>0;
 const grouped=(category:number)=>items.map((label,i)=>({label,i})).filter(({i})=>correct?.[i]===category);
 const unassigned=items.map((label,i)=>({label,i})).filter(({i})=>!correct||!Number.isInteger(correct[i])||correct[i]<0);
 const analytics=Array.isArray(s.metaSummary)?s.metaSummary:null;
 function assign(i:number,j:number){if(!ready||j<0||j>=categories.length)return;setMapping(old=>old.map((v,k)=>i===k?j:v));setActive(null);}
 return <section className={'arena-metaplan '+(actor?'arena-metaplan--learner':'arena-metaplan--stage')+(closed?' arena-metaplan--closed':'')}
  aria-label={t('لعبة ميتا بلان لتصنيف الأفكار','Meta Plan learning classification board')}>
  <header className="arena-metaplan__header">
   <div className="arena-metaplan__heading"><span className="eyebrow"><StickyNote size={16}/>
    {t('ميتا بلان · لوحة الأفكار','META PLAN · THE IDEA BOARD')}</span>
    <h3>{actor?t('كل فكرة… في مكانها الصح','EVERY IDEA HAS ITS PLACE'):
      t('لوحة التصنيف التفاعلية','LIVE CLASSIFICATION BOARD')}</h3>
    <p>{actor?t('اختار كل بطاقة وحدد الفئة المناسبة ليها. فكّر في السبب قبل ما تثبّت إجابتك.',
      'Assign each note to a category, then explain why it belongs there before submitting.'):
      !closed?t('المتدربون بيصنّفوا الأفكار على أجهزتهم. اختار فئة لإضاءتها أثناء النقاش.',
        'Learners classify ideas on their devices. Highlight a category to guide discussion.'):
       t('اكشف الأفكار واحدة واحدة، وناقش السبب وراء كل تصنيف.',
         'Reveal ideas one at a time, then discuss why each belongs there.')}</p>
   </div>
   <span className="arena-metaplan__count"><Layers3 size={17}/>{items.length} {t('بطاقات','IDEAS')}</span>
  </header>
  {actor?<div className="arena-metaplan__learner">
   <div className="arena-metaplan__progress" aria-label={t('الإنجاز في التصنيف','Classification progress')}>
    <div><span><ClipboardList size={17}/>{t('بطاقات تم تصنيفها','IDEAS SORTED')}</span>
     <b>{completed} / {items.length}</b></div>
    <div className="arena-metaplan__progress-track"><i style={{width:items.length?completed/items.length*100+'%':'0%'}}/></div>
   </div>
   <MetaPlanDragBoard ar={ar} categories={categories} items={items}
    selected={selected} ready={ready} correct={correct}
    onAssign={(i,j)=>assign(i,j)}/>
   {already&&!closed&&<div className="arena-metaplan__receipt" role="status">
    <CheckCircle2 size={20}/>{t('السيرفر سجّل تصنيفك. استنى كشف النتائج مع المدرب.',
      'Your classification was recorded. Wait for the trainer to reveal the board.')}</div>}
   {actor&&!closed&&!already&&<button type="button" className="arena-metaplan__submit"
    disabled={!ready||!allAssigned} onClick={()=>onSubmit(mapping)}>
    <Send size={19}/>{t('ثبّت تصنيف كل البطاقات','SUBMIT ALL CATEGORIES')}</button>}
   {closed&&<p className="arena-metaplan__hint"><Lightbulb size={16}/>
    {revealed?t('ناقش مع مدربك ليه كل فكرة موجودة في الفئة دي.',
       'Discuss why each revealed note belongs to its category.'):
       t('التصنيف الصحيح هيظهر لما المدرب يختار يكشفه.',
         'The correct categories will appear when the trainer reveals them.')}</p>}
  </div>:<div className="arena-metaplan__presenter">
   <div className="arena-metaplan__columns">
    {categories.map((cat,j)=><div key={j}
     className={'arena-metaplan__column'+(s.runtime?.highlight===j?' is-highlighted':'')}
     style={{'--meta-accent':palette[j%palette.length]} as React.CSSProperties}>
     <div className="arena-metaplan__column-head">
      <span className="arena-metaplan__category-number">{String(j+1).padStart(2,'0')}</span>
      <h4>{cat}</h4>
      {host&&<button type="button" aria-label={t('سلّط الضوء على ','Highlight ')+cat}
       onClick={()=>onControl('highlight',j)}><Lightbulb size={19}/></button>}
     </div>
     <div className="arena-metaplan__column-body">{grouped(j).map(({label,i})=>
      <span className="arena-metaplan__placed" key={i}><StickyNote size={18}/>{label}</span>)}
      {!grouped(j).length&&<span className="arena-metaplan__dropzone">
       {t('مساحة الأفكار','IDEAS APPEAR HERE')}</span>}</div>
    </div>)}
   </div>
   {!!unassigned.length&&<div className="arena-metaplan__unsorted">
    <div className="arena-metaplan__unsorted-heading">
     <span><StickyNote size={19}/>{revealed?t('بطاقات لسه ما اتكشفتش','IDEAS NOT YET REVEALED'):
       t('أفكار في انتظار التصنيف','IDEAS TO DISCUSS')}</span>
     <b>{unassigned.length}</b>
    </div>
    <div>{unassigned.map(({label,i})=><span className="arena-metaplan__loose" key={i}>{label}</span>)}</div>
   </div>}
   {host&&closed&&<div className="arena-metaplan__trainer">
    <span><LockKeyhole size={17}/>{t('أنت اللي بتتحكم في كشف التصنيف','YOU CONTROL THE REVEAL')}</span>
    <div><button type="button" className="btn primary" disabled={busy||partialReveal>=items.length}
      onClick={()=>onControl('metareveal')}><StickyNote size={17}/>{t('اكشف بطاقة واحدة','Reveal one idea')}</button>
     <button type="button" className="btn secondary" disabled={busy||partialReveal>=items.length}
      onClick={()=>onControl('revealkey')}><Check size={17}/>{t('اكشف التصنيف كله','Reveal all categories')}</button>
    </div>
   </div>}
   {host&&<div className="arena-metaplan__trainer-notes">
    <label htmlFor="arena-metaplan-trainer-notes"><Lightbulb size={17}/>{t('ملاحظات النقاش للمدرب','Trainer discussion notes')}</label>
    <textarea id="arena-metaplan-trainer-notes" maxLength={3000} value={notes}
     onChange={e=>{setNotes(e.target.value);setNotesDirty(true);}}
     placeholder={t('اكتب أسئلة النقاش أو ملاحظاتك…','Add your debrief prompts or facilitation notes…')}/>
    {notesDirty&&<button type="button" className="btn secondary compact"
      onClick={()=>{onControl('notes',undefined,{notes});setNotesDirty(false);}}>
      <Check size={15}/>{t('احفظ الملاحظات','Save notes')}</button>}
   </div>}
   {analytics&&host&&<div className="arena-metaplan__analysis">
    <button type="button" className="btn secondary" aria-expanded={showAnalysis}
     onClick={()=>setShowAnalysis(v=>!v)}><BarChart3 size={17}/>
      {showAnalysis?t('إخفاء توزيع تصنيفات المتدربين','Hide submitted groupings'):
       t('عرض توزيع تصنيفات المتدربين','Show submitted groupings')}</button>
    {showAnalysis&&<div className="arena-metaplan__analytics-rows">
     {items.map((label,i)=><div key={i}><strong>{label}</strong>
      <div>{categories.map((cat,j)=><span key={j}>{cat}: <b>{Number(analytics[i]?.[j]||0)}</b></span>)}</div></div>)}</div>}
   </div>}
   <p className="arena-metaplan__hint"><Users size={16}/>
    {t('أولوية النشاط هي النقاش وفهم التصنيف، مش حساب نقاط للكلام.',
       'The goal is conversation and understanding the grouping, not scoring opinions.')}</p>
  </div>}
 </section>;
}
