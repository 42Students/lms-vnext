/** Keep a confirmed POST distinct from an unsuccessful read-only refresh. */
export function learnerQuizRefreshFailureMessage(afterSubmit:boolean,cause:unknown):string {
 if(afterSubmit)return "Your quiz was submitted, but the latest attempt could not be refreshed. Open All Quizzes to verify your saved attempt.";
 return cause instanceof Error ? cause.message : "Unable to load this quiz.";
}
