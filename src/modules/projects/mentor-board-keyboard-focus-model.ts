/** Keyboard task traversal operates over the entire filtered task scope,
 * not a presentation page or first-four-per-lane subset.
 */
export function nextMentorBoardFocus(
 ids:readonly string[],currentId:string|null,key:"j"|"k",
):{id:string;index:number}|null{
 if(!ids.length)return null;
 const current=currentId?ids.indexOf(currentId):-1;
 const next=current<0?0:
   Math.max(0,Math.min(ids.length-1,current+(key==="j"?1:-1)));
 return {id:ids[next]!,index:next};
}
