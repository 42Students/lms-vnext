type Question={id:string;options:readonly {id:string}[]};
/** Show only learner selections, never unpublished correct-option flags. */
export function learnerQuizReviewRows(
 questions:readonly Question[],answers:Readonly<Record<string,readonly string[]>>,
):{questionId:string;selectedCount:number;answered:boolean}[]{
 return questions.map(question=>{
  const permitted=new Set(question.options.map(item=>item.id));
  const valid=new Set((answers[question.id]??[]).filter(id=>permitted.has(id)));
  return {questionId:question.id,selectedCount:valid.size,answered:valid.size>0};
 });
}
