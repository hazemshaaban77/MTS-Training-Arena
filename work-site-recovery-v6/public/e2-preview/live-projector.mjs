/**
 * Isolated Experience 2.0 live-stage visual pilot.
 * Strictly read-only: no credentials, player tokens, mutations or local scores.
 */
import {joinUrl,fetchPublicStage,PublicStageError} from "./v6-public-stage.mjs";
const $=id=>document.getElementById(id);
const dom={
 form:$("connect-form"),api:$("api-origin"),frontend:$("frontend-origin"),code:$("room-code"),
 stage:$("stage"),title:$("session-title"),info:$("scene-info"),metrics:$("metrics"),
 choices:$("choices"),teams:$("teams"),empty:$("empty"),join:$("join-link"),connection:$("connection")
};
let active=false,previous=null,pollTimer=null,requestController=null,config=null;
const make=(tag,className,content)=>{
 const el=document.createElement(tag);if(className)el.className=className;
 if(content!==undefined)el.textContent=String(content);return el;
};
const status=value=>dom.connection.textContent=value;
const clear=()=>{
 dom.metrics.replaceChildren();dom.choices.replaceChildren();dom.teams.replaceChildren();
 dom.choices.classList.add("hidden");dom.teams.classList.add("hidden");
};
function render(stage){
 clear();dom.stage.dataset.scene=stage.scene;
 const titles={
  lobby:"ساحة الانتظار",question:"التحدي مستمر",locked:"انتهى الوقت — في انتظار إعلان المدرب",
  reveal:"كشف الإجابة",podium:"نتيجة المنافسة",survey:"استطلاع رأي",archived:"جلسة مؤرشفة",
  "not-ready":"الجلسة لم تبدأ بعد"
 };
 dom.title.textContent=stage.title||titles[stage.scene]||"جلسة تدريب";
 dom.info.textContent=titles[stage.scene]||"وضع العرض";
 dom.metrics.append(
  make("span","","عدد المشاركين: "+stage.participantCount),
  make("span","","الإجابات المستلمة: "+stage.submitted),
  make("span","","الجولة: "+(stage.current===null?"—":stage.current+1))
 );
 if(["question","locked","reveal"].includes(stage.scene)&&stage.activity.prompt){
  dom.title.textContent=stage.activity.prompt;
  if(stage.activity.options.length){
   const cells=stage.activity.options.map((option,i)=>{
    const el=make("div","option",("ABCD"[i]||String(i+1))+" · "+option);
    if(stage.scene==="reveal"&&stage.activity.correct===i)el.classList.add("correct");
    return el;
   });
   dom.choices.replaceChildren(...cells);dom.choices.classList.remove("hidden");
  }
 }
 if(stage.teams.length&&["lobby","reveal","podium","locked"].includes(stage.scene)){
  dom.teams.replaceChildren(...stage.teams.slice(0,6).map(team=>{
   const el=make("div","team");
   el.append(make("strong","",team.name),make("span","",String(team.points)+" نقطة"+(team.rank?" · مركز "+team.rank:"")));
   return el;
  }));dom.teams.classList.remove("hidden");
 }
 if(stage.scene==="question"&&stage.time.deadline!==null){
  const seconds=Math.max(0,Math.ceil((stage.time.deadline-(stage.time.serverNow??stage.time.deadline))/1000));
  dom.info.textContent="السؤال مفتوح · متبقي تقريبًا "+seconds+" ثانية وفق توقيت السيرفر";
 }
 dom.empty.classList.add("hidden");
}
function unavailable(code,message){
 clear();dom.stage.dataset.scene="unavailable";
 dom.title.textContent="تعذر عرض الجلسة";dom.info.textContent=message;
 dom.empty.textContent="الجلسة "+(code||"—")+": "+message+". لا يتم استخدام أي نتائج تجريبية بدل بيانات السيرفر.";
 dom.empty.classList.remove("hidden");
}
function stop(){
 active=false;
 if(pollTimer!==null){clearTimeout(pollTimer);pollTimer=null;}
 if(requestController){requestController.abort();requestController=null;}
 status("غير متصل");
}
async function tick(){
 if(!active||!config)return;
 const controller=new AbortController();requestController=controller;
 try{
  const stage=await fetchPublicStage(config.api,config.code,{previous,signal:controller.signal});
  if(!active||controller.signal.aborted)return;
  previous=stage;render(stage);status("متصل للقراءة · تحديث "+stage.revision);
 }catch(e){
  if(!active||controller.signal.aborted)return;
  const errors={
   NOT_FOUND:"الجلسة غير موجودة",ACCESS_DENIED:"غير مسموح بقراءة الجلسة",
   INVALID_SNAPSHOT:"بيانات غير متوافقة مع العقد",STALE_SNAPSHOT:"وصلت بيانات أقدم من آخر تحديث",
   NETWORK_UNAVAILABLE:"فشل الاتصال أو CORS",INVALID_RESPONSE:"استجابة غير صالحة",
   STATE_UNAVAILABLE:"الخدمة غير متاحة"
  };
  const label=errors[e?.code]||"تعذر جلب بيانات الجلسة";
  unavailable(config.code,label);status("غير متصل · "+label);
 }finally{
  if(requestController===controller)requestController=null;
  if(active)pollTimer=setTimeout(tick,1800);
 }
}
function connect(e){
 e?.preventDefault();stop();previous=null;
 const code=dom.code.value.trim(),api=dom.api.value.trim(),frontend=dom.frontend.value.trim();
 let link;
 try{
  link=joinUrl(frontend,code);
  if(!api)throw new PublicStageError("INVALID_ORIGIN");
  const url=new URL(api);
  if(url.protocol!=="https:"&&!(url.protocol==="http:"&&["localhost","127.0.0.1"].includes(url.hostname)))
   throw new PublicStageError("INSECURE_ORIGIN");
 }catch{
  unavailable(code,"تحقق من كود الجلسة ذي الستة أرقام وعناوين HTTPS");
  return;
 }
 dom.join.textContent=link;dom.join.href=link;dom.join.target="_blank";
 dom.join.rel="noopener noreferrer";
 config={code,api,frontend};active=true;status("جارِ الاتصال…");tick();
}
dom.frontend.value=new URL("../",window.location.href).href;
const q=new URLSearchParams(location.search),code=q.get("code")||"";
if(/^\d{6}$/.test(code))dom.code.value=code;
dom.form.addEventListener("submit",connect);
$("stop").addEventListener("click",()=>{stop();unavailable(config?.code,"تم إيقاف الاتصال بواسطة المستخدم");});
$("projector").addEventListener("click",()=>document.body.classList.add("projector"));
$("exit").addEventListener("click",()=>document.body.classList.remove("projector"));
window.addEventListener("pagehide",stop);
