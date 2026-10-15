/* Trainer-authorized, read-only room projection; no scoring or private results. */
const target=document.getElementById("projector");
const params=new URLSearchParams(location.search);
const escapeHtml=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const roomFromLink=params.get("room")||"";
let firebaseApp,auth,db,offset=0,ref=null,scoreRef=null,timer=null,current=null,roomId="",scoreboard=null;
function notice(text){const e=document.getElementById("message");if(e)e.textContent=text;}
function mount(){
  if(typeof FB_CONFIG==="undefined"||!FB_CONFIG?.projectId||!FB_CONFIG?.databaseURL){target.textContent="Firebase is not configured for this pilot.";return;}
  firebaseApp=firebase.initializeApp(FB_CONFIG,"mts-arena-projector-pilot");
  auth=firebaseApp.auth();db=firebaseApp.database();
  target.innerHTML='<div class="panel" style="max-width:420px;margin:10vh auto;color:#20314a"><h2>Secure Projector Sign In</h2><p class="note">Only authorized Arena trainers can display a room. There is no public audience link yet.</p><form id="signin" class="fields"><div class="field"><label>Email</label><input type="email" id="email" required autocomplete="email"></div><div class="field"><label>Password</label><input type="password" id="password" required autocomplete="current-password"></div><div class="field"><label>Room code</label><input id="room" required maxlength="24" value="'+escapeHtml(roomFromLink)+'"></div><button class="btn">Open projector</button></form><p class="note" id="message"></p></div>';
  document.getElementById("signin").onsubmit=async e=>{
    e.preventDefault();
    const candidate=document.getElementById("room").value.toLowerCase().trim();
    if(!/^[a-f0-9]{24}$/.test(candidate)){notice("Invalid room code");return;}
    try{
      await auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
      const {user}=await auth.signInWithEmailAndPassword(document.getElementById("email").value,document.getElementById("password").value);
      const allow=await db.ref("arenaV1/trainerAllowlist/"+user.uid).once("value");
      if(allow.val()!==true){await auth.signOut();throw Error("Not authorized for projector access");}
      roomId=candidate;
      db.ref(".info/serverTimeOffset").on("value",s=>offset=s.val()||0);
      start();
    }catch(error){notice(error.message);}
  };
}
function stop(){if(ref)ref.off();ref=null;if(scoreRef)scoreRef.off();scoreRef=null;if(timer)clearInterval(timer);timer=null;scoreboard=null;}
function start(){
  stop();
  target.innerHTML='<div class="stage" style="min-height:calc(100vh - 30px);max-width:1500px;margin:auto"><div class="logos"><img src="../mts.png" alt="MTS" style="max-width:110px;max-height:56px;object-fit:contain"><img src="../training.png" alt="Training Team" style="max-width:110px;max-height:56px;object-fit:contain"></div><div><p style="color:#63e0af">MTS TRAINING ARENA · PROJECTOR PILOT</p><h2 id="title">Awaiting room…</h2><h1 id="question" style="font-size:clamp(22px,4vw,56px)">Ready</h1><p id="phase" class="pill">LOBBY</p></div><div id="choices" class="answers"></div><section id="standings" aria-live="polite" style="display:none;margin:20px auto;max-width:700px"></section><div><strong id="clock" style="font-size:32px"></strong><p class="note" style="color:#b9cfe1">Answer keys are never displayed. Verified standings appear only after a round is settled.</p><p id="message" style="color:#e2afaf"></p></div></div>';
  ref=db.ref("arenaV1/rooms/"+roomId+"/public");
  ref.on("value",snapshot=>{
    current=snapshot.val();
    if(!current){notice("Room not found or access denied.");return;}
    document.getElementById("title").textContent=current.title||"MTS Training Arena";
    document.getElementById("question").textContent=current.question||"";
    document.getElementById("phase").textContent=(current.status||"").toUpperCase()+" · "+current.round;
    const choices=document.getElementById("choices");
    choices.replaceChildren();
    if(current.status==="question"){
      for(const opt of current.options||[]){
        const card=document.createElement("div");
        card.textContent=opt;
        choices.appendChild(card);
      }
    }
    updateClock();
    renderStandings();
  },error=>notice(error.message));
  scoreRef=db.ref("arenaV1/scoreboards/"+roomId);
  scoreRef.on("value",snapshot=>{scoreboard=snapshot.val();renderStandings();},error=>notice(error.message));
  timer=setInterval(updateClock,250);
}
function renderStandings(){
 const section=document.getElementById("standings");if(!section)return;
 section.replaceChildren();
 const roundNumber=Number(String(current?.round||"").slice(1));
 if(!current||current.status!=="between"||!Number.isInteger(roundNumber)||!scoreboard||scoreboard.settledRounds<roundNumber||!Array.isArray(scoreboard.players)){
  section.style.display="none";return;
 }
 section.style.display="block";
 const heading=document.createElement("h2");heading.textContent="LEADERBOARD · TOP 5";section.appendChild(heading);
 const list=document.createElement("ol");list.style.cssText="list-style:none;padding:0;display:grid;gap:8px";
 for(const player of scoreboard.players.slice(0,5)){
  const item=document.createElement("li");
  item.style.cssText="display:flex;justify-content:space-between;gap:16px;padding:14px 20px;background:#122846;border-radius:12px;font-weight:bold;font-size:clamp(16px,2vw,26px)";
  const label=document.createElement("span");label.textContent="#"+player.rank+" · "+player.name;
  const points=document.createElement("span");points.textContent=String(player.score)+" pts";
  item.append(label,points);list.appendChild(item);
 }
 section.appendChild(list);
}
function updateClock(){
  const clock=document.getElementById("clock");if(!clock||!current)return;
  if(current.status!=="question"){clock.textContent="";return;}
  const left=Math.max(0,Math.ceil((current.deadline-Date.now()-offset)/1000));
  clock.textContent=left+"s";
}
try{mount();}catch(error){target.textContent="Projector pilot failed to initialize: "+error.message;}
window.addEventListener("pagehide",stop);
