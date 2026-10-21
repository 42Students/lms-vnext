/** The learner sees grades only after the recorded due time and an explicit
 * faculty resultsPublished flag. Published quizzes may still be open after
 * that time, matching legacy grading behavior; CLOSED is not a mandatory
 * extra step. DRAFT/ARCHIVED never release answer keys. */
export function learnerQuizResultsReleased(
 quiz:{status:string;resultsPublished:boolean;dueAt:Date|null},
 nowMs:number,
):boolean{
 return (quiz.status==="PUBLISHED"||quiz.status==="CLOSED") &&
   quiz.resultsPublished===true &&
   quiz.dueAt instanceof Date &&
   Number.isFinite(quiz.dueAt.getTime()) &&
   Number.isFinite(nowMs) &&
   quiz.dueAt.getTime()<=nowMs;
}
