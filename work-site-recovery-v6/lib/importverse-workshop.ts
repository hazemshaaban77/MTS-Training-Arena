import {sample,type Activity} from './catalog';

/** Instructor-ready, editable ImportVerse workshop.
 * IMPORTANT provenance: eBL/Blockchain facts come from the MTS Egyptian importer
 * guide in the user's connected Drive. No episode video has been transcribed or
 * quoted; the available videos cannot yet be used as verified question sources.
 * Treat this deck as a sourced preliminary lesson, NOT as video-certified.
 */
export const importVerseSource={
 title:'دليل المستورد المصري - البوليصة الإلكترونية (النسخة النهائية المعتمدة) V5',
 url:'https://docs.google.com/document/d/1HqBDIUBgsI3gMMhE83eqXpV_elh9PyMxwkKeI8jUldI/edit'
};
const quiz=(prompt:string,options:string[],correct=0,points=100,timer=40):Activity=>({
 type:'Quiz',prompt,options,correct,points,timer,speed:false
});
const bank=[
 quiz('كم مرة تحتاج الشركة إنشاء الحساب الرئيسي بالبلوكتشين؟',['مرة واحدة لكل شركة','لكل بوليصة جديدة','مرة كل شهر','عند كل عملية نقل حيازة']),
 quiz('من أي تبويب في نافذة يبدأ إنشاء الحساب الرئيسي بالبلوكتشين؟',['حسابات المتعامل في البلوكتشين','الإفراج الجمركي','سداد الرسوم','الاستعلام عن الحاويات']),
 quiz('ما الخطوة التي تؤكد طلب إنشاء حساب المستورد بالبلوكتشين؟',['التوقيع الإلكتروني بالـ Token','طباعة الطلب فقط','رفع صورة شخصية','اختيار شركة شحن']),
 quiz('بعد طلب تفعيل الحساب الفرعي وتوقيعه، من ينفذ الاعتماد النهائي؟',['صاحب الحساب الرئيسي','أي زائر للمنصة','شركة النقل','المستورد الأجنبي']),
 quiz('بأي معرف يمكن البحث عن البوليصة الإلكترونية للوارد في الدليل؟',['رقم ACID','رقم الهاتف','رمز الجلسة التدريبية','رقم المكتب']),
 quiz('بعد فتح البوليصة ومراجعة بياناتها، ما الإجراء لنقلها للتوكيل الملاحي؟',['نقل الحيازة ثم اختيار التوكيل والتوقيع','إلغاء الملف فورًا','إرسال بريد غير موثق','تغيير رقم ACID']),
 quiz('ما هدف استخدام Blockchain لتداول eBL؟',['تأمين الوثيقة وتتبع حيازتها','إلغاء بيانات الشحنة','استبدال كل إجراءات الجمارك','إلغاء دور المستورد']),
 quiz('أين يجد المستورد البوالص الإلكترونية المرسلة من الخارج؟',['البوالص الإلكترونية للوارد','بطاقات المعرفة','سجل الحضور','لوحة نتائج التدريب'])
];
const planned=[6,6,10,5,6,4,5,6,5,7];
export function makeImportVerseWorkshop(language:'ar'|'en'='ar'):Activity[]{
 const yes=language==='ar';
 const a=(s:string,e:string)=>yes?s:e;
 const deck:Activity[]=[
  {...sample('Quiz',language),prompt:a('بوابة المعرفة | مراجعة خطوات eBL','Knowledge gateway | eBL workflows'),
   questions:bank.slice(0,5).map(q=>({...q})),timer:40},
  {...sample('Wheel of Fortune',language),prompt:a('عجلة المهارات | الشرح والتطبيق','Skills Wheel | Explain and apply'),
   points:1000,rounds:4,spinDuration:5,weight:1,sectors:[
   {label:a('شرح مفهوم eBL','Explain eBL'),kind:'challenge',points:0,repeatable:true,detail:a('اشرح فكرة بوليصة الشحن الإلكترونية وكيف تفيد المستورد المصري. يقيّم المدرب الأداء من 10.','Explain electronic bill of lading and trainer rates out of 10.')},
   {label:a('شرح حساب البلوكتشين','Blockchain account'),kind:'challenge',points:0,repeatable:true,detail:a('اذكر خطوات تفعيل حساب المستورد الرئيسي بالبلوكتشين. التقييم من 10.','Describe steps to activate importer blockchain account.')},
   {label:a('شرح نقل الحيازة','Transfer ownership'),kind:'challenge',points:0,repeatable:true,detail:a('اشرح نقل حيازة البوليصة للتوكيل الملاحي من نافذة. التقييم من 10.','Explain eBL ownership transfer to the shipping agent.')},
   {label:a('التدقيق والمراجعة','Document audit'),kind:'challenge',points:0,repeatable:true,detail:a('بيّن كيف تراجع البوليصة قبل طلب نقل الحيازة. التقييم من 10.','Explain pre-transfer document verification.')}
   ]},
  {...sample('Ultimate Game Show',language),showFormat:'championship',minimumLevels:7,participation:'individual',betEnabled:false,
   prompt:a('التحدي الكبير | سلّم المعرفة للمستورد المصري','The big show | Egyptian importer ladder'),timer:0,
   safeLevels:[3,5],questions:bank.slice(0,7).map((q,i)=>({...q,section:a('المستوى '+(i+1),'Level '+(i+1)),
    points:[100,250,500,1000,2000,3500,5000][i],timer:45}))},
  {...sample('Meta Plan',language),prompt:a('ميتا بلان | صنف رحلة البوليصة الإلكترونية','Meta Plan | Categorize the eBL workflow'),
   timer:0,categories:[a('إنشاء الحساب','Account setup'),a('الحسابات الفرعية','Subaccounts'),a('تداول البوليصة','eBL transfer')],
   items:[a('الموافقة على الشروط والأحكام','Accept terms'),a('توقيع طلب الحساب الرئيسي','Sign main account request'),a('إضافة حساب الموظف','Add staff account'),a('توقيع الموظف واعتماد الرئيسي','Staff signature and owner approval'),a('البحث برقم ACID','Look up with ACID'),a('اختيار الوكيل وطلب نقل الحيازة','Select agent and request transfer')],
   assignments:[0,0,1,1,2,2]},
  {...sample('Escape Room',language),prompt:a('غرفة الهروب | أنقذ رحلة eBL','Escape Room | Rescue the eBL'),
   rooms:[
   {title:a('باب التفعيل','Activation gate'),narrative:a('المستورد لا يستطيع فتح خدمة البلوكتشين. اختار خطوة الوصول الصحيحة.','Choose the blockchain enrolment entry.'),
     hint:a('القائمة اسمها حسابات المتعامل في البلوكتشين','Find the trader blockchain accounts panel'),hintAfter:1,puzzles:[bank[1]]},
   {title:a('خزنة الحيازة','Ownership vault'),narrative:a('البوليصة وصلت من الخارج. أتمم عملية النقل بأمان.','Complete the electronic ownership transfer.'),
     hint:a('ابدأ بمراجعة البوليصة من خدمة الوارد','Review the inbound bill first'),hintAfter:1,
     puzzles:[bank[5]]}
   ]},
  {...sample('Live Poll',language),prompt:a('أي مرحلة في تداول eBL تحتاج تدريب عملي أكبر؟','Which eBL stage needs more practice?'),
   timer:30,pollKind:'choice',options:[a('إنشاء الحساب','Enrolment'),a('تفعيل الموظفين','Subaccounts'),a('معاينة البوليصة','Bill inspection'),a('نقل الحيازة','Ownership transfer')]},
  {...sample('Order It',language),prompt:a('رتّب الخطوات من تفعيل حساب المستورد إلى نقل حيازة البوليصة','Order the import eBL workflow'),
   timer:75,items:[a('طلب نقل الحيازة والتوقيع','Sign ownership transfer'),a('فتح حساب المستورد الرئيسي','Open main account'),
    a('تفعيل الموظف واعتماده','Activate and approve staff'),a('استلام البوليصة والبحث برقم ACID','Find imported eBL by ACID'),a('التوقيع الإلكتروني على الحساب','Sign main account')],
   order:[1,4,2,3,0]},
  {...sample('Open the Box',language),prompt:a('صناديق ImportVerse | تحديات شرح حقيقية','ImportVerse boxes | Explain and demonstrate'),
   timer:0,points:1000,rounds:4,items:[a('الحساب الرئيسي','Main account'),a('الحساب الفرعي','Subaccount'),a('المعاينة','Review'),a('نقل الحيازة','Ownership transfer')],
   boxes:[
    {kind:'challenge',points:0,detail:a('قدّم شرحًا عمليًا لطريقة تسجيل الحساب الرئيسي بالبلوكتشين.','Explain main importer blockchain enrolment.')},
    {kind:'challenge',points:0,detail:a('اشرح أدوار الموظف وصاحب الحساب الرئيسي في تفعيل الحساب الفرعي.','Explain the subaccount approval chain.')},
    {kind:'challenge',points:0,detail:a('اشرح كيفية البحث عن eBL برقم ACID ومعاينتها.','Explain bill lookup and inspection by ACID.')},
    {kind:'challenge',points:0,detail:a('اشرح خطوة نقل الحيازة والتوقيع الإلكتروني.','Explain transfer ownership and electronic signature.')}
   ]},
  {...sample('Flashcards',language),prompt:a('بطاقات المعرفة | مفهوم وسؤال','Knowledge cards | Concept check'),
   flipPermission:'host',trainingMode:'challenge',scored:true,points:1000,
   fronts:[a('إيه معنى eBL؟','What is eBL?'),a('ما وظيفة الـ Token؟','What is the Token used for?'),
      a('ما وظيفة رقم ACID عند مراجعة eBL؟','Why is ACID used when reviewing eBL?'),
      a('من يعتمد حساب الموظف الفرعي؟','Who approves the staff subaccount?')],
   backs:[a('بوليصة شحن إلكترونية مؤمنة ويمكن متابعة حيازتها عبر البلوكتشين.','An electronic bill of lading secured by blockchain.'),
    a('تنفيذ التوقيع الإلكتروني المعتمد على الطلبات.','Authenticated electronic signing.'),
    a('البحث عن البوليصة الإلكترونية للوارد ومراجعة بياناتها.','Find and inspect incoming electronic bills.'),
    a('صاحب الحساب الرئيسي بعد توقيع الموظف.','The primary account owner, following staff signature.')]},
  {...sample('Scenario Challenge',language),prompt:a('تحدي المواقف | مستورد أمام قرار مهم','Decision challenge | Importer scenario'),
   start:'start',scored:true,timer:0,nodes:[
    {id:'start',text:a('وصلت eBL لكن بياناتها لم تُراجع. ماذا تفعل؟','The eBL arrived but was not reviewed. What now?'),correctChoice:0,
     choices:[{label:a('أبحث برقم ACID وأراجع البوليصة','Look up by ACID and review'),next:'verified',points:200,consequence:a('قللت خطر نقل مستند غير مُراجع.','Risk reduced.')},
      {label:a('أنقل الحيازة بلا مراجعة','Transfer without review'),next:'risk',points:0,consequence:a('مخاطرة بتداول بيانات خاطئة.','Risk of unverified transfer.')} ]},
    {id:'verified',text:a('راجعت البوليصة. كيف تنتقل للخطوة التالية؟','You checked the eBL. What next?'),correctChoice:0,
     choices:[{label:a('أختار التوكيل وأطلب النقل وأوقّع','Select agent, request and sign'),next:'done',points:400,consequence:a('تسلسل معتمد لنقل الحيازة.','Authorized transfer sequence.')},
       {label:a('أتجاهل التوقيع الإلكتروني','Skip electronic signature'),next:'risk',points:0,consequence:a('العملية لم تُستكمل.','Transfer not complete.')}]},
    {id:'done',ending:true,text:a('المسار الصحيح: مراجعة ثم نقل حيازة مع توقيع إلكتروني.','Correct path: review, transfer and sign.'),discussion:a('ما المخاطر التي تجنبتها قبل التوقيع؟','What risks did you avoid?')},
    {id:'risk',ending:true,text:a('مسار غير آمن: عملية ناقصة أو بيانات غير موثقة.','Unsafe path: incomplete or unverified transfer.'),discussion:a('أين تتدخل لتصحيح القرار؟','Where should you intervene?')}
   ]}
 ];
 return deck.map((activity,i)=>({...activity,plannedMinutes:planned[i],contentSource:'MTS eBL importer guide · not video-verified'}));
}
export const importVersePlannedMinutes=planned.reduce((sum,n)=>sum+n,0);
