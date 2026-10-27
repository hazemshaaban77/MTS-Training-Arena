'use client';
import {useState,useEffect,useRef} from 'react';
import {Zap,LayoutDashboard,Layers,Trophy,Plus,ArrowUpRight,ScanLine,Globe,ShieldCheck,Radio,Users,Clock,Target,BarChart3,ListOrdered,Link2,Boxes,Dices,Gift,GalleryVerticalEnd,Clapperboard,Route,ChevronDown,Menu,X,Flame,DoorOpen,BookOpen,FolderOpen,Image,ClipboardList,Settings,FileText,Home as HomeIcon,Copy as CopyIcon,Play} from 'lucide-react';
import {types,arTypes,colors,presentation,sample,type Activity} from '../../lib/catalog';
import {api,errorText} from '../../lib/client';
import Builder from './Builder';import Session from './Session';
import Login from './Login';import ActivityArt from './ActivityArt';import WorkspaceTools from './WorkspaceTools';import ArenaSimulator from './ArenaSimulator';import ArenaWorld3D from './ArenaWorld3D';
import {watchTrainer,signInTrainer,signOutTrainer,firebaseError} from '../../lib/firebase-client';
import {siteUrl,siteAsset} from '../../lib/site-path';import BrandHeader,{OfficialLogo,BrandProvider} from './Brand';
export const activityIcons=[Zap,Dices,Clapperboard,Boxes,DoorOpen,BarChart3,ListOrdered,Gift,GalleryVerticalEnd,Route];
export default function ArenaApp(){
 const [ar,setAr]=useState(true),[view,setView]=useState('login'),[code,setCode]=useState(''),[tab,setTab]=useState('home'),[sessions,setSessions]=useState<any[]>([]),[error,setError]=useState(''),[builder,setBuilder]=useState<string|null>(null),[menu,setMenu]=useState(false),[loading,setLoading]=useState(true);
 const [identity,setIdentity]=useState<any>(null),[identityChecked,setIdentityChecked]=useState(false),[authError,setAuthError]=useState('');
 const [builderSource,setBuilderSource]=useState<any>(null),[practice,setPractice]=useState<Activity[]|null>(null);
 const authGeneration=useRef(0),signingIn=useRef(false);
 const t=(a:string,e:string)=>ar?a:e;
 function readRoute(){const p=new URLSearchParams(window.location.search);setView(p.get('view')||'login');setCode(p.get('code')||'');}
 function navigate(next:string,c=''){window.history.pushState({},'',siteUrl(next,c));setView(next);setCode(c);setError('');}
 useEffect(()=>{setAr(localStorage.getItem('arena-language')!=='en');readRoute();window.addEventListener('popstate',readRoute);return()=>window.removeEventListener('popstate',readRoute);},[]);
 useEffect(()=>{let active=true;const stop=watchTrainer(async user=>{const generation=++authGeneration.current;if(!active)return;if(signingIn.current)return;if(!user){setIdentity(null);setIdentityChecked(true);return;}try{const data=await api('me');if(active&&generation===authGeneration.current){setIdentity(data);setAuthError('');}}catch(e:any){if(active&&generation===authGeneration.current){setIdentity(null);setAuthError(firebaseError(e.message));}}finally{if(active&&generation===authGeneration.current)setIdentityChecked(true);}});return()=>{active=false;stop();};},[]);
 async function enterTrainer(email:string,password:string){
  signingIn.current=true;
  setAuthError('');
  try{
   await signInTrainer(email,password);
   // ChatGPT Sites used a private-account /api/connect bridge. GitHub Pages has
   // no Sites user ID, so that redundant call must not block trainer sign-in.
   const data=await api('me');
   if(!data?.authenticated)throw Error('SIGN_IN');
   ++authGeneration.current;
   setIdentity(data);
   setIdentityChecked(true);
   navigate(view==='host'?'host':'home',code);
  }catch(e:any){
   setIdentity(null);
   const message=firebaseError(e.code||e.message);
   setAuthError(message);
   throw Error(message);
  }finally{
   signingIn.current=false;
  }
 }
 async function retryTrainerAccess(){
  setAuthError('');
  try{
   // Firebase keeps the verified user session even if the Cloudflare API
   // was temporarily unreachable; do not demand a second password login.
   const data=await api('me');
   if(!data?.authenticated)throw Error('SIGN_IN');
   ++authGeneration.current;
   setIdentity(data);
   setIdentityChecked(true);
   navigate(view==='host'?'host':'home',code);
  }catch(e:any){
   const message=firebaseError(e.code||e.message);
   setAuthError(message);
   throw Error(message);
  }
 }
 function goTrainerHome(){
  // Client-side navigation only: never send the session-ending control action.
  // Active rooms, timer and participant scores remain owned by the server.
  setTab('home');setMenu(false);setBuilder(null);setBuilderSource(null);
  navigate('home');
 }
 async function leaveTrainer(){for(const key of Object.keys(localStorage))if(key.startsWith('arena-draft-recovery'))localStorage.removeItem(key);await signOutTrainer();setIdentity(null);setSessions([]);navigate('login');}

 useEffect(()=>{document.documentElement.lang=ar?'ar':'en';document.documentElement.dir=ar?'rtl':'ltr';localStorage.setItem('arena-language',ar?'ar':'en');},[ar]);
 function load(){setLoading(true);api('sessions').then(r=>{setSessions(r.sessions);setError('');}).catch(e=>setError(e.message)).finally(()=>setLoading(false));}
 useEffect(()=>{if(view==='home'&&identity?.authenticated)load();},[view,identity]);
 const current=sessions.filter(s=>!['completed','archived'].includes(s.status)),finished=sessions.filter(s=>['completed','archived'].includes(s.status));
 return <BrandProvider><div className={'arena-app '+(ar?'arabic':'english')} dir={ar?'rtl':'ltr'}>
 {(view==='home'||view==='login')&&<div className="arena-home-world" aria-hidden="true"><ArenaWorld3D kind="lobby" mode="ambient" light/></div>}
 {(view==='login'||(['home','host'].includes(view)&&!identity?.authenticated))?<Login ar={ar} toggleLanguage={()=>setAr(!ar)} identity={identity} loading={!identityChecked} onEnter={()=>navigate(view==='host'?'host':'home',code)} onSignIn={enterTrainer} onSignOut={leaveTrainer} onRetryAuth={retryTrainerAccess} authError={authError} onJoin={()=>navigate('join')}/>:view==='home'?<>{menu&&<button type="button" className="trainer-mobile-nav-backdrop" aria-label={t('إغلاق القائمة','Close navigation')} onClick={()=>setMenu(false)}/>}<aside id="trainer-navigation" aria-label={t('قائمة المدرب','Trainer navigation')} className={'sidebar '+(menu?'expanded':'')}><a href={siteUrl("home")} aria-label="MTS Training Arena"><OfficialLogo kind="mts" className="sidebar-official"/></a><nav>{[[LayoutDashboard,'home',t('مساحتي','Overview')],[Radio,'sessions',t('الجلسات','Sessions')],[Layers,'library',t('مكتبة الألعاب','Game library')],[FileText,'drafts',t('المسودات','Drafts')],[CopyIcon,'templates',t('القوالب','Templates')],[BookOpen,'questions',t('بنك الأسئلة','Question bank')],[Image,'media',t('الوسائط','Media')],[ClipboardList,'surveys',t('الاستبيانات','Surveys')],[Users,'teams',t('الفرق','Teams')],[FolderOpen,'catalog',t('الكتالوج المشترك','Shared catalog')],[Trophy,'reports',t('التقارير','Reports')],[Settings,'settings',t('الإعدادات','Settings')]].map(([Icon,id,label]:any)=><button key={id} className={tab===id?'nav-item active':'nav-item'} onClick={()=>{setTab(id);setMenu(false);}}><Icon size={22}/><span>{label}</span></button>)}</nav><div className="side-bottom"><OfficialLogo kind="training" className="sidebar-training"/><span className="avatar">{(identity?.name||"H").charAt(0)}</span></div></aside>
 <div className="workspace"><BrandHeader className="workspace-brand-header"><button className="mobile-menu icon-button" aria-label={t('قائمة المدرب','Trainer menu')} aria-controls="trainer-navigation" aria-expanded={menu} onClick={()=>setMenu(!menu)}>{menu?<X/>:<Menu/>}</button><span className="wordmark">MTS TRAINING ARENA</span><span className="muted small">{t('مساحة المدرب','Trainer workspace')}</span><button type="button" className="trainer-home-button" aria-label={t('الرجوع للصفحة الرئيسية','Back to home')} onClick={goTrainerHome}><HomeIcon size={17}/><span>{t('الصفحة الرئيسية','Home')}</span></button><button className="language" onClick={()=>setAr(!ar)}><Globe size={15}/>{ar?'EN':'عربي'}</button><button className="account-exit" onClick={leaveTrainer}>{t('تسجيل الخروج','Sign out')}</button></BrandHeader>
 <main className="dashboard"><div className="page-heading"><div><div className="eyebrow">{t('من المعرفة إلى الأثر.','FROM KNOWLEDGE TO IMPACT.')}</div><h1>{tab==='library'?t('مكتبة التحدّيات','The challenge library'):tab==='reports'?t('كل إنجاز له حكاية.','Every win tells a story.'):t('أهلًا '+(identity?.name?.split(' ')[0]||'بالمدرب')+'، جاهز تبدأ؟','Welcome '+(identity?.name?.split(' ')[0]||'Trainer')+'. Ready to begin?')}</h1><p className="muted">{t('من أول مسح للـQR لآخر لحظة فوز. جلسة واحدة تجمع الكل.','From the first QR scan to the final victory. One session brings everyone together.')}</p></div><button className="btn primary" onClick={()=>setBuilder('all')}><Plus size={18}/>{t('إنشاء جلسة','Create session')}</button></div>
 {error&&<div className="error-banner">{errorText(error,ar)} <button onClick={load}>{t('حاول تاني','Retry')}</button></div>}
 {tab==='home'&&<><section className="hero"><div className="hero-copy"><span className="pill"><i className="live-dot"/>{t('تعلّم مباشر. طاقة مختلفة.','LIVE LEARNING. NEW ENERGY.')}</span><h2>{t('حيث يتحول التدريب','WHERE TRAINING BECOMES')}<br/><em>{t('إلى إبداع','CREATIVITY')}</em></h2><p>{t('صمّم، أطلق، وتابع جلساتك بسهولة. أنت تقود التجربة، وكل متدرب يضيف إبداعه.','Design, launch, and lead every session with ease. Everyone gets a chance to shine.')}</p><div className="hero-actions"><button className="btn primary" onClick={()=>setBuilder('all')}><Zap size={18} fill="currentColor"/>{t('جهّز ساحتك','Build your arena')}<ArrowUpRight size={17}/></button><button className="text-button" onClick={()=>navigate('join')}><ScanLine size={19}/>{t('انضم لجلسة','Join a session')}</button></div><div className="hero-foot"><span className="mini-avatars"><b>A</b><b>M</b><b>S</b></span><span>{t('QR واحد. كل الأنشطة. نفس الفريق.','One QR. Every challenge. Everyone together.')}</span></div></div><div className="arena-art dashboard-hero-art arena-hero-world" aria-hidden="true"><ArenaWorld3D kind="lobby" mode="ambient"/></div></section>
 <div className="stats-strip"><div><span className="stat-icon lime"><Radio/></span><div><b>{current.length.toString().padStart(2,'0')}</b><span>{t('جلسات جاهزة ومباشرة','Ready & live sessions')}</span></div></div><div><span className="stat-icon violet"><Layers/></span><div><b>10</b><span>{t('طريقة لإشعال المشاركة','Ways to spark engagement')}</span></div></div><div><span className="stat-icon cyan"><ScanLine/></span><div><b>01</b><span>{t('QR لكل رحلة التعلّم','QR for the whole journey')}</span></div></div><div><span className="stat-icon pink"><Trophy/></span><div><b>{finished.length.toString().padStart(2,'0')}</b><span>{t('جلسات مكتملة','Completed sessions')}</span></div></div></div></>}
 {['home','library'].includes(tab)&&<section className="activity-section"><div className="section-heading"><div><span className="eyebrow">THE PLAYBOOK</span><h2>{t('تحدّي لكل لحظة','A challenge for every moment')}</h2></div><span className="muted small">{t('اختار البداية. وخلّي الباقي علينا.','Pick a starting point. Make it your own.')}</span></div><div className="activity-grid">{types.map((type,i)=>{const Icon=activityIcons[i];return <div className={'activity-tile arena-practice-library-card '+colors[i]} key={type}><button className="arena-practice-library-card__design" onClick={()=>setBuilder(type)} aria-label={t('تصميم نشاط ','Design activity ')+(ar?arTypes[i]:type)}><span className="activity-visual activity-visual-photo"><ActivityArt activity={type} label={ar?arTypes[i]:type}/></span><span className="arena-practice-library-card__label"><b>{ar?arTypes[i]:type}</b><small>{ar?type:presentation(type)?'Shared experience':'Live challenge'}</small></span><ArrowUpRight className="tile-arrow" size={17}/></button><button className="arena-practice-library-card__try" onClick={()=>setPractice([sample(type,ar?'ar':'en')])}><Play size={17}/>{t('جرّب النشاط','Try activity')}</button></div>;})}</div></section>}
 {['home','sessions'].includes(tab)&&<section className="sessions-section"><div className="section-heading"><div><span className="eyebrow">YOUR ARENAS</span><h2>{tab==='reports'?t('نتائج جلساتك','Your session results'):t('جلساتك','Your sessions')}</h2></div><span className="count-badge">{(tab==='reports'?finished:sessions).length}</span></div>{loading?<div className="empty-state"><span className="loader"/>{t('بنجهّز مساحتك…','Loading your workspace…')}</div>:(tab==='reports'?finished:sessions).length===0?<div className="empty-state"><span className="empty-icon"><Flame size={30}/></span><h3>{tab==='reports'?t('أول إنجاز لسه جاي.','Your first win is coming.'):t('الساحة مستنية أول تحدّي.','Your arena awaits its first challenge.')}</h3><p>{t('جهّز أنشطتك، افتح الجلسة، وسيب الحماس يبدأ.','Prepare your activities, open a session, and let the energy begin.')}</p><button className="btn secondary" onClick={()=>setBuilder('all')}><Plus size={17}/>{t('جهّز أول جلسة','Create your first session')}</button></div>:<div className="session-grid">{(tab==='reports'?finished:sessions).map(s=><button key={s.code} className="session-card" onClick={()=>navigate('host',s.code)}><div className="session-card-top"><span className={'status-pill '+s.status}>{s.status==='lobby'?t('جاهزة للبدء','Ready to launch'):['completed','archived'].includes(s.status)?t('مكتملة','Completed'):t('مباشر الآن','Live now')}</span><ArrowUpRight size={20}/></div><h3>{s.title}</h3><div className="session-card-meta"><span><Users size={15}/>{s.participants}</span><span><Clock size={15}/>{new Date(s.created_at).toLocaleDateString(ar?'ar-EG':'en-GB')}</span><code>{s.code}</code></div></button>)}</div>}</section>}
 {!['home','sessions','library'].includes(tab)&&<WorkspaceTools tab={tab} ar={ar} identity={identity} navigate={navigate} onBuild={(source:any)=>{setBuilderSource(source||null);setBuilder('all');}}/>}<footer><span>MTS TRAINING ARENA <b>✦</b> INSPIRE LEARNING. CREATE IMPACT.</span><span>{t('صُنع للحظات التعلّم اللي بتفرق.','Made for learning moments that matter.')}</span></footer></main></div></>:<Session ar={ar} view={view} code={code} navigate={navigate} toggleLanguage={()=>setAr(!ar)}/>}
 {builder!==null&&<Builder ar={ar} owner={identity?.owner} initial={builder} source={builderSource} onClose={()=>{setBuilder(null);setBuilderSource(null);}} onCreated={c=>{setBuilder(null);setBuilderSource(null);navigate('host',c);}} onGoHome={goTrainerHome}/>}
 {practice&&<ArenaSimulator ar={ar} activities={practice} onClose={()=>setPractice(null)} title={t('جرّب النشاط قبل ما تصممه','Try this activity before designing')}/>}
 </div></BrandProvider>;
}
