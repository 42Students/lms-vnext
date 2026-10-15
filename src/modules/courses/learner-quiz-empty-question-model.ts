/** Empty quiz payloads are not a completed or missed attempt; do not
 * prompt the learner to submit an assessment with no published questions. */
export function learnerQuizEmptyQuestionMessage(count:number):string|null {
 return count===0
  ? "No quiz questions are available. You cannot start an attempt until your Faculty publishes questions."
  : null;
}
