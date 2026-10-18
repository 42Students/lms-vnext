/** COURSE7-RESULT-RELEASE-11.
 * One server-clock release rule for quiz answer keys, attempts, and learner
 * assessment dashboards. A stale published flag alone is never disclosure.
 * The due time is a required embargo boundary even if a quiz is closed early.
 */
export function learnerQuizResultsReleased(
 quiz:{status:string;resultsPublished:boolean;dueAt:Date|null},
 nowMs:number,
):boolean{
 return quiz.status==="CLOSED" &&
   quiz.resultsPublished === true &&
   quiz.dueAt instanceof Date &&
   Number.isFinite(quiz.dueAt.getTime()) &&
   Number.isFinite(nowMs) &&
   quiz.dueAt.getTime()<=nowMs;
}
