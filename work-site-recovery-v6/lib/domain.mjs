// Portable server-authoritative Arena contracts. v1 source remains in lib/upstream.
const ok=(v)=>{if(!v)throw Error('DECK');};
const str=(v,max=2000)=>typeof v==='string'&&v.trim().length>0&&v.length<=max;
const list=(v,min=1,max=100)=>Array.isArray(v)&&v.length>=min&&v.length<=max&&v.every(x=>str(x));
const idx=(v,n)=>Number.isInteger(v)&&v>=0&&v<n;
const permutation=(v,n)=>Array.isArray(v)&&v.length===n&&new Set(v).size===n&&v.every(x=>idx(x,n));
export const presentation=type=>['Spin Wheel','Wheel of Fortune','Open the Box','Flashcards'].includes(type);
export const unscored=a=>['Meta Plan','Categorize','Live Poll','Flashcards'].includes(a.type)||a.scored===false;
export function validateActivity(a,depth=0){
 ok(a&&typeof a==='object'&&!Array.isArray(a)&&depth<=3&&str(a.prompt)&&Number.isInteger(a.timer)&&a.timer>=0&&a.timer<=3600);
 // Optional learning media; never allow HTML/data/javascript URLs in participant views.
 if(a.media!=null){ok(a.media&&typeof a.media==='object'&&['image','video'].includes(a.media.type)&&str(a.media.url,2048)&&/^https:\/\/[^\s]+$/i.test(a.media.url)&&(!a.media.alt||typeof a.media.alt==='string'&&a.media.alt.length<=200));}
 const type=a.type;
 if(type==='Ultimate Game Show'&&a.showFormat==='championship'){
  if(!Array.isArray(a.questions)||a.questions.length<2||a.questions.length>20)throw Error('DECK');
  for(const q of a.questions)validateActivity(q,depth+1);
  ok(a.questions.every(q=>q.type==='Quiz'&&Number.isInteger(q.timer)&&q.timer>=5&&q.timer<=300&&Array.isArray(q.options)&&q.options.length===4));
  const amounts=a.questions.map(q=>q.points);
  ok(amounts.every((p,i)=>Number.isInteger(p)&&p>0&&p<=10000&&(i===0||p>amounts[i-1])));
  ok(Array.isArray(a.safeLevels)&&a.safeLevels.length<=3&&new Set(a.safeLevels).size===a.safeLevels.length&&a.safeLevels.every(x=>Number.isInteger(x)&&x>=1&&x<=a.questions.length));
  ok(a.participation==='individual'&&a.betEnabled!==true);return a;
 }
 if(['Quiz','Ultimate Game Show'].includes(type)&&a.questions){ok(Array.isArray(a.questions)&&a.questions.length&&a.questions.length<=500);a.questions.forEach(q=>validateActivity({...q,timer:q.timer??a.timer},depth+1));return a;}
 if(['Quiz','Dropdown','True/False','Ultimate Game Show'].includes(type)){ok(list(a.options,2,4)&&idx(a.correct,a.options.length));if(type==='True/False')ok(a.options.length===2);}
 else if(type==='Fill Blank')ok(list(a.accepted,1,20));
 else if(type==='Image Hotspot'){ok(str(a.image,2048)&&/^https:\/\/|^\/[^/]/.test(a.image)&&Array.isArray(a.regions)&&a.regions.length>0&&a.regions.length<=10&&a.regions.every(r=>['x','y','r'].every(k=>typeof r[k]==='number'&&r[k]>=0&&r[k]<=1)));}
 else if(type==='Order It')ok(list(a.items,2,30)&&permutation(a.order,a.items.length));
 else if(type==='Match It')ok(list(a.left,2,20)&&list(a.right,2,20)&&a.left.length===a.right.length&&permutation(a.pairs,a.left.length));
 else if(['Meta Plan','Categorize'].includes(type)){ok(list(a.items,1,100)&&list(a.categories,2,20)&&Array.isArray(a.assignments)&&a.assignments.length===a.items.length&&a.assignments.every(x=>idx(x,a.categories.length)));a.timer=0;a.scored=false;}
 else if(type==='Live Poll'){ok(['choice','rating','word','priority',undefined].includes(a.pollKind));if(!['word','rating'].includes(a.pollKind))ok(list(a.options,2,20));ok(a.correct==null);a.scored=false;}
 else if(type==='Flashcards'){ok(list(a.fronts,1,500)&&list(a.backs,1,500)&&a.fronts.length===a.backs.length);ok(['host','learner',undefined].includes(a.flipPermission));a.timer=0;a.scored=false;}
 else if(['Wheel of Fortune','Spin Wheel'].includes(type)){
  if(a.sectors){ok(Array.isArray(a.sectors)&&a.sectors.length>=2&&a.sectors.length<=20);for(const s of a.sectors){ok(str(s.label,100)&&['question','prize','penalty','mystery','challenge'].includes(s.kind)&&Number.isInteger(s.points??0)&&Math.abs(s.points??0)<=10000);if(s.kind==='question'){ok(Array.isArray(s.questions)&&s.questions.length>0&&s.questions.length<=30);s.questions.forEach(q=>validateActivity(q,depth+1));}}}
  else ok(list(a.items,2,20));a.timer=0;ok(Number.isInteger(a.rounds??1)&&(a.rounds??1)>=1&&(a.rounds??1)<=50);ok((a.spinDuration??6)>=4&&(a.spinDuration??6)<=12);
 }else if(type==='Open the Box'){ok(list(a.items,2,30));if(a.boxes){ok(a.boxes.length===a.items.length);for(const b of a.boxes){ok(['question','challenge','surprise'].includes(b.kind));if(b.question)validateActivity(b.question,depth+1);ok(Number.isInteger(b.points??0)&&Math.abs(b.points??0)<=10000);}}a.timer=0;}
 else if(type==='Escape Room'){ok(Array.isArray(a.rooms)&&a.rooms.length>=1&&a.rooms.length<=5);for(const r of a.rooms){ok(str(r.title,100)&&Array.isArray(r.puzzles)&&r.puzzles.length>0&&r.puzzles.length<=30);r.puzzles.forEach(q=>validateActivity(q,depth+1));}ok(['individual','team','collaborative',undefined].includes(a.mode));a.timer=0;}
 else if(type==='Scenario Challenge'){
  if(!a.nodes){ok(list(a.options,2,4)&&idx(a.correct,a.options.length));}
  else {ok(Array.isArray(a.nodes)&&a.nodes.length>1&&a.nodes.length<=100&&new Set(a.nodes.map(n=>n.id)).size===a.nodes.length);const ids=new Set(a.nodes.map(n=>n.id));ok(ids.has(a.start));for(const n of a.nodes){ok(str(n.id,100)&&str(n.text));if(!n.ending){ok(Array.isArray(n.choices)&&n.choices.length>0&&n.choices.length<=6);ok(n.correctChoice===undefined||idx(n.correctChoice,n.choices.length));n.choices.forEach(c=>ok(str(c.label,160)&&ids.has(c.next)&&Number.isInteger(c.points??0)&&Math.abs(c.points??0)<=10000));}}const visit=(id,path)=>{ok(!path.has(id));const n=a.nodes.find(n=>n.id===id);if(!n.ending)for(const c of n.choices)visit(c.next,new Set([...path,id]));};visit(a.start,new Set());a.timer=0;}
 }else throw Error('DECK');
 if(a.weight!=null)ok(typeof a.weight==='number'&&a.weight>=0&&a.weight<=10);
 if(a.wrongPenalty!=null)ok(Number.isInteger(a.wrongPenalty)&&a.wrongPenalty>=0&&a.wrongPenalty<=10000);
 if(a.points!=null)ok(Number.isInteger(a.points)&&a.points>=0&&a.points<=10000);
 return a;
}
export function validateDeck(activities){ok(Array.isArray(activities)&&activities.length>0&&activities.length<=500);const copy=JSON.parse(JSON.stringify(activities));copy.forEach(a=>validateActivity(a));ok(JSON.stringify(copy).length<500000);return copy;}
export function flattenDeck(activities){
 const flat=[];
 activities.forEach((root,group)=>{let step=0;function visit(a,parent=null){
  const merged=parent?{...a,timer:a.timer??parent.timer,weight:a.weight??parent.weight??1,points:a.points??parent.points??1000,wrongPenalty:a.wrongPenalty??parent.wrongPenalty??0,speed:a.speed??parent.speed??true,section:a.section||parent.section||parent.prompt,betEnabled:a.betEnabled??parent.betEnabled??false,participation:a.participation??parent.participation??'all',stageTheme:a.stageTheme??parent.stageTheme??'orbital',progression:a.progression||parent.progression||'manual'}:{...a};
  if(a.questions&&!(a.type==='Ultimate Game Show'&&a.showFormat==='championship')){for(const q of a.questions)visit(q,merged);}else flat.push({...merged,mainType:root.type,group,step:step++,revealDelay:root.type==='Ultimate Game Show'?2000:0});
 }visit(root);});return flat;
}
export function publicActivity(a,{closed=false,reveal=null,host=false}={}){
 if(!a)return null;const r=JSON.parse(JSON.stringify(a));
 for(const k of ['correct','order','pairs','assignments','backs','accepted','regions','nodes','rooms','sectors','boxes','questions','explanation'])delete r[k];
 if(a.sectors)r.sectors=a.sectors.map(s=>({label:s.label,kind:s.kind,repeatable:!!s.repeatable}));
 if(a.rooms)r.rooms=a.rooms.map(x=>({title:x.title,narrative:x.narrative,puzzles:x.puzzles.length}));
 if(closed)for(const k of ['correct','order','pairs','assignments','accepted','regions','explanation'])if(a[k]!==undefined)r[k]=a[k];
 if(a.type==='Flashcards'&&reveal!==null)r.revealed={front:a.fronts[reveal],back:a.backs[reveal]};
 if(['Spin Wheel','Open the Box'].includes(a.type)&&!a.sectors&&!a.boxes&&reveal!==null)r.revealed=a.items[reveal];
 return r;
}
const norm=s=>String(s).normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase();
export function evaluate(a,answer){
 let correct=null;
 if(a.type==='Live Poll'){
  if(a.pollKind==='word'){if(!str(answer,80))throw Error('ANSWER');}
  else if(a.pollKind==='rating'){if(!Number.isInteger(answer)||answer<1||answer>(a.scale??5))throw Error('ANSWER');}
  else if(a.pollKind==='priority'){if(!permutation(answer,a.options.length))throw Error('ANSWER');}
  else if(!idx(answer,a.options.length))throw Error('ANSWER');return {correct:null,points:0};
 }
 if(a.options){if(!idx(answer,a.options.length))throw Error('ANSWER');correct=answer===a.correct;}
 else if(a.type==='Fill Blank'){if(!str(answer,200))throw Error('ANSWER');correct=a.accepted.some(x=>norm(x)===norm(answer));}
 else if(a.type==='Image Hotspot'){if(!answer||!['x','y'].every(k=>typeof answer[k]==='number'&&answer[k]>=0&&answer[k]<=1))throw Error('ANSWER');correct=a.regions.some(r=>(r.x-answer.x)**2+(r.y-answer.y)**2<=r.r**2);}
 else if(a.order){if(!permutation(answer,a.items.length))throw Error('ANSWER');correct=answer.every((x,i)=>x===a.order[i]);}
 else if(a.pairs){if(!permutation(answer,a.left.length))throw Error('ANSWER');correct=answer.every((x,i)=>x===a.pairs[i]);}
 else if(a.assignments){if(!Array.isArray(answer)||answer.length!==a.items.length||!answer.every(x=>idx(x,a.categories.length)))throw Error('ANSWER');correct=answer.every((x,i)=>x===a.assignments[i]);}
 else throw Error('ANSWER');
 return {correct:unscored(a)?null:Number(correct),evaluation:Number(correct),points:correct&&!unscored(a)?(a.points??1000):!correct&&!unscored(a)?-(a.wrongPenalty||0):0};
}
export function grade(a,answer,{remaining=1,duration=1}={}){const g=evaluate(a,answer);return {...g,points:Math.round(g.points*(a.weight??1)*(a.speed&&g.points>0?(.5+.5*Math.max(0,Math.min(1,remaining/duration))):1))};}
export function scoreboards(players,totals,rule='shared',metrics={},teamScoring='sum'){
 function rank(rows){const sorted=rows.sort((a,b)=>b.score-a.score||(rule==='correct'?(b.correct||0)-(a.correct||0):rule==='speed'?(a.elapsed||0)-(b.elapsed||0):0)||String(a.uid||a.team).localeCompare(String(b.uid||b.team)));return sorted.map((x,i)=>({...x,rank:rule==='shared'?sorted.findIndex(p=>p.score===x.score)+1:i+1}));}
 const individual=rank(players.filter(p=>p.approval!=='pending'&&p.approval!=='rejected').map(p=>({uid:p.uid,name:p.name,score:totals[p.uid]||0,...metrics[p.uid]}))),groups=new Map();
 for(const p of players){if(!p.team||p.approval==='pending'||p.approval==='rejected')continue;const g=groups.get(p.team)||{team:p.team,score:0,members:0,correct:0,elapsed:0};g.score+=totals[p.uid]||0;g.members++;g.correct+=metrics[p.uid]?.correct||0;g.elapsed+=metrics[p.uid]?.elapsed||0;groups.set(p.team,g);}
 const teamRows=[...groups.values()].map(x=>({...x,score:teamScoring==='average'?Math.round(x.score/x.members):x.score}));return {individual,teams:rank(teamRows)};
}
export function nextState(s,action,now,index){
 const n={...s,revision:s.revision+1},deck=JSON.parse(s.activities);
 if(action==='start'||action==='next'){
  if(action==='start'?!['lobby','ready'].includes(s.status):s.status!=='results')throw Error('STATE');const current=s.current+1;if(current>=deck.length)throw Error('STATE');const a=deck[current];
  if(a.type==='Ultimate Game Show'&&a.showFormat==='championship')
   return {...n,current,status:'question',started_at:now,deadline:null,paused:0,remaining:0,reveal:null,
    runtime:JSON.stringify({...JSON.parse(s.runtime||'{}'),show:{phase:'casting',current:null,attempts:[],usedContestants:[],audienceVotes:{},lastCompleted:null},phase:'casting',targets:[],spin:undefined,box:undefined})};
  return {...n,current,status:'question',started_at:now,deadline:a.participation&&a.participation!=='all'||a.betEnabled?null:a.timer?now+a.timer*1000:null,paused:0,remaining:0,reveal:null,runtime:JSON.stringify({...JSON.parse(s.runtime||'{}'),spin:undefined,box:undefined,metaCount:undefined,addedTime:0,keyRevealed:false,targets:[],phase:a.participation&&a.participation!=='all'?'casting':a.betEnabled?'betting':'answering',used:[],turn:0,target:null})};
 }
 if(action==='close'){if(s.status!=='question')throw Error('STATE');return {...n,status:'results',paused:0};}
 if(action==='pause'){if(s.status!=='question'||s.paused||(s.deadline&&s.deadline<=now))throw Error('STATE');return {...n,runtime:JSON.stringify({...JSON.parse(s.runtime||'{}'),pausedAt:now}),paused:1,remaining:s.deadline?Math.max(0,s.deadline-now):0};}
 if(action==='resume'){if(s.status!=='question'||!s.paused)throw Error('STATE');const rt=JSON.parse(s.runtime||'{}'),delta=now-(rt.pausedAt||now);if(rt.spin)for(const k of ['startsAt','stopsAt','revealAt'])rt.spin[k]+=delta;rt.pausedTotal=(rt.pausedTotal||0)+delta;delete rt.pausedAt;return {...n,runtime:JSON.stringify(rt),paused:0,deadline:s.deadline?now+s.remaining:null};}
 if(action==='addtime'){if(s.status!=='question'||s.paused||!s.deadline||s.deadline<=now)throw Error('STATE');const rt=JSON.parse(s.runtime||'{}');return {...n,runtime:JSON.stringify({...rt,addedTime:(rt.addedTime||0)+10000}),deadline:s.deadline+10000};}
 if(action==='finish'){if(!['lobby','results'].includes(s.status))throw Error('STATE');return {...n,status:'completed',paused:0};}
 if(action==='reveal'){
  if(!['question','results'].includes(s.status))throw Error('STATE');const a=deck[s.current],length=a.type==='Flashcards'?a.fronts.length:a.items?.length??0;if(!Number.isInteger(index)||index<0||index>=length)throw Error('INDEX');return {...n,reveal:index};
 }throw Error('ACTION');
}
export function fairIndex(n){if(!Number.isInteger(n)||n<1)throw Error('STATE');const max=Math.floor(4294967296/n)*n;let x;do{x=crypto.getRandomValues(new Uint32Array(1))[0];}while(x>=max);return x%n;}
