// Standalone Cloudflare Worker for the existing Version 6 D1-powered Arena backend.
// This code replaces only the Sites entrypoint; all game/service logic remains intact.
import {handleArenaRequest} from './lib/api-handler';
import {createProvisioner} from './lib/firebase-admin';

type ArenaEnv = {
 DB?:D1Database;
 ARENA_PUBLIC_ORIGIN?:string;
 ARENA_ADMIN_UIDS?:string;
 FIREBASE_SERVICE_ACCOUNT?:string;
};
const defaultOrigin='https://hazemshaaban77.github.io';
const allowedMethods='GET, POST, OPTIONS';
const allowedHeaders='Content-Type, X-Firebase-Token, X-Player-Token';
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
  if(!url.pathname.startsWith('/api/')){
   return Response.json({error:'NOT_FOUND'},{status:404,headers:cors});
  }
  if(!['GET','POST'].includes(request.method)){
   return Response.json({error:'METHOD'},{status:405,headers:cors});
  }
  const response=await handleArenaRequest(request,env.DB,undefined,{
   allowedOrigin:allowed,
   adminUids:env.ARENA_ADMIN_UIDS?.split(',').map(x=>x.trim()).filter(Boolean)||[],
   provision:createProvisioner(env.FIREBASE_SERVICE_ACCOUNT)
  });
  const headers=new Headers(response.headers);
  for(const [k,v] of cors)headers.set(k,v);
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
 }
};
