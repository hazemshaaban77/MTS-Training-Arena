'use client';
import {useState,useRef} from 'react';
import {ArrowDown,ArrowUp,Check,CheckCircle2,GripVertical,LockKeyhole,Route,Send,Sparkles,Zap} from 'lucide-react';

export default function ArenaOrderIt({a,s,ar,actor,canAnswer,busy,onSubmit}:{
 a:any;s:any;ar:boolean;actor:boolean;canAnswer:boolean;busy:boolean;onSubmit:(answer:number[])=>void
}){
 const t=(arabic:string,english:string)=>ar?arabic:english;
 const items:string[]=Array.isArray(a.items)?a.items:[];
 const mine=s.mine;
 const closed=s.status!=='question';
 const already=!!mine?.answered;
 const initial=Array.isArray(mine?.answer)&&mine.answer.length===items.length?mine.answer:
  items.map((_,i)=>i);
 const [order,setOrder]=useState<number[]>(initial);
 const drag=useRef<number|null>(null);
 const [hoverSlot,setHoverSlot]=useState<number|null>(null);
 const [grabSlot,setGrabSlot]=useState<number|null>(null);
 const targetAt=(x:number,y:number)=>{
  const el=document.elementFromPoint(x,y);
  const card=el?.closest('[data-order-slot]') as HTMLElement|null;
  const pos=Number(card?.dataset.orderSlot);
  return card&&Number.isInteger(pos)?pos:null;
 };
 function startTouch(event:React.PointerEvent<HTMLSpanElement>,position:number){
  if(!ready)return;
  drag.current=position;setGrabSlot(position);setHoverSlot(position);
  event.currentTarget.setPointerCapture(event.pointerId);
 }
 function moveTouch(event:React.PointerEvent<HTMLSpanElement>){
  if(drag.current===null)return;
  const target=targetAt(event.clientX,event.clientY);
  if(target!==null)setHoverSlot(target);
 }
 function stopTouch(event:React.PointerEvent<HTMLSpanElement>){
  if(drag.current===null)return;
  const source=drag.current,target=targetAt(event.clientX,event.clientY);
  drag.current=null;setGrabSlot(null);setHoverSlot(null);
  if(target!==null)swap(source,target);
  if(event.currentTarget.hasPointerCapture(event.pointerId))
   event.currentTarget.releasePointerCapture(event.pointerId);
 }
 const valid=order.length===items.length&&new Set(order).size===items.length&&order.every(i=>i>=0&&i<items.length);
 const ready=actor&&canAnswer&&!busy&&!closed&&!already;
 const revealed=closed&&!!s.keyRevealed&&Array.isArray(a.order)&&a.order.length===items.length;
 const shown=revealed?a.order:already&&Array.isArray(mine.answer)?mine.answer:order;
 function swap(from:number,to:number){
  if(!ready||to<0||to>=order.length||from===to)return;
  setOrder(prev=>{
   const next=[...prev];const [item]=next.splice(from,1);next.splice(to,0,item);
   return next;
  });
 }
 function drop(to:number){if(drag.current!==null){swap(drag.current,to);drag.current=null;setHoverSlot(null);setGrabSlot(null);}}
 const heading=closed?t('الترتيب النهائي','FINAL SEQUENCE'):
  already?t('تم تثبيت ترتيبك','YOUR SEQUENCE IS LOCKED'):t('رتّب الخطوات… خطوة بخطوة','ARRANGE THE STEPS');
 return <section className={'arena-sequence'+(closed?' arena-sequence--closed':'')}
  aria-label={t('لعبة ترتيب الخطوات','Order It sequencing game')}>
  <header className="arena-sequence__intro">
   <div className="arena-sequence__emblem" aria-hidden="true"><Route size={30}/><span>01</span></div>
   <div className="arena-sequence__heading">
    <span className="eyebrow"><Sparkles size={16}/>{t('تحدي التسلسل','SEQUENCE CHALLENGE')}</span>
    <h3>{heading}</h3>
    <p>{actor&&!closed&&!already?
     t('حرك الخطوات بالأسهم أو اسحبها من مقبض الحركة، وبعدين ثبّت ترتيبك.',
      'Move steps with the arrow buttons or drag a handle, then confirm your order.'):
     closed?t('الخطوات بالترتيب المعروض بعد نهاية الجولة.','The steps in their currently revealed sequence.'):
     t('المشارك بيرتب الخطوات على جهازه.','Participants arrange steps on their devices.')}</p>
   </div>
   <span className="arena-sequence__count"><Zap size={17}/>{items.length} {t('خطوات','STEPS')}</span>
  </header>
  <div className="arena-sequence__flow" role="list" aria-label={t('تسلسل الخطوات','Step order')}>
   {shown.map((itemIndex:number,pos:number)=>{
    const stepLabel=items[itemIndex]||'';
    const correct=revealed&&a.order[pos]===itemIndex;
    return <div key={itemIndex} role="listitem"
      data-order-slot={pos}
      className={'arena-sequence__step'+(revealed?' arena-sequence__step--revealed':'')+(hoverSlot===pos?' arena-sequence__step--drop-target':'')+(grabSlot===pos?' arena-sequence__step--dragging':'')}
      draggable={ready}
      onDragStart={event=>{if(ready){drag.current=pos;event.dataTransfer.effectAllowed='move';}}}
      onDragEnd={()=>{drag.current=null;}}
      onDragOver={event=>{if(ready)event.preventDefault();}}
      onDrop={event=>{event.preventDefault();drop(pos);}}>
     <span className="arena-sequence__index" aria-hidden="true">{String(pos+1).padStart(2,'0')}</span>
     <span className="arena-sequence__step-text">{stepLabel}</span>
     {revealed&&correct&&<CheckCircle2 size={21} className="arena-sequence__correct"/>}
     {ready&&<div className="arena-sequence__step-actions">
      <span className="arena-sequence__drag" role="button" tabIndex={0}
       aria-label={t('اسحب خطوة ','Drag step ')+(pos+1)}
       onPointerDown={event=>startTouch(event,pos)}
       onPointerMove={moveTouch} onPointerUp={stopTouch}
       onPointerCancel={()=>{drag.current=null;setGrabSlot(null);setHoverSlot(null);}}
       onKeyDown={event=>{if(event.key==='ArrowUp'||event.key==='ArrowDown'){event.preventDefault();swap(pos,pos+(event.key==='ArrowUp'?-1:1));}}}>
       <GripVertical size={20}/></span>
      <button type="button" disabled={pos===0} onClick={()=>swap(pos,pos-1)}
       aria-label={t('حرّك ','Move ')+stepLabel+t(' لأعلى',' up')} title={t('لأعلى','Move up')}><ArrowUp size={20}/></button>
      <button type="button" disabled={pos===shown.length-1} onClick={()=>swap(pos,pos+1)}
       aria-label={t('حرّك ','Move ')+stepLabel+t(' لأسفل',' down')} title={t('لأسفل','Move down')}><ArrowDown size={20}/></button>
     </div>}
     {!ready&&!revealed&&<LockKeyhole size={17} className="arena-sequence__readonly" aria-hidden="true"/>}
     {pos<shown.length-1&&<span className="arena-sequence__connector" aria-hidden="true"/>}
    </div>;
   })}
  </div>
  {actor&&already&&!closed&&<div className="arena-sequence__receipt" role="status">
   <CheckCircle2 size={20}/>{t('السيرفر سجّل ترتيبك. مستنيين كشف النتيجة.','Your sequence is recorded. Waiting for the reveal.')}
  </div>}
  {actor&&!closed&&!already&&<button className="arena-sequence__submit" type="button" disabled={!ready||!valid}
   onClick={()=>onSubmit(order)}><Send size={19}/>{t('ثبّت ترتيب الخطوات','LOCK IN MY SEQUENCE')}</button>}
  {closed&&<div className="arena-sequence__final" role="status">
   <Check size={20}/>{revealed?t('ده الترتيب الصحيح اللي اتكشف بعد انتهاء الجولة.',
    'This is the officially revealed correct order.'):
    t('الجولة خلصت. استنى كشف الترتيب من المدرب.',
      'The round has ended. Wait for the trainer to reveal the correct sequence.')}
  </div>}
  <footer className="arena-sequence__footer">
   {t('فكّر في السبب وراء ترتيب كل خطوة… ده أهم من مجرد حفظ التسلسل.',
    'Understand why each step comes next — learning the process matters more than memorizing it.')}
  </footer>
 </section>;
}
