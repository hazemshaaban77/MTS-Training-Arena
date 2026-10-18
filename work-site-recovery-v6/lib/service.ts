import {evaluateActivity as legacyEvaluate} from './upstream/activity-contract.mjs';
import {validateDeck,flattenDeck,publicActivity,grade,evaluate,scoreboards,nextState,presentation,unscored,fairIndex} from './domain.mjs';
import {normalizeEmployeeId,normalizeRecoveryCode} from './identity.mjs';
import {workspace,audit,validateSurvey,type TrainerContext} from './workspace';
import {readJson} from './request-security';
import {gameInteract,gameSnapshot,settleWheel} from './session-games';
export class ApiError extends Error{constructor(public code:string,public status=400){super(code);}}
export const fail=(code:string,status=400):never=>{throw new ApiError(code,status);};
export const hash=async(value:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(b=>b.toString(16).padStart(2,'0')).join('');
export async function batch(db:D1Database,statements:D1PreparedStatement[]){return db.batch(statements);}
export async function service(db:D1Database,req:Request,owner:string|null,ctx:TrainerContext={}){
 const url=new URL(req.url),method=req.method,now=Date.now();let b:any={};
 if(method==='POST')b=await readJson(req);
 if(['/api/drafts','/api/catalog','/api/branding','/api/admin'].includes(url.pathname)){
  if(!owner&&!(url.pathname==='/api/branding'&&method==='GET'))fail('SIGN_IN',401);return workspace(db,url,method,b,owner!,ctx);
 }
 if(url.pathname==='/api/sessions'){
  if(!owner)fail('SIGN_IN',401);
  if(method==='GET'){
   const reportScope=url.searchParams.get('reports')==='1',owners=reportScope&&ctx.role==='senior'?[owner,...ctx.reportOwners||[]]:[owner];
   const where=reportScope&&ctx.role==='admin'?'1=1':`owner IN (${owners.map(()=>'?').join(',')})`;
   return {sessions:(await db.prepare(`SELECT code,title,owner,language,teams,status,current,created_at,(SELECT COUNT(*) FROM players WHERE session=sessions.code) AS participants FROM sessions WHERE ${where} ORDER BY created_at DESC LIMIT 500`).bind(...(where==='1=1'?[]:owners)).all()).results};
  }
  if(method!=='POST')fail('METHOD',405);if(typeof b.title!=='string'||!b.title.trim()||b.title.length>100)fail('TITLE');
  let blueprint:any,deck:any;try{blueprint=validateDeck(b.activities);deck=flattenDeck(blueprint);}catch{fail('DECK');}
  const settings={tie:['shared','correct','speed'].includes(b.settings?.tie)?b.settings.tie:'shared',teamNames:Array.isArray(b.settings?.teamNames)&&b.settings.teamNames.length>=2&&b.settings.teamNames.length<=20?b.settings.teamNames.map((x:any)=>String(x).slice(0,40)):['Lightning','Wave'],progression:b.settings?.progression==='auto'?'auto':'manual',reveal:b.settings?.reveal==='manual'?'manual':'auto',surveyOnly:!!b.settings?.surveyOnly,teamScoring:b.settings?.teamScoring==='average'?'average':'sum'};
  if(settings.teamNames.some((x:string)=>!x.trim())||new Set(settings.teamNames).size!==settings.teamNames.length)fail('TEAM');
  const survey=b.survey?validateSurvey(b.survey):null;
  // Rejection sampling and insert retry avoid modulo bias and code collisions.
  for(let attempt=0;attempt<5;attempt++){
   const code=String(100000+fairIndex(900000));try{
    await db.prepare("INSERT INTO sessions(code,owner,title,language,teams,activities,status,current,revision,paused,remaining,created_at,settings,blueprint,runtime,anonymous_secret,survey) VALUES(?,?,?,?,?,?,?,-1,1,0,0,?,?,?,?,?,?)").bind(code,owner,b.title.trim(),b.language==='en'?'en':'ar',b.teams?1:0,JSON.stringify(deck),b.review===true?'ready':'lobby',now,JSON.stringify(settings),JSON.stringify(blueprint),'{}',crypto.randomUUID()+crypto.randomUUID(),survey?JSON.stringify(survey):null).run();await audit(db,owner!,code,'session-created',{steps:deck.length});return {code};
   }catch(e){if(attempt===4||!String(e).includes('UNIQUE constraint failed: sessions.code'))throw e;}
  }
 }
 const code=b.code||url.searchParams.get('code');if(!/^\d{6}$/.test(code||''))fail('CODE');
 let s:any=await db.prepare('SELECT * FROM sessions WHERE code=?').bind(code).first();if(!s)fail('NOT_FOUND',404);
 const requireHost=()=>{if(!owner||(s.owner!==owner&&ctx.role!=='admin'))fail('FORBIDDEN',403);};
 const requireReport=()=>{if(!owner||!(s.owner===owner||ctx.role==='admin'||ctx.role==='senior'&&ctx.reportOwners?.includes(s.owner)))fail('FORBIDDEN',403);};
 const settings=JSON.parse(s.settings||'{}'),deck=JSON.parse(s.activities),active=()=>deck[s.current];
 let rt=JSON.parse(s.runtime||'{}');
 // Timeout transitions use CAS; confirmed answers and ledgers remain immutable.
 if(s.status==='question'&&!s.paused&&s.deadline&&s.deadline<=now&&rt.phase!=='betting'){
  await db.prepare("UPDATE sessions SET status='results',paused=0,revision=revision+1 WHERE code=? AND revision=? AND status='question' AND paused=0 AND deadline<=?").bind(code,s.revision,now).run();s=await db.prepare('SELECT * FROM sessions WHERE code=?').bind(code).first();
 }
 if(s.status==='question'&&!s.paused&&rt.spin?.revealAt<=now){await settleWheel(db,s,active(),rt,now);s=await db.prepare('SELECT * FROM sessions WHERE code=?').bind(code).first();rt=JSON.parse(s.runtime||'{}');}
 if(s.status==='results'&&settings.progression==='auto'&&(settings.reveal!=='manual'||rt.keyRevealed)&&active()?.type!=='Meta Plan'&&active()?.type!=='Categorize'&&s.current+1<deck.length&&now-(s.deadline||now)>6000){const n=nextState(s,'next',now);await writeSession(db,s,n);s=await db.prepare('SELECT * FROM sessions WHERE code=?').bind(code).first();rt=JSON.parse(s.runtime||'{}');}
 const token=req.headers.get('X-Player-Token'),player:any=token?await db.prepare('SELECT * FROM players WHERE session=? AND token=?').bind(code,await hash(token)).first():null;
 if(url.pathname==='/api/recover'&&method==='POST'){
  let employeeId;try{employeeId=normalizeEmployeeId(b.employeeId);}catch{fail('EMPLOYEE_ID');}
  const employeeKey=await hash(code+':'+employeeId),recovery=normalizeRecoveryCode(b.recoveryCode);if(!/^[A-F0-9]{20}$/.test(recovery))fail('RECOVERY',401);const newToken=crypto.randomUUID()+crypto.randomUUID();
  const r=await db.prepare('UPDATE players SET token=? WHERE session=? AND employee_key=? AND recovery_hash=?').bind(await hash(newToken),code,employeeKey,await hash(code+':'+recovery)).run();if(!r.meta.changes)fail('RECOVERY',401);await audit(db,s.owner,code,'device-recovery');return {token:newToken};
 }
 if(url.pathname==='/api/join'&&method==='POST'){
  if(['ready','draft','completed','archived','survey'].includes(s.status))fail(['ready','draft'].includes(s.status)?'NOT_LAUNCHED':'ENDED');if(typeof b.name!=='string'||!b.name.trim()||b.name.trim().length>40)fail('NAME');
  let employeeId;try{employeeId=normalizeEmployeeId(b.employeeId);}catch{fail('EMPLOYEE_ID');}if(b.confirmed!==true)fail('CONFIRM_IDENTITY');const employeeKey=await hash(code+':'+employeeId);
  if(await db.prepare('SELECT id FROM players WHERE session=? AND employee_key=?').bind(code,employeeKey).first())fail('ALREADY_REGISTERED',409);
  const id=crypto.randomUUID(),newToken=crypto.randomUUID()+crypto.randomUUID(),team=s.teams?(settings.teamNames||['Lightning','Wave']).includes(b.team)?b.team:fail('TEAM'):null,recoveryCode=crypto.randomUUID().replace(/-/g,'').slice(0,20).toUpperCase(),approval=s.status==='lobby'?'approved':'pending';
  if(player&&!player.employee_id){const upgraded=await db.prepare('UPDATE players SET name=?,team=?,employee_key=?,employee_id=?,recovery_hash=? WHERE session=? AND id=? AND employee_id IS NULL').bind(b.name.trim(),team,employeeKey,employeeId,await hash(code+':'+recoveryCode),code,player.id).run();if(!upgraded.meta.changes)fail('ALREADY_REGISTERED',409);return {id:player.id,token,recoveryCode:recoveryCode.match(/.{1,5}/g)!.join('-')};}
  let r;try{r=await db.prepare("INSERT INTO players(session,id,token,name,team,eligible_from,joined_at,employee_key,employee_id,recovery_hash,approval,language) SELECT ?,?,?,?,?,current+1,?,?,?,?,?,? FROM sessions WHERE code=? AND status IN ('lobby','question','results') AND (SELECT COUNT(*) FROM players WHERE session=?)<80").bind(code,id,await hash(newToken),b.name.trim(),team,now,employeeKey,employeeId,await hash(code+':'+recoveryCode),approval,b.language==='en'?'en':'ar',code,code).run();}catch{fail('ALREADY_REGISTERED',409);}if(!r!.meta.changes)fail('FULL');return {id,token:newToken,approval,recoveryCode:recoveryCode.match(/.{1,5}/g)!.join('-')};
 }
 if(url.pathname==='/api/control'&&method==='POST'){
  requireHost();if(b.revision!==s.revision)fail('STALE',409);
  if(['approve','reject'].includes(b.action)){
   const r=await db.prepare("UPDATE players SET approval=?,eligible_from=? WHERE session=? AND id=? AND approval='pending'").bind(b.action==='approve'?'approved':'rejected',s.current+1,code,b.player).run();if(!r.meta.changes)fail('STATE',409);await audit(db,owner!,code,b.action,{player:b.player});return {ok:true};
  }
  if(b.action==='launch'){if(s.status!=='ready')fail('STATE',409);await db.prepare("UPDATE sessions SET status='lobby',revision=revision+1 WHERE code=? AND revision=?").bind(code,s.revision).run();return {ok:true};}
  if(b.action==='archive'){if(s.status!=='completed')fail('STATE',409);await db.prepare("UPDATE sessions SET status='archived',revision=revision+1 WHERE code=? AND revision=?").bind(code,s.revision).run();return {ok:true};}
  if(b.action==='duplicate'){const blueprint=JSON.parse(s.blueprint||s.activities);return service(db,new Request(url.origin+'/api/sessions',{method:'POST',body:JSON.stringify({title:s.title+' · Copy',language:s.language,teams:!!s.teams,activities:blueprint,settings,survey:s.survey?JSON.parse(s.survey):null,review:true})}),owner,ctx);}
  if(b.action==='editfuture'){
   if(['completed','archived','survey'].includes(s.status))fail('IMMUTABLE',409);
   let bp:any,next:any;try{bp=validateDeck(b.activities);next=flattenDeck(bp);}catch{fail('DECK');}if(next.length<=s.current)fail('IMMUTABLE',409);const historical=s.blueprint?deck:flattenDeck(validateDeck(deck));for(let i=0;i<=s.current;i++)if(JSON.stringify(next[i])!==JSON.stringify(historical[i]))fail('IMMUTABLE',409);
   const r=await db.prepare('UPDATE sessions SET blueprint=?,activities=?,revision=revision+1 WHERE code=? AND revision=?').bind(JSON.stringify(bp),JSON.stringify(next),code,s.revision).run();if(!r.meta.changes)fail('STALE',409);await audit(db,owner!,code,'future-edited',{from:s.current+1});return {ok:true};
  }
  if(['projection','revealkey','lockbets','survey','ceremony','highlight','notes','metareveal','stagecast','closesurvey'].includes(b.action)){
   if(b.action==='projection'){rt={...rt,board:!!b.board,quiet:!!b.quiet,intensity:['full','light','off'].includes(b.intensity)?b.intensity:'full',analytics:!!b.analytics};}
   if(b.action==='revealkey'){if(s.status!=='results')fail('STATE');rt.keyRevealed=true;}
   if(b.action==='metareveal'){if(s.status!=='results'||!active()?.assignments)fail('STATE');rt.metaCount=Math.min(active().items.length,(rt.metaCount||0)+1);rt.keyRevealed=true;}
   if(b.action==='revealkey')rt.metaCount=active()?.items?.length;
   if(b.action==='highlight')rt.highlight=b.index;
   if(b.action==='notes')rt.notes=String(b.notes||'').slice(0,3000);
   if(b.action==='closesurvey'){if(!['survey','completed'].includes(s.status))fail('STATE');rt.surveyOpen=false;rt.surveyFinished=true;if(s.status==='survey')s.status='completed';}
   if(b.action==='stagecast'){if(rt.phase!=='casting'||!Array.isArray(b.players)||!b.players.length)fail('STATE');const eligible:any[]=(await db.prepare("SELECT id,team FROM players WHERE session=? AND approval='approved' AND eligible_from<=?").bind(code,s.current).all()).results;if(b.players.some((id:string)=>!eligible.some(x=>x.id===id))||active().participation==='individual'&&b.players.length!==1||active().participation==='head-to-head'&&b.players.length!==2)fail('PLAYER');rt.targets=[...new Set(b.players)];rt.phase=active().betEnabled?'betting':'answering';s.started_at=now;s.deadline=active().betEnabled?null:now+active().timer*1000;}
   if(b.action==='lockbets'){if(rt.phase!=='betting'||s.status!=='question')fail('STATE');rt.phase='answering';s.deadline=now+active().timer*1000;s.started_at=now;}
   if(b.action==='survey'){if(!s.survey||!['lobby','results','completed'].includes(s.status))fail('STATE');s.status='survey';rt.surveyOpen=true;}
   if(b.action==='ceremony'){if(s.status!=='survey')fail('STATE');s.status='completed';rt.surveyFinished=true;rt.surveyOpen=false;}
   const written=await writeSession(db,s,{...s,runtime:JSON.stringify(rt),revision:s.revision+1});if(!written.meta.changes)fail('STALE',409);await audit(db,owner!,code,b.action,b.action==='notes'?{notes:rt.notes}:{round:s.current});return {ok:true};
  }
  if(['selectturn','spin','respin','box','override','hint'].includes(b.action))return gameInteract(db,s,active(),rt,null,b,now,true);
  if(b.action==='finish'&&s.survey&&!rt.surveyFinished){const survey=JSON.parse(s.survey);if(survey.stage==='before-ceremony'){await writeSession(db,s,{...s,status:'survey',runtime:JSON.stringify({...rt,surveyOpen:true}),revision:s.revision+1});return {ok:true};}rt.surveyAvailable=true;rt.surveyOpen=true;}
  let index=b.index;if(b.action==='reveal'&&active()?.type==='Spin Wheel')index=fairIndex(active().items.length);
  let n:any;try{n=nextState(s,b.action,now,index);}catch{fail('STATE',409);}if(b.action==='close'){n.deadline=now;n.runtime=JSON.stringify({...rt,keyRevealed:!['Meta Plan','Categorize'].includes(active()?.type)&&settings.reveal!=='manual',revealAt:now+(active()?.mainType==='Ultimate Game Show'?2000:0)});}
  if(b.action==='finish')n.runtime=JSON.stringify(rt);
  const r=await writeSession(db,s,n);if(!r.meta.changes)fail('STALE',409);await audit(db,owner!,code,b.action,{round:s.current});return {ok:true};
 }
 if(url.pathname==='/api/interact'&&method==='POST'){
  if(!player)fail('PLAYER',401);if(player.approval!=='approved')fail('PENDING',403);if(s.status!=='question'||s.paused||player.eligible_from>s.current||(s.deadline&&s.deadline<=now)||b.round!==s.current)fail('CLOSED',409);
  return gameInteract(db,s,active(),rt,player,b,now,false);
 }
 if(url.pathname==='/api/answer'&&method==='POST'){
  if(!player)fail('PLAYER',401);if(player.approval!=='approved')fail('PENDING',403);if(s.status!=='question'||s.paused||(s.deadline&&s.deadline<=now)||b.round!==s.current||player.eligible_from>s.current||['betting','casting'].includes(rt.phase)||rt.targets?.length&&!rt.targets.includes(player.id))fail('CLOSED',409);
  const a=active();if(presentation(a.type)||a.rooms||a.nodes)fail('PRESENTATION');let scored:any;try{scored=grade(a,b.answer,{remaining:s.deadline?s.deadline-now:1,duration:(a.timer*1000+(rt.addedTime||0))||1});}catch{fail('ANSWER');}
  if(!s.settings){try{const g=legacyEvaluate(a,b.answer);scored={points:g.graded&&g.correct?1000:0,correct:g.correct===null?null:Number(g.correct)};}catch{fail('ANSWER');}}
  if(a.betEnabled&&scored.correct){const bet:any=await db.prepare('SELECT data FROM progress WHERE session=? AND round=? AND actor=?').bind(code,s.current,player.id).first();scored.points+=2*(bet?JSON.parse(bet.data).bet||0:0);}
  const receipt=a.type==='Live Poll'&&a.anonymous?await hash(s.anonymous_secret+':poll:'+s.current+':'+player.id):null;
  const guard=" FROM sessions WHERE code=? AND current=? AND status='question' AND paused=0 AND (deadline IS NULL OR deadline>?) AND revision=?";
  try{
   let r;if(receipt){r=await db.prepare('INSERT INTO anonymous_responses(session,round,receipt,answer,created_at) SELECT ?,?,?,?,?'+guard).bind(code,s.current,receipt,JSON.stringify(b.answer),now,code,s.current,now,s.revision).run();}
   else {r=await db.prepare('INSERT INTO answers(session,round,player,answer,points,correct,created_at,elapsed_ms) SELECT ?,?,?,?,?,?,?,?'+guard).bind(code,s.current,player.id,JSON.stringify(b.answer),scored.points,scored.correct,now,Math.max(0,(a.timer*1000+(rt.addedTime||0))-(s.deadline?Math.min(a.timer*1000+(rt.addedTime||0),s.deadline-now):a.timer*1000)),code,s.current,now,s.revision).run();}
   if(!r.meta.changes)fail('CLOSED',409);
  }catch(e){if(e instanceof ApiError)throw e;if(a.type==='Live Poll'&&a.allowChanges){const table=receipt?'anonymous_responses':'answers',field=receipt?'receipt':'player';await db.prepare(`UPDATE ${table} SET answer=? WHERE session=? AND round=? AND ${field}=? AND EXISTS(SELECT 1 FROM sessions WHERE code=? AND status='question' AND paused=0 AND (deadline IS NULL OR deadline>?) AND revision=?)`).bind(JSON.stringify(b.answer),code,s.current,receipt||player.id,code,now,s.revision).run();}else fail('ALREADY_ANSWERED',409);}
  if(['Meta Plan','Categorize'].includes(a.type)&&a.autoClose){const count:any=await db.prepare("SELECT COUNT(*) AS n FROM players WHERE session=? AND approval='approved' AND eligible_from<=?").bind(code,s.current).first(),answers:any=await db.prepare('SELECT COUNT(*) AS n FROM answers WHERE session=? AND round=?').bind(code,s.current).first();if(count.n>0&&count.n===answers.n)await db.prepare("UPDATE sessions SET status='results',deadline=?,runtime=?,revision=revision+1 WHERE code=? AND revision=? AND status='question'").bind(now,JSON.stringify({...rt,keyRevealed:false}),code,s.revision).run();}
  return {ok:true};
 }
 if(url.pathname==='/api/survey'&&method==='POST'){
  if(!player||player.approval!=='approved')fail('PLAYER',401);if(!s.survey||!rt.surveyOpen||!['survey','completed'].includes(s.status))fail('CLOSED',409);const survey=JSON.parse(s.survey);if(!Array.isArray(b.answers)||b.answers.length!==survey.questions.length)fail('SURVEY');
  survey.questions.forEach((q:any,i:number)=>{const x=b.answers[i];if(q.kind==='rating'&&(!Number.isInteger(x)||x<1||x>5)||q.kind==='choice'&&(!Number.isInteger(x)||x<0||x>=q.options.length)||q.kind==='text'&&(typeof x!=='string'||x.trim().length===0||x.length>2000))fail('SURVEY');});
  const receipt=survey.anonymous?await hash(s.anonymous_secret+':survey:'+player.id):player.id;
  try{if(survey.anonymous)await db.prepare('INSERT INTO anonymous_responses(session,round,receipt,answer,created_at) VALUES(?,-1,?,?,?)').bind(code,receipt,JSON.stringify(b.answers),now).run();else await db.prepare('INSERT INTO answers(session,round,player,answer,points,correct,created_at) VALUES(?,-1,?,?,0,NULL,?)').bind(code,player.id,JSON.stringify(b.answers),now).run();}catch{fail('ALREADY_ANSWERED',409);}return {ok:true};
 }
 if(url.pathname==='/api/report'&&method==='GET'){
  requireReport();const players=(await db.prepare('SELECT id,name,employee_id,team,approval,joined_at FROM players WHERE session=?').bind(code).all()).results;
  const answers=(await db.prepare('SELECT round,player,answer,points,correct,created_at FROM answers WHERE session=? ORDER BY round,created_at').bind(code).all()).results;
  const anonymous=(await db.prepare('SELECT round,answer FROM anonymous_responses WHERE session=? ORDER BY round').bind(code).all()).results;
  const events=(await db.prepare('SELECT id,round,player,kind,points,detail,created_at FROM events WHERE session=? ORDER BY created_at').bind(code).all()).results;
  const audits=(await db.prepare('SELECT action,detail,created_at FROM audits WHERE session=? ORDER BY created_at').bind(code).all()).results;
  return {code,title:s.title,players,answers,anonymous,events,audits,survey:s.survey?JSON.parse(s.survey):null,settings,activities:JSON.parse(s.activities)};
 }
 if(url.pathname!=='/api/state'||method!=='GET')fail('NOT_FOUND',404);
 const host=url.searchParams.get('role')==='host';if(host)requireHost();
 const all:any[]=(await db.prepare('SELECT id AS uid,name,team,eligible_from,employee_id,approval,language FROM players WHERE session=? ORDER BY joined_at').bind(code).all()).results;
 const settled:any[]=(await db.prepare("SELECT player,SUM(points) AS total,SUM(correct) AS correct,SUM(elapsed_ms) AS elapsed FROM answers WHERE session=? AND round>=0 AND (round<? OR (? IN ('results','completed','survey','archived') AND round=?)) GROUP BY player").bind(code,s.current,s.status,s.current).all()).results;
 const events:any[]=(await db.prepare('SELECT player,SUM(points) AS total FROM events WHERE session=? GROUP BY player').bind(code).all()).results;
 const totals=Object.fromEntries(all.map(p=>[p.uid,0])),metrics:any={};for(const r of settled){totals[r.player]=r.total;metrics[r.player]={correct:r.correct||0,elapsed:r.elapsed||0};}for(const r of events)totals[r.player]=(totals[r.player]||0)+r.total;
 const roundAnswers:any[]=(await db.prepare('SELECT player,answer,points,correct FROM answers WHERE session=? AND round=?').bind(code,s.current).all()).results;
 const anon:any[]=(await db.prepare('SELECT receipt,answer FROM anonymous_responses WHERE session=? AND round=?').bind(code,s.current).all()).results;
 const closed=['results','completed','survey','archived'].includes(s.status),a=active()??null,revealed=closed&&(['Meta Plan','Categorize'].includes(a?.type)?rt.keyRevealed===true:(settings.reveal!=='manual'||rt.keyRevealed))&&!(rt.revealAt>now);
 const mine=roundAnswers.find(x=>x.player===player?.id);
 let ownAnon:any=null;if(player&&a?.anonymous){const receipt=await hash(s.anonymous_secret+':poll:'+s.current+':'+player.id);ownAnon=anon.find(x=>x.receipt===receipt);}
 const responses=[...roundAnswers,...anon],tally=a?.options?a.options.map((_:any,i:number)=>responses.filter(r=>JSON.parse(r.answer)===i).length):null;
 const boards=scoreboards(all,totals,settings.tie||'shared',metrics,settings.teamScoring);
 let surveySubmitted=false;if(player&&s.survey){const survey=JSON.parse(s.survey),receipt=await hash(s.anonymous_secret+':survey:'+player.id);surveySubmitted=!!(survey.anonymous?await db.prepare('SELECT 1 FROM anonymous_responses WHERE session=? AND round=-1 AND receipt=?').bind(code,receipt).first():await db.prepare('SELECT 1 FROM answers WHERE session=? AND round=-1 AND player=?').bind(code,player.id).first());}
 let pub=publicActivity(a,{closed:revealed,reveal:s.reveal});if(pub?.assignments&&rt.metaCount)pub.assignments=pub.assignments.map((x:number,i:number)=>i<rt.metaCount?x:-1);if(['betting','casting'].includes(rt.phase)&&pub){pub={...pub,prompt:a.section||a.mainType,options:[],correct:undefined};}
 return {code:s.code,title:s.title,language:s.language,teamMode:!!s.teams,surveyOnly:!!settings.surveyOnly,teamNames:settings.teamNames||['Lightning','Wave'],settings:host?settings:undefined,status:s.status,current:s.current,revision:s.revision,deadline:s.deadline,paused:!!s.paused,remaining:s.remaining,reveal:s.reveal,serverNow:now,queue:deck.map((x:any,i:number)=>({type:x.type,mainType:x.mainType,prompt:host||i<s.current||i===s.current&&!['betting','casting'].includes(rt.phase)?x.prompt:x.mainType||x.type,timer:x.timer,group:x.group,step:x.step})),activity:pub,players:all.filter(p=>host||p.approval==='approved').map(({eligible_from,employee_id,...p})=>host?{...p,employeeId:employee_id}:p),...boards,submitted:responses.length,tally:revealed||a?.type==='Live Poll'&&a.liveResults?tally:null,pollSummary:a?.type==='Live Poll'&&(revealed||a.liveResults)?summarizePoll(a,responses.map(x=>JSON.parse(x.answer))):null,metaSummary:a?.assignments&&(host||rt.analytics)?a.items.map((_:any,i:number)=>a.categories.map((_:any,j:number)=>roundAnswers.filter(x=>JSON.parse(x.answer)[i]===j).length)):null,keyRevealed:revealed,runtime:{phase:rt.phase,targets:rt.targets||[],board:!!rt.board,quiet:!!rt.quiet,intensity:rt.intensity||'full',analytics:!!rt.analytics,highlight:rt.highlight,notes:host?rt.notes:undefined},mine:player?{id:player.id,name:player.name,employeeId:player.employee_id,approval:player.approval,language:player.language,eligible:player.approval==='approved'&&player.eligible_from<=s.current&&(!rt.targets?.length||rt.targets.includes(player.id)),answered:!!(mine||ownAnon),answer:mine?JSON.parse(mine.answer):ownAnon?JSON.parse(ownAnon.answer):null,points:revealed&&mine?mine.points:null,correct:revealed&&mine?mine.correct:null}:null,survey:closed&&s.survey?JSON.parse(s.survey):null,surveySubmitted,surveyOpen:!!rt.surveyOpen,surveyCount:s.survey?Number((await db.prepare('SELECT (SELECT COUNT(*) FROM answers WHERE session=? AND round=-1)+(SELECT COUNT(*) FROM anonymous_responses WHERE session=? AND round=-1) AS n').bind(code,code).first() as any).n):0,...await gameSnapshot(db,s,a,rt,player,host,now),...(host?{owner:s.owner,activities:deck,blueprint:JSON.parse(s.blueprint||s.activities),surveyDefinition:s.survey?JSON.parse(s.survey):null,metaAnalytics:a?.assignments?roundAnswers.map(x=>({player:x.player,answer:JSON.parse(x.answer)})):null}:{})};
}
export async function writeSession(db:D1Database,s:any,n:any){return db.prepare('UPDATE sessions SET status=?,current=?,revision=?,started_at=?,deadline=?,paused=?,remaining=?,reveal=?,runtime=? WHERE code=? AND revision=?').bind(n.status,n.current,n.revision,n.started_at??null,n.deadline??null,n.paused,n.remaining,n.reveal??null,n.runtime||s.runtime||'{}',s.code,s.revision).run();}
function summarizePoll(a:any,answers:any[]){if(a.pollKind==='word'){const words:any={};answers.forEach(x=>{const key=String(x).trim().toLowerCase();words[key]=(words[key]||0)+1;});return {words};}if(a.pollKind==='rating')return {average:answers.length?answers.reduce((x,y)=>x+y,0)/answers.length:0,count:answers.length};if(a.pollKind==='priority')return {ranking:a.options.map((label:string,i:number)=>({label,value:answers.reduce((n,order)=>n+a.options.length-order.indexOf(i),0)})).sort((x:any,y:any)=>y.value-x.value)};return null;}
