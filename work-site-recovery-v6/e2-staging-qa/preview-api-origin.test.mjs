import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const client=readFileSync(new URL('../lib/client.ts',import.meta.url),'utf8');
test('E2 API uses same project canonical or preview origin, not arbitrary Pages hosts',()=>{
 assert.ok(client.includes("external!=='https://'+project"));
 assert.ok(client.includes("host===project||host.endsWith('.'+project)"));
 assert.ok(client.includes("window.location.protocol==='https:'"));
 assert.ok(client.includes("return window.location.origin"));
 assert.ok(client.includes("throw Error('E2_STAGING_API_MISMATCH')"));
});
