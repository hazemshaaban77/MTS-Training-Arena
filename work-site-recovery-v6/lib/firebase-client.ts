'use client';
import {initializeApp,getApps} from 'firebase/app';
import {initializeAuth,browserSessionPersistence,onIdTokenChanged,signInWithEmailAndPassword,signOut,type Auth,type User} from 'firebase/auth';
import {firebaseConfig,stagingFirebaseConfig} from './firebase-config';
let auth:Auth|undefined;
export function getArenaAuth(){
 if(typeof window==='undefined')throw Error('Browser authentication only');
 // The E2 frontend may reuse V6 trainer AUTH only when this build explicitly
 // selects existing-v6. No Firebase database writes are performed by this client.
 // Live sessions/points remain in the separate Cloudflare D1 bound to E2 Worker.
 const staging=import.meta.env?.VITE_ARENA_STAGE==='e2-staging';
 const mode=import.meta.env?.VITE_ARENA_STAGING_AUTH_MODE;
 if(staging&&!['existing-v6','isolated'].includes(mode))throw Error('STAGING_FIREBASE_NOT_CONFIGURED');
 const config=staging?(mode==='existing-v6'?firebaseConfig:stagingFirebaseConfig(import.meta.env?.VITE_ARENA_STAGING_FIREBASE_CONFIG)):firebaseConfig;
 const appName=staging?'MTS_ARENA_E2_STAGING':'MTS_ARENA';
 if(!auth){const app=getApps().find(a=>a.name===appName)||initializeApp(config,appName);auth=initializeAuth(app,{persistence:browserSessionPersistence});}
 return auth;
}
export function watchTrainer(listener:(user:User|null)=>void){return onIdTokenChanged(getArenaAuth(),listener);}
export async function trainerToken(){if(typeof window==='undefined')return null;const a=getArenaAuth();await a.authStateReady();return a.currentUser?await a.currentUser.getIdToken():null;}
export async function signInTrainer(email:string,password:string){return signInWithEmailAndPassword(getArenaAuth(),email.trim(),password);}
export async function signOutTrainer(){return signOut(getArenaAuth());}
export function firebaseError(code:string){
 if(['auth/invalid-credential','auth/wrong-password','auth/user-not-found','auth/invalid-login-credentials'].includes(code))return 'INVALID_CREDENTIALS';
 if(code==='auth/too-many-requests')return 'AUTH_RATE_LIMIT';
 if(code==='auth/user-disabled')return 'AUTH_DISABLED';
 if(code==='auth/operation-not-allowed')return 'PASSWORD_PROVIDER_DISABLED';
 if(code==='auth/unauthorized-domain')return 'AUTH_DOMAIN';
 if(['auth/invalid-api-key','auth/api-key-not-valid.-please-pass-a-valid-api-key.','auth/app-not-authorized'].includes(code))return 'FIREBASE_CONFIG';
 if(code==='auth/network-request-failed')return 'AUTH_NETWORK';
 if(code==='auth/multi-factor-auth-required')return 'MFA_REQUIRED';
 if(code==='auth/invalid-email')return 'INVALID_EMAIL';
 return code?.startsWith('auth/')?'AUTH_NETWORK':code||'SERVER';
}
