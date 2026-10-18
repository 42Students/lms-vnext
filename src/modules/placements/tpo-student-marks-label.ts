/** Missing uploaded academic verification evidence is unknown, not a rejection. */
export function tpoStudentMarksVerificationLabel(value:boolean|null|undefined):
 "Verified"|"Not verified"|"Not recorded"{
 if(value==null)return "Not recorded";
 return value?"Verified":"Not verified";
}
