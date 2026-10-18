/**
 * MTS Training Arena activity contract v1.
 * Portable pure functions. No browser, database or private participant data.
 * Authoring and local demonstrations only until secure server integration exists.
 */
export const TYPES=Object.freeze(["Quiz","Live Poll","Order It","Match It","Categorize","Spin Wheel","Open the Box","Flashcards","Ultimate Game Show","Scenario Challenge","Dropdown"]);
const object=v=>v!==null&&typeof v==="object"&&!Array.isArray(v);
function check(condition,message){if(!condition)throw new Error(message);}
function str(value,max=1000){return typeof value==="string"&&value.trim().length>0&&value.length<=max;}
function strings(list,min=2,max=12){return Array.isArray(list)&&list.length>=min&&list.length<=max&&list.every(v=>str(v,160));}
const distinct=list=>new Set(list).size===list.length;
export function validateActivity(a){
  check(object(a),"Activity must be an object");
  check(TYPES.includes(a.type),"Unsupported activity type");
  check(str(a.prompt||a.question),"Question or instruction is required");
  check(Number.isInteger(a.timer)&&a.timer>=5&&a.timer<=300,"Timer must be 5–300 seconds");
  switch(a.type){
    case "Quiz":case "Dropdown":case "Ultimate Game Show":case "Scenario Challenge":
      check(strings(a.options,2,8),"Activity requires 2–8 options");
      check(Number.isInteger(a.correct)&&a.correct>=0&&a.correct<a.options.length,"Invalid correct option");
      break;
    case "Live Poll":
      check(strings(a.options,2,8),"Poll requires 2–8 options");
      check(a.correct==null,"Poll must not expose an answer key");
      break;
    case "Order It":
      check(strings(a.items,2,10)&&distinct(a.items),"Ordering items must be unique");
      check(Array.isArray(a.order)&&a.order.length===a.items.length&&distinct(a.order)&&a.order.every(i=>Number.isInteger(i)&&i>=0&&i<a.items.length),"Invalid ordering key");
      break;
    case "Match It":
      check(strings(a.left,2,8)&&strings(a.right,2,8)&&a.left.length===a.right.length,"Match needs equal left/right choices");
      check(Array.isArray(a.pairs)&&a.pairs.length===a.left.length&&distinct(a.pairs)&&a.pairs.every(i=>Number.isInteger(i)&&i>=0&&i<a.right.length),"Invalid matching pairs");
      break;
    case "Categorize":
      check(strings(a.categories,2,8)&&strings(a.items,2,12),"Categories and items required");
      check(Array.isArray(a.assignments)&&a.assignments.length===a.items.length&&a.assignments.every(i=>Number.isInteger(i)&&i>=0&&i<a.categories.length),"Invalid category assignments");
      break;
    case "Flashcards":
      check(strings(a.fronts,1,15)&&Array.isArray(a.backs)&&a.backs.length===a.fronts.length&&a.backs.every(x=>str(x,1000)),"Flashcard fronts/backs required");
      break;
    case "Spin Wheel":case "Open the Box":
      check(strings(a.items,2,20),"Wheel/box needs 2–20 outcomes");
      break;
  }
  return true;
}
function range(n){return Array.from({length:n},(_,i)=>i);}
function isPermutation(answer,n){return Array.isArray(answer)&&answer.length===n&&distinct(answer)&&answer.every(i=>Number.isInteger(i)&&i>=0&&i<n);}
export function evaluateActivity(a,answer){
  validateActivity(a);
  if(a.type==="Live Poll"){
    check(Number.isInteger(answer)&&answer>=0&&answer<a.options.length,"Invalid poll choice");
    return {graded:false,correct:null,points:0};
  }
  if(["Spin Wheel","Open the Box","Flashcards"].includes(a.type)){
    check(answer===null,"Presentation activities are not graded");
    return {graded:false,correct:null,points:0};
  }
  let correct=false;
  if(["Quiz","Dropdown","Ultimate Game Show","Scenario Challenge"].includes(a.type)){
    check(Number.isInteger(answer)&&answer>=0&&answer<a.options.length,"Invalid choice");
    correct=answer===a.correct;
  }else if(a.type==="Order It"){
    check(isPermutation(answer,a.items.length),"Invalid item ordering");
    correct=answer.every((x,i)=>x===a.order[i]);
  }else if(a.type==="Match It"){
    check(isPermutation(answer,a.left.length),"Invalid matching response");
    correct=answer.every((x,i)=>x===a.pairs[i]);
  }else if(a.type==="Categorize"){
    check(Array.isArray(answer)&&answer.length===a.items.length&&answer.every(x=>Number.isInteger(x)&&x>=0&&x<a.categories.length),"Invalid categorization");
    correct=answer.every((x,i)=>x===a.assignments[i]);
  }
  return {graded:true,correct,points:correct?100:0};
}
/** Wheel outcome is chosen from a trusted recorded index, not Math.random in students' browsers. */
export function revealPresentation(a,index){
  validateActivity(a);
  check(["Spin Wheel","Open the Box","Flashcards"].includes(a.type),"Not a presentation activity");
  const n=a.type==="Flashcards"?a.fronts.length:a.items.length;
  check(Number.isInteger(index)&&index>=0&&index<n,"Invalid reveal index");
  return a.type==="Flashcards"?{front:a.fronts[index],back:a.backs[index]}:a.items[index];
}
/** Nested activities: root is level 1; level 3 is maximum. */
export function validateActivityTree(nodes){
  check(Array.isArray(nodes)&&nodes.length<=100,"Activity tree too large");
  const seen=new Set();
  function visit(node,depth){
    check(object(node)&&typeof node.id==="string"&&node.id.length>0,"Every activity needs an ID");
    check(!seen.has(node.id),"Duplicate activity ID");
    check(depth<=3,"Maximum activity depth is 3");
    seen.add(node.id);
    check(Array.isArray(node.children||[]),"Children must be an array");
    for(const child of node.children||[])visit(child,depth+1);
  }
  nodes.forEach(n=>visit(n,1));
  return true;
}
export function flattenTree(nodes){validateActivityTree(nodes);const flat=[];const visit=(node,depth,parent)=>{flat.push({id:node.id,depth,parent});(node.children||[]).forEach(child=>visit(child,depth+1,node.id));};nodes.forEach(n=>visit(n,1,null));return flat;}
export function ranking(entries){
  check(Array.isArray(entries)&&entries.every(x=>str(x.id,120)&&Number.isFinite(x.score)&&x.score>=0)&&distinct(entries.map(x=>x.id)),"Invalid competition entries");
  return [...entries].sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id)).map((x,i,sorted)=>({...x,rank:i===0?1:(x.score===sorted[i-1].score?sorted.findIndex(e=>e.score===x.score)+1:i+1)}));
}
