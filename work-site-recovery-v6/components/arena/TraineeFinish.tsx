'use client';
import {Award,CheckCircle2,Crown,Hash,Sparkles,Users,Zap} from 'lucide-react';

/** Participant-focused finale backed exclusively by the already-loaded
 * authoritative scoreboards. Never computes a new score/rank in the client. */
export function ownSessionResult(s:any){
 const id=s?.mine?.id;
 if(!id)return null;
 const board=Array.isArray(s.individual)?s.individual:[];
 const player=board.find((p:any)=>String(p.uid)===String(id));
 const players=Array.isArray(s.players)?s.players:[];
 const ownTeam=players.find((p:any)=>String(p.uid)===String(id))?.team;
 const teams=Array.isArray(s.teams)?s.teams:[];
 const team=s.teamMode&&ownTeam?teams.find((p:any)=>p.team===ownTeam):null;
 const competitive=board.some((p:any)=>Number(p.score)>0);
 return {
  name:String(s.mine.name||player?.name||'').slice(0,80),
  score:player&&Number.isFinite(Number(player.score))?Number(player.score):null,
  rank:competitive&&player&&Number.isInteger(Number(player.rank))?Number(player.rank):null,
  count:board.length,
  teamName:team?String(team.team):null,
  teamRank:team&&Number.isInteger(Number(team.rank))?Number(team.rank):null,
  teamScore:team&&Number.isFinite(Number(team.score))?Number(team.score):null,
  competitive
 };
}

export default function TraineeFinish({s,ar}:{s:any;ar:boolean}){
 const own=ownSessionResult(s);
 if(!own)return null;
 const t=(a:string,e:string)=>ar?a:e;
 const nf=(n:number)=>n.toLocaleString(ar?'ar-EG':'en-US');
 return <section className="trainee-finish" aria-label={t('ملخص مشاركتي','My session results')}>
  <div className="trainee-finish__intro">
   <span className="trainee-finish__icon"><CheckCircle2 size={28}/></span>
   <span className="eyebrow"><Sparkles size={15}/>{t('رحلتك في الأرينا','YOUR ARENA JOURNEY')}</span>
   <h2>{t('مبروك يا ','Well played, ')}{own.name||t('بطل','champion')}!</h2>
   <p>{t('خلصت الجلسة، ودي نتيجتك حسب البيانات المسجلة في المنصة.',
    'The session is complete. Here are your results from the recorded scoreboard.')}</p>
  </div>
  {own.competitive&&own.score!==null?
   <div className="trainee-finish__stats">
    <div className="trainee-finish__stat">
     <Zap size={24}/><span>{t('نقاطك','YOUR POINTS')}</span>
     <strong>{nf(own.score)}</strong>
    </div>
    {own.rank!==null&&<div className="trainee-finish__stat">
     <Award size={24}/><span>{t('مركزك بين الأفراد','YOUR INDIVIDUAL RANK')}</span>
     <strong>#{nf(own.rank)}</strong><small>{t('من ','out of ')}{nf(own.count)}</small>
    </div>}
    {own.teamRank!==null&&<div className="trainee-finish__stat">
     <Users size={24}/><span>{t('مركز فريقك','YOUR TEAM RANK')}</span>
     <strong>#{nf(own.teamRank)}</strong>
     <small>{own.teamName}</small>
    </div>}
   </div>:
   <div className="trainee-finish__participation"><Crown size={25}/>
    <strong>{t('المشاركة هي الإنجاز!','Every contribution counts!')}</strong>
    <p>{t('الجلسة دي مفيهاش نقاط تنافسية مسجلة. شكرًا على تفاعلك ومشاركتك.',
      'No competitive points were recorded for this session. Thank you for taking part.')}</p>
   </div>}
  <div className="trainee-finish__divider"><Hash size={16}/>{t('شوف احتفال التتويج وترتيب المشاركين تحت','The championship ceremony and leaderboard are below')}</div>
 </section>;
}
