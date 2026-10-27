import {sample,type Activity} from './catalog';

/** Trainer-editable session based on the speech transcripts of ImportVerse episodes 1–5.
 * The uploaded MP3 episode 6 exists but the source reader returned no transcript.
 * Spellings ACID/ACI have been normalized where speech recognition heard ECID/ECI.
 * Training content ≠ up-to-date legal guidance: customs terms, dates and exemptions
 * must be separately re-verified before using them as compliance advice.
 */
export const importVerseSource={
 title:'ImportVerse MP3 Episodes 1–5 (user audio speech transcripts) · Episode 6 pending transcription',
 url:'', episodesReviewed:[1,2,3,4,5], episodesPending:[6],
 note:'Some spoken terminology and regulatory claims may be stale; cross-check with Nafeza.'
};
const quiz=(prompt:string,options:string[],correct=0,points=100,timer=40):Activity=>({
 type:'Quiz',prompt,options,correct,points,timer,speed:false
});
// Every question below follows a concrete step explicitly described in the
// supplied audio; no fabricated episode-6 material is included.
const bank=[
 quiz('الحلقة 1: مالك صاحب المصنع اختار أي نوع حساب للتسجيل بمنصة نافذة؟',['حساب تجاري','حساب شخصي','حساب موظف جمركي','حساب شركة شحن']),
 quiz('الحلقة 1: بعد الضغط على سجّل الآن، إيه الخطوة المطلوبة لتنشيط الحساب؟',['فتح رسالة البريد والضغط على رابط التفعيل','إنشاء ACID فورًا','رفع بوليصة الشحن','بدء إجراء بنكي']),
 quiz('الحلقة 1: إيه الخطوة التالية لتفعيل رقم الهاتف؟',['إدخال رمز الأمان المرسل للموبايل','رفع فاتورة إلكترونية','التوقيع على بوليصة','طلب تفويض جمركي']),
 quiz('الحلقة 2: إيه المستند اللي بيبدأ بيه الاتفاق على نوع البضاعة والكمية والسعر؟',['الفاتورة المبدئية Proforma Invoice','رقم 46','إذن التسليم','إيصال الأرضيات']),
 quiz('الحلقة 2: في شرط FOB، المصدر مسؤول عن إيه عند ميناء الشحن؟',['تسليم وتحميل البضاعة على السفينة','تخليص الواردات في مصر','إنهاء إجراءات المستورد البنكية','الرسوم المحلية في ميناء الوصول']),
 quiz('الحلقة 2: الاعتماد المستندي بيعتمد في السداد أساسًا على إيه؟',['تقديم مستندات مطابقة لشروط الاعتماد','وصول البضاعة قبل الشحن','مكالمة بين المستورد والمصدر','اختيار وسيط بدون بنوك']),
 quiz('الحلقة 3: التفويض الإلكتروني بيصبح ساري إمتى؟',['بعد قبول الشركة المفوَّض إليها للتفويض','فور كتابة اسم شركة التخليص','بعد وصول المركب','بعد فتح الاعتماد فقط']),
 quiz('الحلقة 3: رقم ACID بيستخدم لإيه في منظومة ACI؟',['تعريف الشحنة وربط المستندات والأطراف','رقم هاتف المستورد','رقم حساب البنك','رمز صلاحية المتدرب']),
 quiz('الحلقة 3: طلب ACID يشمل أي مجموعات بيانات أساسية؟',['المستورد والمصدر والشحنة','مورد واحد فقط','حساب المدرب والمتدرب','البنك والسائق فقط']),
 quiz('الحلقة 4: إيه معنى KYC عند التسجيل على CargoX؟',['اعرف عميلك والتحقق من هوية الكيان','استلام الشحنة بالميناء','إصدار رقم 46','قلب بطاقة المعرفة']),
 quiz('الحلقة 4: إيه هو Envelope على CargoX؟',['ظرف رقمي يضم مستندات الشحنة','الاعتماد البنكي','إذن التسليم النهائي','بطاقة المستورد']),
 quiz('الحلقة 4: إيه المطلوب لتوقيع المستورد إلكترونيًا على المرفقات بنافذة؟',['فتح المرفق وتفعيل زر التوقيع ثم إدخال PIN','رفع الفاتورة من غير توقيع','تغيير مصدر الشحنة','إنشاء رقم 46']),
 quiz('الحلقة 4: في المثال قبل شحن البضاعة، البنك يربط إيه أولًا؟',['مرفق الفاتورة ببيانات الاعتماد','إذن التسليم','مستند الوصول النهائي','أمر الفسح بعد المعاينة']),
 quiz('الحلقة 5: إيه الفرق بين الاستيراد للاتجار والإنتاج؟',['الاتجار لإعادة البيع، والإنتاج يدخل في تصنيع منتج جديد','الاتجار للمواد الخام فقط','الاتجار للشحن الجوي فقط','مفيش فرق']),
 quiz('الحلقة 5: الاستخدام الخاص للشركات يشمل مثال إيه؟',['ماكينات ومكاتب لمنفعة النشاط','سلع لإعادة البيع كما هي','متعلقات مسافر مستعملة','شحن طرود بريدية']),
 quiz('الحلقة 5: لو بدأت الإجراءات قبل وصول السفينة في السيناريو المعروض، الإقرار يتسجل في أي دفتر؟',['دفتر 15','دفتر 1','دفتر الحضور','دفتر التحصيل البنكي']),
 quiz('الحلقة 5: إيه اللي بيميز إجراء الإفراج العادي بعد وصول الشحنة وربط إذن التسليم؟',['قيد دفتر 1 ومراحل الإجراءات معًا','قيد دفتر 15 بالضرورة','إلغاء المعاينة تلقائيًا','مش محتاج شهادة جمركية'])
];
const planned=[6,6,10,5,6,4,5,6,5,7];
export function makeImportVerseWorkshop(language:'ar'|'en'='ar'):Activity[]{
 const yes=language==='ar';
 const a=(s:string,e:string)=>yes?s:e;
 const deck:Activity[]=[
  {...sample('Quiz',language),prompt:a('ImportVerse | بوابة المعرفة: رحلة مالك من التسجيل للإفراج','ImportVerse | Importer journey knowledge gateway'),
   questions:[bank[0],bank[3],bank[6],bank[9],bank[15]].map(q=>({...q})),timer:40},
  {...sample('Wheel of Fortune',language),prompt:a('عجلة ImportVerse | تحديات أداء من الحلقات 1–5','ImportVerse Wheel | Explain and perform'),
   points:1000,rounds:5,spinDuration:5,weight:1,sectors:[
   {label:a('التسجيل على نافذة','Nafeza registration'),kind:'challenge',points:0,repeatable:true,detail:a('من الحلقة 1: اشرح التسلسل من الحساب التجاري وتفعيل البريد والموبايل وحتى تفعيل الخدمات الإلكترونية. تقييم 0–10.','Episode 1: Explain business account setup and activation; trainer grades 0–10.')},
   {label:a('Incoterms','Incoterms'),kind:'challenge',points:0,repeatable:true,detail:a('من الحلقة 2: وضّح الفرق العملي بين EXW وFOB وCIF من حيث الالتزامات. تقييم 0–10.','Episode 2: Compare EXW, FOB and CIF responsibilities.')},
   {label:a('تفويض + ACID','Delegation + ACID'),kind:'challenge',points:0,repeatable:true,detail:a('من الحلقة 3: اشرح قبول التفويض وخطوات طلب ACID والبيانات الأساسية. تقييم 0–10.','Episode 3: Explain delegation and ACID request.')},
   {label:a('CargoX + التوقيع','CargoX + e-signature'),kind:'challenge',points:0,repeatable:true,detail:a('من الحلقة 4: اشرح KYC والـEnvelope والتوقيع الإلكتروني على المرفقات. تقييم 0–10.','Episode 4: Explain KYC, envelope and signed attachments.')},
   {label:a('دفتر 15 ودفتر 1','Pre-clearance vs regular'),kind:'challenge',points:0,repeatable:true,detail:a('من الحلقة 5: وضّح الفرق بين دفتر 15 للإفراج المسبق ودفتر 1 بعد الوصول حسب شرح الحلقة. تقييم 0–10.','Episode 5: Explain register 15 versus 1.')}
   ]},
  {...sample('Ultimate Game Show',language),showFormat:'championship',minimumLevels:7,participation:'individual',betEnabled:false,
   prompt:a('التحدي الكبير | خمس حلقات وسبعة مستويات','Championship | Five episodes, seven levels'),timer:0,
   safeLevels:[3,5],questions:[bank[0],bank[4],bank[6],bank[8],bank[9],bank[11],bank[16]].map((q,i)=>({...q,section:a('المستوى '+(i+1),'Level '+(i+1)),
    points:[100,250,500,1000,2000,3500,5000][i],timer:45}))},
  {...sample('Meta Plan',language),prompt:a('ميتا بلان | رتّب المعلومات حسب مرحلة الاستيراد','Meta Plan | Categorize import stages'),
   timer:0,categories:[a('التسجيل والتعاقد','Registration and contract'),a('التفويض وACI','Delegation and ACI'),a('CargoX والإفراج','CargoX and clearance')],
   items:[a('تفعيل البريد والموبايل','Activate email and phone'),a('إصدار الفاتورة المبدئية','Create proforma invoice'),a('قبول شركة التخليص للتفويض','Agent accepts delegation'),a('إدراج بيانات المستورد والمصدر والشحنة','Enter parties and shipment'),a('رفع Envelope على CargoX','Upload CargoX envelope'),a('بدء الإجراءات الجمركية ورقم 46','Start declaration and obtain number 46')],
   assignments:[0,0,1,1,2,2]},
  {...sample('Escape Room',language),prompt:a('غرفة الهروب | أنقذ رحلة مالك من خطأ المستندات','Escape Room | Rescue Malik’s shipment'),
   rooms:[
   {title:a('باب التفويض','Delegation gate'),narrative:a('شركة التخليص اتفوضت لكن التفويض مش ساري. إيه الخطوة الناقصة؟','Broker delegation remains pending. Which step activates it?'),
     hint:a('شركة التخليص لازم تقبل التفويض من حسابها.','The broker must accept it.'),hintAfter:1,puzzles:[bank[6]]},
   {title:a('بوابة CargoX','CargoX gate'),narrative:a('المصدر رفع مستندات لكن المستورد مش عارف يوقّع. اختار الإجراء الصح.','Exporter uploaded docs; what must importer do to sign?'),
     hint:a('افتح المرفق وأكمل بياناته ثم استخدم eToken.','Open attachment and use eToken.'),hintAfter:1,
     puzzles:[bank[11]]}
   ]},
  {...sample('Live Poll',language),prompt:a('من أي حلقة حاسس إنك محتاج تدريب عملي أكتر؟','Which episode needs more hands-on practice?'),
   timer:30,pollKind:'choice',options:[a('حساب نافذة · 1','Account · 1'),a('العقد والاعتماد · 2','Contract · 2'),a('تفويض وACID · 3','ACI · 3'),a('CargoX أو الإفراج · 4–5','CargoX/Clearance · 4–5')]},
  {...sample('Order It',language),prompt:a('رتّب رحلة مالك: التسجيل → التعاقد → تفويض → مستندات → إفراج','Put Malik’s import stages in order'),
   timer:75,items:[a('بدء الإجراءات الجمركية ورقم 46','Start customs declaration'),a('فتح حساب تجاري بنافذة','Open Nafeza business account'),
    a('إصدار فاتورة مبدئية وتعاقد','Agree proforma and contract'),a('رفع وتوقيع المرفقات عبر CargoX ونافذة','Upload and sign documents'),a('التفويض ثم طلب ACID','Delegate and request ACID')],
   order:[1,2,4,3,0]},
  {...sample('Open the Box',language),prompt:a('افتح الصندوق | خمس حلقات وتحديات الشرح','Open the Box | Explain five episode concepts'),
   timer:0,points:1000,rounds:5,items:[a('التسجيل','Registration'),a('Incoterms','Incoterms'),a('تفويض','Delegation'),a('CargoX','CargoX'),a('الإفراج','Clearance')],
   boxes:[
    {kind:'challenge',points:0,detail:a('الحلقة 1: اعرض على زملائك خطوات إنشاء حساب تجاري وتفعيل الخدمات الإلكترونية.','Ep 1: Show business account activation.')},
    {kind:'challenge',points:0,detail:a('الحلقة 2: اشرح فرق EXW وFOB وCIF واختبر زميلك في التزامات البائع.','Ep 2: Compare EXW, FOB, CIF.')},
    {kind:'challenge',points:0,detail:a('الحلقة 3: مثل دور المستورد وشركة التخليص في قبول تفويض نافذة.','Ep 3: Roleplay delegation acceptance.')},
    {kind:'challenge',points:0,detail:a('الحلقة 4: اشرح سلسلة رفع Envelope وتوقيع المستورد للمرفقات.','Ep 4: Explain CargoX and eToken.')},
    {kind:'challenge',points:0,detail:a('الحلقة 5: اشرح سيناريو بدء الإجراءات قبل الوصول وبعده، ودفتر 15/1.','Ep 5: Compare clearance timing and records.')}
   ]},
  {...sample('Flashcards',language),prompt:a('بطاقات ImportVerse | راجع 5 مفاهيم أساسية','ImportVerse Flashcards | Five key concepts'),
   flipPermission:'host',trainingMode:'challenge',scored:true,points:1000,
   fronts:[a('الحلقة 1: إيه الخطوة بعد تفعيل البريد؟','Ep1: What follows email activation?'),
    a('الحلقة 2: إيه المقصود بـ Incoterms؟','Ep2: Define Incoterms.'),
    a('الحلقة 3: التفويض بيسري إمتى؟','Ep3: When is delegation effective?'),
    a('الحلقة 4: إيه معنى Envelope وKYC؟','Ep4: Define Envelope and KYC.'),
    a('الحلقة 5: الفرق بين دفتر 15 ودفتر 1؟','Ep5: Compare register 15 and 1.')],
   backs:[a('تسجيل الدخول وتفعيل الموبايل ثم الخدمات الإلكترونية.','Login, activate phone then services.'),
    a('شروط غرفة التجارة الدولية لتوزيع مسؤوليات النقل والتكاليف.','Trade terms allocating delivery obligations and costs.'),
    a('بعد ما شركة التخليص تراجع التفويض وتقبل من حسابها.','After the broker accepts it.'),
    a('Envelope ظرف مستندات رقمي؛ KYC التحقق من هوية الشركة.','Digital document envelope; know your customer verification.'),
    a('بحسب سيناريو الحلقة: 15 إفراج مسبق قبل الوصول، و1 إفراج عادي بعد الوصول.','In the episode: 15 pre-arrival, 1 after arrival.')]},
  {...sample('Scenario Challenge',language),prompt:a('تحدي المواقف | مالك قدام قرار مهم في CargoX والإفراج','Decision challenge | CargoX and clearance'),
   start:'start',scored:true,timer:0,nodes:[
    {id:'start',text:a('وصل إشعار إن المصدر رفع المستندات على CargoX، بس البنك مش شايفها. إيه أول خطوة صحيحة؟','CargoX uploaded docs but bank cannot see them. What first?'),correctChoice:0,
     choices:[{label:a('أراجع وأوقّع المستندات وأبدأ الإجراءات البنكية','Review, sign and initiate banking'),next:'verified',points:200,consequence:a('قللت خطر نقل مستند غير مُراجع.','Risk reduced.')},
      {label:a('أعتبر وصول المرفقات كفاية من غير توقيع','Skip document signature'),next:'risk',points:0,consequence:a('مخاطرة بتداول بيانات خاطئة.','Risk of unverified transfer.')} ]},
    {id:'verified',text:a('المصدر أرسل الفاتورة والبضاعة لسه ما اتشحنتش. إيه اللي ينفع تربطه بنكيًا دلوقتي؟','Invoice arrived before shipment. What can be linked with the bank now?'),correctChoice:0,
     choices:[{label:a('أربط الفاتورة ببيانات الاعتماد، والبوليصة لاحقًا','Link invoice now and B/L after shipping'),next:'done',points:400,consequence:a('تسلسل معتمد لنقل الحيازة.','Authorized transfer sequence.')},
       {label:a('أربط البوليصة قبل وجود بيانات شحنها','Link B/L without shipping data'),next:'risk',points:0,consequence:a('العملية لم تُستكمل.','Transfer not complete.')}]},
    {id:'done',ending:true,text:a('المسار الصحيح وفق الحلقة 4: مراجعة ثم توقيع مرفقات ثم إجراءات بنكية وربط الفاتورة.','Ep4 path: review, sign, initiate banking and link invoice.'),discussion:a('ما المخاطر التي تجنبتها قبل التوقيع؟','What risks did you avoid?')},
    {id:'risk',ending:true,text:a('مسار غير آمن: عملية ناقصة أو بيانات غير موثقة.','Unsafe path: incomplete or unverified transfer.'),discussion:a('أين تتدخل لتصحيح القرار؟','Where should you intervene?')}
   ]}
 ];
 return deck.map((activity,i)=>({...activity,plannedMinutes:planned[i],contentSource:'ImportVerse MP3 Episodes 1–5 (transcripts verified); Episode 6 transcript unavailable; regulatory facts need current review'}));
}
export const importVersePlannedMinutes=planned.reduce((sum,n)=>sum+n,0);
