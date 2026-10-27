/* Real headless Chromium role-play against current React components.
   Runs as an isolated simulator. No Firebase sign-in, room write or deploy. */
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve('audit-results');
fs.mkdirSync(root,{recursive:true});
const base='http://127.0.0.1:4173/audit-browser.html';
const games=['Quiz','Wheel of Fortune','Ultimate Game Show','Meta Plan','Escape Room','Live Poll','Order It','Open the Box','Flashcards','Scenario Challenge'];
(async()=>{
 const chrome=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);
 const browser=await chromium.launch({headless:true,...(chrome?{executablePath:chrome}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
 const cases=[],runtimeErrors=[];
 const targets=[
  {name:'trainer',size:{width:1440,height:900},role:'المدرب'},
  {name:'trainee-mobile',size:{width:390,height:844},role:'المتدرب',mobile:true},
  {name:'projector',size:{width:1920,height:1080},role:'البروجيكتور'}
 ];
 try{
  for(const target of targets){
   const ctx=await browser.newContext({viewport:target.size,deviceScaleFactor:1,hasTouch:!!target.mobile,isMobile:!!target.mobile});
   await ctx.route('**/api/**',route=>route.abort());
   await ctx.route(/mts-training-arena-v6-gateway\.pages\.dev|workers\.dev\/api/,route=>route.abort());
   for(let i=0;i<games.length;i++){
    const label=games[i],rec={game:label,role:target.name,loaded:false,interactive:false,overflow:false,actions:[],errors:[]};
    const page=await ctx.newPage();page.on('pageerror',e=>{rec.errors.push('JS:'+String(e).slice(0,200));runtimeErrors.push({game:label,role:target.name,message:String(e).slice(0,300)})});
    try{
     await page.goto(base+'?index='+i,{waitUntil:'domcontentloaded',timeout:30000});
     await page.locator('.arena-simulator-overlay').waitFor({state:'visible',timeout:12000});
     const mode=page.locator('.arena-simulator-modes button[aria-label="'+target.role+'"]');
     await mode.click({timeout:6000});
     const intro=page.getByRole('button',{name:'ابدأ تجربة النشاط'});
     if(await intro.count())await intro.click({timeout:6000});
     await page.waitForTimeout(150);
     rec.loaded=await page.locator('.arena-simulator-main').isVisible();
     rec.interactive=(await page.locator('.arena-simulator-main button:visible').count())>0;
     rec.buttons=(await page.locator('.arena-simulator-main button:visible').allTextContents()).map(x=>x.trim().slice(0,50)).filter(Boolean).slice(0,18);
     rec.viewport=await page.evaluate(()=>{
      const el=document.querySelector('.arena-simulator-main');
      const r=el?.getBoundingClientRect();
      return {width:Math.round(r?.width||0),height:Math.round(r?.height||0),
       viewportWidth:innerWidth,windowScrollWidth:document.documentElement.scrollWidth,
       stageScrollWidth:el?.scrollWidth,stageClientWidth:el?.clientWidth};
     });
     rec.overflow=(rec.viewport.windowScrollWidth>rec.viewport.viewportWidth+12||
      rec.viewport.stageScrollWidth>rec.viewport.stageClientWidth+12);
     if(target.name==='trainer'&&label==='Wheel of Fortune'){
      const wheel=page.locator('.wheel-tap-surface');
      rec.actions.push('wheel-present:'+(await wheel.count()));
      if(await wheel.isEnabled()){
       await wheel.click();
       await page.waitForTimeout(100);
       rec.actions.push('outcome-immediate:'+(await page.locator('.wheel-outcome-grand').isVisible().catch(()=>false)));
       rec.actions.push('spinning-animation:'+(await page.locator('.wheel.in-spin').count()));
      }else rec.actions.push('wheel-disabled');
     }
     if(target.name==='trainer'&&label==='Open the Box'){
      const box=page.locator('.box-vault-box').first();
      rec.actions.push('boxes:'+(await page.locator('.box-vault-box').count()));
      if(await box.count()&&await box.isEnabled()){
       await box.click();
       rec.actions.push('reveal:'+(await page.locator('.box-vault-reveal').count()));
       rec.actions.push('grade-console:'+(await page.locator('.arena-practical-rubric').count()));
      }
     }
     if(target.name==='trainee-mobile'&&label==='Order It'){
      rec.actions.push('mobile-grips:'+(await page.locator('.arena-sequence__drag').count()));
      const handles=page.locator('.arena-sequence__drag');
      if(await handles.count()>1){
       const first=await handles.nth(0).boundingBox(),second=await handles.nth(1).boundingBox();
       if(first&&second){
        await page.mouse.move(first.x+first.width/2,first.y+first.height/2);
        await page.mouse.down();await page.mouse.move(second.x+second.width/2,second.y+second.height/2,{steps:9});
        await page.mouse.up();rec.actions.push('drag-event-dispatched');
       }
      }
     }
     if(target.name==='projector')rec.actions.push('projector-controls:'+(await page.locator('.arena-sim-stage--display .arena-sim-controls button').count()));
     const file=target.name+'-'+String(i+1).padStart(2,'0')+'-'+label.toLowerCase().replaceAll(' ','-')+'.png';
     await page.screenshot({path:path.join(root,file),fullPage:false,animations:'disabled'});
     rec.screenshot=file;
    }catch(e){rec.errors.push(String(e).slice(0,600));}
    finally{cases.push(rec);await page.close();}
   }
   await ctx.close();
  }
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  await context.route('**/api/**',route=>route.abort());
  await context.route(/mts-training-arena-v6-gateway\.pages\.dev/,route=>route.abort());
  const page=await context.newPage();
  let builder={opened:false,activityCards:0,previewButtons:0,templateButtons:0,errors:[]};
  page.on('pageerror',e=>builder.errors.push(String(e).slice(0,250)));
  try{
   await page.goto(base,{waitUntil:'domcontentloaded'});
   await page.getByTestId('audit-builder').click();
   await page.locator('.builder-v2').waitFor({state:'visible',timeout:10000});
   builder.opened=true;
   builder.activityCards=await page.locator('.arena-simulator-single,.arena-simulator-single').count();
   builder.previewButtons=await page.locator('.arena-simulator-single').count();
   builder.templateButtons=await page.locator('.builder-session-template').count();
   builder.buttons=(await page.locator('.builder-v2 button:visible').allTextContents()).map(x=>x.trim()).filter(Boolean).slice(0,50);
   builder.text=(await page.locator('.builder-v2').innerText()).slice(0,2000);
   await page.screenshot({path:path.join(root,'trainer-session-builder.png'),fullPage:false});
  }catch(e){builder.errors.push(String(e).slice(0,500))}
  await page.close();await context.close();
  const result={scope:'Isolated Chromium / React Simulator (NOT authenticated production backend)',games,cases,builder,runtimeErrors};
  fs.writeFileSync(path.join(root,'results.json'),JSON.stringify(result,null,2));
  const failures=cases.filter(x=>!x.loaded||x.errors.length),overflow=cases.filter(x=>x.overflow);
  console.log('ROLEPLAY_AUDIT_SUMMARY '+JSON.stringify({
   roles:targets.map(x=>x.name),rendered:cases.filter(x=>x.loaded).length,total:cases.length,
   failures:failures.map(x=>({game:x.game,role:x.role,errors:x.errors})),
   viewportOverflows:overflow.map(x=>({game:x.game,role:x.role,viewport:x.viewport})),
   wheel:cases.find(x=>x.role==='trainer'&&x.game==='Wheel of Fortune')?.actions,
   box:cases.find(x=>x.role==='trainer'&&x.game==='Open the Box')?.actions,
   orderMobile:cases.find(x=>x.role==='trainee-mobile'&&x.game==='Order It')?.actions,
   builder:{opened:builder.opened,templateButtons:builder.templateButtons,previewButtons:builder.previewButtons,errors:builder.errors},
   totalRuntimeErrors:runtimeErrors.length
  }));
 }finally{await browser.close();}
})().catch(e=>{console.error('AUDIT_BROWSER_FATAL',e);process.exitCode=1});
