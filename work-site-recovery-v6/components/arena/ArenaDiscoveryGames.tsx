'use client';
import {BookOpen,CheckCircle2,ChevronLeft,ChevronRight,Gift,Layers3,LockKeyhole,RotateCcw,Sparkles,UnlockKeyhole,Users} from 'lucide-react';

type ActorProps={a:any;ar:boolean;host:boolean;display:boolean;actor:boolean;usable:boolean;
 closed:boolean;busy:boolean;g:any;mine:any;s:any;onControl:(action:string,index?:number,extra?:any)=>void;
 send:(action:string,extra?:any)=>void;questionSlot?:React.ReactNode};

export function OpenBoxExperience({a,ar,host,actor,usable,closed,busy,g,mine,s,onControl,send,questionSlot}:ActorProps){
 const t=(arText:string,enText:string)=>ar?arText:enText;
 const items:Array<string>=Array.isArray(a.items)?a.items:[];
 const used:Array<number>=Array.isArray(g.used)?g.used:[];
 const selectedIndex=Number.isInteger(g.box?.index)?g.box.index:-1;
 const openCount=new Set(used.filter(i=>i>=0&&i<items.length)).size;
 const canChoose=!closed&&!busy&&(host||usable);
 function open(i:number){
  if(!canChoose||(!a.repeatable&&used.includes(i)))return;
  if(host)onControl('box',i);else send('box',{index:i});
 }
 return <section className="presentation-play box-stage box-stage--vault"
  aria-label={t('لعبة افتح الصندوق','Open the Box game')}>
  <div className="box-vault-heading"><span className="eyebrow"><Sparkles size={17}/>{t('اختار صندوقك… واكتشف المفاجأة','PICK A BOX. UNLOCK THE SURPRISE.')}</span>
   <div className="box-vault-stats"><span><Gift size={16}/>{items.length-openCount} {t('صندوق متبقي','remaining')}</span><span>{openCount}/{items.length} {t('اتفتحوا','opened')}</span></div>
  </div>
  <div className="box-vault-grid" role="group" aria-label={t('صناديق المفاجآت','Mystery boxes')}>
   {items.map((label,i)=>{
    const exhausted=!a.repeatable&&used.includes(i),active=selectedIndex===i;
    return <button key={i} type="button"
      className={'box-vault-box'+(active?' box-vault-box--active':'')+(exhausted?' box-vault-box--used':'')}
      aria-label={t('صندوق رقم ','Box number ')+(i+1)+(exhausted?t(' تم فتحه',' already opened'):'')}
      aria-pressed={active}
      disabled={!canChoose||exhausted}
      onClick={()=>open(i)}>
      <span className="box-vault-lid" aria-hidden="true"><span className="box-vault-lid-cap"/></span>
      <span className="box-vault-body" aria-hidden="true">
       <span className="box-vault-glow"/>
       {active?<UnlockKeyhole size={40}/>:exhausted?<CheckCircle2 size={39}/>:<LockKeyhole size={38}/>}
       <strong>{String(i+1).padStart(2,'0')}</strong>
      </span>
      <span className="box-vault-label">{active?t('المفاجأة ظهرت','REVEALED'):exhausted?t('تم فتحه','OPENED'):t('افتح الصندوق','UNLOCK BOX')}</span>
     </button>;
   })}
  </div>
  {g.box&&<div className="box-vault-reveal" role="status" aria-live="polite" key={g.box.index}>
   <div className="box-vault-reveal__badge"><Sparkles size={21}/>{t('المفاجأة اتكشفت','THE REVEAL')}</div>
   <Gift size={47} className="box-vault-reveal__icon" aria-hidden="true"/>
   <h3>{g.box.label}</h3>
   {g.box.detail&&<p>{g.box.detail}</p>}
   {g.box.question&&!g.box.answered&&<div className="box-vault-reveal__question">{questionSlot}</div>}
   {g.box.question&&g.box.answered&&<p className="box-vault-reveal__done"><CheckCircle2 size={17}/>{t('اتسجل ردّ التحدي','Challenge answer submitted')}</p>}
  </div>}
  {host&&<label className="box-vault-turn"><Users size={19}/>
   <span>{t('اختار المشارك صاحب الدور','Choose whose turn it is')}</span>
   <select aria-label={t('اختار المشارك','Select player')}
    value={g.target||''} onChange={e=>onControl('selectturn',undefined,{player:e.target.value})}>
    {(s.players||[]).map((p:any)=><option key={p.uid} value={p.uid}>{p.name}</option>)}
   </select>
  </label>}
  <p className="box-vault-instruction">{actor?t('اختار صندوق واضغط عليه؛ الهدف إنك تكتشف وتناقش المهمة.','Tap a box to discover and discuss your task.'):
    t('كل صندوق بيكشف مهمة مختلفة. الاختيارات والنتائج بتيجي من الجلسة نفسها.','Every box contains a challenge. The session controls what gets revealed.')}</p>
 </section>;
}

type FlashProps={a:any;ar:boolean;actor:boolean;host:boolean;usable:boolean;closed:boolean;busy:boolean;
 g:any;s:any;card:number;setCard:(next:number)=>void;onControl:(action:string,index?:number,extra?:any)=>void;
 send:(action:string,extra?:any)=>void};

export function FlashcardExperience({a,ar,actor,host,usable,closed,busy,g,s,card,setCard,onControl,send}:FlashProps){
 const t=(arText:string,enText:string)=>ar?arText:enText;
 const fronts:Array<string>=Array.isArray(a.fronts)?a.fronts:[];
 const count=fronts.length;
 const index=actor?Math.min(Math.max(0,g.card||0),Math.max(0,count-1)):Math.min(Math.max(0,card),Math.max(0,count-1));
 const revealed=actor?!!g.flipped:s.reveal===index;
 const reviewed=Array.isArray(g.reviewed)?g.reviewed:[];
 const uniqueReviewed=new Map<number,boolean>();
 for(const r of reviewed){if(Number.isInteger(r?.index)&&r.index>=0&&r.index<count)uniqueReviewed.set(r.index,!!r.known);}
 const mastered=[...uniqueReviewed.values()].filter(Boolean).length;
 const progress=count?(actor?uniqueReviewed.size:index+1)/count*100:0;
 const back=actor?g.back:a.revealed?.back;
 const canFlip=!busy&&!closed&&(actor?usable:host&&!revealed);
 const flip=()=>{
  if(!canFlip)return;
  if(actor)send(revealed?'card':'flip',{index});
  else onControl('reveal',index);
 };
 const move=(next:number)=>{
  if(next<0||next>=count||busy||(!host&&!actor))return;
  if(actor)send('card',{index:next});else setCard(next);
 };
 return <section className="flash-stage flash-stage--academy"
  aria-label={t('لعبة بطاقات المعرفة','Knowledge flashcards')}>
  <header className="flash-academy-header">
   <span className="eyebrow"><BookOpen size={18}/>{t('اكتشف · افتكر · قيّم نفسك','DISCOVER · RECALL · REFLECT')}</span>
   <span className="flash-academy-count">{count?index+1:0} / {count} {t('بطاقات','CARDS')}</span>
  </header>
  <div className="flash-academy-track" role="progressbar" aria-valuemin={0} aria-valuemax={count||1}
   aria-valuenow={actor?uniqueReviewed.size:index+1}
   aria-label={t('تقدم مراجعة البطاقات','Flashcard review progress')}>
   <span style={{width:Math.max(0,Math.min(100,progress))+'%'}}/>
  </div>
  <div className="flash-academy-deck">
   <span className="flash-academy-stack flash-academy-stack--back" aria-hidden="true"/>
   <span className="flash-academy-stack flash-academy-stack--middle" aria-hidden="true"/>
   <button type="button" disabled={!canFlip||count===0}
    aria-pressed={revealed} className={'flash-academy-card'+(revealed?' flash-academy-card--flipped':'')}
    onClick={flip} aria-label={revealed?t('ارجع لوجه السؤال','Show question side'):t('اقلب البطاقة وشوف الإجابة','Flip to reveal the answer')}>
    <span className="flash-academy-card__inner">
     <span className="flash-academy-card__face flash-academy-card__face--front">
      <span className="flash-academy-card__tag"><Layers3 size={16}/>{t('وجه السؤال','QUESTION SIDE')}</span>
      <strong>{fronts[index]||t('مفيش بطاقة متاحة','No card available')}</strong>
      <span className="flash-academy-card__hint"><RotateCcw size={17}/>{t('اضغط لقلب البطاقة','TAP TO FLIP')}</span>
     </span>
     <span className="flash-academy-card__face flash-academy-card__face--back">
      <span className="flash-academy-card__tag"><Sparkles size={16}/>{t('ظهر البطاقة','ANSWER SIDE')}</span>
      <strong>{revealed?(back||t('الإجابة هتظهر لما المدرب يكشفها','Waiting for the trainer to reveal the answer')):''}</strong>
      <span className="flash-academy-card__hint"><RotateCcw size={17}/>{t('اضغط للرجوع للسؤال','TAP TO SEE QUESTION')}</span>
     </span>
    </span>
   </button>
  </div>
  <nav className="flash-academy-controls" aria-label={t('أدوات التنقل بين البطاقات','Card navigation')}>
   <button className="btn secondary" disabled={index===0||busy||(!host&&!actor)}
    onClick={()=>move(index-1)}><ChevronRight size={18}/>{t('السابقة','Previous')}</button>
   <button className="btn primary" disabled={!canFlip||count===0}
    onClick={flip}><RotateCcw size={18}/>{revealed?t('ارجع للسؤال','Show question'):t('اكشف الإجابة','Reveal answer')}</button>
   <button className="btn secondary" disabled={index===count-1||busy||(!host&&!actor)}
    onClick={()=>move(index+1)}>{t('التالية','Next')}<ChevronLeft size={18}/></button>
  </nav>
  {actor&&revealed&&<div className="flash-academy-selfassess" role="group"
   aria-label={t('قيّم مستوى تذكرك','Self-assess your recall')}>
   <p>{t('بعد ما شوفت الإجابة، فاكرها كويس؟','Now that you have seen the answer, how well did you know it?')}</p>
   <div>
    <button disabled={!usable} className={'flash-academy-known'+(uniqueReviewed.get(index)===true?' chosen':'')}
      onClick={()=>send('selfassess',{index,known:true})}><CheckCircle2 size={19}/>{t('عرفتها','I knew it')}</button>
    <button disabled={!usable} className={'flash-academy-review'+(uniqueReviewed.get(index)===false?' chosen':'')}
      onClick={()=>send('selfassess',{index,known:false})}><RotateCcw size={18}/>{t('أراجعها تاني','Review again')}</button>
   </div>
  </div>}
  <div className="flash-academy-summary" role="status">
   <span><BookOpen size={18}/>{actor?uniqueReviewed.size:index+1} / {count} {t('بطاقات وصلت لها','cards visited')}</span>
   {actor&&<span><CheckCircle2 size={18}/>{mastered} {t('قيّمتها إنك عرفتها','marked as known')}</span>}
  </div>
  <p className="flash-academy-note">{t('التقييم ذاتي للمراجعة فقط، مش درجات امتحان.','Self-assessment for learning, not an exam grade.')}</p>
 </section>;
}
