import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import GamePlay from '../components/arena/GamePlay';import LivePoll,{LivePollChart} from '../components/arena/LivePoll';import ActivityArt from '../components/arena/ActivityArt';import StageSplash from '../components/arena/StageSplash';import StageMedia from '../components/arena/StageMedia';import ArenaPowerTimer from '../components/arena/ArenaPowerTimer';
import ArenaVictory,{championsFromSession} from '../components/arena/ArenaVictory';import {resolveArenaMediaUrl} from '../lib/client';import Session from '../components/arena/Session';import Builder from '../components/arena/Builder';import Login from '../components/arena/Login';import {sample,types} from '../lib/catalog';import {publicActivity} from '../lib/domain.mjs';
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
