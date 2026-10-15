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
