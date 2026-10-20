'use client';
import {BarChart3,BookOpen,CheckCircle2,FileBarChart2,ShieldCheck,Users} from 'lucide-react';
import {analyzeReportActivities,type ReportInsight} from '../../lib/report-insights';

const labelFor=(insight:ReportInsight,ar:boolean)=>{
 if(insight.kind==='poll')return ar?'توزيع آراء المشاركين':'Participant opinions';
 if(insight.kind==='review')return ar?'مشاركة ومراجعة بدون تصحيح آلي':'Participation and reflection (ungraded)';
 if(insight.kind==='game')return ar?'مشاركة وأحداث لعب موثقة':'Participation and documented game events';
 if(insight.gradedCount)return ar?'إجابات صُححت فعلًا':'Server-graded answers';
 return ar?'البيانات المؤكدة فقط':'Confirmed data only';
};
export default function ReportActivityInsights({report,ar}:{report:any;ar:boolean}){
 const t=(arabic:string,english:string)=>ar?arabic:english;
 const insights=analyzeReportActivities(report);
 return <section className="report-insights" aria-label={t('التحليل التدريبي للأنشطة','Activity learning insights')}>
  <header className="report-insights__heading"><BarChart3 size={23}/>
   <div><h3>{t('التحليل التدريبي لكل نشاط','Learning insights by activity')}</h3>
    <p>{t('من الإجابات والأحداث المسجلة على السيرفر فقط، ومش نسبة نجاح عامة لكل الألعاب.',
      'Based on server-recorded responses and events — no fictitious accuracy for ungraded games.')}</p></div>
  </header>
  {insights.length===0?<p className="report-insights__empty">{t('لسه مفيش أنشطة مسجلة في التقرير.','There are no recorded activities yet.')}</p>:
   <div className="report-insights__list">{insights.map(item=><article key={item.round} className={'report-insights__activity report-insights__activity--'+item.kind}>
    <div className="report-insights__title"><span className="report-insights__round">{String(item.round+1).padStart(2,'0')}</span>
     <div><small>{item.type}</small><h4>{item.prompt}</h4><p>{labelFor(item,ar)}</p></div></div>
    <div className="report-insights__metrics">
     <span><Users size={17}/><b>{item.responseCount}</b>{t('رد مؤكد','confirmed responses')}</span>
     {item.anonymousCount>0&&<span><ShieldCheck size={17}/><b>{item.anonymousCount}</b>{t('رد مجهول منفصل','anonymous submissions')}</span>}
     {item.gradedCount>0&&<span><CheckCircle2 size={17}/><b>{item.correctCount}/{item.gradedCount}</b>
       {t('إجابة صحيحة من المقيمة','correct of graded')}</span>}
     {item.gradedCount>0&&<span className="report-insights__accuracy"><b>{item.accuracy}%</b>{t('دقة الإجابات المقيمة','graded accuracy')}</span>}
     {item.events>0&&<span><BookOpen size={17}/><b>{item.events}</b>{t('حدث لعبة موثق','documented game events')}</span>}
    </div>
    {item.kind==='poll'&&<div className="report-insights__poll-chart" role="group" aria-label={t('رسم بياني للتصويت','Poll chart')}>
     {item.pollMode==='rating'?<div className="report-insights__rating">
      <strong>{item.averageRating==null?t('لا توجد تقييمات','No ratings'):item.averageRating+' / 5'}</strong>
      {item.averageRating!=null&&<div className="report-insights__track" role="meter" aria-valuemin={0} aria-valuemax={5} aria-valuenow={item.averageRating} aria-label={t('متوسط التقييم','Average rating')}>
       <i style={{width:(item.averageRating??0)/5*100+'%'}}/></div>}
      <small>{t('متوسط تقييم المشاركين، وليس نسبة نجاح','Average participant rating, not an accuracy percentage')}</small>
     </div>:item.pollMode==='priority'?
       (item.ranking?.length?<div>{item.ranking.map((row,i)=><div className="report-insights__bar-row" key={i}>
        <div className="report-insights__bar-caption"><span>{row.label}</span><strong>{row.points} {t('نقطة ترتيب','ranking points')}</strong></div>
        <div className="report-insights__track" role="meter" aria-label={row.label} aria-valuemin={0}
          aria-valuemax={Math.max(1,...(item.ranking||[]).map(x=>x.points))} aria-valuenow={row.points}>
         <i style={{width:row.points/Math.max(1,...(item.ranking||[]).map(x=>x.points))*100+'%'}}/>
        </div></div>)}</div>:<p className="report-insights__empty">{t('لا توجد أصوات ترتيب صالحة.','No valid ranking votes recorded.')}</p>)
      :item.pollBars?.some(row=>row.count>0)?
        item.pollBars.map((row,i)=><div className="report-insights__bar-row" key={i}>
         <div className="report-insights__bar-caption"><span>{row.label}</span><strong>{row.count} {t('صوت','votes')} · {row.percent}%</strong></div>
         <div className="report-insights__track" role="meter" aria-label={row.label} aria-valuemin={0}
           aria-valuemax={Math.max(1,item.responseCount)} aria-valuenow={row.count}>
           <i style={{width:row.percent+'%'}}/></div>
        </div>):<p className="report-insights__empty">{t('لا توجد أصوات للعرض البياني.','No votes to plot yet.')}</p>}
    </div>}
    {(item.type==='Flashcards'||item.type==='Meta Plan'||item.type==='Categorize')&&<p className="report-insights__disclaimer">
      {t('النشاط ده مش اختبار صح وغلط. نسبة الإتقان الشخصية أو التصنيف التفصيلي مش متاحة في التقرير الحالي.',
         'This activity is ungraded. Personal mastery and detailed classification progress are not available in this report.')}</p>}
    {item.kind==='game'&&!item.gradedCount&&<p className="report-insights__disclaimer">
      {t('أحداث اللعبة والنقاط الموثقة ما ينفعش تتحسب كنسبة إجابات صحيحة.',
         'Documented game events or score rewards are not equivalent to an answer accuracy rate.')}</p>}
   </article>)}</div>}
  <p className="report-insights__privacy"><FileBarChart2 size={15}/>{t('الردود المجهولة ما بتتربطش بأسماء المتدربين، ومفيش استنتاج لعدد المؤهلين لكل مرحلة.',
    'Anonymous responses are not linked to trainees; eligible participants per round are not inferred.')}</p>
 </section>;
}
