'use client';
import {useState} from 'react';
import {ArrowDown,ArrowUp,BarChart3,CheckCircle2,Radio,Send,Star,Users,Vote} from 'lucide-react';

type Point={label:string;value:number;maximum:number;detail:string};
const safe=(v:unknown)=>Number.isFinite(Number(v))?Math.max(0,Number(v)):0;
const percentage=(n:number,total:number)=>total?Math.round(n/total*100):0;

/** Poll results are visualized ONLY as charts. No correct answer, answer badges,
 * Quiz option reveal, scores or Quiz leaderboard are shown for Live Poll. */
export function LivePollChart({s,ar}:{s:any;ar:boolean}){
 const a=s.activity,kind=a.pollKind||'choice';
 const t=(arabic:string,english:string)=>ar?arabic:english;
 const summary=s.pollSummary;
 const choices=Array.isArray(a.options)?a.options:[];
 const voteCounts=Array.isArray(s.tally)?choices.map((_:string,i:number)=>safe(s.tally[i])):[];
 const totalVotes=voteCounts.reduce((sum:number,n:number)=>sum+n,0);
 const count=safe(s.submitted);
 let points:Point[]=[];
 let valueUnit=t('صوت','votes');
 let label=t('توزيع الأصوات','VOTE DISTRIBUTION');
 let graphKind='choice';
 if(kind==='word'){
  const entries=Object.entries(summary?.words||{}).filter(([text,value])=>text.trim()&&safe(value)>0);
  const total=entries.reduce((sum,[,v])=>sum+safe(v),0);
  points=entries.sort((a,b)=>safe(b[1])-safe(a[1])).slice(0,15).map(([text,n])=>({
   label:text,value:safe(n),maximum:Math.max(1,total),detail:percentage(safe(n),total)+'%'
  }));
  label=t('أكثر الكلمات تكرارًا','MOST MENTIONED WORDS');
  graphKind='word';
 }else if(kind==='rating'){
  const count=safe(summary?.count),average=count?Math.min(5,safe(summary?.average)):0;
  points=[{label:t('متوسط التقييم','Average rating'),value:average,maximum:5,detail:average.toFixed(1)+' / 5'}];
  valueUnit=t('تقييم','ratings');
  label=t('متوسط تقييم المشاركين','AVERAGE RATING');
  graphKind='rating';
 }else if(kind==='priority'){
  const scores=Array.isArray(summary?.ranking)?summary.ranking:[];
  const maximum=Math.max(1,...scores.map((row:any)=>safe(row.value)));
  points=scores.map((row:any)=>({
   label:String(row.label||''),value:safe(row.value),maximum,detail:safe(row.value).toLocaleString(ar?'ar-EG':'en-US')
  }));
  valueUnit=t('نقطة ترجيح','ranking points');
  label=t('ترتيب الأولويات','PRIORITY RANKING');
  graphKind='priority';
 }else{
  points=choices.map((option:string,i:number)=>({
   label:option,value:voteCounts[i]||0,maximum:Math.max(1,totalVotes),
   detail:percentage(voteCounts[i]||0,totalVotes)+'%'
  }));
 }
 const revealed=kind==='choice'?Array.isArray(s.tally):!!summary;
 // Do not fabricate zeros in place of results the trainer has not revealed.
 if(!revealed)return <div className="live-poll-chart live-poll-chart--pending" role="status">
  <div className="live-poll-chart__pending-icon"><BarChart3 size={43}/></div>
  <h3>{t('الرسم البياني جاهز للعرض','Chart awaiting reveal')}</h3>
  <p>{t('بمجرد إظهار النتيجة، هنشوف توزيع الأصوات هنا.','The vote chart will appear as soon as results are revealed.')}</p>
 </div>;
 return <section className={'live-poll-chart live-poll-chart--'+graphKind} aria-label={t('الرسم البياني لنتائج التصويت','Poll results chart')}>
  <div className="live-poll-chart__heading">
   <span><BarChart3 size={19}/>{label}</span>
   <div className="live-poll-chart__total"><Users size={18}/><b>{count.toLocaleString(ar?'ar-EG':'en-US')}</b><small>{t('مشاركة','responses')}</small></div>
  </div>
  {points.length?<div className="live-poll-chart__rows" role="list" aria-label={label}>{points.map((point,i)=>{
   const ratio=Math.max(0,Math.min(100,point.value/Math.max(1,point.maximum)*100));
   return <div className="live-poll-chart__row" role="listitem" key={i}>
    <div className="live-poll-chart__row-header"><span title={point.label}>{point.label}</span><strong dir="ltr">{point.detail}</strong></div>
    <div className="live-poll-chart__track" role="meter" aria-label={point.label+' · '+point.detail}
     aria-valuemin={0} aria-valuemax={point.maximum} aria-valuenow={point.value}>
     <div className="live-poll-chart__fill" style={{width:ratio+'%'}}/>
    </div>
    {(graphKind==='choice'||graphKind==='word')&&<small>{point.value.toLocaleString(ar?'ar-EG':'en-US')} {t('صوت','votes')}</small>}
   </div>;
  })}</div>:<div className="live-poll-chart__empty">{t('لسه مفيش ردود للعرض','No votes to chart yet')}</div>}
  {graphKind==='priority'&&<p className="live-poll-chart__note">{t('الأعمدة هنا بتعرض نقاط ترتيب الأولويات، مش نسبة أصوات.','Bar lengths represent weighted ranking points, not vote percentages.')}</p>}
  {graphKind==='rating'&&<p className="live-poll-chart__note">{t('طول العمود بيمثل متوسط التقييم من ٥ نجوم.','The bar shows the average rating out of five stars.')}</p>}
 </section>;
}

export default function LivePoll({s,ar,host,display,canAnswer,busy,onSubmit}:any){
 const a=s.activity,kind=a.pollKind||'choice',closed=s.status!=='question';
 const actor=!!s.mine&&!host&&!display;
 const t=(arabic:string,english:string)=>ar?arabic:english;
 const mine=s.mine;
 const [choice,setChoice]=useState<number|null>(typeof mine?.answer==='number'?mine.answer:null);
 const [word,setWord]=useState<string>(typeof mine?.answer==='string'?mine.answer:'');
 const [priority,setPriority]=useState<number[]>(Array.isArray(mine?.answer)?mine.answer:a.options?.map((_:string,i:number)=>i)||[]);
 const allow=!!canAnswer&&!busy&&!closed;
 const already=!!mine?.answered;
 const canChange=!!a.allowChanges;
 const [success,setSuccess]=useState(false);
 const total=safe(s.submitted);
 function vote(answer:any){if(!allow)return;setSuccess(true);onSubmit(answer);}
 function move(from:number,to:number){
  if(!allow||to<0||to>=priority.length)return;
  setPriority(old=>{const next=[...old];const [item]=next.splice(from,1);next.splice(to,0,item);return next;});
 }
 if(closed)return <LivePollChart s={s} ar={ar}/>;
 return <section className={'live-poll-experience '+(actor?'live-poll-experience--voter':'live-poll-experience--stage')}>
  <header className="live-poll-experience__header">
   <span className="live-poll-experience__type"><Radio size={16}/>{t('صوتك يفرق','YOUR VOICE COUNTS')}</span>
   <span className="live-poll-experience__count"><Users size={17}/><b>{total.toLocaleString(ar?'ar-EG':'en-US')}</b>{t('مشاركة','responses')}</span>
  </header>
  {actor?<div className="live-poll-vote">
   {kind==='word'?<div className="live-poll-vote__word"><h3>{t('اكتب الكلمة اللي بتعبّر عن رأيك','Share a word that captures your view')}</h3><input aria-label={t('كلمتك في التصويت','Your poll word')} maxLength={80} value={word} disabled={!allow} onChange={e=>setWord(e.target.value)} placeholder={t('اكتب كلمة أو عبارة قصيرة…','Type a word or short phrase…')}/></div>:
   kind==='rating'?<div className="live-poll-vote__rating"><h3>{t('اختار تقييمك من 1 إلى 5','Choose a rating from 1 to 5')}</h3><div className="live-poll-vote__stars" role="group" aria-label={t('تقييم المشاركة','Poll rating')}>{[1,2,3,4,5].map(n=><button key={n} type="button" disabled={!allow} aria-pressed={choice===n} className={choice!==null&&n<=choice?'selected':''} onClick={()=>setChoice(n)}><Star size={33}/><span>{n}</span></button>)}</div></div>:
   kind==='priority'?<div className="live-poll-vote__priority"><h3>{t('رتّب الأولويات حسب رأيك','Rank priorities from most to least important')}</h3>{priority.map((optionIndex:number,i:number)=><div className="live-poll-vote__priority-row" key={optionIndex}><b>{String(i+1).padStart(2,'0')}</b><span>{a.options[optionIndex]}</span><div><button type="button" onClick={()=>move(i,i-1)} disabled={!allow||i===0} aria-label={t('حرّك لأعلى','Move higher')}><ArrowUp size={18}/></button><button type="button" onClick={()=>move(i,i+1)} disabled={!allow||i===priority.length-1} aria-label={t('حرّك لأسفل','Move lower')}><ArrowDown size={18}/></button></div></div>)}</div>:
   <div className="live-poll-vote__choices" role="group" aria-label={t('اختار رأيك','Choose your vote')}>
    {(a.options||[]).map((option:string,i:number)=><button type="button" key={i}
     className={'live-poll-vote__card'+(choice===i?' selected':'')} aria-pressed={choice===i}
     disabled={!allow} onClick={()=>setChoice(i)}>
      <span className="live-poll-vote__orb"><span/></span>
      <span className="live-poll-vote__text">{option}</span>
      <span className="live-poll-vote__number">{String(i+1).padStart(2,'0')}</span>
     </button>)}
   </div>}
   <div className="live-poll-vote__actions">
    <button type="button" className="live-poll-vote__submit" disabled={!allow||(kind==='word'?!word.trim():kind==='priority'?priority.length!==(a.options||[]).length:choice===null)}
     onClick={()=>vote(kind==='word'?word.trim():kind==='priority'?priority:choice)}>
     {already||success?<CheckCircle2 size={19}/>:<Send size={19}/>}
     {already&&canChange?t('تحديث صوتي','Update my vote'):t('إرسال صوتي','Cast my vote')}
    </button>
    {(already||success)&&<span className="live-poll-vote__success"><CheckCircle2 size={17}/>{t('تم تسجيل صوتك','Your vote is recorded')}</span>}
   </div>
  </div>:<div className="live-poll-experience__audience">
   <div className="live-poll-experience__signal" aria-hidden="true"><i/><i/><i/><Vote size={45}/></div>
   <h3>{t('التصويت مفتوح الآن','LIVE VOTING IN PROGRESS')}</h3>
   <p>{t('المشاركون بيختاروا آراءهم من موبايلاتهم','Participants are sharing their opinions on their devices')}</p>
   <div className="live-poll-experience__counter"><b>{total.toLocaleString(ar?'ar-EG':'en-US')}</b><span>{t('صوت وصل حتى الآن','VOTES COLLECTED')}</span></div>
  </div>}
  {!!a.liveResults&&<LivePollChart s={s} ar={ar}/>}
  <footer className="live-poll-experience__privacy">{a.anonymous?
   t('تصويت مجهول الهوية · بدون نقاط','Anonymous voting · No points'):
   t('تصويت مفتوح للرأي · بدون إجابات صح أو غلط','Opinion poll · No right or wrong answers')}</footer>
 </section>;
}
