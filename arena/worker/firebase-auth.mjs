const decoder=new TextDecoder();
const fromUrlBase64=value=>{
 const raw=atob(value.replace(/-/g,"+").replace(/_/g,"/").padEnd(Math.ceil(value.length/4)*4,"="));
 return Uint8Array.from(raw,c=>c.charCodeAt(0));
};
let cachedKeys=null,keysExpire=0;
async function googleKeys(){
 if(cachedKeys&&Date.now()<keysExpire)return cachedKeys;
 const response=await fetch("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com");
 if(!response.ok)throw Error("Firebase public keys unavailable");
 const body=await response.json();
 if(!Array.isArray(body.keys))throw Error("Invalid Firebase keys");
 cachedKeys=body.keys;keysExpire=Date.now()+3600000;
 return cachedKeys;
}
export async function verifyFirebaseIdToken(token,projectId){
 if(typeof token!=="string"||token.length>8192)throw Error("Invalid ID token");
 const parts=token.split(".");
 if(parts.length!==3)throw Error("Invalid ID token format");
 let header,payload;
 try{
  header=JSON.parse(decoder.decode(fromUrlBase64(parts[0])));
  payload=JSON.parse(decoder.decode(fromUrlBase64(parts[1])));
 }catch{throw Error("Malformed ID token")}
 const now=Math.floor(Date.now()/1000);
 if(header.alg!=="RS256"||typeof header.kid!=="string")throw Error("Unsupported token signature");
 if(payload.aud!==projectId||payload.iss!=="https://securetoken.google.com/"+projectId||typeof payload.sub!=="string"||!payload.sub||payload.sub.length>128||!Number.isFinite(payload.exp)||payload.exp<=now||!Number.isFinite(payload.iat)||payload.iat>now)throw Error("ID token claims invalid");
 const jwk=(await googleKeys()).find(key=>key.kid===header.kid);
 if(!jwk)throw Error("Unknown Firebase signing key");
 const publicKey=await crypto.subtle.importKey("jwk",jwk,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["verify"]);
 const bytes=new TextEncoder().encode(parts[0]+"."+parts[1]);
 if(!await crypto.subtle.verify("RSASSA-PKCS1-v1_5",publicKey,fromUrlBase64(parts[2]),bytes))throw Error("ID token signature invalid");
 return {uid:payload.sub,email:payload.email??null};
}
