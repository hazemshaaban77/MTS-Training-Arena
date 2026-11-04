import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs/promises";
import {fileURLToPath} from "node:url";
import {chromium} from "playwright";

const dir=path.dirname(fileURLToPath(import.meta.url));
const shots=path.join(dir,"ci-screenshots");
await fs.mkdir(shots,{recursive:true});
const browser=await chromium.launch({headless:true});
const origin="http://127.0.0.1:8087/e2-preview/live-projector.html";
const errors=[];
let mockedState={
  code:"123456",title:"Training Session",status:"question",revision:1,current:0,
  serverNow:1000,deadline:3000,paused:false,keyRevealed:false,submitted:2,teamMode:true,
  teams:[{team:"Wave",score:15,rank:2,members:2},{team:"Lightning",score:24,rank:1,members:2}],
  players:[{name:"Private Participant",uid:"SECRET-UID",approval:"approved",employeeId:"EMP-PRIVATE"}],
  activity:{type:"Quiz",prompt:"ما معنى ACID؟",options:["A Choice","B Choice","C Choice"],correct:1,explanation:"SECRET ANSWER"},
  owner:"PRIVATE OWNER",settings:{password:"PRIVATE KEY"}
};
let requests=0,fail=false;
try{
 const ctx=await browser.newContext({viewport:{width:1440,height:900}});
 const p=await ctx.newPage();p.on("pageerror",e=>errors.push(e.message));
 await p.route("https://example-api.test/**",async route=>{
  requests++;
  const u=new URL(route.request().url());
  assert.equal(u.pathname,"/api/state");
  assert.equal(u.searchParams.get("code"),"123456");
  assert.equal(route.request().method(),"GET");
  assert.ok(!route.request().headers()["authorization"]);
  await route.fulfill({
   status:fail?503:200,
   contentType:"application/json",
   headers:{"access-control-allow-origin":"*"},
   body:JSON.stringify(fail?{error:"UNAVAILABLE"}:mockedState)
  });
 });
 await p.goto(origin,{waitUntil:"domcontentloaded"});
 assert.equal(requests,0,"Never auto-connect to real session without user action");
 const logos=await p.locator(".top img").evaluateAll(list=>list.map(i=>i.naturalWidth));
 assert.equal(logos.length,2);
 assert.ok(logos.every(x=>x>0),"Original corporate logos must load");
 assert.ok(await p.locator(".product-logo").evaluate(i=>i.naturalWidth>0),"Approved Arena logo must load");
 await p.locator("#api-origin").fill("https://example-api.test");
 await p.locator("#frontend-origin").fill("https://hazemshaaban77.github.io/MTS-Training-Arena/v6/?token=REMOVE");
 await p.locator("#room-code").fill("123456");
 await p.locator("#connect-form button[type=submit]").click();
 await p.waitForFunction(()=>document.querySelector("#stage")?.dataset.scene==="question");
 assert.ok(!(await p.locator("#stage").innerText()).includes("SECRET ANSWER"));
 assert.equal(await p.locator(".option.correct").count(),0,"No correct option before reveal");
 assert.equal(await p.locator("#join-link").getAttribute("href"),"https://hazemshaaban77.github.io/MTS-Training-Arena/v6/?view=join&code=123456");
 assert.ok(!(await p.locator("body").innerText()).includes("EMP-PRIVATE"));
 await p.screenshot({path:path.join(shots,"e2-public-question.png"),fullPage:true});
 mockedState={...mockedState,revision:2,status:"results",keyRevealed:false};
 await p.waitForFunction(()=>document.querySelector("#stage")?.dataset.scene==="locked",null,{timeout:6500});
 assert.equal(await p.locator(".option.correct").count(),0,"Locked question cannot reveal answer");
 mockedState={...mockedState,revision:3,keyRevealed:true};
 await p.waitForFunction(()=>document.querySelector("#stage")?.dataset.scene==="reveal",null,{timeout:6500});
 assert.equal(await p.locator(".option.correct").count(),1,"Answer shows only when V6 server reveals");
 await p.screenshot({path:path.join(shots,"e2-public-reveal.png"),fullPage:true});
 await p.locator("#projector").click();
 assert.ok(await p.locator("body").evaluate(e=>e.classList.contains("projector")));
 const cornerLogos=await p.locator(".top img").evaluateAll(list=>list.map(i=>({visible:getComputedStyle(i).display!=="none",width:i.naturalWidth})));
 assert.ok(cornerLogos.every(x=>x.visible&&x.width>0),"Projector must keep original corporate logos");
 await p.screenshot({path:path.join(shots,"e2-public-projector.png")});
 await p.locator("#exit").click();
 fail=true;
 await p.waitForFunction(()=>document.querySelector("#stage")?.dataset.scene==="unavailable",null,{timeout:6500});
 assert.equal(await p.locator(".option.correct").count(),0,"Offline failure must remove stale answer/results");
 await p.locator("#stop").click();
 const count=requests;
 await p.waitForTimeout(2300);
 assert.equal(requests,count,"Stop must end polling");
 await p.setViewportSize({width:390,height:844});
 await p.screenshot({path:path.join(shots,"e2-public-mobile.png"),fullPage:true});
 const dim=await p.evaluate(()=>({body:document.documentElement.scrollWidth,viewport:window.innerWidth}));
 assert.ok(dim.body<=dim.viewport+2,"Mobile horizontal overflow: "+JSON.stringify(dim));
 assert.deepEqual(errors,[]);
 console.log("PASS read-only live stage: explicit connect, safe QR base, original logos, no early reveal, server-only correct answer, no sensitive data, error closes stale display, stop, responsive projector.");
}finally{await browser.close();}
