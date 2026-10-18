import {spawnSync} from 'node:child_process';import {mkdirSync} from 'node:fs';
const run=args=>{const r=spawnSync(args[0],args.slice(1),{stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);};
mkdirSync('.sites-runtime',{recursive:true});
run(['node_modules/.bin/tsc','--noEmit']);
const files=['session.test.ts','firebase-auth.test.ts','platform.test.ts','render.test.tsx'];
for(const file of files)run(['node_modules/.bin/esbuild','tests/'+file,'--bundle','--platform=node','--format=esm',...(file.endsWith('tsx')?['--packages=external','--jsx=automatic']:[]),'--outfile=.sites-runtime/'+file.replace(/\.tsx?$/,'.mjs')]);
run(['node','--test',...files.map(x=>'.sites-runtime/'+x.replace(/\.tsx?$/,'.mjs'))]);
