'use client';
import {useEffect} from 'react';
import {Zap, Trophy, Boxes, DoorOpen, Dices, Radio, ListOrdered, Gift, GalleryVerticalEnd, Route} from 'lucide-react';
const visuals:Record<string,any>={
 'Quiz':Zap,'Wheel of Fortune':Dices,'Ultimate Game Show':Trophy,
 'Meta Plan':Boxes,'Escape Room':DoorOpen,'Live Poll':Radio,
 'Order It':ListOrdered,'Open the Box':Gift,'Flashcards':GalleryVerticalEnd,'Scenario Challenge':Route,
};
export default function StageSplash({type,label,ar,onComplete}:{type:string;label:string;ar:boolean;onComplete:()=>void}){
 useEffect(()=>{const id=setTimeout(onComplete,1450);return()=>clearTimeout(id);},[type]);
 const Icon=visuals[type]||Zap;
 const identity=type.toLowerCase().replace(/[^a-z0-9]+/g,'-');
 return <div className={'stage-splash stage-splash-'+identity} role="status" aria-live="polite">
  <div className="splash-orbit" aria-hidden="true"><i/><i/><i/></div>
  <div className="splash-center"><span className="splash-overline">MTS TRAINING ARENA · LIVE EXPERIENCE</span>
   <span className="splash-mark"><Icon size={65} strokeWidth={1.7}/></span>
   <h2>{label}</h2>
   <p>{ar?'التحدّي التالي يبدأ الآن':'YOUR NEXT CHALLENGE STARTS NOW'}</p>
   <button type="button" onClick={onComplete} className="splash-skip">{ar?'تخطي المقدمة':'Skip intro'} →</button>
  </div>
  <div className="splash-progress" aria-hidden="true"/>
 </div>;
}
