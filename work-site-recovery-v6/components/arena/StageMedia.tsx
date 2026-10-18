'use client';
export type ArenaMedia={type:'image'|'video';url:string;alt?:string};
export default function StageMedia({media}:{media:ArenaMedia|null|undefined}){
 if(!media||!['image','video'].includes(media.type)||!/^https:\/\//i.test(media.url||''))return null;
 return <div className={'arena-stage-media '+media.type}>
  {media.type==='video'
   ? <video src={media.url} controls playsInline preload="metadata" aria-label={media.alt||'Training activity video'}/>
   : <img src={media.url} alt={media.alt||'Training activity illustration'} loading="lazy"/>}
 </div>;
}
