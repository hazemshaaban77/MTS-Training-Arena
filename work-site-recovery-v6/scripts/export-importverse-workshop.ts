import {writeFileSync,mkdirSync} from 'node:fs';
import {makeImportVerseWorkshop,importVersePlannedMinutes} from '../lib/importverse-workshop';
import {importVerseQuestions} from '../lib/importverse-question-bank';
import {validateDeck} from '../lib/domain.mjs';

const activities=validateDeck(makeImportVerseWorkshop('ar'));
if(activities.length!==10||importVersePlannedMinutes!==60||importVerseQuestions.length!==140)throw Error('Incomplete ImportVerse 60-minute workshop');
if(activities[2]?.questions?.length<7)throw Error('Championship less than seven levels');
for(const x of importVerseQuestions){
 if(!x.explanation||!x.prompt||/مالك|قصة مالك|رحلة مالك/.test(x.prompt)||!['Quiz','True/False','Dropdown','Match It','Order It','Fill Blank'].includes(x.activity.type))throw Error('Invalid business question '+x.id);
 validateActivity(structuredClone(x.activity));
}
const payload={
 title:'ImportVerse — Business Knowledge Challenge | 60 دقيقة | الحلقات الستة',
 language:'ar',teams:false,
 settings:{tie:'shared',teamNames:['فريق البرق','فريق الموج'],progression:'manual',reveal:'manual',surveyOnly:false},
 activities,survey:null,
 sourceNote:'Episodes 1–5: MP3 text extracts. Episode 6: user-uploaded shipping and marine insurance Word script. Technical, legal and insurance terms must be separately reviewed against current primary sources.',
 bankCount:importVerseQuestions.length,plannedMinutes:importVersePlannedMinutes,questionFormats:['Quiz','True/False','Dropdown','Match It','Order It','Fill Blank']
};
const dir='../deployment-bundles/v6';mkdirSync(dir,{recursive:true});
writeFileSync(dir+'/importverse-draft.json',JSON.stringify(payload,null,2));
writeFileSync(dir+'/importverse-question-bank.json',JSON.stringify({name:'ImportVerse | Business operations · six episodes',count:importVerseQuestions.length,
 verification:'Audio transcript review; not current-law verification',questions:importVerseQuestions},null,2));
console.log('ImportVerse workshop exported: ten activities, 60 minutes, 140 business questions.');
