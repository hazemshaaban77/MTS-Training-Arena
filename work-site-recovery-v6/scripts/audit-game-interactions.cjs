const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
const outPath=path.resolve('audit-results/interaction-results.json');
const origin='http://127.0.0.1:4173/audit-browser.html';
const games=['Quiz','Wheel of Fortune','Ultimate Game Show','Meta Plan','Escape Room','Live Poll','Order It','Open the Box','Flashcards','Scenario Challenge'];
const short=x=>String(x||'').replace(/\s+/g,' ').slice(0,220);
(async()=>{
 const chrome=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(fs.existsSync);
 const browser=await chromium.launch({headless:true,...(chrome?{executablePath:chrome}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
 const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await ctx.route('**/api/**',r=>r.abort());
 const results=[];
 async function activate(page,selector,action,rec){
  const el=page.locator(selector).first();
  if(await el.count()&&await el.isVisible()&&await el.isEnabled()){
   await el.click({timeout:4500});rec.actions.push(action+':clicked');return true;
  }
  rec.actions.push(action+':unavailable');return false;
 }
 try{
  for(let i=0;i<games.length;i++){
   const game=games[i],actor=['Wheel of Fortune','Ultimate Game Show','Open the Box','Flashcards'].includes(game)?'trainer':'trainee';
   const page=await ctx.newPage();
   const rec={game,actor,actions:[],observations:{},errors:[],passed:false};
   page.on('pageerror',e=>rec.errors.push('JS: '+short(e)));
   try{
    await page.goto(origin+'?index='+i,{waitUntil:'domcontentloaded',timeout:30000});
    await page.locator('.arena-simulator-overlay').waitFor({state:'visible',timeout:14000});
    if(actor==='trainer')await page.getByRole('button',{name:'المدرب',exact:true}).click();
    const start=page.getByRole('button',{name:'ابدأ تجربة النشاط'});
    if(await start.count())await start.click();
    await page.waitForTimeout(250);
    const main=page.locator('.arena-simulator-main');
    const before=short(await main.innerText());
    switch(game){
     case 'Quiz':{
      await activate(page,'.answer-grid button','pick answer',rec);
      const ok=await activate(page,'button:has-text("تثبيت الإجابة")','submit answer',rec);
      rec.passed=ok;break;
     }
     case 'Wheel of Fortune':{
      rec.observations.pointer=await page.locator('.wheel-pointer').count();
      rec.observations.forged=await page.locator('.wheel-stage--forge').count();
      if(await activate(page,'.wheel-tap-surface','tap wheel',rec)){
       await page.waitForTimeout(450);
       rec.observations.revealedEarly=await page.locator('.wheel-outcome-grand').isVisible().catch(()=>false);
       rec.observations.spinning=await page.locator('.wheel.in-spin').count();
       await page.waitForTimeout(7950);
       rec.observations.revealedAfterStop=await page.locator('.wheel-outcome-grand').isVisible().catch(()=>false);
       rec.observations.rubric=await page.locator('.arena-practical-rubric').count();
       rec.observations.gradeOptions=rec.observations.rubric?await page.locator('.arena-practical-rubric input[type="range"]').count():0;
       const gradeBtn=page.locator('.arena-practical-rubric button:has-text("اعتماد الدرجة")');
       if(await gradeBtn.count()&&await gradeBtn.isEnabled()) {
        await gradeBtn.click();await page.waitForTimeout(200);
        rec.observations.confirmed=await page.locator('.arena-rubric-confirmed').count()>0;
       }
       rec.passed=!!(rec.observations.forged&&rec.observations.spinning&&rec.observations.revealedAfterStop&&rec.observations.rubric&&!rec.observations.revealedEarly);
      }
      break;
     }
     case 'Ultimate Game Show':{
      rec.observations.ladderRungs=await page.locator('.championship-stage__ladder li').count();
      const caster=page.locator('.championship-stage__casting select');
      if(await caster.count())await caster.selectOption('demo-a');
      await activate(page,'.championship-stage__casting button:has-text("ابدأ محاولة")','cast contestant',rec);
      rec.observations.ladderRungsAfterCast=await page.locator('.championship-stage__ladder li').count();
      rec.observations.question=await page.locator('.championship-stage__question h3').innerText().catch(()=>'');
      rec.observations.lifelineAboveQuestion=await page.evaluate(()=>{
       const l=document.querySelector('.championship-stage__lifelines'),q=document.querySelector('.championship-stage__question');
       return !!l&&!!q&&!!(l.compareDocumentPosition(q)&Node.DOCUMENT_POSITION_FOLLOWING);
      });
      rec.observations.audienceVoteForContestant=await page.locator('.championship-stage__audience-actions button').count();
      rec.passed=rec.observations.ladderRungs===7&&rec.observations.lifelineAboveQuestion;
      break;
     }
     case 'Meta Plan':{
      const cards=page.locator('.meta-drag-card');
      rec.observations.before=await cards.count();
      await activate(page,'.meta-drag-card','select metaplan note',rec);
      rec.observations.selected=await page.locator('.meta-drag-card.is-selected').count();
      const category=page.locator('.meta-drag-column button').first();
      if(await category.count())await activate(page,'.meta-drag-column button','assign category',rec);
      rec.observations.remaining=await page.locator('.meta-drag-bank .meta-drag-card').count();
      rec.passed=rec.observations.selected>0;
      break;
     }
     case 'Escape Room':{
      rec.observations.rooms=await page.locator('.arena-escape-vault').count();
      await activate(page,'.answer-grid button','pick escape answer',rec);
      await activate(page,'button:has-text("تثبيت الإجابة")','submit escape answer',rec);
      rec.passed=!!rec.observations.rooms;break;
     }
     case 'Live Poll':{
      await activate(page,'.live-poll-vote__card','choose poll option',rec);
      await activate(page,'.live-poll-vote__submit','vote',rec);
      rec.observations.pollText=short(await main.innerText());
      rec.passed=rec.actions.some(x=>x.startsWith('vote:clicked'));break;
     }
     case 'Order It':{
      const steps=page.locator('.arena-sequence__step'),grips=page.locator('.arena-sequence__drag');
      rec.observations.before=(await steps.allTextContents()).map(short);
      rec.observations.grips=await grips.count();
      if(await grips.count()>1){
       const a=await grips.nth(0).boundingBox(),b=await grips.nth(1).boundingBox();
       if(a&&b){await page.mouse.move(a.x+a.width/2,a.y+a.height/2);
        await page.mouse.down();await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:14});
        await page.mouse.up();await page.waitForTimeout(300);}
      }
      rec.observations.after=(await steps.allTextContents()).map(short);
      rec.observations.reordered=JSON.stringify(rec.observations.before)!==JSON.stringify(rec.observations.after);
      if(!rec.observations.reordered&&await grips.count()>1){
       // Real touch device event rather than synthetic mouse, using the same
       // touch-action and pointer-capture path as Android Chrome.
       await grips.nth(0).scrollIntoViewIfNeeded();
       const p=await grips.nth(0).boundingBox(),dest=await steps.nth(1).boundingBox();
       rec.observations.dragGeometry={handle:!!p,target:!!dest};
       if(p&&dest){
        const sx=p.x+p.width/2,sy=p.y+p.height/2,ex=dest.x+dest.width/2,ey=dest.y+dest.height/2;
        const cdp=await ctx.newCDPSession(page);
        await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:sx,y:sy,id:1}]});
        for(let k=1;k<=14;k++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:sx+(ex-sx)*k/14,y:sy+(ey-sy)*k/14,id:1}]});
        await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
        await cdp.detach();await page.waitForTimeout(250);
        rec.observations.afterRealTouch=(await steps.allTextContents()).map(short);
        rec.observations.realTouchReordered=JSON.stringify(rec.observations.afterRealTouch)!==JSON.stringify(rec.observations.after);
       }
      }
      const down=page.locator('.arena-sequence__step-actions button[aria-label*="لأسفل"]').first();
      rec.observations.downButtonCount=await down.count();
      if(await down.count()&&await down.isEnabled()){
       await down.click();
       rec.actions.push('move step down:clicked');
       rec.observations.afterArrow=(await steps.allTextContents()).map(short);
       rec.observations.arrowReordered=JSON.stringify(rec.observations.afterArrow)!==JSON.stringify(rec.observations.afterRealTouch||rec.observations.after);
      }
      await activate(page,'button:has-text("ثبّت ترتيب الخطوات")','submit order',rec);
      rec.passed=!!(rec.observations.grips&&rec.observations.arrowReordered);break;
     }
     case 'Open the Box':{
      await activate(page,'.box-vault-box','open box',rec);
      rec.observations.reveal=await page.locator('.box-vault-reveal').count();
      rec.observations.rubric=await page.locator('.arena-practical-rubric').count();
      if(rec.observations.rubric)await activate(page,'.arena-practical-rubric button:has-text("اعتماد الدرجة")','commit box score',rec);
      rec.observations.award=await page.locator('.box-prize-moment').count();
      rec.passed=rec.observations.reveal>0&&rec.observations.rubric>0;break;
     }
     case 'Flashcards':{
      rec.observations.grader=await page.locator('.flash-academy-judge').count();
      rec.observations.gradeBtn=await page.locator('button:has-text("اعتماد التقييم")').count();
      if(rec.observations.gradeBtn)await activate(page,'button:has-text("اعتماد التقييم")','grade flashcard',rec);
      rec.observations.confirmation=short(await main.innerText());
      rec.passed=rec.observations.gradeBtn>0;break;
     }
     case 'Scenario Challenge':{
      rec.observations.before=await page.locator('.arena-scenario__choice').count();
      await activate(page,'.arena-scenario__choice','choose safe path',rec);
      rec.observations.after=await page.locator('.arena-scenario__choice').count();
      rec.passed=rec.observations.before>0;break;
     }
    }
    rec.observations.changed=short(await main.innerText())!==before;
    await page.screenshot({path:path.resolve('audit-results','interaction-'+(i+1)+'-'+game.toLowerCase().replaceAll(' ','-')+'.png'),fullPage:false,animations:'disabled'});
   }catch(e){rec.errors.push(short(e).slice(0,500))}
   results.push(rec);await page.close();
  }
 }finally{await ctx.close();await browser.close();}
 fs.mkdirSync(path.dirname(outPath),{recursive:true});
 fs.writeFileSync(outPath,JSON.stringify(results,null,2));
 console.log('ROLEPLAY_INTERACTIONS '+JSON.stringify(results.map(x=>({game:x.game,actor:x.actor,passed:x.passed,actions:x.actions,observations:x.observations,errors:x.errors}))));
})().catch(e=>{console.error('INTERACTIONS_FATAL',e);process.exitCode=1});
