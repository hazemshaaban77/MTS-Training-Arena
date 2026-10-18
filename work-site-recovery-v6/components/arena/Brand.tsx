'use client';
import {createContext,useContext,useEffect,useState} from 'react';
import {siteAsset,siteBase} from '../../lib/site-path';
import {api} from '../../lib/client';
const original={mts:'/mts.png',training:'/training.png',primary:'#218e5b',blue:'#176aa4',navy:'#0c2545'};
const Branding=createContext(original);
export function BrandProvider({children}:{children:React.ReactNode}){const [brand,setBrand]=useState(original);useEffect(()=>{let active=true;api('branding').catch(()=>null).then((b:any)=>{if(!active||!b)return;setBrand(b);document.documentElement.style.setProperty('--brand-primary',b.primary);document.documentElement.style.setProperty('--brand-blue',b.blue);document.documentElement.style.setProperty('--brand-navy',b.navy);}).catch(()=>{});return()=>{active=false;};},[]);return <Branding.Provider value={brand}>{children}</Branding.Provider>;}
export function OfficialLogo({kind,className=''}:{kind:'mts'|'training';className?:string}){const brand=useContext(Branding);return <span className={`official-logo ${kind} ${brand[kind]!==original[kind]?'custom-logo':''} ${className}`}><img src={siteAsset(brand[kind])} alt={kind==='mts'?'MTS — Misr Technology Services':'Training Team'}/></span>;}
export default function BrandHeader({children,className=''}:{children?:React.ReactNode;className?:string}){return <header className={`brand-header ${className}`}><a href={siteBase()} className="official-home" aria-label="MTS Training Arena"><OfficialLogo kind="mts"/></a><div className="brand-header-center">{children}</div><OfficialLogo kind="training"/></header>;}
