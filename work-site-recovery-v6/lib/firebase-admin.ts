// Optional server-only account provisioning. No credential is bundled in the client.
// Official REST contracts: docs.cloud.google.com/identity-platform/docs/reference/rest/v1/projects/accounts
// and firebase.google.com/docs/database/rest/auth .
import {firebaseConfig} from './firebase-config';
import {ApiError} from './service';
const enc=new TextEncoder(),b64=(bytes:Uint8Array)=>btoa(String.fromCharCode(...bytes)).replaceAll('=','').replaceAll('+','-').replaceAll('/','_');
export function createProvisioner(raw:unknown,fetcher=globalThis.fetch){
 if(typeof raw!=='string'||!raw.trim())return undefined;
 let account:any;try{account=JSON.parse(raw);}catch{return undefined;}
 if(account.project_id!==firebaseConfig.projectId||typeof account.private_key!=='string'||typeof account.client_email!=='string')return undefined;
 return async(input:any)=>{
  const seconds=Math.floor(Date.now()/1000),h=b64(enc.encode(JSON.stringify({alg:'RS256',typ:'JWT'}))),p=b64(enc.encode(JSON.stringify({iss:account.client_email,scope:'https://www.googleapis.com/auth/identitytoolkit https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email',aud:'https://oauth2.googleapis.com/token',iat:seconds,exp:seconds+3600}))),signing=h+'.'+p;
  const pem=Uint8Array.from(atob(account.private_key.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g,'')),c=>c.charCodeAt(0));
  const key=await crypto.subtle.importKey('pkcs8',pem,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']),signature=b64(new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',key,enc.encode(signing))));
  const auth=await fetcher('https://oauth2.googleapis.com/token',{method:'POST',redirect:'manual',signal:AbortSignal.timeout(10000),headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:signing+'.'+signature})});if(!auth.ok)throw new ApiError('ADMIN_SETUP',503);
  const token:any=await auth.json();if(!token.access_token)throw new ApiError('ADMIN_SETUP',503);
  const r=await fetcher(`https://identitytoolkit.googleapis.com/v1/projects/${firebaseConfig.projectId}/accounts?key=${firebaseConfig.apiKey}`,{method:'POST',redirect:'manual',signal:AbortSignal.timeout(10000),headers:{Authorization:'Bearer '+token.access_token,'Content-Type':'application/json'},body:JSON.stringify({email:input.email,password:input.password,displayName:input.name})});
  if(!r.ok)throw new ApiError(r.status===400?'ACCOUNT_EXISTS':'ADMIN_SETUP',r.status===400?409:503);const user:any=await r.json();
  const allowed=await fetcher(`${firebaseConfig.databaseURL}/arenaV1/trainerAllowlist/${encodeURIComponent(user.localId)}.json`,{method:'PUT',redirect:'manual',signal:AbortSignal.timeout(10000),headers:{Authorization:'Bearer '+token.access_token,'Content-Type':'application/json'},body:'true'});
  if(!allowed.ok)throw new ApiError('ACCOUNT_ALLOWLIST_INCOMPLETE',503);return {uid:user.localId};
 };
}
