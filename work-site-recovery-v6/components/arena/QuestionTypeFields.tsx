'use client';
import {ArrowDown,ArrowUp,Plus,Trash2} from 'lucide-react';
import type {Activity} from '../../lib/catalog';
import QuestionMediaPicker,{type QuestionMedia} from './QuestionMediaPicker';
import {setMatchingPair,deleteMatchingPair} from '../../lib/question-authoring';

type Props={ar:boolean;q:Activity;onPatch:(change:Record<string,unknown>)=>void;onError:(value:string)=>void};
export default function QuestionTypeFields({ar,q,onPatch,onError}:Props){
 const t=(a:string,e:string)=>ar?a:e;
 const type=q.type;
 const choice=['Quiz','True/False','Dropdown'].includes(type);
 const options:Array<string>=Array.isArray(q.options)?q.options:[];
 const setArray=(key:string,index:number,value:string)=>onPatch({
  [key]:(Array.isArray(q[key])?q[key]:[]).map((s:any,j:number)=>j===index?value:s)});
 const updateMedia=(media:QuestionMedia|undefined)=>{
  onPatch(type==='Image Hotspot'&&media?.type==='image'?{media,image:media.url}:{media});
 };
 return <>
  {choice&&<fieldset className="question-studio__options">
   <legend>{t('حدّد الإجابة الصحيحة ثم اكتب الاختيارات','Mark the correct answer and edit each option')}</legend>
   {options.map((choice:string,i:number)=><div className={'question-studio__option '+(q.correct===i?'correct':'')} key={i}>
    <label className="question-studio__radio"><input type="radio" name="studio-correct-answer"
     checked={q.correct===i} onChange={()=>onPatch({correct:i})}
     aria-label={t('الإجابة الصحيحة: اختيار ','Correct answer: option ')+(i+1)}/><span>{i+1}</span></label>
    <input value={choice} maxLength={500} placeholder={t('الاختيار ','Option ')+(i+1)}
     onChange={e=>setArray('options',i,e.target.value)} disabled={type==='True/False'}
     aria-label={t('نص الاختيار ','Option text ')+(i+1)}/>
    {type!=='True/False'&&options.length>2&&<button type="button" className="question-studio__remove-option"
     aria-label={t('احذف الاختيار','Remove option')}
     onClick={()=>onPatch({options:options.filter((_,j)=>j!==i),
      correct:q.correct===i?0:(q.correct>i?q.correct-1:q.correct)})}><Trash2 size={16}/></button>}
   </div>)}
   {type!=='True/False'&&options.length<4&&<button className="btn secondary" type="button"
    onClick={()=>onPatch({options:[...options,'']})}><Plus size={16}/>{t('أضف اختيار','Add choice')}</button>}
   {type==='True/False'&&<p className="question-studio__hint">
    {t('الاختيارات ثابتة (صح أو غلط)، اختار الإجابة الصحيحة من الدائرة.',
     'The two choices are fixed. Select the correct answer using the radio button.')}</p>}
  </fieldset>}
  {type==='Fill Blank'&&<fieldset className="question-studio__options">
   <legend>{t('الإجابات النصية المقبولة','Accepted text answers')}</legend>
   {(q.accepted||['']).map((answer:string,i:number)=><div className="question-studio__option" key={i}>
    <input value={answer} maxLength={500} placeholder={t('إجابة صحيحة أخرى','Accepted answer')}
     onChange={e=>setArray('accepted',i,e.target.value)}/>
    {(q.accepted?.length||0)>1&&<button className="question-studio__remove-option" type="button"
     aria-label={t('احذف الإجابة','Remove answer')}
     onClick={()=>onPatch({accepted:q.accepted.filter((_:string,j:number)=>j!==i)})}><Trash2 size={16}/></button>}
   </div>)}
   {(q.accepted?.length||0)<20&&<button className="btn secondary" type="button"
    onClick={()=>onPatch({accepted:[...(q.accepted||[]),'']})}><Plus size={16}/>{t('إضافة صيغة مقبولة','Add accepted variant')}</button>}
   <p className="question-studio__hint">{t('اكتب صيغة واحدة في كل سطر. مش لازم تحط الإجابة وسط الاختيارات.',
     'Add each acceptable answer separately; the learner types a response.')}</p>
  </fieldset>}
  {type==='Match It'&&<fieldset className="question-studio__options">
   <legend>{t('الأزواج — اكتب العنصر ومعناه وحدّد الربط الصحيح','Matching pairs — edit items and choose each correct match')}</legend>
   <div className="question-studio__match-grid">
    {(q.left||[]).map((left:string,i:number)=><div className="question-studio__match-row" key={i}>
     <label>{t('العنصر ','Item ')+(i+1)}<input maxLength={300} value={left}
      onChange={e=>setArray('left',i,e.target.value)}/></label>
     <label>{t('المعنى ','Match ')+(i+1)}<input maxLength={300} value={q.right?.[i]||''}
      onChange={e=>setArray('right',i,e.target.value)}/></label>
     <label>{t('يرتبط بالمعنى','Correct pair')}<select value={q.pairs?.[i]??i}
      onChange={e=>onPatch({pairs:setMatchingPair(q.pairs||q.left.map((_:string,j:number)=>j),i,Number(e.target.value))})}>
      {(q.right||[]).map((right:string,j:number)=><option key={j} value={j}>{j+1}. {right||t('المعنى','Match')}</option>)}
     </select></label>
     {(q.left?.length||0)>2&&<button className="question-studio__remove-option" type="button"
      aria-label={t('حذف الزوج','Remove pair')}
      onClick={()=>{
       const pairs=deleteMatchingPair(q.pairs||q.left.map((_:string,j:number)=>j),i);
       onPatch({left:q.left.filter((_:string,j:number)=>j!==i),
        right:q.right.filter((_:string,j:number)=>j!==i),pairs:patched});
      }}><Trash2 size={16}/></button>}
    </div>)}
   </div>
   {(q.left?.length||0)<20&&<button type="button" className="btn secondary" onClick={()=>{
    const count=(q.left||[]).length;
    onPatch({left:[...(q.left||[]),''],right:[...(q.right||[]),''],pairs:[...(q.pairs||[]),count]});
   }}><Plus size={16}/>{t('إضافة زوج','Add matching pair')}</button>}
  </fieldset>}
  {type==='Order It'&&<fieldset className="question-studio__options">
   <legend>{t('العناصر والترتيب الصحيح','Items and correct sequence')}</legend>
   {(q.items||[]).map((item:string,i:number)=><div className="question-studio__option" key={i}>
    <strong className="question-studio__item-index">{i+1}</strong>
    <input maxLength={300} value={item} placeholder={t('الخطوة ','Step ')+(i+1)}
     onChange={e=>setArray('items',i,e.target.value)}/>
    {(q.items?.length||0)>2&&<button type="button" className="question-studio__remove-option"
     aria-label={t('حذف الخطوة','Remove step')} onClick={()=>{
      const old=q.order||q.items.map((_:string,j:number)=>j);
      onPatch({items:q.items.filter((_:string,j:number)=>j!==i),
       order:old.filter((n:number)=>n!==i).map((n:number)=>n>i?n-1:n)});
     }}><Trash2 size={16}/></button>}
   </div>)}
   <div className="question-studio__sequence">
    <h4>{t('الترتيب الصحيح عند التصحيح','Correct order for grading')}</h4>
    {(q.order||[]).map((itemIndex:number,pos:number)=><div key={pos}>
     <strong>{pos+1}</strong><span>{q.items?.[itemIndex]||t('اكتب نص الخطوة أولًا','Enter step text first')}</span>
     <button type="button" disabled={pos===0} aria-label={t('حرّك لأعلى','Move up')}
      onClick={()=>{const copy=[...(q.order||[])];[copy[pos-1],copy[pos]]=[copy[pos],copy[pos-1]];onPatch({order:copy});}}><ArrowUp size={16}/></button>
     <button type="button" disabled={pos===q.order.length-1} aria-label={t('حرّك لأسفل','Move down')}
      onClick={()=>{const copy=[...(q.order||[])];[copy[pos+1],copy[pos]]=[copy[pos],copy[pos+1]];onPatch({order:copy});}}><ArrowDown size={16}/></button>
    </div>)}
   </div>
   {(q.items?.length||0)<30&&<button className="btn secondary" type="button"
    onClick={()=>onPatch({items:[...(q.items||[]),''],order:[...(q.order||[]),(q.items||[]).length]})}>
    <Plus size={16}/>{t('إضافة خطوة','Add step')}</button>}
  </fieldset>}
  {type==='Image Hotspot'&&<fieldset className="question-studio__options">
   <legend>{t('حدد نقطة الإجابة الصحيحة على الصورة','Set the correct image hotspot')}</legend>
   <label>{t('رابط الصورة الرئيسية HTTPS','Target image HTTPS URL')}
    <input type="url" dir="ltr" placeholder="https://..." value={q.image||''}
     onChange={e=>onPatch({image:e.target.value})}/></label>
   {/^https:\/\//.test(q.image||'')&&<div className="question-studio__hotspot"
    role="button" tabIndex={0} aria-label={t('انقر لتحديد الإجابة الصحيحة','Click to set the correct hotspot')}
    onClick={e=>{const r=e.currentTarget.getBoundingClientRect();onPatch({regions:[{
     x:Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),
     y:Math.max(0,Math.min(1,(e.clientY-r.top)/r.height)),r:q.regions?.[0]?.r??.15}]});}}
    onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onPatch({regions:[{x:.5,y:.5,r:q.regions?.[0]?.r??.15}]});}}}>
    <img src={q.image} alt={q.prompt||t('صورة السؤال','Hotspot image')}/>
    <i style={{left:((q.regions?.[0]?.x??.5)*100)+'%',top:((q.regions?.[0]?.y??.5)*100)+'%'}}/>
   </div>}
   <div className="question-studio__fields">
    <label>{t('الإحداثي الأفقي %','Horizontal coordinate %')}
     <input type="number" min={0} max={100} value={Math.round((q.regions?.[0]?.x??.5)*100)}
      onChange={e=>onPatch({regions:[{x:Number(e.target.value)/100,y:q.regions?.[0]?.y??.5,r:q.regions?.[0]?.r??.15}]})}/></label>
    <label>{t('الإحداثي الرأسي %','Vertical coordinate %')}
     <input type="number" min={0} max={100} value={Math.round((q.regions?.[0]?.y??.5)*100)}
      onChange={e=>onPatch({regions:[{x:q.regions?.[0]?.x??.5,y:Number(e.target.value)/100,r:q.regions?.[0]?.r??.15}]})}/></label>
    <label>{t('نسبة السماح في اختيار المكان','Acceptance radius')}
     <input type="number" min={.02} max={.5} step={.01} value={q.regions?.[0]?.r??.15}
      onChange={e=>onPatch({regions:[{x:q.regions?.[0]?.x??.5,y:q.regions?.[0]?.y??.5,r:Number(e.target.value)}]})}/></label>
   </div>
   <p className="question-studio__hint">{t('ارفع صورة السؤال من جهازك في الجزء التالي، أو الصق رابطها هنا، ثم اضغط المكان الصحيح على الصورة.',
     'Upload the question image below or paste its URL here, then choose the correct spot.')}</p>
  </fieldset>}
  <QuestionMediaPicker ar={ar} value={q.media} onError={onError} onChange={updateMedia}/>
 </>;
}
