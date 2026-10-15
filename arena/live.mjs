/* Experimental connection pilot. DO NOT deploy until arenaV1 rules are audited and merged safely. */
const box=document.getElementById("live");
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const id=()=>Array.from(crypto.getRandomValues(new Uint8Array(12)),n=>n.toString(16).padStart(2,"0")).join("");
const qs=new URLSearchParams(location.search);
const queryRoom=qs.get("room")||"";
const LAST_ROOM_KEY="mts-arena-pilot-last-room-v1";
const validRoom=v=>/^[0-9a-f]{24}$/.test(v||"");
function rememberedRoom(){try{return JSON.parse(localStorage.getItem(LAST_ROOM_KEY)||"null")}catch{return null}}
const ROOM_INDEX_KEY="mts-arena-trainer-rooms-v1";
function rememberedRooms(uid){
  try {
    const saved=rememberedRoom();
    const index=JSON.parse(localStorage.getItem(ROOM_INDEX_KEY)||"{}");
    return [...new Set([...(Array.isArray(index[uid])?index[uid]:[]),...(saved?.uid===uid?[saved.room]:[]),queryRoom].filter(validRoom))].slice(0,100);
  } catch {return validRoom(queryRoom)?[queryRoom]:[]}
}
function rememberRoom(value,uid){
  try {
    localStorage.setItem(LAST_ROOM_KEY,JSON.stringify({room:value,uid}));
    const index=JSON.parse(localStorage.getItem(ROOM_INDEX_KEY)||"{}");
    index[uid]=[value,...(Array.isArray(index[uid])?index[uid]:[]).filter(r=>r!==value)].slice(0,100);
    localStorage.setItem(ROOM_INDEX_KEY,JSON.stringify(index));
  }catch{}
}
async function loadTrainerRooms(){
  const area=document.getElementById("resumeArea");
  if(!area)return;
  area.innerHTML='<h3>My Pilot Rooms</h3><p class="note">Loading saved rooms…</p>';
  const entries=await Promise.all(rememberedRooms(me).map(async key=>{
    try{
      const base="arenaV1/rooms/"+key;
      const [priv,pub]=await Promise.all([db.ref(base+"/private").once("value"),db.ref(base+"/public").once("value")]);
      const state=pub.val();
      return priv.child("createdBy").val()===me&&state?{id:key,title:state.title||"Untitled",status:state.status,round:state.round}:null;
    }catch{return null}
  }));
  if(!document.getElementById("resumeArea"))return;
  const items=entries.filter(Boolean);
  if(!items.length){area.innerHTML='<h3>My Pilot Rooms</h3><p class="note">No saved accessible rooms. Create one or open an existing room link.</p>';return;}
  area.innerHTML='<h3>My Pilot Rooms</h3><div class="field"><label for="roomSelect">Select a room by name</label><select id="roomSelect"></select></div><button class="btn secondary" id="resumeSelected">Open Selected Room</button><p class="note">Rooms saved on this browser only. A secure cross-device room index is planned.</p>';
  const select=document.getElementById("roomSelect");
  for(const [label,subset] of [["Open sessions",items.filter(r=>r.status!=="completed")],["Completed sessions",items.filter(r=>r.status==="completed")]]){
    if(!subset.length)continue;
    const group=document.createElement("optgroup");group.label=label;
    for(const item of subset){const option=document.createElement("option");option.value=item.id;option.textContent=item.title+" — "+item.status+" ("+item.round+")";group.appendChild(option);}
    select.appendChild(group);
  }
  document.getElementById("resumeSelected").onclick=()=>{if(validRoom(select.value))resumeTrainerRoom(select.value);};
}

let app,auth,db,offset=0,room="",me="",trainer=false,publicState=null,stop=[],answers={},activityList=[],current=0,participantTimer=null;
function show(s){box.innerHTML=s;}
function note(s){const x=document.getElementById("notice");if(x)x.textContent=s;}
function cleanup(){if(participantTimer!==null){clearInterval(participantTimer);participantTimer=null;}for(const fn of stop)fn();stop=[];publicState=null;answers={};countedRound="";}
function listen(path,cb){const ref=db.ref(path);ref.on("value",cb,err=>note("Firebase: "+err.message));stop.push(()=>ref.off("value",cb));}
function init(){
  if(typeof FB_CONFIG==="undefined"||!FB_CONFIG?.projectId||!FB_CONFIG?.databaseURL) {show("<p>Firebase config missing or lacks a Realtime Database URL. This pilot cannot run until it is configured.</p>");return;}
  app=firebase.initializeApp(FB_CONFIG,"mts-arena-pilot");
  auth=app.auth();db=app.database();
  db.ref(".info/serverTimeOffset").on("value",s=>offset=s.val()||0);
  show('<h2>Connect to Firebase Pilot</h2><p class="note">This is a separate Arena namespace and requires its security rules and a manually authorized trainer UID. Never enter employee data before security review.</p><div class="actions"><button class="btn" id="train">Trainer</button><button class="btn secondary" id="join">Trainee</button></div><p id="notice" class="note"></p>');
  document.getElementById("train").onclick=trainerSignIn;
  document.getElementById("join").onclick=participantSignIn;
  // One room QR deep-links directly to participant entry; never auto-create identity or submit answers.
  if(validRoom(queryRoom))participantSignIn();
}
function trainerSignIn(){
  cleanup();
  show('<h2>Verified Trainer Sign In</h2><form id="login" class="fields"><div class="field"><label>Email</label><input type="email" id="email" required autocomplete="email"></div><div class="field"><label>Password</label><input type="password" id="password" required autocomplete="current-password"></div><button class="btn">Sign in</button></form><p id="notice" class="note"></p>');
  document.getElementById("login").onsubmit=async e=>{
    e.preventDefault();
    try{
      await auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
      const u=await auth.signInWithEmailAndPassword(document.getElementById("email").value,document.getElementById("password").value);
      const access=await db.ref("arenaV1/trainerAllowlist/"+u.user.uid).once("value");
      if(access.val()!==true){await auth.signOut();throw Error("Account not authorized as an Arena trainer");}
      trainer=true;me=u.user.uid;trainerHome();
    }catch(error){note(error.message);}
  };
}
function participantSignIn(){
  cleanup();
  show('<h2>Participant Entry</h2><p class="note">The room link is shared by the trainer. Employee IDs are private and never rendered on the projector.</p><form id="roomForm" class="fields"><div class="field"><label>Room code</label><input id="roomInput" required value="'+esc(queryRoom)+'" maxlength="30"></div><button class="btn">Continue</button></form><p id="notice" class="note"></p>');
  document.getElementById("roomForm").onsubmit=async e=>{
    e.preventDefault();try{
      await auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
      const u=auth.currentUser || (await auth.signInAnonymously()).user;
      me=u.uid;trainer=false;
      room=document.getElementById("roomInput").value.trim().toLowerCase();
      if(!/^[0-9a-f]{24}$/.test(room))throw Error("Invalid room link");
      const s=await db.ref("arenaV1/rooms/"+room+"/public").once("value");
      if(!s.exists())throw Error("Room not available");
      participantHome();
    }catch(error){note(error.message);}
  };
  if(validRoom(queryRoom))document.getElementById("roomForm").requestSubmit();
}
function sampleActivities(){
  try{
    const list=JSON.parse(localStorage.getItem("mts-arena-preview-v1"))?.sessions||[];
    const draft=list.find(s=>s.activities?.some(a=>["Quiz","Live Poll","Dropdown"].includes(a.type)));
    if(draft){const filtered=draft.activities.filter(a=>["Quiz","Live Poll","Dropdown"].includes(a.type) && a.question && Array.isArray(a.options) && a.options.length>=2);
      if(filtered.length)return {title:draft.name||"MTS Arena Pilot",activities:filtered};}
  }catch{}
  return {title:"MTS Arena Pilot",activities:[
    {type:"Quiz",question:"Which document is commonly used for goods shipment?",options:["Invoice","Cinema ticket","Train map"],correct:0,timer:30},
    {type:"Live Poll",question:"Which topic should we practice?",options:["Import","Export","ACI"],correct:null,timer:20}
  ]};
}
function trainerHome(){
  cleanup();
  const draft=sampleActivities();activityList=draft.activities;current=0;
  show('<h2>Trainer Pilot Console</h2><p class="note">Pilot deliberately does not compute, store or reveal scores. Trainer controls one question at a time. Answer keys are not published to the public room.</p><div class="fields"><div class="field"><label>Room title</label><input id="title" maxlength="120" value="'+esc(draft.title)+'"></div><button class="btn green" id="create">Create Pilot Room</button></div><div id="resumeArea"></div><p id="notice" class="note"></p>');
  loadTrainerRooms().catch(e=>note(e.message));
  document.getElementById("create").onclick=async()=>{
    try{
      room=id(); const title=document.getElementById("title").value.trim()||"MTS Arena Pilot";
      const p={title,status:"lobby",round:'r0',question:"Ready to play",options:["Waiting","Waiting"],deadline:0,joinOpen:true};
      await db.ref("arenaV1/rooms/"+room+"/public").set(p);
      await db.ref("arenaV1/rooms/"+room+"/private").set({createdBy:me,createdAt:firebase.database.ServerValue.TIMESTAMP});
      rememberRoom(room,me);
      trainerRoom();
    }catch(error){note(error.message);}
  };
}
async function resumeTrainerRoom(target){
  try{
    if(!validRoom(target))throw Error("Invalid room code");
    const base="arenaV1/rooms/"+target;
    const [privateSnap,publicSnap]=await Promise.all([db.ref(base+"/private").once("value"),db.ref(base+"/public").once("value")]);
    if(privateSnap.child("createdBy").val()!==me)throw Error("Only the trainer who created this room can resume it");
    const state=publicSnap.val();
    if(!state)throw Error("This room no longer exists");
    const draft=sampleActivities();activityList=draft.activities;
    const roundNumber=Number((state.round||"").slice(1));
    if(!/^r\d+$/.test(state.round||"")||!Number.isSafeInteger(roundNumber))throw Error("Invalid round state");
    if(roundNumber>activityList.length)throw Error("The current draft has fewer questions than this room. Restore the original draft before resuming.");
    if(roundNumber>0){
      const previous=activityList[roundNumber-1];
      if(previous.question!==state.question||JSON.stringify(previous.options)!==JSON.stringify(state.options))throw Error("The activity draft has changed since this room was created. Restore the same draft to resume safely.");
    }
    room=target;current=roundNumber;rememberRoom(room,me);trainerRoom();
  }catch(error){note("Cannot resume room: "+error.message);}
}
function trainerRoom(){
  cleanup();
  const link=new URL("./live.html",location.href);link.searchParams.set("room",room);
  const projectorLink=new URL("./projector.html",location.href);projectorLink.searchParams.set("room",room);
  show('<h2>Trainer Room</h2><p>Room: <code>'+esc(room)+'</code></p><div class="field"><label>One participation link (share as QR if desired)</label><input id="link" readonly value="'+esc(link.href)+'"></div><div id="qr" style="margin:12px 0"></div><p><a href="'+esc(projectorLink.href)+'" target="_blank" rel="noopener">Open secured projector on another device</a> (trainer sign-in required)</p><p class="note">Do not use this for live training until Firebase rules are installed and audited. Avoid real employee IDs during initial tests.</p><div class="actions"><button id="open" class="btn green">Start Next Question</button><button id="close" class="btn secondary">Close Question</button><button id="complete" class="btn danger">Complete Pilot</button></div><h3 id="phase"></h3><p id="question"></p><h3>Answer counts (trainer only)</h3><div id="counts"></div><p id="notice" class="note"></p>');
  if(typeof QRCode!=="undefined")new QRCode(document.getElementById("qr"),{text:link.href,width:180,height:180});
  const pre="arenaV1/rooms/"+room;
  listen(pre+"/public",snap=>{publicState=snap.val();if(!publicState)return;
    document.getElementById("phase").textContent=publicState.status+" • round "+publicState.round;
    document.getElementById("question").textContent=publicState.question;
    document.getElementById("open").disabled=publicState.status==="question"||publicState.status==="completed"||current>=activityList.length;
    document.getElementById("close").disabled=publicState.status!=="question";
    if(/^r[1-9]\d*$/.test(publicState.round||""))countRound(publicState.round,publicState.options||[]);
  });
  document.getElementById("open").onclick=async()=>{
    try{
      if(publicState?.status==="question")throw Error("Close current question first");
      if(current>=activityList.length)throw Error("No more draft activities");
      const a=activityList[current],round='r'+(current+1);
      const next={title:publicState.title,status:"question",round,question:a.question,options:a.options,deadline:Date.now()+offset+a.timer*1000,joinOpen:publicState.joinOpen};
      await db.ref(pre+"/public").set(next);
      current++;
    }catch(e){note(e.message);}
  };
  document.getElementById("close").onclick=async()=>{try{await db.ref(pre+"/public/status").set("between");}catch(e){note(e.message);}};
  document.getElementById("complete").onclick=async()=>{
    if(!confirm("Mark pilot room Completed? This does not score any trainee."))return;
    try{await db.ref(pre+"/public").update({status:"completed",joinOpen:false});}catch(e){note(e.message);}
  };
}
let countedRound="";
function countRound(round,options){
  if(countedRound===room+"/"+round)return;
  const previous=countedRound;countedRound=room+"/"+round;
  if(previous){const priorRef=db.ref("arenaV1/answers/"+previous);priorRef.off("value");}
  const ref="arenaV1/answers/"+room+"/"+round;
  listen(ref,snap=>{
    const answerRecords=snap.val()||{};
    const counts=options.map(()=>0);
    for(const item of Object.values(answerRecords))if(Number.isInteger(item?.choice)&&counts[item.choice]!==undefined)counts[item.choice]++;
    document.getElementById("counts").textContent=counts.map((n,i)=>options[i]+": "+n).join(" | ");
  });
}
function participantHome(){
  cleanup();
  const path="arenaV1/participants/"+room+"/"+me;
  db.ref(path).once("value").then(s=>{
    if(s.exists())return watchRoom();
    show('<h2>Join Training Arena</h2><form class="fields" id="registration"><div class="field"><label>Your name</label><input id="name" minlength="2" maxlength="60" required></div><div class="field"><label>Employee ID</label><input id="employeeId" required minlength="2" maxlength="20" placeholder="Use test IDs until approved"></div><button class="btn">Join Pilot</button></form><p class="note">Employee ID is a unique claimed identifier, not proof of employment. Use test IDs only in this stage.</p><p id="notice" class="note"></p>');
    document.getElementById("registration").onsubmit=async e=>{
      e.preventDefault();
      const name=document.getElementById("name").value.trim();
      const emp=document.getElementById("employeeId").value.trim().toUpperCase().replace(/[^A-Z0-9_-]/g,"");
      if(name.length<2||!/^[A-Z0-9_-]{2,20}$/.test(emp)){note("Invalid name or test employee ID");return;}
      try{
        // Record the round active at admission; anyone joining during a question
        // must wait until the following round. The matching security rule
        // requires the server's current round to equal this claimed round.
        const status=await db.ref("arenaV1/rooms/"+room+"/public").once("value");
        const admittedRound=status.child("round").val();
        if(status.child("status").val()==="completed"||status.child("joinOpen").val()!==true)throw Error("Joining is closed");
        if(!/^r[0-9]+$/.test(admittedRound||""))throw Error("Round not ready");
        const claim=db.ref("arenaV1/claims/"+room+"/"+emp);
        const result=await claim.transaction(current=>current===null?me:undefined,undefined,false);
        if(!result.committed)throw Error("Employee ID already claimed");
        try{await db.ref(path).set({name,employeeId:emp,joinedRound:admittedRound});}
        catch(err){note("Registration incomplete; ask trainer. Claim remains reserved for safety: "+err.message);return;}
        watchRoom();
      }catch(err){note(err.message);}
    };
  }).catch(err=>{show('<p>'+esc(err.message)+'</p>');});
}
function watchRoom(){
  cleanup();
  show('<h2>MTS Training Arena</h2><h3 id="roomtitle"></h3><p id="phase"></p><div class="arena-timer" role="timer" aria-live="off"><span>TIME LEFT</span><strong id="roundCountdown">--</strong></div><div class="panel" style="background:#ecf6fc"><h2 id="question"></h2><div id="choices" class="grid"></div></div><p id="notice" class="note">Connected. Waiting for trainer.</p>');
  const updateCountdown=()=>{const target=document.getElementById("roundCountdown");if(!target)return;const active=publicState?.status==="question"&&Number.isFinite(publicState.deadline);const remaining=active?Math.max(0,Math.ceil((publicState.deadline-(Date.now()+offset))/1000)):null;target.textContent=remaining===null?"--":remaining+"s";target.parentElement.classList.toggle("urgent",remaining!==null&&remaining<=10);if(remaining===0)document.querySelectorAll("#choices button").forEach(button=>button.disabled=true);};
  participantTimer=setInterval(updateCountdown,250);
  listen("arenaV1/rooms/"+room+"/public",s=>{
    const next=s.val();if(!next)return note("Room removed or unavailable");
    const changed=!publicState||publicState.round!==next.round||publicState.status!==next.status;
    publicState=next;
    updateCountdown();
    document.getElementById("roomtitle").textContent=next.title;
    document.getElementById("phase").textContent=next.status+" — round "+next.round;
    document.getElementById("question").textContent=next.question;
    if(changed){
      const choiceArea=document.getElementById("choices");choiceArea.innerHTML="";
      if(next.status==="question"){
        (next.options||[]).forEach((answer,i)=>{
          const button=document.createElement("button");button.className="btn secondary";button.textContent=answer;
          button.onclick=async()=>{
            if(button.disabled||next.status!=="question"||Date.now()+offset>=next.deadline){note("This round has already closed.");updateCountdown();return;}
            choiceArea.querySelectorAll("button").forEach(b=>b.disabled=true);
            try{
              await db.ref("arenaV1/answers/"+room+"/"+next.round+"/"+me).set({choice:i});
              note("Answer submitted; you cannot submit a second response.");
            }catch(error){
              note("Answer not accepted: "+error.message);
              choiceArea.querySelectorAll("button").forEach(b=>b.disabled=false);
            }
          };
          choiceArea.appendChild(button);
        });
        Promise.all([
          db.ref("arenaV1/answers/"+room+"/"+next.round+"/"+me).once("value"),
          db.ref("arenaV1/participants/"+room+"/"+me+"/joinedRound").once("value")
        ]).then(([prior,joined])=>{
          if(prior.exists()||joined.val()===next.round){
            choiceArea.querySelectorAll("button").forEach(b=>b.disabled=true);
            note(prior.exists()?"Your answer is already recorded.":"You joined during this round. Wait for the next question.");
          }
        }).catch(e=>note(e.message));
      }else note(next.status==="completed"?"Pilot completed. No scores were calculated.":"Waiting for next question.");
    }
  });
}
try{init()}catch(e){show("<h2>Cannot initialize pilot</h2><p>"+esc(e.message)+"</p>");}
