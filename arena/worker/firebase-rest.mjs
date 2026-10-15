/**
 * Minimal Firebase REST adapter for Cloudflare Workers.
 * Access restricted to server-side OAuth2 service-account token.
 * Server secrets must be configured as Worker secrets, never in Git.
 */
const enc=new TextEncoder();
const b64=value=>btoa(String.fromCharCode(...value)).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
const bytes=text=>enc.encode(text);
const base64json=obj=>b64(bytes(JSON.stringify(obj)));
function pemBytes(pem){
 const binary=atob(pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g,""));
 return Uint8Array.from(binary,c=>c.charCodeAt(0));
}
let cachedToken=null;
let pendingToken=null;
async function requestServiceToken(env,now){
 const key=await crypto.subtle.importKey("pkcs8",pemBytes(env.GOOGLE_PRIVATE_KEY),"RSASSA-PKCS1-v1_5",false,["sign"]);
 const h=base64json({alg:"RS256",typ:"JWT"});
 const p=base64json({iss:env.GOOGLE_CLIENT_EMAIL,scope:"https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email",aud:"https://oauth2.googleapis.com/token",iat:now,exp:now+3600});
 const input=h+"."+p;
 const signature=b64(new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5",key,bytes(input))));
 const response=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer",assertion:input+"."+signature})});
 if(!response.ok)throw Error("Firebase service authentication failed");
 const token=await response.json();
 if(!token.access_token)throw Error("Missing service OAuth token");
 return {token:token.access_token,expires:now+(token.expires_in||3600),email:env.GOOGLE_CLIENT_EMAIL};
}
async function serviceAccessToken(env){
 const now=Math.floor(Date.now()/1000);
 if(cachedToken?.email===env.GOOGLE_CLIENT_EMAIL&&cachedToken.expires>now+120)return cachedToken.token;
 // Worker environment bindings should be treated as read-only. Share one token
 // request across concurrent invocations in the same isolate.
 if(!pendingToken){
  pendingToken=requestServiceToken(env,now).then(value=>(cachedToken=value,value)).finally(()=>{pendingToken=null;});
 }
 const result=await pendingToken;
 return result.token;
}
export function firebaseRestDb(env){
 const root=new URL(env.FIREBASE_DATABASE_URL);
 if(root.protocol!=="https:")throw Error("Invalid Firebase database URL");
 const base=root.origin;
 async function request(path,method="GET",data,etag){
  if(!/^[a-zA-Z0-9_\/-]*$/.test(path)||path.includes(".."))throw Error("Invalid database path");
  const accessToken=await serviceAccessToken(env);
  const url=base+"/"+path+".json";
  const headers={"Cache-Control":"no-store","Authorization":"Bearer "+accessToken};
  if(method==="GET")headers["X-Firebase-ETag"]="true";
  if(method!=="GET")headers["Content-Type"]="application/json";
  if(etag!==undefined)headers["if-match"]=etag;
  const result=await fetch(url,{method,headers,body:data===undefined?undefined:JSON.stringify(data)});
  if(result.status===412)return {conflict:true};
  if(!result.ok)throw Error("Firebase request failed: "+result.status);
  return {value:await result.json(),etag:result.headers.get("ETag")};
 }
 const ref=path=>({
  async get(){const r=await request(path);return {val:()=>r.value}},
  async set(value){await request(path,"PUT",value)},
  async update(patch){await request(path,"PATCH",patch)},
  async transaction(updater,_callback,_applyLocally){
   for(let attempt=0;attempt<8;attempt++){
    const old=await request(path);
    const next=updater(old.value);
    if(next===undefined)return {committed:false,snapshot:{val:()=>old.value}};
    if(!old.etag)throw Error("Firebase ETag not returned");
    const result=await request(path,"PUT",next,old.etag);
    if(result.conflict)continue;
    return {committed:true,snapshot:{val:()=>next}};
   }
   throw Error("Firebase transaction exceeded retry limit");
  }
 });
 return {ref};
}
