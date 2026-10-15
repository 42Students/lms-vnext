/** Every evidence row must be explicitly checked by the Faculty reviewer. */
export function facultyAiGradingEvidenceReviewed(
 evidence:readonly {criterionId:string}[],reviewed:readonly string[],
):boolean{
 return evidence.length>0&&evidence.every(item=>reviewed.includes(item.criterionId))&&
  new Set(reviewed).size===evidence.length;
}
export function toggleFacultyAiGradingReview(current:readonly string[],id:string):string[]{
 return current.includes(id)?current.filter(value=>value!==id):[...current,id];
}

/** An empty field is never silently converted to zero in a review receipt. */
export function facultyAiGradingDraftPoints(input:string,maximum:number):number|null{
 if(!/^(0|[1-9][0-9]*)$/.test(input))return null;
 const value=Number(input);
 return Number.isSafeInteger(value)&&value<=maximum?value:null;
}
