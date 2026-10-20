/** Distinct art direction AND distinct melodic/rhythmic sound signature per game.
 * Synthesized locally: no streaming, autoplay, downloads or hidden grading.
 */
export type GameIdentityKey='quiz'|'championship'|'wheel'|'escape'|'box'|'poll'|'plan'|'order'|'cards'|'scenario';
export type IntroNote={pitch:number;at:number;hold:number;wave:'sine'|'triangle'|'square'|'sawtooth'};
export type IntroIdentity={key:GameIdentityKey;introAr:string;introEn:string;tagAr:string;tagEn:string;notes:IntroNote[];noise:'swish'|'rumble'|'tick'|'pulse'};
const n=(pitch:number,at:number,hold:number,wave:IntroNote['wave']='sine'):IntroNote=>({pitch,at,hold,wave});
export const introIdentities:Record<GameIdentityKey,IntroIdentity>={
 quiz:{key:'quiz',introAr:'٤ اختيارات… إجابة واحدة… القرار قرارك!',introEn:'FOUR CHOICES. ONE ANSWER. NO HESITATION.',
  tagAr:'اختبار سرعة التفكير',tagEn:'THE KNOWLEDGE RUSH',
  notes:[n(740,0,.09,'square'),n(932,.14,.09,'square'),n(1175,.29,.09,'square'),n(1480,.52,.46,'sawtooth')],noise:'tick'},
 championship:{key:'championship',introAr:'متسابق واحد… وسلّم للبطولة!',introEn:'ONE CONTESTANT. A LADDER TO GLORY.',
  tagAr:'أضواء المسرح',tagEn:'THE GRAND STAGE',
  notes:[n(196,0,.45,'triangle'),n(293.66,.32,.54,'triangle'),n(392,.65,.65,'sawtooth'),n(587.33,1.05,.72,'sawtooth'),n(783.99,1.72,1.1,'triangle')],noise:'swish'},
 wheel:{key:'wheel',introAr:'دور… دور… وخلي الحظ يتكلم!',introEn:'SPIN THE WHEEL. MAKE YOUR MOVE.',
  tagAr:'ابدأ اللفة',tagEn:'LET IT SPIN',
  notes:[n(523,0,.075,'square'),n(659,.17,.08,'square'),n(784,.35,.08,'square'),n(659,.52,.08,'square'),n(1047,.78,.52,'triangle')],noise:'tick'},
 escape:{key:'escape',introAr:'باب مقفول… لغز… ووقت بيجري!',introEn:'THE DOOR IS LOCKED. THE CLOCK IS TICKING.',
  tagAr:'اكتشف رمز الخروج',tagEn:'UNLOCK THE CODE',
  notes:[n(110,0,.95,'sawtooth'),n(146.83,.6,.85,'triangle'),n(164.81,1.1,.55,'sawtooth'),n(82.4,1.68,.9,'triangle')],noise:'rumble'},
 box:{key:'box',introAr:'اختار صندوق… واكتشف اللي جواه!',introEn:'PICK A BOX. UNLOCK THE SURPRISE.',
  tagAr:'مفاجأة وراء الباب',tagEn:'WHAT IS INSIDE?',
  notes:[n(220,0,.12,'triangle'),n(440,.25,.12,'square'),n(659,.47,.12,'triangle'),n(987.77,.77,.67,'sine')],noise:'swish'},
 poll:{key:'poll',introAr:'الصوت صوتك… والنتيجة بتتكوّن!',introEn:'YOUR VOICE MAKES THE DIFFERENCE.',
  tagAr:'صوتك يفرق',tagEn:'EVERY VOICE COUNTS',
  notes:[n(440,0,.16,'sine'),n(660,.38,.13,'sine'),n(440,.65,.16,'sine'),n(880,1,.46,'sine')],noise:'pulse'},
 plan:{key:'plan',introAr:'من أفكار مبعثرة… لخطة واضحة!',introEn:'CONNECT THE IDEAS. BUILD THE PLAN.',
  tagAr:'فكّر… رتّب… نفّذ',tagEn:'MAKE THE CONNECTION',
  notes:[n(293.66,0,.15,'triangle'),n(369.99,.3,.15,'triangle'),n(440,.6,.18,'triangle'),n(554.37,.92,.65,'triangle')],noise:'pulse'},
 order:{key:'order',introAr:'كل خطوة في مكانها… الترتيب يكسب!',introEn:'PUT EVERY STEP IN THE RIGHT PLACE.',
  tagAr:'فكّر في التسلسل',tagEn:'ORDER IS EVERYTHING',
  notes:[n(261.63,0,.14,'square'),n(329.63,.24,.14,'square'),n(392,.48,.14,'square'),n(523.25,.72,.14,'square'),n(659.25,.96,.5,'triangle')],noise:'tick'},
 cards:{key:'cards',introAr:'اقلب الكارت… واكشف معلومة جديدة!',introEn:'FLIP THE CARD. REVEAL THE ANSWER.',
  tagAr:'ورا الكارت إيه؟',tagEn:'TURN KNOWLEDGE OVER',
  notes:[n(523.25,0,.16,'sine'),n(783.99,.34,.13,'sine'),n(659.25,.66,.18,'sine'),n(1046.5,.99,.42,'triangle')],noise:'swish'},
 scenario:{key:'scenario',introAr:'مفترق طرق… قرارك يغيّر النهاية!',introEn:'TWO PATHS. YOUR CHOICE CHANGES THE STORY.',
  tagAr:'اختار مصيرك',tagEn:'CHOOSE YOUR PATH',
  notes:[n(220,0,.42,'sawtooth'),n(261.63,.51,.34,'triangle'),n(329.63,.95,.24,'triangle'),n(246.94,1.36,.7,'sawtooth')],noise:'rumble'}
};
export function introIdentity(type:string):IntroIdentity{
 const table:Record<string,GameIdentityKey>={
  Quiz:'quiz','Ultimate Game Show':'championship','Wheel of Fortune':'wheel','Spin Wheel':'wheel',
  'Escape Room':'escape','Open the Box':'box','Live Poll':'poll','Meta Plan':'plan',Categorize:'plan',
  'Order It':'order',Flashcards:'cards','Scenario Challenge':'scenario'
 };
 return introIdentities[table[type]||'quiz'];
}
