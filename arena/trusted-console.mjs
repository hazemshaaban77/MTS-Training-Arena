const el=id=>document.getElementById(id);
const TRUSTED_ENDPOINT="https://mts-training-arena-api.hazem-mts-arena.workers.dev";
let auth=null,roomId="",roundId="",signedIn=false,busy=false,serviceReady=false,phase="idle",renderedQRLink="";
const buttons=["create","open","close","settle"];
const setStatus=message=>{el("output").textContent=message;};
function serviceBanner(ready,description){
 el("serviceTitle").textContent=ready?"Secure backend ready":"Live scoring not activated";
 el("serviceDescription").textContent=description;
 el("serviceBanner").style.background=ready?"#e8f7ed":"#fff3df";
 el("serviceBanner").style.borderColor=ready?"#78b996":"#e5c184";
}
function render(){
 const enabled=signedIn&&!busy&&validService()&&serviceReady;
 el("create").disabled=!enabled;
 el("open").disabled=!enabled||!(phase==="lobby"||phase==="settled");
 el("close").disabled=!enabled||phase!=="question";
 el("settle").disabled=!enabled||phase!=="closed";
 const link=roomId?new URL("./live.html?room="+roomId,window.location.href).href:"";
 el("joinLink").value=link;el("copyJoin").disabled=!link;
 const qrSection=el("roomQRSection"),qrBox=el("roomQR"),fallback=el("qrFallback");
 qrSection.hidden=!link;
 if(link!==renderedQRLink){
  renderedQRLink=link;qrBox.replaceChildren();fallback.hidden=true;
  if(link&&typeof globalThis.QRCode==="function"){
   new globalThis.QRCode(qrBox,{text:link,width:208,height:208,correctLevel:globalThis.QRCode.CorrectLevel.M});
  }else if(link){fallback.hidden=false;}
 }
 el("projectorLink").href=roomId?"./projector.html?room="+encodeURIComponent(roomId):"./projector.html";
 const labels={idle:"Create a room to begin.",lobby:"Lobby ready — trainees join using one link.",question:"Question active — close after the deadline.",closed:"Round closed — settle its scores before advancing.",settled:"Scores published — next activity is ready."};
 el("phaseStatus").textContent=labels[phase]||"Check room status.";
 el("room").value=roomId;el("round").value=roundId;
 if(signedIn)el("authStatus").textContent="Signed in as "+auth.currentUser.email;
}
function validService(){
 try{const u=new URL(TRUSTED_ENDPOINT);return u.protocol==="https:"&&u.origin===TRUSTED_ENDPOINT&&!u.username&&!u.password;}catch{return false;}
}
async function api(path,payload){
 if(!signedIn||!validService())throw Error("Sign in and provide the HTTPS backend origin");
 const token=await auth.currentUser.getIdToken();
 const response=await fetch(TRUSTED_ENDPOINT+path,{
  method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},body:JSON.stringify(payload)
 });
 let result;try{result=await response.json();}catch{throw Error("Backend returned invalid JSON");}
 if(!response.ok)throw Error(result.error||"Request rejected");
 return result;
}
async function task(fn){
 if(busy)return;busy=true;render();setStatus("Working…");
 try{const result=await fn();setStatus(JSON.stringify(result,null,2));}
 catch(error){setStatus("Error: "+error.message);}
 finally{busy=false;render();}
}

const LIVE_TYPES=new Set(["Quiz","Dropdown","Live Poll"]);
let currentDraft=null,preparedActivities=[],preparedIndex=-1;
function activatePrepared(index){
 if(!Number.isInteger(index)||index<0||index>=preparedActivities.length)return;
 const a=preparedActivities[index];preparedIndex=index;
 el("draftActivity").value=String(a.index);
 el("kind").value=a.type;el("question").value=a.question;el("options").value=a.options.join("\n");
 el("correct").value=String(a.type==="Live Poll"?1:a.correct+1);el("seconds").value=String(a.timer||30);
 el("draftProgress").textContent="Prepared activity "+(index+1)+" of "+preparedActivities.length+" — "+a.type;
}
function nextPrepared(){
 if(!preparedActivities.length)return;
 const next=preparedIndex+1;
 if(next<preparedActivities.length){activatePrepared(next);setStatus("Next activity is ready for review; press Open Question to launch.");}
 else el("draftProgress").textContent="All prepared supported activities are complete.";
}
function loadStudioDrafts(){
 let sessions=[];
 try{const state=JSON.parse(localStorage.getItem("mts-arena-preview-v1")||"{}");if(Array.isArray(state.sessions))sessions=state.sessions;}catch{}
 const picker=el("draftSession"),activityPicker=el("draftActivity");
 if(!picker||!activityPicker)return;
 const reset=()=>activityPicker.replaceChildren(new Option("Manual entry",""));
 sessions.forEach((s,i)=>{if(s&&typeof s.name==="string"&&Array.isArray(s.activities))picker.add(new Option(s.name,String(i)));});
 picker.onchange=()=>{
  reset();preparedActivities=[];preparedIndex=-1;
  currentDraft=picker.value===""?null:sessions[Number(picker.value)];
  if(!currentDraft){el("draftProgress").textContent="Choose a saved session to prepare activities.";return;}
  el("title").value=currentDraft.name.slice(0,120);
  currentDraft.activities.forEach((a,i)=>{
   if(a&&LIVE_TYPES.has(a.type)&&Array.isArray(a.options)&&a.options.length>=2&&typeof a.question==="string"&&a.question.trim()&&a.options.every(v=>typeof v==="string")&&Number.isInteger(a.timer)&&a.timer>=5&&a.timer<=300&&(a.type==="Live Poll"||Number.isInteger(a.correct)&&a.correct>=0&&a.correct<a.options.length)){
    preparedActivities.push({...a,index:i});
    activityPicker.add(new Option((i+1)+". "+a.type+" — "+a.question.slice(0,60),String(i)));
   }
  });
  if(preparedActivities.length)activatePrepared(0);
  else el("draftProgress").textContent="No compatible scored-live activities in this session.";
 };
 activityPicker.onchange=()=>{
  const i=preparedActivities.findIndex(a=>String(a.index)===activityPicker.value);
  if(i>=0){activatePrepared(i);setStatus("Studio activity loaded for manual review.");}
 };
 const requested=new URLSearchParams(location.search).get("session");
 if(requested){const index=sessions.findIndex(s=>s?.id===requested);if(index>=0){picker.value=String(index);picker.onchange();}}
}

try{
 loadStudioDrafts();
 if(typeof FB_CONFIG==="undefined")throw Error("Firebase configuration unavailable");
 const app=firebase.initializeApp(FB_CONFIG,"mts-arena-trusted-console");
 auth=app.auth();
 el("api").value=TRUSTED_ENDPOINT||"Not configured — backend not deployed";
 el("api").readOnly=true;
 el("signin").disabled=true;
 fetch(TRUSTED_ENDPOINT+"/health",{cache:"no-store"}).then(async response=>{
  if(!response.ok)throw Error("Service health check failed");
  const status=await response.json();
  serviceReady=status.ready===true;
  el("signin").disabled=!serviceReady;
  el("authStatus").textContent=serviceReady?"Backend ready for trainer sign-in":"Sign-in intentionally locked — no need to enter credentials.";
  serviceBanner(serviceReady,serviceReady?"Authenticated operations are available to permitted trainers.":"Cloudflare service is in safe-preview mode. You can use Arena Studio, the activity demos and simulator now. Live scoring stays locked until Firebase security is ready.");
  render();
 }).catch(error=>{
  serviceReady=false;
  el("authStatus").textContent="Secure backend unavailable; sign-in remains locked.";
  serviceBanner(false,"The backend health check could not be completed. Studio and offline demos remain available.");
  render();
 });
 el("signin").onclick=()=>task(async()=>{
  const email=el("email").value.trim(),password=el("password").value;
  if(!email||!password)throw Error("Enter trainer credentials");
  await auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
  const credential=await auth.signInWithEmailAndPassword(email,password);
  signedIn=!!credential.user;return {signedIn:true,email:credential.user.email};
 });

 el("copyJoin").onclick=async()=>{try{await navigator.clipboard.writeText(el("joinLink").value);setStatus("Trainee link copied. One link works for all activities in this session.");}catch{el("joinLink").select();setStatus("Copy the selected link.");}};
 el("create").onclick=()=>task(async()=>{
  const result=await api("/v1/rooms/create",{title:el("title").value.trim()});
  roomId=result.roomId;roundId="";phase="lobby";render();return result;
 });
 el("open").onclick=()=>task(async()=>{
  if(!roomId)throw Error("Create a room first");
  const kind=el("kind").value,options=el("options").value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  const activity={kind,question:el("question").value.trim(),options,durationSeconds:Number(el("seconds").value)};
  if(kind!=="Live Poll")activity.correctIndex=Number(el("correct").value)-1;
  const result=await api("/v1/rounds/open",{roomId,activity});
  roundId=result.roundId;phase="question";render();return result;
 });
 el("close").onclick=()=>task(async()=>{
  if(!roomId)throw Error("Create a room first");
  const result=await api("/v1/rounds/close",{roomId});phase="closed";render();return result;
 });
 el("settle").onclick=()=>task(async()=>{
  if(!roomId||!roundId)throw Error("Open and close a round first");
  const result=await api("/v1/settle",{roomId,roundId});phase="settled";render();nextPrepared();return result;
 });
 render();
}catch(error){setStatus("Setup error: "+error.message);serviceBanner(false,"Firebase client configuration is unavailable. Offline demos remain accessible.");el("signin").disabled=true;}
