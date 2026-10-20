'use client';
import {useEffect,useRef} from 'react';
import {projectorFitScale} from '../../lib/projector-fit';

/** Fit the actual stage, game artwork, results and lower scoreboard onto ONE viewport.
 * Changes only the projector presentation. Never modifies game-state/score/timer.
 * CSS handles a compact natural layout first; JS handles unpredictably tall games.
 */
export function useProjectorFit(enabled:boolean,renderKey:string){
 const ref=useRef<HTMLElement|null>(null);
 useEffect(()=>{
  if(!enabled)return;
  const el=ref.current;if(!el)return;
  const shell=el.closest('.session-shell') as HTMLElement|null;
  const header=shell?.querySelector('.session-brand-header') as HTMLElement|null;
  if(!shell)return;
  let alive=true,frame=0;
  const measure=()=>{
   frame=0;if(!alive||!el.isConnected)return;
   // Measure the real, unscaled content including game-specific intrinsic height.
   // MutationObserver ignores style attributes, so these writes cannot recurse.
   el.style.zoom='1';
   el.style.width='100%';
   const naturalWidth=Math.max(el.scrollWidth,el.getBoundingClientRect().width,1);
   const naturalHeight=Math.max(el.scrollHeight,el.getBoundingClientRect().height,1);
   const headerHeight=header?.getBoundingClientRect().height||0;
   const scale=projectorFitScale(naturalHeight,naturalWidth,window.innerHeight,window.innerWidth,headerHeight);
   // Width compensation fills the projector horizontally after CSS zoom.
   el.style.width=(100/scale)+'%';
   el.style.zoom=String(scale);
   shell.dataset.projectorFit=scale.toFixed(3);
  };
  const schedule=()=>{if(alive&&!frame)frame=requestAnimationFrame(measure);};
  schedule();
  const mutation=new MutationObserver(schedule);
  mutation.observe(el,{subtree:true,childList:true,characterData:true});
  const resize=new ResizeObserver(schedule);
  resize.observe(shell);
  if(header)resize.observe(header);
  window.addEventListener('resize',schedule);
  window.addEventListener('orientationchange',schedule);
  el.addEventListener('load',schedule,true);
  const afterFont=()=>{if(alive)schedule();};
  document.fonts?.ready.then(afterFont).catch(()=>{});
  return()=>{
   alive=false;if(frame)cancelAnimationFrame(frame);
   mutation.disconnect();resize.disconnect();
   window.removeEventListener('resize',schedule);
   window.removeEventListener('orientationchange',schedule);
   el.removeEventListener('load',schedule,true);
   el.style.width='';el.style.zoom='';
   delete shell.dataset.projectorFit;
  };
 },[enabled,renderKey]);
 return ref;
}
