import {test} from 'node:test';
import assert from 'node:assert/strict';
import gateway from '../pages-e2-gateway/_worker.js';
const site='https://mts-training-arena-e2-staging.pages.dev';
function make({script='const api="https://mts-training-arena-e2-staging-api.hazem-mts-arena.workers.dev";const guard="mts-training-arena-e2-staging-api\\.[a-z0-9-]+\\.workers\\.dev";',assets=[]}={}){
 const calls=[];
 return {calls,env:{API:{fetch:async req=>{calls.push({url:req.url,method:req.method,origin:req.headers.get('Origin'),header:req.headers.get('X-Firebase-Token'),upgrade:req.headers.get('Upgrade')});return Response.json({ok:true});}},ASSETS:{fetch:async req=>{assets.push(req.url);return new Response(req.url.includes('/assets/index-DEAvHJL2.js')?script:'<html><script src="/assets/index-DEAvHJL2.js"></script></html>',{status:200,headers:{'content-type':'text/plain','etag':'old'}});}}}};
}
test('gateway keeps API auth headers and request method, proxy goes ONLY to E2 worker',async()=>{
 const x=make();
 const r=await gateway.fetch(new Request(site+'/api/me',{headers:{Origin:site,'X-Firebase-Token':'test-token'}}),x.env);
 assert.equal(r.status,200);
 assert.deepEqual(x.calls,[{url:'https://mts-training-arena-e2-staging-api.hazem-mts-arena.workers.dev/api/me',method:'GET',origin:site,header:'test-token',upgrade:null}]);
});
test('gateway proxies upgraded live stream and rejects cross-site origins',async()=>{
 const x=make();
 await gateway.fetch(new Request(site+'/api/live?code=123456',{headers:{Origin:site,Upgrade:'websocket'}}),x.env);
 assert.equal(x.calls[0].upgrade,'websocket');
 const blocked=await gateway.fetch(new Request(site+'/api/me',{headers:{Origin:'https://bad.example'}}),x.env);
 assert.equal(blocked.status,403);assert.equal(x.calls.length,1);
});
test('original published JS gets exactly two pinned replacements, and no-store',async()=>{
 const x=make(),r=await gateway.fetch(new Request(site+'/assets/index-DEAvHJL2.js'),x.env);
 assert.equal(r.status,200);const js=await r.text();
 assert.match(js,/https:\/\/mts-training-arena-e2-staging\.pages\.dev/);
 assert.ok(js.includes('mts-training-arena-e2-staging\\.pages\\.dev'));
 assert.ok(!js.includes('mts-training-arena-e2-staging-api.hazem-mts-arena.workers.dev'));
 assert.equal(r.headers.get('cache-control'),'no-store');
});
test('the HTML cache-busts the original JS and future assets remain intact',async()=>{
 const x=make();
 const r=await gateway.fetch(new Request(site+'/'),x.env);
 const html=await r.text();assert.match(html,/\?e2gw=20261111/);assert.match(html,/e2-dashboard-layout-fix/);assert.match(html,/aside\.sidebar\{position:fixed!important/);assert.equal(r.headers.get('etag'),null);
 const c=await gateway.fetch(new Request(site+'/favicon.svg'),x.env);
 assert.equal(c.status,200);
});
test('a different or previously changed bundle fails closed rather than serving broken JS',async()=>{
 const x=make({script:'unexpected'}),r=await gateway.fetch(new Request(site+'/assets/index-DEAvHJL2.js'),x.env);
 assert.equal(r.status,503);assert.equal((await r.json()).error,'E2_GATEWAY_ASSETS_MISMATCH');
});