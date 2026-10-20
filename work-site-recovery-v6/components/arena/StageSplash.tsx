'use client';
import {useEffect,useRef} from 'react';
import {ArrowRight,Clapperboard,FastForward,Sparkles,Zap} from 'lucide-react';
import ActivityArt from './ActivityArt';
import IntroScene from './IntroScene';
import {introIdentity} from '../../lib/arena-game-identity';
import {stageAtmosphere} from '../../lib/arena-cinematics';

const normalized=(type:string)=>type==='Spin Wheel'?'Wheel of Fortune':type==='Categorize'?'Meta Plan':type;
export default function StageSplash({type,label,ar,onComplete,durationMs=4600,preview=false}:{
 type:string;label:string;ar:boolean;onComplete:()=>void;durationMs?:number;preview?:boolean}){
 const finishRef=useRef(onComplete);finishRef.current=onComplete;
 useEffect(()=>{const id=window.setTimeout(()=>finishRef.current(),durationMs);return()=>window.clearTimeout(id);},[type,durationMs]);
 const base=normalized(type),theme=stageAtmosphere(base),identity=introIdentity(base);
 return <div className={'stage-splash arena-cinematic-intro stage-splash-'+base.toLowerCase().replace(/[^a-z0-9]+/g,'-')+' cinematic-'+theme+' intro-kind-'+identity.key}
  role="dialog" aria-label={ar?'مقدمة اللعبة': 'Game introduction'} aria-modal="false"
  style={{'--intro-duration':durationMs+'ms'} as React.CSSProperties}>
  <div className="splash-orbit cinematic-orbits" aria-hidden="true"><i/><i/><i/></div>
  <div className="cinematic-lights" aria-hidden="true"><i/><i/><i/><i/><i/><i/></div>
  <div className="cinematic-particles" aria-hidden="true">{Array.from({length:13},(_,i)=><i key={i}/>)}</div>
  <div className="cinematic-rule cinematic-rule--top" aria-hidden="true"/>
  <div className="splash-center cinematic-center">
   <div className="cinematic-kicker"><Sparkles size={17}/><span>MTS TRAINING ARENA</span><Sparkles size={17}/></div>
   <div className="cinematic-main-art">
    <span className="cinematic-art-ring cinematic-art-ring--outer" aria-hidden="true"/>
    <span className="cinematic-art-ring cinematic-art-ring--inner" aria-hidden="true"/>
    <div className="cinematic-art-frame splash-activity-cover"><ActivityArt activity={base} label={label} eager/></div>
    <span className="cinematic-art-flare" aria-hidden="true"><Zap size={26}/></span>
    <IntroScene kind={identity.key}/>
   </div>
   <div className="cinematic-copy">
    <span className="cinematic-caption">{ar?identity.tagAr:identity.tagEn}</span>
    <h2>{label}</h2>
    <p>{ar?identity.introAr:identity.introEn}</p>
   </div>
   <div className="cinematic-action">
    <span className="cinematic-start-label"><Clapperboard size={17}/>{preview?
      (ar?'العرض التمهيدي · العداد لم يبدأ':'PRE-ROUND SHOW · TIMER NOT STARTED'):
      (ar?'لحظة انطلاق التحدّي':'THE CHALLENGE BEGINS')}</span>
    <button type="button" onClick={()=>finishRef.current()} className="splash-skip cinematic-skip">
     <FastForward size={15}/>{ar?'تخطي المقدمة':'Skip intro'}<ArrowRight size={15}/>
    </button>
   </div>
  </div>
  <div className="cinematic-rule cinematic-rule--bottom" aria-hidden="true"/>
  <div className="splash-progress cinematic-progress" aria-hidden="true"/>
 </div>;
}
