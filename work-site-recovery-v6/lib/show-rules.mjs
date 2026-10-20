// Pure rules for the opt-in prize-ladder Game Show, independent of UI & D1.
// Existing classic Game Show and Quiz sessions retain their old contracts.
export const isPrizeLadder=(a)=>a?.mainType==='Ultimate Game Show'&&a?.showFormat==='ladder';
export function contestantKnockouts(deck,round,castRows,answerRows){
 const current=deck[round];if(!isPrizeLadder(current))return [];
 const group=current.group,knocked=new Set();
 for(const row of castRows){
  const details=typeof row.detail==='string'?JSON.parse(row.detail):row.detail||{};
  const at=Number(details.round);
  if(!Number.isInteger(at)||at<0||at>=round)continue;
  const stage=deck[at];if(!isPrizeLadder(stage)||stage.group!==group)continue;
  for(const id of details.players||[]){
   if(!answerRows.some(x=>x.round===at&&x.player===id&&x.correct===1))knocked.add(id);
  }
 }
 return [...knocked];
}
export function previouslyUsedLifelines(deck,round,progressRows){
 const current=deck[round];if(!isPrizeLadder(current))return [];
 const used=new Set();
 for(const row of progressRows){
  if(!Number.isInteger(row.round)||row.round>=round||row.round<0)continue;
  if(!isPrizeLadder(deck[row.round])||deck[row.round].group!==current.group)continue;
  const details=typeof row.data==='string'?JSON.parse(row.data):row.data||{};
  for(const life of details.lifelines||[])used.add(life);
 }
 return [...used];
}
export function shouldContinueContestant(previous,current,answers,target){
 return isPrizeLadder(previous)&&isPrizeLadder(current)&&previous.group===current.group
   &&typeof target==='string'&&!!target
   &&answers.some(a=>a.player===target&&a.correct===1);
}
