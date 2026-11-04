/**
 * Experience 2.0 ↔ Version 6 read-only presentation boundary.
 *
 * Does not mutate sessions, award points, invent results, or authorize trainer actions.
 * Import into the actual V6 app only after its deployed source of truth is verified.
 */
export class ArenaStateError extends Error {
  constructor(code, status=0){super(code);this.name='ArenaStateError';this.code=code;this.status=status}
}
const CODE=/^\d{6}$/;
const PUBLIC_STATES=new Set(['draft','ready','lobby','question','results','survey','completed','archived']);
const safeString=(v,max=140)=>typeof v==='string'?v.slice(0,max):'';
const safeCount=v=>Number.isInteger(v)&&v>=0?v:0;
const isObj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);

export function joinUrl(origin, code) {
  if(!CODE.test(String(code)))throw new ArenaStateError('INVALID_CODE');
  const base=new URL(String(origin));
  if(base.protocol!=='https:' && !(base.protocol==='http:'&&['127.0.0.1','localhost'].includes(base.hostname)))
    throw new ArenaStateError('INSECURE_ORIGIN');
  const url=new URL('/',base);
  url.searchParams.set('view','join');url.searchParams.set('code',String(code));
  return url.href;
}

export function publicStage(raw, previous=null){
  if(!isObj(raw)||!CODE.test(String(raw.code))||!PUBLIC_STATES.has(raw.status)||
    !Number.isInteger(raw.revision)||raw.revision<0)
    throw new ArenaStateError('INVALID_SNAPSHOT');
  if(previous && previous.code===raw.code && Number.isInteger(previous.revision) &&
    previous.revision>raw.revision)
    throw new ArenaStateError('STALE_SNAPSHOT');
  // Treat the backend's keyRevealed flag as authoritative. Never infer from a timer.
  const revealed=raw.keyRevealed===true;
  const expired=raw.status==='question'&&!raw.paused&&Number.isFinite(raw.deadline)&&
    Number.isFinite(raw.serverNow)&&raw.serverNow>=raw.deadline;
  const scene=raw.status==='lobby'?'lobby':
    raw.status==='question'?(expired?'locked':'question'):
    raw.status==='results'?(revealed?'reveal':'locked'):
    raw.status==='completed'?'podium':
    raw.status==='survey'?'survey':
    raw.status==='archived'?'archived':'not-ready';
  const teamRows=Array.isArray(raw.teams)?raw.teams:[];
  const teams=teamRows.filter(row=>isObj(row)&&typeof row.team==='string')
    .map(row=>({name:safeString(row.team,40),points:Number.isFinite(row.score)?row.score:0,
      rank:Number.isInteger(row.rank)?row.rank:null,members:safeCount(row.members)}))
    .sort((a,b)=>b.points-a.points||a.name.localeCompare(b.name));
  const players=Array.isArray(raw.players)?raw.players:[];
  const activity=isObj(raw.activity)?raw.activity:{};
  const safeActivity={
    type:safeString(activity.type,90),
    prompt:safeString(activity.prompt,1000),
    options:Array.isArray(activity.options)?activity.options.slice(0,12).map(v=>safeString(v,240)):[]
  };
  // reveal correct index ONLY for an explicitly revealed, closed round, never on a question.
  if(scene==='reveal' && (Number.isInteger(activity.correct)||typeof activity.correct==='boolean'))
    safeActivity.correct=activity.correct;
  return {
    code:String(raw.code),
    title:safeString(raw.title,100),
    scene,revision:raw.revision,
    time:{serverNow:Number.isFinite(raw.serverNow)?raw.serverNow:null,
      deadline:Number.isFinite(raw.deadline)?raw.deadline:null,paused:raw.paused===true},
    participantCount:players.filter(p=>isObj(p)&&p.approval==='approved').length,
    submitted:safeCount(raw.submitted),
    teams,activity:safeActivity,
    // no employee IDs, authentication tokens, private answer records, or trainer controls
    publicOnly:true
  };
}

/** Same-origin public state poll; never send Firebase trainer tokens or player tokens. */
export async function fetchPublicState(origin,code,{fetchImpl=fetch,signal}={}){
  const join=joinUrl(origin,code),u=new URL(join);
  u.pathname='/api/state';u.search=new URLSearchParams({code:String(code)}).toString();
  const response=await fetchImpl(u.href,{method:'GET',headers:{'Accept':'application/json'},
    credentials:'omit',cache:'no-store',signal});
  if(!response.ok)throw new ArenaStateError(response.status===404?'NOT_FOUND':
    response.status===403?'ACCESS_DENIED':'STATE_UNAVAILABLE',response.status);
  return publicStage(await response.json());
}
