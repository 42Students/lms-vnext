/** LEARNER-placements-02: horizontal tab swipe preserves the seven legacy sections. */
export function learnerPlacementSwipeDestination(
 pathname:string,deltaX:number,deltaY:number,hrefs:readonly string[],
):string|null{
 if(!Number.isFinite(deltaX)||!Number.isFinite(deltaY)||
    Math.abs(deltaX)<60||Math.abs(deltaX)<Math.abs(deltaY)*1.5)return null;
 const index=hrefs.findIndex((href)=>pathname===href||
   (href!=="/learn/my-placements"&&pathname.startsWith(href+"/")));
 if(index<0)return null;
 const next=deltaX<0?index+1:index-1;
 return next>=0&&next<hrefs.length?hrefs[next]??null:null;
}
