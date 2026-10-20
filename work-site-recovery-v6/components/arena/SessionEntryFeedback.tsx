'use client';
import {Clock3,Radio,RefreshCw,ShieldAlert,ArrowRight} from 'lucide-react';

/** Participant-side state outside the existing locked registration form.
 * Never accepts credentials, changes player identity, or claims admission.
 */
export type EntryStatus='not-ready'|'unavailable'|'invalid'|'not-found';
export default function SessionEntryFeedback({
 ar,kind,title,onRetry,onChangeCode
}:{ar:boolean;kind:EntryStatus;title?:string;onRetry?:()=>void;onChangeCode:()=>void}){
 const t=(arabic:string,english:string)=>ar?arabic:english;
 const waiting=kind==='not-ready',invalid=kind==='invalid',notFound=kind==='not-found';
 const headline=waiting?t('الجلسة لسه بتتجهّز','Your session is being prepared'):
  invalid?t('راجع كود الجلسة','Check your session code'):
  notFound?t('الجلسة دي مش موجودة','Session not found'):
  t('مش قادرين نوصل للجلسة حاليًا','We can’t reach this session right now');
 const detail=waiting?
  t('المدرب لسه ما فتحش استقبال المتدربين. أول ما يفتح الدخول هتقدر تكتب بياناتك في صفحة التسجيل المعتادة.',
    'Your trainer has not opened participant registration yet. Once the lobby opens, you can enter your details in the usual registration form.'):
  invalid?t('كود الجلسة لازم يكون 6 أرقام. امسح الـQR الصحيح أو ارجع اكتب الكود من جديد.',
    'A session code must contain 6 digits. Scan the correct QR or enter the code again.'):
  notFound?t('مفيش جلسة بالكود ده. راجع الست أرقام أو امسح QR الجلسة من شاشة المدرب.',
    'No session matches this code. Check all six digits or scan the QR on your trainer’s screen.'):
  t('ممكن يكون الكود غير صحيح أو الاتصال غير متاح. بياناتك ما اتبعتتش؛ جرّب الاتصال تاني أو اطلب الكود من المدرب.',
    'The code may be incorrect, or the connection may be unavailable. No registration was submitted. Retry or ask your trainer for the session code.');
 return <main className="join-page session-entry-feedback">
  <div className="join-orbit" aria-hidden="true"/>
  <section className="join-card session-entry-feedback__card" aria-live={waiting?'polite':'off'}>
   <span className={'session-entry-feedback__icon '+(waiting?'is-waiting':'is-error')}>
    {waiting?<Radio size={35}/>:invalid?<ShieldAlert size={35}/>:<Clock3 size={35}/>}
   </span>
   <span className="eyebrow">{waiting?t('في انتظار فتح التسجيل','WAITING FOR THE LOBBY'):t('تعذّر فتح الجلسة','SESSION ACCESS')}</span>
   {title&&<p className="session-entry-feedback__session">{title}</p>}
   <h1>{headline}</h1>
   <p className="muted">{detail}</p>
   {waiting&&<p className="session-entry-feedback__hint" role="status">
     {t('لو المدرب فتح الجلسة، تقدر تحدّث الحالة هنا.','If your trainer has opened the lobby, refresh your status here.')}
   </p>}
   <div className="session-entry-feedback__actions">
    {!invalid&&!notFound&&onRetry&&<button type="button" className="btn primary wide" onClick={onRetry}>
     <RefreshCw size={18}/>{waiting?t('تحديث حالة الجلسة','Refresh session status'):t('إعادة المحاولة','Try again')}
    </button>}
    <button type="button" className={'btn '+(invalid||notFound?'primary':'secondary')+' wide'} onClick={onChangeCode}>
     <ArrowRight size={18}/>{t('أدخل كود مختلف','Use a different session code')}
    </button>
   </div>
   <p className="private-note">{t('صفحة تسجيل المتدرب وبياناتها هتظهر كما هي بمجرد فتح الدخول.',
    'The usual participant registration form will appear unchanged once entry is open.')}</p>
  </section>
 </main>;
}
