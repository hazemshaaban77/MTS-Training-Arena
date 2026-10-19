'use client';
import {createContext,useContext,useEffect,useState} from 'react';
import {siteAsset,siteBase} from '../../lib/site-path';
import {api} from '../../lib/client';
const original={mts:'/mts-transparent.png',training:'/training-transparent.png',primary:'#218e5b',blue:'#176aa4',navy:'#0c2545'};
const Branding=createContext(original);
export function BrandProvider({children}:{children:React.ReactNode}){const [brand,setBrand]=useState(original);useEffect(()=>{let active=true;api('branding').catch(()=>null).then((b:any)=>{if(!active||!b)return;setBrand(b);document.documentElement.style.setProperty('--brand-primary',b.primary);document.documentElement.style.setProperty('--brand-blue',b.blue);document.documentElement.style.setProperty('--brand-navy',b.navy);}).catch(()=>{});return()=>{active=false;};},[]);return <Branding.Provider value={brand}>{children}</Branding.Provider>;}
export function OfficialLogo({kind,className=''}:{kind:'mts'|'training';className?:string}){return <span className={`official-logo ${kind} ${className}`}><img src={siteAsset(original[kind])} alt={kind==='mts'?'MTS — Misr Technology Services':'Training Team'}/></span>;}
export default function BrandHeader({children,className=''}:{children?:React.ReactNode;className?:string}){return <header className={`brand-header ${className}`}><a href={siteBase()} className="official-home brand-logo-frame training-frame" aria-label="MTS Training Arena — Home"><OfficialLogo kind="training"/></a><div className="brand-header-center"><strong className="arena-title-lockup">MTS <span>Training <em>Arena</em></span></strong>{children}</div><div className="brand-logo-frame mts-frame"><OfficialLogo kind="mts"/></div></header>;}
