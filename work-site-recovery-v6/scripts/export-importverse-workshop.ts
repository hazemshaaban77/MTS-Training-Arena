import {writeFileSync,mkdirSync} from 'node:fs';
import {makeImportVerseWorkshop,importVersePlannedMinutes} from '../lib/importverse-workshop';
import {importVerseQuestions} from '../lib/importverse-question-bank';
import {validateDeck} from '../lib/domain.mjs';

const activities=validateDeck(makeImportVerseWorkshop('ar'));
if(activities.length!==10||importVersePlannedMinutes!==60||importVerseQuestions.length!==64)throw Error('Incomplete ImportVerse 60-minute workshop');
if(activities[2]?.questions?.length<7)throw Error('Championship less than seven levels');
for(const x of importVerseQuestions){
 if(x.options.length!==4||x.correct<0||x.correct>3||!x.explanation||x.activity.type!=='Quiz')throw Error('Invalid bank item '+x.id);
}
const payload={
 title:'ImportVerse — The Ultimate Import Challenge | 60 دقيقة | 5 حلقات مؤكدة',
 language:'ar',teams:false,
 settings:{tie:'shared',teamNames:['فريق البرق','فريق الموج'],progression:'manual',reveal:'manual',surveyOnly:false},
 activities,survey:null,
 sourceNote:'MP3 transcripts from episodes 1–5. Episode 6 unavailable for text extraction. Customs regulations require current authoritative verification.',
 bankCount:importVerseQuestions.length,plannedMinutes:importVersePlannedMinutes
};
const dir='../deployment-bundles/v6';mkdirSync(dir,{recursive:true});
writeFileSync(dir+'/importverse-draft.json',JSON.stringify(payload,null,2));
writeFileSync(dir+'/importverse-question-bank.json',JSON.stringify({name:'ImportVerse | Episodes 1–5',count:importVerseQuestions.length,
 verification:'Audio transcript review; not current-law verification',questions:importVerseQuestions},null,2));
console.log('ImportVerse workshop exported: ten activities, 60 minutes, 64 questions.');
