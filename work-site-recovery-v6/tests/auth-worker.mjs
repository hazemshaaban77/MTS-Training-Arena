// Runs in workerd, not Node. All outbound requests go to an isolated fixture Worker.
import {createFirebaseVerifier,authorizeFirebaseTrainer} from '../lib/firebase-verifier.mjs';
import {handleArenaRequest} from '../lib/api-handler';
import {createProvisioner} from '../lib/firebase-admin';
const projectId='mts-quiz-64faa',databaseURL='https://mts-quiz-64faa-default-rtdb.europe-west1.firebasedatabase.app';
const enc=new TextEncoder(),b64=value=>btoa(String.fromCharCode(...new Uint8Array(value))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
const json=value=>b64(enc.encode(JSON.stringify(value)));
function assert(ok,message){if(!ok)throw Error(message);}
async function rejects(fn,message,stage){try{await fn();}catch(e){assert(e.message===message&&(!stage||e.stage===stage),'Expected '+message+' / '+stage+', got '+e.message+' / '+e.stage);return;}throw Error('Expected rejection');}
export default {async test(){
 const pair=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
 const jwk={...await crypto.subtle.exportKey('jwk',pair.publicKey),kid:'worker-fixture-key',alg:'RS256',use:'sig'};
 async function setup(options={}){const r=await fetch('https://fixtures.invalid/setup',{method:'POST',body:JSON.stringify({jwk,...options})});await r.text();}
 const stats=async()=>await (await fetch('https://fixtures.invalid/stats')).json();
 const seconds=Math.floor(Date.now()/1000),message=json({alg:'RS256',kid:jwk.kid})+'.'+json({aud:projectId,iss:'https://securetoken.google.com/'+projectId,sub:'worker-fixture-trainer',email:'trainer@example.invalid',iat:seconds,auth_time:seconds,exp:seconds+3600,firebase:{sign_in_provider:'password'}});
 const token=message+'.'+b64(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',pair.privateKey,enc.encode(message)));
 const req=()=>new Request('https://arena.invalid/api/me',{headers:{'X-Firebase-Token':token}});
 const authorize=()=>authorizeFirebaseTrainer(req(),{projectId,databaseURL,verifier:createFirebaseVerifier()});
 await setup();
 const user=await authorize();assert(user.owner==='firebase:worker-fixture-trainer','Real runtime must verify signature and allowlist');
 let counts=await stats();assert(counts.keys===1&&counts.allowlist===1&&counts.authPresent,'Both upstream dependencies must be reached');
 const me=await handleArenaRequest(req());assert(me.status===200&&(await me.json()).authenticated===true,'Verified trainer must reach /api/me');
 const altered=token.slice(0,-6)+'AAAAAA';await rejects(()=>createFirebaseVerifier()(altered,projectId),'INVALID_TOKEN');
 for(const [options,expected,stage] of [
  [{keysStatus:302},'AUTH_NETWORK','google_keys_http'],
  [{keysBody:'broken'},'AUTH_NETWORK','google_keys_parse'],
  [{keysBody:'{}'},'AUTH_NETWORK','google_keys_format'],
  [{allowed:false},'TRAINER_NOT_ALLOWED'],
  [{allowlistStatus:403},'TRAINER_NOT_ALLOWED'],
  [{allowlistStatus:302},'AUTH_NETWORK','firebase_allowlist_http'],
  [{allowlistBody:'broken'},'AUTH_NETWORK','firebase_allowlist_parse']
 ]){await setup(options);await rejects(authorize,expected,stage);assert((await stats()).redirects===0,'Redirects must never forward credentials');}
 await setup();
 const pkcs8=b64(await crypto.subtle.exportKey('pkcs8',pair.privateKey)).replaceAll('-','+').replaceAll('_','/');
 const privateKey='-----BEGIN PRIVATE KEY-----\n'+pkcs8+'='.repeat((4-pkcs8.length%4)%4)+'\n-----END PRIVATE KEY-----';
 const provision=createProvisioner(JSON.stringify({project_id:projectId,client_email:'fixture@example.invalid',private_key:privateKey}));
 assert(!!provision,'Fixture provisioner should initialize');
 assert((await provision({name:'Fixture',email:'fixture@example.invalid',password:'not-a-real-account'})).uid==='worker-fixture-created','Optional provisioning must use runtime-compatible redirect policy');
 console.log('Workers auth: RS256, both upstreams, /api/me, redirect rejection, diagnostic stages and optional provisioning passed (isolated fixtures only).');
}};
