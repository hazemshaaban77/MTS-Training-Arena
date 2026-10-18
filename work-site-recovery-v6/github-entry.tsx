import React from 'react';
import {createRoot} from 'react-dom/client';
import ArenaApp from './components/arena/App';
import './app/globals.css';
const element=document.getElementById('arena-root');
if (!element) throw new Error('Arena root is missing');
createRoot(element).render(<React.StrictMode><ArenaApp/></React.StrictMode>);
