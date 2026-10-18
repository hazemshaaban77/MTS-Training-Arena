// V6 realtime event-contract tests: no user accounts, network or production D1 data.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {transform} from 'esbuild';
const source=await readFile(new URL('../lib/arena-live-room.ts',import.meta.url),'utf8');
const compiled=await transform(source,{loader:'ts',format:'esm',target:'es2022'});
const {ArenaLiveRoom}=await import('data:text/javascript;base64,'+Buffer.from(compiled.code).toString('base64'));
const messages=[[],[]];
const sockets=messages.map((items)=>({send:value=>items.push(value),close:()=>{}}));
const room=new ArenaLiveRoom({getWebSockets:()=>sockets});
const notify=kind=>room.fetch(new Request('https://arena.internal/notify',{method:'POST',body:JSON.stringify({kind})}));
for(const kind of ['answer','joined','control','interaction','survey']){
 const response=await notify(kind);
 assert.equal(response.status,200);
 assert.equal((await response.json()).recipients,2);
 assert.equal(JSON.parse(messages[0].at(-1)).kind,kind);
 assert.equal(JSON.parse(messages[1].at(-1)).kind,kind);
 assert.deepEqual(Object.keys(JSON.parse(messages[0].at(-1))).sort(),['kind','type']);
}
const invalid=await notify('scores-and-passwords');
assert.equal(invalid.status,400);
assert.equal(messages[0].length,5);
room.webSocketMessage(sockets[0],'{"score":99999}');
assert.equal(messages[0].length,5,'Client traffic never broadcasts arbitrary score mutations');
room.webSocketMessage(sockets[0],'ping');
assert.equal(messages[0].at(-1),'pong');
console.log('LIVE CONTRACT PASS: 2 subscribers, 5 event kinds, no sensitive payload, mutation rejected');
