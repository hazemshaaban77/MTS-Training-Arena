/* Visual-only wheel math; the Worker selects the winning sector. */
export const TAU=Math.PI*2;
export function sectorAngle(index:number,count:number){
 if(!Number.isInteger(index)||!Number.isInteger(count)||count<2||index<0||index>=count)return 0;
 return TAU*index/count;
}
export function forwardSweep(current:number,finish:number){
 if(!Number.isFinite(current)||!Number.isFinite(finish))return 0;
 const normalized=((finish-current)%TAU+TAU)%TAU;
 return normalized<0.04?normalized+TAU:normalized;
}
export function easedStop(t:number){
 const x=Math.max(0,Math.min(1,Number.isFinite(t)?t:0));
 return 1-Math.pow(1-x,3);
}
export function wheelClock(serverNow:number,anchor:number,frame:number){
 return serverNow+Math.max(0,frame-anchor);
}
