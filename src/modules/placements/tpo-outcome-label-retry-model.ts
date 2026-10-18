export type OutcomeLabelEntry={id?:string|null;label:string;outcome:string};

/** Exact retry recognition for TPO's ordered, custom after-college labels.
 * IDs are assigned by the server on initial Save, so an identical retry
 * with omitted IDs still represents the same persisted policy. Explicit
 * IDs must match to prevent replacing an unrelated label silently. */
export function tpoOutcomeLabelsAlreadyApplied(
 current:readonly OutcomeLabelEntry[],
 desired:readonly OutcomeLabelEntry[],
):boolean{
 return current.length===desired.length && current.every((row,index)=>{
  const wanted=desired[index];
  return wanted!==undefined && row.label===wanted.label &&
   row.outcome===wanted.outcome &&
   (wanted.id==null || wanted.id===row.id);
 });
}
