const el=id=>document.getElementById(id);
let auth=null,roomId="",roundId="",signedIn=false,busy=false;
const buttons=["create","open","close","settle"];
const setStatus=message=>{el("output").textContent=message;};
function render(){
 buttons.forEach(id=>el(id).disabled=!signedIn||busy||!validService());
 el("room").value=roomId;el("round").value=roundId;
 el("authStatus").textContent=signedIn?"Signed in as "+auth.currentUser.email:"Not signed in";
}
function validService(){
 try{const u=new URL(el("api").value);return u.protocol==="https:"&&!u.username&&!u.password&&!u.pathname.replace(/\//g,"")&&!u.search&&!u.hash;}catch{return false;}
}
async function api(path,payload){
 if(!signedIn||!validService())throw Error("Sign in and provide the HTTPS backend origin");
 const token=await auth.currentUser.getIdToken();
 const response=await fetch(el("api").value.replace(/\/$/,"")+path,{
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
 el("signin").onclick=()=>task(async()=>{
  const email=el("email").value.trim(),password=el("password").value;
  if(!email||!password)throw Error("Enter trainer credentials");
  await auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
  const credential=await auth.signInWithEmailAndPassword(email,password);
  signedIn=!!credential.user;return {signedIn:true,email:credential.user.email};
 });
 el("api").oninput=render;
 el("create").onclick=()=>task(async()=>{
  const result=await api("/v1/rooms/create",{title:el("title").value.trim()});
  roomId=result.roomId;roundId="";return result;
 });
 el("open").onclick=()=>task(async()=>{
  if(!roomId)throw Error("Create a room first");
  const kind=el("kind").value,options=el("options").value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  const activity={kind,question:el("question").value.trim(),options,durationSeconds:Number(el("seconds").value)};
  if(kind!=="Live Poll")activity.correctIndex=Number(el("correct").value)-1;
  const result=await api("/v1/rounds/open",{roomId,activity});
  roundId=result.roundId;return result;
 });
 el("close").onclick=()=>task(async()=>{
  if(!roomId)throw Error("Create a room first");
  return api("/v1/rounds/close",{roomId});
 });
 el("settle").onclick=()=>task(async()=>{
  if(!roomId||!roundId)throw Error("Open and close a round first");
  return api("/v1/settle",{roomId,roundId});
 });
 render();
}catch(error){setStatus("Setup error: "+error.message);el("signin").disabled=true;}
