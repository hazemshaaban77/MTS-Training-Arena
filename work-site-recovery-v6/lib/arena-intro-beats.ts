import type {GameIdentityKey} from './arena-game-identity';
type Beats={ar:[string,string,string];en:[string,string,string];overline:string};
export const gameIntroBeats:Record<GameIdentityKey,Beats>={
 quiz:{ar:['السؤال يظهر','الوقت بدأ','فكّر أسرع'],en:['QUESTION LIVE','CLOCK IS TICKING','THINK FAST'],overline:'KNOWLEDGE // LIVE'},
 championship:{ar:['أضواء المسرح','سلّم البطولة','متسابق واحد'],en:['LIGHTS ON','PRIZE LADDER','ONE CONTENDER'],overline:'THE GRAND SHOW'},
 wheel:{ar:['استعد للدوران','مين عليه الحظ؟','لحظة الاختيار'],en:['WHEEL IS READY','TAKE YOUR CHANCE','THE REVEAL'],overline:'SPIN // FORTUNE'},
 escape:{ar:['المهمة بدأت','فك شفرة الباب','اخرج في الوقت'],en:['MISSION ACCEPTED','CRACK THE CODE','FIND THE EXIT'],overline:'CLASSIFIED // ESCAPE'},
 box:{ar:['اختار صندوق','افتح المفاجأة','اكتشف التحدّي'],en:['PICK A BOX','OPEN THE SECRET','FACE THE CHALLENGE'],overline:'MYSTERY // REVEAL'},
 poll:{ar:['صوتك مهم','التصويت شغال','النتيجة بتظهر'],en:['YOUR VOICE','VOTING IS LIVE','SEE THE PULSE'],overline:'PEOPLE // PULSE'},
 plan:{ar:['وصّل الأفكار','رتّب الأولويات','ابني الخطة'],en:['CONNECT IDEAS','SET PRIORITIES','BUILD THE PLAN'],overline:'IDEAS // IMPACT'},
 order:{ar:['خطوات مبعثرة','دقّق في التسلسل','رتّبها صح'],en:['SHUFFLED STEPS','FIND THE SEQUENCE','SET THE ORDER'],overline:'SEQUENCE // SOLVE'},
 cards:{ar:['كارت مقفول','اقلب واكتشف','ثبّت المعلومة'],en:['CARD FACE DOWN','FLIP TO REVEAL','LOCK IT IN'],overline:'FLIP // DISCOVER'},
 scenario:{ar:['مفترق طرق','اختار القرار','غيّر النهاية'],en:['THE CROSSROADS','MAKE YOUR CHOICE','CHANGE THE ENDING'],overline:'CHOOSE // CONSEQUENCE'}
};
