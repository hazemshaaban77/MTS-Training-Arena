import {makeSession,join,start,submit,pause,resume,close,advance,endSession,remaining,ranking,assertInvariants} from "./engine.mjs";
const KEY="mts-arena-preview-v1";
const app=document.getElementById("sim");
const escapeHtml=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let drafts=[];
try{drafts=JSON.parse(localStorage.getItem(KEY))?.sessions??[]}catch{}
const supported=new Set(["Quiz","Live Poll","Dropdown"]);
const available=drafts.filter(s=>Array.isArray(s.activities)&&s.activities.some(a=>supported.has(a.type)));
const fallback=[{type:"Quiz",question:"Which document is used in customs declarations?",options:["Invoice","Movie ticket","Recipe"],correct:0,timer:30},{type:"Live Poll",question:"What should we practice next?",options:["Quiz","Scenario","Team Challenge"],correct:null,timer:20},{type:"Dropdown",question:"Choose the city of Alexandria",options:["Alexandria","Luxor","Aswan"],correct:0,timer:20}];
let source=available[0]?.id||"demo",state=null,activeId="p1",message="",timer=null;
function readActivities(){const session=available.find(s=>s.id===source);return (session?.activities||fallback).filter(a=>supported.has(a.type)).map(a=>({type:a.type,question:a.question,options:a.options,correct:a.correct,timer:a.timer}));}
function reset(){try{state=join(join(makeSession(readActivities()),"p1","Trainee One"),"p2","Trainee Two");message="Demo ready";}catch(e){state=join(join(makeSession(fallback),"p1","Trainee One"),"p2","Trainee Two");message="Invalid saved draft; using demo activities";}render();}
function run(action){try{state=action(state);assertInvariants(state);message="Action completed";}catch(e){message=e.message;}render();}
function status(){if(state.status==="lobby")return "Lobby";if(state.status==="question")return state.round.paused?"Paused":"Question live";if(state.status==="between")return "Results ready — waiting for next";return "Completed";}
function render(){if(!state)return;const now=Date.now(),phase=state.status,a=state.activities[state.current],r=ranking(state);let html='<div class="grid"><div class="panel"><h3>Trainer Controls</h3><div class="field"><label>Activity Set</label><select id="source">'+available.map(s=>'<option value="'+escapeHtml(s.id)+'" '+(source===s.id?"selected":"")+'>'+escapeHtml(s.name)+'</option>').join("")+'<option value="demo" '+(source==="demo"?"selected":"")+'>Sample demonstration</option></select></div><p>Phase: <strong>'+status()+'</strong></p><p>Activity '+Math.max(state.current+1,0)+' / '+state.activities.length+'</p><p>Time remaining: <strong id="clock">'+(Math.ceil(remaining(state,now)/1000))+'s</strong></p><div class="actions">';
if(phase==="lobby")html+='<button id="start" class="btn green">Start Demo</button>';
if(phase==="question")html+='<button class="btn secondary" id="pause">'+(state.round.paused?"Resume":"Pause")+'</button><button class="btn" id="close">Close & Grade</button><button class="btn danger" id="discard">End & Discard Activity</button>';
if(phase==="between")html+='<button class="btn green" id="next">Next Activity</button>';
if(phase!=="completed")html+='<button class="btn danger" id="end">Complete Session</button>';
html+='<button class="btn secondary" id="reset">Reset Local Demo</button></div><p class="note">Timer is a client-side demo. No server authority.</p></div><div class="panel"><h3>Competition Ranking</h3>'+r.map(p=>'<div class="item"><strong>#'+p.rank+' '+escapeHtml(p.name)+'</strong><span>'+p.score+' pts</span></div>').join("")+'</div></div>';
if(a){html+='<div class="panel" style="margin-top:15px"><span class="eyebrow">'+escapeHtml(a.type)+'</span><h2>'+escapeHtml(a.question)+'</h2><div class="field"><label>Simulated participant</label><select id="who"><option value="p1" '+(activeId==="p1"?"selected":"")+'>Trainee One</option><option value="p2" '+(activeId==="p2"?"selected":"")+'>Trainee Two</option></select></div><div class="grid" style="margin-top:12px">'+a.options.map((option,i)=>'<button class="btn secondary" data-answer="'+i+'" '+(phase!=="question"||state.round.paused||!!state.answers[activeId]?"disabled":"")+'>'+escapeHtml(option)+'</button>').join("")+'</div><p class="note">'+(state.answers[activeId]?"Submitted — cannot answer twice":"Choose one answer as the selected trainee")+'</p></div>';}
if(state.history.length)html+='<div class="panel" style="margin-top:15px"><h3>Round history</h3>'+state.history.map(h=>'<div class="item"><span>'+escapeHtml(h.type)+' — '+escapeHtml(h.question)+' '+(h.discarded?"(discarded)":"")+'</span><span>'+h.submitted+' answers</span></div>').join("")+'</div>';
html+='<p class="note" style="margin-top:12px">'+escapeHtml(message)+'</p>';app.innerHTML=html;
const find=id=>document.getElementById(id);
find("source").onchange=e=>{source=e.target.value;reset();};
find("reset").onclick=reset;
if(find("start"))find("start").onclick=()=>run(s=>start(s,Date.now()));
if(find("pause"))find("pause").onclick=()=>run(s=>s.round.paused?resume(s,Date.now()):pause(s,Date.now()));
if(find("close"))find("close").onclick=()=>run(s=>close(s,Date.now()));
if(find("discard"))find("discard").onclick=()=>{if(confirm("Discard scores for this activity and close it?"))run(s=>close(s,Date.now(),true));};
if(find("next"))find("next").onclick=()=>run(s=>advance(s,Date.now()));
if(find("end"))find("end").onclick=()=>{if(confirm("Permanently complete this local demo session?"))run(s=>endSession(s,Date.now()));};
if(find("who"))find("who").onchange=e=>{activeId=e.target.value;render()};
document.querySelectorAll("[data-answer]").forEach(button=>button.onclick=()=>run(s=>submit(s,activeId,Number(button.dataset.answer),Date.now())));
}
reset();
timer=setInterval(()=>{if(state?.status==="question"&&!state.round.paused&&remaining(state,Date.now())===0){run(s=>close(s,Date.now()));return;}const clock=document.getElementById("clock");if(clock&&state)clock.textContent=Math.ceil(remaining(state,Date.now())/1000)+"s";},250);
