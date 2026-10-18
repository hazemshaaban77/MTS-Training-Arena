import React from 'react';
import {createRoot} from 'react-dom/client';
import ArenaApp from './components/arena/App';
import './app/globals.css';
// Remove referral tracking from the visible URL without changing the actual route.
 // This also prevents chatgpt.com from showing in the address bar when opening a shared GitHub link.
 const cleanUrl=new URL(window.location.href);
 let hadTracking=false;
 for(const key of [...cleanUrl.searchParams.keys()]){
  if(/^utm_/i.test(key)){cleanUrl.searchParams.delete(key);hadTracking=true;}
 }
 if(hadTracking)window.history.replaceState(window.history.state,'',cleanUrl.pathname+cleanUrl.search+cleanUrl.hash);
 const element=document.getElementById('arena-root');
if (!element) throw new Error('Arena root is missing');
createRoot(element).render(<React.StrictMode><ArenaApp/></React.StrictMode>);
