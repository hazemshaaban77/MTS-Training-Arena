/**
 * Read-only V6 worker provenance check. No Cloudflare API token and no deployment.
 * Cloudflare Worker version 9 exposed etag below on 2026-11-04; etag equality
 * is a candidate match, NOT an attestation that Sources/Build are identical.
 */
import {execFileSync} from "node:child_process";
import {createHash} from "node:crypto";
import fs from "node:fs";
const script="deployment-bundles/v6/worker.mjs";
const etag="107afb06369f8502d91ccd52c70d6346e55b041425cb67d48305276b21cc2472";
const refs=[
 "develop/v6-github-arena","feature/v6-game-experience-overhaul",
 "feature/v6-importverse-session-and-gameplay-fixes",
 "feature/v6-final-wheel-projector-flashcards",
 "fix/v6-projector-business-question-variants",
 "fix/v6-legacy-box-judging"
];
const results=[];
for(const ref of refs){
 try{
  const content=execFileSync("git",["show","origin/"+ref+":"+script],{maxBuffer:128*1024*1024});
  const digest=createHash("sha256").update(content).digest("hex");
  results.push({ref,bytes:content.length,sha256:digest,matchesWorkerVersion9Etag:digest===etag});
 }catch(e){results.push({ref,error:"BUNDLE_NOT_AVAILABLE"});}
}
const result={
 checkedOn:"2026-11-04",
 deployed:{worker:"mts-training-arena-v6-api",number:9,
   versionId:"0bd66ec0-39f5-4eaa-8627-11c5b10b6e13",deployedAt:"2026-10-27T12:06:28.379421Z",
   etag},
 results,
 sourceIdentified:results.some(x=>x.matchesWorkerVersion9Etag),
 note:"Cloudflare etag may encode multipart script/metadata and need not equal the raw worker.mjs SHA-256. No match does not imply a deployment fault."
};
fs.mkdirSync("e2-staging-qa/results",{recursive:true});
fs.writeFileSync("e2-staging-qa/results/worker-provenance.json",JSON.stringify(result,null,2)+"\n");
console.log(JSON.stringify(result,null,2));
