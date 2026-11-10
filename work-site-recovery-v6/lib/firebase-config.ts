// Public Firebase web configuration retained from the existing Arena repository.
// This contains no service-account credentials.
export const firebaseConfig = {
  "apiKey": "AIzaSyD6rWwK4hQCvDaMlMIntHurpIEyl10AQQI",
  "authDomain": "mts-quiz-64faa.firebaseapp.com",
  "databaseURL": "https://mts-quiz-64faa-default-rtdb.europe-west1.firebasedatabase.app",
  "projectId": "mts-quiz-64faa"
} as const;

export type ArenaFirebaseConfig={apiKey:string;authDomain:string;databaseURL:string;projectId:string};
/** Public web config only. Reject production identities and unrelated RTDB hosts. */
export function stagingFirebaseConfig(raw:unknown):ArenaFirebaseConfig{
 let c:any;try{c=typeof raw==='string'?JSON.parse(raw):raw;}catch{throw Error('STAGING_FIREBASE_NOT_CONFIGURED');}
 if(!c||typeof c.projectId!=='string'||!/^mts-arena-e2-[a-z0-9-]{3,30}$/.test(c.projectId)||
  c.projectId===firebaseConfig.projectId||typeof c.apiKey!=='string'||!/^AIza[\w-]{20,100}$/.test(c.apiKey)||
  c.apiKey===firebaseConfig.apiKey||c.authDomain!==c.projectId+'.firebaseapp.com')throw Error('STAGING_FIREBASE_NOT_CONFIGURED');
 let u:URL;try{u=new URL(c.databaseURL);}catch{throw Error('STAGING_FIREBASE_NOT_CONFIGURED');}
 const escaped=c.projectId.replace(/-/g,'\\-');
 if(u.protocol!=='https:'||u.username||u.password||u.port||u.search||u.hash||u.pathname!=='/'||
  !new RegExp('^'+escaped+'(?:-default-rtdb)?(?:\\.[a-z0-9-]+)?\\.(?:firebasedatabase\\.app|firebaseio\\.com)$').test(u.hostname))throw Error('STAGING_FIREBASE_NOT_CONFIGURED');
 return {projectId:c.projectId,apiKey:c.apiKey,authDomain:c.authDomain,databaseURL:u.origin};
}
