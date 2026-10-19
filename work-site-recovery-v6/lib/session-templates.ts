import {sample,type Activity} from './catalog';

export type SessionTemplateId='warmup'|'workshop'|'full';
export const sessionTemplateOptions=[
 {id:'warmup',targetMinutes:15,ar:'كسر جليد · 15 دقيقة',en:'Warm-up · 15 min',arDetail:'تصويت ثم اختبار سريع وبطاقات مراجعة',enDetail:'Poll, quick quiz and flashcard review'},
 {id:'workshop',targetMinutes:30,ar:'سيشن تفاعلي · 30 دقيقة',en:'Interactive · 30 min',arDetail:'تصويت، سؤال، ترتيب خطوات، وتحدّي قرار',enDetail:'Poll, quiz, process order and decision challenge'},
 {id:'full',targetMinutes:60,ar:'ورشة كاملة · 60 دقيقة',en:'Full workshop · 60 min',arDetail:'مقدمة ومراجعة وتطبيق جماعي وتقييم',enDetail:'Introduction, review, group practice and assessment'}
] as const;

/**
 * Trainer-editable starting decks, not guaranteed 15/30/60-minute sessions.
 * Workshop time also includes discussions, demonstrations and free-play.
 * Every activity comes from the same validated sample catalog; no saved
 * draft, scoring rule, QR or backend session is mutated by this function.
 */
export function makeSessionStarter(template:SessionTemplateId,language:'ar'|'en'):Activity[]{
 const groups:Record<SessionTemplateId,string[]>={
  warmup:['Live Poll','Quiz','Flashcards'],
  workshop:['Live Poll','Quiz','Order It','Scenario Challenge'],
  full:['Live Poll','Quiz','Scenario Challenge','Meta Plan','Open the Box','Flashcards','Quiz']
 };
 return (groups[template]||groups.warmup).map(type=>sample(type,language));
}
