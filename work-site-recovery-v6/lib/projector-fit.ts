/** Pure projector viewport fitting for variable game content and screen sizes.
 * Never creates scrollbars or clips the last row: layout first, scale second.
 */
export function projectorFitScale(contentHeight:number,contentWidth:number,
 viewportHeight:number,viewportWidth:number,headerHeight:number):number{
 const values=[contentHeight,contentWidth,viewportHeight,viewportWidth,headerHeight];
 if(values.some(v=>!Number.isFinite(v)||v<0)||!viewportHeight||!viewportWidth)return 1;
 const free=Math.max(1,viewportHeight-headerHeight-8);
 return Math.min(1,free/Math.max(1,contentHeight),viewportWidth/Math.max(1,contentWidth));
}
