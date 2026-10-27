const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
const resultPath=path.resolve('audit-results/interaction-results.json');
const base='http://127.0.0.1:4173/audit-browser.html';
const games=['Quiz','Wheel of Fortune','Ultimate Game Show','Meta Plan','Escape Room','Live Poll','Order It','Open the Box','Flashcards','Scenario Challenge'];
function clip(x){return String(x||'').replace(/\s+/g,' ').slice(0,220)}
(async()=>{
 const executable=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(fs.existsSync);
 const browser=await chromium.launch({headless:true,...(executable?{executablePath:executable}:{}),args:['--no-sandbox']});
 const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await ctx.route('**/api/**',route=>route.abort());
 const out=[];
 for(let i=0;i<games.length;i++){
  const page=await ctx.newPage(),rec={game:games[i],actor:i===1?'trainer':'trainee',before:'',after:'',actions:[],changed:false,errors:[]};
  page.on('pageerror',e=>rec.errors.push(String(e).slice(0,250)));
  try{
   await page.goto(base+'?index='+i,{waitUntil:'domcontentloaded',timeout:20000});
   await page.locator('.arena-simulator-overlay').waitFor({state:'visible',timeout:12000});
   if(i===1)await page.getByRole('button',{name:'المدرب',exact:true}).click();
   const start=page.getByRole('button',{name:'ابدأ تجربة النشاط'});if(await start.count())await start.click();
   const main=page.locator('.arena-simulator-main');
   rec.before=clip(await main.innerText());
   const click=async(loc,label)=>{if(await loc.count()&&await loc.first().isEnabled()){await loc.first().click({timeout:2400});rec.actions.push('clicked:'+label);return true;}rec.actions.push('missing-or-disabled:'+label);return false;};
   switch(games[i]){
    case 'Quiz':
    case 'Ultimate Game Show':
    case 'Escape Room':
      await click(page.getByRole('button',{name:/^A/}),'option-A');
      await click(page.getByRole('button',{name:'تثبيت الإجابة'}),'submit-answer');break;
    case 'Wheel of Fortune':
      await click(page.locator('.wheel-tap-surface'),'tap-wheel');
      rec.actions.push('visible-outcome-immediate:'+(await page.locator('.wheel-outcome-grand').count()>0));
      rec.actions.push('spinning-class:'+(await page.locator('.wheel.in-spin').count()>0));break;
    case 'Meta Plan':
      await click(page.getByRole('button',{name:'تجهيز المستندات'}),'select-note');
      await click(page.getByRole('button',{name:/قبل الشحن/}),'assign-category');break;
    case 'Live Poll':
      await click(page.getByRole('button',{name:/التسجيل/}),'select-poll');
      await click(page.getByRole('button',{name:'إرسال صوتي'}),'submit-vote');break;
    case 'Order It':{
      const labels=page.locator('.arena-sequence__step');
      rec.actions.push('order-before:'+JSON.stringify((await labels.allTextContents()).slice(0,4).map(clip)));
      const h=page.locator('.arena-sequence__drag');
      if(await h.count()>1){
       const p=await h.nth(0).boundingBox(),q=await h.nth(1).boundingBox();
       if(p&&q){await page.mouse.move(p.x+p.width/2,p.y+p.height/2);await page.mouse.down();
        await page.mouse.move(q.x+q.width/2,q.y+q.height/2,{steps:12});await page.mouse.up();
        await page.waitForTimeout(140);rec.actions.push('order-after:'+JSON.stringify((await labels.allTextContents()).slice(0,4).map(clip)));}}
      await click(page.getByRole('button',{name:'ثبّت ترتيب الخطوات'}),'submit-order');break;
    }
    case 'Open the Box':
      await click(page.locator('.box-vault-box'),'tap-box');
      rec.actions.push('revealed:'+!!(await page.locator('.box-vault-reveal').count()));break;
    case 'Flashcards':
      await click(page.locator('.flash-academy-card'),'flip-card');
      rec.actions.push('flipped-class:'+!!(await page.locator('.flash-academy-card--flipped').count()));break;
    case 'Scenario Challenge':
      await click(page.getByRole('button',{name:/أراجع البيانات/}),'take-safe-decision');
      rec.actions.push('choice-after:'+(await page.locator('.arena-scenario__choice').count()));break;
   }
   await page.waitForTimeout(180);
   rec.after=clip(await main.innerText());rec.changed=rec.before!==rec.after;
  }catch(e){rec.errors.push(String(e).slice(0,520));}
  out.push(rec);await page.close();
 }
 await browser.close();
 fs.mkdirSync(path.dirname(resultPath),{recursive:true});
 fs.writeFileSync(resultPath,JSON.stringify(out,null,2));
 console.log('ROLEPLAY_INTERACTIONS '+JSON.stringify(out.map(x=>({game:x.game,role:x.actor,changed:x.changed,actions:x.actions,errors:x.errors}))));
})().catch(e=>{console.error('ROLEPLAY_INTERACTIONS_FATAL',e);process.exitCode=1});
