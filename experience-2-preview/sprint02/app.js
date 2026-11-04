/* MTS Training Arena Experience 2.0 — branded visual proof of concept.
   All player names, points, and questions are demo content. No backend calls. */
(() => {
  'use strict';
  const KEY = 'mts-arena-e2-sprint02-v1';
  const $ = id => document.getElementById(id);
  const display = new URLSearchParams(location.search).get('display') === '1';
  const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(KEY) : null;
  const copy = {
    ar: {
      previewMode:'معاينة التصميم — بيانات تجريبية', soundOff:'صوت مغلق',soundOn:'صوت مفتوح',
      reduce:'تقليل الحركة', restore:'تفعيل الحركة',previewProjector:'معاينة العرض هنا ▢',openProjector:'فتح البروجيكتور ⛶',
      trainerTitle:'مركز قيادة المدرب',trainerDesc:'تحكم مباشر في مشاهد النموذج التجريبي',
      goLobby:'شاشة انتظار الفرق',goIntro:'المقدمة السينمائية',goQuestion:'السؤال التجريبي',
      lock:'إغلاق الإجابات',goReveal:'كشف الإجابة',goPodium:'منصة الفائزين',
      sessionInfo:'حالة الجلسة التجريبية',currentScene:'المشهد الحالي',participants:'المشاركون',
      demoParticipants:'12 اسم افتراضي',teams:'الفرق',questionTimer:'مدة السؤال',
      note:'ده نموذج بصري تفاعلي. الـQR والنقاط والمشاركين بيانات وهمية، ومفيش اتصال بنظام الجلسات الحقيقي.',
      previewFooter:'مرحلة التصميم · بدون تعديل الموقع المنشور أو قاعدة البيانات',exitProjector:'خروج من البروجيكتور ✕',
      scenes:{lobby:'انتظار الفرق',intro:'المقدمة السينمائية',question:'السؤال',locked:'إغلاق الإجابات',reveal:'كشف الإجابة',podium:'منصة الفائزين',wheel:'عجلة الحظ',boxes:'صناديق المفاجآت',leaderboard:'ترتيب الفرق'},
      ready:'جاهزين للتحدي؟',readySub:'المنافسة بتبدأ من هنا. جهز فريقك وابدأ الرحلة.',
      wave:'فريق الموجة',lightning:'فريق البرق',player:'مشاركين',sampleQr:'غير قابل للمسح',
      awaiting:'في انتظار إشارة المدرب',fakePlayers:'12 مشارك تجريبي',fakeTeams:'فريقين',
      question:'قبل إصدار رقم ACID، إيه أهم خطوة لازم نتأكد منها؟',
      options:['اكتمال البيانات المطلوبة للأطراف','اختيار لون الحاوية','طباعة بيان الإفراج','تحديد موعد خروج الشاحنة'],
      lockedTitle:'انتهى الوقت — المدرب هيكشف الإجابة',correct:'الإجابة الصحيحة: اكتمال البيانات المطلوبة للأطراف',
      winners:'أبطال التحدي',sampleScores:'نقاط تجريبية فقط — مش مرتبطة بأي جلسة حقيقية',
      introCall:'استعدوا للتحدي!',introCall2:'اللحظة بدأت',
      label:'معاينة بصرية محلية فقط',skipIntro:'تخطي المقدمة', wheelTitle:'عجلة الحظ',wheelSub:'اضغط على العجلة لبدء العد التنازلي ثم اللفة',boxesTitle:'صناديق المفاجآت',boxesSub:'اختر صندوقًا لفتحه مرة واحدة فقط', boardTitle:'ترتيب الفرق',boardSub:'تجربة ترتيب تفاعلية — النقاط تجريبية وغير متصلة بالسيرفر', spinReady:'اضغط على العجلة',spinCounting:'الاستعداد للدوران',spinMoving:'العجلة بتدور...',spinLanded:'تحديك هو', boxClosed:'افتح الصندوق', boxOpened:'تم فتح الصندوق', spinDisabled:'لف العجلة للمدرب فقط', noScore:'السجل محلي للتجربة فقط'
    },
    en:{
      previewMode:'Visual preview — sample data',soundOff:'Sound off',soundOn:'Sound on',reduce:'Reduce motion',restore:'Enable motion',previewProjector:'Preview here ▢',openProjector:'Open projector ⛶',
      trainerTitle:'Trainer Control Room',trainerDesc:'Switch between the demo broadcast scenes',
      goLobby:'Participant lobby',goIntro:'Cinematic intro',goQuestion:'Demo question',lock:'Lock answers',goReveal:'Reveal answer',goPodium:'Winners podium',
      sessionInfo:'Preview status',currentScene:'Current scene',participants:'Participants',demoParticipants:'12 fictional players',teams:'Teams',questionTimer:'Question duration',
      note:'This is an interactive visual prototype. QR, participant names and scores are fictional. It is not connected to live sessions.',
      previewFooter:'Visual stage · No production site or database changes',exitProjector:'Exit projector ✕',
      scenes:{lobby:'Game lobby',intro:'Cinematic intro',question:'Question',locked:'Answers locked',reveal:'Answer revealed',podium:'Winners',wheel:'Spin wheel',boxes:'Mystery boxes',leaderboard:'Leaderboard'},
      ready:'READY FOR THE CHALLENGE?',readySub:'Where learning becomes a competition. Get your team ready.',
      wave:'Wave Team',lightning:'Lightning Team',player:'players',sampleQr:'NOT SCANNABLE',
      awaiting:'Waiting for trainer',fakePlayers:'12 sample players',fakeTeams:'Two teams',
      question:'Before issuing an ACID number, what must be verified first?',
      options:['Required party details are complete','The container color','Printing the release document','Truck exit time'],
      lockedTitle:'Time is up — waiting for trainer reveal',correct:'Correct answer: required party details are complete',
      winners:'CHAMPIONS OF THE ARENA',sampleScores:'Sample scores only — not connected to any real session',
      introCall:'GET READY FOR THE CHALLENGE!',introCall2:'THE MOMENT IS HERE',
      label:'LOCAL VISUAL PREVIEW ONLY',skipIntro:'Skip intro', wheelTitle:'Spin the wheel',wheelSub:'Click the wheel to start the countdown and spin',boxesTitle:'Mystery boxes',boxesSub:'Open each box once to reveal its challenge',boardTitle:'Leaderboard',boardSub:'Interactive demo standings — not connected to the scoring server',spinReady:'Click the wheel',spinCounting:'Countdown',spinMoving:'Wheel spinning...',spinLanded:'Your challenge',boxClosed:'Open box',boxOpened:'Box opened',spinDisabled:'Trainer controls the spin',noScore:'Local demo ledger only'
    }
  };
  const defaultState = {scene:'lobby',lang:'ar',startedAt:0,deadline:0,seq:0, wheelLabels:null, wheel:{status:'ready',from:0,to:0,index:-1,startedAt:0,duration:4200}, boxesLabels:null, openedBoxes:[], demoScores:[2450,1900],scoreLedger:[]};
  let state = {...defaultState};
  try {const old = JSON.parse(localStorage.getItem(KEY) || 'null');if(old && typeof old === 'object') state = {...defaultState,...old}} catch {}
  const scenes = ['lobby','intro','question','locked','reveal','podium','wheel','boxes','leaderboard'];
  if (!scenes.includes(state.scene)) state.scene = 'lobby';
  if (state.scene === 'intro' && Date.now() - (state.startedAt||0) > 10500) state.scene = 'lobby';
  let soundEnabled = false, reducedMotion = false, introTimeout = null, lastRenderKey = '';
  const original = 'assets/arena-logo-safe-margin.png';
  function logo(cls='hero-logo'){return `<img class="${cls}" src="${original}" alt="Original approved MTS Training Arena logo" draggable="false">`}
  function t(){return copy[state.lang] || copy.ar}
  function sceneName(){return t().scenes[state.scene] || t().scenes.lobby}
  function publish(change){
    state = {...state,...change,seq:(state.seq||0)+1};
    try { localStorage.setItem(KEY, JSON.stringify(state)) } catch {}
    channel?.postMessage(state); render(true);
  }
  function sync(remote){
    if (!remote || !scenes.includes(remote.scene) || remote.seq <= (state.seq||0)) return;
    state = {...defaultState,...remote};
    clearTimeout(introTimeout);introTimeout=null;
    render(true);
  }
  window.addEventListener('storage', ev => {if(ev.key===KEY && ev.newValue) try {sync(JSON.parse(ev.newValue))} catch {}});
  if (channel) channel.onmessage = ev => sync(ev.data);
  const questionSecs = () => Math.max(0,Math.ceil((state.deadline - Date.now())/1000));
  function playSound(){
    if(!soundEnabled) return;
    try {const Audio = window.AudioContext||window.webkitAudioContext;if(!Audio)return;const ctx = new Audio();
      [523.25,659.25,783.99].forEach((f,i)=>{const osc=ctx.createOscillator(),gain=ctx.createGain();osc.frequency.value=f;osc.type='sine';gain.gain.value=.026;osc.connect(gain);gain.connect(ctx.destination);osc.start(ctx.currentTime+i*.12);osc.stop(ctx.currentTime+i*.12+.1)});
      setTimeout(()=>ctx.close().catch(()=>{}),1000);
    } catch {}
  }
  function backgroundContent(){
    const c=t();return `<div class="micro">GET READY · GAME LOBBY</div>
      ${logo('hero-logo')}
      <h1 class="main-headline">${state.lang==='ar'?'كلنا جاهزين <em>للتحدي؟</em>':'READY FOR <em>THE CHALLENGE?</em>'}</h1>
      <p class="main-sub">${c.readySub}</p>
      <div class="teams-row">
        <div class="team-card wave"><small>TEAM 02</small><b>${c.wave}</b><span>6 ${c.player}</span></div>
        <div class="join-card"><div class="fake-qr" aria-hidden="true"></div><b>DEMO · NO QR</b><strong>${c.sampleQr}</strong></div>
        <div class="team-card"><small>TEAM 01</small><b>${c.lightning}</b><span>6 ${c.player}</span></div>
      </div>
      <div class="lobby-metrics"><span><i class="metric-led"></i>${c.fakePlayers}</span><span><i class="metric-led"></i>${c.fakeTeams}</span><span><i class="metric-led"></i>${c.awaiting}</span></div>`;
  }
  function introContent(){
    return `<div class="intro-scene">
      <div class="intro-kicker">THE EXPERIENCE BEGINS</div>
      ${logo('intro-brand')}
      <div class="intro-call" id="introCall">${t().introCall}</div>
      <div class="intro-count" id="introCount"></div>
      <div class="intro-progress" id="introProgress"></div>
    </div>`;
  }
  function questionContent(){
    const c=t(), reveal=state.scene==='reveal', locked=state.scene==='locked', s=questionSecs();
    return `<div class="question-wrap">
      <div class="micro">ROUND 01 · ${reveal?'ANSWER REVEAL':locked?'ANSWERS LOCKED':'LIVE QUESTION'}</div>
      <div class="timer-ring${locked?' locked':''}" id="timerDisplay">${reveal?'✓':locked?'0':s}</div>
      <h2 class="question-heading">${c.question}</h2>
      <div class="answer-grid">${c.options.map((item,i)=>`<div class="answer-option${reveal?(i===0?' correct':' inactive'):''}"><span class="letter">${'ABCD'[i]}</span><span>${item}</span></div>`).join('')}</div>
      ${reveal?`<div class="reveal-note">✓ ${c.correct}</div><div class="reveal-chart">${demoAnswerBars()}</div>`:locked?`<div class="reveal-note closed">${c.lockedTitle}</div>`:'<div class="progress-track"><div class="fill" id="timeFill"></div></div>'}
    </div>`;
  }
  function podiumContent(){
    const c=t();return `<div class="podium-wrap">
      <div class="micro">GRAND FINALE · DEMO WINNERS</div>
      ${logo('hero-logo compact')}
      <h2 class="podium-title">${c.winners}</h2>
      <div class="podium-steps">${podiumSteps()}</div>
      <p class="mock-warning">${c.sampleScores}</p>
    </div>`;
  }

  // Sprint 02 local demonstration; no live players or trusted backend.
  const starterWheelAr=['+5 نقاط','تحدّي سريع','+10 نقاط','سؤال إضافي','خصم نقطتين','بدّل الدور','مكافأة الفريق','مهمة مفاجأة'];
  const starterWheelEn=['+5 points','Quick challenge','+10 points','Bonus question','-2 points','Switch turn','Team bonus','Mystery mission'];
  const starterBoxesAr=['+5 نقاط للفريق','اشرح مصطلح ACID','سؤال صح أو غلط','خصم نقطتين','مكافأة +10','تحدي 30 ثانية'];
  const starterBoxesEn=['Team +5 points','Explain ACID','True or false','-2 points','Bonus +10','30-second challenge'];
  const wheelLabels=()=>Array.isArray(state.wheelLabels)&&state.wheelLabels.length>=3?state.wheelLabels:(state.lang==='ar'?starterWheelAr:starterWheelEn);
  const boxesLabels=()=>Array.isArray(state.boxesLabels)&&state.boxesLabels.length===6?state.boxesLabels:(state.lang==='ar'?starterBoxesAr:starterBoxesEn);
  const escapeText=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const scores=()=>Array.isArray(state.demoScores)&&state.demoScores.length===2?state.demoScores:[2450,1900];
  function teamRank(){return [0,1].sort((a,b)=>scores()[b]-scores()[a]);}
  function podiumSteps(){const c=t(),order=teamRank(),all=scores(),team=i=>i===0?c.lightning:c.wave;
    return [order[1],order[0]].map((i,k)=>`<div class="podium-step ${k===1?'winner':''}"><span class="rank">${all[order[0]]===all[order[1]]?'=':(k===1?'★ 1':'2')}</span><b>${team(i)}</b><small>${all[i].toLocaleString('en-US')} PTS · DEMO</small></div>`).join('');
  }
  function demoAnswerBars(){const values=[6,3,2,1],total=values.reduce((a,b)=>a+b,0);return values.map((v,i)=>`<div class="reveal-col ${i===0?'correct':''}"><b>${'ABCD'[i]} · ${v}</b><div class="bar"><span style="--pct:${(v/total*100).toFixed(1)}%"></span></div></div>`).join('');}
  function wheelSVG(labels){const n=labels.length,step=360/n,parts=[];const rad=x=>x*Math.PI/180,xy=(a,r)=>[250+r*Math.cos(rad(a)),250+r*Math.sin(rad(a))];
    for(let i=0;i<n;i++){
      const a=-90+i*step,b=a+step,m=a+step/2,[x1,y1]=xy(a,215),[x2,y2]=xy(b,215),[tx,ty]=xy(m,140),large=step>180?1:0;
      const fill=['#0f6ba6','#0b836e','#17629b','#147e61','#0c497c','#1b9578','#1c639c','#126650'][i%8];
      parts.push(`<path d="M250 250 L${x1.toFixed(3)} ${y1.toFixed(3)} A215 215 0 ${large} 1 ${x2.toFixed(3)} ${y2.toFixed(3)} Z" fill="${fill}" stroke="#a2e5f1" stroke-opacity=".65" stroke-width="2"/>`);
      parts.push(`<text x="${tx.toFixed(2)}" y="${ty.toFixed(2)}" data-x="${tx.toFixed(2)}" data-y="${ty.toFixed(2)}" text-anchor="middle" dominant-baseline="middle" font-size="${n>9?12:14}" font-family="Cairo,Arial" font-weight="900" fill="#ffffff" stroke="#082139" stroke-width="3" paint-order="stroke">${escapeText(labels[i].slice(0,15))}</text>`);
    }
    return `<svg class="wheel-svg" viewBox="0 0 500 500" role="img" aria-label="Spin wheel"><defs><radialGradient id="wheelG"><stop offset="75%" stop-color="#fff" stop-opacity="0"/><stop offset="100%" stop-color="#fff" stop-opacity=".19"/></radialGradient></defs><circle cx="250" cy="250" r="242" fill="#7794ad" stroke="#f4dea2" stroke-width="8"/><circle cx="250" cy="250" r="228" fill="#091a32" stroke="#68cced" stroke-width="9"/><g id="wheelRotor">${parts.join('')}</g><circle cx="250" cy="250" r="215" fill="url(#wheelG)" stroke="#d9c68c" stroke-width="5" pointer-events="none"/></svg>`;
  }
  function wheelContent(){const c=t();return `<div class="game-wrap"><div class="micro">SPIN TO WIN · LOCAL DEMO</div><h2 class="game-title">${c.wheelTitle}</h2><p class="game-sub">${c.wheelSub}</p><div class="wheel-area"><div class="wheel-pointer" aria-hidden="true"></div><button type="button" id="wheelFace" class="wheel-face" aria-label="${c.spinDisabled}" ${display?'disabled':''}>${wheelSVG(wheelLabels())}</button><div class="wheel-center">MTS</div></div><div id="wheelCountdown" class="wheel-countdown" aria-live="polite"></div><div id="wheelStatus" class="wheel-status">${c.spinReady}</div><div id="wheelResult" class="wheel-result" aria-live="polite"></div><p class="mock-warning">${c.sampleScores}</p></div>`;}
  function boxesContent(){const c=t(),opened=Array.isArray(state.openedBoxes)?state.openedBoxes:[];return `<div class="game-wrap"><div class="micro">MYSTERY BOX · LOCAL DEMO</div><h2 class="game-title">${c.boxesTitle}</h2><p class="game-sub">${c.boxesSub}</p><div class="boxes-grid">${boxesLabels().map((label,i)=>{
    const open=opened.includes(i);return `<button data-box="${i}" class="mystery-box ${open?'open':''}" type="button" ${open||display?'disabled':''} aria-label="${open?c.boxOpened:c.boxClosed} ${i+1}"><strong>${open?escapeText(label):'✦ '+String(i+1).padStart(2,'0')}</strong><em>${open?c.boxOpened:c.boxClosed}</em></button>`;}).join('')}</div><p class="mock-warning">${c.sampleScores}</p></div>`;}
  function leaderboardContent(){const c=t(),ss=scores(),mx=Math.max(...ss,1),ord=teamRank();return `<div class="game-wrap"><div class="micro">RANKING · LOCAL DEMO</div><h2 class="game-title">${c.boardTitle}</h2><p class="game-sub">${c.boardSub}</p><div class="scoreboard">${ord.map((i,idx)=>`<div class="score-row" data-team="${i}" style="animation-delay:${idx*.11}s"><span class="score-rank">${ss[ord[0]]===ss[ord[1]]?'=':idx+1}</span><div class="score-main"><b>${i===0?c.lightning:c.wave}</b><div class="score-bar"><i style="--score-pct:${Math.round(ss[i]/mx*100)}%;--pct:${Math.round(ss[i]/mx*100)}%"></i></div></div><span class="score-num">${ss[i].toLocaleString('en-US')}</span></div>`).join('')}</div><p class="score-mini">${c.noScore} · ${(state.scoreLedger||[]).length} demo adjustments</p></div>`;}
  const mod=v=>((v%360)+360)%360;
  function triggerSpin(){if(display||state.scene!=='wheel')return;const status=state.wheel?.status||'ready';if(status==='countdown'||status==='spinning')return;
    const n=wheelLabels().length,buf=new Uint32Array(1);if(window.crypto?.getRandomValues)window.crypto.getRandomValues(buf);else buf[0]=Math.floor(Math.random()*4294967296);
    const target=buf[0]%n;
    publish({wheel:{status:'countdown',from:state.wheel?.to||0,to:0,index:target,startedAt:Date.now(),duration:4200}});
  }
  function adjustScores(){if(display)return;const team=Number($('scoreTeam').value),delta=Number($('scoreDelta').value),reason=$('scoreReason').value.trim(),indicator=$('scoreMessage');
    if(![0,1].includes(team)||!Number.isInteger(delta)||Math.abs(delta)>500||delta===0||reason.length<3){indicator.textContent='اختر الفريق، نقاط من -500 إلى 500، وسبب واضح (3 أحرف على الأقل).';return;}
    const next=[...scores()];next[team]=Math.max(0,next[team]+delta);
    publish({demoScores:next,scoreLedger:[...(state.scoreLedger||[]),{team,delta,reason,at:Date.now()}].slice(-60)});
    indicator.textContent=state.lang==='ar'?'تم تعديل النقاط التجريبية':'Demo score updated';
  }
  function activateScene(){
    if(state.scene==='wheel')$('wheelFace')?.addEventListener('click',triggerSpin);
    if(state.scene==='boxes'&&!display){document.querySelectorAll('[data-box]').forEach(el=>el.addEventListener('click',()=>{
      const index=Number(el.dataset.box),opened=Array.isArray(state.openedBoxes)?state.openedBoxes:[];
      if(!opened.includes(index))publish({openedBoxes:[...opened,index]});
    }));}
  }
  function animateWheel(){if(state.scene!=='wheel')return;
    const w=state.wheel||{},el=$('wheelRotor'),status=$('wheelStatus'),count=$('wheelCountdown'),result=$('wheelResult');if(!el)return;
    const c=t(),now=Date.now(),labels=wheelLabels();let angle=w.to||w.from||0;
    if(w.status==='countdown'){
      angle=w.from||0;const left=3000-(now-w.startedAt);
      count.textContent=left>0?String(Math.ceil(left/1000)):'';
      status.textContent=c.spinCounting;
      if(left<=0&&!display){const pos=w.from||0,desired=mod(-(w.index+.5)*360/labels.length),shift=mod(desired-mod(pos));
        publish({wheel:{...w,status:'spinning',from:pos,to:pos+6*360+shift,startedAt:now}});return;}
    }else if(w.status==='spinning'){
      const elapsed=Math.max(0,now-w.startedAt),pct=Math.min(1,elapsed/(w.duration||4200)),ease=1-Math.pow(1-pct,4);
      angle=(w.from||0)+(w.to-(w.from||0))*ease;count.textContent='';status.textContent=c.spinMoving;
      if(pct>=1&&!display){publish({wheel:{...w,status:'landed'}});return;}
    }else if(w.status==='landed'){
      count.textContent='';status.textContent=c.spinLanded;result.textContent=labels[w.index]||'';
    }else{count.textContent='';status.textContent=c.spinReady;}
    el.setAttribute('transform',`rotate(${angle.toFixed(3)} 250 250)`);
    el.querySelectorAll('text[data-x]').forEach(label=>label.setAttribute('transform',`rotate(${-angle.toFixed(3)} ${label.dataset.x} ${label.dataset.y})`));
  }

  function render(force=false){
    const c=t(), key=state.scene+'-'+state.lang;
    if(force||key!==lastRenderKey){
      document.documentElement.lang=state.lang;
      document.documentElement.dir=state.lang==='ar'?'rtl':'ltr';
      $('langBtn').textContent=state.lang==='ar'?'English':'عربي';
      for(const item of document.querySelectorAll('[data-i18n]')){
        const val=c[item.dataset.i18n];if(typeof val==='string')item.textContent=val;
      }
      $('soundBtn').innerHTML = `${soundEnabled?'🔊':'🔇'} <span>${soundEnabled?c.soundOn:c.soundOff}</span>`;
      $('reduceBtn').textContent=reducedMotion?c.restore:c.reduce;
      $('sceneStatus').textContent=sceneName();
      $('stage').dataset.scene=state.scene;
      const tags={lobby:'01 · GAME LOBBY',intro:'02 · CINEMATIC INTRO',question:'03 · LIVE QUESTION',locked:'04 · ANSWERS LOCKED',reveal:'05 · ANSWER REVEAL',podium:'06 · WINNERS PODIUM',wheel:'07 · SPIN WHEEL',boxes:'08 · MYSTERY BOXES',leaderboard:'09 · LEADERBOARD'};
      $('stageInfo').textContent=tags[state.scene]||'GAME LOBBY';
      $('footerStatus').textContent='DESIGN PREVIEW · NOT A LIVE SESSION';
      $('sceneLayer').innerHTML=state.scene==='lobby'?backgroundContent():state.scene==='intro'?introContent():state.scene==='podium'?podiumContent():state.scene==='wheel'?wheelContent():state.scene==='boxes'?boxesContent():state.scene==='leaderboard'?leaderboardContent():questionContent();
      activateScene();
      const active={lobby:'lobbyBtn',intro:'introBtn',question:'questionBtn',locked:'lockBtn',reveal:'revealBtn',podium:'podiumBtn',wheel:'wheelBtn',boxes:'boxesBtn',leaderboard:'leaderboardBtn'}[state.scene];
      document.querySelectorAll('.control-btn').forEach(x=>x.classList.toggle('active',x.id===active));
      const skip=document.getElementById('skipIntroBtn');if(skip)skip.hidden=state.scene!=='intro';
      lastRenderKey=key;
    }
    animateWheel();
    if(state.scene==='intro'){
      const elapsed=Math.max(0,Date.now()-state.startedAt);
      const line=$('introCall'),number=$('introCount'),progress=$('introProgress');
      if(line)line.textContent=elapsed<3800?c.introCall:c.introCall2;
      if(number)number.textContent=elapsed<4900?'':elapsed<5750?'3':elapsed<6600?'2':elapsed<7450?'1':'';
      if(progress)progress.style.setProperty('--intro-progress',Math.min(elapsed/8000,1));
    }
    if(state.scene==='question'){
      const secs=questionSecs();const timer=$('timerDisplay'),fill=$('timeFill');
      if(timer)timer.textContent=secs;
      if(fill)fill.style.width=(Math.max(0,Math.min(100, (state.deadline-Date.now())/200)))+'%';
      if(secs===0&&!display) publish({scene:'locked',deadline:0});
    }
  }
  function transition(scene){
    if(display)return;
    clearTimeout(introTimeout);introTimeout=null;
    if(scene==='intro'){
      publish({scene:'intro',startedAt:Date.now(),deadline:0});playSound();
      introTimeout=setTimeout(()=>{if(state.scene==='intro')transition('question')},8000);
    }else if(scene==='question'){
      publish({scene:'question',deadline:Date.now()+20000,startedAt:0});playSound();
    }else{
      publish({scene,deadline:0,startedAt:0});if(['reveal','podium'].includes(scene))playSound();
    }
  }
  for(const [button,scene] of [['lobbyBtn','lobby'],['introBtn','intro'],['questionBtn','question'],['lockBtn','locked'],['revealBtn','reveal'],['podiumBtn','podium'],['wheelBtn','wheel'],['boxesBtn','boxes'],['leaderboardBtn','leaderboard']]){
    $(button).addEventListener('click',()=>transition(scene));
  }
  // Trainer can always skip the cinematic scene without losing the next question.
  const skip=document.createElement('button');skip.id='skipIntroBtn';skip.className='control-btn';skip.textContent=copy.ar.skipIntro;skip.hidden=true;
  skip.addEventListener('click',()=>transition('question'));
  document.querySelector('.controls-stack').appendChild(skip);

  $('applyWheelLabels').addEventListener('click',()=>{
    const labels=$('wheelLabelsInput').value.split('\n').map(s=>s.trim()).filter(Boolean).slice(0,12);
    if(labels.length<3||labels.some(x=>x.length>25)){$('wheelConfigStatus').textContent='3–12 segments, at most 25 characters each.';return;}
    if(['countdown','spinning'].includes(state.wheel?.status)){$('wheelConfigStatus').textContent='Wait until the spin finishes.';return;}
    publish({wheelLabels:labels,wheel:{status:'ready',from:0,to:0,index:-1,startedAt:0,duration:4200}});$('wheelConfigStatus').textContent='✓ Saved locally (demo)';
  });
  $('applyBoxLabels').addEventListener('click',()=>{
    const labels=$('boxesLabelsInput').value.split('\n').map(s=>s.trim()).filter(Boolean);
    if(labels.length!==6||labels.some(x=>x.length>45)){$('boxConfigStatus').textContent='Exactly 6 boxes; each at most 45 characters.';return;}
    publish({boxesLabels:labels,openedBoxes:[]});$('boxConfigStatus').textContent='✓ Saved locally (demo)';
  });
  $('resetBoxes').addEventListener('click',()=>publish({openedBoxes:[]}));
  $('applyScore').addEventListener('click',adjustScores);
  $('langBtn').addEventListener('click',()=>publish({lang:state.lang==='ar'?'en':'ar'}));
  $('wheelLabelsInput').value=wheelLabels().join('\n');
  $('boxesLabelsInput').value=boxesLabels().join('\n');
  $('scoreDelta').value='5';
  
  $('soundBtn').addEventListener('click',()=>{soundEnabled=!soundEnabled;render(true);if(soundEnabled)playSound()});
  $('reduceBtn').addEventListener('click',()=>{reducedMotion=!reducedMotion;document.body.classList.toggle('reduce-motion',reducedMotion);render(true)});
  let localProjectorPreview=false;
  $('previewProjectorBtn').addEventListener('click',()=>{localProjectorPreview=true;document.body.classList.add('projector-mode');$('exitProjector').hidden=false});
  $('projectorBtn').addEventListener('click',()=>{const u=new URL(location.href);u.searchParams.set('display','1');window.open(u.toString(),'arena-e2-projector','noopener')});
  $('exitProjector').addEventListener('click',()=>{if(localProjectorPreview){localProjectorPreview=false;document.body.classList.remove('projector-mode');$('exitProjector').hidden=true;return;}const u=new URL(location.href);u.searchParams.delete('display');location.href=u.toString()});
  if(display){document.body.classList.add('projector-mode');$('exitProjector').hidden=false}
  setInterval(()=>render(),100);
  window.addEventListener('visibilitychange',()=>{if(!document.hidden)render(true)});
  render(true);
})();