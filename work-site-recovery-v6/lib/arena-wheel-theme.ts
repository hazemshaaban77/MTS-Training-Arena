/** Color and geometry contracts for Cinematic Entrance B.
 * Source-facing labels/kinds come only from the trainer-authored activity. */
export type ArenaWheelSector={label?:string;kind?:string};
export const ARENA_CINEMA_B={navy:0x061c39,midnight:0x041022,chrome:0xd2e2ed,silver:0xa4c5d7,
 blue:0x116bcc,brightBlue:0x30b4ef,green:0x27bf65,brightGreen:0x61e997,white:0xf5f9ff} as const;
export const ARENA_WHEEL_COLORS=[0x0879d5,0x27b76d,0xf3f8ff,0x0f439b,0x55d583,0x0b99cf,0xf1f6ff,0x1059bc] as const;
/** Alternating corporate colors; type changes intensity but never introduces unrelated purple/gold. */
export function sectorCorporateColor(kind:string|undefined,index:number):number{
 const base=ARENA_WHEEL_COLORS[((index%ARENA_WHEEL_COLORS.length)+ARENA_WHEEL_COLORS.length)%ARENA_WHEEL_COLORS.length];
 if(kind==='penalty')return index%2?0x3168a9:0x1b567f;
 if(kind==='challenge')return index%2?0x0d8f66:0x16ad8d;
 if(kind==='prize')return index%2?0x0873cb:0x38c66a;
 return base;
}
export function visibleWheelLabel(sector:ArenaWheelSector,index:number,count:number){
 const original=String(sector?.label||'').trim();
 if(count>10)return String(index+1).padStart(2,'0');
 // Never put more than the wheel face can legibly contain; the full label remains in HTML legends.
 return original.length>24?original.slice(0,23)+'…':original||String(index+1).padStart(2,'0');
}
