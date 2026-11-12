// E2 only: Cloudflare Pages same-origin API gateway.
// The original worker and D1 remain isolated and authorization remains server-owned.
// The pinned bundle rewrite is a one-release compatibility bridge for the Nov 11
// frontend uploaded before same-origin gateway support. New builds use same-origin.
const PUBLIC_ORIGIN='https://mts-training-arena-e2-staging.pages.dev';
const UPSTREAM='https://mts-training-arena-e2-staging-api.hazem-mts-arena.workers.dev';
const LEGACY_BUNDLE='/assets/index-DEAvHJL2.js';
const LEGACY_ORIGIN=UPSTREAM;
const LEGACY_GUARD='mts-training-arena-e2-staging-api\\.[a-z0-9-]+\\.workers\\.dev';
const FIXED_GUARD='mts-training-arena-e2-staging\\.pages\\.dev';
// Temporary deployment safeguard for the already-uploaded 2026-11-11 bundle.
// Source itself removes the dashboard-wide 3D canvas and fixes sidebar stacking.
const DASHBOARD_LAYOUT_FIX='<style id="e2-dashboard-layout-fix">.arena-app:has(.workspace)>.arena-home-world{display:none!important}.arena-app:has(.workspace)>aside.sidebar{position:fixed!important;z-index:30!important}</style>';
function unavailable(){return Response.json({error:'E2_GATEWAY_ASSETS_MISMATCH'},{status:503,headers:{'cache-control':'no-store'}})}
function transformed(response,body,kind){
 const headers=new Headers(response.headers);
 headers.set('cache-control','no-store');
 headers.set('content-type',kind);
 for(const name of ['etag','content-length','content-encoding','last-modified'])headers.delete(name);
 return new Response(body,{status:response.status,statusText:response.statusText,headers});
}
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname.startsWith('/api/')){
   const origin=request.headers.get('Origin');
   if(origin&&origin!==PUBLIC_ORIGIN)return Response.json({error:'ORIGIN'},{status:403,headers:{'cache-control':'no-store'}});
   if(!env.API)return Response.json({error:'E2_GATEWAY_NOT_CONFIGURED'},{status:503});
   const upstream=new URL(UPSTREAM);
   upstream.pathname=url.pathname;
   upstream.search=url.search;
   try{return await env.API.fetch(new Request(upstream.toString(),request));}
   catch{return Response.json({error:'API_UNREACHABLE'},{status:503,headers:{'cache-control':'no-store'}});}
  }
  if(!env.ASSETS)return unavailable();
  if(url.pathname===LEGACY_BUNDLE){
   const response=await env.ASSETS.fetch(request);
   if(!response.ok)return response;
   const js=await response.text();
   if(js.split(LEGACY_ORIGIN).length!==2||js.split(LEGACY_GUARD).length!==2)return unavailable();
   const patched=js.replace(LEGACY_ORIGIN,PUBLIC_ORIGIN).replace(LEGACY_GUARD,FIXED_GUARD);
   return transformed(response,patched,'text/javascript; charset=utf-8');
  }
  if(url.pathname==='/'||url.pathname==='/index.html'){
   const response=await env.ASSETS.fetch(request);
   if(!response.ok)return response;
   const html=await response.text();
   const tag='src="'+LEGACY_BUNDLE+'"';
   if(!html.includes(tag))return response;
   if(html.split(tag).length!==2)return unavailable();
   if(!html.includes('</head>')||html.split('</head>').length!==2)return unavailable();
   const withAssetVersion=html.replace(tag,'src="'+LEGACY_BUNDLE+'?e2gw=20261111"');
   return transformed(response,withAssetVersion.replace('</head>',DASHBOARD_LAYOUT_FIX+'</head>'),'text/html; charset=utf-8');
  }
  return env.ASSETS.fetch(request);
 }
};