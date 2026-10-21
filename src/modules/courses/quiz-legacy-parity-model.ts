/** Attempt status and source order are import/presentation compatibility only. */
export function legacyQuizAttemptStatus(
 attempt:{submittedAt:Date;deletedAt?:Date|null;legacyDeleted?:boolean|null},
){return attempt.deletedAt||attempt.legacyDeleted?"REMOVED":"SUBMITTED";}
export function legacyQuizSequence(raw:number|null,sourceIndex:number){
 return Number.isSafeInteger(raw)&&raw!==null&&raw>=0?raw:sourceIndex;
}
export function legacyQuizQuestionType(raw:string){
 const v=raw.trim().toUpperCase().replaceAll("-","_");
 return v==="MULTIPLE_CHOICE"||v==="SINGLE_CHOICE"||v==="TRUE_FALSE"?v:null;
}
export function legacyQuizStatus(input:{status:string;legacyActive:boolean|null;legacyEnabled:boolean|null}){
 if(input.status==="ARCHIVED"||input.legacyActive===false)return "Archived";
 if(input.status==="CLOSED")return "Closed";
 if(input.status==="DRAFT"||input.legacyEnabled===false)return "Draft";
 return "Published";
}
export function legacyQuizResultsVisible(input:{status:string;resultsPublished:boolean}){
 return input.status!=="DRAFT"&&input.resultsPublished;
}
export function legacyQuizDayIst(date:Date){
 return new Intl.DateTimeFormat("en-IN",{
   timeZone:"Asia/Kolkata",day:"2-digit",month:"short",year:"numeric",
 }).format(date);
}
export function historicalQuizOptionScore(expected:readonly string[],selected:readonly string[]){
 if(new Set(expected).size!==expected.length||new Set(selected).size!==selected.length)return false;
 return expected.length===selected.length&&expected.every(id=>selected.includes(id));
}
