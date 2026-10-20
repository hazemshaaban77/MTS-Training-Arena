'use client';
import {useEffect,useRef,useState} from 'react';
import {FastForward,Volume2,VolumeX} from 'lucide-react';
import StageSplash from './StageSplash';
import {siteAsset} from '../../lib/site-path';

export const videoSlugs:Record<string,string>={
 'Quiz':'quiz','Ultimate Game Show':'championship','Wheel of Fortune':'wheel',
 'Spin Wheel':'wheel','Meta Plan':'meta','Categorize':'meta','Escape Room':'escape',
 'Live Poll':'poll','Order It':'order','Open the Box':'box',
 'Flashcards':'cards','Scenario Challenge':'scenario'
};
export const VIDEO_INTRO_SECONDS=9.5;
export function videoIntroSrc(type:string){
 return siteAsset('/cinematic-videos/'+(videoSlugs[type]||'quiz')+'.mp4');
}
export default function ProjectorVideoIntro({type,label,ar,muted,onComplete}:{
 type:string;label:string;ar:boolean;muted:boolean;onComplete:()=>void;
}){
 const ref=useRef<HTMLVideoElement|null>(null);
 const done=useRef(onComplete);done.current=onComplete;
 const [failed,setFailed]=useState(false),[needsGesture,setNeedsGesture]=useState(false);
 const [manuallyMuted,setManuallyMuted]=useState(muted);
 useEffect(()=>setManuallyMuted(muted),[muted]);
 useEffect(()=>{setFailed(false);setNeedsGesture(false);},[type]);
 useEffect(()=>{
  if(failed||!ref.current)return;
  const video=ref.current;let current=true;
  video.muted=manuallyMuted;
  video.play().catch(async()=>{
   if(!current)return;
   try{video.muted=true;setManuallyMuted(true);setNeedsGesture(true);await video.play();}
   catch{if(current)setFailed(true);}
  });
  // Handle stalled videos/404 without trapping projector on a frozen image.
  const watch=window.setTimeout(()=>{if(current&&video.readyState===0)setFailed(true);},5000);
  return()=>{current=false;window.clearTimeout(watch);video.pause();};
 },[type,failed]);
 if(failed)return <StageSplash type={type} label={label} ar={ar}
  preview durationMs={9500} onComplete={()=>done.current()}/>;
 return <div className="projector-video-intro" role="dialog" aria-label={ar?'فيديو مقدمة اللعبة':'Game intro video'}
  aria-modal="false">
  <video ref={ref} key={type} autoPlay playsInline preload="auto" muted={manuallyMuted}
   poster={siteAsset('/activity-art/'+(videoSlugs[type]==='championship'?'ultimate-game-show':
    videoSlugs[type]==='wheel'?'wheel-of-fortune':videoSlugs[type]==='quiz'?'quiz':
    videoSlugs[type]==='meta'?'meta-plan':videoSlugs[type]==='escape'?'escape-room':
    videoSlugs[type]==='poll'?'live-poll':videoSlugs[type]==='order'?'order-it':
    videoSlugs[type]==='box'?'open-the-box':videoSlugs[type]==='cards'?'flashcards':'scenario-challenge')+'.webp')}
   src={videoIntroSrc(type)} onError={()=>setFailed(true)}
   onEnded={()=>done.current()}/>
  <div className="projector-video-intro__controls">
   {needsGesture&&muted===false&&<button type="button" onClick={async()=>{
    const video=ref.current;if(!video)return;
    video.muted=false;setManuallyMuted(false);setNeedsGesture(false);
    try{await video.play();}catch{video.muted=true;setManuallyMuted(true);}
   }}><VolumeX size={16}/>{ar?'تشغيل صوت الفيديو':'Enable video audio'}</button>}
   <button type="button" onClick={()=>done.current()}>
    <FastForward size={16}/>{ar?'تخطي المقدمة':'Skip intro'}</button>
  </div>
 </div>;
}
