'use client';
import {useEffect,useRef} from 'react';

/** Projector content uses real CSS viewport layout, never shrinks its entire
 * interface to a few pixels. Previous unbounded scrollHeight-based zoom was
 * self-amplifying on dynamic games, including long championship ladders.
 * This lightweight hook only exposes viewport measurements for CSS. */
export function useProjectorFit(enabled:boolean,renderKey:string){
 const ref=useRef<HTMLElement|null>(null);
 useEffect(()=>{
  if(!enabled||!ref.current)return;
  const shell=ref.current.closest('.session-shell') as HTMLElement|null;
  if(!shell)return;
  let frame=0;
  const update=()=>{
   frame=0;
   // Remove any persisted inline styles from the old auto-fit algorithm.
   if(ref.current){ref.current.style.zoom='';ref.current.style.width='';}
   shell.dataset.projectorFit='native';
   shell.style.setProperty('--projector-height',window.innerHeight+'px');
  };
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};
  schedule();
  window.addEventListener('resize',schedule);
  window.addEventListener('orientationchange',schedule);
  return()=>{
   if(frame)cancelAnimationFrame(frame);
   window.removeEventListener('resize',schedule);
   window.removeEventListener('orientationchange',schedule);
   if(ref.current){ref.current.style.zoom='';ref.current.style.width='';}
   shell.style.removeProperty('--projector-height');
   delete shell.dataset.projectorFit;
  };
 },[enabled,renderKey]);
 return ref;
}
