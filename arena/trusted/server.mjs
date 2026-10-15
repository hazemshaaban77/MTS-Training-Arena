/**
 * Dedicated Node.js service; never deploy this directory to GitHub Pages.
 * Firebase Admin uses Application Default Credentials on the server.
 */
import {createServer} from "node:http";
import {initializeApp,applicationDefault,getApps} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import {getDatabase} from "firebase-admin/database";
import {settleRound} from "./firebase-settlement.mjs";
import {createTrustedRoom,openTrustedRound,closeTrustedRound} from "./room-lifecycle.mjs";

const origin=process.env.ARENA_ALLOWED_ORIGIN;
const databaseURL=process.env.FIREBASE_DATABASE_URL;
const port=Number(process.env.PORT||8080);
if(!origin||!/^https:\/\//.test(origin)||!databaseURL)throw Error("Set ARENA_ALLOWED_ORIGIN and FIREBASE_DATABASE_URL");
if(!getApps().length)initializeApp({credential:applicationDefault(),databaseURL});
const db=getDatabase(),auth=getAuth();
const handler=async(req,res)=>{
 const headers={"Content-Type":"application/json","Cache-Control":"no-store","Access-Control-Allow-Origin":origin,"Vary":"Origin","Access-Control-Allow-Headers":"Authorization, Content-Type","Access-Control-Allow-Methods":"POST, OPTIONS"};
 const respond=(status,obj)=>{res.writeHead(status,headers);res.end(JSON.stringify(obj));};
 if(req.headers.origin!==origin){respond(403,{error:"Origin not allowed"});return;}
 if(req.method==="OPTIONS"){res.writeHead(204,headers);res.end();return;}
 if(req.method!=="POST"||!["/v1/rooms/create","/v1/rounds/open","/v1/rounds/close","/v1/settle"].includes(req.url)){respond(404,{error:"Not found"});return;}
 const authorization=req.headers.authorization||"";
 if(!authorization.startsWith("Bearer ")){respond(401,{error:"Sign in required"});return;}
 try{
  const chunks=[];let count=0;
  for await(const chunk of req){count+=chunk.length;if(count>8192)throw Error("Payload too large");chunks.push(chunk);}
  const payload=JSON.parse(Buffer.concat(chunks).toString("utf8"));
  const token=authorization.slice(7);
  const user=await auth.verifyIdToken(token,true);
  const result=req.url==="/v1/rooms/create"?await createTrustedRoom({db,uid:user.uid,title:payload.title}):
    req.url==="/v1/rounds/open"?await openTrustedRound({db,uid:user.uid,roomId:payload.roomId,activity:payload.activity}):
    req.url==="/v1/rounds/close"?await closeTrustedRound({db,uid:user.uid,roomId:payload.roomId}):
    await settleRound({db,verifyIdToken:()=>Promise.resolve(user),idToken:token,roomId:payload.roomId,roundId:payload.roundId});
  respond(200,result);
 }catch(e){console.error("Settlement rejected:",e.message);respond(400,{error:"Settlement rejected"});}
};
createServer(handler).listen(port,()=>console.log("Arena trusted scoring service listening on",port));
