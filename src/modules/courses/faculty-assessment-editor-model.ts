/** Published/closed Quiz attempt limits are locked in the persisted service. */
export function facultyAssessmentLimitEditable(kind:"QUIZ"|"ASSIGNMENT",status:string){
 return kind==="ASSIGNMENT" || status==="DRAFT";
}
export function facultyAssessmentLimitPatch(
 kind:"QUIZ"|"ASSIGNMENT",status:string,value:number,
):{maxPoints:number}|{maxAttempts:number}|Record<string,never>{
 if(kind==="ASSIGNMENT")return {maxPoints:value};
 if(status==="DRAFT")return {maxAttempts:value};
 return {};
}
