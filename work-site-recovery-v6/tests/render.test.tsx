import {newKnowledgeQuestion,changeKnowledgeQuestionType,normalizeKnowledgeQuestion,knowledgeQuestionTypes,questionTypeLabel,setMatchingPair,deleteMatchingPair} from '../lib/question-authoring';
import {gameIntroBeats} from '../lib/arena-intro-beats';
import {safeYouTubeEmbed,classifyMediaLink} from '../lib/media-url';
import {introIdentity,introIdentities} from '../lib/arena-game-identity';
import {projectorFitScale} from '../lib/projector-fit';
import {introHighlight,sceneFromHighlight,canPreviewNext,eligibleMoment,stageAtmosphere} from '../lib/arena-cinematics';
import {ArenaSoundEngine,defaultArenaAudio} from '../lib/arena-sound';
import ArenaMoment from '../components/arena/ArenaMoment';
import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import GamePlay from '../components/arena/GamePlay';import LivePoll,{LivePollChart} from '../components/arena/LivePoll';import ActivityArt from '../components/arena/ActivityArt';import StageSplash from '../components/arena/StageSplash';import StageMedia from '../components/arena/StageMedia';import ArenaPowerTimer from '../components/arena/ArenaPowerTimer';
import ArenaVictory,{championsFromSession} from '../components/arena/ArenaVictory';
import ArenaGameShow from '../components/arena/ArenaGameShow';
import ArenaEscapeRoom from '../components/arena/ArenaEscapeRoom';
import ArenaMetaPlan from '../components/arena/ArenaMetaPlan';
import ArenaScenario from '../components/arena/ArenaScenario';
import ArenaSimulator from '../components/arena/ArenaSimulator';
import QuestionStudio from '../components/arena/QuestionStudio';
import ArenaChampionshipPractice from '../components/arena/ArenaChampionshipPractice';
import {showStart,showCommand,showPublic} from '../lib/championship.mjs';
import {contestantKnockouts,previouslyUsedLifelines,shouldContinueContestant} from '../lib/show-rules.mjs';
import TrainerDirectorDashboard,{trainerDirectorStats} from '../components/arena/TrainerDirectorDashboard';
import {runSimulatedRoom} from '../lib/simulator-dry-run';
import ReportActivityInsights from '../components/arena/ReportActivityInsights';
import {analyzeReportActivities,reportInsightsCsv} from '../lib/report-insights';
import SessionEntryFeedback from '../components/arena/SessionEntryFeedback';
import TrainerReadiness from '../components/arena/TrainerReadiness';
import {estimateSessionAgenda} from '../lib/session-planning';
import {makeSessionStarter,sessionTemplateOptions} from '../lib/session-templates';
import TraineeFinish,{ownSessionResult} from '../components/arena/TraineeFinish';import {resolveArenaMediaUrl} from '../lib/client';import Session from '../components/arena/Session';import Builder,{newSessionActivity} from '../components/arena/Builder';
import {makeImportVerseWorkshop,importVersePlannedMinutes} from '../lib/importverse-workshop';
import {importVerseQuestions} from '../lib/importverse-question-bank';import Login from '../components/arena/Login';import {sample,types} from '../lib/catalog';import {publicActivity,validateActivity,validateDeck} from '../lib/domain.mjs';
test('each stage renders Arabic/English trainer, projector and participant semantic markup',()=>{for(const ar of [true,false])for(const type of types)for(const role of ['host','display','play']){const a=sample(type,ar?'ar':'en'),activity=publicActivity(a),mine={id:'one',name:'Person',eligible:true,approval:'approved'},s:any={activity,players:[{uid:'one',name:'Person'}],individual:[{uid:'one',score:0}],status:'question',serverNow:Date.now(),current:0,runtime:{phase:'answering'},mine:role==='play'?mine:null,game:{target:'one',turn:0,rounds:3,used:[],escape:{room:0,puzzle:0,totalRooms:2,question:publicActivity(sample('Quiz')),title:'Room',narrative:'Mission'},scenario:{text:'Choose',choices:[{label:'Continue'}],path:[]}}};const html=renderToStaticMarkup(<GamePlay s={s} ar={ar} host={role==='host'} display={role==='display'} canAnswer={role==='play'} busy={false} onSubmit={()=>{}} onInteract={()=>{}} onControl={()=>{}}/>);assert.ok(html.length>100,`${type} ${role}`);assert.ok(!html.includes('undefined'));}});
test('sign-in retains original proportional logo assets and accessible credential fields',()=>{const html=renderToStaticMarkup(<Login ar={true} toggleLanguage={()=>{}} identity={null} loading={false} onEnter={()=>{}} onSignIn={async()=>{}} onSignOut={async()=>{}} onRetryAuth={async()=>{}} authError="" onJoin={()=>{}}/>);assert.ok(html.includes('/mts-transparent.png'));assert.ok(html.includes('/training-transparent.png'));assert.ok(html.includes('type="email"'));assert.ok(html.includes('current-password'));});

test('approved arena photo fills home banner without legacy perspective/scale, and login avoids 154% zoom',()=>{
 const css=readFileSync('app/globals.css','utf8');
 const revision=css.slice(css.indexOf('/* V6 visual QA 2026-10-19:'));
 assert.ok(revision.startsWith('/* V6 visual QA'));
 assert.match(revision,/height:110%!important/);
 assert.match(revision,/height:100%!important/);
 assert.doesNotMatch(revision,/height:154%/);
 const art=revision.split('.workspace .dashboard .hero .dashboard-hero-art{')[1]?.split('}')[0]||'';
 const scene=revision.split('.workspace .dashboard .hero .dashboard-hero-scene{')[1]?.split('}')[0]||'';
 assert.ok(art.includes('scale:1!important;')&&art.includes('transform:none!important;'));
 assert.ok(scene.includes('object-fit:cover!important;')&&scene.includes('animation:none!important;'));
});

test('trainer has Home in host session and builder, while guests and projector do not',()=>{
 const base={ar:true,code:'123456',navigate:(_view:string)=>{},toggleLanguage:()=>{}};
 const host=renderToStaticMarkup(<Session {...base} view="host"/>);
 const display=renderToStaticMarkup(<Session {...base} view="display"/>);
 const guest=renderToStaticMarkup(<Session {...base} view="play"/>);
 assert.ok(host.includes('aria-label="الرجوع للصفحة الرئيسية"'));
 assert.ok(host.includes('الصفحة الرئيسية'));
 assert.ok(!display.includes('aria-label="الرجوع للصفحة الرئيسية"'));
 assert.ok(!guest.includes('aria-label="الرجوع للصفحة الرئيسية"'));
 const editor=renderToStaticMarkup(<Builder ar={true} initial="Quiz" onClose={()=>{}} onCreated={()=>{}} onGoHome={()=>{}}/>);
 assert.ok(editor.includes('aria-label="الرجوع للصفحة الرئيسية"'));
 const code=readFileSync('components/arena/App.tsx','utf8');
 const css=readFileSync('app/globals.css','utf8');
 assert.ok(code.includes('function goTrainerHome()'));
 assert.ok(code.includes("setTab('home')"));
 assert.ok(code.includes('onGoHome={goTrainerHome}'));
 assert.ok(css.includes('session-shell:not(.projector):not(.trainee)>.session-brand-header'));
});

test('all ten activities have shipped brand-consistent image assets with readable names',()=>{
 const types=['Quiz','Wheel of Fortune','Ultimate Game Show','Meta Plan','Escape Room','Live Poll','Order It','Open the Box','Flashcards','Scenario Challenge'];
 for(const name of types){
  const html=renderToStaticMarkup(<ActivityArt activity={name} label={name}/>);
  assert.ok(html.includes('activity-art/'),name);
  assert.ok(html.includes('alt="'+name+'"'),name);
  const id=name.toLowerCase().replaceAll(' ','-');
  const asset='public/activity-art/'+id+(html.includes(id+'.webp')?'.webp':'.svg');
  const bytes=readFileSync(asset);
  if(asset.endsWith('.webp')){
   assert.equal(bytes.toString('ascii',0,4),'RIFF');
   assert.equal(bytes.toString('ascii',8,12),'WEBP');
  }else assert.ok(bytes.toString('utf8').includes('<svg'),name);
 }
});
test('video and uploaded image URLs stay reachable through the Pages gateway',()=>{
 const original='https://mts-training-arena-v6-api.hazem-mts-arena.workers.dev/media/abc.mp4';
 const restored=resolveArenaMediaUrl(original);
 assert.equal(restored,'https://mts-training-arena-v6-gateway.pages.dev/media/abc.mp4');
 const html=renderToStaticMarkup(<StageMedia media={{type:'video',url:original,alt:'Lesson'}}/>);
 assert.ok(html.includes('controls=""'));
 assert.ok(html.includes('mts-training-arena-v6-gateway.pages.dev'));
});

test('unsigned Cloudinary uploads have a fixed non-secret preset, strict client limits and safe CDN validation',()=>{
 const client=readFileSync('lib/client.ts','utf8');
 const workspace=readFileSync('components/arena/WorkspaceTools.tsx','utf8');
 assert.ok(client.includes("cloudName:'kzez0dlv'"));
 assert.ok(client.includes("preset:'mtsarena_v6_u_7c94f2a1'"));
 assert.ok(client.includes("payload.append('upload_preset',arenaUnsignedUpload.preset)"));
 assert.ok(client.includes("'/auto/upload'"));
 assert.ok(client.includes("expectedType==='image'?10_000_000:50_000_000"));
 assert.ok(client.includes("parsed.hostname!=='res.cloudinary.com'"));
 assert.ok(!client.includes('CLOUDINARY_API_SECRET'));
 assert.ok(!client.includes("await api('media-sign'"));
 assert.ok(workspace.includes('uploadLibraryFile'));
 assert.ok(workspace.includes('video/mp4,video/webm'));
});

test('Futuristic Arena timer uses server remaining time in all roles and respects pause/zero',()=>{
 for(const mode of ['host','play','display'] as const){
  const html=renderToStaticMarkup(<ArenaPowerTimer mode={mode} seconds={27} remainingMs={27000} totalSeconds={60} timed paused={false} closed={false} ar={true}/>);
  assert.ok(html.includes('arena-power-timer--'+mode),mode);
  assert.ok(html.includes('00:27'),mode);
  assert.ok(html.includes('الوقت المتبقي'),mode);
  const arc=html.match(/stroke-dashoffset="([0-9.]+)"/);
  assert.ok(arc&&Math.abs(Number(arc[1])-55)<0.001,mode);
 }
 const nearly=renderToStaticMarkup(<ArenaPowerTimer mode="display" seconds={5} remainingMs={4800} totalSeconds={30} timed paused={false} closed={false} ar={false}/>);
 assert.ok(nearly.includes('is-critical'));
 assert.ok(nearly.includes('FINAL SECONDS'));
 const paused=renderToStaticMarkup(<ArenaPowerTimer mode="host" seconds={9} remainingMs={9000} totalSeconds={30} timed paused closed={false} ar={false}/>);
 assert.ok(paused.includes('PAUSED'));
 assert.ok(paused.includes('00:09'));
 assert.ok(!paused.includes('is-critical'));
 const ended=renderToStaticMarkup(<ArenaPowerTimer mode="display" seconds={0} remainingMs={0} totalSeconds={30} timed paused={false} closed={false} ar={false}/>);
 assert.ok(ended.includes('TIME UP'));
 const untimed=renderToStaticMarkup(<ArenaPowerTimer mode="play" seconds={0} remainingMs={0} totalSeconds={30} timed={false} paused={false} closed={false} ar={false}/>);
 assert.ok(untimed.includes('YOUR PACE'));
 const source=readFileSync('components/arena/Session.tsx','utf8');
 const component=readFileSync('components/arena/ArenaPowerTimer.tsx','utf8');
 const css=readFileSync('app/globals.css','utf8');
 assert.ok(source.includes("mode={display?'display':host?'host':'play'}"));
 assert.ok(source.includes('remainingMs={remaining}'));
 assert.ok(!component.includes('setInterval('));
 assert.ok(css.includes('FUTURISTIC ARENA — 3D HUD'));
 assert.ok(css.includes('prefers-reduced-motion:reduce'));
});

test('cinematic WebP art appears in every activity intro, trainer and bilingual trainee view',()=>{
 const names=['Quiz','Wheel of Fortune','Ultimate Game Show','Meta Plan','Escape Room','Live Poll','Order It','Open the Box','Flashcards','Scenario Challenge'];
 for(const type of names){
  const id=type.toLowerCase().replaceAll(' ','-');
  const expected='activity-art/'+id+'.webp';
  const data=readFileSync('public/activity-art/'+id+'.webp');
  assert.equal(data.toString('ascii',0,4),'RIFF',type);
  assert.equal(data.toString('ascii',8,12),'WEBP',type);
  for(const ar of [true,false]){
   const html=renderToStaticMarkup(<StageSplash type={type} label={type} ar={ar} durationMs={2100} onComplete={()=>{}}/>);
   assert.ok(html.includes(expected),type);
   assert.ok(html.includes('splash-activity-cover'),type);
   assert.ok(html.includes('<h2>'+type+'</h2>'),type);
   assert.ok(html.includes(ar?'لحظة انطلاق التحدّي':'THE CHALLENGE BEGINS'),type);
  }
  const tile=renderToStaticMarkup(<ActivityArt activity={type} label={type}/>);
  assert.ok(tile.includes(expected),type);
 }
 const session=readFileSync('components/arena/Session.tsx','utf8');
 assert.ok(session.includes('durationMs={s.deadline?display?2300:host?1450:1100:'), 'Timed rounds retain the short/safe intro while untimed shows may last longer');
 assert.ok(session.includes("durationMs={intensity==='light'?8500:12000}"), 'Pre-round projector intro is readable for up to 12 seconds without starting the timer');
 assert.ok(session.includes('introHighlight(s.current+1'), 'Host can trigger a longer pre-round projection safely');
 const css=readFileSync('app/globals.css','utf8');
 assert.ok(css.includes('Approved cinematic 3D art'));
});

test('Live Poll uses distinct vote cards rather than Quiz answers before results',()=>{
 const activity={...sample('Live Poll','ar'),pollKind:'choice',liveResults:false};
 const s:any={activity,status:'question',runtime:{phase:'answering'},current:0,submitted:3,
  mine:{id:'learner',name:'Participant',eligible:true,answered:false},tally:null,pollSummary:null};
 const voting=renderToStaticMarkup(<GamePlay s={s} ar={true} host={false} display={false}
  canAnswer={true} busy={false} onSubmit={()=>{}} onInteract={()=>{}} onControl={()=>{}}/>);
 assert.ok(voting.includes('live-poll-vote__card'));
 assert.ok(voting.includes('صوتك يفرق'));
 assert.ok(voting.includes('إرسال صوتي'));
 assert.ok(!voting.includes('answer-option'));
 assert.ok(!voting.includes('answer-grid'));
 assert.ok(!voting.includes('تثبيت الإجابة'));
 const projector=renderToStaticMarkup(<GamePlay s={{...s,mine:null}} ar={false} host={false} display
  canAnswer={false} busy={false} onSubmit={()=>{}} onInteract={()=>{}} onControl={()=>{}}/>);
 assert.ok(projector.includes('LIVE VOTING IN PROGRESS'));
 assert.ok(!projector.includes('answer-option'));
});
test('Live Poll results are chart ONLY with true shares, zero votes, English and Arabic labels',()=>{
 const activity={...sample('Live Poll','en'),pollKind:'choice',liveResults:false};
 const base:any={activity,status:'results',runtime:{phase:'answering'},current:0,
  submitted:10,tally:[5,3,2,0],pollSummary:null,mine:null};
 for(const ar of [true,false]){
  const html=renderToStaticMarkup(<GamePlay s={base} ar={ar} host={false} display={true}
   canAnswer={false} busy={false} onSubmit={()=>{}} onInteract={()=>{}} onControl={()=>{}}/>);
  assert.ok(html.includes('live-poll-chart__rows'));
  assert.ok(html.includes('50%'));
  assert.ok(html.includes('30%'));
  assert.ok(html.includes('20%'));
  assert.ok(html.includes('0%'));
  assert.ok(!html.includes('answer-option'));
  assert.ok(!html.includes('answer-grid'));
  assert.ok(!html.includes('right-answer'));
  assert.ok(!html.includes('option-tally'));
 }
 const awaiting=renderToStaticMarkup(<LivePollChart s={{...base,tally:null}} ar={true}/>);
 assert.ok(awaiting.includes('pending'));
 assert.ok(!awaiting.includes('live-poll-chart__rows'));
});
test('every Live Poll subtype charts its REAL aggregation rather than Quiz options',()=>{
 const a=sample('Live Poll','en'),base:any={activity:a,status:'results',submitted:4};
 const rating=renderToStaticMarkup(<LivePollChart s={{...base,activity:{...a,pollKind:'rating'},pollSummary:{average:4.25,count:4}}} ar={false}/>);
 assert.ok(rating.includes('4.3 / 5'));
 assert.ok(rating.includes('live-poll-chart--rating'));
 const words=renderToStaticMarkup(<LivePollChart s={{...base,activity:{...a,pollKind:'word'},pollSummary:{words:{feedback:3,collaboration:1}}}} ar={false}/>);
 assert.ok(words.includes('feedback'));
 assert.ok(words.includes('75%'));
 assert.ok(words.includes('live-poll-chart--word'));
 assert.ok(!words.includes('word-cloud'));
 const ranking=renderToStaticMarkup(<LivePollChart s={{...base,activity:{...a,pollKind:'priority'},pollSummary:{ranking:[{label:'Priority A',value:9},{label:'Priority B',value:5}]}}} ar={false}/>);
 assert.ok(ranking.includes('Priority A'));
 assert.ok(ranking.includes('9'));
 assert.ok(ranking.includes('weighted ranking points'));
 const session=readFileSync('components/arena/Session.tsx','utf8');
 assert.ok(session.includes("s.activity?.type!=='Live Poll'"));
 assert.ok(session.includes("s.activity.type!=='Live Poll'"));
});

test('victory finale is a real champion reveal and avoids inventing winners on a tie',()=>{
 const individual=[
  {uid:'a',rank:1,name:'Champion A',score:1700},
  {uid:'b',rank:2,name:'Runner B',score:1400}
 ];
 const s:any={teamMode:false,individual,teams:[],players:[]};
 const solo=renderToStaticMarkup(<ArenaVictory s={s} ar={false}/>);
 assert.ok(solo.includes('THE CHAMPIONS!'));
 assert.ok(solo.includes('Champion A'));
 assert.ok(solo.includes('1,700'));
 assert.ok(solo.includes('Replay victory moment'));
 assert.ok(solo.includes('arena-victory__firework'));
 assert.ok(solo.includes('arena-victory__confetti'));
 assert.ok(!solo.includes('Runner B'));
 assert.deepEqual(championsFromSession(s,false).map(x=>x.name),['Champion A']);
 const tied={...s,individual:[...individual,{uid:'c',rank:1,name:'Champion C',score:1700}]};
 const tie=renderToStaticMarkup(<ArenaVictory s={tied} ar={true}/>);
 assert.ok(tie.includes('Champion A'));
 assert.ok(tie.includes('Champion C'));
 assert.ok(tie.includes('أبطال المركز الأول'));
 const team={...s,teamMode:true,teams:[{team:'Alpha',rank:1,score:3000},{team:'Beta',rank:2,score:2000}]};
 assert.deepEqual(championsFromSession(team,false).map(x=>x.name),['Alpha']);
 const noScores=renderToStaticMarkup(<ArenaVictory s={{teamMode:false,individual:[],teams:[]}} ar={true}/>);
 assert.ok(noScores.includes('كل المشاركين أبطال'));
 assert.ok(!noScores.includes('المركز الأول'));
 const source=readFileSync('components/arena/Session.tsx','utf8');
 const css=readFileSync('app/globals.css','utf8');
 assert.ok(source.includes('<ArenaVictory s={s} ar={ar}/>'));
 assert.ok(source.includes('<Leaderboard s={s} ar={ar} podium/>'));
 assert.ok(css.includes('V6 FINALE: ARENA VICTORY SHOW'));
 assert.ok(css.includes('prefers-reduced-motion:reduce'));
});

test('cinematic victory honors real winner or ties and never fabricates champions',()=>{
 const players=[
  {uid:'one',name:'First',score:230,rank:1},
  {uid:'two',name:'Runner-up',score:180,rank:2}
 ];
 const base:any={teamMode:false,individual:players,teams:[],players:[],status:'completed'};
 const html=renderToStaticMarkup(<ArenaVictory s={base} ar={false}/>);
 assert.ok(html.includes('ARENA VICTORY MOMENT'));
 assert.ok(html.includes('THE CHAMPIONS!'));
 assert.ok(html.includes('First'));
 assert.ok(html.includes('230'));
 assert.ok(!html.includes('Runner-up'));
 assert.ok(html.includes('arena-victory__firework'));
 assert.ok(html.includes('arena-victory__confetti'));
 assert.ok(html.includes('Replay victory moment'));
 const tie=renderToStaticMarkup(<ArenaVictory s={{...base,individual:[
  {uid:'one',name:'Amira',score:250,rank:1},{uid:'two',name:'Nour',score:250,rank:1}
 ]}} ar={true}/>);
 assert.ok(tie.includes('Amira')&&tie.includes('Nour'));
 assert.ok(tie.includes('أبطال المركز الأول'));
 const teams={...base,teamMode:true,teams:[{team:'Team Alpha',score:220,rank:1}]};
 assert.equal(championsFromSession(teams,false)[0].name,'Team Alpha');
 const noScores=renderToStaticMarkup(<ArenaVictory s={{...base,individual:[]}} ar={true}/>);
 assert.ok(noScores.includes('كل المشاركين أبطال'));
 assert.ok(!noScores.includes('First Place Winners'));
 const code=readFileSync('components/arena/Session.tsx','utf8');
 const css=readFileSync('app/globals.css','utf8');
 assert.ok(code.includes('<ArenaVictory s={s} ar={ar}/>'));
 assert.ok(code.includes('<Leaderboard s={s} ar={ar} podium/>'));
 assert.ok(css.includes('ARENA VICTORY — GRAND FINALE'));
 assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'));
 assert.ok(css.includes('.projector .arena-victory__trophy'));
});

test('all 10 activity prototypes launch local practice without server rooms or side effects',()=>{
 for(const lang of ['ar','en']){
  for(const type of types){
   const activity=sample(type,lang);
   const html=renderToStaticMarkup(<ArenaSimulator ar={lang==='ar'} activities={[activity]}
    onClose={()=>{}} title={lang==='ar'?'تجربة':'Practice'}/>);
   assert.ok(html.includes('ARENA PRACTICE MODE'),lang+' '+type);
   assert.ok(html.includes('arena-sim-intro'),lang+' '+type);
   assert.ok(html.includes('activity-art/'),lang+' '+type);
   assert.ok(html.includes('arena-simulator-modes'),lang+' '+type);
   assert.ok(html.includes('arena-simulator-progress'),lang+' '+type);
   assert.ok(html.includes('arena-simulator-footer'),lang+' '+type);
  }
 }
});
test('complete rehearsal retains draft and NEVER creates a live server session',()=>{
 const b=renderToStaticMarkup(<Builder ar={true} initial="Quiz"
  owner="trainer" onClose={()=>{}} onCreated={()=>{}}/>);
 assert.ok(b.includes('محاكاة الجلسة'));
 assert.ok(b.includes('جرّب النشاط'));
 const builderSource=readFileSync('components/arena/Builder.tsx','utf8');
 const library=readFileSync('components/arena/App.tsx','utf8');
 const simulation=readFileSync('components/arena/ArenaSimulator.tsx','utf8');
 assert.ok(builderSource.includes('setSimulate({activities:structuredClone(deck),index:0})'));
 assert.ok(builderSource.includes("simulateActivity(i)"));
 assert.ok(!builderSource.includes('create(true)'));
 assert.ok(!builderSource.includes('simulation?t('));
 assert.ok(library.includes('arena-practice-library-card__try'));
 assert.ok(library.includes("setPractice([sample(type,ar?'ar':'en')])"));
 assert.ok(simulation.includes('flattenDeck(activities)'));
 assert.ok(simulation.includes('onClose'));
 assert.ok(simulation.includes("mode==='play'"));
 assert.ok(simulation.includes("mode==='host'"));
 assert.ok(simulation.includes("mode==='display'"));
 assert.ok(!simulation.includes("api('sessions'"));
 assert.ok(!simulation.includes("api('control'"));
 const css=readFileSync('components/arena/ArenaSimulator.css','utf8');
 assert.ok(css.includes('.arena-simulator-overlay'));
 assert.ok(css.includes('.arena-practice-library-card__try'));
 assert.ok(css.includes('@media(max-width:850px)'));
});

test("trainee registration UI is frozen by the trainer's explicit decision",()=>{
 const source=readFileSync('components/arena/Session.tsx','utf8');
 // Source-level contract: the whole actual join form, not just input labels,
 // must stay byte-for-byte (UTF-16 code-unit) unchanged during V6 UX upgrades.
 // Changes require user approval and a deliberate baseline review.
 const start=source.indexOf('<form onSubmit={join}>{!recovering');
 const end=source.indexOf('</form>',start);
 assert.ok(start>=0&&end>start,'The current real participant join form must remain present');
 const form=source.slice(start,end+7);
 assert.equal(form.length,2478,'Registration form structure/labels/ordering must not change');
 let hash=0x811c9dc5;
 for(let i=0;i<form.length;i++)hash=Math.imul(hash^form.charCodeAt(i),0x01000193)>>>0;
 assert.equal(hash.toString(16).padStart(8,'0'),'c17f4cea','The owner-approved participant login form must remain unchanged');
 const fields=[
  "t('الاسم بالكامل','Full name')",
  "t('لغة المشاركة','Participation language')",
  "t('الرقم الوظيفي','Employee ID')",
  "t('كود استرجاع المشاركة','Participation recovery code')",
  "t('اختار فريقك','Choose your team')",
  "t('أؤكد إن الاسم والرقم الوظيفي صحيحين.','I confirm my name and employee ID are correct.')"
 ];
 for(const label of fields)assert.ok(form.includes(label),'Missing required participant registration field: '+label);
 assert.ok(form.includes('disabled={busy||(!recovering&&!confirmed)}'));
 assert.ok(form.includes("onClick={()=>{setRecovering(!recovering);setError('');}}"));
 const codeForm=source.slice(source.indexOf('<form onSubmit={join}><label>'),start);
 assert.ok(codeForm.includes("t('كود الجلسة','Session code')"),'Standalone session code entry remains separate');
});

test('QR entry states protect the unchanged participant registration form',()=>{
 for(const ar of [true,false]){
  const waiting=renderToStaticMarkup(<SessionEntryFeedback ar={ar} kind="not-ready"
   title="Communication Workshop" onRetry={()=>{}} onChangeCode={()=>{}}/>);
  assert.ok(waiting.includes('Communication Workshop'));
  assert.ok(waiting.includes(ar?'الجلسة لسه بتتجهّز':'Your session is being prepared'));
  assert.ok(waiting.includes(ar?'تحديث حالة الجلسة':'Refresh session status'));
  assert.ok(!waiting.includes('name="employeeId"')); // The existing form never appears before lobby.
  const unavailable=renderToStaticMarkup(<SessionEntryFeedback ar={ar} kind="unavailable"
   onRetry={()=>{}} onChangeCode={()=>{}}/>);
  assert.ok(unavailable.includes(ar?'إعادة المحاولة':'Try again'));
  assert.ok(unavailable.includes(ar?'أدخل كود مختلف':'Use a different session code'));
  const invalid=renderToStaticMarkup(<SessionEntryFeedback ar={ar} kind="invalid" onChangeCode={()=>{}}/>);
  assert.ok(invalid.includes(ar?'راجع كود الجلسة':'Check your session code'));
  assert.ok(!invalid.includes(ar?'تحديث حالة الجلسة':'Refresh session status'));
 }
 const source=readFileSync('components/arena/Session.tsx','utf8');
 assert.ok(source.includes('SessionEntryFeedback'));
 assert.ok(source.includes("kind=\"not-ready\" title={s.title}"));
 assert.ok(source.includes("kind=\"invalid\""));
 assert.ok(source.includes("'not-found':'unavailable'"), "Missing codes are distinguished from outages");
 assert.ok(source.includes("['ready','draft'].includes(s.status)"));
 assert.ok(source.includes("lastTraineeRound.current===key"));
 assert.ok(source.includes("window.scrollTo({top:0,behavior:'auto'})"));
 assert.ok(source.includes("splash&&(host||display||isJoined)"),'The intro must never cover the unregistered trainee form');
 assert.ok(source.includes("const fallbackMs=host||view==='display'?1400:activeLearner?5000:12000"));
 assert.ok(source.includes("liveConnection==='live'?45000:fallbackMs"));
 const css=readFileSync('app/globals.css','utf8');
 assert.ok(css.includes('.session-entry-feedback__actions'));
 assert.ok(css.includes('min-height:49px'));
});

test('server-acknowledged participant answers never claim success on a click',()=>{
 const source=readFileSync('components/arena/Session.tsx','utf8');
 const poll=readFileSync('components/arena/LivePoll.tsx','utf8');
 const css=readFileSync('app/globals.css','utf8');
 assert.ok(source.includes("async function checkAnswerReceipt(round:number)"),'There is a safe state verification path');
 assert.ok(source.includes("const receipt=await api('answer',{code,round,answer},token)"));
 assert.ok(source.includes("receipt?.ok!==true"),'Receipt must come from backend');
 assert.ok(source.includes("setAnswerProgress({round,phase:'sending'})"));
 assert.ok(source.includes("setAnswerProgress({round,phase:'verifying'})"));
 assert.ok(source.includes("setAnswerProgress({round,phase:'confirmed'})"));
 assert.ok(source.includes("setAnswerProgress({round,phase:state?.mine?.answered?'confirmed':'uncertain'})"));
 assert.ok(source.includes("state?.status==='question'&&!state.paused&&state.mine?.eligible"));
 assert.ok(source.includes("answerSendLock.current"),'Avoid same-render double sends');
 assert.ok(source.includes('role="status" aria-live="polite"'));
 assert.ok(source.includes('onClick={verifyAnswerReceipt}'));
 assert.ok(!source.includes('submitted:old.submitted+1,mine:{...old.mine,answered:true,answer}'),'Never fabricate a server receipt or count');
 assert.ok(poll.includes("function vote(answer:any){if(!allow)return;onSubmit(answer);}"));
 assert.ok(!poll.includes('setSuccess(true)'),'Voting click is not the successful server receipt');
 assert.ok(poll.includes('already&&<span className="live-poll-vote__success"'));
 assert.ok(css.includes('.trainee-answer-receipt.uncertain'));
});

test('trainer launch readiness distinguishes actual state from manual checks',()=>{
 for(const ar of [true,false]){
  const before=renderToStaticMarkup(<TrainerReadiness ar={ar} status="ready"
    players={[]} activityCount={5} connectionOk={true} transport="live"
    nextActivity="Quiz" onRefresh={()=>{}}/>);
  assert.ok(before.includes("Quiz"));
  assert.ok(before.includes(ar?'فحص الاستعداد قبل التشغيل':'PRE-SESSION READINESS'));
  assert.ok(before.includes(ar?'التسجيل يفتح بعد فتح اللوبي':'Registration opens with the lobby'));
  assert.ok(before.includes('type="checkbox"'), 'Equipment must require trainer confirmation');
  assert.ok(before.includes('0/3'), 'No manually verified equipment before trainer confirms');
  const lobby=renderToStaticMarkup(<TrainerReadiness ar={ar} status="lobby"
    players={[{approval:'approved'},{approval:'pending'}]} activityCount={2}
    connectionOk={true} transport="fallback" onRefresh={()=>{}}/>);
  assert.ok(lobby.includes(ar?'تحديث احتياطي يعمل':'Fallback synchronization'));
  assert.ok(lobby.includes(ar?'طلبات معلقة: ':'Pending approvals: '));
  const broken=renderToStaticMarkup(<TrainerReadiness ar={ar} status="lobby"
    players={[]} activityCount={0} connectionOk={false}
    transport="fallback" onRefresh={()=>{}}/>);
  assert.ok(broken.includes(ar?'الاتصال غير متاح':'Connection unavailable'));
 }
 const source=readFileSync('components/arena/Session.tsx','utf8');
 assert.ok(source.includes("import TrainerReadiness from './TrainerReadiness'"));
 assert.ok(source.includes("onClick={beginSession}"));
 const directorSource=readFileSync('components/arena/TrainerDirectorDashboard.tsx','utf8');
 assert.ok(directorSource.includes("s.status==='ready'?t('افتح استقبال المتدربين'"));
 assert.ok(directorSource.includes("s.status==='lobby'?t('ابدأ أول نشاط'"));
 assert.ok(source.includes("s.status==='ready'){command('launch');return;"));
 assert.ok(source.includes("if(ready===0&&!window.confirm"),'Warn before running empty session');
 const css=readFileSync('app/globals.css','utf8');
 assert.ok(css.includes('V6 Trainer Readiness'));
 assert.ok(css.includes('.trainer-readiness__signals'));
});

test('trainer session builder supports safe blank vs sample deck and honest timing estimate',()=>{
 const empty=estimateSessionAgenda([]);
 assert.deepEqual(empty,{timedSeconds:0,discussionSeconds:0,transitionSeconds:0,totalSeconds:0,untimedSteps:0,steps:0});
 const demo=estimateSessionAgenda([
  {type:'Quiz',timer:30},
  {type:'Quiz',questions:[{type:'Quiz',timer:20},{type:'Quiz',timer:40}]},
  {type:'Flashcards'},
 ] as any);
 assert.equal(demo.timedSeconds,90);
 assert.equal(demo.discussionSeconds,90, 'Two flashcards need time for explanation and reflection');
 assert.equal(demo.transitionSeconds,90);
 assert.equal(demo.totalSeconds,270);
 assert.equal(demo.untimedSteps,1);
 assert.equal(demo.steps,4);
 for(const ar of [true,false]){
  const markup=renderToStaticMarkup(<Builder ar={ar} initial="all"
   owner="trainer" onClose={()=>{}} onCreated={()=>{}}/>);
  assert.ok(markup.includes(ar?'ابدأ بجلسة فاضية':'Start with a blank session'));
  assert.ok(markup.includes(ar?'حمّل نماذج الألعاب العشرة':'Load all 10 game examples'));
  assert.ok(markup.includes(ar?'تقدير مبدئي للوقت':'DRAFT TIME ESTIMATE'));
 }
 const src=readFileSync('components/arena/Builder.tsx','utf8');
 assert.ok(src.includes('if(deck.length&&!window.confirm('));
  assert.ok(src.includes('setDeck(blank?[]:types.map(type=>newSessionActivity('));
 assert.ok(src.includes('disabled={busy||!deck.length}'));
 const css=readFileSync('app/globals.css','utf8');
 assert.ok(css.includes('.builder-starter-panel'));
 assert.ok(css.includes('.builder-planning-summary'));
});

test('trainee finale reports only real personal points, rank and team, not fabricated scores',()=>{
 const base:any={
  status:'completed',teamMode:false,mine:{id:'u2',name:'Mona'},
  players:[{uid:'u1',name:'Ali',team:'Lightning'},{uid:'u2',name:'Mona',team:'Wave'}],
  individual:[{uid:'u1',name:'Ali',rank:1,score:3500},{uid:'u2',name:'Mona',rank:2,score:1700}],
  teams:[{team:'Lightning',rank:1,score:3500},{team:'Wave',rank:2,score:1700}]
 };
 const own=ownSessionResult(base);
 assert.equal(own?.score,1700);
 assert.equal(own?.rank,2);
 assert.equal(own?.count,2);
 assert.equal(own?.teamRank,null);
 const en=renderToStaticMarkup(<TraineeFinish s={base} ar={false}/>);
 assert.ok(en.includes('Mona'));
 assert.ok(en.includes('1,700'));
 assert.ok(en.includes('#2'));
 assert.ok(!en.includes('3,500'), 'Do not misrepresent another person\'s points as my own');
 const ar=renderToStaticMarkup(<TraineeFinish s={{...base,teamMode:true}} ar={true}/>);
 assert.ok(ar.includes('مركز فريقك'));
 assert.ok(ar.includes('Wave'));
 assert.ok(!ar.includes('Lightning'));
 assert.equal(ownSessionResult({...base,teamMode:true})?.teamRank,2);
 const unscored={...base,individual:base.individual.map((p:any)=>({...p,score:0}))};
 const noScores=renderToStaticMarkup(<TraineeFinish s={unscored} ar={false}/>);
 assert.ok(noScores.includes('Every contribution counts!'));
 assert.ok(!noScores.includes('YOUR INDIVIDUAL RANK'), 'Unscored polls should not imply a competition rank');
 const source=readFileSync('components/arena/Session.tsx','utf8');
 assert.ok(source.includes('{isJoined&&<TraineeFinish s={s} ar={ar}/>'));
 assert.ok(readFileSync('app/globals.css','utf8').includes('.trainee-finish__stats'));
});



test('mobile quiz option selections are accessible and submission stays reachable',()=>{
 const activity:any={...sample('Quiz','en'),prompt:'What matters?',options:['Listen','Speak','Think','Act'],timer:20};
 const html=renderToStaticMarkup(<GamePlay s={{
  activity,players:[],individual:[],status:'question',serverNow:Date.now(),current:0,
  runtime:{phase:'answering'},mine:{id:'p',name:'Student',eligible:true,approval:'approved'}
 }} ar={false} host={false} display={false} canAnswer={true} busy={false}
 onSubmit={()=>{}} onInteract={()=>{}} onControl={()=>{}}/>);
 assert.ok(html.includes('aria-pressed="false"'),'Choice controls communicate selection state');
 assert.ok(html.includes('aria-label="Lock in answer"'),'Submit action is announced to assistive tech');
 const css=readFileSync('app/globals.css','utf8');
 assert.ok(css.includes('V6 learner smartphone usability'));
 assert.ok(css.includes('.session-shell.trainee .round-stage .question-interaction>.submit-answer'));
 assert.ok(css.includes('position:sticky'),'Confirm action remains reachable on long mobile questions');
 assert.ok(css.includes('min-height:66px'),'Mobile choices have generous touch targets');
 const src=readFileSync('components/arena/GamePlay.tsx','utf8');
 assert.ok(src.includes('aria-pressed={selected===i}'));
});

test('Fortune Wheel stage artwork follows server selected sector and keeps game controls',()=>{
 const a:any=sample('Wheel of Fortune','en');
 const now=Date.now();
 const base:any={
  activity:a,status:'question',current:0,serverNow:now,clockNow:now,
  players:[{uid:'p1',name:'Test Player',approval:'approved'}],individual:[],
  mine:null,paused:false,runtime:{phase:'answering'},
  game:{turn:1,rounds:3,used:[1],target:'p1',spin:{
   id:'server-spin-1',index:1,startsAt:now-6000,stopsAt:now-1000,revealed:true
  },outcome:{kind:'prize',label:'Participation star',detail:'Well played',points:200}}
 };
 const html=renderToStaticMarkup(<GamePlay s={base} ar={false} host={true}
  display={false} canAnswer={false} busy={false} onSubmit={()=>{}}
  onInteract={()=>{}} onControl={()=>{}}/>);
 assert.ok(html.includes('wheel-wrap--grand'));
 assert.ok(html.includes('arena-wheel-gradient'),'Segments are painted from authored kinds');
 assert.ok(html.includes('wheel-legend-winner'),'Server selected sector is highlighted');
 assert.ok(html.includes('aria-current="true"'),'Accessible winning section marker');
 assert.ok(html.includes('Participation star'),'Real server outcome label is displayed');
 assert.ok(html.includes('+200'),'Real server assigned points are displayed');
 assert.ok(html.includes('--wheel-stop'),'Wheel stop angle follows server index');
 assert.ok(html.includes('wheel-tap-surface'),'Wheel itself is the accessible trainer and player Spin control');
 const untouched=renderToStaticMarkup(<GamePlay s={{
  ...base,game:{...base.game,spin:null,outcome:null,turn:0,used:[]}
 }} ar={true} host={true} display={false} canAnswer={false} busy={false}
 onSubmit={()=>{}} onInteract={()=>{}} onControl={()=>{}}/>);
 assert.ok(untouched.includes('اضغط على العجلة لبدء اللف'));
 assert.ok(!untouched.includes('wheel-legend-winner'));
 const source=readFileSync('components/arena/GamePlay.tsx','utf8');
 assert.ok(source.includes("spin?.revealed&&spin.index===i"),'Winners must come from server spin, never client randomness');
 const css=readFileSync('app/globals.css','utf8');
 assert.ok(css.includes('V6 WHEEL OF FORTUNE — GRAND ARENA SHOW'));
 assert.ok(css.includes('.projector .wheel-wrap--grand'));
 assert.ok(css.includes('prefers-reduced-motion:reduce'));
});


test('Mystery Vault opens only the selected server box and marks exhausted boxes',()=>{
 const a:any=sample('Open the Box','en');
 const base:any={activity:a,status:'question',current:0,
  runtime:{phase:'answering'},players:[{uid:'p',name:'Alex',approval:'approved'}],
  mine:null,game:{target:'p',turn:0,used:[1],version:2,
   box:{index:1,label:'DISCOVERY CHALLENGE',detail:'Team reflection prompt',question:null}}};
 const host=renderToStaticMarkup(<GamePlay s={base} ar={false} host={true} display={false}
  canAnswer={false} busy={false} onSubmit={()=>{}} onInteract={()=>{}} onControl={()=>{}}/>);
 assert.ok(host.includes('box-stage--vault'));
 assert.ok(host.includes('box-vault-box--active'));
 assert.ok(host.includes('box-vault-box--used'));
 assert.ok(host.includes('DISCOVERY CHALLENGE'),'Use actual server reveal, never sample text');
 assert.ok(host.includes('Team reflection prompt'));
 assert.ok(host.includes('Select player'));
 assert.ok(host.includes('aria-pressed="true"'));
 assert.ok(host.includes('already opened'));
 assert.ok(host.includes('disabled=""'),'Used box cannot be reopened without repeatable flag');
 const spectator=renderToStaticMarkup(<GamePlay s={{...base,game:{...base.game,used:[],box:null}}}
  ar={true} host={false} display={true} canAnswer={false} busy={false}
  onSubmit={()=>{}} onInteract={()=>{}} onControl={()=>{}}/>);
 assert.ok(spectator.includes('صناديق المفاجآت'));
 assert.ok(spectator.includes('disabled=""'),'Projector has no authority to open a box');
 assert.ok(!spectator.includes('DISCOVERY CHALLENGE'),'No reveal before server sends it');
 const src=readFileSync('components/arena/GamePlay.tsx','utf8');
 assert.ok(src.includes('questionSlot={g.box?.question&&!g.box.answered?'),'Nested quiz remains playable');
 assert.ok(src.includes("send('boxquiz',{answer})"),'Existing backend mini-quiz action stays unchanged');
});
test('Knowledge Flashcards flip only on server reveal and keep self-review unscored',()=>{
 const a:any=sample('Flashcards','en');
 const base:any={activity:a,status:'question',current:0,paused:false,
  runtime:{phase:'answering'},players:[],individual:[],
  game:{card:0,flipped:false,back:'Secret correct answer',reviewed:[],version:1},
  mine:{id:'p',name:'Student',eligible:true,approval:'approved'}};
 const front=renderToStaticMarkup(<GamePlay s={base} ar={false} host={false} display={false}
  canAnswer={true} busy={false} onSubmit={()=>{}} onInteract={()=>{}} onControl={()=>{}}/>);
 assert.ok(front.includes('flash-stage--academy'));
 assert.ok(front.includes('flash-academy-deck'));
 assert.ok(front.includes('aria-pressed="false"'));
 assert.ok(!front.includes('Secret correct answer'),'Cannot reveal the back before card flip');
 const revealed=renderToStaticMarkup(<GamePlay s={{...base,game:{...base.game,flipped:true,reviewed:[{index:0,known:true}]}}}
  ar={false} host={false} display={false} canAnswer={true} busy={false}
  onSubmit={()=>{}} onInteract={()=>{}} onControl={()=>{}}/>);
 assert.ok(revealed.includes('Secret correct answer'));
 assert.ok(revealed.includes('I knew it'));
 assert.ok(revealed.includes('Review again'));
 assert.ok(revealed.includes('marked as known'));
 assert.ok(revealed.includes('aria-pressed="true"'));
 const spectator=renderToStaticMarkup(<GamePlay s={{...base,mine:null,reveal:-1}}
  ar={false} host={false} display={true} canAnswer={false} busy={false}
  onSubmit={()=>{}} onInteract={()=>{}} onControl={()=>{}}/>);
 assert.ok(spectator.includes('flash-academy-deck'));
 assert.ok(spectator.includes('disabled=""'),'Projector cannot change backend card states');
 const css=readFileSync('app/globals.css','utf8');
 assert.ok(css.includes('V6 SIGNATURE DISCOVERY GAMES'));
 assert.ok(css.includes('box-vault-box--active'));
 assert.ok(css.includes('.flash-academy-card--flipped .flash-academy-card__inner'));
 assert.ok(css.includes('prefers-reduced-motion:reduce'));
});

test('facilitator starter templates preserve the original session editor and required registration fields',()=>{
 assert.deepEqual(sessionTemplateOptions.map(x=>x.targetMinutes),[60,15,30,60]);
 for(const language of ['ar','en'] as const){
  for(const [id,count] of [['warmup',3],['workshop',4],['full',7]] as const){
   const deck=makeSessionStarter(id,language);
   assert.equal(deck.length,count);
   assert.ok(deck.every(a=>typeof a.prompt==='string'&&a.prompt.length>0));
   assert.ok(deck.every(a=>types.includes(a.type)),id);
   assert.equal(deck[0].type,'Live Poll');
   assert.ok(deck.some(a=>a.type==='Quiz'));
   const separate=makeSessionStarter(id,language);
   separate[0].prompt='CHANGED ONLY FOR TEST';
   assert.notEqual(deck[0].prompt,separate[0].prompt,'Templates must be independent objects');
  }
 }
 for(const ar of [true,false]){
  const html=renderToStaticMarkup(<Builder ar={ar} initial="all" owner="trainer"
   onClose={()=>{}} onCreated={()=>{}}/>);
  for(const minutes of [15,30,60])assert.ok(html.includes(String(minutes)),String(minutes));
  assert.ok(html.includes(ar?'كسر جليد':'Warm-up'));
  assert.ok(html.includes(ar?'سيشن تفاعلي':'Interactive'));
  assert.ok(html.includes(ar?'ورشة كاملة':'Full workshop'));
 }
 const builder=readFileSync('components/arena/Builder.tsx','utf8');
 assert.ok(builder.includes("if(deck.length&&!window.confirm("));
 assert.ok(builder.includes('setDeck(makeSessionStarter('));
 assert.ok(builder.includes("if(live)return;"));
 assert.ok(builder.includes('sessionTemplateOptions.map('));
 const css=readFileSync('app/globals.css','utf8');
 assert.ok(css.includes('.builder-session-template:focus-visible'));
 const session=readFileSync('components/arena/Session.tsx','utf8');
 assert.ok(session.includes("t('الاسم بالكامل','Full name')"));
 assert.ok(session.includes("t('الرقم الوظيفي','Employee ID')"));
});

test('premium Order It stage keeps revealed ordering server-authoritative and supports touch controls',()=>{
 const activity:any=sample('Order It','en');
 const mine={id:'p',name:'Practice Learner',eligible:true,approval:'approved',answered:false};
 const session:any={
  activity,status:'question',current:0,runtime:{phase:'answering'},players:[],individual:[],
  mine,keyRevealed:false,game:{version:1}
 };
 const render=(state:any,role:'host'|'play'|'display')=>renderToStaticMarkup(<GamePlay s={state} ar={false}
  host={role==='host'} display={role==='display'} canAnswer={role==='play'} busy={false}
  onSubmit={()=>{}} onInteract={()=>{}} onControl={()=>{}}/>);
 const learner=render(session,'play');
 assert.ok(learner.includes('arena-sequence'),'Order It has its own stage instead of Quiz');
 assert.ok(learner.includes('LOCK IN MY SEQUENCE'));
 assert.ok(learner.includes('Move '),'Mobile-friendly accessible up and down step controls');
 assert.ok(learner.includes('aria-label="Step order"'));
 assert.ok(learner.includes('draggable="true"'));
 const projector=render({...session,mine:null},'display');
 assert.ok(projector.includes('arena-sequence'));
 assert.ok(!projector.includes('LOCK IN MY SEQUENCE'),'Projector never submits answers');
 assert.ok(!projector.includes('draggable="true"'),'Projector cannot reorder');
 const waiting=render({...session,mine:{...mine,answered:true,answer:[3,1,2,0]}},'play');
 assert.ok(waiting.includes('Your sequence is recorded'));
 assert.ok(!waiting.includes('LOCK IN MY SEQUENCE'));
 const withheld=render({...session,status:'results',keyRevealed:false},'display');
 assert.ok(withheld.includes('Wait for the trainer to reveal'));
 assert.ok(!withheld.includes('officially revealed correct order'));
 const revealed=render({...session,status:'results',keyRevealed:true},'display');
 assert.ok(revealed.includes('officially revealed correct order'));
 assert.ok(revealed.includes('arena-sequence__step--revealed'));
 const css=readFileSync('app/globals.css','utf8');
 assert.ok(css.includes('V6 Order It: accessible cinematic sequencing board'));
 assert.ok(css.includes('.arena-sequence__step-actions button'));
 assert.ok(css.includes('prefers-reduced-motion:reduce'));
});

test('premium Game Show stage keeps authoritative casting, betting and lifelines',()=>{
 for(const ar of [true,false]){
  const activity=publicActivity(sample('Ultimate Game Show',ar?'ar':'en'));
  const players=[{uid:'p1',name:'Learner One',approval:'approved',team:'Lightning'},
   {uid:'p2',name:'Learner Two',approval:'approved',team:'Wave'}];
  const make=(phase:string,actor:boolean,closed=false)=>({
   activity,players,individual:[{uid:'p1',name:'Learner One',score:2500}],
   mine:actor?{id:'p1',eligible:true,answered:false}:null,
   runtime:{phase,targets:['p1']},paused:false,status:closed?'results':'question',
   current:0,queue:[activity],game:{version:0,lifelines:[],bet:null,audienceRequested:false}
  });
  const cast=renderToStaticMarkup(<GamePlay s={make('casting',false)} ar={ar}
   host={true} display={false} canAnswer={false} busy={false}
   onSubmit={()=>{}} onInteract={()=>{}} onControl={()=>{}}/>);
  assert.ok(cast.includes('arena-tv-show--casting'));
  assert.ok(cast.includes('Learner One'));
  assert.ok(cast.includes('arena-tv-show__contestants'));
  assert.ok(!cast.includes('answer-option'),'Never leak answer choices during casting');
  const betting=renderToStaticMarkup(<GamePlay s={make('betting',true)} ar={ar}
   host={false} display={false} canAnswer={true} busy={false}
   onSubmit={()=>{}} onInteract={()=>{}} onControl={()=>{}}/>);
  assert.ok(betting.includes('arena-tv-show--betting'));
  assert.ok(betting.includes('2500')||betting.includes('2,500'));
  assert.ok(!betting.includes('answer-option'),'Never leak questions during staking');
  const playing={...make('answering',true),game:{
   version:0,lifelines:['fifty'],eliminated:[1,2],bet:null,
   audienceRequested:true,audience:[2,1,0,0]}};
  const answer=renderToStaticMarkup(<GamePlay s={playing} ar={ar}
   host={false} display={false} canAnswer={true} busy={false}
   onSubmit={()=>{}} onInteract={()=>{}} onControl={()=>{}}/>);
  assert.ok(answer.includes('arena-tv-show--answering'));
  assert.ok(answer.includes('arena-tv-show__question-frame'));
  assert.ok(answer.includes('arena-tv-show__powerups'));
  assert.ok(answer.includes('arena-tv-show__audience-chart'));
  assert.ok(answer.includes('50:50'));
  assert.ok(answer.includes('disabled=""'),'Used lifelines and eliminated answers remain disabled');
  const screen=renderToStaticMarkup(<GamePlay s={{...playing,mine:null}} ar={ar}
   host={false} display={true} canAnswer={false} busy={false}
   onSubmit={()=>{}} onInteract={()=>{}} onControl={()=>{}}/>);
  assert.ok(screen.includes('arena-tv-show__audience'));
  assert.ok(!screen.includes('arena-tv-show__powerups'));
  assert.ok(!screen.includes('arena-tv-show__audience-ballot'));
 }
 const source=readFileSync('components/arena/GamePlay.tsx','utf8');
 const game=readFileSync('components/arena/ArenaGameShow.tsx','utf8');
 const css=readFileSync('app/globals.css','utf8');
 assert.ok(source.includes("import ArenaGameShow from './ArenaGameShow'"));
 assert.ok(game.includes("send('lifeline',{kind})"));
 assert.ok(game.includes("send('audience',{choice:i})"));
 assert.ok(game.includes("onControl('lockbets')"));
 assert.ok(game.includes("onControl('stagecast',undefined,{players:cast})"));
 assert.ok(game.includes("maxStake=Math.min(10000"));
 assert.ok(css.includes('V6 WAVE 3 — CINEMATIC ULTIMATE GAME SHOW'));
 assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'));
});
test('premium Escape Room: actor-only puzzles, stage map and audited trainer overrides',()=>{
 for(const ar of [true,false]){
  const original=sample('Escape Room',ar?'ar':'en');
  const a=publicActivity(original);
  const players=[{uid:'p1',name:'Learner One',approval:'approved',team:'Lightning'}];
  const state:any={activity:a,players,runtime:{phase:'answering'},current:0,
   status:'question',game:{version:0,progress:[{actor:'p1',room:1,puzzle:0}],
    escape:{room:0,puzzle:0,totalRooms:2,title:original.rooms[0].title,
     narrative:original.rooms[0].narrative,
     question:publicActivity(original.rooms[0].puzzles[0]),
     hintAvailable:false,attempts:0,lastCorrect:null,escaped:false}},
   mine:{id:'p1',eligible:true},paused:false,serverNow:Date.now()};
  const learner=renderToStaticMarkup(<GamePlay s={state} ar={ar}
   host={false} display={false} canAnswer={true} busy={false}
   onSubmit={()=>{}} onInteract={()=>{}} onControl={()=>{}}/>);
  assert.ok(learner.includes('arena-escape-vault'));
  assert.ok(learner.includes('arena-escape-vault__mission'));
  assert.ok(learner.includes('arena-escape-vault__route'));
  assert.ok(learner.includes('arena-escape-vault__puzzle'));
  assert.ok(learner.includes('disabled=""'),'Hints unavailable before first attempt');
  const viewer=renderToStaticMarkup(<GamePlay s={{...state,mine:null}} ar={ar}
   host={false} display={true} canAnswer={false} busy={false}
   onSubmit={()=>{}} onInteract={()=>{}} onControl={()=>{}}/>);
  assert.ok(viewer.includes('arena-escape-vault__spectator'));
  assert.ok(!viewer.includes('arena-escape-vault__puzzle'));
  assert.ok(!viewer.includes(original.rooms[0].puzzles[0].prompt));
  const trainer=renderToStaticMarkup(<GamePlay s={{...state,mine:null}} ar={ar}
   host={true} display={false} canAnswer={false} busy={false}
   onSubmit={()=>{}} onInteract={()=>{}} onControl={()=>{}}/>);
  assert.ok(trainer.includes('Learner One'));
  assert.ok(trainer.includes('arena-escape-vault__participants'));
  assert.ok(trainer.includes(ar?'تجاوز موثّق':'Audited override'));
  const final=renderToStaticMarkup(<GamePlay s={{...state,game:{version:3,escape:{
   room:2,puzzle:0,totalRooms:2,escaped:true}}}} ar={ar}
   host={false} display={false} canAnswer={false} busy={false}
   onSubmit={()=>{}} onInteract={()=>{}} onControl={()=>{}}/>);
  assert.ok(final.includes('arena-escape-vault--escaped'));
  assert.ok(!final.includes('arena-escape-vault__puzzle'));
 }
 const source=readFileSync('components/arena/GamePlay.tsx','utf8');
 const code=readFileSync('components/arena/ArenaEscapeRoom.tsx','utf8');
 assert.ok(source.includes("import ArenaEscapeRoom from './ArenaEscapeRoom'"));
 assert.ok(code.includes("send('puzzle',{answer})"));
 assert.ok(code.includes("send('hint')"));
 assert.ok(code.includes("onControl('override',undefined,{player:participant.uid||participant.id,reason:reason.trim()})"));
 assert.ok(code.includes('const readyToOverride='));
 assert.ok(!code.includes('a.rooms[e.room].puzzles['),'Never read hidden full room puzzle content on the client');
});


test('Meta Plan notes never leak hidden answers across roles',()=>{
 for(const ar of [false,true]){
  const a:any={type:'Meta Plan',prompt:'Classify ideas',items:['Invoice','Inspection','Clearance'],
   categories:['Before arrival','After arrival'],assignments:[0,1,1],timer:0};
  const base:any={activity:a,status:'question',current:0,keyRevealed:false,
   players:[{uid:'u1',name:'Learner'}],mine:null,submitted:0,metaSummary:null,
   runtime:{highlight:-1,analytics:false,notes:''}};
  const host=renderToStaticMarkup(<ArenaMetaPlan s={base} ar={ar} host display={false} actor={false}
   canAnswer={false} busy={false} onSubmit={()=>{}} onControl={()=>{}}/>);
  assert.ok(host.includes('arena-metaplan__columns'));
  assert.ok(host.includes('arena-metaplan__loose'));
  assert.ok(host.includes('arena-metaplan__trainer-notes'));
  assert.ok(!host.includes('arena-metaplan__placed'),'Never reveal classified cards before host opens reveal');
  const display=renderToStaticMarkup(<ArenaMetaPlan s={base} ar={ar} host={false} display actor={false}
   canAnswer={false} busy={false} onSubmit={()=>{}} onControl={()=>{}}/>);
  assert.ok(display.includes('arena-metaplan__columns'));
  assert.ok(!display.includes('arena-metaplan__trainer-notes'));
  assert.ok(!display.includes('arena-metaplan__trainer'));
  const learner=renderToStaticMarkup(<ArenaMetaPlan
   s={{...base,mine:{id:'u1',eligible:true,answered:false},status:'question'}}
   ar={ar} host={false} display={false} actor canAnswer busy={false}
   onSubmit={()=>{}} onControl={()=>{}}/>);
  assert.ok(learner.includes('arena-metaplan__learner'));
  assert.ok(learner.includes('meta-drag-board'),'Learner sees tactile drag/drop classification board');
  assert.ok(learner.includes('data-meta-category'),'Drag-target categories are present');
  assert.ok(learner.includes('arena-metaplan__submit'));
  assert.ok(learner.includes('disabled=""'),'Submit stays disabled until every item is assigned');
  assert.ok(!learner.includes('arena-metaplan__correct'));
  const closed=renderToStaticMarkup(<ArenaMetaPlan
   s={{...base,status:'results',keyRevealed:true,activity:{...a,assignments:[0,-1,-1]}}}
   ar={ar} host display={false} actor={false} canAnswer={false} busy={false}
   onSubmit={()=>{}} onControl={()=>{}}/>);
  assert.equal((closed.match(/arena-metaplan__placed/g)||[]).length,1,
   'Progressive reveal exposes only server disclosed assignments');
  assert.equal((closed.match(/class="arena-metaplan__loose"/g)||[]).length,2,
   'Unrevealed notes stay in the unsorted pile');
 }
 const source=readFileSync('components/arena/GamePlay.tsx','utf8');
 assert.ok(source.includes("if(['Meta Plan','Categorize'].includes(a.type))return <ArenaMetaPlan"));
 const css=readFileSync('app/globals.css','utf8');
 assert.ok(css.includes('V6 Meta Plan premium sticky-note board'));
 assert.ok(css.includes('.projector .arena-metaplan'));
});
test('Meta Plan reveal, notes, and aggregate insights remain server-owned',()=>{
 const source=readFileSync('components/arena/ArenaMetaPlan.tsx','utf8');
 assert.ok(source.includes("closed&&s.keyRevealed&&Array.isArray(a.assignments)"));
 assert.ok(source.includes("onControl('metareveal')"));
 assert.ok(source.includes("onControl('revealkey')"));
 assert.ok(source.includes("onControl('notes',undefined,{notes})"));
 assert.ok(source.includes('Array.isArray(s.metaSummary)'));
 assert.ok(!source.includes("api('answer'"));
});

test('Scenario Challenge has its own bilingual trainer, learner and projector stage without leaking private paths',()=>{
 const source=readFileSync('components/arena/GamePlay.tsx','utf8');
 assert.ok(source.includes('return <ArenaScenario s={s} ar={ar}'));
 const css=readFileSync('app/globals.css','utf8');
 assert.ok(css.includes('V6 Scenario Challenge — fully distinct cinematic'));
 assert.ok(css.includes('.arena-scenario__choice:focus-visible'));
 assert.ok(css.includes('prefers-reduced-motion:reduce'));
 for(const ar of [true,false]){
  const a=sample('Scenario Challenge',ar?'ar':'en');
  const current={text:'The package is incomplete',choices:[{label:'Review first'},{label:'Send now'}],
    ending:false,path:[]};
  const base:any={activity:publicActivity(a),status:'question',mine:{id:'demo',eligible:true,answered:false},
   current:0,paused:false,game:{version:2,scenario:current},players:[{uid:'demo',name:'Learner'}],
   runtime:{},serverNow:Date.now()};
  const learner=renderToStaticMarkup(<GamePlay s={base} ar={ar} host={false} display={false}
   canAnswer busy={false} onSubmit={()=>{}} onInteract={()=>{}} onControl={()=>{}}/>);
  assert.ok(learner.includes('arena-scenario--learner'));
  assert.ok(learner.includes('arena-scenario__case'));
  assert.ok(learner.includes('arena-scenario__choices'));
  assert.ok(learner.includes('Review first'));
  assert.ok(!learner.includes('disabled=""'));
  const privateState={...base,game:{version:4,scenario:{text:'Current',choices:[{label:'Private decision'}],
    consequence:'PRIVATE CONSEQUENCE',path:[{consequence:'PRIVATE PATH STEP'}]}}};
  for(const role of ['host','display']){
   const rendered=renderToStaticMarkup(<GamePlay s={{...privateState,mine:null}} ar={ar}
    host={role==='host'} display={role==='display'} canAnswer={false} busy={false}
    onSubmit={()=>{}} onInteract={()=>{}} onControl={()=>{}}/>);
   assert.ok(rendered.includes('arena-scenario--stage'));
   assert.ok(!rendered.includes('PRIVATE CONSEQUENCE'));
   assert.ok(!rendered.includes('PRIVATE PATH STEP'));
   assert.ok(!rendered.includes('Private decision'));
   assert.ok(!rendered.includes('arena-scenario__choices'));
   if(role==='host')assert.ok(rendered.includes('arena-scenario__facilitator'));
   else assert.ok(!rendered.includes('arena-scenario__facilitator'));
  }
  const progressed=renderToStaticMarkup(<ArenaScenario s={base} ar={ar}
   host={false} display={false} actor usable busy={false} closed={false}
   g={{scenario:{...current,consequence:'I reviewed the details',
    path:[{node:'start',choice:0,consequence:'I reviewed the details'}]}}}
   send={()=>{}}/>);
  assert.ok(progressed.includes('I reviewed the details'));
  assert.ok(progressed.includes('arena-scenario__trail'));
  assert.ok(progressed.includes('arena-scenario__consequence'));
  const ending=renderToStaticMarkup(<ArenaScenario s={base} ar={ar}
   host={false} display={false} actor usable={false} busy={false} closed={false}
   g={{scenario:{text:'Safe delivery',ending:true,discussion:'Talk about the checks',
    choices:[],path:[{consequence:'Checked data'}]}}} send={()=>{}}/>);
  assert.ok(ending.includes('arena-scenario--ending'));
  assert.ok(ending.includes('Talk about the checks'));
  assert.ok(!ending.includes('arena-scenario__choice-index'));
  const closed=renderToStaticMarkup(<ArenaScenario s={base} ar={ar}
   host={false} display={false} actor usable={false} busy={false} closed
   g={{scenario:current}} send={()=>{}}/>);
  assert.ok(closed.includes(ar?'الجولة اتقفلت':'The round has closed'));
  assert.ok(!closed.includes('Review first'));
 }
});
test('Scenario client cannot override authoritative scoring, branch navigation or hidden node access',()=>{
 const src=readFileSync('components/arena/ArenaScenario.tsx','utf8');
 assert.ok(src.includes("send('decision',{choice:i})"));
 assert.ok(!src.includes("api('answer'"));
 assert.ok(!src.includes("setNode("));
 assert.ok(!src.includes("c.next"));
 assert.ok(!src.includes("c.points"));
 const logic=readFileSync('lib/session-games.ts','utf8');
 assert.ok(logic.includes("b.action!=='decision'"));
 assert.ok(logic.includes("d.node=c.next"));
 const serializer=readFileSync('lib/session-games.ts','utf8');
 assert.ok(serializer.includes("choices:node.choices?.map((c:any)=>({label:c.label}))"));
});


test('V6 final Quiz spotlight and Poll charts are backend-authoritative',()=>{
 const quiz:any={...sample('Quiz','en'),prompt:'Choose safely',
   options:['Account','Unrelated','Invoice','Cargo'],correct:2,
   explanation:'PRIVATE CORRECT ANSWER EXPLANATION',timer:25};
 const base:any={activity:quiz,players:[{uid:'p1',name:'Student',approval:'approved'}],
   submitted:3,individual:[],current:0,paused:false,runtime:{phase:'answering'},
   status:'question',keyRevealed:false,mine:{id:'p1',name:'Student',eligible:true,answered:false}};
 for(const ar of [true,false])for(const role of ['play','host','display']){
  const props={ar,host:role==='host',display:role==='display',
   canAnswer:role==='play',busy:false,onSubmit:()=>{},onInteract:()=>{},onControl:()=>{}};
  const actor=role==='play'?base.mine:null;
  const playing=renderToStaticMarkup(<GamePlay s={{...base,mine:actor}} {...props}/>);
  assert.ok(playing.includes('arena-quiz-show'),'Quiz has distinct stage');
  assert.ok(playing.includes('arena-quiz-show__masthead'));
  assert.ok(!playing.includes('CORRECT ANSWER'));
  assert.ok(!playing.includes('PRIVATE CORRECT ANSWER EXPLANATION'));
  assert.ok(!playing.includes('right-answer'));
  const hidden=renderToStaticMarkup(<GamePlay s={{...base,mine:actor,status:'results',keyRevealed:false}}
   {...props} canAnswer={false}/>);
  assert.ok(hidden.includes('arena-quiz-show__locked'));
  assert.ok(!hidden.includes('CORRECT ANSWER'));
  assert.ok(!hidden.includes('PRIVATE CORRECT ANSWER EXPLANATION'));
  assert.ok(!hidden.includes('right-answer'));
  const open=renderToStaticMarkup(<GamePlay s={{...base,mine:actor,status:'results',
    keyRevealed:true,tally:[0,1,2,0]}} {...props} canAnswer={false}/>);
  assert.ok(open.includes('arena-quiz-show__reveal'));
  assert.ok(open.includes('arena-quiz-show__winning-answer'));
  assert.ok(open.includes('PRIVATE CORRECT ANSWER EXPLANATION'));
  assert.ok(open.includes('right-answer'));
 }
 const a:any={...sample('Live Poll','en'),pollKind:'choice',liveResults:false};
 const emptyChoice=renderToStaticMarkup(<LivePollChart s={{
   activity:a,status:'results',submitted:0,tally:[0,0,0,0],pollSummary:null}} ar={false}/>);
 assert.ok(emptyChoice.includes('No votes have arrived yet for the chart'));
 assert.ok(!emptyChoice.includes('live-poll-chart__rows'));
 const votes=renderToStaticMarkup(<LivePollChart s={{
   activity:a,status:'results',submitted:10,tally:[5,5,0,0],pollSummary:null}} ar={false}/>);
 assert.equal((votes.match(/live-poll-chart__row--leading/g)||[]).length,2,'Both tied top choices are highlighted');
 assert.ok(votes.includes('50%'));
 assert.ok(!votes.includes('correct-answer'));
 assert.ok(!votes.includes('answer-option'));
 const emptyRating=renderToStaticMarkup(<LivePollChart s={{
  activity:{...a,pollKind:'rating'},status:'results',submitted:0,
  pollSummary:{count:0,average:0}}} ar={true}/>);
 assert.ok(emptyRating.includes('لسه ما وصلش أي تصويت'));
 assert.ok(!emptyRating.includes('0.0 / 5'),'No fake rating average with zero responses');
 const emptyWords=renderToStaticMarkup(<LivePollChart s={{
  activity:{...a,pollKind:'word'},status:'results',submitted:0,
  pollSummary:{words:{}}}} ar={false}/>);
 assert.ok(emptyWords.includes('No votes have arrived yet for the chart'));
 const unrevealed=renderToStaticMarkup(<LivePollChart s={{
  activity:a,status:'results',submitted:10,tally:null,pollSummary:null}} ar={false}/>);
 assert.ok(unrevealed.includes('Chart awaiting reveal'));
 const source=readFileSync('components/arena/GamePlay.tsx','utf8');
 assert.ok(source.includes('QuestionComponent={Question}'));
 assert.ok(source.includes('hidePrompt=false'));
 const quizSource=readFileSync('components/arena/ArenaQuizExperience.tsx','utf8');
 assert.ok(quizSource.includes('const visibleQuestion=revealed?a:'));
 assert.ok(quizSource.includes('revealed&&Number.isInteger(a.correct)'));
 assert.ok(!quizSource.includes("api('answer'"));
 const css=readFileSync('app/globals.css','utf8');
 assert.ok(css.includes('V6 LIVE POLL + KNOWLEDGE QUIZ'));
 assert.ok(css.includes('.projector .arena-quiz-show'));
 assert.ok(css.includes('prefers-reduced-motion:reduce'));
});

test('trainer activity learning reports preserve real grades and anonymous voting without fake accuracy',()=>{
 const report:any={
  code:'123456',title:'Communication workshop',
  activities:[
   {type:'Quiz',prompt:'Knowledge check'},
   {type:'Live Poll',pollKind:'choice',prompt:'Preferences',options:['A','B']},
   {type:'Live Poll',pollKind:'rating',prompt:'Rating'},
   {type:'Live Poll',pollKind:'word',prompt:'Word cloud'},
   {type:'Live Poll',pollKind:'priority',prompt:'Priorities',options:['X','Y','Z']},
   {type:'Flashcards',prompt:'Recall'},
   {type:'Meta Plan',prompt:'Sort tasks',scored:false},
   {type:'Escape Room',prompt:'Escape task'},
   {type:'Live Poll',pollKind:'rating',prompt:'No ratings'},
   {type:'Live Poll',pollKind:'choice',prompt:'=EVIL() CSV challenge',options:['safe','other']}
  ],
  answers:[
   {round:0,player:'a',answer:'0',correct:1,points:1000},
   {round:0,player:'b',answer:'1',correct:0,points:0},
   {round:1,player:'a',answer:'0',correct:null,points:0},
   {round:5,player:'a',answer:'0',correct:null,points:0},
   {round:6,player:'b',answer:'[0,1]',correct:1,points:0}
  ],
  anonymous:[
   {round:1,answer:'0'},{round:1,answer:'1'},
   {round:2,answer:'5'},{round:2,answer:'3'},
   {round:3,answer:'"Team"'},{round:3,answer:'"TEAM"'},
   {round:4,answer:'[2,0,1]'},
   {round:-1,answer:'[5,"unrelated survey"]'}
  ],
  events:[{round:7,kind:'escape',points:1000,player:'a'}],
  players:[{id:'a',name:'A'},{id:'b',name:'B'}]
 };
 const rows=analyzeReportActivities(report);
 assert.equal(rows.length,10);
 assert.equal(rows[0].accuracy,50);
 assert.equal(rows[0].gradedCount,2);
 assert.equal(rows[0].correctCount,1);
 assert.equal(rows[1].kind,'poll');
 assert.equal(rows[1].responseCount,3);
 assert.equal(rows[1].anonymousCount,2);
 assert.equal(rows[1].accuracy,null);
 assert.deepEqual(rows[1].pollBars?.map(x=>x.count),[2,1]);
 assert.deepEqual(rows[1].pollBars?.map(x=>x.percent),[67,33]);
 assert.equal(rows[2].averageRating,4);
 assert.deepEqual(rows[3].pollBars,[{label:'team',count:2,percent:100}]);
 assert.deepEqual(rows[4].ranking?.map(x=>x.points),[3,2,1]);
 assert.equal(rows[5].kind,'review');
 assert.equal(rows[5].accuracy,null);
 assert.equal(rows[6].gradedCount,0,'Unscored Meta Plan must never report incorrect or correct answers');
 assert.equal(rows[7].events,1);
 assert.equal(rows[7].eventPoints,1000);
 assert.equal(rows[7].accuracy,null,'Escape game event is not a graded answer');
 assert.equal(rows[8].averageRating,null,'No votes must not fake a zero-star rating');
 assert.equal(rows[8].responseCount,0);
 const csv=reportInsightsCsv(rows);
 assert.ok(csv.startsWith('\ufeff'));
 assert.ok(csv.includes('"\'=EVIL() CSV challenge"'),'Neutralize spreadsheet formulas in authored prompts');
 assert.ok(csv.includes('"67%"')===false,'CSV percentages are in a single chart cell and must be quoted safely');
 for(const ar of [true,false]){
  const html=renderToStaticMarkup(<ReportActivityInsights report={report} ar={ar}/>);
  assert.ok(html.includes('Knowledge check'));
  assert.ok(html.includes('50%'));
  assert.ok(html.includes('Preferences'));
  assert.ok(html.includes('67%'));
  assert.ok(html.includes('4 / 5'));
  assert.ok(html.includes('No ratings'));
  assert.ok(html.includes('report-insights__poll-chart'));
  assert.ok(html.includes(ar?'رد مجهول منفصل':'anonymous submissions'));
  assert.ok(!html.includes('unrelated survey'), 'Never mix anonymous survey with activity report');
 }
 const source=readFileSync('components/arena/WorkspaceTools.tsx','utf8');
 assert.ok(source.includes('<ReportActivityInsights report={report} ar={ar}/>'));
 assert.ok(source.includes('reportInsightsCsv(analyzeReportActivities(report))'));
 assert.ok(!source.includes("rows.filter((x:any)=>x.correct===1).length/count*100"),
  'Remove misleading accuracy from non-graded activities');
});


test('phase-one reliability safeguards keep trainer edits and timed learner rounds safe',()=>{
 const builder=readFileSync('components/arena/Builder.tsx','utf8');
 assert.ok(builder.includes('while(dirty.current)'), 'Drafts edited during a pending save must be flushed');
 assert.ok(builder.includes("await save('session','personal',true)"), 'Session creation must wait for the complete draft');
 assert.ok(builder.includes('onClick={()=>leaveEditor(false)}'), 'X must use the same exit guard as Home');
 assert.ok(builder.includes('if(live&&dirty.current&&!window.confirm'), 'Unapplied live changes require confirmation');
 const session=readFileSync('components/arena/Session.tsx','utf8');
 assert.ok(session.includes('if(s.deadline){setSplash(null);return;}'),
  'Already-counting timed rounds cannot be hidden by a forced intro');
 assert.ok(session.includes("lastRefreshError.current=null;setError(current=>current===stale?'':current)"),
  'Connection recovery must clear stale polling errors without clearing host action failures');
 assert.ok(session.includes("kind={['NOT_FOUND','CODE'].includes(error)?'not-found':'unavailable'"),
  'Invalid session codes must be distinguished from outages');
 for(const ar of [true,false]){
  const html=renderToStaticMarkup(<SessionEntryFeedback ar={ar} kind="not-found" onChangeCode={()=>{}}/>);
  assert.ok(html.includes(ar?'الجلسة دي مش موجودة':'Session not found'));
  assert.ok(!html.includes(ar?'إعادة المحاولة':'Try again'),
   'Retrying a confirmed unknown code cannot fix the code');
  assert.ok(html.includes(ar?'أدخل كود مختلف':'Use a different session code'));
 }
 const sim=readFileSync('components/arena/ArenaSimulator.tsx','utf8');
 assert.ok(sim.includes('evaluate(question,payload.answer).evaluation===1'),
  'Escape dry-run must use authoritative pure answer validation');
 assert.ok(sim.includes("room.wrongPolicy==='restart-room'"));
 assert.ok(sim.includes("room.unlockAfter||room.puzzles.length"));
 assert.ok(sim.includes('assessment:{...(g.assessment||{}),[payload.index]:payload.known===true}'),
  'Flashcard practice should preserve stable personal Known/Review answers');
});


test('20 learner dry runs share authoritative scoring, without inventing timeout or game events',()=>{
 const quiz=sample('Quiz','en');
 for(const count of [1,2,10,20]){
  const full=runSimulatedRoom(quiz,count,'correct');
  assert.equal(full.registered,count);
  assert.equal(full.submissions,count);
  assert.equal(full.correct,count);
  assert.equal(full.graded,count);
  assert.equal(full.learners.length,count);
  assert.ok(full.learners.every(x=>x.points>0&&x.status==='graded'));
  const zero=runSimulatedRoom(quiz,count,'no_response');
  assert.equal(zero.submissions,0);
  assert.equal(zero.missed,count);
  assert.equal(zero.correct,0);
 }
 const wrong=runSimulatedRoom(quiz,20,'incorrect');
 assert.equal(wrong.graded,20);
 assert.equal(wrong.correct,0);
 assert.ok(wrong.learners.every(x=>x.points<=0));
 const mixed=runSimulatedRoom(quiz,20,'mixed');
 assert.ok(mixed.submissions<20&&mixed.submissions>0);
 assert.ok(mixed.correct>0&&mixed.correct<20);
 const late=runSimulatedRoom(quiz,20,'late_join');
 assert.equal(late.learners.filter(x=>x.status==='late').length,4);
 assert.equal(late.submissions,16);
 const offline=runSimulatedRoom(quiz,20,'offline');
 assert.equal(offline.learners.filter(x=>x.status==='disconnected').length,7);
 assert.equal(offline.submissions,13);
 assert.throws(()=>runSimulatedRoom(quiz,21,'correct'),/SIMULATOR_COUNT/);
 assert.throws(()=>runSimulatedRoom(quiz,0,'mixed'),/SIMULATOR_COUNT/);
 const poll=runSimulatedRoom(sample('Live Poll','en'),5,'correct');
 assert.equal(poll.graded,0);
 assert.equal(poll.ungraded,5);
 assert.equal(poll.learners.reduce((n,p)=>n+p.points,0),0);
 assert.ok(poll.learners.every(p=>p.rank===null), 'Polls have no invented learner ranks');
 const cards=runSimulatedRoom(sample('Flashcards','en'),5,'correct');
 assert.equal(cards.graded,0);
 assert.equal(cards.learners.reduce((n,p)=>n+p.points,0),0);
 assert.ok(cards.unsupported,'No fake game event scoring');
 assert.ok(cards.learners.every(p=>p.rank===null), 'Flashcards cannot fabricate a leaderboard');
 for(const pollKind of ['rating','word']){
  const a=sample('Live Poll','en');
  const result=runSimulatedRoom({...a,pollKind,options:[]},5,'correct');
  assert.equal(result.ungraded,5);
  assert.equal(result.submissions,5);
  assert.ok(result.learners.every(p=>p.points===0&&p.rank===null));
 }
 const show=runSimulatedRoom({...sample('Quiz','en'),mainType:'Ultimate Game Show'},5,'correct');
 assert.equal(show.submissions,0,'Betting and lifelines cannot be faked with generic question grades');
 assert.ok(show.unsupported);
 assert.ok(show.learners.every(p=>p.rank===null));
 const source=readFileSync('components/arena/ArenaSimulator.tsx','utf8');
 assert.ok(source.includes('setLearnerCount(Number(e.target.value))'));
 assert.ok(source.includes("value=\"late_join\""));
 assert.ok(source.includes("value=\"offline\""));
});

test('trainer live director uses server-confirmed counts and truthful presence labels',()=>{
 const state={status:'question',current:2,submitted:7,queue:[{},{},{},{}],deadline:15000,
  players:[{uid:'one',approval:'approved'},{uid:'two',approval:'approved'},
   {uid:'three',approval:'pending'},{uid:'four',approval:'rejected'}]};
 const stats=trainerDirectorStats(state);
 assert.deepEqual(stats,{registered:4,approved:2,pending:1,rejected:1,submissions:7,totalActivities:4,activityNumber:3});
 const html=renderToStaticMarkup(<TrainerDirectorDashboard ar={true} state={state}
  seconds={18} connected={true} transport="live" busy={false}
  onJoinQR={()=>{}} onProjector={()=>{}} onPrimary={()=>{}} onRefresh={()=>{}}/>);
 assert.ok(html.includes('لوحة قيادة المدرب'));
 assert.ok(html.includes('QR الجلسة'));
 assert.ok(html.includes('فتح البروجيكتور'));
 assert.ok(html.includes('ردود النشاط الحالي'));
 assert.ok(html.includes('مش معناه متصل حاليًا'));
 const appSource=readFileSync('components/arena/App.tsx','utf8');
 assert.ok(appSource.includes('trainer-mobile-nav-backdrop'));
 assert.ok(appSource.includes('aria-expanded={menu}'));
 const session=readFileSync('components/arena/Session.tsx','utf8');
 assert.ok(session.includes('<TrainerDirectorDashboard'));
 const css=readFileSync('app/globals.css','utf8');
 assert.ok(css.includes('V6 trainer mobile hardening'));
 assert.ok(css.includes('.workspace-brand-header .account-exit{display:inline-flex!important}'));
 assert.ok(css.includes('.builder .deck-controls button{min-width:44px'));
 assert.ok(css.includes('.session-shell.host .director-bar{display:grid'));
 assert.ok(css.includes('trainer-director-dashboard__metrics'));
});


test('quiz question studio exposes non-nested authoring, choice keys and safe mobile actions',()=>{
 for(const ar of [true,false]){
  const html=renderToStaticMarkup(<QuestionStudio ar={ar} activity={sample('Quiz',ar?'ar':'en')}
   onCancel={()=>{}} onSave={()=>{}}/>);
  assert.ok(html.includes(ar?'أسئلة واضحة، خطوة بخطوة':'Build your knowledge quiz'));
  assert.ok(html.includes(ar?'سؤال جديد':'New'));
  assert.ok(html.includes('type="radio"'));
  assert.ok(html.includes(ar?'أضف اختيار':'Add option')===false, 'Sample starts with four options');
  assert.ok(html.includes(ar?'زمن الإجابة بالثواني':'Time limit (seconds)'));
  assert.ok(html.includes(ar?'انسخ السؤال':'Duplicate'));
  const show=renderToStaticMarkup(<QuestionStudio ar={ar} activity={sample('Ultimate Game Show',ar?'ar':'en')}
   onCancel={()=>{}} onSave={()=>{}}/>);
  assert.ok(show.includes(ar?'طريق البطولة':'Championship'));
  assert.ok(show.includes(ar?'جولات حرة':'Open rounds'));
 }
 const css=readFileSync('app/globals.css','utf8');
 assert.ok(css.includes('V6 dedicated question studio'));
 assert.ok(css.includes('.question-studio__list'));
 assert.ok(css.includes('.question-studio__radio'));
 const src=readFileSync('components/arena/Builder.tsx','utf8');
 assert.ok(src.includes("onSimulate&&['Quiz','Ultimate Game Show'].includes(d.type)"),
   'Single question bank should retain its original plain question editor');
});

test('prize ladder has truthful server-owned casting, elimination and single-use lifelines',()=>{
 const stage=(group:number,level:number)=>({type:'Quiz',mainType:'Ultimate Game Show',showFormat:'ladder',group,showRound:level,
   prompt:'Question',timer:30,options:['A','B'],correct:0});
 const deck=[stage(0,1),stage(0,2),stage(0,3),stage(1,1)];
 const cast=[{detail:JSON.stringify({round:0,players:['a']})},
  {detail:JSON.stringify({round:1,players:['b']})},
  {detail:JSON.stringify({round:3,players:['other']})}];
 const answers=[{round:0,player:'a',correct:0},{round:1,player:'b',correct:1}];
 assert.deepEqual(contestantKnockouts(deck,2,cast,answers),['a']);
 assert.deepEqual(contestantKnockouts(deck,3,cast,answers),[]);
 assert.equal(shouldContinueContestant(deck[1],deck[2],[{player:'b',correct:1}],'b'),true);
 assert.equal(shouldContinueContestant(deck[1],deck[2],[{player:'b',correct:0}],'b'),false);
 assert.equal(shouldContinueContestant(deck[2],deck[3],[{player:'b',correct:1}],'b'),false);
 const previous=[
  {round:0,data:JSON.stringify({lifelines:['fifty','audience']})},
  {round:1,data:JSON.stringify({lifelines:['time']})},
  {round:3,data:JSON.stringify({lifelines:['fifty']})}];
 assert.deepEqual(previouslyUsedLifelines(deck,2,previous),['fifty','audience','time']);
 assert.deepEqual(previouslyUsedLifelines(deck,3,previous),[]);
 const service=readFileSync('lib/service.ts','utf8');
 assert.ok(service.includes("fail('SHOW_ELIMINATED',409)"));
 assert.ok(service.includes('shouldContinueContestant(active(),deck[s.current+1]'));
 const backend=readFileSync('lib/session-games.ts','utf8');
 assert.ok(backend.includes('previouslyUsedLifelines(JSON.parse(s.activities),s.current,history)'));
 assert.ok(backend.includes('contestantKnockouts(JSON.parse(s.activities),s.current,casts,previousAnswers)'));
 const showSrc=readFileSync('components/arena/ArenaGameShow.tsx','utf8');
 assert.ok(showSrc.includes("showFormat==='ladder'"));
 assert.ok(showSrc.includes('disabled={busy||eliminated}'));
});


test('championship rehearsal uses pure Worker transitions in all three views without score writes',()=>{
 const stage:any={...sample('Ultimate Game Show'),showFormat:'championship',participation:'individual',betEnabled:false,
  safeLevels:[1],questions:[100,250].map((points,i)=>({...sample('Quiz'),type:'Quiz',
   prompt:'Prize '+i,options:['A','B','C','D'],correct:0,timer:30,points,speed:false}))};
 for(const mode of ['play','host','display'] as const){
  const html=renderToStaticMarkup(<ArenaChampionshipPractice a={stage} ar={false} mode={mode}/>);
  assert.ok(html.includes('CHAMPIONSHIP ARENA'));
  assert.ok(html.includes('Offline rehearsal'));
  assert.ok(html.includes('Prize ladder'));
 }
 const s=showStart();
 const cast=showCommand(stage,s,'cast',{player:'test-player',attemptId:'practice-a'},1000,null);
 const pub:any=showPublic(stage,cast.show,'test-player');
 assert.equal(pub.question.correct,undefined,'Never expose correct answer in learner snapshot');
 assert.equal(pub.canAnswer,true);
 const spectator:any=showPublic(stage,cast.show,'spectator');
 assert.equal(spectator.canAnswer,false);
 assert.equal(spectator.question.correct,undefined);
 assert.deepEqual(spectator.lifelines,[]);
 assert.ok(pub.question.options.length===4);
 const answer=showCommand(stage,cast.show,'answer',{player:'test-player',answer:0},1001,cast.deadline);
 assert.equal(answer.show.current.level,1);
 assert.equal(answer.show.attempts.length,0,'Do not award before attempt finishes');
 const winner:any=showCommand(stage,answer.show,'answer',{player:'test-player',answer:0},1002,answer.deadline);
 assert.equal(winner.show.phase,'completed');
 assert.equal(winner.payout.points,250);
 assert.equal(winner.show.attempts.length,1);
 const src=readFileSync('components/arena/ArenaSimulator.tsx','utf8');
 assert.ok(src.includes("a.showFormat==='championship'"));
});


test('cinematic scene is replayable only BEFORE next question and cannot consume a timed round',()=>{
 for(const [status,current,total,expected] of [
  ['lobby',-1,4,true],['results',1,4,true],['question',1,4,false],
  ['completed',3,4,false],['lobby',-1,0,false],['results',3,4,false]
 ] as const){assert.equal(canPreviewNext(status,current,total),expected);}
 const n1=introHighlight(2,1001),n2=introHighlight(2,1002);
 assert.ok(n1<0&&n1!==n2);
 assert.deepEqual(sceneFromHighlight(n1,'results',1,4),{index:2,key:'scene:2:'+n1+':results'});
 assert.deepEqual(sceneFromHighlight(n2,'results',1,4),{index:2,key:'scene:2:'+n2+':results'});
 assert.equal(sceneFromHighlight(n1,'question',1,4),null);
 assert.equal(sceneFromHighlight(n1,'results',2,4),null);
 assert.equal(sceneFromHighlight(2,'lobby',1,4),null);
 assert.equal(sceneFromHighlight(NaN,'results',1,4),null);
 assert.equal(sceneFromHighlight(introHighlight(499,20),'results',1,4),null);
 const session=readFileSync('components/arena/Session.tsx','utf8');
 assert.ok(session.includes("onClick={()=>command('highlight',undefined,{index:introHighlight(s.current+1,Date.now())})"));
 assert.ok(session.includes("s.deadline){setSplash(null)"), 'no blocking intro over a timed round');
 assert.ok(session.includes("s?.status==='question'&&s?.activity"), "Only untimed stages can use optional short in-round intro");
 assert.ok(session.includes("preview type={mainType(s.queue[previewIntro.index])}"));
 const background=readFileSync('app/globals.css','utf8');
 assert.ok(background.includes('V6 Cinematic Experience — pre-round theatre'));
 assert.ok(background.includes('max-width:700px'));
 assert.ok(background.includes('prefers-reduced-motion:reduce'));
});

test('all V6 game identities have stage-specific intro, unique color, skip and visual-safe settings',()=>{
 const names=['Quiz','Ultimate Game Show','Wheel of Fortune','Escape Room','Open the Box',
  'Live Poll','Order It','Flashcards','Meta Plan','Scenario Challenge'];
 const schemes=new Set(names.map(stageAtmosphere));
 assert.ok(schemes.size>=8);
 for(const type of names){
  for(const ar of [true,false]){
   const h=renderToStaticMarkup(<StageSplash type={type} label={type} ar={ar}
    preview durationMs={4800} onComplete={()=>{}}/>);
   assert.ok(h.includes('cinematic-'+stageAtmosphere(type)));
   assert.ok(h.includes(type));
   assert.ok(h.includes('cinematic-art-frame'));
   assert.ok(h.includes(ar?'تخطي المقدمة':'Skip intro'));
   assert.ok(h.includes(ar?'العداد لم يبدأ':'TIMER NOT STARTED'));
  }
 }
 const original=renderToStaticMarkup(<StageSplash type="Quiz" label="Quiz" ar={false} durationMs={850} onComplete={()=>{}}/>);
 assert.ok(original.includes('850ms'));
});

test('optional WebAudio engine stays silent without user activation and exposes accessible controls',()=>{
 assert.equal(defaultArenaAudio.enabled,false);
 const engine=new ArenaSoundEngine();
 engine.update({...defaultArenaAudio,enabled:true});
 for(const cue of ['intro','stage','lock','reveal','correct','incorrect','tick','countdown',
  'overtime','lead','victory','wheel','mystery','level'] as const)assert.doesNotThrow(()=>engine.play(cue));
 assert.doesNotThrow(()=>engine.close());
 const session=readFileSync('components/arena/Session.tsx','utf8');
 assert.ok(session.includes('await audio.current.unlock()'));
 assert.ok(session.includes("arena-sound-panel__inner"));
 assert.ok(session.includes('audioSetting({volume:Number(e.target.value)/100})'));
 assert.ok(session.includes('audioSetting({music:e.target.checked})'));
 assert.ok(session.includes('audioSetting({effects:e.target.checked})'));
 assert.ok(session.includes('lastBeep.current===key'));
 assert.ok(session.includes("audio.current?.play(seconds===1?'countdown':'tick'"));
 assert.ok(!session.includes('new AudioContext()'), 'single sound engine owns all Web Audio allocation');
 const css=readFileSync('app/globals.css','utf8');
 assert.ok(css.includes('.arena-sound-panel__inner'));
});

test('champion, lead, and result banners use confirmed server transitions and are motion safe',()=>{
 const a:any={code:'111111',status:'question',individual:[{uid:'a',rank:1,score:100}],current:0};
 const b:any={...a,status:'results'};
 assert.equal(eligibleMoment(a,b,'host'),'reveal');
 assert.equal(eligibleMoment(a,b,'play'),null);
 assert.equal(eligibleMoment(b,{...b,status:'completed'},'display'),'champion');
 assert.equal(eligibleMoment(b,{...b,individual:[{uid:'b',rank:1,score:150}]},'host'),'lead');
 assert.equal(eligibleMoment(b,{...b,code:'222222'},'host'),null);
 for(const kind of ['champion','lead','reveal'] as const){
  const h=renderToStaticMarkup(<ArenaMoment kind={kind} ar={true} light/>);
  assert.ok(h.includes('role="status"'));
  assert.ok(h.includes('aria-live="polite"'));
  assert.ok(h.includes('arena-moment-'+kind));
 }
 const css=readFileSync('app/globals.css','utf8');
 assert.ok(css.includes('V6 Cinematic Experience — milestone ribbons'));
 assert.ok(css.includes('.session-shell.effects-off .arena-moment'));
});


test('ten game openings have unique visual motifs, independent notes, rhythms and noise identities',()=>{
 const all=['Quiz','Ultimate Game Show','Wheel of Fortune','Escape Room','Open the Box',
  'Live Poll','Meta Plan','Order It','Flashcards','Scenario Challenge'];
 const keys=new Set(),songs=new Set(),texts=new Set(),visuals=new Set();
 for(const type of all){
  const identity=introIdentity(type);
  keys.add(identity.key);
  const signature=identity.notes.map(n=>[n.pitch,n.at,n.hold,n.wave].join(':')).join('|')+identity.noise;
  songs.add(signature);
  texts.add(identity.introEn);
  const h=renderToStaticMarkup(<StageSplash type={type} label={type} ar={false}
   durationMs={3600} preview onComplete={()=>{}}/>);
  assert.ok(h.includes('intro-kind-'+identity.key),type);
  assert.ok(h.includes('intro-scene--'+identity.key),type);
  assert.ok(h.includes(identity.introEn),type);
  assert.ok(h.includes(identity.tagEn),type);
  assert.ok(h.includes('splash-activity-cover'),type);
  visuals.add('intro-scene--'+identity.key);
 }
 assert.equal(keys.size,10);
 assert.equal(songs.size,10,'No two game titles share the same soundtrack');
 assert.equal(texts.size,10);
 assert.equal(visuals.size,10);
 assert.equal(Object.keys(introIdentities).length,10);
 assert.equal(introIdentity('Spin Wheel').key,'wheel');
 assert.equal(introIdentity('Categorize').key,'plan');
 const session=readFileSync('components/arena/Session.tsx','utf8');
 assert.ok(session.includes('playGameIntro(mainType(s.queue[scene.index])'));
 const simulator=readFileSync('components/arena/ArenaSimulator.tsx','utf8');
 assert.ok(simulator.includes('playGameIntro(mainType(a))'));
 const audio=readFileSync('lib/arena-sound.ts','utf8');
 assert.ok(audio.includes("playGameIntro(type:string"));
 assert.ok(audio.includes("if(!p.enabled||p.muted||!p.music||options.quiet"));
 const css=readFileSync('app/globals.css','utf8');
 for(const word of ['intro-quiz-choice','intro-champ-stairs','intro-wheel-disc',
  'intro-escape-door','intro-mystery-box','intro-poll-bars','intro-plan-node',
  'intro-order-steps','intro-card-stack','intro-scenario-fork'])
  assert.ok(css.includes(word),'Missing unique intro choreography for '+word);
});

test('simulation stage is the main viewport; advanced settings collapse without losing scenarios',()=>{
 const sim=readFileSync('components/arena/ArenaSimulator.tsx','utf8');
 assert.ok(sim.includes('arena-simulator-shell--stage-first'));
 assert.ok(sim.includes('<details className="arena-simulator-dry-run"'));
 assert.ok(sim.includes('<summary className="arena-simulator-dry-run__toggle">'));
 assert.ok(!sim.includes('<details className="arena-simulator-dry-run" open'));
 assert.ok(sim.includes('setLearnerCount(Number(e.target.value))'));
 assert.ok(sim.includes("value=\"late_join\""));
 assert.ok(sim.includes("value=\"offline\""));
 const css=readFileSync('components/arena/ArenaSimulator.css','utf8');
 for(const marker of [
  '.arena-simulator-shell--stage-first .arena-simulator-main',
  '.arena-simulator-shell--stage-first .arena-simulator-dry-run__toggle',
  '.arena-simulator-shell--stage-first .arena-simulator-dry-run__expanded',
  '.arena-simulator-shell--stage-first .arena-simulator-modes',
  'height:100dvh',
  'max-height:26dvh',
  'min-height:0'
 ]) assert.ok(css.includes(marker),marker);
 const html=renderToStaticMarkup(<ArenaSimulator ar={false} activities={[sample('Quiz','en')]}
   onClose={()=>{}}/>);
 assert.ok(html.includes('arena-simulator-shell--stage-first'));
 assert.ok(html.includes('Practice setup &amp; scenarios')||html.includes('Practice setup & scenarios'));
 assert.ok(html.includes('arena-simulator-main'));
});

test('projector content fits in one viewport independent of scrolling and never mutates session state',()=>{
 assert.equal(projectorFitScale(550,800,768,1366,70),1);
 assert.equal(projectorFitScale(1400,1366,768,1366,64),696/1400);
 assert.equal(projectorFitScale(500,1920,1080,1280,64),1280/1920);
 assert.ok(projectorFitScale(3500,1800,600,1280,55)>0);
 assert.equal(projectorFitScale(100,200,0,1280,60),1);
 const hook=readFileSync('components/arena/useProjectorFit.ts','utf8');
 assert.ok(!hook.includes('MutationObserver'),'Do not resize projector based on dynamic oversized game content');
 assert.ok(hook.includes('window.addEventListener(\'resize\''));
 assert.ok(hook.includes("shell.dataset.projectorFit='native'"),'Native readable layout replaces unbounded scaling');
 assert.ok(!hook.includes('el.style.zoom=String(scale)'),'No dangerously small CSS zoom');
 assert.ok(hook.includes("ref.current.style.zoom=''"),'Old zoom is cleared');
 const session=readFileSync('components/arena/Session.tsx','utf8');
 assert.ok(session.includes('const projectorFitRef=useProjectorFit(display'));
 assert.ok(session.includes('<main ref={projectorFitRef} className="live-workspace">'));
 const css=readFileSync('app/globals.css','utf8');
 assert.ok(css.includes('V6 PROJECTOR STAGE: single viewport'));
 assert.ok(css.includes('.session-shell.projector{position:fixed!important;inset:0!important'));
 assert.ok(css.includes('height:100dvh!important'));
 assert.ok(css.includes('overflow:hidden!important'));
 assert.ok(css.includes('.session-shell.projector .main-stage{min-height:0!important'));
 assert.ok(css.includes('.session-shell.projector .display-bottom{display:flex!important'));
 assert.ok(css.includes('.session-shell.projector .arena-victory{min-height:0!important'));
});


test('intro composition keeps game artwork and animated identity in distinct bounded panels, never behind text',()=>{
 const games=['Quiz','Ultimate Game Show','Wheel of Fortune','Escape Room','Open the Box',
  'Live Poll','Meta Plan','Order It','Flashcards','Scenario Challenge'];
 for(const game of games){
  const h=renderToStaticMarkup(<StageSplash type={game} label={game} ar={true}
   preview durationMs={4900} onComplete={()=>{}}/>);
  const cover=h.indexOf('cinematic-art-frame splash-activity-cover');
  const decoration=h.indexOf('cinematic-scene-badge');
  const copy=h.indexOf('cinematic-copy');
  assert.ok(h.includes('cinematic-composed'),game);
  assert.ok(h.includes('cinematic-content-grid'),game);
  assert.ok(cover>0&&decoration>cover&&copy>decoration,'visual identity must be separate from the artwork and copy in '+game);
  assert.ok(h.includes('intro-scene--'+introIdentity(game).key),game);
  assert.ok(h.includes('cinematic-skip'),game);
  assert.ok(h.includes('العداد لم يبدأ'),game);
 }
 const css=readFileSync('app/globals.css','utf8');
 assert.ok(css.includes('V6 Intro COMPOSITION FIX'));
 assert.ok(css.includes('grid-template-columns:minmax(0,1.17fr) minmax(0,.83fr)'));
 assert.ok(css.includes('.cinematic-scene-badge .intro-scene'));
 assert.ok(css.includes('overflow:hidden!important;isolation:isolate!important'));
 assert.ok(css.includes('height:100dvh!important;max-height:100dvh!important'));
 assert.ok(css.includes('html:has(.stage-splash),body:has(.stage-splash){overflow:hidden!important}'));
});

test('simulator no longer reserves vertical rows for navigation and scenario forms',()=>{
 const markup=renderToStaticMarkup(<ArenaSimulator ar={true} activities={[sample('Quiz','ar')]}
  onClose={()=>{}}/>);
 const menu=markup.indexOf('arena-simulator-tools__panel');
 const activityNav=markup.indexOf('arena-simulator-progress',menu);
 const scenario=markup.indexOf('arena-simulator-dry-run',menu);
 const game=markup.indexOf('arena-simulator-main',menu);
 assert.ok(menu>0&&activityNav>menu&&scenario>activityNav&&game>scenario);
 const top=markup.slice(0,game);
 assert.ok(top.includes('<details class="arena-simulator-tools"'));
 assert.ok(!top.includes('<details class="arena-simulator-tools" open'));
 assert.ok(markup.includes('arena-simulator-modes'));
 assert.ok(markup.includes('arena-simulator-tools__trigger'));
 const css=readFileSync('components/arena/ArenaSimulator.css','utf8');
 assert.ok(css.includes('SIMULATOR VIEWPORT FIX v3'));
 assert.ok(css.includes('position:absolute!important;z-index:80!important'));
 assert.ok(css.includes('.arena-simulator-shell--stage-first>.arena-simulator-main'));
 assert.ok(css.includes('flex:1 1 auto!important'));
 assert.ok(css.includes('height:calc(100dvh - 12px)!important'));
});


test('Quiz Studio supports seven different question types with real fields and media upload',()=>{
 const title='What does an ACID mean?';
 for(const type of knowledgeQuestionTypes){
  const q:any=newKnowledgeQuestion(type,false);
  q.prompt=title;
  assert.equal(q.type,type);
  assert.equal(questionTypeLabel(type,true).length>0,true);
  const activity:any={...sample('Quiz','en'),questions:[q]};
  const html=renderToStaticMarkup(<QuestionStudio ar={false} activity={activity}
   onCancel={()=>{}} onSave={()=>{}}/>);
  assert.ok(html.includes('Current question type'),type);
  assert.ok(html.includes('New question type'),type);
  assert.ok(html.includes('Media type'),type);
  assert.ok(html.includes('Upload image or video from device'),type);
  assert.ok(html.includes('Image, video or YouTube link'),type);
  assert.ok(html.includes('type="file"'),type);
  switch(type){
   case 'Quiz':case 'True/False':case 'Dropdown':
    assert.ok(html.includes('type="radio"'),type);break;
   case 'Fill Blank':assert.ok(html.includes('Accepted text answers'),type);break;
   case 'Match It':assert.ok(html.includes('Matching pairs'),type);break;
   case 'Order It':assert.ok(html.includes('Correct order for grading'),type);break;
   case 'Image Hotspot':assert.ok(html.includes('Target image HTTPS URL'),type);break;
  }
 }
 const original=newKnowledgeQuestion('Quiz',true);
 original.prompt='Preserve this prompt';original.media={type:'image',url:'https://example.org/training.png',alt:'Diagram'};
 const swapped=changeKnowledgeQuestionType(original,'Match It',true);
 assert.equal(swapped.prompt,original.prompt);
 assert.deepEqual(swapped.media,original.media);
 assert.equal(swapped.type,'Match It');
 assert.ok(!swapped.options,'Old Quiz answer choices must not silently contaminate Match It');
 assert.ok(original.options,'Original Quiz question must remain unchanged');
 const builder=readFileSync('components/arena/Builder.tsx','utf8');
 assert.ok(builder.includes('d.questions.every((q:Activity)=>isKnowledgeQuestionType(q.type)'));
 assert.ok(builder.includes('<QuestionStudio ar={ar} activity={d}'));
});

test('seven Quiz question formats survive validation, while championship rules stay strict',()=>{
 const media={type:'image',url:'https://example.org/freight.png',alt:'Cargo diagram'};
 const cases:any[]=[
  {...newKnowledgeQuestion('Quiz',false),prompt:'Pick the correct answer',options:['A','B','C','D'],correct:0},
  {...newKnowledgeQuestion('True/False',false),prompt:'True or false',correct:1},
  {...newKnowledgeQuestion('Dropdown',false),prompt:'Select item',options:['A','B'],correct:1},
  {...newKnowledgeQuestion('Fill Blank',false),prompt:'Fill the missing term',accepted:['ACID','Acid']},
  {...newKnowledgeQuestion('Match It',false),prompt:'Match terms to definitions',left:['ACID','BL'],right:['Bills','Shipment'],pairs:[1,0]},
  {...newKnowledgeQuestion('Order It',false),prompt:'Sort shipment steps',items:['Submit','Ship','Release'],order:[1,0,2]},
  {...newKnowledgeQuestion('Image Hotspot',false),prompt:'Select the correct area',image:'https://example.org/map.png',regions:[{x:.4,y:.6,r:.12}]}
 ];
 cases[0].media=media;
 const normalized=cases.map(q=>normalizeKnowledgeQuestion(q));
 assert.deepEqual(normalized.map(q=>q.type),[...knowledgeQuestionTypes]);
 assert.deepEqual(normalized[0].media,media);
 assert.equal(normalized[3].accepted[1],'Acid');
 assert.deepEqual(normalized[4].pairs,[1,0]);
 assert.deepEqual(normalized[5].order,[1,0,2]);
 const root:any={...sample('Quiz','en'),questions:normalized};
 assert.doesNotThrow(()=>validateActivity(structuredClone(root)));
 assert.throws(()=>normalizeKnowledgeQuestion(cases[1],true));
 assert.throws(()=>normalizeKnowledgeQuestion({...cases[0],options:['A','','C','D']}));
 assert.throws(()=>normalizeKnowledgeQuestion({...cases[3],accepted:['']}));
 const sampleChamp:any={...cases[0],options:['A','B','C','D'],timer:30};
 assert.doesNotThrow(()=>normalizeKnowledgeQuestion(sampleChamp,true));
 const mediaComponent=readFileSync('components/arena/QuestionMediaPicker.tsx','utf8');
 assert.ok(mediaComponent.includes('await uploadArenaMedia(file)'));
 assert.ok(mediaComponent.includes('onChange({...uploaded'));
 assert.ok(mediaComponent.includes('type="url"'));
 assert.ok(mediaComponent.includes('accept="image/png,image/jpeg,image/webp,video/mp4,video/webm"'));
 assert.ok(mediaComponent.includes('<StageMedia media={value}/>'));
});

test('each of ten game intros has a unique three-act cinematic sequence and distinct reveal',()=>{
 const keys=['Quiz','Ultimate Game Show','Wheel of Fortune','Escape Room','Open the Box','Live Poll',
 'Meta Plan','Order It','Flashcards','Scenario Challenge'];
 const sequenceSet=new Set<string>();
 for(const type of keys){
  const id=introIdentity(type);
  const beats=gameIntroBeats[id.key];
  assert.equal(beats.ar.length,3);
  assert.equal(beats.en.length,3);
  sequenceSet.add(beats.en.join('|'));
  const intro=renderToStaticMarkup(<StageSplash type={type} label={type} ar={true}
   preview durationMs={4800} onComplete={()=>{}}/>);
  assert.ok(intro.includes('cinematic-beat-sequence'),type);
  assert.ok(intro.includes('cinematic-beat-2'),type);
  assert.ok(intro.includes(beats.ar[0]),type);
  assert.ok(intro.includes(beats.ar[1]),type);
  assert.ok(intro.includes(beats.ar[2]),type);
  assert.ok(intro.includes('cinematic-visual-zone'),type);
 }
 assert.equal(sequenceSet.size,10);
 const css=readFileSync('app/globals.css','utf8');
 for(const kind of ['quiz','championship','wheel','escape','box','poll','plan','order','cards','scenario']){
  assert.ok(css.includes('intro-kind-'+kind+' .cinematic-art-frame'),'Unique entrance missing: '+kind);
 }
 assert.ok(css.includes('NEXT-LEVEL GAME IDENTITIES'));
 assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'));
});


test('matching question edit keeps one-to-one answer permutation through changes and deletion',()=>{
 const p=[2,0,3,1];
 assert.deepEqual(setMatchingPair(p,0,1),[1,0,3,2]);
 assert.deepEqual(setMatchingPair(p,1,3),[2,3,0,1]);
 assert.deepEqual(p,[2,0,3,1],'source pair choices must remain immutable');
 assert.deepEqual(deleteMatchingPair([0,1,2],1),[0,1]);
 assert.deepEqual(deleteMatchingPair([2,0,1],1),[1,0]);
 assert.deepEqual(deleteMatchingPair([1,2,0],0),[1,0]);
 assert.deepEqual(deleteMatchingPair([0,1],0),[0,1],'do not remove below two');
 for(const pair of [[0,1,2,3],[3,2,1,0],[2,0,3,1],[1,3,0,2]]){
  for(let i=0;i<4;i++){
   const result=deleteMatchingPair(pair,i);
   assert.deepEqual([...result].sort((a,b)=>a-b),[0,1,2]);
   for(let j=0;j<4;j++){
    const swapped=setMatchingPair(pair,i,j);
    assert.equal(swapped[i],j);
    assert.deepEqual([...swapped].sort((a,b)=>a-b),[0,1,2,3]);
   }
  }
 }
 const src=readFileSync('components/arena/QuestionTypeFields.tsx','utf8');
 assert.ok(src.includes('setMatchingPair(q.pairs||q.left.map'));
 assert.ok(src.includes('deleteMatchingPair(q.pairs||q.left.map'));
});


test('question media URLs support safe YouTube embeds and native direct video clips',()=>{
 const id='QwErTy123_9';
 const expected='https://www.youtube-nocookie.com/embed/'+id+'?rel=0';
 for(const url of [
  'https://www.youtube.com/watch?v='+id,
  'https://youtu.be/'+id,
  'https://www.youtube.com/shorts/'+id,
  'https://m.youtube.com/embed/'+id
 ])assert.equal(safeYouTubeEmbed(url),expected,url);
 for(const rejected of ['http://youtu.be/'+id,'javascript:alert(1)',
  'https://notyoutube.com/watch?v='+id,'https://youtu.be/wrong',
  'https://www.youtube.com/watch?v='+id+'extra']){
  assert.equal(safeYouTubeEmbed(rejected),null);
 }
 const h=renderToStaticMarkup(<StageMedia media={{type:'video',url:'https://youtu.be/'+id,alt:'Public training video'}}/>);
 assert.ok(h.includes('<iframe'));
 assert.ok(h.includes('youtube-nocookie.com/embed/'+id));
 assert.ok(h.includes('title="Public training video"'));
 const direct=renderToStaticMarkup(<StageMedia media={{type:'video',url:'https://example.org/video.mp4'}}/>);
 assert.ok(direct.includes('<video'));
 assert.ok(!direct.includes('<iframe'));
});

test('question media link picker identifies safe YouTube and mp4 but rejects imprecise classification',()=>{
 assert.equal(classifyMediaLink('https://youtu.be/dQw4w9WgXcQ'),'video');
 assert.equal(classifyMediaLink('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),'video');
 assert.equal(classifyMediaLink('https://cdn.example.com/lesson.mp4?x=1'),'video');
 assert.equal(classifyMediaLink('https://cdn.example.com/chart.webp'),'image');
 assert.equal(classifyMediaLink('https://cdn.example.com/unknown'),null);
 assert.equal(classifyMediaLink('javascript:alert(1)'),null);
 const picker=readFileSync('components/arena/QuestionMediaPicker.tsx','utf8');
 assert.ok(picker.includes('classifyMediaLink(e.target.value)||mediaType'));
 const html=renderToStaticMarkup(<StageMedia media={{type:'video',url:'https://youtu.be/dQw4w9WgXcQ'}}/>);
 assert.ok(html.includes('youtube-nocookie.com/embed/dQw4w9WgXcQ'));
 assert.ok(!html.includes('<script'));
});


test('championship confirmation is in-game, and the native GitHub-site dialog never appears',()=>{
 const src=readFileSync('components/arena/ArenaChampionship.tsx','utf8');
 assert.ok(!src.includes('window.confirm'), 'No browser-origin alert about github.io on final answer');
 assert.ok(src.includes('championship-answer-confirm'));
 assert.ok(src.includes('setConfirmAnswer(true)'));
 assert.ok(src.includes("onInteract('showanswer',{answer:selected})"));
 const css=readFileSync('app/globals.css','utf8');
 assert.ok(css.includes('.championship-answer-confirm'));
});

test('practical Wheel award cannot be automatic and only host-authorized score event is recorded',()=>{
 const a:any=sample('Wheel of Fortune','en');
 a.sectors=[{kind:'challenge',label:'Complete loading task',points:500,detail:'Work through the mock manifest',repeatable:true},...a.sectors];
 assert.doesNotThrow(()=>validateActivity(structuredClone(a)));
 const now=Date.now(),session:any={
  activity:a,code:'497722',status:'question',current:0,serverNow:now,clockNow:now,
  players:[{uid:'p1',name:'Candidate'}],mine:null,paused:false,
  game:{turn:1,rounds:5,used:[],target:'p1',spinTarget:'p1',
   spin:{id:'demo-spin',index:0,startsAt:now-10000,stopsAt:now-200,revealed:true},
   outcome:{kind:'challenge',label:'Complete loading task',detail:'Practical activity',points:500}}
 };
 const host=renderToStaticMarkup(<GamePlay s={session} ar host display={false}
  canAnswer={false} busy={false} onSubmit={()=>{}} onInteract={()=>{}} onControl={()=>{}}/>);
 assert.ok(host.includes('wheel-tap-surface'),'Entire wheel is the tap target');
 assert.ok(host.includes('wheel-judge'),'Only host sees scoring controls');
 assert.ok(host.includes('Candidate'),'Current player comes from server');
 assert.ok(host.includes('wheel-judge__direction'),'Trainer can award or deduct points');
 const guest=renderToStaticMarkup(<GamePlay s={session} ar host={false} display
  canAnswer={false} busy={false} onSubmit={()=>{}} onInteract={()=>{}} onControl={()=>{}}/>);
 assert.ok(!guest.includes('wheel-judge__direction'),'Projector never has scoring controls');
 const game=readFileSync('lib/session-games.ts','utf8');
 assert.ok(game.includes("['wheelaward','boxaward'].includes(b.action)"),'Both practical games share the strict host-scoring endpoint');
 assert.ok(game.includes("'wheel-judge'"));
 assert.ok(game.includes("['question','challenge','penalty'].includes(sector?.kind)?0"));
 assert.ok(game.includes('revealAt:now+450+duration'),'Reveal begins at wheel landing rather than waiting after spin');
 const service=readFileSync('lib/service.ts','utf8');
 assert.ok(service.includes("'wheelaward'"));
});

test('Meta Plan supports direct mobile drag and tap category assignment without revealing answer key',()=>{
 const src=readFileSync('components/arena/MetaPlanDragBoard.tsx','utf8');
 assert.ok(src.includes('onPointerDown={e=>begin(e,i)}'));
 assert.ok(src.includes('onPointerMove={track} onPointerUp={finish}'));
 assert.ok(src.includes('setPointerCapture(e.pointerId)'));
 assert.ok(src.includes('document.elementFromPoint(e.clientX,e.clientY)'));
 assert.ok(src.includes('data-meta-category={j}'));
 assert.ok(src.includes('e.dataTransfer.setData('));
 const board=readFileSync('components/arena/ArenaMetaPlan.tsx','utf8');
 assert.ok(board.includes('<MetaPlanDragBoard ar={ar}'));
 assert.ok(board.includes('closed&&s.keyRevealed&&Array.isArray(a.assignments)'),
   'The correct sorting stays server-controlled and hidden before reveal');
 const css=readFileSync('app/globals.css','utf8');
 assert.ok(css.includes('arena-meta-cinematic-reveal'));
 assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'));
});

test('Flashcard Trainer-only permission is authorable, validated and enforced on Worker',()=>{
 const builder=readFileSync('components/arena/Builder.tsx','utf8');
 assert.ok(builder.includes("put('flipPermission','host')"));
 assert.ok(builder.includes("put('flipPermission','learner')"));
 const worker=readFileSync('lib/session-games.ts','utf8');
 assert.ok(worker.includes("a.flipPermission==='host'&&['flip','card'].includes(b.action)"));
 assert.ok(worker.includes("fail('FORBIDDEN',403)"));
 assert.ok(readFileSync('lib/domain.mjs','utf8').includes("['host','learner',undefined].includes(a.flipPermission)"));
 const a:any=sample('Flashcards','en');a.flipPermission='host';
 assert.doesNotThrow(()=>validateActivity(structuredClone(a)));
 const s:any={activity:a,status:'question',current:0,mine:{id:'learner',eligible:true},
  game:{card:0,flipped:false},reveal:null,paused:false};
 const markup=renderToStaticMarkup(<GamePlay s={s} ar={false} host={false} display={false}
  canAnswer busy={false} onSubmit={()=>{}} onInteract={()=>{}} onControl={()=>{}}/>);
 assert.ok(markup.includes('Trainer controls the reveal'));
 const src=readFileSync('components/arena/ArenaDiscoveryGames.tsx','utf8');
 assert.ok(src.includes("const hostOnly=a.flipPermission==='host'"));
 assert.ok(src.includes('actor?usable&&!hostOnly'));
});

test('ImportVerse evidence-marked sixty-minute preset contains all ten engines and seven graded championship levels',()=>{
 const deck=makeImportVerseWorkshop('ar');
 assert.equal(importVersePlannedMinutes,60);
 assert.equal(deck.length,10);
 assert.deepEqual(deck.map(a=>a.type),types);
 assert.doesNotThrow(()=>validateDeck(structuredClone(deck)));
 assert.equal(estimateSessionAgenda(deck).totalSeconds,60*60);
 assert.equal(deck[1].sectors.length,5);
 assert.ok(deck[1].sectors.every((s:any)=>s.kind==='challenge'&&s.points===0));
 assert.equal(deck[2].questions.length,7);
 assert.equal(deck[2].minimumLevels,7);
 assert.equal(deck[7].boxes.length,5);
 assert.ok(deck.every(a=>String(a.contentSource).includes('Episodes 1–5')));
 assert.ok(deck.every(a=>String(a.contentSource).includes('episode 6 pending')));
 assert.ok(deck[2].questions.some((q:any)=>q.prompt.includes('الحلقة 4')));
 assert.equal(importVerseQuestions.length,64);
 assert.equal(new Set(importVerseQuestions.map(q=>q.prompt)).size,64);
 assert.ok(importVerseQuestions.every(q=>q.options.length===4&&q.options[q.correct]&&q.explanation.length>15));
 assert.equal(new Set(importVerseQuestions.map(q=>q.episode)).size,5);
 const fresh=newSessionActivity('Ultimate Game Show','ar');
 assert.equal(fresh.questions.length,7);
 assert.equal(fresh.showFormat,'championship');
 assert.doesNotThrow(()=>validateActivity(structuredClone(fresh)));
 const old=sample('Ultimate Game Show','ar');
 assert.equal(old.questions,undefined,'legacy seeds stay backward compatible');
});

test('v6 new 3D wheel and grading surfaces preserve server authority and contest flow',()=>{
 const wheel=readFileSync('components/arena/GamePlay.tsx','utf8');
 const forge=readFileSync('components/arena/ArenaForgeWheel.css','utf8');
 const discovery=readFileSync('components/arena/ArenaDiscoveryGames.tsx','utf8');
 assert.match(wheel,/wheel-stage--forge/);
 assert.match(wheel,/forge-wheel/);
 assert.match(forge,/arena-forge-roll/);
 assert.match(discovery,/onControl\('flashjudge',index/);
 assert.match(discovery,/flash-grade-console/);
 assert.match(discovery,/box-vault-turn--spotlight/);
 const worker=readFileSync('lib/session-games.ts','utf8');
 assert.match(worker,/if\(b.action==='flashjudge'\)/);
 assert.match(worker,/flashGrades/);
});
