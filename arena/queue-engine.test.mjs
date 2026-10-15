import test from "node:test";
import assert from "node:assert/strict";
import {createQueue,beginNext,finishCurrent,skipUpcoming,insertSaved} from "./queue-engine.mjs";
const tree=[{id:"parent",children:[{id:"child",children:[{id:"leaf"}]}]},{id:"later"}];
test("starts from parent and auto queue order matches nested depth-first flow",()=>{
 const s=createQueue(tree);
 assert.deepEqual(s.upcoming,["parent","child","leaf","later"]);
 const p=beginNext(s,s.version);
 assert.equal(p.current,"parent");assert.equal(s.current,null);
 const finished=finishCurrent(p,p.version);
 assert.equal(finished.current,null);
 const c=beginNext(finished,finished.version);
 assert.equal(c.current,"child");
});
test("skip whole unstarted activity tree and preserve historical skipped entries",()=>{
 const s=createQueue(tree);
 const skipped=skipUpcoming(s,"parent",s.version);
 assert.deepEqual(skipped.upcoming,["later"]);
 assert.deepEqual(skipped.history.map(h=>[h.id,h.status]),[["parent","skipped"],["child","skipped"],["leaf","skipped"]]);
 assert.throws(()=>skipUpcoming(skipped,"parent",skipped.version));
});
test("cannot directly skip parent already started, and current activity is locked",()=>{
 const s=createQueue(tree),p=beginNext(s,s.version);
 assert.throws(()=>skipUpcoming(p,"parent",p.version));
 assert.throws(()=>beginNext(p,p.version));
 const completed=finishCurrent(p,p.version,{discard:true});
 assert.equal(completed.history[0].status,"excluded");
 assert.throws(()=>skipUpcoming(completed,"parent",completed.version));
});
test("insert saved activity at next, end or selected position",()=>{
 let s=createQueue(tree);
 s=insertSaved(s,[{id:"new"}],s.version,"next");
 assert.equal(s.upcoming[0],"new");
 s=insertSaved(s,[{id:"end"}],s.version,"end");
 assert.equal(s.upcoming.at(-1),"end");
 s=insertSaved(s,[{id:"after"}],s.version,"after","later");
 assert.equal(s.upcoming[s.upcoming.indexOf("later")+1],"after");
});
test("queue rejects stale updates and duplicate saved IDs",()=>{
 const s=createQueue(tree);
 assert.throws(()=>beginNext(s,99),/Stale/);
 assert.throws(()=>insertSaved(s,[{id:"parent"}],s.version));
 assert.throws(()=>insertSaved(s,[{id:"unknown"}],s.version,"after","missing"));
});
