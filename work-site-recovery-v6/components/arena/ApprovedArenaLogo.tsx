'use client';
import {siteAsset} from '../../lib/site-path';
import './ApprovedArenaLogo.css';

/**
 * One and only approved Arena product logo.
 * This reuses the exact safe-margin PNG already stored in Sprint 02.
 * Corporate MTS / Training Team logos are intentionally separate.
 */
export const APPROVED_ARENA_LOGO_PATH='/e2-preview/assets/arena-logo-safe-margin.png';
type Placement='header'|'lobby'|'intro'|'victory';
export default function ApprovedArenaLogo({placement,decorative=false}:{
 placement:Placement;decorative?:boolean
}){
 return <span className={'approved-arena-logo approved-arena-logo--'+placement} data-approved-logo={placement}>
  <img src={siteAsset(APPROVED_ARENA_LOGO_PATH)}
   alt={decorative?'':'MTS Training Arena — approved original product logo'}
   aria-hidden={decorative||undefined} loading="eager"
   decoding="async" draggable={false}/>
 </span>;
}
