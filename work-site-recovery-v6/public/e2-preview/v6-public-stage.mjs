/**
 * Experience 2.0 / V6 read-only presentation adapter, based on V6 lib/service.ts.
 * Read public state only. Never authorizes trainer commands, joins users or awards points.
 * NOTE: Candidate V6 branch; live Worker v9/source SHA still requires compatibility proof.
 */
export class PublicStageError extends Error {
  constructor(code, status=0) { super(code); this.name="PublicStageError"; this.code=code; this.status=status; }
}
const CODE=/^\d{6}$/;
const STATES=new Set(["draft","ready","lobby","question","results","survey","completed","archived"]);
const str=(value,max=160)=>typeof value==="string"?value.slice(0,max):"";
const obj=x=>x!==null && typeof x==="object" && !Array.isArray(x);
const number=x=>typeof x==="number" && Number.isFinite(x);
const count=x=>Number.isInteger(x)&&x>=0?x:0;
function safeUrl(origin) {
  let u;try{u=new URL(String(origin));}catch{throw new PublicStageError("INVALID_ORIGIN");}
  if(u.protocol!=="https:" && !(u.protocol==="http:"&&["localhost","127.0.0.1"].includes(u.hostname)))
    throw new PublicStageError("INSECURE_ORIGIN");
  u.username="";u.password="";u.search="";u.hash="";
  return u;
}
export function joinUrl(frontendBase,code) {
  if(!CODE.test(String(code)))throw new PublicStageError("INVALID_CODE");
  // Keep V6 frontend base path: Sites uses / but GitHub Pages uses /MTS-Training-Arena/v6/.
  // Pass the canonical app base URL, not a host control subroute.
  const url=safeUrl(frontendBase);
  url.searchParams.set("view","join");url.searchParams.set("code",String(code));
  return url.href;
}
/**
 * Return ONLY public, whitelisted fields.
 * Server raw response can contain player records, private IDs, session config and
 * host-only properties; none are copied to the projection.
 */
export function stageFromV6(raw,previous=null){
  if(!obj(raw)||!CODE.test(String(raw.code))||!STATES.has(raw.status)||
     !Number.isInteger(raw.revision)||raw.revision<0)
    throw new PublicStageError("INVALID_SNAPSHOT");
  if(previous && previous.code===String(raw.code)&&Number.isInteger(previous.revision)&&raw.revision<previous.revision)
    throw new PublicStageError("STALE_SNAPSHOT");
  // V6 server owns reveal. A local timer may lock but never reveal a correct answer.
  const reveal=raw.status==="results" && raw.keyRevealed===true;
  const expired=raw.status==="question"&&!raw.paused&&number(raw.deadline)&&number(raw.serverNow)&&raw.serverNow>=raw.deadline;
  const scene=raw.status==="lobby"?"lobby":
    raw.status==="question"?(expired?"locked":"question"):
    raw.status==="results"?(reveal?"reveal":"locked"):
    raw.status==="completed"?"podium":
    raw.status==="survey"?"survey":raw.status==="archived"?"archived":"not-ready";
  const a=obj(raw.activity)?raw.activity:{};
  const activity={
    type:str(a.type,90),
    mainType:str(a.mainType,90),
    prompt:str(a.prompt,1600),
    options:Array.isArray(a.options)?a.options.slice(0,12).map(x=>str(x,300)):[]
  };
  if(reveal && (Number.isInteger(a.correct)||typeof a.correct==="boolean"))activity.correct=a.correct;
  // V6 exposes a per-round aggregate tally for allowed live polls.
  const tally=(reveal||a.type==="Live Poll")&&Array.isArray(raw.tally)?
    raw.tally.slice(0,12).map(x=>count(x)):null;
  const teams=(Array.isArray(raw.teams)?raw.teams:[]).filter(x=>obj(x)&&typeof x.team==="string")
    .slice(0,100).map(x=>({
      name:str(x.team,70),
      points:number(x.score)?x.score:0,
      rank:Number.isInteger(x.rank)&&x.rank>0?x.rank:null,
      members:count(x.members)
    })).sort((x,y)=>y.points-x.points||x.name.localeCompare(y.name));
  const players=Array.isArray(raw.players)?raw.players:[];
  const approved=players.filter(x=>obj(x)&&x.approval==="approved").length;
  return {
    code:String(raw.code),
    title:str(raw.title,140),
    scene,
    revision:raw.revision,
    current:Number.isInteger(raw.current)?raw.current:null,
    teamMode:raw.teamMode===true,
    time:{serverNow:number(raw.serverNow)?raw.serverNow:null,deadline:number(raw.deadline)?raw.deadline:null,paused:raw.paused===true},
    participantCount:approved,
    submitted:count(raw.submitted),
    teams,activity,tally,
    // No individual names, employee IDs, worker tokens, raw game data or host settings.
    readOnly:true
  };
}
export async function fetchPublicStage(origin,code,{fetchImpl=fetch,signal,previous=null}={}){
  if(!CODE.test(String(code)))throw new PublicStageError("INVALID_CODE");
  const url=safeUrl(origin);url.pathname="/api/state";url.searchParams.set("code",String(code));
  let response;
  try{response=await fetchImpl(url.href,{method:"GET",credentials:"omit",cache:"no-store",headers:{"Accept":"application/json"},signal});}
  catch(e){if(signal?.aborted)throw new PublicStageError("ABORTED");throw new PublicStageError("NETWORK_UNAVAILABLE");}
  if(!response?.ok){
    throw new PublicStageError(response?.status===404?"NOT_FOUND":response?.status===403||response?.status===401?"ACCESS_DENIED":"STATE_UNAVAILABLE",response?.status||0);
  }
  let raw;try{raw=await response.json();}catch{throw new PublicStageError("INVALID_RESPONSE");}
  return stageFromV6(raw,previous);
}
