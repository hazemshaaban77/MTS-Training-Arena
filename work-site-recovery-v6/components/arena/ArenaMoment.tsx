'use client';
import {Crown,Sparkles,Star,Trophy,Zap} from 'lucide-react';
import type {ArenaMomentKind} from '../../lib/arena-cinematics';

export default function ArenaMoment({kind,ar,light=false}:{kind:ArenaMomentKind;ar:boolean;light?:boolean}){
 const data:Record<ArenaMomentKind,{ar:string;en:string;subAr:string;subEn:string}>={
  champion:{ar:'لحظة الأبطال!',en:'ARENA CHAMPIONS!',subAr:'كل نقطة صنعت اللحظة دي',subEn:'Every point built this moment'},
  lead:{ar:'صدارة جديدة!',en:'A NEW LEADER!',subAr:'الترتيب اتغيّر من بيانات السيرفر',subEn:'Server-confirmed leaderboard change'},
  streak:{ar:'مستوى جديد!',en:'LEVEL UP!',subAr:'التحدي بيزيد إثارة',subEn:'The challenge intensifies'},
  reveal:{ar:'لحظة الحقيقة!',en:'THE BIG REVEAL!',subAr:'النتائج وصلت من السيرفر',subEn:'The results are in'}
 };
 const item=data[kind],Icon=kind==='champion'?Trophy:kind==='lead'?Crown:kind==='reveal'?Sparkles:Star;
 return <div className={'arena-moment arena-moment-'+kind+(light?' arena-moment-lite':'')}
  role="status" aria-live="polite" aria-atomic="true">
  <div className="arena-moment__glow" aria-hidden="true"/>
  <div className="arena-moment__badge"><Icon size={28}/><Zap size={17}/></div>
  <div><strong>{ar?item.ar:item.en}</strong><small>{ar?item.subAr:item.subEn}</small></div>
 </div>;
}
