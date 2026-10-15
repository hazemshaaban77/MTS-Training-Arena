const el=id=>document.getElementById(id);
const TRUSTED_ENDPOINT="https://mts-training-arena-api.hazem-mts-arena.workers.dev";
let auth=null,roomId="",roundId="",signedIn=false,busy=false,serviceReady=false,phase="idle";
const buttons=["create","open","close","settle"];
const setStatus=message=>{el("output").textContent=message;};
function render(){
 const enabled=signedIn&&!busy&&validService()&&serviceReady;
 el("create").disabled=!enabled;
 el("open").disabled=!enabled||!(phase==="lobby"||phase==="settled");
 el("close").disabled=!enabled||phase!=="question";
 el("settle").disabled=!enabled||phase!=="closed";
 const link=roomId?new URL("./live.html?room="+roomId,window.location.href).href:"";
 el("joinLink").value=link;el("copyJoin").disabled=!link;
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
try{
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
  el("authStatus").textContent=serviceReady?"Backend ready":"Backend connected in safe preview mode; scoring is not enabled";
  render();
 }).catch(error=>{el("authStatus").textContent="Cannot reach backend: "+error.message;});
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
  const result=await api("/v1/settle",{roomId,roundId});phase="settled";render();return result;
 });
 render();
}catch(error){setStatus("Setup error: "+error.message);el("signin").disabled=true;}
