'use client';
import {useEffect,useRef} from 'react';
import {ArrowRight,Clapperboard,FastForward,Sparkles} from 'lucide-react';
import ArenaWorld3D from './ArenaWorld3D';
import {OfficialLogo} from './Brand';
import type {ArenaWheelSector} from '../../lib/arena-wheel-theme';
import {introIdentity} from '../../lib/arena-game-identity';
import {gameIntroBeats} from '../../lib/arena-intro-beats';
import {stageAtmosphere} from '../../lib/arena-cinematics';

const normalized=(type:string)=>type==='Spin Wheel'?'Wheel of Fortune':type==='Categorize'?'Meta Plan':type;
export default function StageSplash({type,label,ar,onComplete,durationMs=4600,preview=false,sectors=[]}:{
 type:string;label:string;ar:boolean;onComplete:()=>void;durationMs?:number;preview?:boolean;sectors?:ArenaWheelSector[]}){
 const finishRef=useRef(onComplete);finishRef.current=onComplete;
 useEffect(()=>{const id=window.setTimeout(()=>finishRef.current(),durationMs);return()=>window.clearTimeout(id);},[type,durationMs]);
 const base=normalized(type),theme=stageAtmosphere(base),identity=introIdentity(base);
 const beats=gameIntroBeats[identity.key];
 return <div className={'stage-splash arena-cinematic-intro cinematic-composed arena-intro-real3d stage-splash-'+base.toLowerCase().replace(/[^a-z0-9]+/g,'-')+' cinematic-'+theme+' intro-kind-'+identity.key}
  role="dialog" aria-label={ar?'مقدمة اللعبة':'Game introduction'} aria-modal="false"
  style={{'--intro-duration':durationMs+'ms'} as React.CSSProperties}>
  <div className="cinematic-lights" aria-hidden="true"><i/><i/><i/></div>
  <div className="cinematic-rule cinematic-rule--top" aria-hidden="true"/>
  <section className="splash-center cinematic-center cinematic-layout">
   <header className="cinematic-kicker">{identity.key==='wheel'?<><OfficialLogo kind="training"/><span>MTS TRAINING ARENA</span><OfficialLogo kind="mts"/></>:<><Sparkles size={16}/><span>MTS TRAINING ARENA</span><Sparkles size={16}/></>}</header>
   <div className="cinematic-content-grid">
    <div className="cinematic-visual-zone">
     <div className="cinematic-art-frame arena-intro-world-frame"><ArenaWorld3D kind={base} mode="intro" sectors={sectors} ar={ar}/></div>
    </div>
    <div className="cinematic-copy">
     <span className="cinematic-caption">{ar?identity.tagAr:identity.tagEn}</span>
     <h2>{label}</h2>
     <p>{ar?identity.introAr:identity.introEn}</p>
     <div className="cinematic-beat-sequence" aria-hidden="true">
      <span className="cinematic-beat-overline">{beats.overline}</span>
      <div className="cinematic-beat-track">
       {(ar?beats.ar:beats.en).map((name,i)=><span key={i} className={'cinematic-beat cinematic-beat-'+i}>
        <b>{String(i+1).padStart(2,'0')}</b>{name}</span>)}
      </div>
     </div>
     <span className="cinematic-start-label"><Clapperboard size={17}/>{preview?
       (ar?'عرض تمهيدي · العداد لم يبدأ':'PRE-ROUND SHOW · TIMER NOT STARTED'):
       (ar?'لحظة انطلاق التحدّي':'THE CHALLENGE BEGINS')}</span>
    </div>
   </div>
   <footer className="cinematic-action">
    <span>{ar?'جاهز تبدأ التحدّي؟':'READY FOR THE CHALLENGE?'}</span>
    <button type="button" onClick={()=>finishRef.current()} className="splash-skip cinematic-skip">
     <FastForward size={15}/>{ar?'تخطي المقدمة':'Skip intro'}<ArrowRight size={15}/>
    </button>
   </footer>
  </section>
  <div className="cinematic-rule cinematic-rule--bottom" aria-hidden="true"/>
  <div className="splash-progress cinematic-progress" aria-hidden="true"/>
 </div>;
}
