/** Validate the form against the live same-college course catalog before writes.
 * Missing courses are a stale-policy warning, not permission to drop them
 * silently or persist a policy that the service will reject.
 */
export function getTpoPrepSelectionState(
 selected:readonly string[],
 saved:{courseIds:readonly string[];minimumCompleted:number},
 minimum:number,
 availableCourseIds:readonly string[],
){
 const available=new Set(availableCourseIds);
 const missing=selected.filter(id=>!available.has(id));
 const sameIds=(a:readonly string[],b:readonly string[])=>
  JSON.stringify([...a].sort())===JSON.stringify([...b].sort());
 const dirty=!sameIds(selected,saved.courseIds)||minimum!==saved.minimumCompleted;
 const valid=Number.isInteger(minimum)&&minimum>=0&&minimum<=selected.length&&
  selected.length<=40&&new Set(selected).size===selected.length&&missing.length===0;
 return {missing,dirty,valid};
}
