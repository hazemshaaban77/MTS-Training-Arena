import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import GamePlay from '../components/arena/GamePlay';import ActivityArt from '../components/arena/ActivityArt';import StageMedia from '../components/arena/StageMedia';import ArenaPowerTimer from '../components/arena/ArenaPowerTimer';import {resolveArenaMediaUrl} from '../lib/client';import Session from '../components/arena/Session';import Builder from '../components/arena/Builder';import Login from '../components/arena/Login';import {sample,types} from '../lib/catalog';import {publicActivity} from '../lib/domain.mjs';
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
  assert.ok(html.includes('stroke-dashoffset="55"'),mode);
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
