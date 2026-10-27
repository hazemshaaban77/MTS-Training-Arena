'use client';
import {useState,useRef} from 'react';
import {Send,Check,CheckCircle2,ArrowUp,ArrowDown,RotateCw,Gift,Zap,Lightbulb,DoorOpen,Flag,Users,Clock,Star} from 'lucide-react';
import LivePoll from './LivePoll';
import ArenaQuizExperience from './ArenaQuizExperience';
import ArenaGameShow from './ArenaGameShow';
import ArenaChampionship from './ArenaChampionship';
import ArenaEscapeRoom from './ArenaEscapeRoom';
import ArenaOrderIt from './ArenaOrderIt';
import ArenaMetaPlan from './ArenaMetaPlan';
import WheelJudge from './WheelJudge';
import ArenaWheel3D from './ArenaWheel3D';
import './ArenaGamePolish.css';
import './ArenaWorld3D.css';
import ArenaScenario from './ArenaScenario';
import {OpenBoxExperience,FlashcardExperience} from './ArenaDiscoveryGames';
export default function GamePlay({s,ar,host,display,canAnswer,busy,onSubmit,onInteract,onControl}:any){
 const a=s.activity,t=(a:string,e:string)=>ar?a:e,closed=s.status!=='question',g=s.game||{},mine=s.mine,actor=!!mine&&!host&&!display;
 const [word,setWord]=useState(''),[card,setCard]=useState(0),[bet,setBet]=useState(0),[cast,setCast]=useState<string[]>([]);
 const [wheelFallback,setWheelFallback]=useState(false);
 const send=(action:string,extra:any={})=>onInteract(action,{version:action==='miniquiz'?g.mini?.version:g.version||0,turn:g.turn||0,...extra});
 const usable=actor&&mine.eligible&&!s.paused&&!closed&&!busy;
 if(a.type==='Ultimate Game Show'&&a.showFormat==='championship')
  return <ArenaChampionship s={s} ar={ar} host={host} display={display} busy={busy}
   onControl={onControl} onInteract={onInteract}/>;
 if((s.runtime?.phase==='casting'||s.runtime?.phase==='betting')&&(a.mainType==='Ultimate Game Show'||a.type==='Ultimate Game Show'))
  return <ArenaGameShow s={s} ar={ar} host={host} display={display} actor={actor} usable={usable}
   busy={busy} closed={closed} g={g} bet={bet} setBet={setBet} cast={cast} setCast={setCast}
   send={send} onControl={onControl}/>;
 if(a.type==='Escape Room')
  return <ArenaEscapeRoom s={s} ar={ar} host={host} display={display} actor={actor} usable={usable}
   busy={busy} closed={closed} g={g} QuestionComponent={Question} onControl={onControl} send={send}/>;
 if(a.nodes||a.type==='Scenario Challenge'&&!a.options)
  return <ArenaScenario s={s} ar={ar} host={host} display={display}
   actor={actor} usable={usable} busy={busy} closed={closed} g={g} send={send}/>;
 if(['Wheel of Fortune','Spin Wheel'].includes(a.type)){
  const sectors=Array.isArray(a.sectors)?a.sectors:Array.isArray(a.items)?a.items.map((label:string)=>({label})):[];
  const spin=g.spin,now=s.clockNow||s.serverNow;
  const count=spin?Math.max(0,Math.ceil((spin.startsAt-now)/1000)):0;
  const turnPlayer=(s.players||[]).find((p:any)=>p.uid===(spin&&!spin.revealed||g.mini?.question?g.spinTarget:g.target));
  const selected=g.target===mine?.id;
  const canRequestSpin=!!g.target&&(host||selected)&&!busy&&!s.paused&&!closed&&(!spin||spin.revealed)&&g.turn<g.rounds&&!g.mini?.question;

  return <div className="presentation-play wheel-stage wheel-stage--crown-real3d">
   <div className="turn-entrance" key={g.target}><span className="avatar">{turnPlayer?.name?.charAt(0)||'✦'}</span><div><small>{t('الدور الحالي','IN THE SPOTLIGHT')}</small><b>{turnPlayer?.name||t('في انتظار مشارك','Waiting for a player')}</b></div><strong>{g.turn}/{g.rounds}</strong></div>
   <div className="wheel-arena-banner"><Zap size={18}/><span>{t('المسرح جاهز… العجلة الملكية هتحدد التحدي!','LIGHTS. CAMERA. CROWN WHEEL!')}</span><Zap size={18}/></div>
   {!wheelFallback&&sectors.length>=2?<ArenaWheel3D sectors={sectors} spin={spin} serverNow={now} canSpin={canRequestSpin} countdown={count} ar={ar}
    onUnavailable={()=>setWheelFallback(true)} onSpin={()=>host?onControl('spin'):send('spin')}/>:
    <div className="arena-wheel-webgl-unavailable" role="status"><strong>{t('وضع التشغيل الميسّر','Accessible play mode')}</strong>
     <p>{t('الجهاز مش قادر يعرض المسرح الثلاثي الأبعاد حاليًا. تقدر تكمل النشاط بنفس النتيجة الرسمية من غير العجلة القديمة.','This device cannot render the 3D stage. You can continue with the official server outcome without the old wheel.')}</p>
     <button className="btn primary large" type="button" disabled={!canRequestSpin} onClick={()=>host?onControl('spin'):send('spin')}>{t('ابدأ التحدي','Start the challenge')}</button></div>}
   {host&&<div className="sector-legend sector-legend--grand" aria-label={t('قطاعات العجلة','Wheel sectors')}>{sectors.map((v:any,i:number)=><span key={i} className={(g.used?.includes(i)?'used ':'')+(spin?.revealed&&spin.index===i?'wheel-legend-winner':'')} aria-current={spin?.revealed&&spin.index===i?'true':undefined}><b>{String(i+1).padStart(2,'0')}</b><span>{v.label}</span></span>)}</div>}
   {host&&<div className="hero-actions"><select aria-label={t('اختيار المتدرب','Select player')} value={g.target||''} onChange={e=>onControl('selectturn',undefined,{player:e.target.value})}>{(s.players||[]).map((p:any)=><option key={p.uid} value={p.uid}>{p.name}</option>)}</select>
    <button className="btn secondary" onClick={()=>onControl('selectturn',undefined,{mode:'random'})}>{t('اختيار عشوائي','Random player')}</button>
    {spin&&!spin.revealed&&<button className="text-button" onClick={()=>{const reason=prompt(t('سبب إعادة اللف','Reason for re-spin'));if(reason)onControl('respin',undefined,{reason});}}>{t('إعادة لف موثقة','Audited re-spin')}</button>}</div>}
   {host&&<WheelJudge ar={ar} game={g} session={s} activity={a} busy={busy} onControl={onControl}/>}
   {g.outcome&&spin?.revealed&&<div role="status" aria-live="polite" className={'reveal-result wheel-outcome-grand outcome-'+g.outcome.kind} key={spin.id}><span>✦ {g.outcome.kind||t('النتيجة','OUTCOME')}</span><h3>{g.outcome.label||g.outcome}</h3><p>{g.outcome.detail}</p>{!!g.outcome.points&&g.outcome.kind!=='penalty'&&<strong>{g.outcome.points>0?'+':''}{g.outcome.points}</strong>}</div>}
   {g.mini?.question&&<div className="mini-quiz"><span className="eyebrow">MINI QUIZ {g.mini.step+1}/{g.mini.total}</span><p className="mini-clock">{Math.max(0,Math.ceil((g.mini.deadline-now)/1000))}s</p>
    {g.mini.deadline<=now&&usable&&mine?.id===g.spinTarget?<button className="btn secondary" onClick={()=>send('miniquiz',{answer:null})}>{t('انتهى الوقت · متابعة','Time is up · Continue')}</button>:<Question key={`${spin?.id}:${g.mini.step}`} a={g.mini.question} ar={ar} disabled={!usable||mine?.id!==g.spinTarget} onSubmit={(answer:any)=>send('miniquiz',{answer})}/>}</div>}
   {g.mini&&!g.mini.question&&<p className="answer-sent">{t('اكتمل التحدي المصغر','Mini quiz complete')}</p>}
  </div>;
 }
 if(a.type==='Open the Box')return <OpenBoxExperience a={a} ar={ar} host={host} display={display}
  actor={actor} usable={usable} closed={closed} busy={busy} g={g} mine={mine} s={s}
  onControl={onControl} send={send}
  questionSlot={g.box?.question&&!g.box.answered?<Question a={g.box.question} ar={ar}
   disabled={!usable||g.box.target!==mine?.id} onSubmit={(answer:any)=>send('boxquiz',{answer})}/>:null}/>;
 if(a.type==='Flashcards')return <FlashcardExperience a={a} ar={ar} actor={actor} host={host}
  usable={usable} closed={closed} busy={busy} g={g} s={s} card={card}
  setCard={setCard} onControl={onControl} send={send}/>;
 if(['Meta Plan','Categorize'].includes(a.type))return <ArenaMetaPlan key={s.current} s={s} ar={ar}
  host={host} display={display} actor={actor} canAnswer={canAnswer} busy={busy}
  onSubmit={onSubmit} onControl={onControl}/>;
 const meta=false;
 if(a.type==='Live Poll')return <LivePoll s={s} ar={ar} host={host} display={display} canAnswer={canAnswer} busy={busy} onSubmit={onSubmit}/>;
 if(a.type==='Quiz'||a.mainType==='Quiz')return <ArenaQuizExperience s={s} ar={ar} host={host} display={display}
  canAnswer={canAnswer} busy={busy} onSubmit={onSubmit} QuestionComponent={Question}/>;
 if(a.type==='Order It')return <ArenaOrderIt key={s.current} a={a} s={s} ar={ar} actor={actor} canAnswer={canAnswer} busy={busy} onSubmit={onSubmit}/>;
 if(a.mainType==='Ultimate Game Show'||a.type==='Ultimate Game Show')
  return <ArenaGameShow s={s} ar={ar} host={host} display={display} actor={actor} usable={usable}
   busy={busy} closed={closed} g={g} bet={bet} setBet={setBet} cast={cast} setCast={setCast}
   send={send} onControl={onControl}>
   <Question key={s.current} a={a} ar={ar} disabled={!canAnswer}
    closed={!!s.keyRevealed} mine={s.mine} eliminated={g.eliminated}
    tally={s.tally} onSubmit={onSubmit} hideSubmit={!actor}/>
  </ArenaGameShow>;

 return <div className={meta?'meta-stage':'question-engine'}>{a.mainType==='Ultimate Game Show'&&actor&&<div className="lifelines">{[['fifty','50:50'],['audience',t('تصويت الجمهور','Audience')],['time','+30s']].map(([kind,label])=><button className="btn secondary" key={kind} disabled={!usable||g.lifelines?.includes(kind)} onClick={()=>send('lifeline',{kind})}>{label}</button>)}</div>}{g.audienceRequested&&<div className="audience-chart">{a.options?.map((o:string,i:number)=><div key={i}><i style={{height:`${20+(g.audience?.[i]||0)*14}px`}}/><b>{g.audience?.[i]||0}</b><span>{o}</span></div>)}</div>}{a.mainType==='Ultimate Game Show'&&actor&&!closed&&<div className="audience-vote"><small>{t('شارك في رأي الجمهور بدون نقاط','Audience opinion · Unscored')}</small>{a.options?.map((o:string,i:number)=><button disabled={!actor||s.paused||closed||busy||!g.audienceRequested} key={i} onClick={()=>send('audience',{choice:i})}>{i+1}</button>)}</div>}
 {a.type==='Live Poll'&&a.pollKind==='word'?<><input maxLength={80} value={word} disabled={!canAnswer} onChange={e=>setWord(e.target.value)} placeholder={t('كلمة أو عبارة قصيرة','A word or short phrase')}/>{actor&&<button className="btn primary" disabled={!canAnswer||!word.trim()} onClick={()=>onSubmit(word)}>{t('مشاركة','Share')}</button>}{s.pollSummary?.words&&<div className="word-cloud">{Object.entries(s.pollSummary.words).map(([word,n]:any)=><span key={word} style={{fontSize:`${16+Math.min(n,10)*4}px`}}>{word}<small>{n}</small></span>)}</div>}</>:a.type==='Live Poll'&&a.pollKind==='rating'?<><div className="rating-stars">{[1,2,3,4,5].map(n=><button key={n} disabled={!canAnswer} className={s.mine?.answer>=n?'selected':''} onClick={()=>onSubmit(n)}><Star size={35}/><span>{n}</span></button>)}</div>{s.pollSummary&&<div className="rating-average">{s.pollSummary.average.toFixed(1)}<small>/5 · {s.pollSummary.count} {t('ردود','responses')}</small></div>}</>:<Question key={s.current} a={a.type==='Live Poll'&&a.pollKind==='priority'?{...a,type:'Order It',items:a.options}:a} ar={ar} disabled={!canAnswer} closed={!!s.keyRevealed} mine={s.mine} eliminated={g.eliminated} tally={s.tally} onSubmit={onSubmit} hideSubmit={!actor} meta={meta}/>}{s.pollSummary?.ranking&&<div className="poll-ranking">{s.pollSummary.ranking.map((x:any,i:number)=><div key={i}><b>{i+1}</b>{x.label}<strong>{x.value}</strong></div>)}</div>}{a.type==='Live Poll'&&<p className="unscored-badge">{a.anonymous?t('مجهول الهوية · الردود منفصلة عن الأسماء','Anonymous · Responses stored separately from identities'):t('تصويت معرّف · بدون نقاط','Identified poll · No points')}</p>}</div>;
}
export function Question({a,ar,disabled,onSubmit,closed=false,mine,eliminated=[],tally,hideSubmit=false,meta=false,hidePrompt=false}:any){
 const t=(a:string,e:string)=>ar?a:e,[choice,setChoice]=useState<any>(null),[order,setOrder]=useState<number[]>(a.items?.map((_:any,i:number)=>i)||[]),[mapping,setMapping]=useState<number[]>((a.left||a.items||[]).map(()=>-1)),[text,setText]=useState(''),drag=useRef<number|null>(null);
 const selected=mine?.answered&&!a.allowChanges?mine.answer:choice??mine?.answer;
 function move(i:number,to:number){const next=[...order];const [x]=next.splice(i,1);next.splice(to,0,x);setOrder(next);}
 function submit(value:any){onSubmit(value);}
 const ready=a.options?choice!==null:a.type==='Fill Blank'?text.trim():a.type==='Image Hotspot'?choice!==null:a.type==='Order It'?true:!mapping.includes(-1);
 return <div className="question-interaction">{!hideSubmit&&!meta&&!hidePrompt&&<h3 className="nested-prompt">{a.prompt}</h3>}{a.type==='Dropdown'&&!closed?<label className="dropdown-question">{t('اختار الإجابة','Choose the answer')}<select value={choice??''} disabled={disabled} onChange={e=>setChoice(Number(e.target.value))}><option value="" disabled>{t('اختر…','Select…')}</option>{a.options.map((o:string,i:number)=><option key={i} value={i}>{o}</option>)}</select></label>:a.options?<div className="answer-grid">{a.options.map((o:string,i:number)=><button type="button" key={i} aria-pressed={selected===i} disabled={disabled||eliminated.includes(i)} className={'answer-option option-'+i+(selected===i?' picked':'')+(closed&&typeof a.correct==='number'&&selected===i&&a.correct!==i?' wrong-answer':'')+(closed&&a.correct===i?' right-answer':'')+(eliminated.includes(i)?' eliminated':'')} onClick={()=>setChoice(i)}><b className="answer-letter">{'ABCD'[i]}</b><span>{o}</span>{closed&&a.correct===i&&<CheckCircle2 size={20}/>} {tally&&<b className="option-tally">{tally[i]}</b>}{tally&&<i className="vote-bar" style={{width:`${Math.max(0,Math.min(100,tally[i]/Math.max(1,tally.reduce((x:number,y:number)=>x+y,0))*100))}%`}}/>}</button>)}</div>:a.type==='Fill Blank'?<input value={text} maxLength={200} disabled={disabled} onChange={e=>setText(e.target.value)} placeholder={t('اكتب الإجابة المحددة','Enter your answer')}/>:a.type==='Image Hotspot'?<div className="hotspot-editor" onClick={e=>{if(disabled)return;const r=e.currentTarget.getBoundingClientRect();setChoice({x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height});}}><img src={a.image} alt={a.prompt}/>{choice&&<i style={{left:`${choice.x*100}%`,top:`${choice.y*100}%`}}>◎</i>}{closed&&a.regions?.map((r:any,i:number)=><i key={i} className="hotspot-correct" style={{left:`${r.x*100}%`,top:`${r.y*100}%`,width:`${r.r*200}%`}}/>)}</div>:a.type==='Order It'?<div className="order-list">{(closed&&a.order?a.order:order).map((index:number,i:number)=><div key={index} className={'order-row '+(closed&&a.order?'right-answer':'')} draggable={!disabled} onDragStart={()=>drag.current=i} onDragOver={e=>e.preventDefault()} onDrop={()=>{if(drag.current!==null&&!disabled)move(drag.current,i);}}><b>{i+1}</b><span>{a.items[index]}</span>{!closed&&<div><button className="icon-button" aria-label={t('لأعلى','Move up')} disabled={disabled||i===0} onClick={()=>move(i,i-1)}><ArrowUp size={18}/></button><button className="icon-button" aria-label={t('لأسفل','Move down')} disabled={disabled||i===order.length-1} onClick={()=>move(i,i+1)}><ArrowDown size={18}/></button></div>}</div>)}</div>:<div className="classification-mobile">{(a.left||a.items||[]).map((item:string,i:number)=>{const answer=closed?(a.pairs||a.assignments)?.[i]:null,own=mine?.answered?mine.answer?.[i]:mapping[i];return <div className={'classification-card '+(closed&&answer!=null&&mine?.answered?(own===answer?'correct':'incorrect'):'')} key={i} draggable={!disabled} onDragStart={()=>drag.current=i}><span>{item}</span>{closed&&answer!=null&&answer>=0?<b>{(a.right||a.categories)[answer]}</b>:<div className="category-options">{(a.right||a.categories||[]).map((c:string,j:number)=><button key={j} disabled={disabled||!!a.pairs&&mapping.includes(j)&&mapping[i]!==j} className={own===j?'selected':''} onDragOver={e=>e.preventDefault()} onDrop={()=>{if(drag.current!==null&&!disabled)setMapping(mapping.map((v,k)=>k===drag.current?j:v));}} onClick={()=>setMapping(mapping.map((v,k)=>k===i?j:v))}>{c}</button>)}</div>}</div>;})}</div>}{!hideSubmit&&!closed&&(!mine?.answered||a.allowChanges)&&<button type="button" className="btn primary wide submit-answer" aria-label={meta?t('تسليم التصنيف كاملًا','Submit complete classification'):t('تثبيت الإجابة','Lock in answer')} disabled={disabled||!ready} onClick={()=>submit(a.options||a.type==='Image Hotspot'?choice:a.type==='Fill Blank'?text:a.type==='Order It'?order:mapping)}><Send size={17}/>{meta?t('تسليم التصنيف كاملًا','Submit complete classification'):t('تثبيت الإجابة','Lock in answer')}</button>}{mine?.answered&&meta&&!closed&&<div className="personal-summary">{a.items.map((v:string,i:number)=><span key={i}>{v}<b>{a.categories[mine.answer[i]]}</b></span>)}</div>}{closed&&a.explanation&&<p className="explanation"><Lightbulb size={18}/>{a.explanation}</p>}</div>;
}
