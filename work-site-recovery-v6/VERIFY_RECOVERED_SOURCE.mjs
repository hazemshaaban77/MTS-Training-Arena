import {readFileSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=dirname(fileURLToPath(import.meta.url));
const manifest=JSON.parse(readFileSync(resolve(root,'RECOVERY_MANIFEST.json'),'utf8'));
if(manifest.published_version_number!==6||manifest.source_commit_sha!=='b8162e4e9cf9dcd0a440f9c13e98d481f9e3320d')throw Error('Version 6 provenance mismatch');
const failures=[];
for(const entry of manifest.source_files){
 const filename=resolve(root,entry.path);
 if(!filename.startsWith(root+sep))throw Error('Unsafe manifest path');
 try{
  const data=readFileSync(filename),sha256=createHash('sha256').update(data).digest('hex');
  const gitBlob=createHash('sha1').update('blob '+data.length+'\0').update(data).digest('hex');
  if(data.length!==entry.size_bytes||sha256!==entry.sha256||gitBlob!==entry.git_blob_sha)failures.push(entry.path+': content mismatch');
  if(process.platform!=='win32'&&Boolean(statSync(filename).mode&0o111)!==(entry.mode==='100755'))failures.push(entry.path+': executable mode mismatch');
 }catch{failures.push(entry.path+': missing or unreadable');}
}
if(failures.length){console.error(failures.join('\n'));process.exit(1);}
if(manifest.source_files.length!==manifest.source_file_count)throw Error('Inventory count mismatch');
console.log(JSON.stringify({version:6,sourceCommit:manifest.source_commit_sha,verifiedSourceFiles:manifest.source_file_count,result:'All source bytes and Git blob IDs match the published Version 6 commit.'}));
