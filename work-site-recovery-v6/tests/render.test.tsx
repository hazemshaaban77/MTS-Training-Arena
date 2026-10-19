import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import GamePlay from '../components/arena/GamePlay';import LivePoll,{LivePollChart} from '../components/arena/LivePoll';import ActivityArt from '../components/arena/ActivityArt';import StageSplash from '../components/arena/StageSplash';import StageMedia from '../components/arena/StageMedia';import ArenaPowerTimer from '../components/arena/ArenaPowerTimer';
import ArenaVictory,{championsFromSession} from '../components/arena/ArenaVictory';
import ArenaSimulator from '../components/arena/ArenaSimulator';
import SessionEntryFeedback from '../components/arena/SessionEntryFeedback';
import TrainerReadiness from '../components/arena/TrainerReadiness';
import {estimateSessionAgenda} from '../lib/session-planning';
import TraineeFinish,{ownSessionResult} from '../components/arena/TraineeFinish';import {resolveArenaMediaUrl} from '../lib/client';import Session from '../components/arena/Session';import Builder from '../components/arena/Builder';import Login from '../components/arena/Login';import {sample,types} from '../lib/catalog';import {publicActivity} from '../lib/domain.mjs';
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
   assert.ok(html.includes(ar?'التحدّي التالي':'YOUR NEXT CHALLENGE'),type);
  }
  const tile=renderToStaticMarkup(<ActivityArt activity={type} label={type}/>);
  assert.ok(tile.includes(expected),type);
 }
 const session=readFileSync('components/arena/Session.tsx','utf8');
 assert.ok(session.includes('durationMs={display?2300:host?1450:1100}'));
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
 assert.ok(source.includes("kind=\"unavailable\""));
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
 assert.ok(source.includes("s.status==='ready'?t('افتح استقبال المتدربين','Open participant lobby'):t('ابدأ أول نشاط','Start first activity')"));
 assert.ok(source.includes("s.status==='ready'){command('launch');return;"));
 assert.ok(source.includes("if(ready===0&&!window.confirm"),'Warn before running empty session');
 const css=readFileSync('app/globals.css','utf8');
 assert.ok(css.includes('V6 Trainer Readiness'));
 assert.ok(css.includes('.trainer-readiness__signals'));
});

test('trainer session builder supports safe blank vs sample deck and honest timing estimate',()=>{
 const empty=estimateSessionAgenda([]);
 assert.deepEqual(empty,{timedSeconds:0,transitionSeconds:0,totalSeconds:0,untimedSteps:0,steps:0});
 const demo=estimateSessionAgenda([
  {type:'Quiz',timer:30},
  {type:'Quiz',questions:[{type:'Quiz',timer:20},{type:'Quiz',timer:40}]},
  {type:'Flashcards'},
 ] as any);
 assert.equal(demo.timedSeconds,90);
 assert.equal(demo.transitionSeconds,60);
 assert.equal(demo.totalSeconds,150);
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
 assert.ok(src.includes('setDeck(blank?[]:types.map(type=>sample(type,lang)))'));
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
 assert.ok(html.includes('SPIN THE WHEEL'),'Original trainer control remains');
 const untouched=renderToStaticMarkup(<GamePlay s={{
  ...base,game:{...base.game,spin:null,outcome:null,turn:0,used:[]}
 }} ar={true} host={true} display={false} canAnswer={false} busy={false}
 onSubmit={()=>{}} onInteract={()=>{}} onControl={()=>{}}/>);
 assert.ok(untouched.includes('لف العجلة'));
 assert.ok(!untouched.includes('wheel-legend-winner'));
 const source=readFileSync('components/arena/GamePlay.tsx','utf8');
 assert.ok(source.includes("spin?.revealed&&spin.index===i"),'Winners must come from server spin, never client randomness');
 const css=readFileSync('app/globals.css','utf8');
 assert.ok(css.includes('V6 WHEEL OF FORTUNE — GRAND ARENA SHOW'));
 assert.ok(css.includes('.projector .wheel-wrap--grand'));
 assert.ok(css.includes('prefers-reduced-motion:reduce'));
});
