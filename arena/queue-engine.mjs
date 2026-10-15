import {validateActivityTree,flattenTree} from "./activity-contract.mjs";
/** Immutable local queue rules; server must enforce permissions and concurrency on integration. */
const clone=value=>structuredClone(value);
function ok(test,msg){if(!test)throw Error(msg)}
export function createQueue(tree){
 validateActivityTree(tree);
 const flat=flattenTree(tree);
 return {tree:clone(tree),upcoming:flat.map(x=>x.id),current:null,history:[],version:1};
}
function checkVersion(state,expected){ok(state.version===expected,"Stale queue version");}
export function beginNext(state,expectedVersion){
 checkVersion(state,expectedVersion);
 ok(state.current===null,"Active question locked");
 ok(state.upcoming.length>0,"No upcoming activity");
 const next=clone(state),id=next.upcoming.shift();
 next.current=id;next.version++;return next;
}
export function finishCurrent(state,expectedVersion,{discard=false}={}){
 checkVersion(state,expectedVersion);ok(state.current!==null,"Nothing active");
 const next=clone(state);next.history.push({id:next.current,status:discard?"excluded":"completed"});
 next.current=null;next.version++;return next;
}
function descendants(tree,id){
 let target=null;
 const visit=(node)=>{if(node.id===id)target=node;else for(const child of node.children||[])visit(child)};
 tree.forEach(visit);ok(target,"Unknown activity");
 return flattenTree([target]).map(x=>x.id);
}
export function skipUpcoming(state,id,expectedVersion){
 checkVersion(state,expectedVersion);
 const ids=descendants(state.tree,id);
 ok(state.upcoming.includes(id),"Activity must be completely unstarted to skip its subtree");
 ok(!ids.includes(state.current),"Cannot skip active subtree");
 const next=clone(state),existing=new Set(next.upcoming);
 const skipped=ids.filter(x=>existing.has(x));
 next.upcoming=next.upcoming.filter(x=>!skipped.includes(x));
 skipped.forEach(id=>next.history.push({id,status:"skipped"}));
 next.version++;return next;
}
export function insertSaved(state,tree,expectedVersion,position="end",afterId=null){
 checkVersion(state,expectedVersion);
 validateActivityTree(tree);
 const incoming=flattenTree(tree).map(x=>x.id);
 ok(incoming.length>0,"No saved activity");
 const occupied=new Set([...state.upcoming,...state.history.map(h=>h.id),state.current]);
 ok(incoming.every(id=>!occupied.has(id)),"Duplicate activity IDs");
 ok(["next","end","after"].includes(position),"Invalid insertion position");
 const next=clone(state);
 let index=position==="next"?0:position==="end"?next.upcoming.length:next.upcoming.indexOf(afterId)+1;
 ok(position!=="after"||index>0,"Insert position not found");
 next.upcoming.splice(index,0,...incoming);
 next.tree.push(...clone(tree));
 next.version++;
 return next;
}
