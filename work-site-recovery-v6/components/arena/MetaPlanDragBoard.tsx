'use client';
import {useRef,useState} from 'react';
import {CheckCircle2,GripVertical,StickyNote} from 'lucide-react';

const palette=['#30c9c9','#92a8ff','#f9c476','#ef9fbd','#85d9a4','#c9a5f0'];
type Props={ar:boolean;categories:string[];items:string[];selected:number[];
 correct:number[]|null;ready:boolean;onAssign:(item:number,category:number)=>void};
/** Learner sorts their own cards. Pointer Events support phones (native HTML
 * drag/drop alone does NOT), native drag/drop supports desktop. Tap a card then
 * category for assistive/keyboard access. Nothing commits until Submit. */
export default function MetaPlanDragBoard({ar,categories,items,selected,correct,ready,onAssign}:Props){
 const t=(a:string,e:string)=>ar?a:e;
 const [chosen,setChosen]=useState<number|null>(null);
 const [dragged,setDragged]=useState<number|null>(null);
 const [point,setPoint]=useState<{x:number;y:number}|null>(null);
 const dragRef=useRef<{item:number;x:number;y:number}|null>(null);
 function begin(e:React.PointerEvent,item:number){
  if(!ready)return;
  dragRef.current={item,x:e.clientX,y:e.clientY};
  try{e.currentTarget.setPointerCapture(e.pointerId);}catch{}
  setPoint(null);setChosen(item);
 }
 function track(e:React.PointerEvent){
  if(!dragRef.current)return;
  if(Math.abs(e.clientX-dragRef.current.x)+Math.abs(e.clientY-dragRef.current.y)>12){
   setDragged(dragRef.current.item);
   setPoint({x:e.clientX,y:e.clientY});
  }
 }
 function finish(e:React.PointerEvent){
  const item=dragRef.current?.item;dragRef.current=null;
  try{e.currentTarget.releasePointerCapture(e.pointerId);}catch{}
  setPoint(null);setDragged(null);
  if(item==null||!ready)return;
  // Touch pointer events are captured by the starting element on iOS/Android.
  // Test the actual coordinates instead of the event.target for a dropzone.
  const element=document.elementFromPoint(e.clientX,e.clientY);
  const target=element?.closest<HTMLElement>('[data-meta-category]');
  if(target){
   const category=Number(target.dataset.metaCategory);
   if(Number.isInteger(category)&&category>=0&&category<categories.length){
    onAssign(item,category);setChosen(null);
   }
  }
 }
 const bank=items.map((label,i)=>({label,i})).filter(({i})=>selected[i]<0||selected[i]>=categories.length);
 const notes=(category:number)=>items.map((label,i)=>({label,i})).filter(({i})=>selected[i]===category);
 const chip=(label:string,i:number)=><button type="button" key={i}
  draggable={ready} disabled={!ready&&!correct}
  className={'meta-drag-card'+(chosen===i?' is-selected':'')+(dragged===i?' is-dragging':'')}
  aria-label={t('اسحب أو اختار بطاقة ','Drag or select card ')+label}
  aria-pressed={chosen===i} onClick={()=>{if(ready)setChosen(x=>x===i?null:i);}}
  onPointerDown={e=>begin(e,i)} onPointerMove={track} onPointerUp={finish}
  onPointerCancel={()=>{dragRef.current=null;setDragged(null);setPoint(null);}}
  onDragStart={e=>{if(!ready){e.preventDefault();return;}e.dataTransfer.setData('text/plain',String(i));e.dataTransfer.effectAllowed='move';setDragged(i);}}
  onDragEnd={()=>{setDragged(null);setPoint(null);}}>
  <GripVertical size={18}/><strong>{label}</strong>
  {correct&&correct[i]>=0&&<span className={selected[i]===correct[i]?'meta-drag-correct':'meta-drag-incorrect'}>
   {selected[i]===correct[i]?'✓':'!'}
  </span>}
 </button>;
 return <div className="meta-drag-board">
  <p className="meta-drag-instructions"><StickyNote size={18}/>
   {t('اسحب البطاقة للفئة المناسبة، أو اضغط البطاقة وبعدها اضغط الفئة.',
      'Drag an idea to a category, or tap the idea then tap the category.')}
  </p>
  <div className="meta-drag-bank" aria-label={t('بطاقات لم يتم تصنيفها','Unsorted ideas')}>
   <h4>{t('بطاقات الأفكار','IDEA CARDS')} <span>{bank.length}</span></h4>
   <div>{bank.map(({label,i})=>chip(label,i))}
    {!bank.length&&<span className="meta-drag-all-sorted"><CheckCircle2 size={18}/>
      {t('كل البطاقات اتصنّفت','All ideas sorted')}</span>}</div>
  </div>
  <div className="meta-drag-columns" role="group" aria-label={t('قوائم التصنيف','Category drop lists')}>
   {categories.map((cat,j)=><div className={'meta-drag-column'+(chosen!==null?' is-target':'')} key={j}
    data-meta-category={j} style={{'--meta-accent':palette[j%palette.length]} as React.CSSProperties}
    onDragOver={e=>{if(ready){e.preventDefault();e.dataTransfer.dropEffect='move';}}}
    onDrop={e=>{e.preventDefault();const item=Number(e.dataTransfer.getData('text/plain'));if(ready&&Number.isInteger(item)&&item>=0&&item<items.length){onAssign(item,j);setChosen(null);}setDragged(null);}}
    >
    <button type="button" className="meta-drag-column-title" disabled={!ready||chosen===null}
     onClick={()=>{if(chosen!==null){onAssign(chosen,j);setChosen(null);}}}
     aria-label={t('ضع البطاقة في ','Place selected card into ')+cat}>
     <span>{String(j+1).padStart(2,'0')}</span><strong>{cat}</strong><b>{notes(j).length}</b>
    </button>
    <div className="meta-drag-column-items" data-meta-category={j}>
     {notes(j).map(({label,i})=>chip(label,i))}
     {!notes(j).length&&<span className="meta-drag-placeholder" data-meta-category={j}>
      {t('اسحب بطاقتك هنا','DROP A CARD HERE')}</span>}
    </div>
   </div>)}
  </div>
  {dragged!==null&&point&&<div className="meta-drag-floating" aria-hidden="true"
   style={{left:point.x,top:point.y}}>{items[dragged]}</div>}
 </div>;
}
