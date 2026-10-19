import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import GamePlay from '../components/arena/GamePlay';import ActivityArt from '../components/arena/ActivityArt';import StageMedia from '../components/arena/StageMedia';import {resolveArenaMediaUrl} from '../lib/client';import Session from '../components/arena/Session';import Builder from '../components/arena/Builder';import Login from '../components/arena/Login';import {sample,types} from '../lib/catalog';import {publicActivity} from '../lib/domain.mjs';
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
  const path='public/'+(html.match(/activity-art\/[^"]+\.svg/)||[])[0];
  assert.ok(readFileSync(path,'utf8').includes('<svg'),name);
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

test('Cloudinary upload path is Firebase-signed on Worker and does not reveal server secret in browser code',()=>{
 const worker=readFileSync('github-api-worker.ts','utf8');
 const client=readFileSync('lib/client.ts','utf8');
 const workspace=readFileSync('components/arena/WorkspaceTools.tsx','utf8');
 assert.ok(worker.includes("url.pathname==='/api/media-sign'"));
 assert.ok(worker.includes('await authorizeFirebaseTrainer(request'));
 assert.ok(worker.includes('await checkRate(env.DB,request)'));
 assert.ok(worker.includes("crypto.subtle.digest('SHA-256'"));
 assert.ok(worker.includes('CLOUDINARY_API_SECRET'));
 assert.ok(client.includes("await api('media-sign'"));
 assert.ok(client.includes("api.cloudinary.com/v1_1/"));
 assert.ok(!client.includes('CLOUDINARY_API_SECRET'));
 assert.ok(client.includes("parsed.hostname!=='res.cloudinary.com'"));
 assert.ok(workspace.includes('uploadLibraryFile'));
 assert.ok(workspace.includes('video/mp4,video/webm'));
});
