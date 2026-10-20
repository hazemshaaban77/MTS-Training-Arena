import {isChampionship,showStart,showCommand,showPublic} from './championship.mjs';
import {fail} from './service';
export {showPublic,showStart,isChampionship};

export async function mutateChampionship(db:D1Database,s:any,activity:any,rt:any,body:any,now:number,player:any,host:boolean){
 if(!isChampionship(activity)||s.status!=='question'||s.paused)fail('SHOW_STATE',409);
 const action=body.action;
 if(action==='showcast'){
  if(!host)fail('FORBIDDEN',403);
  const candidate:any=await db.prepare("SELECT id FROM players WHERE session=? AND id=? AND approval='approved' AND eligible_from<=?").bind(s.code,body.player,s.current).first();
  if(!candidate)fail('SHOW_CAST',409);
 }else if(action==='showanswer'||action==='showwithdraw'||action==='showlifeline'){
  if(!player||player.id!==(rt.show?.current?.player))fail('SHOW_CONTESTANT',403);
 }else if(action==='showaudience'){
  if(!player||player.approval!=='approved'||player.eligible_from>s.current)fail('PLAYER',403);
 }else fail('SHOW_ACTION',409);
 const mapped={showcast:'cast',showanswer:'answer',showwithdraw:'withdraw',showlifeline:'lifeline',showaudience:'audience'} as Record<string,string>;
 const extra={...body,player:action==='showcast'?body.player:player?.id,attemptId:action==='showcast'?crypto.randomUUID():undefined};
 let result:any;
 try{result=showCommand(activity,rt.show||showStart(),mapped[action],extra,now,s.deadline);}catch(e:any){fail(e.message?.startsWith('SHOW_')?e.message:'SHOW_STATE',409);}
 const runtime=JSON.stringify({...rt,show:result.show,phase:result.show.phase,
  targets:result.show.current?[result.show.current.player]:[]});
 const updated=db.prepare("UPDATE sessions SET runtime=?,deadline=?,revision=revision+1 WHERE code=? AND revision=? AND current=? AND status='question' AND paused=0").bind(runtime,result.deadline??null,s.code,s.revision,s.current);
 const statements:D1PreparedStatement[]=[updated];
 if(result.payout){
  const event=result.payout;
  statements.push(db.prepare("INSERT INTO events(session,id,player,round,kind,points,detail,created_at) SELECT ?,?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM sessions WHERE code=? AND current=? AND revision=? AND json_extract(runtime,'$.show.lastCompleted.id')=?)").bind(s.code,'championship:'+s.current+':'+event.id,event.player,s.current,event.kind,event.points,JSON.stringify(event.detail),now,s.code,s.current,s.revision+1,event.id));
 }
 try{
  const batch=await db.batch(statements);
  if(!batch[0]?.meta.changes)fail('STALE',409);
  if(result.payout&&!batch[1]?.meta.changes)fail('STALE',409);
 }catch(e:any){if(e?.code)throw e;fail('STALE',409);}
 return {ok:true};
}
export async function settleChampionshipTimeout(db:D1Database,s:any,activity:any,rt:any,now:number){
 if(!isChampionship(activity)||s.status!=='question'||s.paused||!s.deadline||s.deadline>now||rt.show?.phase!=='answering')return false;
 const result=showCommand(activity,rt.show,'timeout',{},now,s.deadline),event=result.payout;
 const runtime=JSON.stringify({...rt,show:result.show,phase:result.show.phase,targets:[]});
 const statements=[
  db.prepare("UPDATE sessions SET runtime=?,deadline=NULL,revision=revision+1 WHERE code=? AND revision=? AND current=? AND status='question' AND paused=0 AND deadline<=?").bind(runtime,s.code,s.revision,s.current,now),
  db.prepare("INSERT INTO events(session,id,player,round,kind,points,detail,created_at) SELECT ?,?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM sessions WHERE code=? AND current=? AND revision=? AND json_extract(runtime,'$.show.lastCompleted.id')=?)").bind(s.code,'championship:'+s.current+':'+event.id,event.player,s.current,event.kind,event.points,JSON.stringify(event.detail),now,s.code,s.current,s.revision+1,event.id)
 ];
 try{const result=await db.batch(statements);return !!result[0]?.meta.changes;}
 catch{return false;}
}
