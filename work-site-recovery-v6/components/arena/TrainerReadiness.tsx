'use client';
import {useState} from 'react';
import {AlertCircle,CheckCircle2,ClipboardCheck,Monitor,Radio,RefreshCw,ShieldCheck,Users,Volume2} from 'lucide-react';

type Props={
 ar:boolean;status:'ready'|'lobby';players:any[];activityCount:number;
 connectionOk:boolean;transport:'live'|'fallback';nextActivity?:string;
 onRefresh:()=>void;
};

/** Host-only preflight. Automatic signals come from session state.
 * Physical media, display, and sound checks are NEVER auto-claimed as verified.
 * This checklist does not create/modify rooms and never blocks launch. */
export default function TrainerReadiness({
 ar,status,players,activityCount,connectionOk,transport,nextActivity,onRefresh
}:Props){
 const t=(arabic:string,english:string)=>ar?arabic:english;
 const [manual,setManual]=useState({materials:false,projector:false,audio:false});
 const [checking,setChecking]=useState(false);
 const approved=players.filter(p=>p.approval==='approved').length;
 const pending=players.filter(p=>p.approval==='pending').length;
 const manualItems=[
  {key:'materials' as const,icon:ShieldCheck,ar:'راجعت الصور والفيديوهات والأسئلة',en:'I reviewed media and questions'},
  {key:'projector' as const,icon:Monitor,ar:'جرّبت شاشة البروجيكتور',en:'I tested the projector screen'},
  {key:'audio' as const,icon:Volume2,ar:'اختبرت الصوت أو اخترت الوضع الصامت',en:'I tested sound or chose silent mode'}
 ];
 const number=manualItems.filter(x=>manual[x.key]).length;
 async function refresh(){
  if(checking)return;
  setChecking(true);
  try{await onRefresh();}finally{setChecking(false);}
 }
 return <section className="trainer-readiness" aria-label={t('فحص جاهزية الجلسة','Session readiness check')}>
  <div className="trainer-readiness__heading">
   <span><ClipboardCheck size={21}/><b>{t('فحص الاستعداد قبل التشغيل','PRE-SESSION READINESS')}</b></span>
   <button className="btn secondary compact" type="button" onClick={refresh} disabled={checking}>
    <RefreshCw size={15}/>{checking?t('جاري التحديث','Refreshing'):t('تحديث الحالة','Refresh status')}
   </button>
  </div>
  <div className="trainer-readiness__signals">
   <div className={connectionOk?'ok':'warning'}>
    {connectionOk?<CheckCircle2 size={19}/>:<AlertCircle size={19}/>}
    <span><strong>{connectionOk?t('اتصال API متاح','API responding'):t('الاتصال غير متاح','Connection unavailable')}</strong>
    <small>{!connectionOk?t('إعادة المحاولة مطلوبة','Retry required'):
      transport==='live'?t('التحديث اللحظي يعمل','Live synchronization'):
        t('تحديث احتياطي يعمل','Fallback synchronization')}</small></span>
   </div>
   <div className={activityCount?'ok':'warning'}>
    {activityCount?<CheckCircle2 size={19}/>:<AlertCircle size={19}/>}
    <span><strong>{activityCount} {t('نشاط في الرحلة','activities in the session')}</strong>
    <small>{nextActivity?t('أول نشاط: ','First: ')+nextActivity:t('راجع محتوى الرحلة','Review the session deck')}</small></span>
   </div>
   <div className={status==='ready'?'neutral':approved?'ok':'warning'}>
    <Users size={20}/>
    <span><strong>{approved} {t('مشارك معتمد','approved participants')}</strong>
    <small>{status==='ready'?t('التسجيل يفتح بعد فتح اللوبي','Registration opens with the lobby'):
      pending?t('طلبات معلقة: ','Pending approvals: ')+pending:
      approved?t('جاهزين لأول نشاط','Ready for the first activity'):
      t('في انتظار دخول المشاركين','Waiting for trainees')}</small></span>
   </div>
  </div>
  <div className="trainer-readiness__checklist">
   <div className="trainer-readiness__checklist-head">
    <span><Radio size={15}/>{t('تأكيدات يدوية من المدرب','TRAINER MANUAL CHECKS')}</span>
    <small>{number}/{manualItems.length}</small>
   </div>
   {manualItems.map(item=><label className="trainer-readiness__check" key={item.key}>
    <input type="checkbox" checked={manual[item.key]}
      onChange={e=>setManual(old=>({...old,[item.key]:e.target.checked}))}/>
    <item.icon size={17}/><span>{t(item.ar,item.en)}</span>
   </label>)}
  </div>
  <p className="trainer-readiness__note"><AlertCircle size={14}/>
   {t('علامات الصح على الأجهزة والوسائط تأكيدك أنت، مش فحص تلقائي. فتح اللوبي مختلف عن بدء أول نشاط.',
      'Media, projector and audio confirmations are yours, not automated device checks. Opening the lobby is different from starting the first activity.')}
  </p>
 </section>;
}
