import test from "node:test";
import assert from "node:assert/strict";
import handler from "./index.mjs";

const origin="https://hazemshaaban77.github.io";
const env={ARENA_ALLOWED_ORIGIN:origin,ARENA_ENABLE_TRUSTED_V1:"false"};
function request(method,requestOrigin,path="/v1/rooms/create"){
 return new Request("https://worker.example"+path,{method,headers:{"Origin":requestOrigin}});
}
test("rejects requests from unapproved origins",async()=>{
 const result=await handler.fetch(request("POST","https://attacker.example"),env);
 assert.equal(result.status,403);
});
test("free-tier draft fails closed before launch",async()=>{
 const result=await handler.fetch(request("POST",origin),env);
 assert.equal(result.status,503);
 assert.match(await result.text(),/not enabled/);
});
test("preflight only allows the configured browser origin",async()=>{
 const good=await handler.fetch(request("OPTIONS",origin),env);
 assert.equal(good.status,204);
 assert.equal(good.headers.get("Access-Control-Allow-Origin"),origin);
 const bad=await handler.fetch(request("OPTIONS","https://evil.example"),env);
 assert.equal(bad.status,403);
});
test("no privileged endpoint exists outside the allowlist",async()=>{
 const result=await handler.fetch(request("POST",origin,"/admin"),env);
 assert.equal(result.status,404);
});

test("public health endpoint reveals no secrets and says not ready",async()=>{
 const response=await handler.fetch(new Request("https://worker.example/health"),env);
 assert.equal(response.status,200);
 const body=await response.json();
 assert.equal(body.ready,false);
 assert.equal(body.mode,"safe-preview");
 assert.equal(JSON.stringify(body).includes("firebase"),false);
});
