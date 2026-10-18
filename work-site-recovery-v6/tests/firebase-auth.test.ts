import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {createFirebaseVerifier,authorizeFirebaseTrainer} from '../lib/firebase-verifier.mjs';
import {handleArenaRequest} from '../lib/api-handler';
import {service} from '../lib/service';
import {sample} from '../lib/catalog';
const projectId='mts-quiz-64faa',databaseURL='https://mts-quiz-64faa-default-rtdb.europe-west1.firebasedatabase.app',now=Date.now();
const pair=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
const pub={...await crypto.subtle.exportKey('jwk',pair.publicKey),kid:'test-key',alg:'RS256',use:'sig'};
const base64=(value:any)=>Buffer.from(typeof value==='string'?value:JSON.stringify(value)).toString('base64url');
async function token(overrides:any={},header:any={}){const seconds=Math.floor(now/1000),p={aud:projectId,iss:'https://securetoken.google.com/'+projectId,sub:'trainer-A',email:'trainer@example.test',name:'Trainer A',iat:seconds-1,auth_time:seconds-20,exp:seconds+3600,firebase:{sign_in_provider:'password'},...overrides},h={alg:'RS256',kid:'test-key',typ:'JWT',...header};const message=base64(h)+'.'+base64(p);return message+'.'+Buffer.from(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',pair.privateKey,new TextEncoder().encode(message))).toString('base64url');}
function verifier(){return createFirebaseVerifier({now:()=>now,fetcher:async(url:any)=>{assert.equal(String(url),'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com');return Response.json({keys:[pub]},{headers:{'Cache-Control':'max-age=3600'}});}});}
function db(){const sql=new DatabaseSync(':memory:');for(const e of JSON.parse(readFileSync('drizzle/meta/_journal.json','utf8')).entries)sql.exec(readFileSync('drizzle/'+e.tag+'.sql','utf8'));const database:any={sql,prepare(q:string){return {bind(...args:any[]){return {async run(){const r=sql.prepare(q).run(...args);return {meta:{changes:Number(r.changes)}}},async first(){return sql.prepare(q).get(...args)||null},async all(){return {results:sql.prepare(q).all(...args)}}}}}},async batch(statements:any[]){sql.exec('BEGIN');try{const result=[];for(const s of statements)result.push(await s.run());sql.exec('COMMIT');return result;}catch(e){sql.exec('ROLLBACK');throw e;}}};return database;}
function request(path:string,body?:any,t?:string,siteUser?:string,origin?:string){return new Request('https://arena.test/api/'+path,{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json'}:{}),...(t?{'X-Firebase-Token':t}:{}),...(siteUser?{'oai-authenticated-user-id':siteUser}:{}),...(origin?{Origin:origin}:{})},body:body?JSON.stringify(body):undefined});}
function authenticator(allow=true,status=200){const verify=verifier();return (req:Request)=>authorizeFirebaseTrainer(req,{projectId,databaseURL,verifier:verify,fetcher:async(input:any,init:any)=>{const u=new URL(String(input));assert.equal(u.hostname,new URL(databaseURL).hostname);assert.match(u.pathname,/^\/arenaV1\/trainerAllowlist\/trainer-[AB]\.json$/);assert.ok(u.searchParams.get('auth'));assert.equal(init.method,'GET');return Response.json(allow,{status});}});}
test('RS256 Firebase signature and all required claims are checked',async()=>{
 const verify=verifier(),t=await token();const user=await verify(t,projectId);assert.equal(user.uid,'trainer-A');assert.equal(user.email,'trainer@example.test');
 const parts=t.split('.');parts[2]=(parts[2][0]==='A'?'B':'A')+parts[2].slice(1);await assert.rejects(()=>verify(parts.join('.'),projectId),{message:'INVALID_TOKEN'});
 for(const p of [{aud:'other-project'},{iss:'https://attacker.test'},{exp:Math.floor(now/1000)-1},{iat:Math.floor(now/1000)+1},{auth_time:Math.floor(now/1000)+1},{auth_time:undefined},{sub:''},{email:''},{firebase:{sign_in_provider:'anonymous'}}])await assert.rejects(()=>token(p).then(t=>verify(t,projectId)),{message:'INVALID_TOKEN'});
 await assert.rejects(()=>token({}, {alg:'HS256'}).then(t=>verify(t,projectId)),{message:'INVALID_TOKEN'});
});
test('key rotation refreshes cached Google keys once for a new signing key',async()=>{
 let fetches=0;const second={...pub,kid:'rotated-key'};const verify=createFirebaseVerifier({now:()=>now,fetcher:async()=>{fetches++;return Response.json({keys:fetches===1?[pub]:[second]},{headers:{'Cache-Control':'max-age=3600'}});}});
 await verify(await token(),projectId);await verify(await token({}, {kid:'rotated-key'}),projectId);assert.equal(fetches,2);
});
test('real verified ID token plus existing trainer allowlist are both required',async()=>{
 const t=await token(),r=request('me',undefined,t);assert.equal((await authenticator()(r)).owner,'firebase:trainer-A');
 await assert.rejects(()=>authenticator()(request('me')),{message:'SIGN_IN'});
 await assert.rejects(()=>authenticator(false)(r),{message:'TRAINER_NOT_ALLOWED'});
 await assert.rejects(()=>authenticator(false,403)(r),{message:'TRAINER_NOT_ALLOWED'});
});
test('Sites identity alone never grants trainer API access',async()=>{
 const database=db(),auth=authenticator();const me=await handleArenaRequest(request('me',undefined,undefined,'site-owner'),database,auth);assert.deepEqual(await me.json(),{authenticated:false,provider:'firebase'});
 assert.equal((await handleArenaRequest(request('sessions',undefined,undefined,'site-owner'),database,auth)).status,401);
 assert.equal((await handleArenaRequest(request('control',{code:'123456',action:'start'},undefined,'site-owner'),database,auth)).status,401);database.sql.close();
});
test('verified trainer adopts only their own legacy sessions and other trainers stay isolated',async()=>{
 const database=db(),auth=authenticator(),ta=await token(),tb=await token({sub:'trainer-B',email:'other@example.test'});
 const legacy:any=await service(database,request('sessions',{title:'Legacy room',language:'en',activities:[sample('Quiz','en')]}),'site-owner');
 const other:any=await service(database,request('sessions',{title:'Other owner',language:'en',activities:[sample('Quiz','en')]}),'another-site-user');
 assert.equal((await handleArenaRequest(request('connect',{},ta,'site-owner'),database,auth)).status,200);
 const a:any=await (await handleArenaRequest(request('sessions',undefined,ta),database,auth)).json();assert.equal(a.sessions.length,1);assert.equal(a.sessions[0].code,legacy.code);
 await handleArenaRequest(request('connect',{},tb,'site-owner'),database,auth);
 const b:any=await (await handleArenaRequest(request('sessions',undefined,tb),database,auth)).json();assert.equal(b.sessions.length,0);
 assert.equal((await handleArenaRequest(request('state?code='+legacy.code+'&role=host',undefined,tb),database,auth)).status,403);
 assert.equal((await handleArenaRequest(request('state?code='+other.code+'&role=host',undefined,ta),database,auth)).status,403);
 // Reconnection is idempotent; it does not duplicate or transfer sessions.
 await handleArenaRequest(request('connect',{},ta,'site-owner'),database,auth);assert.equal(database.sql.prepare('SELECT COUNT(*) AS n FROM trainer_links').get().n,1);database.sql.close();
});
test('permission removal, expired tokens and cross-origin writes cannot mutate sessions',async()=>{
 const database=db(),t=await token(),auth=authenticator(),body={title:'Arena',activities:[sample('Quiz')],language:'ar'};
 assert.equal((await handleArenaRequest(request('sessions',body,t,undefined,'https://attacker.test'),database,auth)).status,403);
 assert.equal((await handleArenaRequest(request('sessions',body,t),database,authenticator(false))).status,403);
 const expired=await token({exp:Math.floor(now/1000)-1});assert.equal((await handleArenaRequest(request('sessions',body,expired),database,auth)).status,401);
 assert.equal(database.sql.prepare('SELECT COUNT(*) AS n FROM sessions').get().n,0);database.sql.close();
});
test('trainee QR registration still works without a trainer Firebase login',async()=>{
 const database=db(),ta=await token(),auth=authenticator();const created:any=await (await handleArenaRequest(request('sessions',{title:'Room',activities:[sample('Quiz')],language:'ar'},ta),database,auth)).json();
 const response=await handleArenaRequest(request('join',{code:created.code,name:'Trainee',employeeId:'TEST-123',confirmed:true}),database,auth);assert.equal(response.status,200);assert.ok((await response.json() as any).token);database.sql.close();
});
test('upstream fetch failures retain their dependency stage and never include credentials',async()=>{
 const t=await token(),fail=async()=>{throw Error('A network error containing a secret must not be exposed');};
 await assert.rejects(()=>createFirebaseVerifier({now:()=>now,fetcher:fail})(t,projectId),{message:'AUTH_NETWORK',stage:'google_keys_fetch'});
 await assert.rejects(()=>authorizeFirebaseTrainer(request('me',undefined,t),{projectId,databaseURL,verifier:verifier(),fetcher:fail}),{message:'AUTH_NETWORK',stage:'firebase_allowlist_fetch'});
});
test('auth diagnostics return only the safe stage with no-store and log no credentials',async()=>{
 const previous=console.warn,logs:any[]=[];console.warn=(...args)=>{logs.push(args);};
 try{for(const stage of ['google_keys_fetch','firebase_allowlist_fetch']){
  const response=await handleArenaRequest(request('me',undefined,'private-token'),undefined,async()=>{throw Object.assign(Error('AUTH_NETWORK'),{stage});});
  assert.equal(response.status,503);assert.equal(response.headers.get('Cache-Control'),'no-store');assert.deepEqual(await response.json(),{error:'AUTH_NETWORK',stage});
 }}finally{console.warn=previous;}
 assert.deepEqual(logs.map(x=>x[1]),[{stage:'google_keys_fetch',path:'/api/me'},{stage:'firebase_allowlist_fetch',path:'/api/me'}]);
 assert.ok(!JSON.stringify(logs).includes('private-token'));
});
