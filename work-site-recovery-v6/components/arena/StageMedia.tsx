import {useRef} from 'react';
import {resolveArenaMediaUrl} from '../../lib/client';
import {safeYouTubeEmbed} from '../../lib/media-url';
'use client';
export type ArenaMedia={type:'image'|'video';url:string;alt?:string};
export default function StageMedia({media,checkpoint,onCheckpoint}:{media:ArenaMedia|null|undefined;checkpoint?:number;onCheckpoint?:()=>void}){
 const reached=useRef(false);
 if(!media||!['image','video'].includes(media.type)||!/^https:\/\//i.test(media.url||''))return null;
 const youtube=media.type==='video'?safeYouTubeEmbed(media.url):null;
 return <div className={'arena-stage-media '+media.type}>
  {youtube
   ? <iframe src={youtube} title={media.alt||'Training YouTube video'} loading="lazy"
      allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/>
   : media.type==='video'
   ? <video onTimeUpdate={e=>{if(checkpoint!=null&&!reached.current&&e.currentTarget.currentTime>=checkpoint){reached.current=true;e.currentTarget.pause();onCheckpoint?.();}}} onEnded={()=>{if(checkpoint!=null&&!reached.current){reached.current=true;onCheckpoint?.();}}} src={resolveArenaMediaUrl(media.url)} controls playsInline preload="metadata" aria-label={media.alt||'Training activity video'}/>
   : <img src={resolveArenaMediaUrl(media.url)} alt={media.alt||'Training activity illustration'} loading="lazy"/>}
 </div>;
}
