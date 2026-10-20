import {sample,type Activity} from './catalog';
import {validateActivity} from './domain.mjs';

export const knowledgeQuestionTypes=['Quiz','True/False','Dropdown','Fill Blank','Match It','Order It','Image Hotspot'] as const;
export type KnowledgeQuestionType=typeof knowledgeQuestionTypes[number];
export const questionLabels:Record<KnowledgeQuestionType,[string,string]>={
 'Quiz':['اختيار من متعدد','Multiple choice'],
 'True/False':['صح أم غلط','True or false'],
 'Dropdown':['اختيار من قائمة','Dropdown choice'],
 'Fill Blank':['أكمل الفراغ','Fill in the blank'],
 'Match It':['وصّل العناصر','Match pairs'],
 'Order It':['رتّب الخطوات','Put in order'],
 'Image Hotspot':['حدد المكان بالصورة','Image hotspot']
};
export function isKnowledgeQuestionType(value:unknown):value is KnowledgeQuestionType{
 return typeof value==='string'&&knowledgeQuestionTypes.some(x=>x===value);
}
export function newKnowledgeQuestion(type:KnowledgeQuestionType,ar:boolean,number=0):Activity{
 const locale=ar?'ar':'en';
 const quiz=sample('Quiz',locale);
 const base:Activity={...quiz,type,prompt:'',section:'',timer:type==='Match It'||type==='Order It'?45:30,points:1000,speed:true};
 switch(type){
 case 'Quiz':return {...base,options:['','','',''],correct:0};
 case 'True/False':return {...base,options:ar?['صح','غلط']:['True','False'],correct:0};
 case 'Dropdown':return {...base,options:['','',''],correct:0};
 case 'Fill Blank':{const {options,correct,...clean}=base;return {...clean,accepted:['']};}
 case 'Match It':{const {options,correct,...clean}=base;return {...clean,left:['',''],right:['',''],pairs:[0,1]};}
 case 'Order It':{const {options,correct,...clean}=base;return {...clean,items:['',''],order:[0,1]};}
 case 'Image Hotspot':{const {options,correct,...clean}=base;return {...clean,image:'',regions:[{x:.5,y:.5,r:.15}]};}
 }
}
export function changeKnowledgeQuestionType(item:Activity,type:KnowledgeQuestionType,ar:boolean):Activity{
 if(item.type===type)return item;
 const next=newKnowledgeQuestion(type,ar);
 // Changing type must not silently delete the authored prompt, stage, timer or media.
 return {...next,prompt:item.prompt,timer:item.timer,points:item.points??1000,
  weight:item.weight,section:item.section,speed:item.speed,
  media:item.media?structuredClone(item.media):undefined};
}
export function normalizeKnowledgeQuestion(item:Activity,championship=false):Activity{
 const q:Activity={...item,questions:undefined,mainType:undefined,
  prompt:typeof item.prompt==='string'?item.prompt.trim():'',
  timer:Number(item.timer),points:Number(item.points??1000)};
 if(!isKnowledgeQuestionType(q.type))throw Error('TYPE');
 if(championship&&q.type!=='Quiz')throw Error('CHAMPIONSHIP_TYPE');
 if(['Quiz','True/False','Dropdown'].includes(q.type)){
  q.options=Array.isArray(q.options)?q.options.map((x:unknown)=>String(x??'').trim()):[];
  q.correct=Number(q.correct);
 }else if(q.type==='Fill Blank'){
  q.accepted=Array.isArray(q.accepted)?q.accepted.map((x:unknown)=>String(x??'').trim()):[];
 }else if(q.type==='Match It'){
  q.left=Array.isArray(q.left)?q.left.map((x:unknown)=>String(x??'').trim()):[];
  q.right=Array.isArray(q.right)?q.right.map((x:unknown)=>String(x??'').trim()):[];
 }else if(q.type==='Order It'){
  q.items=Array.isArray(q.items)?q.items.map((x:unknown)=>String(x??'').trim()):[];
 }else if(q.type==='Image Hotspot'){
  q.image=typeof q.image==='string'?q.image.trim():'';
 }
 if(q.media){
  q.media={...q.media,url:typeof q.media.url==='string'?q.media.url.trim():'',
   alt:typeof q.media.alt==='string'?q.media.alt.trim():''};
  if(!q.media.url)q.media=undefined;
 }
 if(championship){q.speed=false;q.betEnabled=false;q.participation='individual';q.wrongPenalty=0;}
 // Blank answers must fail before reaching the server, otherwise the author can save
 // a scored question which has no usable correct response.
 if(!q.prompt)throw Error('PROMPT');
 if(['Quiz','True/False','Dropdown'].includes(q.type)&&
  (!Array.isArray(q.options)||q.options.some((x:string)=>!x)))throw Error('CHOICES');
 if(q.type==='Fill Blank'&&(!q.accepted?.length||q.accepted.some((x:string)=>!x)))throw Error('ANSWER');
 if(q.type==='Match It'&&(!q.left?.length||q.left.some((x:string)=>!x)||q.right.some((x:string)=>!x)))throw Error('PAIRS');
 if(q.type==='Order It'&&(!q.items?.length||q.items.some((x:string)=>!x)))throw Error('ORDER');
 validateActivity(structuredClone(q));
 return q;
}
export function questionTypeLabel(type:string,ar:boolean):string{
 const key=isKnowledgeQuestionType(type)?type:'Quiz';
 return questionLabels[key][ar?0:1];
}

/** Matching answers must stay a permutation even when a trainer changes one pair. */
export function setMatchingPair(pairs:number[],row:number,right:number):number[]{
 const p=[...pairs],n=p.length;
 if(row<0||row>=n||right<0||right>=n||!Number.isInteger(row)||!Number.isInteger(right))return p;
 const other=p.indexOf(right);
 if(other===row)return p;
 if(other>=0)p[other]=p[row];
 p[row]=right;
 return p;
}
/** Remove one editable pair and keep the mapping valid for the remaining terms. */
export function deleteMatchingPair(pairs:number[],row:number):number[]{
 const n=pairs.length;
 if(row<0||row>=n||n<=2)return [...pairs];
 const keep=pairs.filter((_,j)=>j!==row).map(v=>v===row?-1:v>row?v-1:v);
 const used=new Set(keep.filter(v=>v>=0));
 const replacement=Array.from({length:n-1},(_,i)=>i).find(i=>!used.has(i));
 return keep.map(v=>v<0?(replacement??0):v);
}
