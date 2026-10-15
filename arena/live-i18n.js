/* Bilingual display adapter for experimental live pilot.
   Only translates fixed UI copy, never participant text, questions, IDs or answer options. */
(()=>{
  const dictionary={
    "Firebase Live Pilot":"التجربة المباشرة على فايربيز",
    "Studio":"الاستوديو",
    "EXPERIMENTAL / NO SCORES — Requires a securely configured Firebase project and approved Arena-only rules; does not use production scoring.":"نسخة تجريبية بدون درجات — تتطلب إعداد Firebase وقواعد أمان Arena المعتمدة، ولا تستخدم نظام التقييم النهائي.",
    "Connect to Firebase Pilot":"الاتصال بالنسخة التجريبية",
    "This is a separate Arena namespace and requires its security rules and a manually authorized trainer UID. Never enter employee data before security review.":"بيانات Arena معزولة وتحتاج قواعد أمان وصلاحية مدرب معتمدة. لا تستخدم بيانات موظفين حقيقية قبل مراجعة الأمان.",
    "Trainer":"المدرب","Trainee":"المتدرب",
    "Verified Trainer Sign In":"تسجيل دخول المدرب",
    "Email":"البريد الإلكتروني","Password":"كلمة المرور","Sign in":"تسجيل الدخول",
    "Participant Entry":"دخول المتدرب","Room code":"كود الغرفة","Continue":"متابعة",
    "The room link is shared by the trainer. Employee IDs are private and never rendered on the projector.":"رابط الغرفة يشاركه المدرب. أرقام الموظفين لا تظهر على شاشة العرض.",
    "Trainer Pilot Console":"لوحة المدرب التجريبية",
    "Pilot deliberately does not compute, store or reveal scores. Trainer controls one question at a time. Answer keys are not published to the public room.":"هذه النسخة لا تحتسب ولا تخزن درجات. المدرب يدير سؤالًا واحدًا في كل مرة، والإجابات الصحيحة غير منشورة للمتدربين.",
    "Room title":"عنوان الغرفة","Create Pilot Room":"إنشاء غرفة تجريبية",
    "Trainer Room":"غرفة المدرب","One participation link (share as QR if desired)":"رابط مشاركة المتدربين (يمكن مشاركته كرمز QR)",
    "Open secured projector on another device":"فتح شاشة العرض المؤمنة على جهاز آخر",
    "(trainer sign-in required)":"(تتطلب تسجيل دخول المدرب)",
    "Do not use this for live training until Firebase rules are installed and audited. Avoid real employee IDs during initial tests.":"لا تستخدمها لتدريب فعلي قبل تدقيق قواعد Firebase. استخدم أرقامًا وهمية فقط للاختبار.",
    "Start Next Question":"بدء السؤال التالي","Close Question":"إغلاق السؤال","Complete Pilot":"إنهاء التجربة",
    "Answer counts (trainer only)":"عدد الإجابات (للمدرب فقط)",
    "Join Training Arena":"انضم إلى Training Arena","Your name":"اسمك","Employee ID":"رقم الموظف",
    "Join Pilot":"دخول التجربة","Employee ID is a unique claimed identifier, not proof of employment. Use test IDs only in this stage.":"رقم الموظف هنا مجرد معرف، وليس دليلًا على التوظيف. استخدم أرقامًا تجريبية فقط.",
    "Connected. Waiting for trainer.":"متصل. في انتظار المدرب.",
    "Waiting for next question.":"في انتظار السؤال التالي.",
    "Pilot completed. No scores were calculated.":"انتهت التجربة. لم يتم حساب درجات.",
    "Answer submitted; you cannot submit a second response.":"تم إرسال إجابتك، ولا يمكنك الإجابة مرة ثانية.",
    "Your answer is already recorded.":"تم تسجيل إجابتك بالفعل.",
    "You joined during this round. Wait for the next question.":"دخلت أثناء السؤال الحالي. انتظر السؤال التالي.",
    "Use test IDs until approved":"استخدم أرقامًا وهمية حتى الموافقة",
    "Cannot initialize pilot":"تعذر بدء النسخة التجريبية",
    "Waiting":"انتظار","Ready to play":"جاهزون للعب",
    "question":"سؤال","lobby":"قاعة الانتظار","between":"بين الأسئلة","completed":"مكتملة"
  };
  const reverse=Object.fromEntries(Object.entries(dictionary).map(([en,ar])=>[ar,en]));
  const enBtn=document.getElementById("liveLangEn");
  const arBtn=document.getElementById("liveLangAr");
  if(!enBtn||!arBtn)return;
  const preferenceKey="mts-arena-live-language";
  let language=localStorage.getItem(preferenceKey)==="ar"?"ar":"en";
  let queued=false;
  function convert(s){
    const trimmed=s.trim();
    if(!trimmed)return s;
    const lookup=language==="ar"?dictionary:reverse;
    let candidate=lookup[trimmed];
    if(!candidate&&language==="ar"&&trimmed.startsWith("Room: "))candidate="الغرفة: "+trimmed.slice(6);
    if(!candidate&&language==="en"&&trimmed.startsWith("الغرفة: "))candidate="Room: "+trimmed.slice(8);
    if(!candidate)return s;
    return s.replace(trimmed,candidate);
  }
  function translate(){
    document.documentElement.lang=language;
    document.documentElement.dir=language==="ar"?"rtl":"ltr";
    enBtn.classList.toggle("selected",language==="en");
    arBtn.classList.toggle("selected",language==="ar");
    enBtn.setAttribute("aria-pressed",String(language==="en"));
    arBtn.setAttribute("aria-pressed",String(language==="ar"));
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())){
      if(node.parentElement?.closest("script,style,code,option,#choices,#counts"))continue;
      const value=convert(node.nodeValue||"");
      if(value!==node.nodeValue)node.nodeValue=value;
    }
    for(const input of document.querySelectorAll("input[placeholder]")){
      const next=convert(input.placeholder);
      if(next!==input.placeholder)input.placeholder=next;
    }
  }
  const schedule=()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;translate()})};
  const observer=new MutationObserver(schedule);
  observer.observe(document.getElementById("live"),{childList:true,subtree:true,characterData:true});
  enBtn.addEventListener("click",()=>{language="en";localStorage.setItem(preferenceKey,language);translate()});
  arBtn.addEventListener("click",()=>{language="ar";localStorage.setItem(preferenceKey,language);translate()});
  translate();
})();
