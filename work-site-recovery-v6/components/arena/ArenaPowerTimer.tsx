'use client';
import {Check,Clock3,Pause,Zap} from 'lucide-react';

export type ArenaPowerTimerProps={
 seconds:number;
 remainingMs:number;
 totalSeconds:number;
 timed:boolean;
 paused:boolean;
 closed:boolean;
 ar:boolean;
 mode:'host'|'play'|'display';
};

/**
 * Futuristic Arena countdown: visual-only view of the canonical server clock.
 * Never owns a timer/interval or changes room deadlines, answer availability,
 * scores, or server state. The parent passes its existing clock compensation.
 */
export default function ArenaPowerTimer({seconds,remainingMs,totalSeconds,timed,paused,closed,ar,mode}:ArenaPowerTimerProps){
 const total=Math.max(1,Number.isFinite(totalSeconds)?totalSeconds:1);
 const fraction=timed?Math.max(0,Math.min(1,remainingMs/(total*1000))):1;
 const safeSeconds=Math.max(0,Math.ceil(Number.isFinite(seconds)?seconds:0));
 const hours=Math.floor(safeSeconds/3600);
 const minutes=Math.floor(safeSeconds%3600/60);
 const secs=safeSeconds%60;
 const displayText=(hours?hours.toString().padStart(2,'0')+':':'')+
  minutes.toString().padStart(2,'0')+':'+secs.toString().padStart(2,'0');
 const ended=closed||(timed&&!paused&&remainingMs<=0);
 const urgency=timed&&!ended&&!paused?(safeSeconds<=5?'critical':safeSeconds<=10?'warning':'normal'):'normal';
 const classes=[
  'arena-power-timer',
  'arena-power-timer--'+mode,
  timed?'is-timed':'is-untimed',
  paused?'is-paused':'',
  ended?'is-ended':'',
  urgency!=='normal'?'is-'+urgency:''
 ].filter(Boolean).join(' ');
 const label=closed?(ar?'النتيجة':'Results'):
  ended?(ar?'انتهى الوقت':'Time is up'):
  paused?(ar?'الوقت متوقف مؤقتًا':'Timer paused'):
  timed?(ar?`متبقي ${safeSeconds} ثانية`:`${safeSeconds} seconds remaining`):
  ar?'بدون توقيت':'Untimed activity';
 return <div className={classes} role="timer" aria-label={label} aria-live="off"
   style={{'--arena-countdown-progress':String(fraction)} as React.CSSProperties}>
  <div className="arena-power-timer__hardware" aria-hidden="true">
   <span className="arena-power-timer__rim"/>
   <span className="arena-power-timer__ticks"/>
   {timed&&<svg className="arena-power-timer__arc" viewBox="0 0 200 200" aria-hidden="true">
    <circle className="arena-power-timer__arc-bed" cx="100" cy="100" r="82"/>
    <circle className="arena-power-timer__arc-live" cx="100" cy="100" r="82" pathLength="100"
     strokeDasharray="100" strokeDashoffset={100*(1-fraction)}/>
   </svg>}
   <span className="arena-power-timer__shine"/>
   <span className="arena-power-timer__hub"/>
  </div>
  <div className="arena-power-timer__readout">
   <span className="arena-power-timer__caption">{ended?(ar?'انتهى الوقت':'TIME UP'):
     paused?(ar?'متوقف مؤقتًا':'PAUSED'):
     timed?(ar?'الوقت المتبقي':'TIME LEFT'):(ar?'بدون توقيت':'YOUR PACE')}</span>
   <span className="arena-power-timer__digits" dir="ltr" key={timed?safeSeconds:'static'}>
    {ended?<Check aria-hidden="true" size={30}/>:paused?<><Pause aria-hidden="true" size={16}/>{displayText}</>:
     timed?displayText:<><Clock3 aria-hidden="true" size={25}/><Zap aria-hidden="true" size={12}/></>}
   </span>
   {timed&&!ended&&<span className="arena-power-timer__indicator" aria-hidden="true">
    {urgency==='critical'?(ar?'اللحظات الأخيرة':'FINAL SECONDS'):
      urgency==='warning'?(ar?'استعد للنهاية':'HURRY UP!'):
      ar?'التحدي مستمر':'CHALLENGE LIVE'}
   </span>}
   {!timed&&!ended&&<span className="arena-power-timer__indicator" aria-hidden="true">
    {ar?'بإيقاع المدرب':'TRAINER PACED'}
   </span>}
  </div>
  {urgency==='critical'&&<span className="arena-power-timer__sr-alert" role="status" aria-live="polite">
   {safeSeconds===5?(ar?'آخر خمس ثواني':'Final five seconds'):""}
  </span>}
 </div>;
}
