/** Called only after the own-learner persisted history loaded successfully. */
export function learnerApplicationEmptyKind(total:number,matching:number):
  "NO_APPLICATIONS"|"FILTERED_OUT"|"HAS_RESULTS" {
 if(total===0)return "NO_APPLICATIONS";
 if(matching===0)return "FILTERED_OUT";
 return "HAS_RESULTS";
}
