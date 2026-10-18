type Question={id:string;options:readonly {id:string}[]};
/** Show only learner selections, never unpublished correct-option flags. */
export function learnerQuizReviewRows(
 questions:readonly Question[],answers:Readonly<Record<string,readonly string[]>>,
):{questionId:string;selectedCount:number;answered:boolean}[]{
 return questions.map(question=>{
  const permitted=new Set(question.options.map(item=>item.id));
  // Question IDs originate with the quiz, but browser-restored answer maps
  // may inherit Object.prototype keys. Only accept explicitly saved answers.
  const selected=Object.hasOwn(answers,question.id)?answers[question.id]??[]:[];
  const valid=new Set(selected.filter(id=>permitted.has(id)));
  return {questionId:question.id,selectedCount:valid.size,answered:valid.size>0};
 });
}
