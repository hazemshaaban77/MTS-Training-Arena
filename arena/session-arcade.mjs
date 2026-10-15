import {validateActivity,evaluateActivity,revealPresentation} from "./activity-contract.mjs";
const $=id=>document.getElementById(id), esc=s=>String(s??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const supported=["Quiz","Live Poll","Order It","Match It","Categorize","Spin Wheel","Open the Box","Flashcards","Ultimate Game Show","Scenario Challenge","Dropdown"];
let sessions=[],activities=[],step=0,score=0,answer=null,locked=false,deadline=0,timer=null,history=[],results=[],player="Player 1",team="";
try{const state=JSON.parse(localStorage.getItem("mts-arena-preview-v1")||"{}");sessions=Array.isArray(state.sessions)?state.sessions:[]}catch{}
function samples(){return supported.map((type,i)=>{const base={id:"demo"+i,type,question:"Training challenge: "+type,timer:30};if(["Quiz","Live Poll","Ultimate Game Show","Scenario Challenge","Dropdown"].includes(type))return {...base,options:["First choice","Second choice","Third choice"],correct:type==="Live Poll"?null:0};if(type==="Order It")return {...base,items:["Prepare","Review","Submit"],order:[0,1,2]};if(type==="Match It")return {...base,left:["Invoice","Packing List"],right:["Contents","Value"],pairs:[1,0]};if(type==="Categorize")return {...base,items:["Import shipment","Export shipment"],categories:["Import","Export"],assignments:[0,1]};if(type==="Flashcards")return {...base,fronts:["ACI","ACID"],backs:["Advance Cargo Information","Advance Cargo Information Declaration"]};return {...base,items:["Challenge One","Challenge Two","Challenge Three"]};});}
const picker=$("sessions");picker.add(new Option("Demo — all 11 formats","demo"));sessions.forEach((s,i)=>{if(s&&Array.isArray(s.activities))picker.add(new Option(s.name||"Untitled",String(i)))});
function clean(){if(timer){clearInterval(timer);timer=null;}}
function load(){clean();player=$("playerName").value.trim().slice(0,40)||"Player";team=$("teamName").value.trim().slice(0,40);const chosen=picker.value==="demo"?samples():sessions[Number(picker.value)]?.activities||[];activities=chosen.filter(a=>{try{return validateActivity(a)===true}catch{return false}});step=0;score=0;history=[];if(!activities.length){$("stage").textContent="No valid activities in this session.";return;}render();}
function drawBoard(){const standings=results.slice().sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name));const rows=standings.map((h,i)=>"<div class='smalltext'>"+(i&&h.score===standings[i-1].score?standings.findIndex(x=>x.score===h.score)+1:i+1)+". "+esc(h.name)+" — "+h.score+" practice points</div>").join("");$("board").innerHTML="<div class='score'>"+score+" pts (current practice)</div>"+(rows||"Complete a session to add a player to the local leaderboard.");
 const teamTotals=new Map();
 for(const row of results){if(!row.team)continue;const previous=teamTotals.get(row.team)||{sum:0,members:0};previous.sum+=row.score;previous.members++;teamTotals.set(row.team,previous);}
 const teams=[...teamTotals].map(([name,t])=>({name,score:t.sum,members:t.members})).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name));
 $("teamBoard").innerHTML=teams.map((t,i)=>"<div class='smalltext'>"+(i+1)+". "+esc(t.name)+" — "+t.score+" practice points · "+t.members+" player(s)</div>").join("")||"No practice teams yet.";
}
function input(a){
 const root=$("gameInput");const simple=["Quiz","Live Poll","Dropdown","Ultimate Game Show","Scenario Challenge"].includes(a.type);
 if(simple){root.innerHTML="<div class='arena-choices'>"+a.options.map((x,i)=>"<button data-choice='"+i+"'>"+esc(x)+"</button>").join("")+"</div>";root.querySelectorAll("[data-choice]").forEach(b=>b.onclick=()=>{if(locked)return;answer=Number(b.dataset.choice);root.querySelectorAll("button").forEach(x=>x.classList.toggle("selected",x===b));});}
 else if(["Order It","Match It","Categorize"].includes(a.type)){
  const from=a.items||a.left,to=a.type==="Categorize"?a.categories:a.type==="Match It"?a.right:a.items;
  root.innerHTML="<div class='gridrows'>"+from.map((v,i)=>"<label>"+esc(v)+" <select data-slot='"+i+"'><option value=''>Choose…</option>"+to.map((t,j)=>"<option value='"+j+"'>"+esc(t)+"</option>").join("")+"</select></label>").join("")+"</div>";
 }else{const items=a.type==="Flashcards"?a.fronts:a.items;root.innerHTML="<div class='arena-choices'>"+items.map((v,i)=>"<button data-reveal='"+i+"'>"+(a.type==="Open the Box"?"🎁 Box "+(i+1):esc(v))+"</button>").join("")+"</div>";root.querySelectorAll("[data-reveal]").forEach(b=>b.onclick=()=>{if(locked)return;answer=Number(b.dataset.reveal);root.querySelectorAll("[data-reveal]").forEach(x=>x.classList.toggle("selected",x===b));});}
}
function render(){clean();const a=activities[step];if(!a){results=results.filter(r=>r.name!==player);results.push({name:player,team,score});$("stage").classList.add("arena-finish");$("stage").innerHTML="<h2>🏆 Session complete!</h2><p class='score'>"+score+" practice points</p><p>Results are local demonstrations, not official rankings.</p>";drawBoard();return;}
 $("stage").classList.remove("arena-finish");answer=null;locked=false;deadline=Date.now()+a.timer*1000;
 $("stage").innerHTML="<p class='smalltext'>ROUND "+(step+1)+" / "+activities.length+" · "+esc(a.type)+"</p><div class='bar'><i id='progress' style='width:100%'></i></div><h2>"+esc(a.question||a.prompt)+"</h2><div class='score' id='clock'>"+a.timer+"s</div><div id='gameInput'></div><p id='feedback' role='status'></p><div class='controls'><button id='submit'>Submit / reveal</button><button id='next' disabled>Next activity →</button><button id='skip'>Skip</button></div>";
 input(a);$("submit").onclick=submit;$("next").onclick=()=>{step++;render()};$("skip").onclick=()=>{if(!locked){locked=true;history.push({name:a.type,points:0});}step++;render()};
 const tick=()=>{const left=Math.max(0,Math.ceil((deadline-Date.now())/1000));$("clock").textContent=left+"s";$("progress").style.width=(left/a.timer*100)+"%";if(!left){clean();if(!locked){locked=true;$("feedback").textContent="Time is up. No points awarded.";$("submit").disabled=true;$("next").disabled=false;history.push({name:a.type,points:0});drawBoard();}}};tick();timer=setInterval(tick,200);drawBoard();
}
function submit(){if(locked)return;const a=activities[step];if(Date.now()>=deadline){return;}let value=answer;const structured=["Order It","Match It","Categorize"].includes(a.type);if(structured){const fields=[...$("gameInput").querySelectorAll("[data-slot]")];if(fields.some(f=>f.value===""))return $("feedback").textContent="Complete all selections.";value=fields.map(f=>Number(f.value));}
 if(value===null)return $("feedback").textContent="Choose an answer first.";
 try{let points=0,message="";if(["Spin Wheel","Open the Box","Flashcards"].includes(a.type)){const revealed=revealPresentation(a,value);message=typeof revealed==="string"?revealed:revealed.front+" → "+revealed.back;}else{const result=evaluateActivity(a,value);points=result.points;message=!result.graded?"Poll response recorded locally.":result.correct?"Correct! +100 practice points":"Not correct — 0 points";}
 locked=true;clean();score+=points;history.push({name:a.type,points});$("feedback").textContent=message;$("feedback").className=points?"good":"smalltext";$("submit").disabled=true;$("next").disabled=false;$("skip").disabled=true;$("gameInput").querySelectorAll("button,select").forEach(n=>n.disabled=true);drawBoard();
 }catch(e){$("feedback").textContent=e.message;}
}
$("launch").onclick=load;$("reset").onclick=load;$("sessionNote").textContent="Includes offline validation, local practice scoring, fixed round timers and eleven formats.";load();
function csvSafe(value){let s=String(value??"");if(/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
$("exportResults").onclick=()=>{
 const rows=[["Player","Team","Practice score"],...results.map(({name,team,score})=>[name,team,score])];
 const text="\uFEFF"+rows.map(row=>row.map(csvSafe).join(",")).join("\r\n");
 const url=URL.createObjectURL(new Blob([text],{type:"text/csv;charset=utf-8"}));
 const link=document.createElement("a");link.href=url;link.download="mts-arena-practice-results.csv";link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
$("clearResults").onclick=()=>{if(!confirm("Clear all local practice results?"))return;results=[];drawBoard();};
