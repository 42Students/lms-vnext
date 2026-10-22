/** User-visible LMS status labels, never raw database enum values. */
const LABELS:Record<string,string>={
 NOT_REGISTERED:"Not registered",NEEDS_READINESS_SUPPORT:"Needs readiness support",
 READY_NOT_APPLYING:"Ready, not applying",APPLYING:"Applying",PLACED:"Placed",
 PARTICIPATION_NOT_ELIGIBLE:"Not eligible",ACADEMIC_EVIDENCE_MISSING:"Academics incomplete",
 PARTICIPATION_ELIGIBLE_EVIDENCE_PRESENT:"Academic details recorded",
 ELIGIBLE:"Eligible",INELIGIBLE:"Ineligible",UNDECIDED:"Not decided",
 NOT_SELECTED:"Not selected",SELECTED:"Selected",PENDING:"Pending",
};
function titleWords(input:string):string {const value=input.toLowerCase().replaceAll("_"," ");return value.charAt(0).toUpperCase()+value.slice(1);}
export function tpoStudentDisplayLabel(value:string):string {
 const round=/^([A-Z_ ]+) round ([1-9][0-9]*): ([A-Z_]+)$/.exec(value);
 if(round){const kind=round[1], number=round[2], result=round[3];
  if(kind===undefined||number===undefined||result===undefined)return LABELS[value]??titleWords(value);
  const outcome=LABELS[result]??titleWords(result);
  return outcome+" at "+titleWords(kind)+" (round "+number+")";
 }
 return LABELS[value]??titleWords(value);
}
