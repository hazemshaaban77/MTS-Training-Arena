// Standalone Cloudflare Worker for the existing Version 6 D1-powered Arena backend.
// This code replaces only the Sites entrypoint; all game/service logic remains intact.
import {handleArenaRequest} from './lib/api-handler';
import {createProvisioner} from './lib/firebase-admin';
import {authorizeFirebaseTrainer} from './lib/firebase-verifier.mjs';
import {firebaseConfig} from './lib/firebase-config';
import {checkRate} from './lib/request-security';
export {ArenaLiveRoom} from './lib/arena-live-room';

type ArenaEnv = {
 DB?:D1Database;
 LIVE?:DurableObjectNamespace;
 MEDIA?:R2Bucket;
 ARENA_PUBLIC_ORIGIN?:string;
 ARENA_ADMIN_UIDS?:string;
 FIREBASE_SERVICE_ACCOUNT?:string;
};
const defaultOrigin='https://hazemshaaban77.github.io';
const allowedMethods='GET, POST, OPTIONS';
const allowedHeaders='Content-Type, X-Firebase-Token, X-Player-Token';
let authHealthCache:{until:number;result:{googleKeys:'reachable'|'unavailable';firebaseDatabase:'reachable'|'unavailable';appDatabase:'ready'|'unavailable'}}|undefined;
async function authHealth(db:D1Database|undefined){
 if(authHealthCache&&authHealthCache.until>Date.now())return authHealthCache.result;
 const keys='https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
 const url=new URL(firebaseConfig.databaseURL);
 url.pathname='/arenaV1/trainerAllowlist.json';
 url.searchParams.set('shallow','true');
 const statuses=await Promise.allSettled([
  fetch(keys,{redirect:'manual',signal:AbortSignal.timeout(5000)}),
  fetch(url.toString(),{redirect:'manual',signal:AbortSignal.timeout(5000)})
 ]);
 let ready=false;
 if(db)try{const record:any=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='sessions'").first();ready=record?.name==='sessions';}catch{}
 const result={
  googleKeys:statuses[0].status==='fulfilled'&&statuses[0].value.ok?'reachable':'unavailable',
  // 401/403 without a Firebase token is expected: it proves RTDB is reachable
  // while keeping the trainer allowlist private.
  firebaseDatabase:statuses[1].status==='fulfilled'&&[200,401,403].includes(statuses[1].value.status)?'reachable':'unavailable',
  appDatabase:ready?'ready':'unavailable'
 } as const;
 authHealthCache={until:Date.now()+60000,result};
 return result;
}
export default {
 async fetch(request:Request,env:ArenaEnv):Promise<Response>{
  const url=new URL(request.url);
  const origin=request.headers.get('Origin');
  // Must be an origin (no path) and match the exact configured trusted Pages site.
  const allowed=(env.ARENA_PUBLIC_ORIGIN||defaultOrigin).replace(/\/$/,'');
  if(origin&&origin!==allowed) return Response.json({error:'ORIGIN'},{status:403});
  const cors=new Headers({
    'Access-Control-Allow-Origin':allowed,
    'Access-Control-Allow-Methods':allowedMethods,
    'Access-Control-Allow-Headers':allowedHeaders,
    'Access-Control-Max-Age':'3600',
    'Vary':'Origin',
    'Cache-Control':'no-store',
    'X-Content-Type-Options':'nosniff'
  });
  if(request.method==='OPTIONS'){
   if(!origin) return Response.json({error:'ORIGIN'},{status:403});
   return new Response(null,{status:204,headers:cors});
  }
  // Small read-only health check verifies LIVE Durable Object binding and migration.
  if(url.pathname==='/api/live-health'&&request.method==='GET'){
   if(!env.LIVE)return Response.json({ready:false,transport:'fallback'},{status:503,headers:cors});
   try{
    const stub=env.LIVE.get(env.LIVE.idFromName('__health__'));
    const result=await stub.fetch('https://arena.internal/health');
    if(!result.ok)return Response.json({ready:false,transport:'fallback'},{status:503,headers:cors});
    return new Response(result.body,{status:200,headers:{...Object.fromEntries(cors),'Cache-Control':'public, max-age=60'}});
   }catch{return Response.json({ready:false,transport:'fallback'},{status:503,headers:cors});}
  }
  // WebSocket presence is public to a room code, but never carries identity or scores.
  // Request Origin must be the reviewed GitHub Pages origin (checked above).
  if(url.pathname==='/api/live'){
   if(request.method!=='GET'||request.headers.get('Upgrade')?.toLowerCase()!=='websocket')return Response.json({error:'UPGRADE_REQUIRED'},{status:426,headers:cors});
   const code=url.searchParams.get('code')||'';
   if(!/^\d{6}$/.test(code))return Response.json({error:'CODE'},{status:400,headers:cors});
   if(!env.DB||!env.LIVE)return Response.json({error:'LIVE_UNAVAILABLE'},{status:503,headers:cors});
   const existing=await env.DB.prepare('SELECT code FROM sessions WHERE code=?').bind(code).first();
   if(!existing)return Response.json({error:'NOT_FOUND'},{status:404,headers:cors});
   const obj=env.LIVE.get(env.LIVE.idFromName(code));
   return obj.fetch(new Request('https://arena.internal/ws',{headers:{Upgrade:'websocket'}}));
  }
  // Public, bounded diagnostic for upstream availability only; no identities or tokens.
  if(url.pathname==='/api/auth-health'){
   if(request.method!=='GET')return Response.json({error:'METHOD'},{status:405,headers:cors});
   const result=await authHealth(env.DB);
   return Response.json(result,{status:200,headers:{...Object.fromEntries(cors),'Cache-Control':'public, max-age=60'}});
  }
  // Authenticated media upload; no Firebase/Cloudflare credentials are ever sent to GitHub Pages.
  if(url.pathname==='/api/media-upload'){
    if(request.method!=='POST')return Response.json({error:'METHOD'},{status:405,headers:cors});
    if(!env.MEDIA)return Response.json({error:'MEDIA_UNAVAILABLE'},{status:503,headers:cors});
    if(!env.DB)return Response.json({error:'DATABASE'},{status:503,headers:cors});
    let trainer:any;
    try{trainer=await authorizeFirebaseTrainer(request,{projectId:firebaseConfig.projectId,databaseURL:firebaseConfig.databaseURL});}
    catch{return Response.json({error:'SIGN_IN'},{status:401,headers:cors});}
    try{await checkRate(env.DB,request);}catch{return Response.json({error:'RATE_LIMIT'},{status:429,headers:cors});}
    const mime=(request.headers.get('Content-Type')||'').split(';')[0].toLowerCase();
    const ext:Record<string,string>={'image/png':'png','image/jpeg':'jpg','image/webp':'webp','video/mp4':'mp4','video/webm':'webm'};
    if(!ext[mime])return Response.json({error:'MEDIA'},{status:415,headers:cors});
    if(Number(request.headers.get('Content-Length'))>12_000_000)return Response.json({error:'TOO_LARGE'},{status:413,headers:cors});
    let data:ArrayBuffer;
    try{data=await request.arrayBuffer();}catch{return Response.json({error:'MEDIA'},{status:400,headers:cors});}
    const bytes=new Uint8Array(data);
    if(bytes.length<12||bytes.length>12_000_000||!validMediaSignature(mime,bytes))return Response.json({error:'MEDIA'},{status:415,headers:cors});
    const key='uploads/'+crypto.randomUUID()+'.'+ext[mime];
    await env.MEDIA.put(key,data,{httpMetadata:{contentType:mime},customMetadata:{ownerUid:trainer.uid}});
    return Response.json({url:url.origin+'/media/'+key.slice('uploads/'.length),type:mime.startsWith('image/')?'image':'video'},{status:201,headers:cors});
  }
  // Unlisted media URL with 128-bit random identifier; no public bucket listing.
  if(url.pathname.startsWith('/media/')){
    if(request.method!=='GET'||!env.MEDIA)return Response.json({error:'NOT_FOUND'},{status:404,headers:cors});
    const file=url.pathname.slice('/media/'.length);
    if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(png|jpg|webp|mp4|webm)$/.test(file))return Response.json({error:'NOT_FOUND'},{status:404,headers:cors});
    const obj=await env.MEDIA.get('uploads/'+file);
    if(!obj)return Response.json({error:'NOT_FOUND'},{status:404,headers:cors});
    const mime=obj.httpMetadata?.contentType||'application/octet-stream';
    const headers=new Headers(cors);
    headers.set('Content-Type',mime);
    headers.set('Content-Disposition','inline');
    headers.set('Cache-Control','private, max-age=300');
    return new Response(obj.body,{status:200,headers});
  }
  if(!url.pathname.startsWith('/api/')){
   return Response.json({error:'NOT_FOUND'},{status:404,headers:cors});
  }
  if(!['GET','POST'].includes(request.method)){
   return Response.json({error:'METHOD'},{status:405,headers:cors});
  }
  const notifyFor:Record<string,string>={'/api/answer':'answer','/api/join':'joined','/api/recover':'joined','/api/control':'control','/api/interact':'interaction','/api/survey':'survey'};
  const kind=request.method==='POST'?notifyFor[url.pathname]:undefined;
  let bodyCode:string|null=null;
  if(kind&&env.LIVE){
   try{const payload:any=await request.clone().json();if(typeof payload.code==='string'&&/^\d{6}$/.test(payload.code))bodyCode=payload.code;}catch{}
  }
  const response=await handleArenaRequest(request,env.DB,undefined,{
   allowedOrigin:allowed,
   adminUids:env.ARENA_ADMIN_UIDS?.split(',').map(x=>x.trim()).filter(Boolean)||[],
   provision:createProvisioner(env.FIREBASE_SERVICE_ACCOUNT)
  });
  // The persisted D1 response is authoritative. Publish an invalidation only
  // after a successful mutation, without delaying the response if live fails.
  if(response.ok&&kind&&bodyCode&&env.LIVE){
   try{
    const stub=env.LIVE.get(env.LIVE.idFromName(bodyCode));
    await stub.fetch('https://arena.internal/notify',{method:'POST',body:JSON.stringify({kind})});
   }catch(e){console.warn('Live invalidation skipped',{kind});}
  }
  const headers=new Headers(response.headers);
  for(const [k,v] of cors)headers.set(k,v);
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
 }
};

function validMediaSignature(mime:string,b:Uint8Array):boolean{
 const ascii=(offset:number,length:number)=>String.fromCharCode(...b.slice(offset,offset+length));
 switch(mime){
  case 'image/png':return b[0]===137&&ascii(1,3)==='PNG'&&b[4]===13&&b[5]===10&&b[6]===26&&b[7]===10;
  case 'image/jpeg':return b[0]===255&&b[1]===216&&b[2]===255;
  case 'image/webp':return ascii(0,4)==='RIFF'&&ascii(8,4)==='WEBP';
  case 'video/mp4':return ascii(4,4)==='ftyp';
  case 'video/webm':return b[0]===0x1a&&b[1]===0x45&&b[2]===0xdf&&b[3]===0xa3;
  default:return false;
 }
}
