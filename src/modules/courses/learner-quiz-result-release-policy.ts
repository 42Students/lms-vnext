/** Correct answers are released only after a CLOSED quiz, its recorded due
 * time and an explicit faculty resultsPublished flag. A still-open published
 * quiz never leaks the answer key, including to learners who have not attempted it. */
export function learnerQuizResultsReleased(
 quiz:{status:string;resultsPublished:boolean;dueAt:Date|null},
 nowMs:number,
):boolean{
 return quiz.status==="CLOSED" &&
   quiz.resultsPublished===true &&
   quiz.dueAt instanceof Date &&
   Number.isFinite(quiz.dueAt.getTime()) &&
   Number.isFinite(nowMs) &&
   quiz.dueAt.getTime()<=nowMs;
}
