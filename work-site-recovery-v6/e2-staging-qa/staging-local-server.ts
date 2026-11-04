/**
 * Strictly local and ephemeral V6 HTTP harness (real API handler + D1-compatible
 * in-memory SQLite). ZERO production network, data, login or credentials.
 *
 * This is a test fixture, not a deployable service. Bind loopback ONLY.
 * Trainer verification is intentionally substituted by a local fixture token;
 * real Firebase auth is covered separately by existing V6 tests.
 */
import http from "node:http";
import path from "node:path";
import {fileURLToPath} from "node:url";
import fs from "node:fs";
import {readFile,stat} from "node:fs/promises";
import {DatabaseSync} from "node:sqlite";
import {handleArenaRequest} from "../lib/api-handler";

const HERE=path.dirname(fileURLToPath(import.meta.url));
// Always run from the V6 project root after esbuild bundles into .sites-runtime.
const ROOT=path.resolve(process.cwd());
const PUBLIC=path.resolve(ROOT,"dist-github");
const PORT=Number(process.env.E2_FIXTURE_PORT||8094);
if(!Number.isSafeInteger(PORT)||PORT<1024||PORT>65535)throw Error("INVALID_TEST_PORT");
if(process.env.E2_FIXTURE_EXPLICIT!== "local-only")throw Error("REFUSING_NON_TEST_ENVIRONMENT");
const HOST="127.0.0.1";
const dbFile=new DatabaseSync(":memory:");
for(const e of JSON.parse(fs.readFileSync(path.join(ROOT,"drizzle/meta/_journal.json"),"utf8")).entries)
 dbFile.exec(fs.readFileSync(path.join(ROOT,"drizzle",e.tag+".sql"),"utf8"));
const db:any={
 sql:dbFile,
 prepare(query:string){
  return {bind(...args:any[]){
   return {
    async run(){const r=dbFile.prepare(query).run(...args);return {meta:{changes:Number(r.changes)}};},
    async first(){return dbFile.prepare(query).get(...args)||null;},
    async all(){return {results:dbFile.prepare(query).all(...args)};}
   };
  }};
 },
 async batch(statements:any[]){
  dbFile.exec("BEGIN");try{
   const rows=[];for(const statement of statements)rows.push(await statement.run());
   dbFile.exec("COMMIT");return rows;
  }catch(e){dbFile.exec("ROLLBACK");throw e;}
 }
};
const fixtureTrainer=(req:Request)=>{
 if(req.headers.get("X-Firebase-Token")!=="local-fixture-trainer")
  throw Error("SIGN_IN");
 return {owner:"firebase:staging-fixture",uid:"staging-fixture",
         name:"Local Test Trainer",email:"trainer@fixture.invalid"};
};
const mime=new Map(Object.entries({
 ".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",
 ".mjs":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",
 ".png":"image/png",".svg":"image/svg+xml",".woff2":"font/woff2",
 ".ttf":"font/ttf",".json":"application/json"
}));
const LIMIT=1024*1024;
async function api(req:http.IncomingMessage,res:http.ServerResponse,url:URL){
 let bytes=0;const chunks:Buffer[]=[];
 for await(const chunk of req){
  bytes+=chunk.length;if(bytes>LIMIT){res.writeHead(413).end();return;}chunks.push(chunk);
 }
 const headers=new Headers();
 for(const [key,value] of Object.entries(req.headers))
  if(typeof value==="string")headers.set(key,value);
 const request=new Request("http://"+HOST+":"+PORT+url.pathname+url.search,{
  method:req.method||"GET",headers,
  body:["GET","HEAD"].includes(req.method||"GET")?undefined:Buffer.concat(chunks)
 });
 // Allow only the actual API handler to decide access and scoring, with
 // a locally injected trainer verifier and an empty ephemeral database.
 const out=await handleArenaRequest(request,db,fixtureTrainer,{allowedOrigin:"http://"+HOST+":"+PORT});
 res.statusCode=out.status;
 for(const [key,value] of out.headers)if(key.toLowerCase()!=="set-cookie")res.setHeader(key,value);
 res.setHeader("Cache-Control","no-store");
 res.end(Buffer.from(await out.arrayBuffer()));
}
async function staticFile(req:http.IncomingMessage,res:http.ServerResponse,url:URL){
 const base="/MTS-Training-Arena/v6/";
 const requested=url.pathname.startsWith(base)?url.pathname.slice(base.length):url.pathname.slice(1);
 let decoded;try{decoded=decodeURIComponent(requested);}catch{res.writeHead(400).end();return;}
 const target=path.resolve(PUBLIC,decoded||"index.html");
 if(target!==PUBLIC&&!target.startsWith(PUBLIC+path.sep)){res.writeHead(403).end();return;}
 let filename=target;
 try{if((await stat(filename)).isDirectory())filename=path.join(filename,"index.html");
  const buffer=await readFile(filename);
  res.writeHead(200,{"Content-Type":mime.get(path.extname(filename))||"application/octet-stream","Cache-Control":"no-store"});
  res.end(req.method==="HEAD"?undefined:buffer);
 }catch{res.writeHead(404).end("NOT_FOUND");}
}
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url||"/","http://"+HOST+":"+PORT);
  if(url.pathname==="/__fixture_health"){
   res.writeHead(200,{"Content-Type":"application/json","Cache-Control":"no-store"}).end(JSON.stringify({ok:true,testOnly:true}));
  }else if(url.pathname.startsWith("/api/")){
   await api(req,res,url);
  }else{
   await staticFile(req,res,url);
  }
 }catch(e){
  // Never log player tokens, body or identities.
  console.error("Fixture request failed",e instanceof Error?e.name:"Error");
  if(!res.headersSent)res.writeHead(500,{"Content-Type":"application/json"}).end(JSON.stringify({error:"FIXTURE_SERVER"}));
  else res.end();
 }
});
server.listen(PORT,HOST,()=>console.log("STAGING_FIXTURE_READY "+PORT));
function shutdown(){server.close(()=>{dbFile.close();process.exit(0)});}
process.once("SIGTERM",shutdown);process.once("SIGINT",shutdown);
