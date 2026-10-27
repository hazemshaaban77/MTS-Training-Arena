import {sample,type Activity} from './catalog';
import {importVerseQuestions} from './importverse-question-bank';

/** Trainer-editable six-episode workshop grounded in speech transcripts of
 * Episodes 1–5 and the user's uploaded Word script of Episode 6.
 * Treat numerical penalties and regulatory/insurance coverage assertions as
 * historical script material, NOT current legal or insurance advice.
 */
export const importVerseSource={
 title:'ImportVerse Episodes 1–6 · 140 business knowledge questions · 60-minute workshop',
 url:'', episodesReviewed:[1,2,3,4,5,6], episodesPending:[],
 note:'Some spoken terminology and regulatory claims may be stale; cross-check with Nafeza.'
};
const curatedIds=[
 'IV-E1-01','IV-E1-02','IV-E1-04',
 'IV-E2-01','IV-E2-02','IV-E2-03',
 'IV-E3-01','IV-E3-02','IV-E3-03',
 'IV-E4-01','IV-E4-02','IV-E4-03','IV-E4-12',
 'IV-E5-01','IV-E5-02','IV-E5-03','IV-E5-04',
 'IV-E6-02','IV-E6-05','IV-E6-08','IV-E6-15','IV-E6-23','IV-E6-24','IV-E6-26'
];
const bank=curatedIds.map(id=>{
 const item=importVerseQuestions.find(x=>x.id===id);
 if(!item)throw Error('Missing ImportVerse question '+id);
 return item.activity;
});
const planned=[6,6,10,5,6,4,5,6,5,7];
export function makeImportVerseWorkshop(language:'ar'|'en'='ar'):Activity[]{
 const yes=language==='ar';
 const a=(s:string,e:string)=>yes?s:e;
 const deck:Activity[]=[
  {...sample('Quiz',language),prompt:a('ImportVerse | بوابة المعرفة: رحلة مالك من التسجيل للإفراج','ImportVerse | Importer journey knowledge gateway'),
   questions:[bank[0],bank[3],bank[6],bank[9],bank[15],bank[17],
    ...['IV-TF-02','IV-TF-08','IV-DD-04','IV-MT-06','IV-OR-03','IV-FB-06'].map(id=>{
     const q=importVerseQuestions.find(x=>x.id===id);
     if(!q)throw Error('Missing mixed format question '+id);
     return q.activity;
    })].map(q=>({...q})),timer:40},
  {...sample('Wheel of Fortune',language),prompt:a('عجلة المهارات | شرح إجراءات التجارة والاستيراد','ImportVerse Wheel | Trade procedure challenges'),
   points:1000,rounds:6,spinDuration:5,weight:1,sectors:[
   {label:a('التسجيل على نافذة','Nafeza registration'),kind:'challenge',points:0,repeatable:true,detail:a('من الحلقة 1: اشرح التسلسل من الحساب التجاري وتفعيل البريد والموبايل وحتى تفعيل الخدمات الإلكترونية. تقييم 0–10.','Episode 1: Explain business account setup and activation; trainer grades 0–10.')},
   {label:a('Incoterms','Incoterms'),kind:'challenge',points:0,repeatable:true,detail:a('من الحلقة 2: وضّح الفرق العملي بين EXW وFOB وCIF من حيث الالتزامات. تقييم 0–10.','Episode 2: Compare EXW, FOB and CIF responsibilities.')},
   {label:a('تفويض + ACID','Delegation + ACID'),kind:'challenge',points:0,repeatable:true,detail:a('من الحلقة 3: اشرح قبول التفويض وخطوات طلب ACID والبيانات الأساسية. تقييم 0–10.','Episode 3: Explain delegation and ACID request.')},
   {label:a('CargoX + التوقيع','CargoX + e-signature'),kind:'challenge',points:0,repeatable:true,detail:a('من الحلقة 4: اشرح KYC والـEnvelope والتوقيع الإلكتروني على المرفقات. تقييم 0–10.','Episode 4: Explain KYC, envelope and signed attachments.')},
   {label:a('دفتر 15 ودفتر 1','Pre-clearance vs regular'),kind:'challenge',points:0,repeatable:true,detail:a('من الحلقة 5: وضّح الفرق بين دفتر 15 للإفراج المسبق ودفتر 1 بعد الوصول حسب شرح الحلقة. تقييم 0–10.','Episode 5: Explain register 15 versus 1.')},
   {label:a('الحاويات والبوليصة','Container and B/L'),kind:'challenge',points:0,repeatable:true,detail:a('من الحلقة 6: اختار الحاوية المناسبة لشحنة معدات ثقيلة، واشرح Shipper وConsignee وNotify Party وACID. تقييم 0–10.','Episode 6: Pick an equipment container and explain B/L parties and ACID.')}
   ]},
  {...sample('Ultimate Game Show',language),showFormat:'championship',minimumLevels:7,participation:'individual',betEnabled:false,
   prompt:a('التحدي الكبير | ست حلقات وسبعة مستويات','Championship | Five episodes, seven levels'),timer:0,
   safeLevels:[3,5],questions:[bank[0],bank[4],bank[6],bank[9],bank[15],bank[20],bank[23]].map((q,i)=>({...q,section:a('المستوى '+(i+1),'Level '+(i+1)),
    points:[100,250,500,1000,2000,3500,5000][i],timer:45}))},
  {...sample('Meta Plan',language),prompt:a('ميتا بلان | رتّب المعلومات حسب مرحلة الاستيراد','Meta Plan | Categorize import stages'),
   timer:0,categories:[a('التسجيل والتعاقد','Registration and contract'),a('التفويض وACI','Delegation and ACI'),a('CargoX والإفراج','CargoX and clearance'),a('الشحن البحري','Marine logistics')],
   items:[a('تفعيل البريد والموبايل','Activate email and phone'),a('إصدار الفاتورة المبدئية','Create proforma invoice'),a('قبول شركة التخليص للتفويض','Agent accepts delegation'),a('إدراج بيانات المستورد والمصدر والشحنة','Enter parties and shipment'),a('رفع Envelope على CargoX','Upload CargoX envelope'),a('بدء الإجراءات الجمركية ورقم 46','Start declaration and obtain number 46'),a('اختيار نوع الحاوية وطلب Booking','Select equipment and booking')],
   assignments:[0,0,1,1,2,2,3]},
  {...sample('Escape Room',language),prompt:a('غرفة الهروب | صحّح أخطاء المستندات والإجراءات','Escape Room | Fix trade document errors'),
   rooms:[
   {title:a('باب التفويض','Delegation gate'),narrative:a('شركة التخليص اتفوضت لكن التفويض مش ساري. إيه الخطوة الناقصة؟','Broker delegation remains pending. Which step activates it?'),
     hint:a('شركة التخليص لازم تقبل التفويض من حسابها.','The broker must accept it.'),hintAfter:1,puzzles:[bank[6]]},
   {title:a('بوابة CargoX','CargoX gate'),narrative:a('المصدر رفع مستندات لكن المستورد مش عارف يوقّع. اختار الإجراء الصح.','Exporter uploaded docs; what must importer do to sign?'),
     hint:a('افتح المرفق وأكمل بياناته ثم استخدم eToken.','Open attachment and use eToken.'),hintAfter:1,
     puzzles:[bank[11]]},
   {title:a('بوابة الشحن البحري','Ocean shipment gate'),narrative:a('مستورد لديه معدات ثقيلة ويحتاج حجز الشحن واختيار الحاوية المناسبة.','Malik has heavy machinery and must choose proper container.'),hint:a('راجع الفرق بين 20 قدم للأوزان المركزة وHigh Cube للأحجام الكبيرة.','Consider 20-foot heavy cargo vs high-volume High Cube.'),hintAfter:1,puzzles:[bank[19]]}
   ]},
  {...sample('Live Poll',language),prompt:a('من أي محور في حلقات ImportVerse الستة محتاج تدريب عملي أكتر؟','Which episode needs more hands-on practice?'),
   timer:30,pollKind:'choice',options:[a('حساب نافذة · 1','Account · 1'),a('العقد والاعتماد · 2','Contract · 2'),a('تفويض وACID · 3','ACI · 3'),a('CargoX والإفراج والشحن · 4–6','CargoX/Clearance · 4–6')]},
  {...sample('Order It',language),prompt:a('رتّب إجراءات الاستيراد: تسجيل → تعاقد → تفويض → مستندات → إفراج','Order the import workflow'),
   timer:75,items:[a('بدء الإجراءات الجمركية ورقم 46','Start customs declaration'),a('فتح حساب تجاري بنافذة','Open Nafeza business account'),
    a('إصدار فاتورة مبدئية وتعاقد','Agree proforma and contract'),a('رفع وتوقيع المرفقات عبر CargoX ونافذة','Upload and sign documents'),a('التفويض ثم طلب ACID','Delegate and request ACID')],
   order:[1,2,4,3,0]},
  {...sample('Open the Box',language),prompt:a('افتح الصندوق | ست حلقات وتحديات الشرح','Open the Box | Explain all six episodes'),
   timer:0,points:1000,rounds:6,items:[a('التسجيل','Registration'),a('Incoterms','Incoterms'),a('تفويض','Delegation'),a('CargoX','CargoX'),a('الإفراج','Clearance'),a('الشحن والتأمين','Shipping and insurance')],
   boxes:[
    {kind:'challenge',points:0,detail:a('الحلقة 1: اعرض على زملائك خطوات إنشاء حساب تجاري وتفعيل الخدمات الإلكترونية.','Ep 1: Show business account activation.')},
    {kind:'challenge',points:0,detail:a('الحلقة 2: اشرح فرق EXW وFOB وCIF واختبر زميلك في التزامات البائع.','Ep 2: Compare EXW, FOB, CIF.')},
    {kind:'challenge',points:0,detail:a('الحلقة 3: مثل دور المستورد وشركة التخليص في قبول تفويض نافذة.','Ep 3: Roleplay delegation acceptance.')},
    {kind:'challenge',points:0,detail:a('الحلقة 4: اشرح سلسلة رفع Envelope وتوقيع المستورد للمرفقات.','Ep 4: Explain CargoX and eToken.')},
    {kind:'challenge',points:0,detail:a('الحلقة 5: اشرح سيناريو بدء الإجراءات قبل الوصول وبعده، ودفتر 15/1.','Ep 5: Compare clearance timing and records.')},
    {kind:'challenge',points:0,detail:a('الحلقة 6: امثل دور وكيل شحن يشرح للمستورد اختيار الحاوية وأنواع البوليصة وأهمية التأمين البحري. الدرجة من 10.','Ep 6: Roleplay freight advisor on equipment, B/L and cargo cover.')}
   ]},
  {...sample('Flashcards',language),prompt:a('بطاقات ImportVerse | راجع 6 مفاهيم أساسية','ImportVerse Flashcards | Five key concepts'),
   flipPermission:'host',trainingMode:'challenge',scored:true,points:1000,
   fronts:[a('الحلقة 1: إيه الخطوة بعد تفعيل البريد؟','Ep1: What follows email activation?'),
    a('الحلقة 2: إيه المقصود بـ Incoterms؟','Ep2: Define Incoterms.'),
    a('الحلقة 3: التفويض بيسري إمتى؟','Ep3: When is delegation effective?'),
    a('الحلقة 4: إيه معنى Envelope وKYC؟','Ep4: Define Envelope and KYC.'),
    a('الحلقة 5: الفرق بين دفتر 15 ودفتر 1؟','Ep5: Compare register 15 and 1.'),a('الحلقة 6: الفرق بين الخط الملاحي والتوكيل ووكيل الشحن؟','Ep6: Distinguish line, shipping agent and forwarder.')],
   backs:[a('تسجيل الدخول وتفعيل الموبايل ثم الخدمات الإلكترونية.','Login, activate phone then services.'),
    a('شروط غرفة التجارة الدولية لتوزيع مسؤوليات النقل والتكاليف.','Trade terms allocating delivery obligations and costs.'),
    a('بعد ما شركة التخليص تراجع التفويض وتقبل من حسابها.','After the broker accepts it.'),
    a('Envelope ظرف مستندات رقمي؛ KYC التحقق من هوية الشركة.','Digital document envelope; know your customer verification.'),
    a('بحسب سيناريو الحلقة: 15 إفراج مسبق قبل الوصول، و1 إفراج عادي بعد الوصول.','In the episode: 15 pre-arrival, 1 after arrival.'),a('الخط ناقل يملك السفينة، التوكيل يمثله محليًا، ووكيل الشحن ينسق عمليات وحجوزات العميل.','Line operates vessels; agent represents locally; forwarder coordinates bookings.')]},
  {...sample('Scenario Challenge',language),prompt:a('تحدي المواقف | قرارات مهنية في CargoX والإفراج','Business decisions | CargoX and clearance'),
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
 return deck.map((activity,i)=>({...activity,plannedMinutes:planned[i],contentSource:'ImportVerse Episodes 1–5 audio transcripts + Episode 6 user Word script · 140 business questions · no fictional storyline · recheck current law and insurance terms'}));
}
export const importVersePlannedMinutes=planned.reduce((sum,n)=>sum+n,0);
