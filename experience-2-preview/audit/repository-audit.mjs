#!/usr/bin/env node
// Read-only Git tree inventory across all remote branches; prints no secret values.
import fs from "node:fs";
import path from "node:path";
import {execFileSync} from "node:child_process";
const run=(args,opts={})=>execFileSync("git",args,{encoding:"utf8",maxBuffer:256*1024*1024,...opts});
const resultDir="experience-2-preview/audit/results";
fs.mkdirSync(resultDir,{recursive:true});
const refs=run(["for-each-ref","--format=%(refname:short)","refs/remotes/origin"]).trim().split("\n").filter(x=>x.startsWith("origin/")&&x!=="origin/HEAD").sort();
if(refs.length<2)throw Error("Remote branch fetch incomplete; use checkout fetch-depth 0");
const inventories=new Map(),metadata=[];
for(const ref of refs){
 const bytes=run(["ls-tree","-r","-z","-l",ref],{encoding:null});
 const files=new Map();
 for(const entry of bytes.toString("utf8").split("\0")){
  if(!entry)continue;const tab=entry.indexOf("\t");if(tab<0)continue;
  const [mode,type,sha,size]=entry.slice(0,tab).split(/\s+/);
  if(type==="blob")files.set(entry.slice(tab+1),{sha,size:Number(size)||0});
 }
 inventories.set(ref,files);
 metadata.push({branch:ref.slice(7),head:run(["rev-parse",ref]).trim(),date:run(["log","-1","--format=%cI",ref]).trim(),
   files:files.size,bytes:[...files.values()].reduce((n,x)=>n+x.size,0),
   v5:[...files.keys()].filter(x=>x.startsWith("work-site-recovery/")).length,
   v6:[...files.keys()].filter(x=>x.startsWith("work-site-recovery-v6/")).length,
   demo:[...files.keys()].filter(x=>x.startsWith("experience-2-preview/")).length});
}
const current=run(["branch","--show-current"]).trim(),files=inventories.get("origin/"+current);
if(!files)throw Error("Review branch not present in refs: "+current);
const v5=new Map([...files].filter(([p])=>p.startsWith("work-site-recovery/")).map(([p,x])=>[p.slice(19),x]));
const v6=new Map([...files].filter(([p])=>p.startsWith("work-site-recovery-v6/")).map(([p,x])=>[p.slice(22),x]));
let matches=0,diff=0,unchanged=0;
for(const [p,x] of v5)if(v6.has(p)){matches++;if(v6.get(p).sha===x.sha)unchanged++;else diff++;}
const special=["main","work-site-recovery-v6","feature/v6-game-experience-overhaul","feature/v6-final-wheel-projector-flashcards","feature/v6-importverse-session-and-gameplay-fixes","feature/arena-experience-2-lobby-preview"];
const baseline=inventories.get("origin/work-site-recovery-v6");
const comparisons=[];
for(const b of special){
 const inv=inventories.get("origin/"+b);if(!inv||!baseline)continue;
 const prefix="work-site-recovery-v6/";
 const before=new Map([...baseline].filter(([p])=>p.startsWith(prefix)));
 const after=new Map([...inv].filter(([p])=>p.startsWith(prefix)));
 comparisons.push({branch:b,added:[...after.keys()].filter(p=>!before.has(p)).length,modified:[...after].filter(([p,x])=>before.has(p)&&before.get(p).sha!==x.sha).length,deleted:[...before.keys()].filter(p=>!after.has(p)).length});
}
const sensitivePaths=[];
const blobSet=new Set(),textFiles=new Map(),tracked=metadata.reduce((n,x)=>n+x.files,0);
for(const [branch,inventory] of inventories){
 for(const [p,v] of inventory){
  blobSet.add(v.sha);
  const name=path.basename(p);
  if((/^\.env($|\.)/.test(name)&&!/^\.env\.(example|sample|template)$/.test(name))||/\.(pem|p12|pfx|key)$/.test(name)||/service.?account.*\.json/i.test(name))
   sensitivePaths.push({branch,path:p});
  if(v.size>0&&v.size<=750000&&/\.(?:js|jsx|ts|tsx|mjs|cjs|mts|json|md|txt|html|css|yml|yaml|toml|sh|sql|py|xml|svg)$/i.test(name)&&!textFiles.has(v.sha))
    textFiles.set(v.sha,{branch,path:p});
 }
}
const blobKeys=[...textFiles.keys()],flagged=[];
for(let i=0;i<blobKeys.length;i+=150){
 const chunk=blobKeys.slice(i,i+150);
 const raw=run(["cat-file","--batch"],{encoding:null,input:chunk.join("\n")+"\n",maxBuffer:220*1024*1024});
 let pos=0;
 for(const sha of chunk){
  const end=raw.indexOf(10,pos);if(end<0)throw Error("bad git cat-file response");
  const header=raw.subarray(pos,end).toString("utf8"),size=Number(header.split(" ").at(-1));
  pos=end+1;if(!(size>=0&&size<=750000))throw Error("blob size invalid");
  const body=raw.subarray(pos,pos+size).toString("utf8");pos+=size+1;
  const kind=[];
  if(/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(body))kind.push("private-key-marker");
  if(/(?:^|\n)\s*FIREBASE_SERVICE_ACCOUNT\s*[:=]\s*['"]?\s*\{[\s\S]{0,300}?private_key/i.test(body))kind.push("inline-service-account");
  if(/(?:^|\n)\s*(?:CLOUDFLARE_API_TOKEN|GH_PAT|OPENAI_API_KEY)\s*[:=]\s*['"]?[A-Za-z0-9_-]{20,}/i.test(body))kind.push("possible-inline-token");
  if(kind.length)flagged.push({sha:sha.slice(0,12),file:textFiles.get(sha),kind});
 }
}
const categories={pages:0,v5:0,v6:0,experience2:0,workflows:0,other:0};
for(const p of files.keys()){
 const k=p.startsWith("work-site-recovery-v6/")?"v6":p.startsWith("work-site-recovery/")?"v5":p.startsWith("experience-2-preview/")?"experience2":p.startsWith(".github/workflows/")?"workflows":p.startsWith("arena/")?"pages":"other";
 categories[k]++;
}
const report={date:new Date().toISOString(),branch:current,branchCount:refs.length,trackedFileOccurrences:tracked,uniqueBlobs:blobSet.size,sourceBlobsScanned:textFiles.size,currentBranchFiles:files.size,categories,branches:metadata,versionComparison:{common:matches,unchanged,different:diff},v6Divergence:comparisons,sensitiveFilePaths:sensitivePaths,credentialMarkerCandidates:flagged,
 logos:{approvedPresent:files.has("experience-2-preview/sprint02/assets/arena-logo-approved.png"),safeMarginPresent:files.has("experience-2-preview/sprint02/assets/arena-logo-safe-margin.png")}};
fs.writeFileSync(resultDir+"/inventory.json",JSON.stringify(report,null,2)+"\n");
const lines=[
 "# MTS Training Arena — GitHub entire-branches source inventory",
 "Generated "+report.date+" on review branch "+current+".",
 "",
 "## Coverage",
 "Scanned "+refs.length+" remote branch trees, "+tracked+" tracked file occurrences, "+blobSet.size+" unique Git blobs, and "+
 textFiles.size+" unique source/document blobs (text <=750 KB) for selected credential marker patterns. No production changes.",
 "This is complete branch/path/hash inventory, not a claim that every file was manually code-reviewed or that the application passed runtime QA.",
 "",
 "## Current branch",
 JSON.stringify(categories),
 "Current tracked files: "+files.size,
 "",
 "## Branch inventory",
 "| Branch | Last commit | Files | V5 files | V6 files | Experience2 files |",
 "|---|---|---:|---:|---:|---:|"
];
for(const x of [...metadata].sort((a,b)=>b.date.localeCompare(a.date)))
 lines.push("| "+x.branch+" | "+x.date+" | "+x.files+" | "+x.v5+" | "+x.v6+" | "+x.demo+" |");
lines.push("","## Duplicate snapshot detection","V5 and V6 same-relative-path files: "+matches+
 ", identical: "+unchanged+", changed: "+diff+".");
lines.push("","## V6 branch divergence","| Branch | Added vs recovery | Modified | Deleted |","|---|---:|---:|---:|");
for(const c of comparisons)lines.push("| "+c.branch+" | "+c.added+" | "+c.modified+" | "+c.deleted+" |");
lines.push("","## Selected credential markers","Suspicious credential file paths: "+sensitivePaths.length+
 "; content marker candidates: "+flagged.length+". False positives possible; no sensitive contents are emitted.");
for(const f of sensitivePaths.slice(0,25))lines.push("- Path: "+f.branch+" : "+f.path);
for(const f of flagged.slice(0,25))lines.push("- Marker: "+f.kind.join(",")+" in "+f.file.branch+" : "+f.file.path);
lines.push("","## Functional source boundaries and release gates",
 "1. main/arena is a static GitHub Pages pilot; work-site-recovery-v6 is a private-Sites source snapshot; experience-2-preview is a standalone demo. They are different products and may not be treated as the same deployed version.",
 "2. The current live private Site source must be matched to its actual build/commit before any integration.",
 "3. Reconcile separate V6 fixes on diverged branches; do not merge an older V6 snapshot over later changes.",
 "4. Verify authenticated trainer, player join/recovery, single QR, trusted points and safe projector snapshots on a disposable backend.",
 "5. Test immutable answers, deadlines, 2-5 real devices, projector, and later measured load before release.",
 "6. Do not deploy a preview branch, change Firebase rules, or merge to main without owner approval.",
 "7. This inventory does not certify application security or data privacy. Client Firebase config is not a private admin secret.",
 "",
 "## Branding",
 "Approved Arena PNG in current branch: "+report.logos.approvedPresent+"; safe-margin PNG: "+report.logos.safeMarginPresent+".",
 "",
 "## Limitations",
 "No live private-Sites deployment history, real trainer login, D1/Firebase records, worker secret values or physical device tests were inspected.",
 "Selected marker scan covers source/document blobs <=750 KB across branch trees; it does not replace a dedicated secret scanner or code review.",
 "");
fs.writeFileSync(resultDir+"/REPOSITORY_AUDIT.md",lines.join("\n"));
console.log(JSON.stringify({branches:refs.length,trackedOccurrences:tracked,uniqueBlobs:blobSet.size,sourceBlobsScanned:textFiles.size,currentBranchFiles:files.size,v5v6:{matches,unchanged,diff},sensitivePaths:sensitivePaths.length,credentialMarkerCandidates:flagged.length},null,2));
