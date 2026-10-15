import {TYPES,validateActivity,evaluateActivity,revealPresentation} from "./activity-contract.mjs";
const root=document.getElementById("activity-lab");
const common={timer:30};
const samples={
"Quiz":{...common,type:"Quiz",prompt:"Which document is used in importing?",options:["Commercial Invoice","Cinema Ticket","Driving Licence"],correct:0},
"Live Poll":{...common,type:"Live Poll",prompt:"What would you like to practice?",options:["Import","Export","ACI"],correct:null},
"Order It":{...common,type:"Order It",prompt:"Arrange these steps",items:["Register","Prepare Documents","Submit Declaration"],order:[0,1,2]},
"Match It":{...common,type:"Match It",prompt:"Match the document to its purpose",left:["Invoice","Packing List"],right:["Package contents","Commercial value"],pairs:[1,0]},
"Categorize":{...common,type:"Categorize",prompt:"Classify the activities",categories:["Import","Export"],items:["Receiving overseas goods","Selling overseas","Bringing machinery"],assignments:[0,1,0]},
"Spin Wheel":{...common,type:"Spin Wheel",prompt:"Choose a wheel outcome",items:["Bonus Topic","Explain a Term","Team Question","Quick Challenge"]},
"Open the Box":{...common,type:"Open the Box",prompt:"Pick a box to reveal",items:["Explain ACI","What is ACID?","Name a document"]},
"Flashcards":{...common,type:"Flashcards",prompt:"Flip a training flashcard",fronts:["ACI","Packing List"],backs:["Advance Cargo Information","Document listing package contents"]},
"Ultimate Game Show":{...common,type:"Ultimate Game Show",prompt:"What does QR mean?",options:["Quick Response","Quality Receipt","Quota Regulation","Query Report"],correct:0},
"Scenario Challenge":{...common,type:"Scenario Challenge",prompt:"A shipment is missing a mandatory document. What do you do?",options:["Escalate and request the document","Proceed without checking"],correct:0},
"Dropdown":{...common,type:"Dropdown",prompt:"The correct term for advance cargo data is…",options:["ACI","SKU","KPI"],correct:0}
};
let type=TYPES[0],draft=null,revealed=null;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function option(value,label=String(value)){return '<option value="'+esc(value)+'">'+esc(label)+'</option>';}
function draw(){
 draft=structuredClone(samples[type]);validateActivity(draft);revealed=null;
 let html='<div class="field"><label>Choose activity</label><select id="kind">'+TYPES.map(x=>option(x)).join("")+'</select></div><h2>'+esc(draft.prompt)+'</h2><div id="play" class="fields"></div><p class="note">Example questions only. Automatic 100-point demonstrations are not final session scoring policies.</p><div class="actions"><button class="btn" id="check">Submit / Reveal</button><button class="btn secondary" id="restart">Reset</button></div><p id="result" aria-live="polite"></p>';
 root.innerHTML=html;root.querySelector("#kind").value=type;root.querySelector("#kind").onchange=e=>{type=e.target.value;draw();};root.querySelector("#restart").onclick=draw;
 const play=root.querySelector("#play");
 if(["Quiz","Live Poll","Dropdown","Ultimate Game Show","Scenario Challenge"].includes(type)){
  play.innerHTML='<label>Choose an answer</label><select id="choice">'+draft.options.map((x,i)=>option(i,x)).join("")+'</select>';
 }else if(type==="Order It"||type==="Match It"){
  const items=type==="Order It"?draft.items:draft.left;
  const destinations=type==="Order It"?draft.items:draft.right;
  play.innerHTML=items.map((x,i)=>'<div class="field"><label>'+esc(x)+'</label><select data-position="'+i+'">'+destinations.map((y,j)=>option(j,y)).join("")+'</select></div>').join("");
 }else if(type==="Categorize"){
  play.innerHTML=draft.items.map((x,i)=>'<div class="field"><label>'+esc(x)+'</label><select data-position="'+i+'">'+draft.categories.map((y,j)=>option(j,y)).join("")+'</select></div>').join("");
 }else{
  const outcomes=type==="Flashcards"?draft.fronts:draft.items;
  play.innerHTML='<div class="grid">'+outcomes.map((x,i)=>'<button class="btn secondary" data-reveal="'+i+'">'+(type==="Open the Box"?"Box "+(i+1):esc(x))+'</button>').join("")+'</div>';
  play.querySelectorAll("[data-reveal]").forEach(b=>b.onclick=()=>{revealed=Number(b.dataset.reveal);showReveal()});
 }
 root.querySelector("#check").onclick=()=>{
  if(["Spin Wheel","Open the Box","Flashcards"].includes(type)){if(revealed===null){root.querySelector("#result").textContent="Choose one option above";return;}showReveal();return;}
  let answer;
  if(["Quiz","Live Poll","Dropdown","Ultimate Game Show","Scenario Challenge"].includes(type))answer=Number(root.querySelector("#choice").value);
  else answer=[...root.querySelectorAll("[data-position]")].map(x=>Number(x.value));
  try{const verdict=evaluateActivity(draft,answer);root.querySelector("#result").textContent=verdict.graded?(verdict.correct?"Correct! +100 demo points":"Not correct — 0 demo points"):"Vote saved in this demo only. No points."; }
  catch(error){root.querySelector("#result").textContent=error.message;}
 };
}
function showReveal(){
 try{const x=revealPresentation(draft,revealed);root.querySelector("#result").textContent=typeof x==="string"?"Revealed: "+x:x.front+" → "+x.back;}
 catch(error){root.querySelector("#result").textContent=error.message;}
}
draw();
