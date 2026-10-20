'use client';
import {useState,useEffect,useRef} from 'react';
import QRCode from 'qrcode';
import {Zap,ArrowLeft,ArrowUp,ArrowDown,Globe,Users,Monitor,Copy,Check,Play,Pause,Square,SkipForward,Trophy,ScanLine,Clock,Maximize,Volume2,VolumeX,Download,ChevronRight,CheckCircle2,Radio,ShieldCheck,RefreshCw,Flame,Gift,RotateCw,Send,Flag,Home,Target} from 'lucide-react';
import {types,arTypes,presentation,colors,unscored,activityLabel,mainType} from '../../lib/catalog';
import {api,errorText,arenaLiveUrl} from '../../lib/client';
import {siteUrl} from '../../lib/site-path';
import {activityIcons} from './App';
import BrandHeader,{OfficialLogo} from './Brand';
import GamePlay from './GamePlay';import Builder from './Builder';
import StageMedia from './StageMedia';
import StageSplash from './StageSplash';
import ArenaMoment from './ArenaMoment';
import {introHighlight,sceneFromHighlight,canPreviewNext,eligibleMoment,type ArenaMomentKind} from '../../lib/arena-cinematics';
import {ArenaSoundEngine,defaultArenaAudio,readArenaAudio,saveArenaAudio,type ArenaAudioPreferences} from '../../lib/arena-sound';
import ArenaPowerTimer from './ArenaPowerTimer';
import ArenaVictory from './ArenaVictory';
import SessionEntryFeedback from './SessionEntryFeedback';
import TrainerReadiness from './TrainerReadiness';
import TrainerDirectorDashboard from './TrainerDirectorDashboard';
import TraineeFinish from './TraineeFinish';
import ActivityArt from './ActivityArt';
type Props={ar:boolean;view:string;code:string;navigate:(view:string,code?:string)=>void;toggleLanguage:()=>void};
export default function Session({ar,view,code,navigate,toggleLanguage}:Props){
 const t=(a:string,e:string)=>ar?a:e;const host=view==='host',display=view==='display';
 const [splash,setSplash]=useState<string|null>(null),[s,setS]=useState<any>(null),[error,setError]=useState(''),[connected,setConnected]=useState(true),[token,setToken]=useState<string|undefined>(),[name,setName]=useState(''),[team,setTeam]=useState('Lightning'),[joinCode,setJoinCode]=useState(code),[busy,setBusy]=useState(false),[now,setNow]=useState(Date.now()),[qr,setQr]=useState(''),[copied,setCopied]=useState(false),[sound,setSound]=useState(false),[endConfirm,setEndConfirm]=useState(false),[showQR,setShowQR]=useState(false),[editing,setEditing]=useState(false),[quiet,setQuiet]=useState(false),[intensity,setIntensity]=useState('full');
 const [audioPrefs,setAudioPrefs]=useState<ArenaAudioPreferences>(defaultArenaAudio),[previewIntro,setPreviewIntro]=useState<{index:number;key:string}|null>(null),[moment,setMoment]=useState<ArenaMomentKind|null>(null);
 const momentTimer=useRef<ReturnType<typeof setTimeout>|null>(null),previousSnapshot=useRef<any>(null),lastPreview=useRef(''),lastAnswerCue=useRef(''),lastSubmitCue=useRef('');
 const [liveConnection,setLiveConnection]=useState<'live'|'fallback'>('fallback');
 const [employeeId,setEmployeeId]=useState(''),[confirmed,setConfirmed]=useState(false),[recovering,setRecovering]=useState(false),[recoveryInput,setRecoveryInput]=useState(''),[recoveryNote,setRecoveryNote]=useState('');
 const [answerProgress,setAnswerProgress]=useState<{round:number;phase:'sending'|'verifying'|'confirmed'|'uncertain'}|null>(null);
 const answerSendLock=useRef(false);
 useEffect(()=>{const preference=localStorage.getItem('arena-effects');setIntensity(preference|| (window.matchMedia('(max-width:700px)').matches?'light':'full'));setQuiet(localStorage.getItem('arena-quiet')==='true');setAudioPrefs(readArenaAudio());},[]);
 const routeKey=useRef('');routeKey.current=code+view+(token||'');
 const received=useRef(Date.now()),audio=useRef<ArenaSoundEngine|null>(null),lastStatus=useRef(''),lastIntro=useRef(''),lastBeep=useRef(''),lastTraineeRound=useRef('');
 useEffect(()=>{audio.current??=new ArenaSoundEngine();return()=>{audio.current?.close();audio.current=null;if(momentTimer.current)clearTimeout(momentTimer.current);};},[]);
 useEffect(()=>{audio.current?.update({...audioPrefs,enabled:sound});},[audioPrefs,sound]);
 const refreshLatest=useRef<()=>Promise<void>>(async()=>{});
 const refreshIssued=useRef(0),refreshApplied=useRef(0);
 const lastRefreshError=useRef<string|null>(null);
 const eventRefreshTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const lastEventRefresh=useRef(0);
 const viewLatest=useRef(view);viewLatest.current=view;
 const activityLatest=useRef<any>(null);activityLatest.current=s?.activity;

 async function refresh(){
  if(!/^\d{6}$/.test(code))return;
  const seq=++refreshIssued.current;
  const key=code+view+(token||'');
  try{
   const data=await api(`state?code=${code}${host?'&role=host':''}`,undefined,token);
   if(routeKey.current!==key||seq<refreshApplied.current)return;
   refreshApplied.current=seq;
   received.current=Date.now();
   setS((old:any)=>old?.code===data.code&&old.revision>data.revision?old:data);
   setConnected(true);
   // A recovered connection clears only the error raised by polling, not a host action failure.
   if(lastRefreshError.current){const stale=lastRefreshError.current;lastRefreshError.current=null;setError(current=>current===stale?'':current);}
   if(data.teamMode&&!data.teamNames.includes(team))setTeam(data.teamNames[0]);
  }catch(e:any){
   if(routeKey.current!==key||seq<refreshApplied.current)return;
   setConnected(false);
   lastRefreshError.current=e.message;
   setError(e.message);
  }
 }
 refreshLatest.current=refresh;
 useEffect(()=>{setS(null);setError('');lastRefreshError.current=null;setAnswerProgress(null);answerSendLock.current=false;setToken(localStorage.getItem('arena-player-'+code)||undefined);setJoinCode(code);},[code,view]);
 useEffect(()=>{setAnswerProgress(null);},[s?.current]);
 // Event-driven invalidation: host + projector react to EVERY submitted answer
 // immediately; guest devices refresh for stage changes but don't repeatedly
 // re-fetch a room of 80 people on every other player's answer.
 useEffect(()=>{
  if(!/^\d{6}$/.test(code))return;
  const endpoint=arenaLiveUrl(code);
  if(!endpoint)return;
  let alive=true,ws:WebSocket|null=null,attempt=0,retry:ReturnType<typeof setTimeout>|null=null;
  function connect(){
   if(!alive)return;
   try{
    ws=new WebSocket(endpoint!);
    ws.onopen=()=>{if(!alive)return;attempt=0;setLiveConnection('live');refreshLatest.current();};
    ws.onmessage=event=>{
     if(!alive)return;
     try{
      const message=JSON.parse(event.data);
      if(message.type!=='changed')return;
      const type=message.kind;
      const role=viewLatest.current;
      const hasFastBoard=role==='host'||role==='display';
      const autoClose=!!activityLatest.current?.autoClose;
      if(type!=='answer'||hasFastBoard||autoClose){
       if(eventRefreshTimer.current===null){
        const wait=Math.max(90,550-(Date.now()-lastEventRefresh.current));
        eventRefreshTimer.current=setTimeout(()=>{
         eventRefreshTimer.current=null;
         lastEventRefresh.current=Date.now();
         refreshLatest.current();
        },wait);
       }
      }
     }catch{}
    };
    ws.onclose=()=>{
     if(!alive)return;
     setLiveConnection('fallback');
     attempt=Math.min(attempt+1,6);
     retry=setTimeout(connect,Math.min(15000,750*2**attempt));
    };
    ws.onerror=()=>{if(alive)ws?.close();};
   }catch{
    setLiveConnection('fallback');
    attempt=Math.min(attempt+1,6);
    retry=setTimeout(connect,Math.min(15000,750*2**attempt));
   }
  }
  connect();
  function onFocus(){if(alive)refreshLatest.current();}
  document.addEventListener('visibilitychange',onFocus);
  window.addEventListener('online',onFocus);
  return()=>{alive=false;if(retry)clearTimeout(retry);if(eventRefreshTimer.current){clearTimeout(eventRefreshTimer.current);eventRefreshTimer.current=null;}document.removeEventListener('visibilitychange',onFocus);window.removeEventListener('online',onFocus);ws?.close();};
 },[code]);
 useEffect(()=>{
  if(!code)return;
  // Socket remains the normal path. When it fails during a timed learner round,
  // reconcile more often instead of waiting 12s (while bounding backend traffic).
  // Trainer/projector keep the existing 1.4s fallback; lobby keeps 12s.
  const activeLearner=(view==='play'||view==='join')&&!!s?.mine&&s?.status==='question';
  const fallbackMs=host||view==='display'?1400:activeLearner?5000:12000;
  refreshLatest.current();
  const id=setInterval(()=>refreshLatest.current(),liveConnection==='live'?45000:fallbackMs);
  return()=>clearInterval(id);
 },[code,host,view,token,liveConnection,s?.status,!!s?.mine]);
 // Timed rounds complete on schedule even when no audience events arrive.
 useEffect(()=>{
  if(!s?.deadline||s.status!=='question'||s.paused)return;
  const remaining=Math.max(0,s.deadline-(Date.now()+(s.serverNow-received.current)));
  const id=setTimeout(()=>refreshLatest.current(),remaining+140);
  return()=>clearTimeout(id);
 },[s?.deadline,s?.paused,s?.status,s?.code,s?.current]);
 useEffect(()=>{const id=setInterval(()=>setNow(Date.now()),200);return()=>clearInterval(id);},[]);
 useEffect(()=>{
  if(s?.status!=='question'||!s.activity)return;
  // The server countdown begins with the round. Never cover an already-timed
  // answer window with a forced visual intro; stage artwork remains in the UI.
  if(s.deadline){setSplash(null);return;}
  const key=s.code+':'+s.current;
  if(lastIntro.current===key)return;
  lastIntro.current=key;
  setSplash(key);
 },[s?.code,s?.current,s?.status,s?.deadline]);
 // Learners can be scrolled near the old answer button on a small phone.
 // Reset only on a NEW round; do not steal scroll/focus during a response.
 useEffect(()=>{
  if(host||display||!s?.mine||s.status!=='question')return;
  const key=s.code+':'+s.current+':'+s.mine.id;
  if(lastTraineeRound.current===key)return;
  lastTraineeRound.current=key;
  const frame=window.requestAnimationFrame(()=>window.scrollTo({top:0,behavior:'auto'}));
  return()=>window.cancelAnimationFrame(frame);
 },[host,display,s?.code,s?.current,s?.status,s?.mine?.id]);
 useEffect(()=>{if(!code)return;QRCode.toDataURL(siteUrl('join',code),{width:280,margin:2,errorCorrectionLevel:'M',color:{dark:'#091016',light:'#ffffff'}}).then(setQr).catch(()=>setQr(''));},[code]);
 // All fanfares are opt-in, bounded Web Audio cues; never played on page load.
 const remaining=s?.status==='question'?Math.max(0,s.paused?s.remaining:(s.deadline?s.deadline-(now+(s.serverNow-received.current)):0)):0,seconds=Math.ceil(remaining/1000);
 useEffect(()=>{
  if(!s)return;
  const prior=previousSnapshot.current;
  const kind=eligibleMoment(prior,s,host?'host':display?'display':'play');
  if(kind&&(host||display)){
   setMoment(kind);
   if(momentTimer.current)clearTimeout(momentTimer.current);
   momentTimer.current=setTimeout(()=>setMoment(null),kind==='champion'?2900:1900);
   audio.current?.play(kind==='champion'?'victory':kind==='lead'?'lead':'reveal',{quiet:quiet||!!s.runtime?.quiet,light:intensity!=='full'});
  }
  if(s.status==='question'&&prior?.code===s.code&&prior.current!==s.current){
   audio.current?.play('stage',{quiet:quiet||!!s.runtime?.quiet,light:intensity!=='full'});
  }
  if(s.status==='question'&&s.activity?.showFormat==='championship'&&prior?.code===s.code&&
   prior.current===s.current&&s.show?.contestant&&prior.show?.contestant===s.show.contestant&&
   Number.isInteger(s.show?.level)&&s.show.level>Number(prior.show?.level??0)){
   setMoment('streak');
   if(momentTimer.current)clearTimeout(momentTimer.current);
   momentTimer.current=setTimeout(()=>setMoment(null),2000);
   audio.current?.play('level',{quiet:quiet||!!s.runtime?.quiet,light:intensity!=='full'});
  }
  if(s.status==='question'&&s.mine?.answered){
   const key=s.code+':'+s.current+':'+s.mine.id;
   if(lastSubmitCue.current!==key){
    lastSubmitCue.current=key;
    audio.current?.play('lock',{quiet:quiet||!!s.runtime?.quiet,light:intensity!=='full'});
   }
  }
  if(s.status==='results'&&s.keyRevealed&&s.mine?.answered&&s.mine?.correct!==null){
   const key=s.code+':'+s.current+':'+s.mine.id+':'+s.mine.correct;
   if(lastAnswerCue.current!==key){
    lastAnswerCue.current=key;
    audio.current?.play(s.mine.correct?'correct':'incorrect',{quiet:quiet||!!s.runtime?.quiet,light:intensity!=='full'});
   }
  }
  lastStatus.current=s.status;
  previousSnapshot.current=s;
 },[s?.revision,s?.current,s?.status,s?.keyRevealed,s?.mine?.answered,s?.mine?.correct,host,display]);
 useEffect(()=>{
  if(!s)return;
  const scene=sceneFromHighlight(s.runtime?.highlight,s.status,s.current,s.queue?.length||0);
  if(!scene||!display||intensity==='off'||s.runtime?.intensity==='off'){
   setPreviewIntro(null);return;
  }
  if(lastPreview.current===scene.key)return;
  lastPreview.current=scene.key;
  setPreviewIntro(scene);
  audio.current?.play('intro',{quiet:quiet||!!s.runtime?.quiet,light:intensity!=='full'});
 },[s?.runtime?.highlight,s?.status,s?.current,s?.code,display,intensity,s?.runtime?.intensity]);
 useEffect(()=>{
  if(!sound||quiet||s?.runtime?.quiet||s?.status!=='question'||s?.paused||!s?.deadline||seconds>5||seconds<1)return;
  const key=s.code+':'+s.current+':'+seconds;
  if(lastBeep.current===key)return;
  lastBeep.current=key;
  audio.current?.play(seconds===1?'countdown':'tick',{quiet:quiet||!!s.runtime?.quiet,light:intensity!=='full'});
 },[seconds,sound,quiet,s?.status,s?.paused,s?.deadline,s?.current,s?.runtime?.quiet,intensity]);
 async function command(action:string,index?:number,extra:any={}){if(busy)return;setBusy(true);setError('');try{const result=await api('control',{code,revision:s.revision,action,index,...extra});
  if(result.code){navigate('host',result.code);return;}
  if(['spin','respin','reveal','box','selectturn','showcast'].includes(action))
   audio.current?.play(action==='spin'||action==='respin'?'wheel':action==='box'?'mystery':'stage',
    {quiet:quiet||!!s.runtime?.quiet,light:intensity!=='full'});
  await refresh();}catch(e:any){setError(e.message);await refresh();}finally{setBusy(false);setEndConfirm(false);}}
 function beginSession(){
  if(!s||busy)return;
  if(s.status==='ready'){command('launch');return;}
  if(s.status!=='lobby')return;
  const ready=(s.players||[]).filter((p:any)=>p.approval==='approved').length;
  if(ready===0&&!window.confirm(t('لسه مفيش متدربين معتمدين. متأكد إنك عايز تبدأ أول نشاط دلوقتي؟','No approved participants yet. Start the first activity anyway?')))return;
  command(s.settings?.surveyOnly?'survey':'start');
 }
 async function join(e:React.FormEvent){e.preventDefault();if(!code){navigate('join',joinCode);return;}setBusy(true);setError('');try{const data=await api(recovering?'recover':'join',recovering?{code,employeeId,recoveryCode:recoveryInput}:{code,name,employeeId,confirmed,team,language:ar?'ar':'en'},token);localStorage.setItem('arena-player-'+code,data.token);setToken(data.token);setRecoveryNote(data.recoveryCode||'');setCopied(false);navigate('play',code);}catch(e:any){setError(e.message);if(e.message==='ALREADY_REGISTERED')setRecovering(true);}finally{setBusy(false);}}
 // A failed POST response is NOT proof an answer was rejected: the request
 // might have reached the authoritative Worker while the response was lost.
 // Always reconcile an uncertain write with a READ before enabling re-submit.
 async function checkAnswerReceipt(round:number):Promise<any|null>{
  const key=code+view+(token||'');
  try{
   const state=await api(`state?code=${code}`,undefined,token);
   if(routeKey.current!==key)return null;
   received.current=Date.now();
   setConnected(true);
   setS((old:any)=>old?.code===state.code&&old.revision>state.revision?old:state);
   return state.current===round?state:null;
  }catch{return null;}
 }
 async function submit(answer:any){
  if(busy||answerSendLock.current||!s?.mine||s.status!=='question')return;
  const round=s.current;
  answerSendLock.current=true;setBusy(true);setError('');
  setAnswerProgress({round,phase:'sending'});
  try{
   const receipt=await api('answer',{code,round,answer},token);
   if(receipt?.ok!==true)throw Error('API_BAD_RESPONSE');
   // The server accepted the write; never advance counts or grades locally.
   setAnswerProgress({round,phase:'confirmed'});
   if('vibrate' in navigator)navigator.vibrate?.(35);
   await checkAnswerReceipt(round);
  }catch{
   setAnswerProgress({round,phase:'verifying'});
   const state=await checkAnswerReceipt(round);
   setAnswerProgress({round,phase:state?.mine?.answered?'confirmed':'uncertain'});
  }finally{
   answerSendLock.current=false;setBusy(false);
  }
 }
 async function verifyAnswerReceipt(){
  if(!s?.mine||busy||answerSendLock.current)return;
  const round=s.current;
  setAnswerProgress({round,phase:'verifying'});
  const state=await checkAnswerReceipt(round);
  // Safe retry is only offered after the server confirms this round is open
  // and does not contain the player's receipt. The server still enforces
  // first-write-wins for races between a pending POST and any new attempt.
  if(state?.mine?.answered)setAnswerProgress({round,phase:'confirmed'});
  else if(state?.status==='question'&&!state.paused&&state.mine?.eligible&&(!state.deadline||state.deadline>state.serverNow))
   setAnswerProgress(null);
  else setAnswerProgress({round,phase:'uncertain'});
 }
 async function interact(action:string,extra:any={}){if(busy)return;setBusy(true);setError('');try{await api('interact',{code,round:s.current,action,...extra},token);
   if(['showanswer','answer','miniquiz','lifeline','showlifeline','showwithdraw','box'].includes(action))
    audio.current?.play(action==='showlifeline'||action==='lifeline'||action==='box'?'mystery':action==='showwithdraw'?'reveal':'lock',
     {quiet:quiet||!!s.runtime?.quiet,light:intensity!=='full'});
   await refresh();}catch(e:any){setError(e.message);await refresh();}finally{setBusy(false);}}
 async function projection(change:any){await command('projection',undefined,{board:s.runtime.board,quiet:s.runtime.quiet,intensity:s.runtime.intensity,analytics:s.runtime.analytics,...change});}
 async function copy(){try{await navigator.clipboard.writeText(siteUrl('join',code));setCopied(true);setTimeout(()=>setCopied(false),2000);}catch{setShowQR(true);}}
 function fullscreen(){if(!document.fullscreenElement)document.documentElement.requestFullscreen?.().catch(()=>{});else document.exitFullscreen?.();}
 async function toggleSound(){
  if(sound){setSound(false);return;}
  audio.current??=new ArenaSoundEngine();
  audio.current.update({...audioPrefs,enabled:true});
  const unlocked=await audio.current.unlock();
  if(!unlocked){setError('AUDIO_BLOCKED');return;}
  setSound(true);
  audio.current.play('stage',{quiet,light:intensity!=='full'});
 }
 function audioSetting(change:Partial<ArenaAudioPreferences>){
  setAudioPrefs(old=>{const next={...old,...change};saveArenaAudio(next);audio.current?.update({...next,enabled:sound});return next;});
 }
 function exportResults(){const rows=[['Rank','Name','Employee ID','Team','Points'],...s.individual.map((p:any)=>[p.rank,p.name,s.players.find((x:any)=>x.uid===p.uid)?.employeeId||'',s.players.find((x:any)=>x.uid===p.uid)?.team||'',p.score])];const csv='\ufeff'+rows.map(r=>r.map((v:any)=>'"'+String(v).replace(/^[=+@-]/,"'"+'$&').replace(/"/g,'""')+'"').join(',')).join('\r\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download=`MTS-Arena-${code}.csv`;a.click();URL.revokeObjectURL(a.href);}
 const meta=['Meta Plan','Categorize'].includes(s?.activity?.type);
 const isJoined=!!s?.mine?.employeeId&&(view==='play'||view==='join'),closed=s&&['results','completed','survey','archived'].includes(s.status),label=s?.activity?activityLabel(s.activity,ar):'';
 const currentReceipt=answerProgress&&answerProgress.round===s?.current?answerProgress:null;
 return <div className={'session-shell '+(host?'host ':'')+(display?'projector':'')+(isJoined?' trainee':'')+' scene-'+(s?.activity?mainType(s.activity).toLowerCase().replaceAll(' ','-'):'lobby')+' effects-'+(quiet||s?.runtime?.quiet||intensity==='off'||s?.runtime?.intensity==='off'?'off':intensity==='light'||s?.runtime?.intensity==='light'?'light':'full')}>
  <BrandHeader className="session-brand-header"><span className="wordmark">MTS TRAINING ARENA</span><div className="session-header-actions">{host&&<button type="button" className="trainer-home-button" aria-label={t('الرجوع للصفحة الرئيسية','Back to home')} onClick={()=>navigate('home')}><Home size={17}/><span>{t('الصفحة الرئيسية','Home')}</span></button>}{code&&<span className="session-code"><ScanLine size={15}/><b dir="ltr">{code}</b></span>}{s&&<span className={'connection '+(!connected?'offline':'')}><i/>{connected?(liveConnection==='live'?t('مباشر لحظيًا','LIVE · INSTANT'):t('متصل · وضع احتياطي','Connected · fallback')):t('إعادة الاتصال…','Reconnecting…')}</span>}<button className="language" onClick={toggleLanguage}><Globe size={14}/>{ar?'EN':'عربي'}</button>{(host||display)&&<button className="icon-button" aria-label={t('ملء الشاشة','Fullscreen')} onClick={fullscreen}><Maximize size={18}/></button>}</div></BrandHeader>
  {previewIntro&&display&&s?.queue?.[previewIntro.index]&&
   <StageSplash key={previewIntro.key} preview type={mainType(s.queue[previewIntro.index])}
    label={activityLabel(s.queue[previewIntro.index],ar)} ar={ar}
    durationMs={intensity==='light'?2800:5200} onComplete={()=>setPreviewIntro(null)}/>}
  {moment&&(host||display)&&<ArenaMoment kind={moment} ar={ar} light={intensity!=='full'}/>}
  {splash&&(host||display||isJoined)&&s?.status==='question'&&s?.activity&&<StageSplash key={splash} type={mainType(s.activity)} label={activityLabel(s.activity,ar)} ar={ar} durationMs={display?2300:host?1450:1100} onComplete={()=>{setSplash(null);if(isJoined)window.scrollTo({top:0,behavior:'auto'});}}/>}
  {error&&s&&<div className="error-banner live-error" role="alert">{errorText(error,ar)}<button onClick={()=>{setError('');refresh();}}><RefreshCw size={14}/>{t('إعادة المحاولة','Retry')}</button></div>}
  {!code?<main className="join-page"><div className="join-orbit"/><div className="join-card"><span className="big-zap"><Zap size={40} fill="currentColor"/></span><p className="join-brandline">{t('حيث يتحول التدريب إلى إبداع','Where training becomes creativity')}</p><span className="eyebrow">YOUR NEXT CHALLENGE AWAITS</span><h1>{t('مكانك في الساحة.','Your place in the arena.')}</h1><p className="muted">{t('ادخل بكود الجلسة أو امسح QR اللي على شاشة المدرب.','Enter a session code or scan the QR on your trainer’s screen.')}</p><form onSubmit={join}><label>{t('كود الجلسة','Session code')}<input className="code-input" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required placeholder="000000" dir="ltr" value={joinCode} onChange={e=>setJoinCode(e.target.value.replace(/\D/g,''))}/></label><button className="btn primary wide" type="submit"><ArrowLeft size={18}/>{t('دخول الساحة','Enter the arena')}</button></form><p className="private-note"><ShieldCheck size={14}/>{t('نسخة خاصة للتجربة بحسابك المصرّح له.','Private trial for your authorised account.')}</p></div></main>:!/^\d{6}$/.test(code)?<SessionEntryFeedback ar={ar} kind="invalid" onChangeCode={()=>navigate('join')}/>:!s?(error?<SessionEntryFeedback ar={ar} kind={['NOT_FOUND','CODE'].includes(error)?'not-found':'unavailable'} onRetry={()=>{setError('');refresh();}} onChangeCode={()=>navigate('join')}/>:<div className="waiting-load"><span className="loader"/>{t('بنوصل للساحة…','Connecting to the arena…')}</div>):(!host&&!display&&!isJoined)&&['ready','draft'].includes(s.status)?<SessionEntryFeedback ar={ar} kind="not-ready" title={s.title} onRetry={()=>refresh()} onChangeCode={()=>navigate('join')}/>:(!host&&!display&&!isJoined)?<main className="join-page"><div className="join-orbit"/><div className="join-card"><span className="status-pill lobby"><i className="live-dot"/>{t('ساحة جاهزة','ARENA READY')}</span><p className="join-brandline">{t('حيث يتحول التدريب إلى إبداع','Where training becomes creativity')}</p><h1>{s.title}</h1><p className="muted">{t('مسحة واحدة. تحدّيات كتير. أنت جاهز؟','One scan. Many challenges. Are you ready?')}</p>{s.status==='completed'?<><div className="info-banner">{t('الجلسة انتهت. تقدر تشوف النتائج.','The session has ended. You can view the results.')}</div><Leaderboard s={s} ar={ar}/></>:<form onSubmit={join}>{!recovering&&<label>{t('الاسم بالكامل','Full name')}<input maxLength={40} required autoComplete="name" placeholder={t('اكتب اسمك هنا','Enter your name')} value={name} onChange={e=>setName(e.target.value)}/></label>}<label>{t('لغة المشاركة','Participation language')}<select value={ar?'ar':'en'} onChange={e=>{if((e.target.value==='ar')!==ar)toggleLanguage();}}><option value="ar">العربية</option><option value="en">English</option></select></label><label>{t('الرقم الوظيفي','Employee ID')}<input required dir="ltr" maxLength={30} autoComplete="off" placeholder={t('اكتب الرقم الوظيفي','Enter your employee ID')} value={employeeId} onChange={e=>{setEmployeeId(e.target.value);setConfirmed(false);}}/></label>{recovering?<label>{t('كود استرجاع المشاركة','Participation recovery code')}<input required dir="ltr" autoComplete="off" value={recoveryInput} onChange={e=>setRecoveryInput(e.target.value)} placeholder="XXXXX-XXXXX-XXXXX-XXXXX"/></label>:s.teamMode&&<label>{t('اختار فريقك','Choose your team')}<select value={team} onChange={e=>setTeam(e.target.value)}>{s.teamNames.map((team:string)=><option key={team} value={team}>{team==='Lightning'?t('فريق البرق','Lightning'):team==='Wave'?t('فريق الموج','Wave'):team}</option>)}</select></label>}{!recovering&&<div className="identity-confirmation"><span className="identity-step">{t('تأكيد بيانات الدخول','CONFIRM YOUR DETAILS')}</span><p><b>{name||t('اسمك','Your name')}</b><span dir="ltr">{employeeId||'—'}</span></p><label className="checkbox-label"><input type="checkbox" checked={confirmed} required onChange={e=>setConfirmed(e.target.checked)}/><span>{t('أؤكد إن الاسم والرقم الوظيفي صحيحين.','I confirm my name and employee ID are correct.')}</span></label></div>}<button className="btn primary wide" disabled={busy||(!recovering&&!confirmed)}><ShieldCheck size={18}/>{recovering?t('استرجاع مشاركتي','Restore my participation'):t('تأكيد الدخول والانضمام','Confirm & join the arena')}</button><button type="button" className="text-button recovery-link" onClick={()=>{setRecovering(!recovering);setError('');}}>{recovering?t('أنا مشارك جديد','I am a new participant'):t('مسجل من جهاز تاني؟ استرجع مشاركتك','Registered on another device? Restore your place')}</button>{['question','results'].includes(s.status)&&<p className="small muted">{t('الجلسة بدأت. المدرب يراجع طلبك قبل المشاركة من النشاط القادم.','Session is live. Your trainer must approve your request before the next activity.')}</p>}</form>}<p className="private-note"><ShieldCheck size={14}/>{t('الجلسة خاصة، والدخول بالحساب المصرّح له.','Private session. Authorised account access required.')}</p></div></main>:<main className="live-workspace">
   <div className="live-title"><div><span className="eyebrow">{host?'MISSION CONTROL':display?'THE MAIN STAGE':'YOU ARE IN THE ARENA'}</span><h1>{s.title}</h1></div><div className="live-title-actions">{host&&<><button className="btn secondary compact" onClick={()=>window.open(siteUrl('join',code),'_blank','noopener')}><Users size={16}/>{t('جرّب كمتدرب','Try as trainee')}</button><button className="btn secondary compact" onClick={()=>window.open(siteUrl('display',code),'_blank','noopener')}><Monitor size={16}/>{t('شاشة العرض','Open display')}</button></>}{isJoined&&<span className="player-pill"><span className="avatar">{s.mine.name.charAt(0)}</span>{s.mine.name}{!meta&&<b>{s.individual.find((p:any)=>p.uid===s.mine.id)?.score||0} <Zap size={12}/></b>}</span>}</div></div>
   {host&&<TrainerDirectorDashboard ar={ar} state={s} seconds={seconds}
    connected={connected} transport={liveConnection} busy={busy}
    onJoinQR={()=>setShowQR(true)}
    onProjector={()=>window.open(siteUrl('display',code),'_blank','noopener')}
    onPrimary={()=>{
     if(['ready','lobby'].includes(s.status))beginSession();
     else if(s.status==='question')command('close');
     else if(s.status==='results')command(s.current+1<s.queue.length?'next':'finish');
    }}
    onRefresh={()=>refresh()}/>}
   {host&&['ready','lobby'].includes(s.status)&&<TrainerReadiness
    key={code} ar={ar} status={s.status} players={s.players} activityCount={s.queue?.length||0}
    connectionOk={connected} transport={liveConnection}
    nextActivity={s.queue?.[0]?activityLabel(s.queue[0],ar):undefined}
    onRefresh={()=>refresh()}/>}
   <div className="session-progress"><span>{s.status==='completed'?t('اكتملت الرحلة','JOURNEY COMPLETE'):s.status==='lobby'?t('قبل الانطلاق','BEFORE TAKEOFF'):`${t('النشاط','ACTIVITY')} ${s.current+1} / ${s.queue.length}`}</span><div>{s.queue.map((a:any,i:number)=><i key={i} className={i<s.current||s.status==='completed'?'done':i===s.current?'current':''}/>)}</div><span><Users size={14}/>{s.players.length}/80</span></div>
   {host&&<div className="director-bar">{canPreviewNext(s.status,s.current,s.queue?.length||0)&&
    <button type="button" className="btn primary compact arena-pre-intro" disabled={busy}
     onClick={()=>command('highlight',undefined,{index:introHighlight(s.current+1,Date.now())})}>
     <Play size={17}/>{t('اعرض انترو التحدي التالي','Play next game intro')}</button>}
    {!['completed','archived'].includes(s.status)&&<button className="btn secondary compact" onClick={()=>setEditing(true)}><Zap size={15}/>{t('تحرير القادم','Edit future')}</button>}<button className="btn secondary compact" onClick={()=>command('duplicate')}><Copy size={15}/>{t('نسخة جديدة','Duplicate')}</button>{s.status==='completed'&&<button className="btn secondary compact" onClick={()=>command('archive')}>{t('أرشفة','Archive')}</button>}{s.status==='completed'&&s.surveyOpen&&<button className="btn secondary compact" onClick={()=>command('closesurvey')}>{t('غلق الاستبيان','Close survey')}</button>}<button className="btn secondary compact" onClick={()=>projection({board:!s.runtime.board})}><Trophy size={15}/>{s.runtime.board?t('إخفاء الترتيب','Hide leaderboard'):t('إظهار الترتيب','Show leaderboard')}</button><button className="btn secondary compact" onClick={()=>projection({quiet:!s.runtime.quiet})}>{s.runtime.quiet?<VolumeX size={15}/>:<Volume2 size={15}/>} Quiet Mode</button><select aria-label="Effects intensity" value={s.runtime.intensity} onChange={e=>projection({intensity:e.target.value})}><option value="full">{t('حركة كاملة','Full effects')}</option><option value="light">{t('حركة خفيفة','Light effects')}</option><option value="off">{t('بدون حركة','No effects')}</option></select>{meta&&<button className="btn secondary compact" onClick={()=>projection({analytics:!s.runtime.analytics})}>{t('إحصاءات العرض','Project analytics')}</button>}</div>}{host&&s.players.some((p:any)=>p.approval==='pending')&&<div className="pending-requests"><h3>{t('طلبات انضمام متأخرة','Late join requests')}</h3>{s.players.filter((p:any)=>p.approval==='pending').map((p:any)=><div key={p.uid}><b>{p.name}</b><span>{p.employeeId}</span><button className="btn primary compact" onClick={()=>command('approve',undefined,{player:p.uid})}>{t('اعتماد من النشاط القادم','Approve for next activity')}</button><button className="text-button" onClick={()=>command('reject',undefined,{player:p.uid})}>{t('رفض','Decline')}</button></div>)}</div>}{isJoined&&s.mine.approval==='pending'&&<div className="info-banner">{t('أنت في انتظار موافقة المدرب. خليك هنا.','Waiting for trainer approval. Stay here.')}</div>}<div className="live-columns"><section className="main-stage">{s?.activity&&['question','results'].includes(s.status)&&<div className="stage-activity-identity"><ActivityArt activity={s.activity} label={label} className="stage-current-cover" eager/><div><small>{t('النشاط الحالي','NOW PLAYING')}</small><strong>{label}</strong></div></div>}{display&&s.runtime.board&&!meta&&s.activity?.type!=='Live Poll'&&<div className="projector-leaderboard"><Leaderboard s={s} ar={ar}/></div>}
    {['lobby','ready'].includes(s.status)?<div className="lobby-stage"><div className="lobby-beacon"><Radio size={47}/><span/><span/></div><span className="pill">{t('كلنا في نفس الساحة','ONE ROOM. ONE SHARED JOURNEY.')}</span><h2>{isJoined?t('مكانك في الأرينا محفوظ. استعد!','Your place in the arena is secured!'):t('اجمع الفريق. وابدأ الحكاية.','Bring everyone in. Start something great.')}</h2><p className="muted">{isJoined?t('المدرب هيبدأ أول تحدّي. خليك هنا، كل الأنشطة هتوصلك تلقائيًا.','Your trainer will launch the first challenge. Stay here; every activity comes to you.'):t('امسح QR واحد، واكمل كل الأنشطة من نفس المكان.','Scan one QR and play every activity from the same place.')}</p>{!isJoined&&qr&&s.status==='lobby'&&<div className="lobby-qr"><img src={qr} alt={t('QR دخول الجلسة','Session join QR')}/><div><span>{t('كود الدخول','JOIN CODE')}</span><b dir="ltr">{code}</b><button className="text-button" onClick={copy}>{copied?<Check size={16}/>:<Copy size={16}/>} {copied?t('اتنسخ','Copied'):t('نسخ رابط الدخول','Copy join link')}</button></div></div>}<div className="players-cloud">{s.players.map((p:any,i:number)=><span key={p.uid} style={{animationDelay:`${i*.05}s`}}><i className={'player-dot '+(p.team==='Wave'?'cyan':'lime')}>{p.name.charAt(0)}</i>{p.name}</span>)}{!s.players.length&&<span className="muted">{t('أول منافس لسه في الطريق…','Your first challenger is on the way…')}</span>}</div>{host&&<button className="btn primary large launch" disabled={busy} onClick={beginSession}><Play fill="currentColor" size={21}/>{s.status==='ready'?t('افتح استقبال المتدربين والـQR','Open participant lobby & QR'):t('ابدأ أول نشاط','Start first activity')}</button>}{isJoined&&<><div className="waiting-slogan" role="status"><span className="waiting-slogan-en">MTS TRAINING ARENA</span><strong>{t('حيث يتحول التدريب إلى إبداع','Where training becomes creativity')}</strong><small>{t('جهّز نفسك، التحدّي هيبدأ بمجرد إشارة المدرب.','Get ready. Your trainer will start the challenge shortly.')}</small></div><div className="waiting-pulse"><i/><i/><i/>{t('في انتظار المدرب','Waiting for your trainer')}</div></>}</div>:s.status==='survey'?<Survey s={s} ar={ar} host={host} display={display} token={token} command={command} refresh={refresh}/>:['completed','archived'].includes(s.status)?s.surveyOnly?<div className="survey-stage survey-thanks"><CheckCircle2 size={55}/><h2>{t('شكرًا لمشاركتك. رأيك يصنع الفرق.','Thank you. Your voice makes a difference.')}</h2>{isJoined&&<Survey s={s} ar={ar} host={false} display={false} token={token} command={command} refresh={refresh}/>}</div>:<div className="final-stage">{isJoined&&<TraineeFinish s={s} ar={ar}/>}<div className="final-brand-pair"><OfficialLogo kind="mts"/><OfficialLogo kind="training"/></div><ArenaVictory s={s} ar={ar}/><div className="arena-victory__leaderboard-heading"><Trophy size={20}/>{t('ترتيب الأبطال','CHAMPIONS LEADERBOARD')}</div><Leaderboard s={s} ar={ar} podium/>{isJoined&&s.survey&&!s.surveySubmitted&&s.surveyOpen&&<Survey s={s} ar={ar} host={false} display={false} token={token} command={command} refresh={refresh}/>} {host&&<button className="btn secondary" onClick={exportResults}><Download size={17}/>{t('تحميل النتائج CSV','Download results CSV')}</button>}</div>:<div className="round-stage" key={s.current}>
     <div className="round-meta"><span className={'activity-label '+colors[types.indexOf(mainType(s.activity))]||'cyan'}>{label}</span><ArenaPowerTimer seconds={seconds} remainingMs={remaining} totalSeconds={Number(s.activity.timer)||1} timed={!!s.deadline||!!s.paused&&Number(s.remaining)>0} paused={!!s.paused} closed={!!closed} ar={ar} mode={display?'display':host?'host':'play'}/></div><div className={'timer-track '+(!s.deadline?'no-timer':'')} aria-hidden="true"><i style={{width:closed?'100%':`${Math.max(0,Math.min(100,remaining/(Math.max(1,s.activity.timer)*1000)*100))}%`}}/></div>
     <h2 className="question-prompt">{s.activity.prompt}</h2><StageMedia media={s.activity.media}/>{s.activity.type==='Scenario Challenge'&&<div className="scenario-intro"><Target size={18}/>{t('فكّر في الموقف. اختار القرار اللي يفرق.','Read the situation. Choose the decision that matters.')}</div>}
     {s.paused&&<div className="info-banner"><Pause size={17}/>{t('وقفة سريعة. المدرب هيكمّل حالًا.','A quick pause. Your trainer will resume shortly.')}</div>}
     {isJoined&&!s.mine.eligible&&!closed&&<div className="info-banner">{s.mine.approval==='pending'?t('طلبك في انتظار موافقة المدرب.','Your request is awaiting trainer approval.'):s.mine.approval==='rejected'?t('المدرب لم يعتمد طلب الدخول.','Your join request was declined.'):s.runtime.targets?.length?t('الجمهور جزء من التحدّي. تابع نجوم المرحلة وشارك في التصويت.','You are in the audience. Follow the contestants and share your vote.'):t('انضمامك مؤكد. المشاركة من النشاط القادم.','You are approved. Play begins with the next activity.')}</div>}
     <GamePlay key={s.current} s={{...s,clockNow:now+(s.serverNow-received.current)}} ar={ar} host={host} display={display} canAnswer={isJoined&&s.mine.eligible&&(!s.mine.answered||s.activity.type==='Live Poll'&&s.activity.allowChanges)&&!closed&&!s.paused&&(!s.deadline||seconds>0)&&!busy&&connected&&!(currentReceipt&&(currentReceipt.phase!=='confirmed'||!s.mine.answered))} busy={busy} onSubmit={submit} onInteract={interact} onControl={command}/>
     {isJoined&&s.status==='question'&&currentReceipt&&!(currentReceipt.phase==='confirmed'&&s.mine.answered)&&<div className={'trainee-answer-receipt '+currentReceipt.phase} role="status" aria-live="polite">
      {currentReceipt.phase==='sending'?<><span className="loader"/>{t('جاري إرسال إجابتك…','Sending your answer…')}</>:
       currentReceipt.phase==='verifying'?<><RefreshCw size={20}/>{t('بنتحقق من حالة الإجابة على السيرفر…','Checking your answer on the server…')}</>:
       currentReceipt.phase==='confirmed'?<><CheckCircle2 size={20}/>{t('السيرفر أكد تسجيل إجابتك','The server confirmed your answer')}</>:
       <><ShieldCheck size={20}/><span>{t('الاتصال انقطع قبل ما نتأكد من وصول الإجابة. ما تبعتش تاني قبل ما نتحقق.','Connection failed before we could confirm your answer. Check receipt before trying again.')}</span><button className="btn secondary" disabled={busy} onClick={verifyAnswerReceipt}><RefreshCw size={16}/>{t('تحقق من وصول الإجابة','Check answer receipt')}</button></>}
     </div>}
     {isJoined&&s.mine.answered&&!closed&&s.activity.type!=='Live Poll'&&<div className="answer-sent"><CheckCircle2 size={26}/><div><b>{t('إجابتك اتسجلت!','You’re locked in!')}</b><span>{t('استنى النتيجة. التحدّي لسه مكمل.','Results are coming. The challenge continues.')}</span></div></div>}
     {isJoined&&!meta&&s.activity.type!=='Live Poll'&&s.keyRevealed&&s.mine.answered&&<div className={'answer-result '+(s.mine.correct?'correct':s.activity.type==='Live Poll'?'':'incorrect')}><b>{s.mine.points?`+${s.mine.points.toLocaleString()}`:unscored(s.activity.type)?'✓':'+0'}</b><span>{s.mine.correct?t('إجابة صح. حماس يستاهل!','Correct. That’s arena energy!'):s.activity.type==='Live Poll'?t('رأيك جزء من الصورة.','Your voice is part of the picture.'):t('محاولة مهمة. ركّز على اللي جاي!','Every attempt counts. Focus on the next one!')}</span>{!!s.mine.correct&&<Confetti/>}</div>}
     <div className="round-footer"><span><Users size={15}/>{s.submitted} {t('إجابة مسجلة','answers in')}</span><span>{unscored(s.activity.type)?t('تعلّم ومشاركة · بدون نقاط','Learning & participation · Unscored'):t('نقاط موثوقة بوزن النشاط وإعداداته','Server scoring · Configured activity weight')}</span></div>
     {host&&<div className="trainer-controls">{!closed?<><button className="btn secondary" disabled={busy||!!s.deadline&&!seconds} onClick={()=>command(s.paused?'resume':'pause')}>{s.paused?<Play size={17}/>:<Pause size={17}/>} {s.paused?t('استكمال','Resume'):t('وقفة','Pause')}</button>{!!s.deadline&&<button className="btn secondary" disabled={busy||s.paused||!seconds} onClick={()=>command('addtime')}>+10s</button>}<button className="btn primary" disabled={busy} onClick={()=>command('close')}><Flag size={18}/>{t('اقفل واعرض النتيجة','Close & reveal results')}</button></>:<>{!s.keyRevealed&&<button className="btn secondary" disabled={busy} onClick={()=>command('revealkey')}>{s.activity.type==='Live Poll'?t('إظهار الرسم البياني','Reveal vote chart'):t('كشف الإجابات','Reveal answers')}</button>}<button className="btn primary large" disabled={busy} onClick={()=>command(s.current+1<s.queue.length?'next':'finish')}><SkipForward size={19}/>{s.current+1<s.queue.length?t('التحدّي الجاي','Next challenge'):t('لحظة التتويج','Reveal the champions')}</button>{s.current+1<s.queue.length&&<button className="text-button" onClick={()=>setEndConfirm(true)}>{t('إنهاء الجلسة','End session')}</button>}</>}</div>}{isJoined&&closed&&s.activity.type!=='Live Poll'&&<div className="waiting-pulse"><i/><i/><i/>{t('المدرب بيجهّز الخطوة الجاية','Your trainer is preparing what’s next')}</div>}
    </div>}
   </section>{!display&&<aside className="live-rail">{s.status!=='completed'&&!meta&&s.activity?.type!=='Live Poll'&&(host||s.runtime.board)&&<div className="rail-card"><div className="section-heading"><h3><Trophy size={18}/>{t('الصدارة','Leaderboard')}</h3><span className="live-mini">LIVE</span></div><Leaderboard s={s} ar={ar}/></div>}<div className="rail-card queue-card"><div className="section-heading"><h3><Zap size={17}/>{t('مسار الجلسة','The journey')}</h3><b>{s.queue.length}</b></div>{s.queue.map((a:any,i:number)=>{const idx=types.indexOf(mainType(a)),Icon=activityIcons[idx]||Zap;return <div className={'queue-item '+(i===s.current?'selected':'')+(i<s.current||s.status==='completed'?' finished':'')} key={i}><span>{i<s.current||s.status==='completed'?<Check size={14}/>:String(i+1).padStart(2,'0')}</span><ActivityArt activity={a} label={activityLabel(a,ar)} className="queue-cover"/><div><b>{activityLabel(a,ar)}</b><small>{a.timer}s</small></div>{i===s.current&&<i className="live-dot"/>}</div>;})}</div>{host&&s.status!=='lobby'&&s.status!=='completed'&&<button className="btn secondary wide" onClick={()=>setShowQR(true)}><ScanLine size={17}/>{t('QR الجلسة','Session QR')}</button>}{host&&<p className="rail-note"><ShieldCheck size={15}/>{t('النقاط من الخادم. نفس الجلسة على كل الأجهزة.','Server-scored. The same session across devices.')}</p>}</aside>}</div>
   {display&&s.status!=='lobby'&&s.status!=='completed'&&<div className="display-bottom"><div><Trophy size={22}/><b>{t('في الصدارة','LEADING THE ARENA')}</b></div>{s.individual.slice(0,3).map((p:any)=><span key={p.uid}><b>#{p.rank}</b>{p.name}<strong>{p.score.toLocaleString()}</strong></span>)}</div>}
  </main>}
  {recoveryNote&&<div className="modal-backdrop"><section className="small-modal modal recovery-welcome" role="dialog" aria-modal="true"><CheckCircle2 size={37}/><h2>{t('تم تأكيد مشاركتك','Your place is confirmed')}</h2><p className="muted">{t('احتفظ بالكود ده. هتحتاجه لو عايز تكمل مشاركتك ونقاطك من جهاز تاني.','Keep this code. Use it to continue your participation and scores on another device.')}</p><code className="recovery-code" dir="ltr">{recoveryNote}</code><button type="button" className="btn secondary wide recovery-copy-button" onClick={async()=>{try{await navigator.clipboard.writeText(recoveryNote);setCopied(true);}catch{setCopied(false);}}}>{copied?<Check size={17}/>:<Copy size={17}/>} {copied?t('تم نسخ الكود','Recovery code copied'):t('نسخ كود استرجاع المشاركة','Copy recovery code')}</button><p className="small muted">{t('هيظهر دلوقتي بس. ما تشاركوش مع حد.','Shown only now. Keep it private.')}</p><button className="btn primary wide" onClick={()=>setRecoveryNote('')}>{t('احتفظت بالكود — دخول الساحة','I saved my code — enter the arena')}</button></section></div>}
  {(showQR||endConfirm)&&<div className="modal-backdrop"><section className="small-modal modal" role="dialog" aria-modal="true"><h2>{endConfirm?t('ننهي المنافسة هنا؟','End the session here?'):t('دخول واحد لكل التحدّيات','One entry. Every challenge.')}</h2>{endConfirm?<><p className="muted">{t('النتائج الحالية هتتحفظ، والأنشطة المتبقية مش هتبدأ.','Current results will be saved. Remaining activities will not run.')}</p><div className="hero-actions"><button className="btn secondary" onClick={()=>setEndConfirm(false)}>{t('كمّل الجلسة','Keep playing')}</button><button className="btn primary" onClick={()=>command('finish')}>{t('اعرض النتائج النهائية','Show final results')}</button></div></>:<>{qr&&<img className="modal-qr" src={qr} alt="Session QR"/>}<b className="large-code" dir="ltr">{code}</b><input readOnly dir="ltr" value={typeof window!=='undefined'?siteUrl('join',code):''}/><button className="btn secondary wide" onClick={copy}>{copied?<Check size={17}/>:<Copy size={17}/>} {t('نسخ الرابط','Copy link')}</button><button className="text-button" onClick={()=>setShowQR(false)}>{t('رجوع للساحة','Back to the arena')}</button></>}</section></div>}
  <div className="local-effects-controls">
   <button className="text-button" onClick={()=>{localStorage.setItem('arena-quiet',String(!quiet));setQuiet(!quiet);}}>{quiet?'Quiet ✓':'Quiet'}</button>
   <select aria-label={t('شدة المؤثرات البصرية','Visual intensity')} value={intensity}
    onChange={e=>{localStorage.setItem('arena-effects',e.target.value);setIntensity(e.target.value);}}>
    <option value="full">{t('سينمائي كامل','Full cinematic')}</option>
    <option value="light">{t('متوازن','Balanced')}</option>
    <option value="off">{t('خفيف / بدون حركة','Lite / No motion')}</option>
   </select>
   {(host||display||isJoined)&&<details className="arena-sound-panel">
    <summary><Volume2 size={15}/>{t('إعدادات الصوت','Sound settings')}</summary>
    <div className="arena-sound-panel__inner">
     <label>{t('مستوى الصوت','Volume')} <strong>{Math.round(audioPrefs.volume*100)}%</strong>
      <input type="range" min={0} max={100} step={5} value={Math.round(audioPrefs.volume*100)}
       onChange={e=>audioSetting({volume:Number(e.target.value)/100})}/></label>
     <label><input type="checkbox" checked={audioPrefs.music} onChange={e=>audioSetting({music:e.target.checked})}/>
      {t('الموسيقى الافتتاحية والفوز','Intro and victory music')}</label>
     <label><input type="checkbox" checked={audioPrefs.effects} onChange={e=>audioSetting({effects:e.target.checked})}/>
      {t('تفاعل الأسئلة والمؤقت','Question and timer effects')}</label>
     <small>{t('الصوت اختياري ويتفعل فقط بعد ضغطة منك. خليه على شاشة العرض لتجنب ضوضاء الموبايلات.',
      'Sound is opt-in after a user tap. Use projector sound to avoid phone noise.')}</small>
    </div>
   </details>}
  </div>
  {(host||display||isJoined)&&<button type="button" className={'sound-toggle '+(sound?'enabled':'')} onClick={toggleSound}
   aria-label={t('تبديل الصوت','Toggle sound')} aria-pressed={sound}>
   {sound?<Volume2 size={18}/>:<VolumeX size={18}/>}<span>{sound?t('الصوت مفعّل','Sound on'):t('الصوت مغلق','Sound off')}</span>
  </button>}
 {editing&&<Builder ar={ar} owner={s.owner} initial="all" source={{title:s.title,language:s.language,teams:s.teamMode,activities:s.blueprint,settings:s.settings,survey:s.surveyDefinition}} live={s} onClose={()=>setEditing(false)} onCreated={()=>{setEditing(false);refresh();}} onGoHome={()=>navigate('home')}/>}
 </div>;
}
function Leaderboard({s,ar,podium=false}:{s:any;ar:boolean;podium?:boolean}){
 const [teamView,setTeamView]=useState(!!s.teamMode),t=(a:string,e:string)=>ar?a:e;
 const teamRows=Array.isArray(s.teams)?s.teams:[];
 const actual=teamView?teamRows:s.individual;
 return <div className={'leaderboard '+(podium?'with-podium':'')}>{teamRows.length>0&&<div className="segment"><button className={!teamView?'selected':''} onClick={()=>setTeamView(false)}>{t('الأفراد','Players')}</button><button className={teamView?'selected':''} onClick={()=>setTeamView(true)}>{t('الفرق','Teams')}</button></div>}{!actual.length?<div className="leaderboard-empty"><Trophy size={25}/><p>{t('الصدارة مستنية أصحابها.','The top spot is waiting.')}</p></div>:<>{podium&&<div className="podium">{actual.slice(0,3).map((p:any,i:number)=><div key={p.uid||p.team} className={'podium-player podium-'+i}><span className="podium-medal">{i===0?<Trophy size={29}/>:<b>#{p.rank}</b>}</span><b>{p.name||teamName(p.team,ar)}</b><strong>{p.score.toLocaleString()}</strong><span className="podium-block">{String(p.rank).padStart(2,'0')}</span></div>)}</div>}<div className="rank-list">{actual.slice(podium?3:0,podium?80:8).map((p:any)=><div className={'rank-row arena-rank-live '+(p.uid===s.mine?.id?'me':'')} key={(p.uid||p.team)+':'+p.rank}><b className="rank">{p.rank===1?<Trophy size={15}/>:String(p.rank).padStart(2,'0')}</b><span className="rank-avatar">{(p.name||p.team).charAt(0)}</span><span className="rank-name">{p.name||teamName(p.team,ar)}{p.uid===s.mine?.id&&<small>{t('أنت','YOU')}</small>}</span><strong>{p.score.toLocaleString()}</strong></div>)}</div></>}</div>;
}
function teamName(team:string,ar:boolean){return ar?(team==='Lightning'?'فريق البرق':'فريق الموج'):team;}
function Confetti(){return <div className="confetti" aria-hidden="true">{Array.from({length:24},(_,i)=><i key={i} style={{left:`${i*4.3}%`,animationDelay:`${i%6*.11}s`,background:['#67c59c','#176aa4','#218e5b','#8799a6'][i%4],transform:`rotate(${i*31}deg)`}}/>)}</div>;}

function Survey({s,ar,host,display,token,command,refresh}:any){
 const t=(a:string,e:string)=>ar?a:e,[answers,setAnswers]=useState<any[]>(s.survey?.questions.map(()=>null)||[]),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const survey=s.survey;if(!survey)return null;
 async function submit(){setBusy(true);try{await api('survey',{code:s.code,answers},token);await refresh();}catch(e:any){setError(errorText(e.message,ar));}finally{setBusy(false);}}
 return <div className="survey-stage"><span className="eyebrow">YOUR VOICE SHAPES WHAT COMES NEXT</span><h2>{survey.title}</h2><p className="muted">{survey.anonymous?t('استبيان مجهول الهوية. الردود لا ترتبط بالاسم أو الرقم الوظيفي في التقارير.','Anonymous survey. Reports contain no name or employee ID linked to responses.'):t('استبيان معرّف لمتابعة الأثر التدريبي.','Identified survey for training follow-up.')}</p>{host||display?<><div className="survey-orbit"><Users size={50}/></div><p>{s.surveyCount}/{s.players.length} {t('ردود مسجلة من نفس رابط الجلسة','responses from the same session link')}</p>{host&&<button className="btn primary" onClick={()=>command(s.surveyOnly?'closesurvey':'ceremony')}>{s.surveyOnly?t('إغلاق الاستبيان','Close survey'):t('ختام الاستبيان والتتويج','Close survey & celebrate')}</button>}</>:!s.surveyOpen?<div className="answer-sent">{t('تم إغلاق الاستبيان. شكرًا على وقتك.','The survey is closed. Thank you for your time.')}</div>:s.surveySubmitted?<div className="answer-sent"><CheckCircle2 size={32}/>{t('شكرًا. تم تسجيل رأيك.','Thank you. Your feedback is recorded.')}</div>:<form onSubmit={e=>{e.preventDefault();submit();}}>{survey.questions.map((q:any,i:number)=><fieldset className="survey-question" key={i}><legend>{i+1}. {q.prompt}</legend>{q.kind==='rating'?<div className="survey-rating">{[1,2,3,4,5].map(n=><button type="button" key={n} className={answers[i]===n?'selected':''} onClick={()=>setAnswers(answers.map((x,j)=>j===i?n:x))}>{n}</button>)}</div>:q.kind==='choice'?<div className="survey-choices">{q.options.map((o:string,n:number)=><button key={n} type="button" className={answers[i]===n?'selected':''} onClick={()=>setAnswers(answers.map((x,j)=>j===i?n:x))}>{o}</button>)}</div>:<textarea required maxLength={2000} value={answers[i]||''} onChange={e=>setAnswers(answers.map((x,j)=>j===i?e.target.value:x))}/>}</fieldset>)}{error&&<p className="error-banner">{error}</p>}<button className="btn primary wide" disabled={busy||answers.some(x=>x===null||x==='')}>{t('إرسال الاستبيان','Submit feedback')}</button></form>}</div>;
}
