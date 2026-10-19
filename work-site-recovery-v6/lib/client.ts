import {trainerToken} from './firebase-client';
// Free Cloudflare Pages gateway invokes the same V6 Worker by service binding.
// Keep the original Worker as a browser-network fallback (never a separate database).
const alternateV6Api='https://mts-training-arena-v6-api.hazem-mts-arena.workers.dev';
let connectedApiOrigin:string|null=null;
function apiOrigin():string {
 const external=(import.meta.env?.VITE_ARENA_API_ORIGIN||'').trim().replace(/\/$/,'');
 if(external && !/^https:\/\/[^/]+$/i.test(external)) throw Error('API_NOT_CONFIGURED');
 if(!external && window.location.hostname.endsWith('.github.io')) throw Error('API_NOT_CONFIGURED');
 return connectedApiOrigin || external || window.location.origin;
}
export function arenaLiveUrl(code:string):string|null{
 if(!/^\d{6}$/.test(code))return null;
 try{
  const api=apiOrigin();
  const url=new URL(api);
  if(url.protocol!=='https:')return null;
  url.protocol='wss:';
  url.pathname='/api/live';
  url.searchParams.set('code',code);
  return url.toString();
 }catch{return null;}
}
export async function api(path:string,body?:any,token?:string){
 const firebaseToken=await trainerToken();
 const configured=apiOrigin();
 // Fallback applies ONLY to idempotent GETs. Never resend a POST after network
 // uncertainty: that could duplicate an answer, vote, room, or admin action.
 const canFallback=body===undefined && window.location.hostname.endsWith('.github.io');
 const endpoints=canFallback && configured!==alternateV6Api?[configured,alternateV6Api]:[configured];
 let r:Response|undefined;
 for(const origin of endpoints){
  const attempts=body===undefined?2:1;
  for(let i=0;i<attempts;i++){
   try{
    r=await fetch(origin+'/api/'+path,{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json'}:{}),...(firebaseToken?{'X-Firebase-Token':firebaseToken}:{}),...(token?{'X-Player-Token':token}:{})},body:body?JSON.stringify(body):undefined,cache:'no-store',...(body===undefined?{signal:AbortSignal.timeout(8500)}:{})});
    connectedApiOrigin=origin;
    break;
   }catch{
    if(i<attempts-1)await new Promise(resolve=>setTimeout(resolve,350*(i+1)));
   }
  }
  if(r)break;
 }
 if(!r)throw Error('API_UNREACHABLE');
 let data:any;
 try{data=await r.json();}catch{throw Error('API_BAD_RESPONSE');}
 if(!r.ok){
  // These stage labels are deliberately coarse and contain no identity information.
  if(data.error==='AUTH_NETWORK' && typeof data.stage==='string'){
   if(data.stage.startsWith('google_keys_'))throw Error('AUTH_GOOGLE_KEYS');
   if(data.stage.startsWith('firebase_allowlist_'))throw Error('AUTH_ALLOWLIST_NETWORK');
  }
  throw Error(typeof data.error==='string'?data.error:'SERVER');
 }
 return data;
}
export async function diagnoseArenaConnection():Promise<'READY'|'NETWORK_BLOCKED'|'AUTH_PREFLIGHT_BLOCKED'|'API_FAILURE'>{
 let origin:string;
 try{origin=apiOrigin();}catch{return 'API_FAILURE';}
 try{
  const health=await fetch(origin+'/api/auth-health',{mode:'cors',cache:'no-store'});
  if(!health.ok)return 'API_FAILURE';
 }catch{return 'NETWORK_BLOCKED';}
 try{
  // Intentionally invalid probe; should produce a normal 401 while exercising the
  // exact custom-header CORS preflight used by legitimate trainer login.
  const probe=await fetch(origin+'/api/me',{method:'GET',headers:{'X-Firebase-Token':'arena-connection-test'},mode:'cors',cache:'no-store'});
  if(probe.status===401)return 'READY';
  return 'API_FAILURE';
 }catch{return 'AUTH_PREFLIGHT_BLOCKED';}
}
export function resolveArenaMediaUrl(url:string):string{
 try{
  const parsed=new URL(url);
  if(parsed.protocol==='https:'&&parsed.hostname==='mts-training-arena-v6-api.hazem-mts-arena.workers.dev'&&parsed.pathname.startsWith('/media/')){
   return 'https://mts-training-arena-v6-gateway.pages.dev'+parsed.pathname+parsed.search;
  }
 }catch{}
 return url;
}
export async function uploadArenaMedia(file:File):Promise<{url:string;type:'image'|'video'}>{
 const maxSize=file.type.startsWith('video/')?50_000_000:10_000_000;
 const accepted=['image/jpeg','image/png','image/webp','video/mp4','video/webm'];
 if(!accepted.includes(file.type)||file.size<1)throw Error('MEDIA');
 if(file.size>maxSize)throw Error('TOO_LARGE');
 // Only signed trainers may request upload credentials. The API secret is NEVER
 // given to the browser; authentication, allowlist and rate limit run on Worker.
 const signed=await api('media-sign',{type:file.type,size:file.size});
 type fileType='image'|'video';
 const resourceType:fileType=file.type.startsWith('video/')?'video':'image';
 if(signed.resourceType!==resourceType||signed.maxBytes<file.size||
    !/^[a-z0-9_-]{2,64}$/i.test(signed.cloudName||'')||
    !/^[0-9]{5,32}$/.test(signed.apiKey||'')||
    typeof signed.signature!=='string'||!/^[0-9a-f]{64}$/i.test(signed.signature)||
    !Number.isSafeInteger(signed.timestamp)||!/^mts-training-arena\/uploads$/.test(signed.folder||'')){
   throw Error('API_BAD_RESPONSE');
 }
 const form=new FormData();
 form.append('file',file,file.name);
 form.append('api_key',signed.apiKey);
 form.append('timestamp',String(signed.timestamp));
 form.append('folder',signed.folder);
 form.append('signature',signed.signature);
 const url='https://api.cloudinary.com/v1_1/'+signed.cloudName+'/'+resourceType+'/upload';
 let response:Response;
 try{response=await fetch(url,{method:'POST',body:form});}
 catch{throw Error('CLOUDINARY_UNREACHABLE');}
 let result:any;
 try{result=await response.json();}catch{throw Error('API_BAD_RESPONSE');}
 if(!response.ok)throw Error('CLOUDINARY_UPLOAD_FAILED');
 const securedUrl=result?.secure_url;
 if(typeof securedUrl!=='string')throw Error('API_BAD_RESPONSE');
 try{
  const parsed=new URL(securedUrl);
  if(parsed.protocol!=='https:'||parsed.hostname!=='res.cloudinary.com'||
    !parsed.pathname.startsWith('/'+signed.cloudName+'/'+resourceType+'/upload/'))
   throw Error('API_BAD_RESPONSE');
 }catch{throw Error('API_BAD_RESPONSE');}
 return {url:securedUrl,type:resourceType};
}
export function errorText(code:string,ar:boolean){
 const map:Record<string,[string,string]>={NETWORK_BLOCKED:['سيرفر Cloudflare مش متاح من الشبكة دي. افتح رابط اختبار الاتصال، وجرب من شبكة موبايل مختلفة.','Cloudflare is unreachable from this network. Test the backend link and try another network.'],AUTH_PREFLIGHT_BLOCKED:['التصفح وصل للسيرفر، لكن طلب التحقق من المدرب اتحظر. هراجع إعدادات CORS.','The backend responds, but the browser blocked the trainer authentication request (CORS/preflight).'],API_FAILURE:['خدمة المنصة ردّت بشكل غير متوقع. محتاجين مراجعة حالة السيرفر.','The Arena service returned an unexpected response.'],AUTH_GOOGLE_KEYS:['السيرفر مش قادر يتحقق من مفاتيح تسجيل الدخول بتاعة Google. المشكلة في اتصال السيرفر، مش الباسورد.','The server cannot retrieve Google sign-in verification keys. This is not a password error.'],AUTH_ALLOWLIST_NETWORK:['السيرفر مش قادر يتواصل مع قائمة المدربين المسموح لهم في Firebase.','The server cannot reach the Firebase trainer allowlist.'],API_UNREACHABLE:['المتصفح مش قادر يوصل لسيرفر Cloudflare. راجع الشبكة أو إعدادات الاتصال.','The browser cannot reach the Cloudflare backend. Check connectivity.'],API_BAD_RESPONSE:['سيرفر المنصة رجّع استجابة غير متوقعة.','The platform backend returned an unexpected response.'],ORIGIN:['السيرفر رافض دومين الموقع الحالي. افتح نسخة GitHub الصحيحة.','The backend rejected this website origin. Open the official GitHub Pages URL.'],MEDIA_UNAVAILABLE:['رفع الملفات محتاج تفعيل مخزن الوسائط على السيرفر. استخدم رابط HTTPS مؤقتًا.','Media uploads need server storage configuration. Use a HTTPS link for now.'],API_NOT_CONFIGURED:['لسه رابط السيرفر مش متحدد في إعدادات استضافة GitHub.','The backend URL has not been configured for GitHub Pages yet.'],RATE_LIMIT:['محاولات كتير. استنى دقيقة وجرب تاني.','Too many requests. Wait one minute and retry.'],IMMUTABLE:['الأنشطة اللي بدأت والإجابات المؤكدة محفوظة. عدّل القادم فقط.','Started activities and confirmed answers are locked. Edit future content only.'],PENDING:['طلب دخولك في انتظار اعتماد المدرب.','Your join request is awaiting trainer approval.'],NOT_LAUNCHED:['الجلسة لسه في المراجعة. المدرب هيفتح الدخول.','This session is under review. Your trainer will open the lobby.'],ADMIN_ONLY:['الإجراء ده متاح لمسؤول المنصة فقط.','Only a platform administrator may perform this action.'],ADMIN_SETUP:['اتصال Firebase الإداري يحتاج تهيئة صالحة على السيرفر.','A valid Firebase admin connection must be configured on the server.'],SURVEY:['كمّل أسئلة الاستبيان وراجع الاختيارات.','Complete all survey questions and check the choices.'],MEDIA:['استخدم رابط HTTPS صالح للوسيط.','Use a valid HTTPS media URL.'],REASON:['اكتب سبب واضح من 5 أحرف على الأقل لتوثيق الإجراء.','Enter a clear reason of at least 5 characters for the audit.'],HINT_LOCKED:['جرّب حل اللغز قبل طلب التلميح.','Try the puzzle before requesting a hint.'],TIMEOUT:['انتهى توقيت الغرفة. المدرب يقدر يساعدك بإجراء موثّق.','Room time has expired. Your trainer can help with an audited override.'],ROUNDS_COMPLETE:['جولات النشاط اكتملت أو القطاعات المتاحة انتهت.','All configured turns or available sectors are complete.'],BET:['الرهان أكبر من رصيدك المتاح.','Your stake exceeds your available score.'],ACCOUNT_EXISTS:['تعذر إنشاء الحساب. راجع البريد ومتطلبات الحساب في Firebase.','Could not create this account. Check the email and Firebase account requirements.'],ACCOUNT_ALLOWLIST_INCOMPLETE:['الحساب اتعمل لكن اعتماد المدرب لم يكتمل. راجع مسؤول Firebase قبل إعادة المحاولة.','The account was created but trainer authorization is incomplete. Contact the Firebase administrator before retrying.'],SELF_ROLE:['لا يمكن إيقاف أو تخفيض صلاحية المسؤول الحالي من هذا الحساب.','You cannot disable or demote your current administrator account.'],SAVED:['تم الحفظ.','Saved.'],INVALID_CREDENTIALS:['البريد أو كلمة المرور غير صحيحين.','The email or password is incorrect.'],INVALID_EMAIL:['اكتب بريد إلكتروني صحيح.','Enter a valid email address.'],INVALID_TOKEN:['جلسة المدرب انتهت أو غير صالحة. سجّل الدخول تاني.','Your trainer session is invalid or expired. Sign in again.'],TRAINER_NOT_ALLOWED:['حسابك مش موجود في قائمة مدربين Arena المسموح لهم.','Your account is not in the Arena trainer allowlist.'],AUTH_NETWORK:['تعذر الاتصال بخدمة الدخول. جرّب تاني.','Could not reach the sign-in service. Please retry.'],AUTH_RATE_LIMIT:['محاولات كتير في وقت قصير. استنى شوية وجرب تاني.','Too many attempts. Wait a moment and try again.'],AUTH_DISABLED:['حساب المدرب موقوف. راجع مسؤول المنصة.','This trainer account is disabled. Contact your administrator.'],PASSWORD_PROVIDER_DISABLED:['تسجيل الدخول بالبريد والباسورد غير مفعّل في Firebase.','Email/password sign-in is not enabled in Firebase.'],AUTH_DOMAIN:['دومين المنصة محتاج إضافته في إعدادات Firebase Authentication.','This site domain must be added in Firebase Authentication settings.'],FIREBASE_CONFIG:['إعداد الاتصال بـFirebase محتاج مراجعة.','The Firebase connection configuration needs attention.'],MFA_REQUIRED:['الحساب بيطلب خطوة تحقق إضافية. الدخول مش هيكتمل قبل التحقق.','This account requires an additional verification step.'],EMPLOYEE_ID:['اكتب رقم وظيفي صحيح، من 3 لـ30 حرف أو رقم.','Enter an employee ID of 3–30 letters or digits.'],CONFIRM_IDENTITY:['أكد الاسم والرقم الوظيفي الأول.','Confirm your name and employee ID first.'],ALREADY_REGISTERED:['الرقم الوظيفي ده مسجل بالفعل. استخدم كود الاسترجاع عشان تكمل من الجهاز ده.','This employee ID is already registered. Use your recovery code to continue on this device.'],RECOVERY:['الرقم الوظيفي أو كود الاسترجاع غير صحيح.','The employee ID or recovery code is incorrect.'],SIGN_IN:['سجّل الدخول بحسابك لفتح مساحة المدرب.','Sign in to open your trainer workspace.'],FORBIDDEN:['الجلسة دي تخص مدرب تاني.','This session belongs to another trainer.'],NOT_FOUND:['مش لاقيين الجلسة. راجع كود الدخول.','Session not found. Check the code.'],CODE:['اكتب كود الجلسة المكوّن من 6 أرقام.','Enter a 6-digit session code.'],NAME:['اكتب اسم من حرف واحد لـ40 حرف.','Enter a name of 1–40 characters.'],TEAM:['اختار فريقك الأول.','Choose a team first.'],ENDED:['الجلسة دي انتهت.','This session has ended.'],FULL:['الجلسة وصلت للحد الأقصى: 80 مشارك.','This session has reached 80 participants.'],DECK:['راجع بيانات الأنشطة والإجابات الصحيحة. راجع المؤقت والمراحل وربط الإجابات الصحيحة.','Check activity content and answer keys. Check timers, stages and answer mappings.'],TITLE:['اكتب عنوان للجلسة بحد أقصى 100 حرف.','Enter a session title, up to 100 characters.'],STALE:['حالة الجلسة اتحدّثت. حاول مرة تانية.','Session updated. Try again.'],STATE:['الخطوة دي مش متاحة في حالة الجلسة الحالية.','That action is unavailable in the current state.'],CLOSED:['وقت الإجابة اتقفل. استنى الجولة الجاية.','Answers are closed. Wait for the next round.'],ALREADY_ANSWERED:['إجابتك اتسجلت بالفعل.','Your answer is already recorded.'],PLAYER:['ادخل الجلسة باسمك الأول.','Join the session with your name first.'],ANSWER:['كمّل الإجابة واختار قيمة مختلفة لكل توصيل.','Complete your answer; matching choices must be unique.'],DATABASE:['الجلسات غير متاحة مؤقتًا. جرّب تاني.','Sessions are temporarily unavailable. Please retry.'],SERVER:['حصلت مشكلة في الاتصال. جرّب تاني.','Connection problem. Please retry.']};return (map[code]||map.SERVER)[ar?0:1];
}
