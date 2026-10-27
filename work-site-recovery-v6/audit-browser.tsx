import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import ArenaSimulator from './components/arena/ArenaSimulator';
import Builder from './components/arena/Builder';
import {types,sample} from './lib/catalog';
import './app/globals.css';
function Audit(){
 const [screen,setScreen]=useState<'sim'|'builder'>('sim');
 const activities=React.useMemo(()=>types.map(type=>sample(type,'ar')),[ ]);
 return <div data-testid="arena-audit-harness">
  <nav style={{position:'fixed',bottom:0,left:0,zIndex:100000,display:'flex',gap:6,padding:8,background:'#001424'}}>
   <button type="button" data-testid="audit-simulator" onClick={()=>setScreen('sim')}>SIMULATOR</button>
   <button type="button" data-testid="audit-builder" onClick={()=>setScreen('builder')}>TRAINER SESSION STUDIO</button>
  </nav>
  {screen==='sim'?<ArenaSimulator ar activities={activities} onClose={()=>setScreen('builder')} title="MTS Arena • Trainer / Trainee roleplay" initialIndex={Number(new URLSearchParams(window.location.search).get("index")||0)}/>:
   <Builder ar initial="all" owner="isolated-audit-no-login" onClose={()=>setScreen('sim')} onGoHome={()=>setScreen('sim')} onCreated={()=>setScreen('sim')}/>}
 </div>;
}
createRoot(document.getElementById('audit-root')!).render(<Audit/>);