type Question={id:string;options:readonly {id:string}[]};
export function learnerQuizAnswerProgress(
 questions:readonly Question[],answers:Readonly<Record<string,readonly string[]>>,
):{total:number;answered:number;firstUnanswered:number|null} {
 let answered=0,firstUnanswered:number|null=null;
 questions.forEach((question,index)=>{
  const valid=new Set(question.options.map(option=>option.id));
  const isAnswered=(answers[question.id]??[]).some(id=>valid.has(id));
  if(isAnswered)answered++;
  else if(firstUnanswered===null)firstUnanswered=index;
 });
 return {total:questions.length,answered,firstUnanswered};
}
