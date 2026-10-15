import {firebaseRestDb} from "./firebase-rest.mjs";
import {verifyFirebaseIdToken} from "./firebase-auth.mjs";
import {createTrustedRoom,openTrustedRound,closeTrustedRound} from "../trusted/room-lifecycle.mjs";
import {settleRound} from "../trusted/firebase-settlement.mjs";

const routes=new Set(["/v1/rooms/create","/v1/rounds/open","/v1/rounds/close","/v1/settle"]);
function response(status,body,origin){
 return new Response(JSON.stringify(body),{status,headers:{
  "Content-Type":"application/json; charset=utf-8",
  "Cache-Control":"no-store","Vary":"Origin",
  "Access-Control-Allow-Origin":origin,
  "Access-Control-Allow-Methods":"POST, OPTIONS",
  "Access-Control-Allow-Headers":"Authorization, Content-Type"
 }});
}
export default {
 async fetch(req,env){
  const allowed=env.ARENA_ALLOWED_ORIGIN;
  const origin=req.headers.get("Origin");
  if(!allowed||origin!==allowed)return response(403,{error:"Origin blocked"},allowed||"null");
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:{
   "Access-Control-Allow-Origin":allowed,"Access-Control-Allow-Methods":"POST, OPTIONS",
   "Access-Control-Allow-Headers":"Authorization, Content-Type","Vary":"Origin"
  }});
  const path=new URL(req.url).pathname;
  if(req.method!=="POST"||!routes.has(path))return response(404,{error:"Not found"},allowed);
  if(env.ARENA_ENABLE_TRUSTED_V1!=="true")return response(503,{error:"Trusted scoring not enabled"},allowed);
  const header=req.headers.get("Authorization")||"";
  if(!header.startsWith("Bearer "))return response(401,{error:"Sign in required"},allowed);
  const size=Number(req.headers.get("Content-Length")||0);
  if(size>8192)return response(413,{error:"Request too large"},allowed);
  try{
   const body=await req.text();
   if(body.length>8192)return response(413,{error:"Request too large"},allowed);
   const payload=JSON.parse(body);
   if(!payload||typeof payload!=="object"||Array.isArray(payload))return response(400,{error:"Invalid request"},allowed);
   const uid=await verifyFirebaseIdToken(header.slice(7),env.FIREBASE_PROJECT_ID);
   const db=firebaseRestDb(env);
   const args={db,uid:uid.uid};
   let result;
   switch(path){
    case "/v1/rooms/create":result=await createTrustedRoom({...args,title:payload.title});break;
    case "/v1/rounds/open":result=await openTrustedRound({...args,roomId:payload.roomId,activity:payload.activity});break;
    case "/v1/rounds/close":result=await closeTrustedRound({...args,roomId:payload.roomId});break;
    case "/v1/settle":result=await settleRound({db,verifyIdToken:async()=>uid,idToken:"verified-server-side",roomId:payload.roomId,roundId:payload.roundId});break;
   }
   return response(200,result,allowed);
  }catch(error){
   console.error("Arena Worker rejected request:",error?.message||"Error");
   return response(400,{error:"Request denied or temporary backend failure"},allowed);
  }
 }
};
