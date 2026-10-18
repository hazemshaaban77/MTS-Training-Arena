import {env} from 'cloudflare:workers';
import {handleArenaRequest} from '../../../lib/api-handler';
import {createProvisioner} from '../../../lib/firebase-admin';
const options=()=>{const ids:unknown=Reflect.get(env,'ARENA_ADMIN_UIDS');return {adminUids:typeof ids==='string'?ids.split(',').map(x=>x.trim()).filter(Boolean):[],provision:createProvisioner(Reflect.get(env,'FIREBASE_SERVICE_ACCOUNT'))};};
export const dynamic='force-dynamic';
export const GET=(req:Request)=>handleArenaRequest(req,env.DB,undefined,options());
export const POST=(req:Request)=>handleArenaRequest(req,env.DB,undefined,options());
