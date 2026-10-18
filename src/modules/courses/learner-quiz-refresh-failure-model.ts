/** Distinguish confirmed submission from failed refresh; never surface raw errors. */
export function learnerQuizRefreshFailureMessage(afterSubmit:boolean,_cause:unknown):string {
 if(afterSubmit)return "Your quiz was submitted, but the latest attempt could not be refreshed. Open All Quizzes to verify your saved attempt.";
 return "Unable to load this quiz. Please try again.";
}
