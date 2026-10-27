'use client';
import {useEffect,useState} from 'react';
import {ShieldCheck,RotateCcw} from 'lucide-react';
import type {Activity} from '../../lib/catalog';
import {publicActivity} from '../../lib/domain.mjs';
import {showStart,showCommand,showPublic} from '../../lib/championship.mjs';
import ArenaChampionship from './ArenaChampionship';

/** Local UI rehearsal uses the same pure transitions as the Worker.
 * No Worker traffic, real trainee identity, session mutation or score events.
 */
export default function ArenaChampionshipPractice({a,ar,mode}:{a:Activity;ar:boolean;mode:'play'|'host'|'display'}){
 const t=(arabic:string,english:string)=>ar?arabic:english;
 const [show,setShow]=useState<any>(()=>showStart());
 const [deadline,setDeadline]=useState<number|null>(null);
 const [clock,setClock]=useState(Date.now());
 const [roleId,setRoleId]=useState('demo-a');
 const [finished,setFinished]=useState(false);
 const [notice,setNotice]=useState('');
 const players=[
  {uid:'demo-a',name:t('متدرب تجريبي 1','Demo Learner 1'),approval:'approved'},
  {uid:'demo-b',name:t('متدرب تجريبي 2','Demo Learner 2'),approval:'approved'},
  {uid:'demo-c',name:t('متدرب تجريبي 3','Demo Learner 3'),approval:'approved'}
 ];
 useEffect(()=>{
  const id=window.setInterval(()=>setClock(Date.now()),500);
  return()=>window.clearInterval(id);
 },[]);
 useEffect(()=>{
  if(finished||show.phase!=='answering'||!deadline||clock<deadline)return;
  try{const r=showCommand(a,show,'timeout',{},clock,deadline);
   setShow(r.show);setDeadline(r.deadline??null);}
  catch{}
 },[clock,deadline,show,finished,a]);
 function apply(action:string,extra:any={},who=roleId){
  try{
   if(finished)return;
   if(action==='showfinish'){if(show.phase==='answering')throw Error('SHOW_STATE');setFinished(true);return;}
   const dict:Record<string,string>={showcast:'cast',showanswer:'answer',showwithdraw:'withdraw',
    showlifeline:'lifeline',showaudience:'audience'};
   const mapped=dict[action];if(!mapped)throw Error('SHOW_ACTION');
   const now=Date.now();
   const details={...extra,player:action==='showcast'?extra.player:action==='showlifeline'&&mode==='host'?show.current?.player:who,
    attemptId:action==='showcast'?'demo-attempt-'+(show.attempts.length+1):undefined};
   const result=showCommand(a,show,mapped,details,now,deadline);
   setShow(result.show);setDeadline(result.deadline??null);setClock(now);
   setNotice('');
  }catch(e:any){setNotice(t('الإجراء غير متاح في الحالة التجريبية دي.','Action is unavailable in this practice state.'));}
 }
 const s:any={
  status:finished?'results':'question',activity:publicActivity(a),players,show:showPublic(a,show,mode==='play'?roleId:null,mode==='host'),
  deadline,clockNow:clock,serverNow:clock,mine:mode==='play'?{id:roleId,eligible:true}:null
 };
 return <div className="arena-championship-practice">
  <div className="arena-championship-practice__toolbar">
   <strong><ShieldCheck size={17}/>{t('بروفة محلية كاملة · بدون متدربين حقيقيين أو نقاط على السيرفر',
    'Offline rehearsal · No real learners or server scores')}</strong>
   {mode==='play'&&<label>{t('جرّب دور','Practice as')}
    <select value={roleId} onChange={e=>setRoleId(e.target.value)}>
     {players.map(p=><option key={p.uid} value={p.uid}>{p.name}</option>)}
    </select></label>}
   {mode==='play'&&show.phase==='casting'&&!finished&&<button className="btn primary"
    onClick={()=>apply('showcast',{player:roleId})}>
    {t('ابدأ دور المتسابق التجريبي','Start demo contestant run')}</button>}
   <button className="btn secondary" onClick={()=>{setShow(showStart());setDeadline(null);setFinished(false);setNotice('');}}>
    <RotateCcw size={16}/>{t('ابدأ البروفة من أولها','Restart rehearsal')}</button>
  </div>
  {notice&&<p role="status" className="arena-championship-practice__note">{notice}</p>}
  <ArenaChampionship s={s} ar={ar} host={mode==='host'} display={mode==='display'} busy={false}
   onControl={(action,_index,extra)=>apply(action,extra)}
   onInteract={(action,extra)=>apply(action,extra)}/>
 </div>;
}
