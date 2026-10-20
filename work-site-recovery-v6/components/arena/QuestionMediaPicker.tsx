'use client';
import {useState,type ChangeEvent} from 'react';
import {ImagePlus,Link2,Trash2,Upload,Video} from 'lucide-react';
import {uploadArenaMedia,errorText} from '../../lib/client';
import StageMedia from './StageMedia';
import {classifyMediaLink} from '../../lib/media-url';
export type QuestionMedia={type:'image'|'video';url:string;alt?:string};
export default function QuestionMediaPicker({ar,value,onChange,onError}:{
 ar:boolean;value:QuestionMedia|undefined;onChange:(next:QuestionMedia|undefined)=>void;onError:(message:string)=>void
}){
 const t=(a:string,e:string)=>ar?a:e;
 const [busy,setBusy]=useState(false);
 const mediaType=value?.type||'image';
 const update=(change:Partial<QuestionMedia>)=>onChange({...value,type:mediaType,url:value?.url||'',...change});
 async function onFile(e:ChangeEvent<HTMLInputElement>){
  const file=e.currentTarget.files?.[0];if(!file)return;
  setBusy(true);onError('');
  try{
   const uploaded=await uploadArenaMedia(file);
   onChange({...uploaded,alt:value?.alt||''});
  }catch(err:any){onError(errorText(String(err?.message||'MEDIA'),ar));}
  finally{setBusy(false);e.currentTarget.value='';}
 }
 return <section className="question-media-picker" aria-label={t('وسائط السؤال','Question media')}>
  <div className="question-media-picker__heading"><ImagePlus size={20}/>
   <div><strong>{t('صورة أو فيديو للسؤال','Image or video for this question')}</strong>
    <small>{t('بتظهر للمتدرب مع السؤال. استخدم محتوى تدريب غير سري.',
     'Shown to learners with this question. Use non-confidential training material.')}</small></div>
  </div>
  <div className="question-media-picker__options">
   <label>{t('نوع الوسيط','Media type')}
    <select value={mediaType} onChange={e=>update({type:e.target.value as 'image'|'video'})}>
     <option value="image">{t('صورة','Image')}</option><option value="video">{t('فيديو','Video')}</option>
    </select>
   </label>
   <label><span><Link2 size={15}/>{t('رابط صورة أو فيديو أو YouTube','Image, video or YouTube link')}</span>
    <input type="url" dir="ltr" placeholder="https://example.com/media.jpg or https://youtu.be/..."
     value={value?.url||''} onChange={e=>update({url:e.target.value,type:classifyMediaLink(e.target.value)||mediaType})}/>
   </label>
  </div>
  <div className="question-media-picker__upload">
   <label className="btn secondary question-media-picker__file">
    <Upload size={17}/>{busy?t('جاري الرفع…','Uploading…'):t('ارفع صورة أو فيديو من جهازك','Upload image or video from device')}
    <input type="file" accept="image/png,image/jpeg,image/webp,video/mp4,video/webm"
     disabled={busy} onChange={onFile} aria-label={t('اختار ملف للرفع','Choose a media file')}/>
   </label>
   {value?.url&&<button className="btn secondary" type="button" onClick={()=>onChange(undefined)}>
    <Trash2 size={16}/>{t('احذف الوسيط','Remove media')}</button>}
  </div>
  <small className="question-media-picker__limit"><Video size={13}/>
   {t('الصورة حتى 10 ميجابايت، والفيديو حتى 50 ميجابايت. الرفع عبر Cloudinary بعد تفعيل إعداداتها.',
      'Images up to 10 MB, videos up to 50 MB. Cloudinary upload requires its configured preset.')}
  </small>
  {value?.url&&<label>{t('وصف الصورة أو الفيديو','Alternative description')}
   <input maxLength={200} value={value.alt||''} onChange={e=>update({alt:e.target.value})}/>
  </label>}
  {value?.url&&/^https:\/\//i.test(value.url)&&<StageMedia media={value}/>}
 </section>;
}
