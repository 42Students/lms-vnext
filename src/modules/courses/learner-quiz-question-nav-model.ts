/** Accessible question index uses actual persisted/local answer selections.
 * UI status is navigational, never a claim that an answer was graded. */
export function learnerQuizQuestionNavState(
 index:number,activeIndex:number,selectedOptionIds:readonly string[],
 validOptionIds:readonly string[],
){
 const valid=new Set(validOptionIds);
 const answered=selectedOptionIds.some(id=>valid.has(id));
 return {
  current:index===activeIndex,
  answered,
  label:`Go to question ${index+1}, ${answered?"answered":"unanswered"}`,
 };
}
