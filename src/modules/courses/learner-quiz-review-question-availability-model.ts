/** Previously submitted attempts must not be described as unattempted just
 * because the current published question set is temporarily unavailable. */
export function learnerQuizReviewQuestionNotice(questionCount:number,hasAttempt:boolean):string|null{
 if(questionCount>0)return null;
 return hasAttempt
  ? "Your submitted attempt remains recorded. Question details are currently unavailable."
  : "No quiz questions are available. You cannot start an attempt until your Faculty publishes questions.";
}
