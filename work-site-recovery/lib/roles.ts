import {ApiError} from './service';
export async function trainerProfile(db:D1Database,user:any,adminUids:string[]=[]){
 const bootstrap=adminUids.includes(user.uid)||user.arenaRole==='admin';
 await db.prepare("INSERT INTO trainer_profiles(uid,email,name,role,enabled,report_owners,updated_at) VALUES(?,?,?,?,1,'[]',?) ON CONFLICT(uid) DO UPDATE SET email=excluded.email,name=excluded.name").bind(user.uid,user.email,user.name,bootstrap?'admin':user.arenaRole==='senior'?'senior':'trainer',Date.now()).run();
 const row:any=await db.prepare('SELECT * FROM trainer_profiles WHERE uid=?').bind(user.uid).first();if(!row.enabled)throw new ApiError('AUTH_DISABLED',403);
 // Only signed claims or server configuration can bootstrap Admin; body/headers cannot.
 if(bootstrap&&row.role!=='admin'){await db.prepare("UPDATE trainer_profiles SET role='admin' WHERE uid=?").bind(user.uid).run();row.role='admin';}
 return {uid:row.uid,role:row.role,reportOwners:JSON.parse(row.report_owners),name:row.name,email:row.email};
}
