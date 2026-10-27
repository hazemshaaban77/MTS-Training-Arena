import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import ArenaSimulator from './components/arena/ArenaSimulator';
import Builder from './components/arena/Builder';
import {makeImportVerseWorkshop} from './lib/importverse-workshop';
import './app/globals.css';
function Audit(){
 const [screen,setScreen]=useState<'sim'|'builder'>('sim');
 const activities=React.useMemo(()=>makeImportVerseWorkshop('ar'),[]);
 const chosen=Math.max(0,Math.min(9,Number(new URLSearchParams(window.location.search).get('index')||0)));
 return <div data-testid="arena-audit-harness">
  <nav style={{position:'fixed',bottom:0,left:0,zIndex:100000,display:'flex',gap:6,padding:8,background:'#001424'}}>
   <button type="button" data-testid="audit-simulator" onClick={()=>setScreen('sim')}>SIMULATOR</button>
   <button type="button" data-testid="audit-builder" onClick={()=>setScreen('builder')}>TRAINER SESSION STUDIO</button>
  </nav>
  {screen==='sim'?<ArenaSimulator ar activities={[activities[chosen]]} onClose={()=>setScreen('builder')} title={"ImportVerse E1–E6 • "+activities[chosen].type+" · 60 min"} initialIndex={0}/>:
   <Builder ar initial="all" source={{title:"ImportVerse — 60 دقيقة",language:"ar",activities,settings:{progression:"manual",reveal:"auto",tie:"shared",teamNames:["Lightning","Wave"],teamScoring:"sum"}}} owner="isolated-audit-no-login" onClose={()=>setScreen('sim')} onGoHome={()=>setScreen('sim')} onCreated={()=>setScreen('sim')}/>}
 </div>;
}
createRoot(document.getElementById('audit-root')!).render(<Audit/>);