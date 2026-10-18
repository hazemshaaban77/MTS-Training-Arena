// Extends the upstream Arena Firebase verifier for the Sites backend.
// Uses only public Google signing keys. No admin key and no Firebase writes.
const decoder=new TextDecoder();
// Safe diagnostic metadata. Never log ID tokens, passwords, Firebase URLs or credentials.
function upstreamUnavailable(stage){const error=new Error('AUTH_NETWORK');error.stage=stage;return error;}
function bytes(value){if(!/^[A-Za-z0-9_-]+$/.test(value))throw Error('INVALID_TOKEN');return Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(value.length/4)*4,'=')),c=>c.charCodeAt(0));}
export function createFirebaseVerifier({fetcher=globalThis.fetch,now=()=>Date.now()}={}){
 let keys=[],expires=0;
 async function keyset(force=false){
  if(!force&&keys.length&&now()<expires)return keys;
  let r;try{r=await fetcher('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',{signal:AbortSignal.timeout(10000),redirect:'error'});}catch{throw upstreamUnavailable('google_keys_fetch');}
  if(!r.ok)throw upstreamUnavailable('google_keys_http');let body;try{body=await r.json();}catch{throw upstreamUnavailable('google_keys_parse');}if(!Array.isArray(body.keys))throw upstreamUnavailable('google_keys_format');
  const age=Number(/(?:^|,)\s*max-age=(\d+)/i.exec(r.headers.get('Cache-Control')||'')?.[1]??300);
  keys=body.keys;expires=now()+Math.min(age,86400)*1000;return keys;
 }
 return async function verify(token,projectId){
  if(typeof token!=='string'||token.length>8192)throw Error('INVALID_TOKEN');
  const parts=token.split('.');if(parts.length!==3)throw Error('INVALID_TOKEN');let h,p;
  try{h=JSON.parse(decoder.decode(bytes(parts[0])));p=JSON.parse(decoder.decode(bytes(parts[1])));}catch{throw Error('INVALID_TOKEN');}
  const seconds=Math.floor(now()/1000),timestamp=n=>Number.isSafeInteger(n)&&n>=0;
  if(h.alg!=='RS256'||typeof h.kid!=='string'||!h.kid||h.kid.length>256)throw Error('INVALID_TOKEN');
  if(p.aud!==projectId||p.iss!=='https://securetoken.google.com/'+projectId||typeof p.sub!=='string'||!p.sub||p.sub.length>128||!timestamp(p.exp)||p.exp<=seconds||!timestamp(p.iat)||p.iat>seconds||!timestamp(p.auth_time)||p.auth_time>seconds||p.auth_time>p.iat||typeof p.email!=='string'||!p.email||p.firebase?.sign_in_provider==='anonymous')throw Error('INVALID_TOKEN');
  let list=await keyset(),jwk=list.find(k=>k.kid===h.kid);if(!jwk){list=await keyset(true);jwk=list.find(k=>k.kid===h.kid);}if(!jwk||jwk.kty!=='RSA')throw Error('INVALID_TOKEN');
  let valid=false;try{const publicKey=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);valid=await crypto.subtle.verify('RSASSA-PKCS1-v1_5',publicKey,bytes(parts[2]),new TextEncoder().encode(parts[0]+'.'+parts[1]));}catch{throw Error('INVALID_TOKEN');}
  if(!valid)throw Error('INVALID_TOKEN');return {uid:p.sub,email:p.email,name:typeof p.name==='string'?p.name:p.email,expires:p.exp,arenaRole:['admin','senior'].includes(p.arenaRole)?p.arenaRole:'trainer'};
 };
}
const verify=createFirebaseVerifier();
export async function authorizeFirebaseTrainer(req,{projectId='',databaseURL='',fetcher=globalThis.fetch,verifier=verify}={}){
 const token=req.headers.get('X-Firebase-Token');if(!token)throw Error('SIGN_IN');
 const user=await verifier(token,projectId);
 const url=new URL(databaseURL);if(url.protocol!=='https:'||!url.hostname.endsWith('.firebasedatabase.app')&&!url.hostname.endsWith('.firebaseio.com'))throw Error('FIREBASE_CONFIG');
 url.pathname='/arenaV1/trainerAllowlist/'+encodeURIComponent(user.uid)+'.json';url.searchParams.set('auth',token);
 let response;try{response=await fetcher(url.toString(),{method:'GET',redirect:'error',signal:AbortSignal.timeout(10000),headers:{'Cache-Control':'no-cache'}});}catch{throw upstreamUnavailable('firebase_allowlist_fetch');}
 if(!response.ok){if([401,403].includes(response.status))throw Error('TRAINER_NOT_ALLOWED');throw upstreamUnavailable('firebase_allowlist_http');}
 if(await response.json()!==true)throw Error('TRAINER_NOT_ALLOWED');return {...user,owner:'firebase:'+user.uid};
}
