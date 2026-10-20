'use client';
import {BookOpen,Box,Crown,DoorClosed,GitBranch,Lightbulb,ListOrdered,LockKeyhole,MessageCircle,RotateCw,Sparkles,Trophy,Vote,Zap} from 'lucide-react';
import type {GameIdentityKey} from '../../lib/arena-game-identity';

/** Ten deliberately different opening sequences. Decorative only; text and Skip are never hidden. */
export default function IntroScene({kind}:{kind:GameIdentityKey}){
 switch(kind){
  case 'quiz':return <div className="intro-scene intro-scene--quiz" aria-hidden="true">
   {[0,1,2,3].map(i=><span className="intro-quiz-choice" key={i}>{['A','B','C','D'][i]}</span>)}
   <Zap className="intro-scene-icon"/></div>;
  case 'championship':return <div className="intro-scene intro-scene--championship" aria-hidden="true">
   <div className="intro-champ-stairs">{[1,2,3,4,5].map(i=><i key={i}>{i}</i>)}</div>
   <Crown className="intro-scene-icon"/><Trophy className="intro-champ-trophy"/></div>;
  case 'wheel':return <div className="intro-scene intro-scene--wheel" aria-hidden="true">
   <div className="intro-wheel-disc">{Array.from({length:8},(_,i)=><i key={i}/>)}</div>
   <RotateCw className="intro-scene-icon"/><div className="intro-wheel-marker"/></div>;
  case 'escape':return <div className="intro-scene intro-scene--escape" aria-hidden="true">
   <div className="intro-escape-door"><DoorClosed/><i/><i/></div>
   <LockKeyhole className="intro-scene-icon"/><div className="intro-escape-laser"/></div>;
  case 'box':return <div className="intro-scene intro-scene--box" aria-hidden="true">
   {[0,1,2].map(i=><div className="intro-mystery-box" key={i}><span/><Box/></div>)}
   <Sparkles className="intro-scene-icon"/></div>;
  case 'poll':return <div className="intro-scene intro-scene--poll" aria-hidden="true">
   <Vote className="intro-scene-icon"/><div className="intro-poll-bars">{[40,70,95,55,80].map((i,j)=><i key={j} style={{height:i+'%'}}/>)}</div>
   <MessageCircle className="intro-poll-bubble"/></div>;
  case 'plan':return <div className="intro-scene intro-scene--plan" aria-hidden="true">
   <div className="intro-plan-path"/>{[0,1,2,3].map(i=><Lightbulb className={'intro-plan-node intro-plan-node--'+i} key={i}/>)}
   <GitBranch className="intro-scene-icon"/></div>;
  case 'order':return <div className="intro-scene intro-scene--order" aria-hidden="true">
   <ListOrdered className="intro-scene-icon"/><div className="intro-order-steps">{[3,1,4,2].map((i,j)=><i key={j}>{i}</i>)}</div></div>;
  case 'cards':return <div className="intro-scene intro-scene--cards" aria-hidden="true">
   <div className="intro-card-stack">{[0,1,2].map(i=><div className={'intro-card-'+i} key={i}><BookOpen/></div>)}</div>
   <Sparkles className="intro-scene-icon"/></div>;
  case 'scenario':return <div className="intro-scene intro-scene--scenario" aria-hidden="true">
   <div className="intro-scenario-fork"><i/><i/><i/></div>
   <GitBranch className="intro-scene-icon"/><div className="intro-scenario-gate">?</div></div>;
 }
}
