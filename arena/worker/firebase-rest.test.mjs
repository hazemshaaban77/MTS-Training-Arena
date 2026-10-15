import test from "node:test";
import assert from "node:assert/strict";
import {webcrypto} from "node:crypto";
import {firebaseRestDb} from "./firebase-rest.mjs";

test("OAuth token is reused; Firebase CAS retries once on ETag conflict",async()=>{
 const originalFetch=globalThis.fetch;
 const originalCrypto=globalThis.crypto;
 const keys=await webcrypto.subtle.generateKey({name:"RSASSA-PKCS1-v1_5",modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:"SHA-256"},true,["sign","verify"]);
 const pkcs8=new Uint8Array(await webcrypto.subtle.exportKey("pkcs8",keys.privateKey));
 const base64=Buffer.from(pkcs8).toString("base64").match(/.{1,64}/g).join("\n");
 const env=Object.freeze({GOOGLE_CLIENT_EMAIL:"unit-test@example.iam.gserviceaccount.com",GOOGLE_PRIVATE_KEY:"-----BEGIN PRIVATE KEY-----\n"+base64+"\n-----END PRIVATE KEY-----",FIREBASE_DATABASE_URL:"https://test-default-rtdb.example.com"});
 const calls=[];let etag=0;
 try{
  globalThis.crypto=webcrypto;
  globalThis.fetch=async(url,opts)=>{
   calls.push({url:String(url),method:opts.method,headers:opts.headers});
   if(String(url).includes("oauth2.googleapis.com"))return new Response(JSON.stringify({access_token:"synthetic-oauth",expires_in:3600}),{status:200});
   if(opts.method==="GET")return new Response("null",{headers:{"ETag":'"'+etag+'"'}});
   if(opts.method==="PUT"&&etag===0){etag=1;return new Response("null",{status:412});}
   return new Response(JSON.stringify({ok:true}),{status:200});
  };
  const db=firebaseRestDb(env);
  const result=await db.ref("arenaTrusted/locks/test").transaction(old=>old===null?{claimed:true}:undefined);
  assert.equal(result.committed,true);
  assert.equal(result.snapshot.val().claimed,true);
  assert.equal(calls.filter(c=>c.url.includes("oauth2.googleapis.com")).length,1);
  assert.equal(calls.filter(c=>c.method==="GET").length,2);
  assert.equal(calls.filter(c=>c.method==="PUT").length,2);
  assert.equal(calls.filter(c=>c.method==="PUT")[1].headers["if-match"],'"1"');
  assert.equal(calls.filter(c=>c.method==="GET")[0].headers["X-Firebase-ETag"],"true");
  await db.ref("arenaV1/test").get();
  assert.equal(calls.filter(c=>c.url.includes("oauth2.googleapis.com")).length,1);
  await assert.rejects(db.ref("../other").get(),/Invalid database path/);
 } finally {globalThis.fetch=originalFetch;globalThis.crypto=originalCrypto;}
});
