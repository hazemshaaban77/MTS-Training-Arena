'use client';
import {useEffect,useState} from 'react';
import {BookOpen,CheckCircle2,ChevronLeft,ChevronRight,Gift,Layers3,LockKeyhole,RotateCcw,Sparkles,UnlockKeyhole,Users} from 'lucide-react';
import WheelJudge from './WheelJudge';

type ActorProps={a:any;ar:boolean;host:boolean;display:boolean;actor:boolean;usable:boolean;
 closed:boolean;busy:boolean;g:any;mine:any;s:any;onControl:(action:string,index?:number,extra?:any)=>void;
 send:(action:string,extra?:any)=>void;questionSlot?:React.ReactNode};

export function OpenBoxExperience({a,ar,host,actor,usable,closed,busy,g,mine,s,onControl,send,questionSlot}:ActorProps){
 const t=(arText:string,enText:string)=>ar?arText:enText;
 const items:Array<string>=Array.isArray(a.items)?a.items:[];
 const used:Array<number>=Array.isArray(g.used)?g.used:[];
 const selectedIndex=Number.isInteger(g.box?.index)?g.box.index:-1;
 const [retired,setRetired]=useState(false);
 const currentPlayer=(s.players||[]).find((x:any)=>x.uid===(g.box?.target||g.target));
 useEffect(()=>{setRetired(false);if(!g.box||!g.manualJudgement)return;
  const tm=setTimeout(()=>setRetired(true),1550);return()=>clearTimeout(tm);
 },[g.box?.id,!!g.manualJudgement]);
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
  {g.box&&!retired&&<div className={'box-vault-reveal'+(g.manualJudgement?' box-vault-reveal--retiring':'')} role="status" aria-live="polite" key={g.box.index}>
   <div className="box-vault-reveal__badge"><Sparkles size={21}/>{t('المفاجأة اتكشفت','THE REVEAL')}</div>
   <Gift size={47} className="box-vault-reveal__icon" aria-hidden="true"/>
   <h3>{g.box.label}</h3>
   {g.box.detail&&<p>{g.box.detail}</p>}
   {g.manualJudgement&&<div className="box-prize-moment" role="status"><Sparkles size={24}/><strong>{g.manualJudgement.delta>0?'+':''}{g.manualJudgement.delta} {t('نقطة','points')}</strong><p>{t('تم اعتماد تقييم','Grade approved for')} {currentPlayer?.name||t('المتدرب','learner')}</p></div>}
   {g.box.question&&!g.box.answered&&<div className="box-vault-reveal__question">{questionSlot}</div>}
   {g.box.question&&g.box.answered&&<p className="box-vault-reveal__done"><CheckCircle2 size={17}/>{t('اتسجل ردّ التحدي','Challenge answer submitted')}</p>}
  </div>}
  {host&&<WheelJudge mode="box" ar={ar} game={g} session={s} activity={a} busy={busy} onControl={onControl}/>}
  {host&&<label className="box-vault-turn box-vault-turn--spotlight"><Users size={25}/>
   <span><small>{t('صاحب الدور الآن','NOW PLAYING')}</small><strong>{currentPlayer?.name||t('اختار المتدرب','Select trainee')}</strong></span>
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
 const hostOnly=a.flipPermission==='host';
 const scoredMode=a.trainingMode==='challenge';
 const approvedPlayers=(s.players||[]).filter((p:any)=>p.approval==='approved');
 const [judgePlayer,setJudgePlayer]=useState<string>('');
 const [judgeGrade,setJudgeGrade]=useState(7);
 const [judgeDirection,setJudgeDirection]=useState<1|-1>(1);
 const index=Math.min(Math.max(0,host?card:hostOnly?(s.reveal??0):actor?(g.card||0):card),Math.max(0,count-1));
 const revealed=hostOnly?s.reveal===index:actor?!!g.flipped:s.reveal===index;
 const selectedJudgePlayer=judgePlayer||g.flashTarget||approvedPlayers[0]?.uid||'';
 const existingGrade=g.flashGrades?.[index+':'+selectedJudgePlayer];
 const computedPoints=judgeDirection*Math.min(10000,Math.round(judgeGrade*Number(a.points??1000)*Number(a.weight??1)/10));
 const canRevealScored=!scoredMode||!!g.flashGrades?.[index+':'+g.flashTarget];
 const reviewed=Array.isArray(g.reviewed)?g.reviewed:[];
 const uniqueReviewed=new Map<number,boolean>();
 for(const r of reviewed){if(Number.isInteger(r?.index)&&r.index>=0&&r.index<count)uniqueReviewed.set(r.index,!!r.known);}
 const mastered=[...uniqueReviewed.values()].filter(Boolean).length;
 const progress=count?(actor?uniqueReviewed.size:index+1)/count*100:0;
 const back=hostOnly?a.revealed?.back:actor?g.back:a.revealed?.back;
 const canFlip=!busy&&!closed&&(actor?usable&&!hostOnly:host&&!revealed&&canRevealScored);
 const flip=()=>{
  if(!canFlip)return;
  if(actor)send(revealed?'card':'flip',{index});
  else onControl('reveal',index);
 };
 const move=(next:number)=>{
  if(next<0||next>=count||busy||(!host&&!actor)||actor&&hostOnly)return;
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
  {hostOnly&&actor&&<p className="flashcard-trainer-only" role="status">
    {t('المدرب هو اللي بيقلب الكروت. تابع شاشة العرض عشان تشوف الإجابة.',
      'Trainer controls the reveal. Follow the presentation to see the answer.')}</p>}
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
  {host&&scoredMode&&<section className="flash-grade-console" role="group" aria-label={t('تقييم تحدّي بطاقات المعرفة من 10','Flashcard instructor grade out of ten')}>
   <h3>{t('قيّم إجابة المتدرب قبل كشف البطاقة','Grade the learner before flipping the card')}</h3>
   <div className="flash-grade-fields"><label>{t('صاحب الإجابة','Contestant')}
    <select value={selectedJudgePlayer} onChange={e=>setJudgePlayer(e.target.value)} disabled={busy||closed}>
     {approvedPlayers.map((p:any)=><option key={p.uid} value={p.uid}>{p.name}</option>)}
    </select></label>
    <label>{t('الدرجة من 10','Grade /10')}<input type="range" min={0} max={10} step={1} value={judgeGrade} onChange={e=>setJudgeGrade(Number(e.target.value))} disabled={busy||closed}/></label>
    <strong aria-live="polite">{judgeGrade}/10</strong></div>
   {existingGrade?<p className="rated" role="status">✓ {t('تم اعتماد الدرجة','Grade saved')} {existingGrade.grade}/10 · {existingGrade.delta>0?'+':''}{existingGrade.delta} {t('نقطة','points')}</p>:<>
    <div className="wheel-judge__direction" role="group" aria-label={t('تأثير الدرجة على النقاط','Grade point direction')}>
     <button type="button" aria-pressed={judgeDirection===1} className={judgeDirection===1?'chosen':''} onClick={()=>setJudgeDirection(1)}>{t('مكافأة','Award')}</button>
     <button type="button" aria-pressed={judgeDirection===-1} className={judgeDirection===-1?'chosen':''} onClick={()=>setJudgeDirection(-1)}>{t('خصم','Deduct')}</button></div>
    <p>{t('تأثير النقاط','Point effect')}: <b>{computedPoints>0?'+':''}{computedPoints}</b></p>
    <button className="btn primary" disabled={!selectedJudgePlayer||busy||closed} onClick={()=>onControl('flashjudge',index,{player:selectedJudgePlayer,grade:judgeGrade,direction:judgeDirection,delta:computedPoints})}>{t('اعتماد التقييم','Commit grade')}</button></>}
   <p>{canRevealScored?t('يمكنك الآن كشف الإجابة','You may now reveal the answer'):t('كشف الإجابة متوقف حتى اعتماد التقييم','Grade the current contestant to unlock the answer')}</p>
  </section>}
  <nav className="flash-academy-controls" aria-label={t('أدوات التنقل بين البطاقات','Card navigation')}>
   <button className="btn secondary" disabled={index===0||busy||(!host&&!actor)||actor&&hostOnly}
    onClick={()=>move(index-1)}><ChevronRight size={18}/>{t('السابقة','Previous')}</button>
   <button className="btn primary" disabled={!canFlip||count===0}
    onClick={flip}><RotateCcw size={18}/>{revealed?t('ارجع للسؤال','Show question'):t('اكشف الإجابة','Reveal answer')}</button>
   <button className="btn secondary" disabled={index===count-1||busy||(!host&&!actor)||actor&&hostOnly}
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
  <p className="flash-academy-note">{scoredMode?t('تقييم المدرب هو المعتمد، والتقييم الذاتي اختياري للمراجعة.','The trainer grade is official; self-assessment is optional.'):t('التقييم ذاتي للمراجعة فقط، مش درجات امتحان.','Self-assessment for learning, not an exam grade.')}</p>
 </section>;
}
