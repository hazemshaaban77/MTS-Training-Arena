import {service,ApiError} from './service';
import {firebaseConfig} from './firebase-config';
import {authorizeFirebaseTrainer} from './firebase-verifier.mjs';
import {checkRate} from './request-security';
import {trainerProfile} from './roles';
import {connectTrainer} from './trainer-link';
export async function handleArenaRequest(req:Request,db:D1Database|undefined,authorize=authorizeFirebaseTrainer,options:{adminUids?:string[];provision?:(input:any)=>Promise<any>}={}){try{
 const url=new URL(req.url),path=url.pathname;
 if(req.method==='POST'&&req.headers.get('origin')&&url.origin!==req.headers.get('origin'))return Response.json({error:'ORIGIN'},{status:403});
 if(db)await checkRate(db,req);
 const needsTrainer=['/api/me','/api/connect','/api/sessions','/api/control','/api/drafts','/api/catalog','/api/admin','/api/report'].includes(path)||(path==='/api/branding'&&req.method==='POST')||(path==='/api/state'&&url.searchParams.get('role')==='host');
 let trainer:any=null;
 if(needsTrainer){
  if(path==='/api/me'&&!req.headers.get('X-Firebase-Token'))return Response.json({authenticated:false,provider:'firebase'},{headers:{'Cache-Control':'no-store'}});
  try{trainer=await authorize(req,{projectId:firebaseConfig.projectId,databaseURL:firebaseConfig.databaseURL});}
  catch(e:any){const code=e.message||'INVALID_TOKEN';if(code==='AUTH_NETWORK'&&typeof e.stage==='string'){console.warn('Arena trainer authentication upstream unavailable',{stage:e.stage,path});return Response.json({error:'AUTH_NETWORK',stage:e.stage},{status:503,headers:{'Cache-Control':'no-store'}});}throw new ApiError(code,code==='TRAINER_NOT_ALLOWED'?403:['AUTH_NETWORK','FIREBASE_CONFIG'].includes(code)?503:401);}
 }
 const profile=trainer&&db?await trainerProfile(db,trainer,options.adminUids):null;
 if(path==='/api/me'&&req.method==='GET')return Response.json({authenticated:true,provider:'firebase',name:trainer.name,email:trainer.email,uid:trainer.uid,role:profile?.role||'trainer',owner:trainer.owner},{headers:{'Cache-Control':'no-store'}});
 if(!db)return Response.json({error:'DATABASE'},{status:503});
 if(path==='/api/connect'&&req.method==='POST'){
  const siteUser=req.headers.get('oai-authenticated-user-id');if(siteUser)await connectTrainer(db,siteUser,trainer.uid);
  return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}});
 }
 return Response.json(await service(db,req,trainer?.owner||null,{...profile,provision:options.provision}),{headers:{'Cache-Control':'no-store'}});
}catch(e){if(e instanceof ApiError)return Response.json({error:e.code},{status:e.status});console.error('Arena request failed',{name:e instanceof Error?e.name:'Unknown',path:new URL(req.url).pathname});return Response.json({error:'SERVER'},{status:500});}}
