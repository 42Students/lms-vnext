export const TPO_INELIGIBLE_REASONS = [
 "Higher studies","Not interested in placements","Detained / year back",
 "Discontinued","Disciplinary","Already has a job",
] as const;
export function tpoIneligibleReason(input:string):string{
 const trimmed=input.trim();
 if(trimmed.length<3||trimmed.length>200)throw new Error("Add an ineligibility reason of at least 3 characters.");
 return trimmed;
}
