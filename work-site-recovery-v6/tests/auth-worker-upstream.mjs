// Offline fixtures only. This Worker is never built into the application.
let fixture={},counts;
function reset(){counts={keys:0,allowlist:0,redirects:0,authPresent:false};}
reset();
function response(body,status=200){return new Response(body,{status,headers:status===302?{Location:'https://redirect.invalid/'}:{'Content-Type':'application/json','Cache-Control':'max-age=3600'}});}
export default {async fetch(req){
 const url=new URL(req.url);
 if(url.hostname==='fixtures.invalid'){
  if(url.pathname==='/setup'){fixture=await req.json();reset();return new Response('ok');}
  return Response.json(counts);
 }
 if(url.hostname==='redirect.invalid'){counts.redirects++;return new Response('Redirect followed unexpectedly',{status:500});}
 if(url.hostname==='www.googleapis.com'){counts.keys++;return response(fixture.keysBody??JSON.stringify({keys:[fixture.jwk]}),fixture.keysStatus??200);}
 if(url.hostname.endsWith('.firebasedatabase.app')){
  counts.allowlist++;counts.authPresent=!!url.searchParams.get('auth');
  return response(fixture.allowlistBody??JSON.stringify(fixture.allowed??true),fixture.allowlistStatus??200);
 }
 if(url.hostname==='oauth2.googleapis.com')return Response.json({access_token:'offline-fixture-access-token'});
 if(url.hostname==='identitytoolkit.googleapis.com')return Response.json({localId:'worker-fixture-created'});
 throw Error('Unexpected upstream');
}};
