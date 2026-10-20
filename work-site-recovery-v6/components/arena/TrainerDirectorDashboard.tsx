'use client';
import {Activity,Clock3,Monitor,Radio,RefreshCw,ScanLine,ShieldCheck,Timer,Users,UserRoundCheck,UserRoundX,Zap} from 'lucide-react';

type Player={uid:string;approval?:string};
type DirectorState={status:string;players:Player[];submitted?:number;queue?:unknown[];current:number;paused?:boolean;deadline?:number|null;serverNow?:number;revision?:number};
type Props={ar:boolean;state:DirectorState;seconds:number;connected:boolean;transport:'live'|'fallback';busy:boolean;onJoinQR:()=>void;onProjector:()=>void;onPrimary:()=>void;onRefresh:()=>void};
export function trainerDirectorStats(s:DirectorState){
 const players=Array.isArray(s.players)?s.players:[];
 return {registered:players.length,approved:players.filter(p=>p.approval==='approved').length,
  pending:players.filter(p=>p.approval==='pending').length,
  rejected:players.filter(p=>p.approval==='rejected').length,
  submissions:Math.max(0,Number(s.submitted)||0),
  totalActivities:s.queue?.length||0,
  activityNumber:Math.max(0,Math.min(s.queue?.length||0,s.current+1))};
}
export default function TrainerDirectorDashboard({ar,state:s,seconds,connected,transport,busy,onJoinQR,onProjector,onPrimary,onRefresh}:Props){
 const t=(a:string,e:string)=>ar?a:e,stats=trainerDirectorStats(s);
 const statusLabels:Record<string,[string,string]>={
  ready:['جاهزة للفتح','Not open yet'],lobby:['استقبال المتدربين','Lobby open'],
  question:['نشاط جارٍ','Round in progress'],results:['عرض النتائج','Results'],
  completed:['انتهت الجلسة','Completed'],archived:['جلسة مؤرشفة','Archived'],survey:['الاستبيان الختامي','End survey']
 };
 const status=statusLabels[s.status]||[s.status,s.status];
 const nextAction=s.status==='ready'?t('افتح استقبال المتدربين','Open the lobby'):
  s.status==='lobby'?t('ابدأ أول نشاط','Start first activity'):
  s.status==='question'?t('اعرض النتائج','Reveal results'):
  s.status==='results'?t(s.current+1<stats.totalActivities?'النشاط التالي':'أنهِ الجلسة',
   s.current+1<stats.totalActivities?'Next activity':'Finish session'):null;
 const timed=s.status==='question'&&!!s.deadline;
 return <section className="trainer-director-dashboard" aria-label={t('لوحة مدير الجلسة المباشرة','Live session director dashboard')}>
  <header className="trainer-director-dashboard__heading">
   <div className="trainer-director-dashboard__label">
    <Zap size={22} aria-hidden="true"/><div><strong>{t('لوحة قيادة المدرب','LIVE DIRECTOR')}</strong>
    <span>{status[ar?0:1]} · {t('النشاط','Activity')} {stats.activityNumber}/{stats.totalActivities}</span></div>
   </div>
   <div className={'trainer-director-dashboard__transport '+(connected?'is-connected':'is-offline')} role="status">
    <Radio size={16} aria-hidden="true"/>{!connected?t('تعذّر تحديث البيانات','Updates unavailable'):
     transport==='live'?t('تحديث لحظي','Live updates'):t('مزامنة احتياطية','Fallback sync')}
   </div>
  </header>
  <div className="trainer-director-dashboard__metrics">
   <div><Users size={17}/><strong>{stats.registered}</strong><span>{t('مسجلون','Registered')}</span></div>
   <div><UserRoundCheck size={17}/><strong>{stats.approved}</strong><span>{t('معتمدون','Approved')}</span></div>
   <div className={stats.pending?'has-pending':''}><UserRoundX size={17}/><strong>{stats.pending}</strong><span>{t('بانتظار القرار','Pending approval')}</span></div>
   <div><Activity size={17}/><strong>{stats.submissions}</strong><span>{t('ردود النشاط الحالي','Current round submissions')}</span></div>
   <div><Timer size={17}/><strong>{timed?(s.paused?t('متوقف','Paused'):`${Math.max(0,seconds)}s`):'—'}</strong>
    <span>{timed?t('الوقت المتبقي','Time left'):t('بدون عداد نشط','No active timer')}</span></div>
  </div>
  <p className="trainer-director-dashboard__disclaimer"><ShieldCheck size={15}/>
   {t('الأعداد من سجلات الجلسة؛ «مسجل» مش معناه متصل حاليًا. الردود حسب تأكيد السيرفر، وليست نسبة حضور.',
      'Counts come from room records, not live device presence. Submissions are server-confirmed, not a unique attendance metric.')}
  </p>
  <div className="trainer-director-dashboard__actions">
   {nextAction&&<button type="button" className="btn primary" disabled={busy} onClick={onPrimary}><Zap size={17}/>{nextAction}</button>}
   <button type="button" className="btn secondary" onClick={onJoinQR}><ScanLine size={17}/>{t('QR الجلسة','Session QR')}</button>
   <button type="button" className="btn secondary" onClick={onProjector}><Monitor size={17}/>{t('فتح البروجيكتور','Open projector')}</button>
   <button type="button" className="btn secondary" onClick={onRefresh} disabled={busy}><RefreshCw size={17}/>{t('تحديث البيانات','Refresh data')}</button>
  </div>
 </section>;
}
