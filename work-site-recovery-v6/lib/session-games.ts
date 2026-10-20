import {publicActivity,evaluate,grade,fairIndex,unscored} from './domain.mjs';
import {fail,batch,writeSession} from './service';
import {audit} from './workspace';
import {isPrizeLadder,previouslyUsedLifelines,contestantKnockouts} from './show-rules.mjs';
const read=async(db:D1Database,s:any,actor:string)=>{const row:any=await db.prepare('SELECT data,version FROM progress WHERE session=? AND round=? AND actor=?').bind(s.code,s.current,actor).first();return {data:row?JSON.parse(row.data):{},version:row?.version??0};};
const groupActor=(a:any,p:any)=>a.type==='Escape Room'&&a.mode==='collaborative'?'collaborative':a.type==='Escape Room'&&a.mode==='team'?'team:'+p.team:p.id;
async function saveProgress(db:D1Database,s:any,actor:string,old:any,data:any,events:any[]=[],now=Date.now(),after:D1PreparedStatement[]=[]){
 const guard="EXISTS(SELECT 1 FROM sessions WHERE code=? AND current=? AND revision=? AND status='question' AND paused=0 AND (deadline IS NULL OR deadline>?))"+(old.version?" AND EXISTS(SELECT 1 FROM progress WHERE session=? AND round=? AND actor=? AND version=?)":"");
 const guardArgs=old.version?[s.code,s.current,s.revision,now,s.code,s.current,actor,old.version]:[s.code,s.current,s.revision,now];
 const statements=events.map(e=>db.prepare('INSERT INTO events(session,id,player,round,kind,points,detail,created_at) SELECT ?,?,?,?,?,?,?,? WHERE '+guard).bind(s.code,e.id,e.player,s.current,e.kind,e.points,JSON.stringify(e.detail||{}),now,...guardArgs));
 const statement=old.version?db.prepare('UPDATE progress SET data=?,version=version+1 WHERE session=? AND round=? AND actor=? AND version=? AND '+guard).bind(JSON.stringify(data),s.code,s.current,actor,old.version,...guardArgs):db.prepare('INSERT INTO progress(session,round,actor,data,version) SELECT ?,?,?,?,1 WHERE '+guard).bind(s.code,s.current,actor,JSON.stringify(data),...guardArgs);
 // A stale progress version must abort the whole batch, including any score event.
 statements.push(statement,...after);
 try{const results=await batch(db,statements);if(!results[events.length]?.meta.changes)fail('STALE',409);}catch(e){if((e as any).code)throw e;fail('STALE',409);}
}
export async function settleWheel(db:D1Database,s:any,a:any,rt:any,now:number){
 if(!rt.spin||rt.spin.revealed||rt.spin.revealAt>now)return;
 const spin={...rt.spin,revealed:true},sector=a.sectors?.[spin.index],points=['question','challenge'].includes(sector?.kind)?0:Math.round((sector?.points??0)*(a.weight??1));
 const next={...rt,spin,used:sector?.repeatable?rt.used:[...new Set([...(rt.used||[]),spin.index])],turn:(rt.turn||0)+1,target:null};
 const statements:D1PreparedStatement[]=[];
 if(spin.target)statements.push(db.prepare("INSERT INTO events(session,id,player,round,kind,points,detail,created_at) SELECT ?,?,?,?,?,?,?,? FROM sessions WHERE code=? AND revision=?").bind(s.code,`wheel:${s.current}:${spin.id}`,spin.target,s.current,'wheel',points,JSON.stringify({sector:spin.index,turn:rt.turn}),now,s.code,s.revision));
 statements.push(db.prepare('UPDATE sessions SET runtime=?,reveal=?,revision=revision+1 WHERE code=? AND revision=?').bind(JSON.stringify(next),spin.index,s.code,s.revision));
 try{await batch(db,statements);}catch{/* another request settled the same immutable outcome */}
}
export async function gameInteract(db:D1Database,s:any,a:any,rt:any,p:any,b:any,now:number,host:boolean){
 if(s.status!=='question'||s.paused)fail('CLOSED',409);
 if(['selectturn','spin','respin','box'].includes(b.action)){
  if(!['Wheel of Fortune','Spin Wheel','Open the Box'].includes(a.type))fail('STATE',409);
  const players:any[]=(await db.prepare("SELECT id,name,team FROM players WHERE session=? AND approval='approved' AND eligible_from<=? ORDER BY joined_at").bind(s.code,s.current).all()).results;if(!players.length)fail('PLAYER');
  let target=rt.target||players[(rt.turn||0)%players.length].id;
  if(b.action==='selectturn'){if(!host)fail('FORBIDDEN',403);if(b.mode==='random')target=players[fairIndex(players.length)].id;else if(b.player){if(!players.some(x=>x.id===b.player))fail('PLAYER');target=b.player;}rt={...rt,target};}
  else {
   if(!host&&b.turn!==rt.turn&&b.turn!==(rt.turn||0))fail('STALE',409);
   if(!host&&p?.id!==target)fail('FORBIDDEN',403);
   if(rt.spin&&!rt.spin.revealed)fail('STATE',409);
   if(rt.box&&a.boxes?.[rt.box.index]?.question){const oldBox=await read(db,s,rt.box.target);if(!oldBox.data.boxes?.includes(rt.box.id))fail('STATE',409);}
   if(rt.spin?.revealed&&a.sectors?.[rt.spin.index]?.kind==='question'){const old=await read(db,s,`wheel:${rt.spin.id}:${rt.spin.target}`);if((old.data.step||0)<a.sectors[rt.spin.index].questions.length)fail('STATE',409);}
   if((rt.turn||0)>=(a.rounds??a.items?.length??1)&&b.action!=='respin')fail('ROUNDS_COMPLETE',409);
   if(b.action==='respin'){if(!host||typeof b.reason!=='string'||b.reason.trim().length<5)fail('REASON');if(rt.spin?.revealed)fail('IMMUTABLE',409);await audit(db,s.owner,s.code,'wheel-respin',{reason:b.reason,previous:rt.spin?.id});}
   if(b.action==='box'){
    const i=b.index;if(!Number.isInteger(i)||i<0||i>=a.items.length||rt.used?.includes(i)&&!a.repeatable)fail('STATE',409);const box=a.boxes?.[i],id=crypto.randomUUID();rt={...rt,target,box:{id,index:i,target,done:!box?.question},used:[...(rt.used||[]),i],turn:(rt.turn||0)+1};
    const points=box&&!box.question?Math.round((box.points||0)*(a.weight??1)):0;
    const statements:D1PreparedStatement[]=[];if(target)statements.push(db.prepare('INSERT INTO events(session,id,player,round,kind,points,detail,created_at) SELECT ?,?,?,?,?,?,?,? FROM sessions WHERE code=? AND revision=?').bind(s.code,'box:'+id,target,s.current,'box',points,JSON.stringify({box:i}),now,s.code,s.revision));
    statements.push(db.prepare('UPDATE sessions SET runtime=?,reveal=?,revision=revision+1 WHERE code=? AND revision=?').bind(JSON.stringify(rt),i,s.code,s.revision));const result=await batch(db,statements);if(!result.at(-1)?.meta.changes)fail('STALE',409);return {ok:true};
   }else if(b.action!=='selectturn'){
    const sectors=a.sectors||a.items.map((label:string)=>({label,repeatable:true}));const available=sectors.map((_:any,i:number)=>i).filter((i:number)=>sectors[i].repeatable||!rt.used?.includes(i));if(!available.length)fail('ROUNDS_COMPLETE',409);
    const index=available[fairIndex(available.length)],id=crypto.randomUUID(),duration=(a.spinDuration??6)*1000;rt={...rt,target,spin:{id,index,target,startsAt:now+3000,stopsAt:now+3000+duration,revealAt:now+3000+duration+150,revealed:false}};
   }
  }
  const r=await writeSession(db,s,{...s,runtime:JSON.stringify(rt),revision:s.revision+1});if(!r.meta.changes)fail('STALE',409);return {ok:true};
 }
 if(host&&['override','hint'].includes(b.action)){
  if(a.type!=='Escape Room'||!b.player||typeof b.reason!=='string'||b.reason.trim().length<5)fail('REASON');
  const target:any=await db.prepare('SELECT id,team FROM players WHERE session=? AND id=?').bind(s.code,b.player).first();if(!target)fail('PLAYER');const actor=groupActor(a,target),old=await read(db,s,actor),d={...old.data};
  if(b.action==='hint')d.hostHint=String(b.hint||a.rooms[d.room||0]?.hint||'').slice(0,1000);
  else {const room=d.room||0;d.room=Math.min(a.rooms.length,room+1);d.puzzle=0;d.overrides=[...(d.overrides||[]),{room,reason:b.reason}];}
  await saveProgress(db,s,actor,old,d);await audit(db,s.owner,s.code,'escape-'+b.action,{player:b.player,reason:b.reason});return {ok:true};
 }
 if(!p)fail('PLAYER',401);
 const actor=groupActor(a,p),old=await read(db,s,actor),d={...old.data},events:any[]=[],after:D1PreparedStatement[]=[];
 if(!['miniquiz'].includes(b.action)&&b.version!==old.version)fail('STALE',409);
 if(b.action==='bet'){
  if(rt.targets?.length&&!rt.targets.includes(p.id))fail('FORBIDDEN',403);if(rt.phase!=='betting'||!a.betEnabled||d.bet!=null||!Number.isInteger(b.amount)||b.amount<0||b.amount>10000)fail('STATE',409);
  const sums:any=await db.prepare('SELECT (SELECT COALESCE(SUM(points),0) FROM answers WHERE session=? AND player=?)+(SELECT COALESCE(SUM(points),0) FROM events WHERE session=? AND player=?) AS score').bind(s.code,p.id,s.code,p.id).first();if(b.amount>sums.score)fail('BET');d.bet=b.amount;events.push({id:`bet:${s.current}:${p.id}`,player:p.id,kind:'bet',points:-b.amount});
 }else if(b.action==='lifeline'){
  if(a.mainType!=='Ultimate Game Show'||['betting','casting'].includes(rt.phase)||rt.targets?.length&&!rt.targets.includes(p.id))fail('STATE');d.lifelines=d.lifelines||[];
  const history=isPrizeLadder(a)?(await db.prepare('SELECT round,data FROM progress WHERE session=? AND actor=? AND round<?').bind(s.code,p.id,s.current).all()).results:[];
  const exhausted=previouslyUsedLifelines(JSON.parse(s.activities),s.current,history);
  if(!['fifty','audience','time'].includes(b.kind)||d.lifelines.includes(b.kind)||exhausted.includes(b.kind))fail('STATE');
  d.lifelines.push(b.kind);
  if(b.kind==='fifty'){if(!a.options||a.options.length<3)fail('STATE');d.eliminated=a.options.map((_:any,i:number)=>i).filter((i:number)=>i!==a.correct).slice(0,2);}
  if(b.kind==='audience')d.audience=true;
  if(b.kind==='time'){if(!s.deadline||s.deadline<=now)fail('STATE');d.mutation=crypto.randomUUID();after.push(db.prepare("UPDATE sessions SET deadline=deadline+30000,revision=revision+1 WHERE code=? AND revision=? AND EXISTS(SELECT 1 FROM progress WHERE session=? AND round=? AND actor=? AND json_extract(data,'$.mutation')=?)").bind(s.code,s.revision,s.code,s.current,actor,d.mutation));}
 }else if(b.action==='audience'){
  if(a.mainType!=='Ultimate Game Show'||!Number.isInteger(b.choice)||b.choice<0||b.choice>=a.options.length||d.audienceVote!=null)fail('STATE');d.audienceVote=b.choice;
 }else if(a.type==='Flashcards'){
  // Host-only reveal is a server-enforced content-authoring permission, not
  // merely a disabled client button. Refuse forged learner flip/card commands.
  if(a.flipPermission==='host'&&['flip','card'].includes(b.action))fail('FORBIDDEN',403);
  if(!['flip','card','selfassess'].includes(b.action))fail('ACTION');
  if(!Number.isInteger(b.index)||b.index<0||b.index>=a.fronts.length)fail('ANSWER');
  d.card=b.index;
  if(['flip','card'].includes(b.action))d.flipped=b.action==='flip';
  d.reviewed=[...new Set([...(d.reviewed||[]),b.index])];
  if(b.action==='selfassess')d.assessment={...(d.assessment||{}),[b.index]:b.known===true};
 }else if(a.type==='Escape Room'){
  const room=d.room||0,puzzle=d.puzzle||0,r=a.rooms[room];if(!r)fail('CLOSED',409);d.attempts=d.attempts||0;
  if(b.action==='hint'){if(d.attempts<(r.hintAfter??1))fail('HINT_LOCKED');d.hint=r.hint;}
  else if(b.action==='puzzle'){
   const q=r.puzzles[puzzle];if(r.seconds&&now>((d.roomClock||s.started_at)+r.seconds*1000+(rt.pausedTotal||0)))fail('TIMEOUT');if(!q)fail('STATE');let g:any;try{g=evaluate(q,b.answer);}catch{fail('ANSWER');}d.attempts++;d.lastCorrect=!!g.evaluation;
   if(g.evaluation){const eventId=`escape:${s.current}:${actor}:${room}:${puzzle}`;if(a.scored!==false&&!d.credited?.includes(eventId))events.push({id:eventId,player:p.id,kind:'escape',points:Math.round((q.points??1000)*(a.weight??1)),detail:{actor,room,puzzle}});d.credited=[...new Set([...(d.credited||[]),eventId])];d.history=[...(d.history||[]),{room,puzzle,answer:b.answer,correct:true}];d.puzzle=puzzle+1;if(d.puzzle>=(r.unlockAfter||r.puzzles.length)){d.room=room+1;d.roomClock=now-(rt.pausedTotal||0);d.puzzle=0;d.hint=null;d.attempts=0;}}
   else if(r.wrongPolicy==='restart-room')d.puzzle=0;
  }else fail('ACTION');
 }else if(a.type==='Scenario Challenge'&&a.nodes){
  if(b.action!=='decision')fail('ACTION');const node=a.nodes.find((x:any)=>x.id===(d.node||a.start));if(!node||node.ending||!Number.isInteger(b.choice)||!node.choices[b.choice])fail('STATE');const c=node.choices[b.choice];d.node=c.next;d.consequence=c.consequence;d.path=[...(d.path||[]),{node:node.id,choice:b.choice,consequence:c.consequence}];
  if(a.scored!==false&&c.points)events.push({id:`scenario:${s.current}:${p.id}:${node.id}`,player:p.id,kind:'scenario',points:Math.round(c.points*(a.weight??1)),detail:{node:node.id,choice:b.choice}});
 }else if(['Wheel of Fortune','Spin Wheel'].includes(a.type)&&b.action==='miniquiz'){
  if(!rt.spin?.revealed||rt.spin.target!==p.id)fail('FORBIDDEN',403);const sector=a.sectors[rt.spin.index];if(sector.kind!=='question')fail('STATE');const miniActor=`wheel:${rt.spin.id}:${p.id}`,miniOld=await read(db,s,miniActor),md={...miniOld.data},step=md.step||0,q=sector.questions[step];if(b.version!==miniOld.version)fail('STALE',409);if(!q)fail('CLOSED');const deadline=(md.clock||rt.spin.revealAt-(rt.pausedTotal||0))+q.timer*1000+(rt.pausedTotal||0);let g:any;if(now>=deadline)g={points:0,correct:false};else try{g=grade({...q,weight:a.weight??1,speed:true},b.answer,{remaining:deadline-now,duration:q.timer*1000});}catch{fail('ANSWER');}md.step=step+1;md.clock=now-(rt.pausedTotal||0);md.lastCorrect=!!g.correct;events.push({id:`mini:${rt.spin.id}:${step}`,player:p.id,kind:'wheel-quiz',points:g.points,detail:{step}});await saveProgress(db,s,miniActor,miniOld,md,events,now);return {ok:true};
 }else if(a.type==='Open the Box'&&b.action==='boxquiz'){
  if(!rt.box||rt.box.target!==p.id)fail('FORBIDDEN',403);const box=a.boxes?.[rt.box.index];if(!box?.question||d.boxes?.includes(rt.box.id))fail('STATE');let g:any;try{g=grade({...box.question,weight:a.weight??1},b.answer);}catch{fail('ANSWER');}d.boxes=[...(d.boxes||[]),rt.box.id];events.push({id:`boxquiz:${rt.box.id}`,player:p.id,kind:'box-quiz',points:g.points});
 }else fail('ACTION');
 await saveProgress(db,s,actor,old,d,events,now,after);return {ok:true};
}
export async function gameSnapshot(db:D1Database,s:any,a:any,rt:any,p:any,host:boolean,now:number){
 if(!a)return {};
 const actor=p?groupActor(a,p):'',old=p?await read(db,s,actor):{data:{},version:0},d:any=old.data,game:any={version:old.version||0};
 if(['Wheel of Fortune','Spin Wheel','Open the Box'].includes(a.type)){
  const players:any[]=(await db.prepare("SELECT id AS uid,name,team FROM players WHERE session=? AND approval='approved' AND eligible_from<=? ORDER BY joined_at").bind(s.code,s.current).all()).results;
  game.target=rt.target||players[(rt.turn||0)%Math.max(1,players.length)]?.uid;game.turn=rt.turn||0;game.rounds=a.rounds??a.items?.length??1;game.used=rt.used||[];
  if(rt.spin){game.spinTarget=rt.spin.target;game.spin={id:rt.spin.id,startsAt:rt.spin.startsAt,stopsAt:rt.spin.stopsAt,revealAt:rt.spin.revealAt,revealed:!!rt.spin.revealed,index:now>=rt.spin.stopsAt?rt.spin.index:null};if(rt.spin.revealed){const sector=a.sectors?.[rt.spin.index];game.outcome=sector?{label:sector.label,kind:sector.kind,detail:sector.detail,points:sector.points||0}:a.items[rt.spin.index];if(sector?.kind==='question'){const md=await read(db,s,`wheel:${rt.spin.id}:${rt.spin.target}`),q=sector.questions[md.data.step||0];game.mini={version:md.version,step:md.data.step||0,total:sector.questions.length,question:q?publicActivity(q):null,deadline:q?(md.data.clock||rt.spin.revealAt-(rt.pausedTotal||0))+q.timer*1000+(rt.pausedTotal||0):null,lastCorrect:md.data.lastCorrect};}}}
  if(rt.box){const box=a.boxes?.[rt.box.index];game.box={id:rt.box.id,target:rt.box.target,index:rt.box.index,label:a.items[rt.box.index],detail:box?.detail,question:box?.question?publicActivity(box.question):null,answered:!!d.boxes?.includes(rt.box.id)};}
 }
 if(a.type==='Flashcards'&&p){game.card=d.card??0;game.flipped=!!d.flipped;game.back=d.flipped?a.backs[d.card??0]:null;game.reviewed=d.reviewed||[];game.assessment=d.assessment||{};}
 if(a.type==='Escape Room'){
  const r=a.rooms[d.room||0],q=r?.puzzles[d.puzzle||0];game.escape=p?{room:d.room||0,puzzle:d.puzzle||0,totalRooms:a.rooms.length,title:r?.title,narrative:r?.narrative,hint:d.hostHint||d.hint,hintAvailable:(d.attempts||0)>=(r?.hintAfter??1),attempts:d.attempts||0,lastCorrect:d.lastCorrect,question:q?publicActivity(q):null,escaped:!r,deadline:r?.seconds?(d.roomClock||s.started_at)+r.seconds*1000+(rt.pausedTotal||0):null,history:d.history||[]}:null;
  if(host)game.progress=(await db.prepare('SELECT actor,data FROM progress WHERE session=? AND round=?').bind(s.code,s.current).all()).results.map((x:any)=>{const d=JSON.parse(x.data);return {actor:x.actor,room:d.room||0,puzzle:d.puzzle||0,attempts:d.attempts||0};});
 }
 if(a.nodes&&p){const node=a.nodes.find((n:any)=>n.id===(d.node||a.start));game.scenario={text:node.text,ending:!!node.ending,discussion:node.discussion,choices:node.choices?.map((c:any)=>({label:c.label})),consequence:d.consequence,path:d.path||[]};}
 if(a.mainType==='Ultimate Game Show'){
  game.lifelines=d.lifelines||[];game.eliminated=d.eliminated||[];
  if(isPrizeLadder(a)){
   const earlier=p?(await db.prepare('SELECT round,data FROM progress WHERE session=? AND actor=? AND round<?').bind(s.code,p.id,s.current).all()).results:[];
   game.lifelines=[...new Set([...previouslyUsedLifelines(JSON.parse(s.activities),s.current,earlier),...game.lifelines])];
   const casts:any[]=(await db.prepare("SELECT detail FROM audits WHERE session=? AND action='stagecast'").bind(s.code).all()).results;
   const previousAnswers:any[]=(await db.prepare('SELECT round,player,correct FROM answers WHERE session=? AND round<?').bind(s.code,s.current).all()).results;
   game.eliminated=contestantKnockouts(JSON.parse(s.activities),s.current,casts,previousAnswers);
  }
  game.bet=d.bet??null;game.audienceRequested=!!d.audience;
  const allProgress:any[]=(await db.prepare('SELECT data FROM progress WHERE session=? AND round=?').bind(s.code,s.current).all()).results.map((x:any)=>JSON.parse(x.data));game.audienceRequested=allProgress.some(x=>x.audience);const audience=allProgress.filter(x=>x.audienceVote!=null);game.audience=a.options?.map((_:any,i:number)=>audience.filter(x=>x.audienceVote===i).length)||[];
 }
 return {game};
}
