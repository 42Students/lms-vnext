/**
 * TPO-drive-workspace-37: the UI must not reorder a live round plan after
 * results or student attendance/assignment evidence exists.
 */
export function roundReorderLockMessage(input:{
 jobStatus:string;roundStatuses:readonly string[];hasExecutionArtifacts:boolean;
}):string|null{
 if(input.jobStatus!=="DRAFT"&&input.jobStatus!=="PUBLISHED")
  return "The order is locked because this drive has ended.";
 if(input.roundStatuses.length<2)return "Add at least two rounds to change their order.";
 if(input.hasExecutionArtifacts||input.roundStatuses.some(status=>status!=="PENDING"))
  return "The order is locked now that results or students are in a round.";
 return null;
}
export function moveRound(ids:readonly string[],id:string,toIndex:number):string[]{
 const index=ids.indexOf(id);
 if(index<0||!Number.isSafeInteger(toIndex)||toIndex<0||toIndex>=ids.length||
   new Set(ids).size!==ids.length)return [...ids];
 const next=[...ids];
 next.splice(index,1);
 next.splice(toIndex,0,id);
 return next;
}

/** Keep the sequence positions of cancelled rounds reserved. Those positions
 * remain in applicant history and must not be reassigned when the live plan
 * is reordered. The caller serializes changes on the parent drive row. */
export function planRoundReorderSequences(
 count:number, historicalCancelledSequences:readonly number[],
):number[]{
 if(!Number.isSafeInteger(count)||count<0)throw new Error("INVALID_ROUND_COUNT");
 const reserved=new Set(historicalCancelledSequences.filter(sequence=>
  Number.isSafeInteger(sequence)&&sequence>0));
 const result:number[]=[];
 for(let sequence=1;result.length<count;sequence+=1){
  if(!reserved.has(sequence))result.push(sequence);
 }
 return result;
}
