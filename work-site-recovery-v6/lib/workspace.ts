import {validateDeck,validateActivity} from './domain.mjs';
import {ApiError} from './service';
export type TrainerContext={uid?:string;role?:string;name?:string;email?:string;reportOwners?:string[];provision?:(input:any)=>Promise<any>};
const fail=(c:string,status=400):never=>{throw new ApiError(c,status);};
export async function audit(db:D1Database,owner:string,session:string|null,action:string,detail:any={}){await db.prepare('INSERT INTO audits(id,session,owner,action,detail,created_at) VALUES(?,?,?,?,?,?)').bind(crypto.randomUUID(),session,owner,action,JSON.stringify(detail),Date.now()).run();}
export function validateSurvey(s:any){if(!s||typeof s.title!=='string'||!s.title.trim()||!Array.isArray(s.questions)||!s.questions.length||s.questions.length>100)fail('SURVEY');for(const q of s.questions){if(typeof q.prompt!=='string'||!q.prompt.trim()||!['rating','choice','text'].includes(q.kind))fail('SURVEY');if(q.kind==='choice'&&(!Array.isArray(q.options)||q.options.length<2||q.options.length>20||q.options.some((x:any)=>typeof x!=='string'||!x.trim())))fail('SURVEY');}return {...s,anonymous:s.anonymous!==false,stage:s.stage==='before-ceremony'?'before-ceremony':'after-ceremony'};}
export async function workspace(db:D1Database,url:URL,method:string,b:any,owner:string,ctx:TrainerContext){
 const path=url.pathname,now=Date.now(),admin=ctx.role==='admin';
 if(path==='/api/drafts'){
  if(method==='GET'){const kind=url.searchParams.get('kind');return {items:(await db.prepare("SELECT id,owner,title,payload,kind,visibility,version,updated_at FROM drafts WHERE (owner=? OR visibility='shared') AND visibility!='deleted'"+(kind?' AND kind=?':'')+' ORDER BY updated_at DESC LIMIT 500').bind(...(kind?[owner,kind]:[owner])).all()).results.map((x:any)=>({...x,payload:JSON.parse(x.payload),editable:x.owner===owner||admin}))};}
  const kind=b.kind||'session';if(!['session','template','question','media','survey','team'].includes(kind))fail('INVALID');if(typeof b.title!=='string'||!b.title.trim()||b.title.length>100)fail('TITLE');
  const old:any=b.id?await db.prepare('SELECT * FROM drafts WHERE id=?').bind(b.id).first():null;if(old&&old.owner!==owner&&!admin)fail('FORBIDDEN',403);if(old&&b.version!==old.version)fail('STALE',409);
  let payload=b.payload;
  try{if(['session','template'].includes(kind)){validateDeck(payload.activities);if(payload.survey)validateSurvey(payload.survey);}if(kind==='question')validateActivity(payload);if(kind==='survey')payload=validateSurvey(payload);if(kind==='media'&&(!/^https:\/\//.test(payload.url)||payload.url.length>2048))fail('MEDIA');if(kind==='team'&&(!Array.isArray(payload.names)||payload.names.length<2||payload.names.length>20||payload.names.some((x:any)=>typeof x!=='string'||!x.trim())))fail('TEAM');}catch{fail('DECK');}
  const id=old?.id||crypto.randomUUID(),visibility=b.visibility==='shared'?'shared':b.visibility==='deleted'?'deleted':'personal';
  if(old){const r=await db.prepare('UPDATE drafts SET title=?,payload=?,kind=?,visibility=?,version=version+1,updated_at=? WHERE id=? AND version=?').bind(b.title,JSON.stringify(payload),kind,visibility,now,id,old.version).run();if(!r.meta.changes)fail('STALE',409);}
  else await db.prepare('INSERT INTO drafts(id,owner,title,payload,kind,visibility,version,updated_at) VALUES(?,?,?,?,?,?,1,?)').bind(id,owner,b.title,JSON.stringify(payload),kind,visibility,now).run();
  return {id,version:(old?.version||0)+1,savedAt:now};
 }
 if(path==='/api/catalog'){return {sessions:(await db.prepare("SELECT code,title,owner,status,language,teams,created_at FROM sessions WHERE status!='draft' ORDER BY created_at DESC LIMIT 500").all()).results.map((x:any)=>({...x,editable:x.owner===owner||admin}))};}
 if(path==='/api/branding'){
  if(method==='GET'){const row:any=await db.prepare("SELECT payload FROM settings WHERE id='branding'").first();return {...(row?JSON.parse(row.payload):{mts:'/mts-transparent.png',training:'/training-transparent.png',primary:'#218e5b',blue:'#176aa4',navy:'#0c2545'}),showRulesVersion:1};}
  if(!admin)fail('ADMIN_ONLY',403);for(const key of ['mts','training'])if(typeof b[key]!=='string'||!/^https:\/\/|^\/[^/]/.test(b[key]))fail('MEDIA');for(const key of ['primary','blue','navy'])if(!/^#[0-9a-f]{6}$/i.test(b[key]))fail('INVALID');
  const payload=Object.fromEntries(['mts','training','primary','blue','navy'].map(k=>[k,b[k]]));await db.prepare("INSERT INTO settings(id,payload,updated_at) VALUES('branding',?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at").bind(JSON.stringify(payload),now).run();await audit(db,owner,null,'branding-updated');return {ok:true};
 }
 if(path==='/api/admin'){
  if(!admin)fail('ADMIN_ONLY',403);
  if(method==='GET')return {trainers:(await db.prepare('SELECT uid,email,name,role,enabled,report_owners FROM trainer_profiles ORDER BY name').all()).results,canProvision:!!ctx.provision};
  if(b.action==='create'){
   if(!ctx.provision)fail('ADMIN_SETUP',503);if(!['trainer','senior','admin'].includes(b.role)||typeof b.email!=='string'||typeof b.name!=='string'||typeof b.password!=='string'||b.password.length<10)fail('INVALID');
   const account=await ctx.provision!(b);await db.prepare('INSERT INTO trainer_profiles(uid,email,name,role,enabled,report_owners,updated_at) VALUES(?,?,?,?,1,?,?)').bind(account.uid,b.email,b.name,b.role,JSON.stringify(b.reportOwners||[]),now).run();await audit(db,owner,null,'trainer-created',{uid:account.uid,role:b.role});return {uid:account.uid};
  }
  if(b.uid===ctx.uid&&(b.enabled===false||b.role!=='admin'))fail('SELF_ROLE');if(!['trainer','senior','admin'].includes(b.role))fail('INVALID');
  const r=await db.prepare('UPDATE trainer_profiles SET role=?,enabled=?,report_owners=?,updated_at=? WHERE uid=?').bind(b.role,b.enabled===false?0:1,JSON.stringify(b.reportOwners||[]),now,b.uid).run();if(!r.meta.changes)fail('NOT_FOUND',404);await audit(db,owner,null,'trainer-role',{uid:b.uid,role:b.role,enabled:b.enabled!==false});return {ok:true};
 }
 return undefined;
}
