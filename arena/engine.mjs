/**
 * MTS Training Arena - deterministic local-only training round engine.
 * Pure, immutable state transitions. A DEMONSTRATION, NOT a trusted server.
 * Production scoring requires a trusted backend and authenticated principals.
 */
export const ACTIVITY_TYPES = Object.freeze(["Quiz", "Live Poll", "Dropdown"]);
function fail(message) { throw new Error(message); }
function ensure(test, message) { if (!test) fail(message); }
const copy = value => JSON.parse(JSON.stringify(value));
const unique = values => new Set(values).size === values.length;
function validActivity(a) {
  ensure(a && ACTIVITY_TYPES.includes(a.type), "Unsupported demo activity");
  ensure(typeof a.question === "string" && a.question.trim().length > 0, "Question required");
  ensure(Array.isArray(a.options) && a.options.length >= 2 && a.options.length <= 8 && a.options.every(x => typeof x === "string" && x.trim()), "2-8 nonempty answers required");
  ensure(Number.isInteger(a.timer) && a.timer >= 5 && a.timer <= 300, "Timer must be 5-300 seconds");
  ensure(a.type === "Live Poll" || (Number.isInteger(a.correct) && a.correct >= 0 && a.correct < a.options.length), "Correct index invalid");
}
export function makeSession(activities, id = "demo-session") {
  ensure(Array.isArray(activities) && activities.length > 0, "Activities required");
  activities.forEach(validActivity);
  ensure(activities.length <= 100, "Demo limited to 100 activities");
  return { id, status:"lobby", activities:copy(activities), current:-1, players:[], answers:{}, history:[], round:null, events:[] };
}
export function join(state, playerId, name) {
  ensure(state.status === "lobby", "Join is closed in demo once started");
  ensure(typeof playerId === "string" && playerId.length > 0, "Player ID required");
  ensure(typeof name === "string" && name.trim().length > 0 && name.trim().length <= 60, "Player name required");
  ensure(!state.players.some(p=>p.id === playerId), "Duplicate player");
  const next=copy(state);
  next.players.push({id:playerId, name:name.trim(), score:0});
  next.events.push({type:"joined",playerId});
  return next;
}
export function start(state, now) {
  ensure(state.status === "lobby" && state.players.length > 0, "Need lobby and participants");
  ensure(Number.isFinite(now), "Invalid timestamp");
  return begin(state, 0, now);
}
function begin(state, index, now) {
  const next=copy(state);
  ensure(index >= 0 && index < next.activities.length, "Activity index invalid");
  const a=next.activities[index];
  next.status="question";
  next.current=index;
  next.answers={};
  next.round={startedAt:now,deadline:now+a.timer*1000,remainingMs:a.timer*1000,paused:false};
  next.events.push({type:"started",index,at:now});
  return next;
}
export function submit(state, playerId, choice, now) {
  ensure(state.status==="question" && state.round && !state.round.paused, "Question not accepting answers");
  ensure(Number.isFinite(now) && now >= state.round.startedAt && now <= state.round.deadline, "Answer window closed");
  ensure(state.players.some(p=>p.id===playerId), "Unknown participant");
  ensure(Number.isInteger(choice) && choice>=0 && choice<state.activities[state.current].options.length, "Invalid choice");
  ensure(!Object.prototype.hasOwnProperty.call(state.answers,playerId), "Already answered");
  const next=copy(state);
  next.answers[playerId]={choice, at:now};
  next.events.push({type:"answered",playerId,index:next.current});
  return next;
}
export function pause(state, now) {
  ensure(state.status==="question" && !state.round.paused, "Cannot pause");
  ensure(Number.isFinite(now), "Invalid timestamp");
  const next=copy(state);
  next.round.remainingMs=Math.max(0,next.round.deadline-now);
  next.round.paused=true;
  next.events.push({type:"paused",index:next.current});
  return next;
}
export function resume(state, now) {
  ensure(state.status==="question" && state.round.paused, "Cannot resume");
  ensure(Number.isFinite(now), "Invalid timestamp");
  const next=copy(state);
  next.round.deadline=now+next.round.remainingMs;
  next.round.startedAt=Math.min(now,next.round.startedAt);
  next.round.paused=false;
  next.events.push({type:"resumed",index:next.current});
  return next;
}
export function remaining(state, now) {
  if(state.status!=="question")return 0;
  return state.round.paused?state.round.remainingMs:Math.max(0,state.round.deadline-now);
}
export function close(state, now, discard=false) {
  ensure(state.status==="question", "Question not running");
  ensure(Number.isFinite(now), "Invalid timestamp");
  const next=copy(state),a=next.activities[next.current];
  const tally=a.options.map(()=>0);
  const points={};
  for(const p of next.players){
    const response=next.answers[p.id];
    if(response)tally[response.choice]++;
    const awarded=discard || a.type==="Live Poll" || !response || response.choice!==a.correct ? 0 : 100;
    points[p.id]=awarded;
    p.score+=awarded;
  }
  next.history.push({index:next.current,type:a.type,question:a.question,tally,points,discarded:!!discard,submitted:Object.keys(next.answers).length,closedAt:now});
  next.events.push({type:discard?"discarded":"closed",index:next.current,at:now});
  next.round=null;
  next.status=next.current+1===next.activities.length?"completed":"between";
  return next;
}
export function advance(state, now) {
  ensure(state.status==="between", "Round must be closed before advancing");
  ensure(Number.isFinite(now), "Invalid timestamp");
  return begin(state,state.current+1,now);
}
export function endSession(state, now){
  ensure(state.status!=="completed", "Session already completed");
  ensure(Number.isFinite(now), "Invalid timestamp");
  let next=state;
  if(next.status==="question")next=close(next,now,true);
  next=copy(next);
  next.status="completed";
  next.events.push({type:"session-completed",at:now});
  return next;
}
export function ranking(state){
  const players=state.players.map(p=>({id:p.id,name:p.name,score:p.score})).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name));
  return players.map((p,i)=>({...p,rank:i===0?1:(p.score===players[i-1].score?null:i+1)})).map((p,i,all)=>({...p,rank:p.rank??all.slice(0,i).reverse().find(x=>x.rank!==null)?.rank??1}));
}
export function assertInvariants(state){
  ensure(unique(state.players.map(p=>p.id)),"Duplicate IDs");
  for(const p of state.players){
    const expected=state.history.reduce((sum,h)=>sum+(h.points[p.id]||0),0);
    ensure(p.score===expected && expected>=0,"Score ledger mismatch");
  }
  ensure(state.history.length<=state.activities.length,"Too many history entries");
  ensure(unique(state.history.map(h=>h.index)),"Duplicate grading detected");
  return true;
}
