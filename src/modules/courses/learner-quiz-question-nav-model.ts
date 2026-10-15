/** Accessible question index uses actual persisted/local answer selections.
 * UI status is navigational, never a claim that an answer was graded. */
export function learnerQuizQuestionNavState(index:number,activeIndex:number,selectedOptionIds:readonly string[]){
 return {
  current:index===activeIndex,
  answered:selectedOptionIds.length>0,
  label:`Go to question ${index+1}, ${selectedOptionIds.length>0?"answered":"unanswered"}`,
 };
}
