import {spawnSync} from 'node:child_process';
import {writeFileSync,mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {build} from 'esbuild';
const require=createRequire(import.meta.url),workerRequire=createRequire(require.resolve('wrangler'));
const binary=workerRequire.resolve('workerd/bin/workerd');
mkdirSync('.sites-runtime',{recursive:true});
await build({entryPoints:['tests/auth-worker.mjs'],bundle:true,platform:'neutral',format:'esm',outfile:'.sites-runtime/auth-worker.mjs'});
writeFileSync('.sites-runtime/auth-worker.capnp',`using Workerd = import "/workerd/workerd.capnp";
const config :Workerd.Config = (services = [
 (name = "auth", worker = (modules = [(name = "auth.mjs", esModule = embed "auth-worker.mjs")], compatibilityDate = "2026-05-15", compatibilityFlags = ["nodejs_compat"], globalOutbound = "fixtures")),
 (name = "fixtures", worker = (modules = [(name = "fixtures.mjs", esModule = embed "../tests/auth-worker-upstream.mjs")], compatibilityDate = "2026-05-15", globalOutbound = "fixtures"))
]);\n`);
const result=spawnSync(binary,['test','.sites-runtime/auth-worker.capnp','auth'],{stdio:'inherit'});
if(result.status!==0)process.exit(result.status||1);
