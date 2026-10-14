export type LearnerRoundIdentity={applicationId:string;roundId:string};
/** Never highlight a caller-selected round unless it is in the authorized own set. */
export function learnerInterviewFocusState(
  own:readonly LearnerRoundIdentity[],visible:readonly LearnerRoundIdentity[],
  selectedKey:string|null,
){
  const selected=own.find(row=>row.applicationId+":"+row.roundId===selectedKey);
  if(!selected)return {highlightedKey:null,hiddenByFilters:false};
  return {highlightedKey:selectedKey,hiddenByFilters:!visible.some(row=>
    row.applicationId===selected.applicationId&&row.roundId===selected.roundId)};
}
