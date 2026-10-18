import {ApiError} from './service';
export async function readJson(req:Request){
 const max=1000000,reader=req.body?.getReader();if(!reader)throw new ApiError('INVALID');const decoder=new TextDecoder();let length=0,text='';
 for(;;){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>max){await reader.cancel();throw new ApiError('TOO_LARGE',413);}text+=decoder.decode(value,{stream:true});}text+=decoder.decode();try{return JSON.parse(text);}catch{throw new ApiError('INVALID');}
}
export async function checkRate(db:D1Database,req:Request){
 if(req.method!=='POST')return;const path=new URL(req.url).pathname,token=req.headers.get('X-Player-Token')||req.headers.get('X-Firebase-Token')||'',bucket=Math.floor(Date.now()/60000),source=(req.headers.get('CF-Connecting-IP')||'gateway')+':'+path+':'+(['/api/recover','/api/join'].includes(path)?'':token)+':'+bucket;
 const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(source))),key=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
 const limit=path==='/api/media-upload'?10:path==='/api/recover'?10:path==='/api/join'?120:180;
 const r:any=await db.prepare('INSERT INTO rate_buckets(key,count,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(key,Date.now()+120000).first();if(r.count>limit)throw new ApiError('RATE_LIMIT',429);
 // Opportunistic bounded cleanup; no identity or token is retained in this table.
 if(r.count===1)await db.prepare('DELETE FROM rate_buckets WHERE key IN (SELECT key FROM rate_buckets WHERE expires<? LIMIT 50)').bind(Date.now()).run();
}
